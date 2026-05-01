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
