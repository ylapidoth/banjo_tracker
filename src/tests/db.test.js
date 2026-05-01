import { test, assert, assertEq } from './runner.js';
import { openDB } from '../db.js';

async function withFreshDB(fn) {
  const name = 'banjo_test_' + crypto.randomUUID();
  const db = await openDB(name);
  try {
    await fn(db);
  } finally {
    db.close();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }
}

test('db: opens and reports the expected object stores', async () => {
  await withFreshDB((db) => {
    const names = Array.from(db.objectStoreNames).sort();
    assertEq(names, ['songs', 'styles', 'tunings']);
  });
});

test('db: re-opening an existing database does not throw', async () => {
  const name = 'banjo_test_' + crypto.randomUUID();
  const db1 = await openDB(name);
  db1.close();
  const db2 = await openDB(name);
  assert(db2.objectStoreNames.contains('songs'));
  db2.close();
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
});

import { addTuning, getAllTunings, getTuning } from '../db.js';

test('tunings: addTuning returns the inserted record with an id', async () => {
  await withFreshDB(async (db) => {
    const t = await addTuning(db, { name: 'Open G', notation: 'gDGBD', isSeed: false });
    assert(typeof t.id === 'number', 'id should be a number');
    assertEq(t.name, 'Open G');
    assertEq(t.notation, 'gDGBD');
    assertEq(t.isSeed, false);
  });
});

test('tunings: getAllTunings returns every inserted tuning', async () => {
  await withFreshDB(async (db) => {
    // The DB is auto-seeded by openDB, so filter to user-added (non-seed) tunings.
    await addTuning(db, { name: 'Test Tuning A', notation: 'aAaAa', isSeed: false });
    await addTuning(db, { name: 'Test Tuning B', notation: 'bBbBb', isSeed: false });
    const all = await getAllTunings(db);
    const userAdded = all.filter((t) => !t.isSeed).map((t) => t.name).sort();
    assertEq(userAdded, ['Test Tuning A', 'Test Tuning B']);
  });
});

test('tunings: getTuning returns a single record by id', async () => {
  await withFreshDB(async (db) => {
    const inserted = await addTuning(db, { name: 'Sawmill', notation: 'gDGCD', isSeed: false });
    const fetched = await getTuning(db, inserted.id);
    assertEq(fetched.name, 'Sawmill');
  });
});

import { addStyle, getAllStyles } from '../db.js';

test('styles: addStyle returns the inserted record with an id', async () => {
  await withFreshDB(async (db) => {
    const s = await addStyle(db, { name: 'Clawhammer', isSeed: true });
    assert(typeof s.id === 'number');
    assertEq(s.name, 'Clawhammer');
    assertEq(s.isSeed, true);
  });
});

test('styles: getAllStyles returns every inserted style', async () => {
  await withFreshDB(async (db) => {
    // The DB is auto-seeded by openDB, so filter to user-added (non-seed) styles.
    await addStyle(db, { name: 'Test Style A', isSeed: false });
    await addStyle(db, { name: 'Test Style B', isSeed: false });
    const all = await getAllStyles(db);
    const userAdded = all.filter((s) => !s.isSeed).map((s) => s.name).sort();
    assertEq(userAdded, ['Test Style A', 'Test Style B']);
  });
});

import { addSong, getAllSongs, getSong, updateSong, deleteSong } from '../db.js';

const SAMPLE_SONG = {
  name: 'Cripple Creek',
  tuningId: 1,
  styleId: 1,
  capo: 2,
  key: 'A',
  artist: '',
  source: 'Ken Perlman book',
};

test('songs: addSong assigns id and dateAdded', async () => {
  await withFreshDB(async (db) => {
    const s = await addSong(db, SAMPLE_SONG);
    assert(typeof s.id === 'string' && s.id.length > 0, 'id should be a non-empty string');
    assert(typeof s.dateAdded === 'string');
    assertEq(s.name, 'Cripple Creek');
    assertEq(s.tuningId, 1);
    assertEq(s.capo, 2);
  });
});

test('songs: getAllSongs returns every inserted song', async () => {
  await withFreshDB(async (db) => {
    await addSong(db, SAMPLE_SONG);
    await addSong(db, { ...SAMPLE_SONG, name: 'Shady Grove' });
    const all = await getAllSongs(db);
    assertEq(all.length, 2);
  });
});

test('songs: getSong returns a single record by id', async () => {
  await withFreshDB(async (db) => {
    const inserted = await addSong(db, SAMPLE_SONG);
    const fetched = await getSong(db, inserted.id);
    assertEq(fetched.name, 'Cripple Creek');
  });
});

test('songs: updateSong merges fields without changing id or dateAdded', async () => {
  await withFreshDB(async (db) => {
    const inserted = await addSong(db, SAMPLE_SONG);
    const updated = await updateSong(db, inserted.id, { capo: 5, key: 'D' });
    assertEq(updated.id, inserted.id);
    assertEq(updated.dateAdded, inserted.dateAdded);
    assertEq(updated.capo, 5);
    assertEq(updated.key, 'D');
    assertEq(updated.name, 'Cripple Creek');
  });
});

test('songs: deleteSong removes the record', async () => {
  await withFreshDB(async (db) => {
    const inserted = await addSong(db, SAMPLE_SONG);
    await deleteSong(db, inserted.id);
    const fetched = await getSong(db, inserted.id);
    assertEq(fetched, undefined);
  });
});

test('songs: pdfBlob round-trips through the database', async () => {
  await withFreshDB(async (db) => {
    const blob = new Blob(['%PDF-1.4 fake pdf bytes'], { type: 'application/pdf' });
    const inserted = await addSong(db, {
      ...SAMPLE_SONG,
      pdfBlob: blob,
      pdfFilename: 'cripple_creek.pdf',
    });
    const fetched = await getSong(db, inserted.id);
    assert(fetched.pdfBlob instanceof Blob, 'pdfBlob should be a Blob');
    assertEq(fetched.pdfFilename, 'cripple_creek.pdf');
    const text = await fetched.pdfBlob.text();
    assertEq(text, '%PDF-1.4 fake pdf bytes');
  });
});

test('seed: a fresh database is populated with seed tunings and styles', async () => {
  await withFreshDB(async (db) => {
    const tunings = await getAllTunings(db);
    const styles = await getAllStyles(db);
    assert(tunings.length >= 5, `expected at least 5 seed tunings, got ${tunings.length}`);
    assert(styles.length >= 4, `expected at least 4 seed styles, got ${styles.length}`);
    assert(tunings.every((t) => t.isSeed === true), 'all seeded tunings should have isSeed=true');
    const names = tunings.map((t) => t.name);
    assert(names.includes('Open G'), 'Open G should be seeded');
  });
});

test('seed: re-opening does not duplicate seed records', async () => {
  const name = 'banjo_test_' + crypto.randomUUID();
  const db1 = await openDB(name);
  const before = (await getAllTunings(db1)).length;
  db1.close();
  const db2 = await openDB(name);
  const after = (await getAllTunings(db2)).length;
  assertEq(after, before);
  db2.close();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(name);
    r.onsuccess = r.onerror = r.onblocked = () => resolve();
  });
});
