import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditorStore } from './store/editorStore';
import { frameToTimecode } from './utils/time';
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
  TopLeft,
  TopRight,
  BottomArea,
  TimelineArea,
  BottomSidebar,
  ResizeHandleHorizontal,
  ResizeHandleVertical,
  StatusBar,
  StatusItem,
  StatusDot,
} from './App.styles';

export default function App() {
  const {
    playback, togglePlay, stepFrame, setCurrentFrame,
    selectedClipId, removeClip,
  } = useEditorStore();

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const topHalfRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomHalfRef = useRef<HTMLDivElement>(null);
  const [topHeight, setTopHeight] = useState(55);
  const [leftWidth, setLeftWidth] = useState(35);
  const resizingRef = useRef<'horizontal' | 'vertical' | null>(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (playback.isPlaying) {
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        const framesToAdvance = Math.round((delta / 1000) * playback.fps);
        if (framesToAdvance > 0) {
          const nextFrame = playback.currentFrame + framesToAdvance;
          if (nextFrame >= playback.durationInFrames) {
            if (playback.loop) {
              setCurrentFrame(0);
            } else {
              setCurrentFrame(playback.durationInFrames);
              useEditorStore.getState().setPlayback({ isPlaying: false });
            }
          } else {
            setCurrentFrame(nextFrame);
          }
        }
        animationRef.current = requestAnimationFrame(tick);
      };
      animationRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [playback.isPlaying, playback.fps, playback.durationInFrames, playback.loop, setCurrentFrame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
        if (selectedClipId) {
          e.preventDefault();
          removeClip(selectedClipId);
        }
        break;
    }
  }, [togglePlay, stepFrame, setCurrentFrame, playback.durationInFrames, selectedClipId, removeClip]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
    resizingRef.current = 'horizontal';
    startYRef.current = e.clientY;
    startValRef.current = topHeight;

    const handleMove = (moveE: MouseEvent) => {
      const container = topHalfRef.current?.parentElement;
      if (!container) return;
      const containerHeight = container.clientHeight;
      const delta = moveE.clientY - startYRef.current;
      const newPercent = Math.max(20, Math.min(80, startValRef.current + (delta / containerHeight) * 100));
      setTopHeight(newPercent);
    };

    const handleUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [topHeight]);

  const handleHorizontalResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    resizingRef.current = 'vertical';
    startXRef.current = e.clientX;
    startValRef.current = side === 'left' ? leftWidth : 100 - leftWidth;

    const handleMove = (moveE: MouseEvent) => {
      const container = side === 'left'
        ? topHalfRef.current
        : topRightRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const delta = moveE.clientX - startXRef.current;
      const newPercent = Math.max(15, Math.min(70, startValRef.current + (delta / containerWidth) * 100));
      if (side === 'left') setLeftWidth(newPercent);
    };

    const handleUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [leftWidth]);

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

  return (
    <AppRoot>
      <Menubar />
      <Toolbar />

      <MainContent>
        <TopPanels ref={topHalfRef} style={{ height: `${topHeight}%` }}>
          <TopLeft ref={topHalfRef as any} style={{ width: `${leftWidth}%` }}>
            <ProjectPanel />
          </TopLeft>
          <ResizeHandleVertical style={{ width: 4 }}
            onMouseDown={(e) => handleHorizontalResizeStart(e, 'left')} />
          <TopRight ref={topRightRef} style={{ width: `${100 - leftWidth}%` }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flex: 1 }}>
                <SourceMonitor />
              </div>
              <ResizeHandleVertical
                onMouseDown={(e) => e.preventDefault()} />
              <div style={{ flex: 1 }}>
                <ProgramMonitor />
              </div>
            </div>
          </TopRight>
        </TopPanels>

        <ResizeHandleHorizontal
          onMouseDown={handleVerticalResizeStart}
        />

        <BottomArea ref={bottomHalfRef} style={{ height: `${100 - topHeight}%` }}>
          <TimelineArea>
            <Timeline />
          </TimelineArea>
          <ResizeHandleVertical
            onMouseDown={(e) => e.preventDefault()} />
          <BottomSidebar>
            <EffectsPanel />
          </BottomSidebar>
        </BottomArea>
      </MainContent>

      <StatusBar>
        <StatusItem>
          <StatusDot />
          Ready
        </StatusItem>
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
          Project: 1920×1080
        </StatusItem>
      </StatusBar>
    </AppRoot>
  );
}
