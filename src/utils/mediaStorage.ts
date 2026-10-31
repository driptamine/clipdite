/**
 * Original uploaded files live in IndexedDB so timeline media survives
 * a page reload. Blob URLs are session-scoped and are rebuilt from
 * these blobs during hydration (see persist.ts).
 */
const DB_NAME = 'clipdite';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const req = fn(tx.objectStore(STORE_NAME));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
    });
  } finally {
    db.close();
  }
}

export function saveFileBlob(id: string, blob: Blob): Promise<void> {
  return withStore('readwrite', (store) => store.put(blob, id)).then(() => undefined);
}

export function loadFileBlob(id: string): Promise<Blob | undefined> {
  return withStore('readonly', (store) => store.get(id));
}

export function deleteFileBlob(id: string): Promise<void> {
  return withStore('readwrite', (store) => store.delete(id)).then(() => undefined);
}

export function clearFileBlobs(): Promise<void> {
  return withStore('readwrite', (store) => store.clear()).then(() => undefined);
}
