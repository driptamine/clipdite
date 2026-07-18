import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MediaItem, Track, TimelineClip, PlaybackState, ProjectState, Effect } from '../types';

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

  addMediaItem: (item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  removeMediaItem: (id: string) => void;
  selectMediaItem: (id: string | null) => void;

  addClipToTrack: (clip: Omit<TimelineClip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  selectClip: (clipId: string | null) => void;
  moveClip: (clipId: string, newStartFrame: number, newTrackIndex: number) => void;
  trimClip: (clipId: string, side: 'in' | 'out', deltaFrames: number) => void;
  updateClipEffect: (clipId: string, effect: Effect) => void;
  addEffectToClip: (clipId: string, effect: Effect) => void;
  removeEffectFromClip: (clipId: string, effectId: string) => void;

  addTrack: (type: 'video' | 'audio') => void;
  removeTrack: (trackIndex: number) => void;
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

const defaultTracks: Track[] = [
  { id: uuidv4(), index: 0, name: 'V1', type: 'video', muted: false, locked: false, visible: true, clips: [] },
  { id: uuidv4(), index: 1, name: 'V2', type: 'video', muted: false, locked: false, visible: true, clips: [] },
  { id: uuidv4(), index: 2, name: 'A1', type: 'audio', muted: false, locked: false, visible: true, clips: [] },
  { id: uuidv4(), index: 3, name: 'A2', type: 'audio', muted: false, locked: false, visible: true, clips: [] },
];

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

  addMediaItem: (item) =>
    set((state) => ({
      mediaItems: [
        ...state.mediaItems,
        { ...item, id: uuidv4(), createdAt: Date.now() },
      ],
    })),

  removeMediaItem: (id) =>
    set((state) => ({
      mediaItems: state.mediaItems.filter((m) => m.id !== id),
      selectedMediaId: state.selectedMediaId === id ? null : state.selectedMediaId,
    })),

  selectMediaItem: (id) => set({ selectedMediaId: id }),

  addClipToTrack: (clip) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.index === clip.trackIndex
          ? { ...track, clips: [...track.clips, { ...clip, id: uuidv4() }] }
          : track
      ),
    })),

  removeClip: (clipId) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    })),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

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
        tracks: clearedTracks.map((track) =>
          track.index === newTrackIndex
            ? { ...track, clips: [...track.clips, { ...movedClip!, startFrame: newStartFrame, trackIndex: newTrackIndex }] }
            : track
        ),
      };
    }),

  trimClip: (clipId, side, deltaFrames) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          if (side === 'in') {
            const newStart = clip.startFrame + deltaFrames;
            const newDuration = clip.durationInFrames - deltaFrames;
            const newInPoint = clip.inPoint + deltaFrames;
            if (newDuration < 5 || newStart < 0) return clip;
            return { ...clip, startFrame: newStart, durationInFrames: newDuration, inPoint: newInPoint };
          } else {
            const newDuration = clip.durationInFrames + deltaFrames;
            if (newDuration < 5) return clip;
            return { ...clip, durationInFrames: newDuration, outPoint: clip.outPoint + deltaFrames };
          }
        }),
      })),
    })),

  updateClipEffect: (clipId, effect) =>
    set((state) => ({
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
      const newTrack: Track = {
        id: uuidv4(),
        index: state.tracks.length,
        name: `${type === 'video' ? 'V' : 'A'}${trackNum}`,
        type,
        muted: false,
        locked: false,
        visible: type === 'video',
        clips: [],
      };
      return { tracks: [...state.tracks, newTrack] };
    }),

  removeTrack: (trackIndex) =>
    set((state) => ({
      tracks: state.tracks
        .filter((t) => t.index !== trackIndex)
        .map((t, i) => ({ ...t, index: i })),
    })),

  toggleMuteTrack: (trackIndex) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, muted: !t.muted } : t
      ),
    })),

  toggleLockTrack: (trackIndex) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, locked: !t.locked } : t
      ),
    })),

  toggleVisibilityTrack: (trackIndex) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.index === trackIndex ? { ...t, visible: !t.visible } : t
      ),
    })),

  renameTrack: (trackIndex, name) =>
    set((state) => ({
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
