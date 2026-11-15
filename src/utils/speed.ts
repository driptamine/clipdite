import type { TimelineClip } from '../types';

/** Slowest allowed rate (10% — 10x slow motion). */
export const MIN_SPEED = 0.1;
/** Fastest allowed rate (800%). */
export const MAX_SPEED = 8;

/** Clamp a raw rate into the supported range (finite, > 0). */
export function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) return 1;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed));
}

/**
 * Effective rate of a clip. Old snapshots (persisted before speed
 * existed) have no `speed` field — they play at normal rate.
 */
export function clipSpeed(clip: Pick<TimelineClip, 'speed'> & { speed?: number }): number {
  return typeof clip.speed === 'number' && Number.isFinite(clip.speed) && clip.speed > 0
    ? Math.min(MAX_SPEED, Math.max(MIN_SPEED, clip.speed))
    : 1;
}

/** Timeline frames a source span (in/out points) occupies at a rate. */
export function timelineDurationFor(sourceSpanFrames: number, speed: number): number {
  return Math.max(1, Math.round(sourceSpanFrames / clampSpeed(speed)));
}

/** Source frames consumed by a timeline length at a rate. */
export function sourceFramesFor(timelineFrames: number, speed: number): number {
  return timelineFrames * clampSpeed(speed);
}

/** Timeline-frame offset inside a clip -> source-frame offset (pre-fps). */
export function sourceOffsetFor(clip: TimelineClip, timelineFrame: number): number {
  const s = clipSpeed(clip);
  return clip.inPoint + (timelineFrame - clip.startFrame) * s;
}
