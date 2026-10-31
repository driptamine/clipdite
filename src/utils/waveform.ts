/**
 * Waveform peaks for audio media, decoded once via Web Audio and shared by
 * every clip that uses it. Each audio clip then shows only the peaks inside
 * its in/out range (mirrors filmstrip.ts for video).
 */

const PEAK_COUNT = 240;

const cache = new Map<string, Promise<number[]>>();

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!sharedCtx) {
    const AC = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) throw new Error('Web Audio is not available');
    sharedCtx = new AC();
  }
  return sharedCtx;
}

/** Peak set (0..1) for the whole media, cached, empty on failure. */
export function getWaveform(mediaId: string, url: string): Promise<number[]> {
  let pending = cache.get(mediaId);
  if (!pending) {
    pending = buildWaveform(url).catch(() => []);
    cache.set(mediaId, pending);
  }
  return pending;
}

/** Peaks whose timestamps fall inside the clip's [inPoint, outPoint] range. */
export function peaksForRange(
  peaks: number[],
  duration: number,
  inPoint: number,
  outPoint: number,
  fps: number,
  maxBars = 160,
): number[] {
  if (peaks.length === 0 || duration <= 0) return [];
  const inSec = inPoint / fps;
  const outSec = outPoint / fps;
  const at = (i: number) => ((i + 0.5) / peaks.length) * duration;
  let idx = peaks.map((_, i) => i).filter((i) => at(i) >= inSec - 0.01 && at(i) <= outSec + 0.01);
  if (idx.length === 0) {
    // Tiny sliver between two peaks: nearest one wins.
    const mid = (inSec + outSec) / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < peaks.length; i++) {
      const d = Math.abs(at(i) - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    idx = [best];
  }
  let vals = idx.map((i) => peaks[i]);
  // Downsample long ranges to a drawable bar count.
  if (vals.length > maxBars) {
    const out: number[] = [];
    const bucket = vals.length / maxBars;
    for (let b = 0; b < maxBars; b++) {
      const from = Math.floor(b * bucket);
      const to = Math.max(from + 1, Math.floor((b + 1) * bucket));
      let m = 0;
      for (let k = from; k < to && k < vals.length; k++) m = Math.max(m, vals[k]);
      out.push(m);
    }
    vals = out;
  }
  return vals;
}

async function buildWaveform(url: string): Promise<number[]> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const ctx = getContext();
  const decoded = await ctx.decodeAudioData(buf);
  if (decoded.numberOfChannels < 1 || decoded.length < 1) return [];
  // Mix channels down: peak of absolute sample values per bucket.
  const channels: Float32Array[] = [];
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    channels.push(decoded.getChannelData(c));
  }
  const block = Math.max(1, Math.floor(decoded.length / PEAK_COUNT));
  const peaks: number[] = [];
  for (let i = 0; i < PEAK_COUNT; i++) {
    const start = i * block;
    let max = 0;
    for (let j = start; j < Math.min(start + block, decoded.length); j += 4) {
      for (const ch of channels) {
        const v = Math.abs(ch[j]);
        if (v > max) max = v;
      }
    }
    peaks.push(max);
  }
  const top = Math.max(...peaks, 0.01);
  return peaks.map((p) => p / top);
}
