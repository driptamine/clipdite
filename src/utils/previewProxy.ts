/**
 * Preview proxies for smooth playback on weak hardware (e.g. entry phones).
 * A lightweight 480p copy of each video is transcoded once with MediaBunny,
 * stored in IndexedDB under `proxy:<mediaId>` and played in the Program
 * monitor instead of the heavy original. Same duration, so all timeline
 * math (in/out points, trims, splits) is untouched. Originals stay intact
 * and are still what Export uses.
 */
import { useEditorStore } from '../store/editorStore';
import { loadFileBlob, saveFileBlob } from './mediaStorage';

export const proxyKeyFor = (mediaId: string) => `proxy:${mediaId}`;

const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
// One transcode at a time: never melt the device with parallel encodes.
let queue: Promise<void> = Promise.resolve();

export function getProxyUrl(mediaId: string): string | null {
  return urlCache.get(mediaId) ?? null;
}

/** Resolve the proxy URL, building it in the background if needed. */
export function ensureProxy(mediaId: string): Promise<string | null> {
  const hit = urlCache.get(mediaId);
  if (hit) return Promise.resolve(hit);
  const running = pending.get(mediaId);
  if (running) return running;
  const task = queue.then(() => buildProxy(mediaId));
  queue = task.then(
    () => undefined,
    () => undefined,
  );
  const tracked = task.then((url) => {
    pending.delete(mediaId);
    if (url) {
      urlCache.set(mediaId, url);
      try {
        useEditorStore.getState().setProxyUrl(mediaId, url);
      } catch {
        // Store gone (tests): the URL is still returned to the caller.
      }
    }
    return url;
  });
  pending.set(mediaId, tracked);
  return tracked;
}

async function buildProxy(mediaId: string): Promise<string | null> {
  try {
    // Reuse a proxy transcoded in an earlier session.
    try {
      const stored = await loadFileBlob(proxyKeyFor(mediaId));
      if (stored) return URL.createObjectURL(stored);
    } catch {
      // Fall through to a fresh transcode.
    }
    const blob = await loadFileBlob(mediaId);
    if (!blob) return null;
    const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS } =
      await import('mediabunny');
    const input = new Input({
      source: new BlobSource(blob),
      formats: ALL_FORMATS,
    });
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat(),
      target,
    });
    try {
      const conversion = await Conversion.init({
        input,
        output,
        video: { width: 480, bitrate: 600_000 },
        audio: { bitrate: 96_000 },
        showWarnings: false,
      });
      if (!conversion.isValid) return null;
      await conversion.execute();
      if (!target.buffer) return null;
      const proxy = new Blob([target.buffer], { type: 'video/mp4' });
      await saveFileBlob(proxyKeyFor(mediaId), proxy);
      return URL.createObjectURL(proxy);
    } finally {
      input.dispose();
    }
  } catch {
    // Any failure (codec, memory, quota): caller falls back to the original.
    return null;
  }
}
