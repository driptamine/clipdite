export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  duration: number;
  width?: number;
  height?: number;
  url?: string;
  thumbnail?: string;
  source: 'upload' | 'generated';
  createdAt: number;
}

export interface TimelineClip {
  id: string;
  mediaId: string;
  trackIndex: number;
  startFrame: number;
  durationInFrames: number;
  inPoint: number;
  outPoint: number;
  effects: Effect[];
  opacity: number;
  volume: number;
}

export interface Track {
  id: string;
  index: number;
  name: string;
  type: 'video' | 'audio';
  muted: boolean;
  locked: boolean;
  visible: boolean;
  clips: TimelineClip[];
}

export interface Effect {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentFrame: number;
  fps: number;
  durationInFrames: number;
  loop: boolean;
  volume: number;
}

export type ViewMode = 'timeline' | 'effects' | 'audio';
export type PanelId = 'project' | 'source' | 'program' | 'effects' | 'audio' | 'history';

export interface ProjectState {
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}
