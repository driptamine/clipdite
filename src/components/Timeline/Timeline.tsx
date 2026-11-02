import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore, DEFAULT_TRACK_HEIGHT } from '../../store/editorStore';
import { frameToTimecode } from '../../utils/time';
import { displayOrder, findLinkedAudioTrack } from '../../utils/tracks';
import { probeMediaFile } from '../../utils/mediaProbe';
import { loadFileBlob } from '../../utils/mediaStorage';
import ClipFilmstrip from './ClipFilmstrip';
import ClipWavestrip from './ClipWavestrip';
import {
  trackContentClassName,
  Panel,
  PanelHeader,
  PanelTitle,
  PanelActions,
  PanelActionBtn,
  TimelineBody,
  TrackHeaders,
  TrackHeadersSpacer,
  TrackHeadersHandle,
  TrackHeightHandle,
  TrackHeader,
  TrackHeaderAudio,
  TrackHeaderDropTarget,
  TrackName,
  TrackBtn,
  TrackBtnActive,
  AddTrackBtn,
  TimelineTracksContainer,
  TimeRuler,
  MobileRuler,
  TimeMarker,
  RulerTicks,
  TracksArea,
  TrackRow,
  TrackRowAudio,
  TrackContent,
  TrackRowDropTarget,
  Clip,
  ClipSelected,
  MarqueeBox,
  ClipVideo,
  ClipAudio,
  ClipInner,
  ClipName,
  ClipTitle,
  ClipHandle,
  ClipHandleActive,
  ClipHandleLeft,
  ClipHandleRight,
  Playhead,
  PlayheadTop,
  Skimmer,
  SkimmerTimeTag,
  SilenceTrack,
  ClipDropGhost,
  DropIndicatorLine,
  ClipIcon,
  PanelActionBtnActive,
  SnapGuide,
} from './Timeline.styles';

interface DropIndicator {
  trackIndex: number;
  frame: number;
  leftPx: number;
  widthPx: number;
  mediaType: 'video' | 'audio' | 'image';
  mediaName: string;
  mediaDuration: number;
}

export default function Timeline() {
  const {
    tracks, playback, zoom, selectedClipIds, mediaItems,
    activeTool, splitClip, selectClips, moveClips,
    setCurrentFrame, selectClip,
    toggleMuteTrack, toggleLockTrack, toggleVisibilityTrack,
    addTrack, addClipToTrack, setDragMediaId, setTrackHeight, trimClip,
  } = useEditorStore();

  const tracksAreaRef = useRef<HTMLDivElement>(null);
  const headersRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const innerRulerRef = useRef<HTMLDivElement>(null);

  // The headers column has no scrollbar of its own — it mirrors the tracks scroll.
  const handleTracksScroll = useCallback(() => {
    const area = tracksAreaRef.current;
    const headers = headersRef.current;
    if (area && headers) headers.scrollTop = area.scrollTop;
  }, []);

  // Headers column width, in px, saved with the rest of the layout.
  const headersWidth = useEditorStore((s) => s.layout.headersWidth);
  const startHeadersResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initial = useEditorStore.getState().layout.headersWidth;
    // Mobile: no practical lower limit — squeeze as narrow as needed.
    const minW = window.matchMedia('(max-width: 768px)').matches ? 24 : 64;
    const handleMove = (moveE: PointerEvent) => {
      useEditorStore.getState().setLayout({
        headersWidth: Math.max(minW, Math.min(320, initial + (moveE.clientX - startX))),
      });
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
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);
  // Cursor-attached preview line (Premiere-style hover indicator).
  const [hoverLeftPx, setHoverLeftPx] = useState<number | null>(null);
  const hoverRafRef = useRef<number>(0);

  useEffect(() => () => cancelAnimationFrame(hoverRafRef.current), []);

  const mediaLookup = useMemo(() => {
    const map = new Map<string, typeof mediaItems[0]>();
    for (const item of mediaItems) map.set(item.id, item);
    return map;
  }, [mediaItems]);

  // V3/V2/V1 on top, then A1/A2 — array position means nothing.
  const orderedTracks = useMemo(() => displayOrder(tracks), [tracks]);

  const framesPerPixel = useMemo(() => {
    return Math.max(1, 4 / zoom);
  }, [zoom]);

  const totalFrames = playback.durationInFrames;

  const rulerTicks = useMemo(() => {
    // Labeled ticks must never overlap: pick the smallest "nice" time
    // interval that still leaves at least ~64px between labels. The old
    // zoom-threshold table let labels collide at low zoom-out levels.
    const niceSeconds = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
    const minLabelFrames = 64 * framesPerPixel;
    const labelStep =
      (niceSeconds.find((s) => s * playback.fps >= minLabelFrames) ?? 3600) *
      playback.fps;

    const labels: { frame: number; label: string }[] = [];
    for (let f = 0; f <= totalFrames; f += labelStep) {
      labels.push({
        frame: f,
        label: frameToTimecode(f, playback.fps).substring(3),
      });
    }

    // Tick lines are PAINTED with a repeating gradient, not placed as DOM
    // boxes: fractional-period repeats stay mathematically even, while
    // individually laid-out boxes snap to whole CSS px and jitter
    // (e.g. an 18.75px step renders as alternating 18/19px gaps).
    // 4 minor ticks per labeled interval + a brighter line every minute.
    const minorPx = labelStep / (4 * framesPerPixel);
    const majorPx = (60 * playback.fps) / framesPerPixel;
    return { labels, minorPx, majorPx };
  }, [totalFrames, playback.fps, framesPerPixel]);

  const playheadLeft = playback.currentFrame / framesPerPixel;
  const totalWidth = totalFrames / framesPerPixel;

  // Tick-line layers painted as repeating gradients (see rulerTicks memo).
  const renderTickLayers = () => {
    const { minorPx, majorPx } = rulerTicks;
    return (
      <>
        {minorPx >= 2 && (
          <RulerTicks
            style={{
              height: 8,
              backgroundImage: `repeating-linear-gradient(to right, var(--border-color) 0, var(--border-color) 1px, transparent 1px, transparent ${minorPx}px)`,
            }}
          />
        )}
        {majorPx >= 3 && (
          <RulerTicks
            style={{
              height: 12,
              backgroundImage: `repeating-linear-gradient(to right, var(--text-muted) 0, var(--text-muted) 1px, transparent 1px, transparent ${majorPx}px)`,
            }}
          />
        )}
      </>
    );
  };

  const getFrameFromX = useCallback((clientX: number, trackContentEl: HTMLElement | null) => {
    if (!trackContentEl) return 0;
    const rect = trackContentEl.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.round(x * framesPerPixel));
  }, [framesPerPixel]);

  const frameFromClientX = useCallback((clientX: number, containerEl: HTMLElement | null) => {
    if (!containerEl) return 0;
    const rect = containerEl.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.round(x * framesPerPixel));
  }, [framesPerPixel]);

  // ---- Edge snapping ("magnet") ------------------------------------------
  // Moving/trimming visuals magnetise to every clip edge, the playhead and
  // the timeline start. Toggleable from the header button; holding Shift
  // bypasses it for a single drag.
  const [snapEnabled, setSnapEnabled] = useState(true);
  const skimmer = useEditorStore((s) => s.skimmer);
  const setSkimmer = useEditorStore((s) => s.setSkimmer);
  const [snapGuideFrame, setSnapGuideFrame] = useState<number | null>(null);
  const SNAP_THRESHOLD_PX = 8;

  // In-flight HTML5 drag of timeline clips. dataTransfer is unreadable
  // during dragover, so the payload is mirrored here to drive preview.
  const moveDragRef = useRef<{ ids: string[]; draggedId: string; grabOffset: number } | null>(null);
  const clearDragVisuals = useCallback(() => {
    setDropIndicator(null);
    setHoveredTrackIndex(null);
    setSnapGuideFrame(null);
  }, []);

  const snapFramesFor = useCallback((excludeClipIds?: readonly string[]): number[] => {
    const st = useEditorStore.getState();
    const excluded = excludeClipIds ? new Set(excludeClipIds) : null;
    const points = new Set<number>([0, st.playback.currentFrame]);
    for (const track of st.tracks) {
      if (track.locked) continue;
      for (const clip of track.clips) {
        if (excluded?.has(clip.id)) continue;
        points.add(clip.startFrame);
        points.add(clip.startFrame + clip.durationInFrames);
      }
    }
    return [...points];
  }, []);

  const snapDeltaFor = useCallback((edges: number[], excludeClipIds?: readonly string[]): { delta: number; frame: number } | null => {
    const threshold = Math.max(1, SNAP_THRESHOLD_PX * framesPerPixel);
    const points = snapFramesFor(excludeClipIds);
    let best: { delta: number; frame: number } | null = null;
    for (const edge of edges) {
      for (const point of points) {
        const delta = point - edge;
        if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) {
          best = { delta, frame: point };
        }
      }
    }
    return best;
  }, [framesPerPixel, snapFramesFor]);

  // Fixed current just for trim callbacks (their deps never re-create the
  // listener while a trim drag is in progress).
  const snapEnabledRef = useRef(snapEnabled);
  useEffect(() => {
    snapEnabledRef.current = snapEnabled;
  }, [snapEnabled]);

  // Clicking (or tapping) anywhere on the timeline — empty track space,
  // a clip, or the time ruler — moves the playhead there.
  const seekToClientX = useCallback((clientX: number, containerEl: HTMLElement | null) => {
    setCurrentFrame(frameFromClientX(clientX, containerEl));
  }, [frameFromClientX, setCurrentFrame]);

  // Marquee (rubber-band) selection with the Selection tool: drag a rectangle
  // over the tracks to select every clip it touches, then drag them as a group.
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  // Viewport-space corners of the drawn box, for hit-testing clips on mouseup.
  const marqueeBoxRef = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const marqueeDrawnRef = useRef(false);

  const handleMarqueeStart = useCallback((e: React.PointerEvent) => {
    // Mouse only: fingers scroll the tracks instead of drawing a marquee.
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (useEditorStore.getState().activeTool !== 'selection') return;
    // Clips handle their own press (select / razor / drag) — marquee is for empty space.
    if ((e.target as HTMLElement).closest('[data-clip-id]')) return;
    const area = tracksAreaRef.current;
    if (!area) return;
    e.preventDefault();
    const rect = area.getBoundingClientRect();
    marqueeStartRef.current = {
      x: e.clientX - rect.left + area.scrollLeft,
      y: e.clientY - rect.top + area.scrollTop,
    };
    marqueeBoxRef.current = null;
    marqueeDrawnRef.current = false;

    const handleMove = (moveE: PointerEvent) => {
      const start = marqueeStartRef.current;
      if (!start) return;
      const box = area.getBoundingClientRect();
      const x = moveE.clientX - box.left + area.scrollLeft;
      const y = moveE.clientY - box.top + area.scrollTop;
      if (Math.abs(x - start.x) + Math.abs(y - start.y) < 6) return;
      marqueeDrawnRef.current = true;
      marqueeBoxRef.current = {
        x0: box.left + Math.min(start.x, x) - area.scrollLeft,
        y0: box.top + Math.min(start.y, y) - area.scrollTop,
        x1: box.left + Math.max(start.x, x) - area.scrollLeft,
        y1: box.top + Math.max(start.y, y) - area.scrollTop,
      };
      setMarquee({
        x: Math.min(start.x, x),
        y: Math.min(start.y, y),
        w: Math.abs(x - start.x),
        h: Math.abs(y - start.y),
      });
    };

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
      marqueeStartRef.current = null;
      const m = marqueeBoxRef.current;
      marqueeBoxRef.current = null;
      if (marqueeDrawnRef.current && m) {
        const found: string[] = [];
        area.querySelectorAll('[data-clip-id]').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.left < m.x1 && r.right > m.x0 && r.top < m.y1 && r.bottom > m.y0) {
            const id = (el as HTMLElement).dataset.clipId;
            if (id) found.push(id);
          }
        });
        selectClips(found);
      }
      setMarquee(null);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
  }, [selectClips]);

  // Two-finger pinch zoom on the tracks (mobile). Pure observer: no
  // preventDefault, so native scroll keeps working alongside.
  const pinchPointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchBase = useRef<{ dist: number; zoom: number } | null>(null);
  const pinchMovedRef = useRef(false);

  const pinchDist = (m: Map<number, { x: number; y: number }>) => {
    const [a, b] = [...m.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handlePinchDown = useCallback((e: React.PointerEvent) => {
    const m = pinchPointers.current;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (m.size === 2) {
      pinchBase.current = { dist: Math.max(1, pinchDist(m)), zoom: useEditorStore.getState().zoom };
    }
  }, []);

  const handlePinchMove = useCallback((e: React.PointerEvent) => {
    const m = pinchPointers.current;
    if (!m.has(e.pointerId)) return;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const base = pinchBase.current;
    if (m.size === 2 && base) {
      pinchMovedRef.current = true;
      const ratio = pinchDist(m) / base.dist;
      if (Number.isFinite(ratio) && ratio > 0) {
        useEditorStore.getState().setZoom(base.zoom * ratio);
      }
    }
  }, []);

  const handlePinchUp = useCallback((e: React.PointerEvent) => {
    pinchPointers.current.delete(e.pointerId);
    if (pinchPointers.current.size < 2) pinchBase.current = null;
  }, []);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // A marquee drag or a pinch zoom ends with a click — don't seek on those.
    if (marqueeDrawnRef.current) {
      marqueeDrawnRef.current = false;
      return;
    }
    if (pinchMovedRef.current) {
      pinchMovedRef.current = false;
      return;
    }
    seekToClientX(e.clientX, tracksAreaRef.current);
  }, [seekToClientX]);

  // Track-row heights and clip edge trims share one drag protocol.
  const trimmingRef = useRef(false);
  const suppressSeekRef = useRef(false);
  // Which clip edge is held down right now, so the grip lights up.
  const [activeTrim, setActiveTrim] = useState<{ id: string; side: 'in' | 'out' } | null>(null);

  const startTrackResize = useCallback((e: React.PointerEvent, trackIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const initial = useEditorStore.getState().tracks.find((t) => t.index === trackIndex)?.height
      ?? DEFAULT_TRACK_HEIGHT;
    const handleMove = (moveE: MouseEvent) => {
      setTrackHeight(
        trackIndex,
        Math.max(28, Math.min(160, initial + (moveE.clientY - startY))),
      );
    };
    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
  }, [setTrackHeight]);

  // Drag a clip's left/right edge to trim it (delta applied incrementally).
  // Trim edges snap to other clip edges / the playhead while the magnet
  // toggle is on (hold Shift to bypass for one drag).
  const startClipTrim = useCallback((e: React.PointerEvent, clipId: string, side: 'in' | 'out') => {
    if (useEditorStore.getState().activeTool !== 'selection') return;
    e.preventDefault();
    e.stopPropagation();
    trimmingRef.current = true;
    setActiveTrim({ id: clipId, side });
    const startX = e.clientX;
    const dragged = useEditorStore.getState().tracks.flatMap((t) => t.clips).find((c) => c.id === clipId);
    const originalEdge = dragged
      ? (side === 'in' ? dragged.startFrame : dragged.startFrame + dragged.durationInFrames)
      : 0;
    let applied = 0;
    let guideAt: number | null = null;
    // Edge of the clip as it actually sits in the store right now. After a
    // clamped trim it can lag behind `applied`; re-syncing keeps the edge
    // from feeling stuck when the finger comes back the other way.
    const currentEdge = () => {
      const clips = useEditorStore.getState().tracks.flatMap((t) => t.clips);
      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return originalEdge;
      return side === 'in' ? clip.startFrame : clip.startFrame + clip.durationInFrames;
    };
    const setTrimTotal = (total: number, guideFrame: number | null) => {
      guideAt = guideFrame;
      const diff = total - applied;
      if (diff === 0) return;
      trimClip(clipId, side, diff);
      applied = currentEdge() - originalEdge;
      setSnapGuideFrame(guideFrame);
    };

    // Auto-scroll: dragging an edge to the side of the viewport keeps
    // trimming instead of stopping dead at the screen border (a phone
    // screen runs out of room fast). The scrolled distance is folded into
    // the pointer delta so the edge keeps tracking the finger.
    const area = tracksAreaRef.current;
    let pointerX = e.clientX;
    let shiftHeld = false;
    let scrolled = 0;
    let scrollRaf = 0;
    const scrollTick = () => {
      scrollRaf = 0;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const zone = Math.min(72, rect.width * 0.2);
      let step = 0;
      if (pointerX < rect.left + zone) {
        step = -Math.ceil(14 * Math.min(1, (rect.left + zone - pointerX) / zone));
      } else if (pointerX > rect.right - zone) {
        step = Math.ceil(14 * Math.min(1, (pointerX - (rect.right - zone)) / zone));
      }
      if (step === 0) return;
      const before = area.scrollLeft;
      area.scrollLeft = before + step;
      const moved = area.scrollLeft - before;
      if (moved === 0) return;
      scrolled += moved;
      applyPointer();
      scrollRaf = requestAnimationFrame(scrollTick);
    };
    const queueAutoScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(scrollTick);
    };

    const applyPointer = () => {
      const raw = originalEdge + Math.round((pointerX - startX + scrolled) * framesPerPixel);
      if (snapEnabledRef.current && !shiftHeld) {
        const snapped = snapDeltaFor([raw], [clipId]);
        if (snapped && snapped.delta !== 0) {
          setTrimTotal(raw + snapped.delta, snapped.frame);
          return;
        }
      }
      // Unsnapped: the guide still follows the trimming edge.
      setTrimTotal(raw, Math.max(0, raw));
    };

    const handleMove = (moveE: PointerEvent) => {
      pointerX = moveE.clientX;
      shiftHeld = moveE.shiftKey;
      applyPointer();
      queueAutoScroll();
    };
    const handleUp = () => {
      cancelAnimationFrame(scrollRaf);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
      trimmingRef.current = false;
      setActiveTrim(null);
      suppressSeekRef.current = true;
      if (guideAt !== null) setSnapGuideFrame(null);
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
  }, [framesPerPixel, trimClip, snapDeltaFor]);

  // Follows the cursor over the ruler/tracks; throttled with rAF so
  // hovering doesn't re-render the timeline more than once per frame.
  // When the skimmer is enabled, the hovered frame also lands in the
  // store so the Program monitor can preview it without moving the
  // playhead (like the FCP skimmer).
  const handleHoverMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left + el.scrollLeft;
    cancelAnimationFrame(hoverRafRef.current);
    hoverRafRef.current = requestAnimationFrame(() => {
      setHoverLeftPx(x);
      const store = useEditorStore.getState();
      if (store.skimmer) {
        store.setSkimmerFrame(Math.max(0, Math.round(x * Math.max(1, 4 / store.zoom))));
      }
    });
  }, []);

  const handleHoverLeave = useCallback(() => {
    cancelAnimationFrame(hoverRafRef.current);
    setHoverLeftPx(null);
    const store = useEditorStore.getState();
    if (store.skimmer) store.setSkimmerFrame(null);
  }, []);

  const handleClipClick = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    if (marqueeDrawnRef.current) {
      marqueeDrawnRef.current = false;
      return;
    }
    if (pinchMovedRef.current) {
      pinchMovedRef.current = false;
      return;
    }
    // A finished edge trim selects but does not seek.
    if (suppressSeekRef.current) {
      suppressSeekRef.current = false;
      selectClip(clipId);
      return;
    }
    // Razor: cut the clip under the cursor instead of seeking/selecting.
    if (useEditorStore.getState().activeTool === 'razor') {
      const trackEl = (e.currentTarget as HTMLElement).parentElement;
      const frame = frameFromClientX(e.clientX, trackEl);
      const trackIndex = Number(trackEl?.dataset.trackIndex);
      splitClip(clipId, frame);
      // Select the right-hand part produced by the cut.
      const st = useEditorStore.getState();
      const right = st.tracks
        .find((t) => t.index === trackIndex)
        ?.clips.find((c) => c.id !== clipId && c.startFrame === frame);
      selectClip(right ? right.id : clipId);
      return;
    }
    // Linked pair selects together (video stays primary).
    const clicked = useEditorStore.getState().tracks.flatMap((t) => t.clips).find((c) => c.id === clipId);
    if (clicked?.linkedClipId) selectClips([clicked.linkedClipId, clipId]);
    else selectClip(clipId);
    // A clip swallows the bubbled TracksArea click, so seek explicitly.
    seekToClientX(e.clientX, (e.currentTarget as HTMLElement).parentElement);
  }, [selectClip, selectClips, seekToClientX, frameFromClientX, splitClip]);

  const handleTrackDragOver = useCallback((e: React.DragEvent, trackIndex: number) => {
    const hasMedia = [...e.dataTransfer.types].includes('application/clipdite-media');
    const moveDrag = moveDragRef.current;
    if (!hasMedia && !moveDrag) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = hasMedia ? 'copy' : 'move';

    // Timeline-clip move: a ghost lands where the dragged clip will drop,
    // its leading edge is the follow line that magnetises on snap.
    if (!hasMedia && moveDrag) {
      const dragged = useEditorStore.getState().tracks.flatMap((t) => t.clips)
        .find((c) => c.id === moveDrag.draggedId);
      if (!dragged) return;
      const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
      if (!trackContent) return;

      const frameRaw = getFrameFromX(e.clientX, trackContent);
      let dx = frameRaw - moveDrag.grabOffset - dragged.startFrame;
      let guideFrame: number | null = null;
      if (snapEnabledRef.current && !e.shiftKey) {
        const snapped = snapDeltaFor([
          dragged.startFrame + dx,
          dragged.startFrame + dragged.durationInFrames + dx,
        ], moveDrag.ids);
        if (snapped) {
          dx += snapped.delta;
          guideFrame = snapped.frame;
        }
      }
      const previewStart = dragged.startFrame + dx;
      const media = mediaLookup.get(dragged.mediaId);
      setHoveredTrackIndex(trackIndex);
      setSnapGuideFrame(guideFrame);
      setDropIndicator({
        trackIndex,
        frame: previewStart,
        leftPx: previewStart / framesPerPixel,
        widthPx: Math.max(20, dragged.durationInFrames / framesPerPixel),
        mediaType: media?.type === 'audio' ? 'audio' : media?.type === 'image' ? 'image' : 'video',
        mediaName: media?.name ?? '',
        mediaDuration: media?.duration ?? 0,
      });
      return;
    }

    const track = tracks.find((t) => t.index === trackIndex);
    if (!track || track.locked) return;

    const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
    if (!trackContent) return;

    let frame = getFrameFromX(e.clientX, trackContent);
    const currentDragMediaId = useEditorStore.getState().dragMediaId;
    if (!currentDragMediaId) return;

    const media = mediaLookup.get(currentDragMediaId);
    if (!media) return;

    const isMediaVideo = media.type === 'video' || media.type === 'image';
    const isMediaAudio = media.type === 'audio';
    const isTrackVideo = track.type === 'video';
    const isTrackAudio = track.type === 'audio';

    if ((isMediaVideo && isTrackAudio) || (isMediaAudio && isTrackVideo)) {
      const compatibleTrack = tracks.find(
        (t) => !t.locked && t.type === (isMediaVideo ? 'video' : 'audio')
      );
      if (compatibleTrack) {
        setHoveredTrackIndex(compatibleTrack.index);
      } else {
        setHoveredTrackIndex(null);
      }
      setDropIndicator(null);
      setSnapGuideFrame(null);
      return;
    }

    const durationFrames = Math.round(media.duration * playback.fps);

    // Magnet: the ghost's left/right edge snaps to existing edges, the
    // playhead or frame 0 (Shift bypasses).
    let guideFrame: number | null = null;
    if (snapEnabledRef.current && !e.shiftKey) {
      const snapped = snapDeltaFor([frame, frame + durationFrames]);
      if (snapped) {
        frame = Math.max(0, frame + snapped.delta);
        guideFrame = snapped.frame;
      }
    }
    setSnapGuideFrame(guideFrame);

    setHoveredTrackIndex(trackIndex);
    setDropIndicator({
      trackIndex,
      frame,
      leftPx: (frame / framesPerPixel),
      widthPx: Math.max(20, durationFrames / framesPerPixel),
      mediaType: media.type,
      mediaName: media.name,
      mediaDuration: media.duration,
    });
  }, [tracks, framesPerPixel, playback.fps, mediaLookup, getFrameFromX, snapDeltaFor]);

  const handleTrackDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null;
    const current = e.currentTarget as HTMLElement;
    if (related && current.contains(related)) return;
    clearDragVisuals();
  }, [clearDragVisuals]);

  const handleClipDragStartOnTimeline = useCallback((e: React.DragEvent, clipId: string) => {
    // An edge trim is not a move — cancel the HTML5 drag.
    moveDragRef.current = null;
    if (trimmingRef.current) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    // Drag the whole marquee selection when the grabbed clip is part of it.
    const st = useEditorStore.getState();
    const ids = st.selectedClipIds.includes(clipId) && st.selectedClipIds.length > 1
      ? st.selectedClipIds
      : [clipId];
    // Grab offset: where inside the clip the user took hold of it (in frames),
    // so the drop lands the clip under the cursor instead of snapping its start there.
    const dragged = st.tracks.flatMap((t) => t.clips).find((c) => c.id === clipId);
    const trackContent = (e.currentTarget as HTMLElement).parentElement;
    const grabOffset = dragged
      ? Math.max(0, getFrameFromX(e.clientX, trackContent) - dragged.startFrame)
      : 0;
    e.dataTransfer.setData('application/clipdite-timeline-clips', JSON.stringify({ ids, draggedId: clipId, grabOffset }));
    moveDragRef.current = { ids, draggedId: clipId, grabOffset };
    if (!st.selectedClipIds.includes(clipId)) selectClip(clipId);
  }, [selectClip, getFrameFromX]);

  const handleClipDropOnTimeline = useCallback((e: React.DragEvent, targetTrackIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    moveDragRef.current = null;
    clearDragVisuals();

    const groupData = e.dataTransfer.getData('application/clipdite-timeline-clips');
    if (groupData) {
      try {
        const { ids, draggedId, grabOffset } = JSON.parse(groupData) as { ids: string[]; draggedId: string; grabOffset?: number };
        const st = useEditorStore.getState();
        const dragged = st.tracks.flatMap((t) => t.clips).find((c) => c.id === draggedId);
        if (dragged && ids.length > 0) {
          const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
          const frame = getFrameFromX(e.clientX, trackContent);
          let dx = frame - (grabOffset ?? 0) - dragged.startFrame;
          // Magnet: the dragged clip's edges snap to neighbour edges, the
          // playhead or frame 0 (its own edges are excluded; Shift bypasses).
          if (snapEnabledRef.current && !e.shiftKey) {
            const snapped = snapDeltaFor([
              dragged.startFrame + dx,
              dragged.startFrame + dragged.durationInFrames + dx,
            ], ids);
            if (snapped) dx += snapped.delta;
          }
          moveClips(ids, dx, targetTrackIndex - dragged.trackIndex);
          setSnapGuideFrame(null);
          return;
        }
      } catch {
        // Malformed payload: fall through to media drop below.
      }
    }

    const mediaId = e.dataTransfer.getData('application/clipdite-media');
    if (!mediaId) return;
    const media = mediaLookup.get(mediaId);
    if (!media) return;

    const track = tracks.find((t) => t.index === targetTrackIndex);
    if (!track || track.locked) return;

    // Media must land on a matching track: an MP3 dropped over a video
    // row belongs on an audio track (and vice versa). Premiere-style:
    // redirect to the first unlocked compatible track, creating one
    // when the project has none, instead of stranding the clip.
    const wantAudioTrack = media.type === 'audio';
    let dropTrack: typeof track | null = track;
    if ((wantAudioTrack && track.type !== 'audio') || (!wantAudioTrack && track.type !== 'video')) {
      const needType = wantAudioTrack ? 'audio' : 'video';
      const st = useEditorStore.getState();
      dropTrack = st.tracks.find((t) => !t.locked && t.type === needType) ?? null;
      if (!dropTrack) {
        // All matching tracks are locked (or none exist) — add a fresh one.
        addTrack(needType);
        const after = useEditorStore.getState().tracks.filter((t) => t.type === needType && !t.locked);
        dropTrack = after.sort((a, b) => b.index - a.index)[0] ?? null;
      }
      if (!dropTrack) return;
    }
    // Snapshot for the async pair-drop below (narrowing a `let` does not
    // survive closure capture).
    const landingTrack = dropTrack;

    const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
    let frame = getFrameFromX(e.clientX, trackContent);
    const durationFrames = Math.round(media.duration * playback.fps);

    // Same magnet rules for the real drop as for the ghost preview.
    if (snapEnabledRef.current && !e.shiftKey) {
      const snapped = snapDeltaFor([frame, frame + durationFrames]);
      if (snapped) frame = Math.max(0, frame + snapped.delta);
    }

    // Premiere-style: a video with sound lands as a linked pair —
    // picture on the video track, sound on the audio track below.
    if (media.type === 'video' && landingTrack.type === 'video') {
      const videoClip = {
        mediaId: media.id,
        trackIndex: landingTrack.index,
        startFrame: frame,
        durationInFrames: durationFrames,
        inPoint: 0,
        outPoint: durationFrames,
        effects: [],
        opacity: 100,
        volume: 0,
      };
      const drop = async () => {
        let hasAudio = media.hasAudio;
        if (hasAudio === undefined) {
          try {
            const blob = await loadFileBlob(media.id);
            if (blob) {
              const probed = await probeMediaFile(blob);
              hasAudio = probed.hasAudio;
              useEditorStore.getState().setMediaHasAudio(media.id, hasAudio);
            } else {
              hasAudio = false;
            }
          } catch {
            hasAudio = false;
          }
        }
        if (hasAudio) {
          // Numbered mate (V2 -> A2), else first unlocked audio track.
          const audioTrack = findLinkedAudioTrack(useEditorStore.getState().tracks, landingTrack);
          if (audioTrack) {
            useEditorStore.getState().addClipPair(videoClip, { ...videoClip, trackIndex: audioTrack.index });
            setDragMediaId(null);
            return;
          }
        }
        addClipToTrack(videoClip);
        setDragMediaId(null);
      };
      void drop();
      return;
    }

    addClipToTrack({
      mediaId: media.id,
      trackIndex: landingTrack.index,
      startFrame: frame,
      durationInFrames: durationFrames,
      inPoint: 0,
      outPoint: durationFrames,
      effects: [],
      opacity: 100,
      volume: 0,
    });

    setDragMediaId(null);
  }, [mediaLookup, tracks, playback.fps, addClipToTrack, addTrack, moveClips, setDragMediaId, getFrameFromX, snapDeltaFor, clearDragVisuals]);

  return (
    <Panel data-timeline-panel>
      <PanelHeader>
        <PanelTitle>Timeline</PanelTitle>
        <PanelActions>
          <PanelActionBtn
            title="Add Video Track"
            onClick={() => addTrack('video')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </PanelActionBtn>
          <PanelActionBtn
            className={cx(skimmer && PanelActionBtnActive)}
            title={skimmer ? 'Skimmer on (hover previews frames)' : 'Skimmer off'}
            onClick={() => setSkimmer(!skimmer)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16M12 4 9 7m3-3 3 3" />
              <path d="M8 20h8" />
            </svg>
          </PanelActionBtn>
          <PanelActionBtn
            className={cx(snapEnabled && PanelActionBtnActive)}
            title={snapEnabled ? 'Snap on (Shift bypasses during drag)' : 'Snap off'}
            onClick={() => setSnapEnabled((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15" />
              <path d="m5 8 4 4" />
              <path d="m12 15 4 4" />
            </svg>
          </PanelActionBtn>
        </PanelActions>
      </PanelHeader>

      <TimelineBody>
        <TrackHeaders ref={headersRef} style={{ width: `${headersWidth}px` }}>
          <TrackHeadersSpacer />
          {orderedTracks.map((track) => (
            <TrackHeader
              key={track.id}
              className={cx(
                track.type === 'audio' && TrackHeaderAudio,
                hoveredTrackIndex === track.index && TrackHeaderDropTarget,
              )}
              style={{ height: `${track.height ?? DEFAULT_TRACK_HEIGHT}px` }}
            >
              <TrackHeightHandle onPointerDown={(e) => startTrackResize(e, track.index)} />
              <TrackName>{track.name}</TrackName>
              {track.type === 'video' && (
                <TrackBtn
                  className={cx(!track.visible && TrackBtnActive)}
                  onClick={() => toggleVisibilityTrack(track.index)}
                  title={track.visible ? 'Hide Track' : 'Show Track'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {track.visible ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    )}
                  </svg>
                </TrackBtn>
              )}
              <TrackBtn
                className={cx(track.muted && TrackBtnActive)}
                onClick={() => toggleMuteTrack(track.index)}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                )}
              </TrackBtn>
              <TrackBtn
                className={cx(track.locked && TrackBtnActive)}
                onClick={() => toggleLockTrack(track.index)}
                title={track.locked ? 'Unlock' : 'Lock'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {track.locked ? (
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </>
                  ) : (
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 019.9-1" />
                    </>
                  )}
                </svg>
              </TrackBtn>
            </TrackHeader>
          ))}
          <AddTrackBtn onClick={() => addTrack('audio')}>
            + Add Track
          </AddTrackBtn>
        </TrackHeaders>

        <TrackHeadersHandle onPointerDown={startHeadersResize} />

        <TimelineTracksContainer>
          <TimeRuler
            ref={rulerRef}
            onClick={(e) => seekToClientX(e.clientX, rulerRef.current)}
            onMouseMove={handleHoverMove}
            onMouseLeave={handleHoverLeave}
          >
            {renderTickLayers()}
            {rulerTicks.labels.map((marker, i) => (
              <TimeMarker
                key={i}
                style={{ left: `${(marker.frame / framesPerPixel)}px` }}
              >
                <span>{marker.label}</span>
              </TimeMarker>
            ))}
          </TimeRuler>

          <TracksArea
            ref={tracksAreaRef}
            onClick={handleTimelineClick}
            onScroll={handleTracksScroll}
            onMouseMove={handleHoverMove}
            onMouseLeave={handleHoverLeave}
            onPointerDown={(e) => { handleMarqueeStart(e); handlePinchDown(e); }}
            onPointerMove={handlePinchMove}
            onPointerUp={handlePinchUp}
            onPointerCancel={handlePinchUp}
            style={{
              ...(activeTool === 'razor' ? { cursor: 'crosshair' } : {}),
              '--tl-w': `${totalWidth}px`,
            } as CSSProperties}
          >
            <MobileRuler
              ref={innerRulerRef}
              style={{ width: `${totalWidth}px` }}
              onClick={(e) => seekToClientX(e.clientX, innerRulerRef.current)}
            >
              {renderTickLayers()}
              {rulerTicks.labels.map((marker, i) => (
                <TimeMarker
                  key={i}
                  style={{ left: `${(marker.frame / framesPerPixel)}px` }}
                >
                  <span>{marker.label}</span>
                </TimeMarker>
              ))}
            </MobileRuler>
            {orderedTracks.map((track) => (
              <TrackRow
                key={track.id}
                className={cx(
                  track.type === 'audio' && TrackRowAudio,
                  hoveredTrackIndex === track.index && TrackRowDropTarget,
                )}
                style={{ height: `${track.height ?? DEFAULT_TRACK_HEIGHT}px` }}
                onDragOver={(e) => handleTrackDragOver(e, track.index)}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleClipDropOnTimeline(e, track.index)}
                onDragEnd={clearDragVisuals}
              >
                <div className={`${TrackContent} ${trackContentClassName}`} data-track-index={track.index}>
                  {track.clips.length === 0 && dropIndicator?.trackIndex !== track.index && (
                    <SilenceTrack>No clips</SilenceTrack>
                  )}
                  {track.clips.map((clip) => {
                    const left = clip.startFrame / framesPerPixel;
                    const width = clip.durationInFrames / framesPerPixel;
                    const media = mediaLookup.get(clip.mediaId);
                    const clipName = media ? media.name : clip.mediaId.substring(0, 8);
                    return (
                      <Clip
                        key={clip.id}
                        data-clip-id={clip.id}
                        className={cx(
                          track.type === 'video' ? ClipVideo : ClipAudio,
                          selectedClipIds.includes(clip.id) && ClipSelected,
                        )}
                        style={{ left: `${left}px`, width: `${Math.max(20, width)}px`, cursor: activeTool === 'razor' ? 'crosshair' : undefined }}
                        onClick={(e) => handleClipClick(e, clip.id)}
                        draggable={activeTool !== 'razor'}
                        onDragStart={(e) => handleClipDragStartOnTimeline(e, clip.id)}
                      >
                        <ClipHandle
                          className={cx(
                            ClipHandleLeft,
                            activeTrim?.id === clip.id && activeTrim.side === 'in' && ClipHandleActive,
                          )}
                          onPointerDown={(e) => startClipTrim(e, clip.id, 'in')}
                        />
                        {/* Content follows the TRACK type: a linked audio
                            mate references the same video media, but must
                            show its waveform on A-tracks, not frames. */}
                        {media && track.type === 'video' && media.type === 'video' && media.url && (
                          <ClipFilmstrip media={media} clip={clip} fps={playback.fps} />
                        )}
                        {media && track.type === 'audio' && media.url && (
                          <ClipWavestrip media={media} clip={clip} fps={playback.fps} />
                        )}
                        <ClipTitle>
                          <ClipName>{clipName}</ClipName>
                        </ClipTitle>
                        <ClipInner style={{ position: 'relative', zIndex: 1 }}>
                          {media && (media.type === 'video' || media.type === 'image') && (
                            <ClipIcon>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </ClipIcon>
                          )}
                          {media && media.type === 'audio' && (
                            <ClipIcon>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                <path d="M9 18V5l12-2v13" />
                              </svg>
                            </ClipIcon>
                          )}
                        </ClipInner>
                        <ClipHandle
                          className={cx(
                            ClipHandleRight,
                            activeTrim?.id === clip.id && activeTrim.side === 'out' && ClipHandleActive,
                          )}
                          onPointerDown={(e) => startClipTrim(e, clip.id, 'out')}
                        />
                      </Clip>
                    );
                  })}

                  {dropIndicator && dropIndicator.trackIndex === track.index && (
                    <div
                      className={cx(
                        ClipDropGhost,
                        dropIndicator.mediaType === 'audio' ? ClipAudio : ClipVideo,
                      )}
                      style={{
                        left: `${dropIndicator.leftPx}px`,
                        width: `${dropIndicator.widthPx}px`,
                      }}
                    >
                      <ClipInner>
                        <ClipName>{dropIndicator.mediaName}</ClipName>
                      </ClipInner>
                    </div>
                  )}

                  {dropIndicator && dropIndicator.trackIndex === track.index && (
                    <DropIndicatorLine
                      style={{ left: `${dropIndicator.leftPx}px` }}
                    />
                  )}
                </div>
              </TrackRow>
            ))}

            <Playhead style={{ left: `${playheadLeft}px` }}>
              <PlayheadTop />
            </Playhead>
            {snapGuideFrame !== null && (
              <SnapGuide style={{ left: `${snapGuideFrame / framesPerPixel}px` }} />
            )}
            {marquee && (
              <MarqueeBox
                style={{ left: `${marquee.x}px`, top: `${marquee.y}px`, width: `${marquee.w}px`, height: `${marquee.h}px` }}
              />
            )}
            {hoverLeftPx !== null && (
              <Skimmer style={{ left: `${hoverLeftPx}px` }}>
                <SkimmerTimeTag>
                  {frameToTimecode(Math.max(0, Math.round(hoverLeftPx * framesPerPixel)), playback.fps).substring(3)}
                </SkimmerTimeTag>
              </Skimmer>
            )}
          </TracksArea>
        </TimelineTracksContainer>
      </TimelineBody>
    </Panel>
  );
}
