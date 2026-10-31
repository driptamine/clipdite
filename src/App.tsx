import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditorStore } from './store/editorStore';
import { frameToTimecode } from './utils/time';
import { ensureHydrated, startPersisting, saveNow } from './utils/persist';
import Menubar from './components/Menubar/Menubar';
import Toolbar from './components/Toolbar/Toolbar';
import ProjectPanel from './components/ProjectPanel/ProjectPanel';
import SourceMonitor from './components/SourceMonitor/SourceMonitor';
import ProgramMonitor from './components/ProgramMonitor/ProgramMonitor';
import Timeline from './components/Timeline/Timeline';
import EffectsPanel from './components/EffectsPanel/EffectsPanel';
import {
  App as AppRoot,
  MainContent,
  TopPanels,
  TopRight,
  BottomArea,
  BottomProject,
  BottomRight,
  TimelineArea,
  BottomSidebar,
  ResizeHandleHorizontal,
  ResizeHandleVertical,
  MonitorsRow,
  BottomAreaMobile,
  StatusBar,
  StatusItem,
  StatusDot,
} from './App.styles';

export default function App() {
  const {
    playback, togglePlay, stepFrame, setCurrentFrame,
    selectedClipIds, removeClip, setActiveTool,
  } = useEditorStore();

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const carryRef = useRef<number>(0);

  // Panel/monitor sizes live in the store so every resize is saved locally.
  const layout = useEditorStore((s) => s.layout);
  const setLayout = useEditorStore((s) => s.setLayout);
  const { topHeight, monitorsSplit, timelineSplit, bottomLeft } = layout;

  // Mobile-only: project panel starts hidden and opens on tap.
  // Desktop renders exactly as before (isMobile=false -> unchanged tree).
  const [isMobile, setIsMobile] = useState(false);
  const [mobileProjectOpen, setMobileProjectOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const showProject = !isMobile || mobileProjectOpen;

  // Timeline clock: reads fresh store state every tick (no stale closure),
  // keeps fractional frames so Space playback runs at true fps.
  useEffect(() => {
    if (!playback.isPlaying) return;
    lastTimeRef.current = performance.now();
    carryRef.current = 0;
    const tick = (now: number) => {
      // Clamp tab-switch jumps so the playhead never leaps forward.
      const delta = Math.min(Math.max(0, now - lastTimeRef.current), 250);
      lastTimeRef.current = now;
      const st = useEditorStore.getState();
      carryRef.current += (delta / 1000) * st.playback.fps;
      const whole = Math.floor(carryRef.current);
      if (whole > 0) {
        carryRef.current -= whole;
        const nextFrame = st.playback.currentFrame + whole;
        if (nextFrame >= st.playback.durationInFrames) {
          if (st.playback.loop) {
            st.setCurrentFrame(0);
          } else {
            st.setCurrentFrame(st.playback.durationInFrames);
            st.setPlayback({ isPlaying: false });
            return;
          }
        } else {
          st.setCurrentFrame(nextFrame);
        }
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [playback.isPlaying, playback.fps, playback.durationInFrames, playback.loop]);

  // Restore last session (timeline edits + media) and autosave every change.
  useEffect(() => {
    ensureHydrated().catch(() => undefined);
    const stop = startPersisting();
    return () => stop();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
      e.preventDefault();
      saveNow();
      useEditorStore.getState().markSaved();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) useEditorStore.getState().redo();
      else useEditorStore.getState().undo();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyY') {
      e.preventDefault();
      useEditorStore.getState().redo();
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        {
          const steps = e.shiftKey ? 10 : 1;
          for (let i = 0; i < steps; i++) stepFrame(-1 as const);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        {
          const steps = e.shiftKey ? 10 : 1;
          for (let i = 0; i < steps; i++) stepFrame(1 as const);
        }
        break;
      case 'Home':
        e.preventDefault();
        setCurrentFrame(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentFrame(playback.durationInFrames);
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedClipIds.length > 0) {
          e.preventDefault();
          for (const id of selectedClipIds) removeClip(id);
        }
        break;
      case 'KeyV':
        setActiveTool('selection');
        break;
      case 'KeyC':
        setActiveTool('razor');
        break;
    }
  }, [togglePlay, stepFrame, setCurrentFrame, playback.durationInFrames, selectedClipIds, removeClip, setActiveTool]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // One drag helper for every splitter: the handle's parent is the flex
  // container, so percent math always measures against the right box.
  // Pointer events (not mouse) so resizes also drag with a finger.
  const startSplitDrag = useCallback((
    e: React.PointerEvent,
    axis: 'x' | 'y',
    initial: number,
    min: number,
    max: number,
    onChange: (v: number) => void,
  ) => {
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;
    e.preventDefault();
    const startPos = axis === 'x' ? e.clientX : e.clientY;
    const size = axis === 'x' ? container.clientWidth : container.clientHeight;
    if (size <= 0) return;

    const handleMove = (moveE: PointerEvent) => {
      const pos = axis === 'x' ? moveE.clientX : moveE.clientY;
      onChange(Math.max(min, Math.min(max, initial + ((pos - startPos) / size) * 100)));
    };

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
  }, []);

  useEffect(() => {
    const handleFileDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', handleFileDrop);
    return () => {
      window.removeEventListener('dragover', (e) => e.preventDefault());
      window.removeEventListener('drop', handleFileDrop);
    };
  }, []);

  const totalClips = useEditorStore((s) => s.tracks.reduce((a, t) => a + t.clips.length, 0));
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt);
  const exportStatus = useEditorStore((s) => s.exportStatus);
  const project = useEditorStore((s) => s.project);

  return (
    <AppRoot>
      <Menubar />

      <MainContent>
        <TopPanels style={{ height: `${topHeight}%` }}>
          <TopRight style={{ width: '100%' }}>
            <div className={MonitorsRow} style={{ display: 'flex', height: '100%' }}>
              <div style={{ width: `${monitorsSplit}%`, minWidth: 0, overflow: 'hidden' }}>
                <SourceMonitor />
              </div>
              <ResizeHandleVertical
                onPointerDown={(e) => startSplitDrag(e, 'x', monitorsSplit, 20, 80, (v) => setLayout({ monitorsSplit: v }))} />
              <div style={{ width: `${100 - monitorsSplit}%`, minWidth: 0, overflow: 'hidden' }}>
                <ProgramMonitor />
              </div>
            </div>
          </TopRight>
        </TopPanels>

        <ResizeHandleHorizontal
          onPointerDown={(e) => startSplitDrag(e, 'y', topHeight, 20, 80, (v) => setLayout({ topHeight: v }))}
        />

        <BottomArea className={BottomAreaMobile} style={{ height: `${100 - topHeight}%` }}>
          {showProject && (
            <BottomProject style={{ width: `${bottomLeft}%` }}>
              <ProjectPanel />
            </BottomProject>
          )}
          {showProject && (
            <ResizeHandleVertical
              onPointerDown={(e) => startSplitDrag(e, 'x', bottomLeft, 10, 40, (v) => setLayout({ bottomLeft: v }))} />
          )}
          <Toolbar
            showProjectToggle={isMobile}
            projectOpen={mobileProjectOpen}
            onToggleProject={() => setMobileProjectOpen((v) => !v)}
          />
          <BottomRight>
            <TimelineArea style={{ width: `${timelineSplit}%` }}>
              <Timeline />
            </TimelineArea>
            <ResizeHandleVertical
              onPointerDown={(e) => startSplitDrag(e, 'x', timelineSplit, 25, 85, (v) => setLayout({ timelineSplit: v }))} />
            <BottomSidebar style={{ width: `${100 - timelineSplit}%` }}>
              <EffectsPanel />
            </BottomSidebar>
          </BottomRight>
        </BottomArea>
      </MainContent>

      <StatusBar>
        <StatusItem>
          <StatusDot />
          {lastSavedAt
            ? `Saved locally ${new Date(lastSavedAt).toLocaleTimeString()}`
            : 'Ready'}
        </StatusItem>
        {exportStatus.phase !== 'idle' && (
          <StatusItem>
            {exportStatus.phase === 'working'
              ? `Exporting… ${exportStatus.progress}%`
              : exportStatus.message}
          </StatusItem>
        )}
        <StatusItem>
          {frameToTimecode(playback.currentFrame, playback.fps)}
        </StatusItem>
        <StatusItem>
          {playback.fps}fps
        </StatusItem>
        <StatusItem>
          {totalClips} clips on timeline
        </StatusItem>
        <StatusItem>
          {project.name}: {project.width}×{project.height}
        </StatusItem>
      </StatusBar>
    </AppRoot>
  );
}
