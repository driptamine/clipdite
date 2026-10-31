/**
 * Filmstrip storyboard: a few real frames per media, decoded once with a
 * plain <video> + canvas (no FFmpeg) and shared by every clip that uses it.
 * Each timeline clip then shows only the thumbs inside its in/out range.
 */

const STRIP_COUNT = 12;
const THUMB_W = 96;
const THUMB_H = 54;

const cache = new Map<string, Promise<string[]>>();

/** Full-duration thumb set for a media item (cached, empty on failure). */
export function getFilmstrip(mediaId: string, url: string, duration: number): Promise<string[]> {
  let pending = cache.get(mediaId);
  if (!pending) {
    pending = buildFilmstrip(url, duration).catch(() => []);
    cache.set(mediaId, pending);
  }
  return pending;
}

/** Thumbs whose timestamps fall inside the clip's [inPoint, outPoint] range. */
export function stripForRange(
  thumbs: string[],
  duration: number,
  inPoint: number,
  outPoint: number,
  fps: number,
): string[] {
  if (thumbs.length === 0 || duration <= 0) return [];
  const inSec = inPoint / fps;
  const outSec = outPoint / fps;
  const at = (i: number) => ((i + 0.5) / thumbs.length) * duration;
  const idx = thumbs.map((_, i) => i).filter((i) => at(i) >= inSec - 0.01 && at(i) <= outSec + 0.01);
  if (idx.length > 0) return idx.map((i) => thumbs[i]);
  // Tiny sliver between two thumbs: nearest one wins.
  const mid = (inSec + outSec) / 2;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < thumbs.length; i++) {
    const d = Math.abs(at(i) - mid);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return [thumbs[best]];
}

function waitFor(video: HTMLVideoElement, event: 'loadeddata' | 'seeked', timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, onEvent);
      video.removeEventListener('error', onError);
    };
    const onEvent = () => {
      cleanup();
      resolve(true);
    };
    const onError = () => {
      cleanup();
      resolve(false);
    };
    video.addEventListener(event, onEvent);
    video.addEventListener('error', onError);
  });
}

async function buildFilmstrip(url: string, duration: number): Promise<string[]> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const gate = waitFor(video, 'loadeddata', 8000);
  video.src = url;
  if (!(await gate)) return [];
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const total = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
  if (!(total > 0)) return [];
  const thumbs: string[] = [];
  for (let i = 0; i < STRIP_COUNT; i++) {
    const t = Math.min(((i + 0.5) / STRIP_COUNT) * total, Math.max(0, total - 0.05));
    const seekGate = waitFor(video, 'seeked', 4000);
    try {
      video.currentTime = t;
    } catch {
      break;
    }
    if (!(await seekGate)) break;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) break;
    // Cover-fit the 16:9 thumb.
    const scale = Math.max(THUMB_W / vw, THUMB_H / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.drawImage(video, (THUMB_W - dw) / 2, (THUMB_H - dh) / 2, dw, dh);
    thumbs.push(canvas.toDataURL('image/jpeg', 0.6));
  }
  video.removeAttribute('src');
  video.load();
  return thumbs;
}
