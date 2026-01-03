// Minimal IndexedDB helper for storing video recordings

const DB_NAME = 'guardian_recordings_db';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecording(blob: Blob) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = Date.now().toString();
    const rec = { id, timestamp: Date.now(), blob, size: blob.size, type: blob.type };
    const req = store.add(rec as any);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function listRecordings() {
  const db = await openDB();
  return new Promise<Array<{id:string,timestamp:number,size:number,type:string}>>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []).map((r:any) => ({ id: r.id, timestamp: r.timestamp, size: r.size, type: r.type })));
    req.onerror = () => reject(req.error);
  });
}

export async function getRecording(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? (req.result.blob as Blob) : null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecording(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
