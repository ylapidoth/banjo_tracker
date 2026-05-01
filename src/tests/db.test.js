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
    await addTuning(db, { name: 'Open G', notation: 'gDGBD', isSeed: true });
    await addTuning(db, { name: 'Double C', notation: 'gCGCD', isSeed: true });
    const all = await getAllTunings(db);
    assertEq(all.length, 2);
    const names = all.map((t) => t.name).sort();
    assertEq(names, ['Double C', 'Open G']);
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
    await addStyle(db, { name: 'Clawhammer', isSeed: true });
    await addStyle(db, { name: 'Scruggs', isSeed: true });
    const all = await getAllStyles(db);
    const names = all.map((s) => s.name).sort();
    assertEq(names, ['Clawhammer', 'Scruggs']);
  });
});
