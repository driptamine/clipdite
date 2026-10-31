import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MediaItem, Track, TimelineClip, PlaybackState, ProjectState, LayoutState, Effect } from '../types';
import { deleteFileBlob } from '../utils/mediaStorage';

export interface ExportStatus {
  phase: 'idle' | 'working' | 'done' | 'error';
  progress: number;
  message: string;
}

export type ToolId = 'selection' | 'razor';

export interface HistoryEntry {
  tracks: Track[];
  /** Unix ms + source key; rapid trims with the same key collapse into one step. */
  at: number;
  key: string;
}

interface EditorState {
  project: ProjectState;
  mediaItems: MediaItem[];
  tracks: Track[];
  playback: PlaybackState;
  selectedClipId: string | null;
  selectedMediaId: string | null;
  selectedTrackIndex: number | null;
  zoom: number;
  scrollPosition: number;
  isDragging: boolean;
  dragClipId: string | null;
  dragMediaId: string | null;
  activePanels: string[];
  isSourcePanelOpen: boolean;
  currentTimecode: string;
  /** Session-only proxy URLs (never persisted): mediaId -> object URL. */
  proxyUrls: Record<string, string>;
  setProxyUrl: (id: string, url: string) => void;
  past: HistoryEntry[];
  future: Track[][];
  undo: () => void;
  redo: () => void;
  layout: LayoutState;
  setLayout: (patch: Partial<LayoutState>) => void;
  hasHydrated: boolean;
  importNonce: number;
  exportStatus: ExportStatus;

  addMediaItem: (item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  importMediaItem: (item: MediaItem) => void;
  setMediaUrl: (id: string, url: string) => void;
  removeMediaItem: (id: string) => void;
  selectMediaItem: (id: string | null) => void;
  hydrate: (snap: { project: ProjectState; tracks: Track[]; mediaItems: MediaItem[]; currentFrame: number; layout?: LayoutState }) => void;
  setHydrated: (v: boolean) => void;
  setProjectName: (name: string) => void;
  requestImport: () => void;
  setExportStatus: (s: Partial<ExportStatus>) => void;
  lastSavedAt: number | null;
  markSaved: () => void;
  newProject: () => void;

  addClipToTrack: (clip: Omit<TimelineClip, 'id'>) => void;
  addClipPair: (video: Omit<TimelineClip, 'id' | 'linkedClipId'>, audio: Omit<TimelineClip, 'id' | 'linkedClipId'>) => void;
  setMediaHasAudio: (id: string, hasAudio: boolean) => void;
  removeClip: (clipId: string) => void;
  selectClip: (clipId: string | null) => void;
  selectClips: (clipIds: string[]) => void;
  selectedClipIds: string[];
  splitClip: (clipId: string, frame: number) => void;
  moveClips: (clipIds: string[], deltaFrames: number, deltaTracks: number) => void;
  activeTool: ToolId;
  setActiveTool: (tool: ToolId) => void;
  moveClip: (clipId: string, newStartFrame: number, newTrackIndex: number) => void;
  trimClip: (clipId: string, side: 'in' | 'out', deltaFrames: number) => void;
  updateClipEffect: (clipId: string, effect: Effect) => void;
  addEffectToClip: (clipId: string, effect: Effect) => void;
  removeEffectFromClip: (clipId: string, effectId: string) => void;

  addTrack: (type: 'video' | 'audio') => void;
  removeTrack: (trackIndex: number) => void;
  setTrackHeight: (trackIndex: number, height: number) => void;
  toggleMuteTrack: (trackIndex: number) => void;
  toggleLockTrack: (trackIndex: number) => void;
  toggleVisibilityTrack: (trackIndex: number) => void;
  renameTrack: (trackIndex: number, name: string) => void;

  setPlayback: (update: Partial<PlaybackState>) => void;
  togglePlay: () => void;
  stopPlayback: () => void;
  stepFrame: (direction: 1 | -1) => void;
  setCurrentFrame: (frame: number) => void;

  setZoom: (zoom: number) => void;
  setScrollPosition: (pos: number) => void;
  setDragging: (isDragging: boolean, clipId?: string) => void;
  setDragMediaId: (mediaId: string | null) => void;
  setCurrentTimecode: (tc: string) => void;

  duplicateClip: (clipId: string) => void;
}

export const DEFAULT_TRACK_HEIGHT = 48;

const MAX_HISTORY = 100;

/**
 * Snapshot the current tracks for undo. Rapid same-key updates (a trim drag
 * firing per mousemove) collapse into a single step instead of dozens.
 */
function pushHistory(
  state: EditorState,
  coalesceKey?: string,
  windowMs = 800,
): Pick<EditorState, 'past' | 'future'> {
  const now = Date.now();
  const last = state.past[state.past.length - 1];
  if (coalesceKey && last && last.key === coalesceKey && now - last.at < windowMs) {
    return { past: state.past, future: [] };
  }
  return {
    past: [...state.past.slice(-MAX_HISTORY + 1), { tracks: state.tracks, at: now, key: coalesceKey ?? `op:${now}` }],
    future: [],
  };
}

function makeDefaultTracks(): Track[] {
  const base = { muted: false, locked: false, clips: [] as Track['clips'] };
  return [
    { ...base, id: uuidv4(), index: 0, name: 'V1', type: 'video', visible: true, height: DEFAULT_TRACK_HEIGHT },
    { ...base, id: uuidv4(), index: 1, name: 'V2', type: 'video', visible: true, height: DEFAULT_TRACK_HEIGHT },
    { ...base, id: uuidv4(), index: 2, name: 'A1', type: 'audio', visible: true, height: DEFAULT_TRACK_HEIGHT },
    { ...base, id: uuidv4(), index: 3, name: 'A2', type: 'audio', visible: true, height: DEFAULT_TRACK_HEIGHT },
  ];
}

const defaultTracks: Track[] = makeDefaultTracks();

export const useEditorStore = create<EditorState>((set) => ({
  project: {
    name: 'Untitled Project',
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 30 * 60 * 5,
  },
  mediaItems: [],
  tracks: defaultTracks,
  playback: {
    isPlaying: false,
    currentFrame: 0,
    fps: 30,
    durationInFrames: 30 * 60 * 5,
    loop: false,
    volume: 1,
  },
  selectedClipId: null,
  selectedMediaId: null,
  selectedTrackIndex: null,
  zoom: 1,
  scrollPosition: 0,
  isDragging: false,
  dragClipId: null,
  dragMediaId: null,
  activePanels: ['project', 'source', 'program', 'effects'],
  isSourcePanelOpen: false,
  currentTimecode: '00:00:00:00',
  proxyUrls: {},
  layout: { topHeight: 55, leftWidth: 35, monitorsSplit: 50, timelineSplit: 72, headersWidth: 120, bottomLeft: 20 },
  past: [],
  future: [],
  hasHydrated: false,
  importNonce: 0,
  exportStatus: { phase: 'idle', progress: 0, message: '' },
  lastSavedAt: null,
  activeTool: 'selection' as ToolId,
  selectedClipIds: [],

  addMediaItem: (item) =>
    set((state) => ({
      mediaItems: [
        ...state.mediaItems,
        { ...item, id: uuidv4(), createdAt: Date.now() },
      ],
    })),

  importMediaItem: (item) =>
    set((state) => ({
      mediaItems: state.mediaItems.some((m) => m.id === item.id)
        ? state.mediaItems
        : [...state.mediaItems, item],
    })),

  setMediaUrl: (id, url) =>
    set((state) => ({
      mediaItems: state.mediaItems.map((m) => (m.id === id ? { ...m, url } : m)),
    })),

  hydrate: (snap) =>
    set((state) => {
      const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      const l = snap.layout;
      return {
        project: snap.project,
        tracks: snap.tracks,
        mediaItems: snap.mediaItems,
        selectedClipId: null,
        selectedClipIds: [],
        selectedMediaId: null,
        past: [],
        future: [],
        playback: { ...state.playback, currentFrame: snap.currentFrame, fps: snap.project.fps },
        layout: l
          ? {
              topHeight: clamp(num(l.topHeight, 55), 20, 80),
              leftWidth: clamp(num(l.leftWidth, 35), 15, 70),
              monitorsSplit: clamp(num(l.monitorsSplit, 50), 20, 80),
              timelineSplit: clamp(num(l.timelineSplit, 72), 25, 85),
              headersWidth: clamp(num(l.headersWidth, 120), 24, 320),
              bottomLeft: clamp(num(l.bottomLeft, 20), 10, 40),
            }
          : state.layout,
      };
    }),

  setLayout: (patch) =>
    set((state) => ({ layout: { ...state.layout, ...patch } })),

  setHydrated: (v) => set({ hasHydrated: v }),

  setProxyUrl: (id, url) =>
    set((state) => ({ proxyUrls: { ...state.proxyUrls, [id]: url } })),

  setProjectName: (name) =>
    set((state) => ({ project: { ...state.project, name } })),

  requestImport: () => set((state) => ({ importNonce: state.importNonce + 1 })),

  setExportStatus: (s) =>
    set((state) => ({ exportStatus: { ...state.exportStatus, ...s } })),

  markSaved: () => set({ lastSavedAt: Date.now() }),

  newProject: () =>
    set((state) => ({
      project: {
        name: 'Untitled Project',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 30 * 60 * 5,
      },
      mediaItems: [],
      tracks: makeDefaultTracks(),
      playback: {
        isPlaying: false,
        currentFrame: 0,
        fps: 30,
        durationInFrames: 30 * 60 * 5,
        loop: false,
        volume: state.playback.volume,
      },
      selectedClipId: null,
      selectedClipIds: [],
      selectedMediaId: null,
      past: [],
      future: [],
    })),

  removeMediaItem: (id) => {
    deleteFileBlob(id).catch(() => undefined);
    return set((state) => ({
      mediaItems: state.mediaItems.filter((m) => m.id !== id),
      selectedMediaId: state.selectedMediaId === id ? null : state.selectedMediaId,
    }));
  },

  selectMediaItem: (id) => set({ selectedMediaId: id }),

  addClipToTrack: (clip) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((track) =>
        track.index === clip.trackIndex
          ? { ...track, clips: [...track.clips, { ...clip, id: uuidv4() }] }
          : track
      ),
    })),

  addClipPair: (video, audio) =>
    set((state) => {
      const videoId = uuidv4();
      const audioId = uuidv4();
      return {
        ...pushHistory(state),
        tracks: state.tracks.map((track) => {
          const addV = track.index === video.trackIndex
            ? [{ ...video, id: videoId, linkedClipId: audioId }]
            : [];
          const addA = track.index === audio.trackIndex
            ? [{ ...audio, id: audioId, linkedClipId: videoId }]
            : [];
          return addV.length > 0 || addA.length > 0
            ? { ...track, clips: [...track.clips, ...addV, ...addA] }
            : track;
        }),
      };
    }),

  setMediaHasAudio: (id, hasAudio) =>
    set((state) => ({
      mediaItems: state.mediaItems.map((m) => (m.id === id ? { ...m, hasAudio } : m)),
    })),

  removeClip: (clipId) =>
    set((state) => {
      // Linked partner goes with it (both directions).
      const doomed = new Set<string>([clipId]);
      for (const t of state.tracks) {
        for (const c of t.clips) {
          if (c.id === clipId && c.linkedClipId) doomed.add(c.linkedClipId);
          if (c.linkedClipId === clipId) doomed.add(c.id);
        }
      }
      const selectedClipIds = state.selectedClipIds.filter((id) => !doomed.has(id));
      return {
        ...pushHistory(state),
        tracks: state.tracks.map((track) => ({
          ...track,
          clips: track.clips.filter((c) => !doomed.has(c.id)),
        })),
        selectedClipId: doomed.has(state.selectedClipId ?? '')
          ? (selectedClipIds[selectedClipIds.length - 1] ?? null)
          : state.selectedClipId,
        selectedClipIds,
      };
    }),

  selectClip: (clipId) =>
    set({ selectedClipId: clipId, selectedClipIds: clipId ? [clipId] : [] }),

  selectClips: (clipIds) =>
    set({ selectedClipIds: clipIds, selectedClipId: clipIds.length > 0 ? clipIds[clipIds.length - 1] : null }),

  splitClip: (clipId, frame) =>
    set((state) => {
      const findClip = (id: string) => {
        for (const track of state.tracks) {
          const clip = track.clips.find((c) => c.id === id);
          if (clip) return clip;
        }
        return undefined;
      };
      const cut = (clip: TimelineClip) => {
        const leftDuration = frame - clip.startFrame;
        const rightDuration = clip.startFrame + clip.durationInFrames - frame;
        // Ignore cuts too close to the edges (same 5-frame guard as trim).
        if (leftDuration < 5 || rightDuration < 5) return null;
        const left: TimelineClip = {
          ...clip,
          durationInFrames: leftDuration,
          outPoint: clip.inPoint + leftDuration,
          effects: clip.effects.map((e) => ({ ...e })),
        };
        const right: TimelineClip = {
          ...clip,
          id: uuidv4(),
          startFrame: frame,
          durationInFrames: rightDuration,
          inPoint: clip.inPoint + leftDuration,
          effects: clip.effects.map((e) => ({ ...e })),
        };
        return { left, right };
      };
      const clip = findClip(clipId);
      if (!clip) return state;
      const main = cut(clip);
      if (!main) return state;
      // A linked partner spanning the cut frame is split too, pieces stay linked.
      const partner = clip.linkedClipId ? findClip(clip.linkedClipId) : undefined;
      const partnerCut = partner && partner.id !== clipId ? cut(partner) : null;
      if (partnerCut) {
        main.left.linkedClipId = partnerCut.left.id;
        main.right.linkedClipId = partnerCut.right.id;
        partnerCut.left.linkedClipId = main.left.id;
        partnerCut.right.linkedClipId = main.right.id;
      } else {
        main.left.linkedClipId = undefined;
        main.right.linkedClipId = undefined;
      }
      const replacements = new Map<string, TimelineClip[]>([
        [clip.id, [main.left, main.right]],
      ]);
      if (partner && partnerCut) {
        replacements.set(partner.id, [partnerCut.left, partnerCut.right]);
      } else if (partner) {
        replacements.set(partner.id, [{ ...partner, linkedClipId: undefined }]);
      }
      return {
        ...pushHistory(state),
        tracks: state.tracks.map((track) => ({
          ...track,
          clips: track.clips.flatMap((c) => replacements.get(c.id) ?? [c]),
        })),
      };
    }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  moveClip: (clipId, newStartFrame, newTrackIndex) =>
    set((state) => {
      let movedClip: TimelineClip | null = null;
      const clearedTracks = state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => {
          if (c.id === clipId) {
            movedClip = c;
            return false;
          }
          return true;
        }),
      }));
      if (!movedClip) return state;
      return {
        ...pushHistory(state),
        tracks: clearedTracks.map((track) =>
          track.index === newTrackIndex
            ? { ...track, clips: [...track.clips, { ...movedClip!, startFrame: newStartFrame, trackIndex: newTrackIndex }] }
            : track
        ),
      };
    }),

  moveClips: (clipIds, deltaFrames, deltaTracks) =>
    set((state) => {
      const idSet = new Set(clipIds);
      // Linked partners (Premiere-style) travel with the selection.
      for (const t of state.tracks) {
        for (const c of t.clips) {
          if (idSet.has(c.id) && c.linkedClipId) idSet.add(c.linkedClipId);
        }
      }
      const moving = state.tracks.flatMap((t) =>
        t.clips.filter((c) => idSet.has(c.id)).map((c) => ({ ...c })),
      );
      if (moving.length === 0) return state;
      // Clamp so no clip lands before frame 0.
      const minStart = Math.min(...moving.map((c) => c.startFrame + deltaFrames));
      const adj = minStart < 0 ? deltaFrames - minStart : deltaFrames;
      const remaining = state.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => !idSet.has(c.id)),
      }));
      for (const m of moving) {
        const target = remaining.find((t) => t.index === m.trackIndex + deltaTracks);
        if (!target || target.locked) {
          // Locked or missing target: clip stays where it was.
          remaining.find((t) => t.index === m.trackIndex)?.clips.push(m);
          continue;
        }
        m.startFrame = Math.max(0, m.startFrame + adj);
        m.trackIndex = target.index;
        target.clips.push(m);
      }
      return { ...pushHistory(state), tracks: remaining };
    }),

  trimClip: (clipId, side, deltaFrames) =>
    set((state) => {
      // Linked partner trims in lockstep so picture and sound stay in sync.
      const withPartner = new Set<string>();
      const main = state.tracks.flatMap((t) => t.clips).find((c) => c.id === clipId);
      if (main?.linkedClipId) withPartner.add(main.linkedClipId);
      const trimOne = (clip: TimelineClip) => {
        if (side === 'in') {
          const newStart = clip.startFrame + deltaFrames;
          const newDuration = clip.durationInFrames - deltaFrames;
          const newInPoint = clip.inPoint + deltaFrames;
          if (newDuration < 5 || newStart < 0) return clip;
          return { ...clip, startFrame: newStart, durationInFrames: newDuration, inPoint: newInPoint };
        }
        const newDuration = clip.durationInFrames + deltaFrames;
        if (newDuration < 5) return clip;
        return { ...clip, durationInFrames: newDuration, outPoint: clip.outPoint + deltaFrames };
      };
      let changed = false;
      const tracks = state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId && !withPartner.has(clip.id)) return clip;
          const next = trimOne(clip);
          if (next !== clip) changed = true;
          return next;
        }),
      }));
      // Clamped no-op: don't record an undo step.
      if (!changed) return state;
      return {
        ...pushHistory(state, `trim:${clipId}:${side}`),
        tracks,
      };
    }),

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return {
        tracks: prev.tracks,
        past: state.past.slice(0, -1),
        future: [state.tracks, ...state.future].slice(0, MAX_HISTORY),
        selectedClipId: null,
        selectedClipIds: [],
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        tracks: next,
        past: [...state.past.slice(-MAX_HISTORY + 1), { tracks: state.tracks, at: Date.now(), key: `redo:${Date.now()}` }],
        future: state.future.slice(1),
        selectedClipId: null,
        selectedClipIds: [],
      };
    }),

  updateClipEffect: (clipId, effect) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId
            ? {
                ...clip,
                effects: clip.effects.map((e) =>
                  e.id === effect.id ? effect : e
                ),
              }
            : clip
        ),
      })),
    })),

  addEffectToClip: (clipId, effect) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId
            ? { ...clip, effects: [...clip.effects, effect] }
            : clip
        ),
      })),
    })),

  removeEffectFromClip: (clipId, effectId) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId
            ? { ...clip, effects: clip.effects.filter((e) => e.id !== effectId) }
            : clip
        ),
      })),
    })),

  addTrack: (type) =>
    set((state) => {
      const existingOfSameType = state.tracks.filter((t) => t.type === type);
      const trackNum = existingOfSameType.length + 1;
      // Index is a stable id (max + 1), never a position: display order
      // is derived by displayOrder(), so new video tracks land on top.
      let maxIndex = state.tracks.reduce((m, t) => Math.max(m, t.index), -1);
      const makeTrack = (trackType: 'video' | 'audio', num: number): Track => ({
        id: uuidv4(),
        index: ++maxIndex,
        name: `${trackType === 'video' ? 'V' : 'A'}${num}`,
        type: trackType,
        muted: false,
        locked: false,
        visible: trackType === 'video',
        height: DEFAULT_TRACK_HEIGHT,
        clips: [],
      });
      // A new video track always brings its matching audio mate
      // (V3 arrives with A3), like Premiere's Add Tracks.
      if (type === 'video') {
        const audioCount = state.tracks.filter((t) => t.type === 'audio').length;
        return {
          ...pushHistory(state),
          tracks: [
            ...state.tracks,
            makeTrack('video', trackNum),
            makeTrack('audio', audioCount + 1),
          ],
        };
      }
      return { ...pushHistory(state), tracks: [...state.tracks, makeTrack('audio', trackNum)] };
    }),

  removeTrack: (trackIndex) =>
    set((state) => ({
      ...pushHistory(state),
      // No reindexing: remaining tracks and their clips keep stable indices.
      tracks: state.tracks.filter((t) => t.index !== trackIndex),
    })),

  setTrackHeight: (trackIndex, height) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, height } : t,
      ),
    })),

  toggleMuteTrack: (trackIndex) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, muted: !t.muted } : t
      ),
    })),

  toggleLockTrack: (trackIndex) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, locked: !t.locked } : t
      ),
    })),

  toggleVisibilityTrack: (trackIndex) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, visible: !t.visible } : t
      ),
    })),

  renameTrack: (trackIndex, name) =>
    set((state) => ({
      ...pushHistory(state),
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, name } : t
      ),
    })),

  setPlayback: (update) =>
    set((state) => ({
      playback: { ...state.playback, ...update },
    })),

  togglePlay: () =>
    set((state) => ({
      playback: { ...state.playback, isPlaying: !state.playback.isPlaying },
    })),

  stopPlayback: () =>
    set((state) => ({
      playback: { ...state.playback, isPlaying: false, currentFrame: 0 },
    })),

  stepFrame: (direction) =>
    set((state) => ({
      playback: {
        ...state.playback,
        currentFrame: Math.max(0, state.playback.currentFrame + direction),
      },
    })),

  setCurrentFrame: (frame) =>
    set((state) => ({
      playback: { ...state.playback, currentFrame: Math.max(0, Math.min(frame, state.playback.durationInFrames)) },
    })),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setScrollPosition: (pos) => set({ scrollPosition: pos }),
  setDragging: (isDragging, clipId) => set({ isDragging, dragClipId: clipId || null }),
  setDragMediaId: (mediaId) => set({ dragMediaId: mediaId }),
  setCurrentTimecode: (tc) => set({ currentTimecode: tc }),

  duplicateClip: (clipId) =>
    set((state) => {
      for (const track of state.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const newClip = {
            ...clip,
            id: uuidv4(),
            startFrame: clip.startFrame + clip.durationInFrames + 5,
          };
          return {
            ...pushHistory(state),
            tracks: state.tracks.map((t) =>
              t.index === track.index
                ? { ...t, clips: [...t.clips, newClip] }
                : t
            ),
          };
        }
      }
      return state;
    }),
}));
