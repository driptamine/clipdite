import type { TimelineClip } from '../types';
import { loadFileBlob } from './mediaStorage';
import { useEditorStore } from '../store/editorStore';

export interface ExportCandidate {
  clip: TimelineClip;
  mediaName: string;
  blob: Blob;
  /** Trim range in source seconds, derived from the clip's in/out points. */
  start: number;
  end: number;
}

export interface ExportSelection {
  candidates: ExportCandidate[];
  /** Timeline video clips that have no restorable file blob. */
  missing: string[];
}

/** Timeline video clips (topmost track first) with their source blobs. */
export async function collectExportCandidates(
  clips: TimelineClip[],
  fps: number,
  mediaNameOf: (mediaId: string) => string,
): Promise<ExportSelection> {
  const candidates: ExportCandidate[] = [];
  const missing: string[] = [];
  for (const clip of clips) {
    const blob = await loadFileBlob(clip.mediaId).catch(() => undefined);
    if (!blob) {
      missing.push(mediaNameOf(clip.mediaId));
      continue;
    }
    const start = clip.inPoint / fps;
    const end = Math.max(start + 0.1, clip.outPoint / fps);
    candidates.push({ clip, mediaName: mediaNameOf(clip.mediaId), blob, start, end });
  }
  return { candidates, missing };
}

/**
 * Export one timeline clip — trimmed to its in/out points — to MP4
 * using MediaBunny (no FFmpeg/WASM involved).
 */
export async function exportClipToMp4(
  candidate: ExportCandidate,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS } =
    await import('mediabunny');
  const input = new Input({
    source: new BlobSource(candidate.blob),
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
      trim: { start: candidate.start, end: candidate.end },
      showWarnings: false,
    });
    if (!conversion.isValid) {
      throw new Error('MediaBunny cannot convert this clip.');
    }
    if (onProgress) {
      conversion.onProgress = (p) => onProgress(p);
    }
    await conversion.execute();
    if (!target.buffer) throw new Error('Export produced no data.');
    const result = new Blob([target.buffer], { type: 'video/mp4' });
    return result;
  } finally {
    input.dispose();
  }
}

/**
 * Export the selected timeline clip (or the first video clip) trimmed to
 * its in/out points as an MP4 file. Runs entirely on MediaBunny.
 */
export async function runTimelineExport(): Promise<void> {
  const { tracks, mediaItems, playback, selectedClipId, setExportStatus } =
    useEditorStore.getState();

  const videoClips = tracks
    .filter((t) => t.type === 'video')
    .flatMap((t) => t.clips)
    .sort((a, b) => a.startFrame - b.startFrame);
  if (videoClips.length === 0) {
    setExportStatus({ phase: 'error', progress: 0, message: 'Nothing to export: timeline has no video clips.' });
    return;
  }
  const target =
    videoClips.find((c) => c.id === selectedClipId) ?? videoClips[0];
  const mediaNameOf = (mediaId: string) =>
    mediaItems.find((m) => m.id === mediaId)?.name ?? 'clip';
  const { candidates, missing } = await collectExportCandidates(
    [target],
    playback.fps,
    mediaNameOf,
  );
  if (candidates.length === 0) {
    setExportStatus({
      phase: 'error',
      progress: 0,
      message: `Cannot export “${missing[0] ?? 'clip'}”: original file is missing from local storage. Re-import it and try again.`,
    });
    return;
  }
  const candidate = candidates[0];
  setExportStatus({ phase: 'working', progress: 0, message: `Exporting ${candidate.mediaName}…` });
  try {
    const blob = await exportClipToMp4(candidate, (p) =>
      setExportStatus({ progress: Math.round(p * 100) }),
    );
    const base = candidate.mediaName.replace(/\.[^.]+$/, '') || 'clip';
    downloadBlob(blob, `${base}-edit.mp4`);
    setExportStatus({ phase: 'done', progress: 100, message: `Saved ${base}-edit.mp4` });
  } catch (err) {
    setExportStatus({
      phase: 'error',
      progress: 0,
      message: err instanceof Error ? err.message : 'Export failed.',
    });
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
