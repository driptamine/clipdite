import { useEditorStore } from '../store/editorStore';
import type { MediaItem, ProjectState, Track, LayoutState } from '../types';
import { loadFileBlob } from './mediaStorage';

const STORAGE_KEY = 'clipdite:v1';

export interface PersistedMedia
  extends Omit<MediaItem, 'url' | 'thumbnail'> {
  hasFile: boolean;
}

export interface PersistedSnapshot {
  version: 1;
  project: ProjectState;
  tracks: Track[];
  mediaItems: PersistedMedia[];
  currentFrame: number;
  layout: LayoutState;
}

export function loadSnapshot(): PersistedSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSnapshot;
    if (parsed.version !== 1 || !Array.isArray(parsed.tracks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildSnapshot(): PersistedSnapshot {
  const s = useEditorStore.getState();
  return {
    version: 1,
    project: s.project,
    tracks: s.tracks,
    mediaItems: s.mediaItems.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      duration: m.duration,
      width: m.width,
      height: m.height,
      source: m.source,
      createdAt: m.createdAt,
      hasFile: true,
    })),
    currentFrame: s.playback.currentFrame,
    layout: s.layout,
  };
}

export function saveNow(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot()));
  } catch {
    // Quota or private-mode failure: edits stay in memory for this session.
  }
}

/**
 * Restore project JSON from localStorage and rebuild session blob URLs
 * from the IndexedDB file store. Resolves true when a snapshot existed.
 */
export async function hydrateFromStorage(): Promise<boolean> {
  const snap = loadSnapshot();
  if (!snap) {
    useEditorStore.getState().setHydrated(true);
    return false;
  }
  const { setMediaUrl, hydrate, setHydrated } = useEditorStore.getState();
  hydrate({
    project: snap.project,
    tracks: snap.tracks,
    mediaItems: snap.mediaItems.map((m) => ({ ...m, url: undefined })),
    currentFrame: snap.currentFrame,
    layout: snap.layout,
  });
  await Promise.all(
    snap.mediaItems.map(async (m) => {
      try {
        const blob = await loadFileBlob(m.id);
        if (blob) setMediaUrl(m.id, URL.createObjectURL(blob));
      } catch {
        // Missing blob: item stays without a playable URL.
      }
    }),
  );
  setHydrated(true);
  return true;
}

/** Subscribe once; every edit (tracks, media, project, playhead) is saved locally. */
let hydratePromise: Promise<boolean> | null = null;

/** Memoized so StrictMode double-mount restores the session exactly once. */
export function ensureHydrated(): Promise<boolean> {
  if (!hydratePromise) hydratePromise = hydrateFromStorage();
  return hydratePromise;
}

export function startPersisting(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsub = useEditorStore.subscribe((s, prev) => {
    if (!s.hasHydrated) return;
    if (
      s.tracks === prev.tracks &&
      s.mediaItems === prev.mediaItems &&
      s.project === prev.project &&
      s.layout === prev.layout &&
      s.playback.currentFrame === prev.playback.currentFrame
    ) {
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(saveNow, 400);
  });
  window.addEventListener('beforeunload', saveNow);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener('beforeunload', saveNow);
    unsub();
  };
}
