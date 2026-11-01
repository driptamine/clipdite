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
  /** Whether the source has an audio stream (probed by MediaBunny). */
  hasAudio?: boolean;
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
  /** Premiere-style link: the paired video/audio clip that travels together. */
  linkedClipId?: string;
}

export interface Track {
  id: string;
  index: number;
  name: string;
  type: 'video' | 'audio';
  muted: boolean;
  locked: boolean;
  visible: boolean;
  /** Row height in px (default 48, resizable via the header edge). */
  height: number;
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
  /** Frame the last playback run started from; Space/#2 rewinds here (session-only, not persisted). */
  playOriginFrame: number;
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

export interface LayoutState {
  /** Top/bottom split: height % of the upper (monitors) area. */
  topHeight: number;
  /** Project panel width % inside the top area. */
  leftWidth: number;
  /** Source monitor width % inside the monitors row. */
  monitorsSplit: number;
  /** Timeline width % inside the bottom area. */
  timelineSplit: number;
  /** Track headers column width in px. */
  headersWidth: number;
  /** Bottom-left project panel width % inside the bottom area. */
  bottomLeft: number;
}
