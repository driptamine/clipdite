import type { Track } from '../types';

/**
 * Display order: video tracks on top with higher numbers above lower
 * (V3, V2, V1), then audio tracks with A1 above A2.
 * Track `index` is a stable id — position in the array means nothing.
 */
export function displayOrder(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'video' ? -1 : 1;
    return a.type === 'video' ? b.index - a.index : a.index - b.index;
  });
}

function unlockedAudio(tracks: Track[]): Track[] {
  return tracks
    .filter((t) => t.type === 'audio' && !t.locked)
    .sort((a, b) => a.index - b.index);
}

/**
 * Premiere-style numbering: a video dropped on V2 sends its sound to A2,
 * V3 to A3, and so on. Falls back to the first unlocked audio track when
 * the numbered mate is missing or locked.
 */
export function findLinkedAudioTrack(tracks: Track[], videoTrack: Track): Track | undefined {
  const fallback = unlockedAudio(tracks)[0];
  const num = videoTrack.name.match(/(\d+)$/)?.[1];
  if (!num) return fallback;
  return unlockedAudio(tracks).find((t) => t.name === `A${num}`) ?? fallback;
}
