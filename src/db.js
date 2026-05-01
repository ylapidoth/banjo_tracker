// IndexedDB wrapper. The only file that talks to storage.
// All other modules go through these exports.

const DEFAULT_DB_NAME = 'banjo_tracker';
const SCHEMA_VERSION = 1;

export function openDB(name = DEFAULT_DB_NAME) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, SCHEMA_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tunings')) {
        db.createObjectStore('tunings', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('styles')) {
        db.createObjectStore('styles', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Internal helper used by every later function: wraps an IDBRequest in a Promise.
export function req(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addTuning(db, { name, notation, isSeed = false }) {
  const tx = db.transaction('tunings', 'readwrite');
  const store = tx.objectStore('tunings');
  const record = { name, notation, isSeed };
  const id = await req(store.add(record));
  return { ...record, id };
}

export async function getAllTunings(db) {
  const tx = db.transaction('tunings', 'readonly');
  return await req(tx.objectStore('tunings').getAll());
}

export async function getTuning(db, id) {
  const tx = db.transaction('tunings', 'readonly');
  return await req(tx.objectStore('tunings').get(id));
}

export async function addStyle(db, { name, isSeed = false }) {
  const tx = db.transaction('styles', 'readwrite');
  const store = tx.objectStore('styles');
  const record = { name, isSeed };
  const id = await req(store.add(record));
  return { ...record, id };
}

export async function getAllStyles(db) {
  const tx = db.transaction('styles', 'readonly');
  return await req(tx.objectStore('styles').getAll());
}

export async function addSong(db, fields) {
  const tx = db.transaction('songs', 'readwrite');
  const record = {
    id: crypto.randomUUID(),
    dateAdded: new Date().toISOString(),
    ...fields,
  };
  await req(tx.objectStore('songs').add(record));
  return record;
}

export async function getAllSongs(db) {
  const tx = db.transaction('songs', 'readonly');
  return await req(tx.objectStore('songs').getAll());
}

export async function getSong(db, id) {
  const tx = db.transaction('songs', 'readonly');
  return await req(tx.objectStore('songs').get(id));
}

export async function updateSong(db, id, fields) {
  const txRead = db.transaction('songs', 'readonly');
  const existing = await req(txRead.objectStore('songs').get(id));
  if (!existing) throw new Error(`Song ${id} not found`);
  const merged = { ...existing, ...fields, id: existing.id, dateAdded: existing.dateAdded };
  const txWrite = db.transaction('songs', 'readwrite');
  await req(txWrite.objectStore('songs').put(merged));
  return merged;
}

export async function deleteSong(db, id) {
  const tx = db.transaction('songs', 'readwrite');
  await req(tx.objectStore('songs').delete(id));
}
