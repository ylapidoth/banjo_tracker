# Banjo Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page browser app that tracks banjo songs grouped by tuning, with style/capo/key/artist/source metadata, optional PDF attachments, and persistent local storage.

**Architecture:** Static frontend served as plain files. Vanilla JS in small ES modules (`db.js` for storage, `ui.js` for rendering, `seed.js` for first-run data, `main.js` to wire it together). IndexedDB holds metadata and PDF blobs. A separate `tests.html` page runs in-browser tests with a tiny custom test runner — no test framework, no build step.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), IndexedDB. No frameworks, no npm dependencies, no build pipeline.

**Setup Note:** Modern browsers (Chrome especially) block ES module loading from `file://`. The project must be served. Use `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/index.html` for the app or `http://localhost:8000/tests.html` for tests.

**Spec:** [docs/superpowers/specs/2026-05-01-banjo-tracker-design.md](../specs/2026-05-01-banjo-tracker-design.md)

---

## Task 0: Project skeleton

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/main.js`
- Modify: `README.md`

- [ ] **Step 1: Update README with run instructions**

Replace the contents of `README.md` with:

```markdown
# banjo_tracker

Personal browser app for tracking banjo songs grouped by tuning, with PDF tab attachments.

## Run

```
python3 -m http.server 8000
```

Then open:
- App: http://localhost:8000/index.html
- Tests: http://localhost:8000/tests.html

## Stack

Vanilla HTML/CSS/JS, IndexedDB for storage. No build step, no dependencies.
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Banjo Tracker</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="app-header">
    <h1>Banjo Tracker</h1>
    <button id="add-song-btn" type="button">+ Add Song</button>
  </header>
  <main id="app"></main>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create empty `styles.css`**

```css
/* Banjo Tracker styles — populated incrementally as features land. */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin: 0;
  background: #fafafa;
  color: #222;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

#app {
  padding: 1.5rem;
}
```

- [ ] **Step 4: Create `src/main.js`**

```javascript
// App entry. Wires storage to UI.
console.log('Banjo Tracker loaded.');
```

- [ ] **Step 5: Manual verification**

Run from the repo root:

```
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`. Expected: page shows "Banjo Tracker" header with an "+ Add Song" button. Browser console shows `Banjo Tracker loaded.` with no errors.

- [ ] **Step 6: Commit**

```bash
git add README.md index.html styles.css src/main.js
git commit -m "Add project skeleton (index.html, styles.css, main.js)"
```

---

## Task 1: Test harness

**Files:**
- Create: `tests.html`
- Create: `src/tests/runner.js`
- Create: `src/tests/index.js`

- [ ] **Step 1: Create `tests.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Banjo Tracker — Tests</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 1.5rem; }
    h1 { margin-top: 0; }
    .summary { margin: 1rem 0; font-weight: 600; }
    .summary.pass { color: #0a7c2f; }
    .summary.fail { color: #c0392b; }
    .test { padding: 0.25rem 0; font-family: ui-monospace, monospace; font-size: 0.9rem; }
    .test.pass::before { content: "✓ "; color: #0a7c2f; }
    .test.fail::before { content: "✗ "; color: #c0392b; }
    .test pre { background: #fdecea; padding: 0.5rem; margin: 0.25rem 0 0 1.5rem; }
  </style>
</head>
<body>
  <h1>Banjo Tracker Tests</h1>
  <div id="summary" class="summary">Running…</div>
  <div id="results"></div>
  <script type="module" src="src/tests/index.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `src/tests/runner.js`**

```javascript
// Tiny in-browser test runner. No dependencies.
const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertEq(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg ? msg + ': ' : ''}expected ${e}, got ${a}`);
  }
}

export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}

export async function run() {
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    const row = document.createElement('div');
    row.className = 'test';
    row.textContent = name;
    results.appendChild(row);
    try {
      await fn();
      row.classList.add('pass');
      passed++;
    } catch (err) {
      row.classList.add('fail');
      const pre = document.createElement('pre');
      pre.textContent = err.stack || err.message;
      row.appendChild(pre);
      failed++;
    }
  }

  summary.textContent = `${passed} passed, ${failed} failed`;
  summary.classList.add(failed === 0 ? 'pass' : 'fail');
}
```

- [ ] **Step 3: Create `src/tests/index.js` (will list test modules as we add them)**

```javascript
import { run } from './runner.js';

// Test modules will be imported here as they are added.
// Each module registers tests via the `test()` function on import.

await run();
```

- [ ] **Step 4: Add a smoke test to verify the runner works**

Append to `src/tests/index.js` BEFORE the `await run();` line:

```javascript
import { test, assertEq } from './runner.js';

test('runner: smoke test passes', () => {
  assertEq(1 + 1, 2);
});
```

The full file should now read:

```javascript
import { run, test, assertEq } from './runner.js';

test('runner: smoke test passes', () => {
  assertEq(1 + 1, 2);
});

await run();
```

- [ ] **Step 5: Manual verification**

With `python3 -m http.server 8000` running, open `http://localhost:8000/tests.html`. Expected: green summary "1 passed, 0 failed" and a check next to "runner: smoke test passes".

- [ ] **Step 6: Commit**

```bash
git add tests.html src/tests/runner.js src/tests/index.js
git commit -m "Add in-browser test harness with smoke test"
```

---

## Task 2: Open IndexedDB with schema

**Files:**
- Create: `src/db.js`
- Create: `src/tests/db.test.js`
- Modify: `src/tests/index.js`

The schema has three object stores: `songs` (keyPath `id`), `tunings` (keyPath `id`, autoIncrement), `styles` (keyPath `id`, autoIncrement).

- [ ] **Step 1: Write the failing tests**

Create `src/tests/db.test.js`:

```javascript
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
```

Wire it into `src/tests/index.js`. The file should read:

```javascript
import { run, test, assertEq } from './runner.js';
import './db.test.js';

test('runner: smoke test passes', () => {
  assertEq(1 + 1, 2);
});

await run();
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `http://localhost:8000/tests.html`. Expected: 1 passed (smoke test), 2 failed (db tests) with errors like "Failed to resolve module specifier" or "openDB is not a function".

- [ ] **Step 3: Implement `openDB` in `src/db.js`**

Create `src/db.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `tests.html`. Expected: "3 passed, 0 failed".

- [ ] **Step 5: Commit**

```bash
git add src/db.js src/tests/db.test.js src/tests/index.js
git commit -m "Add IndexedDB schema with songs, tunings, and styles stores"
```

---

## Task 3: Tunings CRUD

**Files:**
- Modify: `src/db.js`
- Modify: `src/tests/db.test.js`

- [ ] **Step 1: Write failing tests**

Append to `src/tests/db.test.js`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `tests.html`. Expected: previous tests pass, 3 new tunings tests fail with "addTuning is not a function" or similar.

- [ ] **Step 3: Implement tunings CRUD in `src/db.js`**

Append to `src/db.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `tests.html`. Expected: "6 passed, 0 failed".

- [ ] **Step 5: Commit**

```bash
git add src/db.js src/tests/db.test.js
git commit -m "Add tunings CRUD to db module"
```

---

## Task 4: Styles CRUD

**Files:**
- Modify: `src/db.js`
- Modify: `src/tests/db.test.js`

- [ ] **Step 1: Write failing tests**

Append to `src/tests/db.test.js`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload. Expected: 2 new failures.

- [ ] **Step 3: Implement styles CRUD**

Append to `src/db.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Reload. Expected: "8 passed, 0 failed".

- [ ] **Step 5: Commit**

```bash
git add src/db.js src/tests/db.test.js
git commit -m "Add styles CRUD to db module"
```

---

## Task 5: Songs CRUD (no PDF yet)

**Files:**
- Modify: `src/db.js`
- Modify: `src/tests/db.test.js`

Songs use `crypto.randomUUID()` for their id (string). `dateAdded` is set automatically on insert.

- [ ] **Step 1: Write failing tests**

Append to `src/tests/db.test.js`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload. Expected: 5 new failures.

- [ ] **Step 3: Implement songs CRUD**

Append to `src/db.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Reload. Expected: "13 passed, 0 failed".

- [ ] **Step 5: Commit**

```bash
git add src/db.js src/tests/db.test.js
git commit -m "Add songs CRUD to db module"
```

---

## Task 6: Songs PDF blob round-trip

**Files:**
- Modify: `src/tests/db.test.js`

The existing `addSong` already accepts `pdfBlob` and `pdfFilename` because it spreads `fields`. This task verifies that blobs round-trip cleanly.

- [ ] **Step 1: Write failing test**

Append to `src/tests/db.test.js`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify it passes**

Reload. The test should already pass since `addSong` spreads any fields including `pdfBlob`. Expected: "14 passed, 0 failed". If it fails, the existing `addSong` is broken — fix it.

- [ ] **Step 3: Commit**

```bash
git add src/tests/db.test.js
git commit -m "Verify PDF blob round-trips through songs store"
```

---

## Task 7: Seed data on first run

**Files:**
- Create: `src/seed.js`
- Modify: `src/db.js`
- Modify: `src/tests/db.test.js`

`openDB` will call a `seedIfEmpty` helper after opening. If `tunings` is empty, seed both tunings and styles.

- [ ] **Step 1: Write failing tests**

Append to `src/tests/db.test.js`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload. Expected: 2 new failures (a fresh DB has 0 tunings).

- [ ] **Step 3: Create `src/seed.js` (data only — no imports, avoids circular dep with `db.js`)**

```javascript
// Seed data inserted on first run when the database is empty.
// Pure data — `db.js` reads these and inserts them.

export const SEED_TUNINGS = [
  { name: 'Open G',                     notation: 'gDGBD' },
  { name: 'Double C',                   notation: 'gCGCD' },
  { name: 'Sawmill / Mountain Modal',   notation: 'gDGCD' },
  { name: 'Double D',                   notation: 'f#DF#AD' },
  { name: 'Open D',                     notation: 'f#DF#AD' },
  { name: 'C tuning',                   notation: 'gCGBD' },
];

export const SEED_STYLES = [
  'Clawhammer',
  'Scruggs (3-finger)',
  'Melodic',
  'Frailing',
  'Old-time',
];
```

- [ ] **Step 4: Add `seedIfEmpty` and wire it into `openDB` in `src/db.js`**

At the top of `src/db.js`, just below the existing constants, add the import:

```javascript
import { SEED_TUNINGS, SEED_STYLES } from './seed.js';
```

Add this private function at the bottom of `src/db.js`:

```javascript
async function seedIfEmpty(db) {
  const existing = await getAllTunings(db);
  if (existing.length > 0) return;
  for (const t of SEED_TUNINGS) {
    await addTuning(db, { ...t, isSeed: true });
  }
  for (const name of SEED_STYLES) {
    await addStyle(db, { name, isSeed: true });
  }
}
```

Replace the existing `openDB` function with:

```javascript
export async function openDB(name = DEFAULT_DB_NAME) {
  const db = await new Promise((resolve, reject) => {
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
  await seedIfEmpty(db);
  return db;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Reload. Expected: "16 passed, 0 failed".

- [ ] **Step 6: Commit**

```bash
git add src/seed.js src/db.js src/tests/db.test.js
git commit -m "Seed initial tunings and styles on first run"
```

---

## Task 8: Render main view

**Files:**
- Create: `src/ui.js`
- Modify: `src/main.js`
- Modify: `styles.css`

Renders songs grouped into collapsible sections by tuning. Empty tunings render but collapsed.

- [ ] **Step 1: Create `src/ui.js`**

```javascript
// Rendering and event handlers. Reads the DOM via id, talks to db.js for data.
import { getAllTunings, getAllStyles, getAllSongs } from './db.js';

let dbHandle = null;

export function init(db) {
  dbHandle = db;
}

export async function renderApp() {
  const root = document.getElementById('app');
  const [tunings, styles, songs] = await Promise.all([
    getAllTunings(dbHandle),
    getAllStyles(dbHandle),
    getAllSongs(dbHandle),
  ]);

  const stylesById = new Map(styles.map((s) => [s.id, s]));
  const songsByTuning = new Map();
  for (const t of tunings) songsByTuning.set(t.id, []);
  for (const s of songs) {
    if (songsByTuning.has(s.tuningId)) songsByTuning.get(s.tuningId).push(s);
  }

  root.innerHTML = '';
  for (const tuning of tunings) {
    const tuningSongs = songsByTuning.get(tuning.id) || [];
    root.appendChild(renderTuningSection(tuning, tuningSongs, stylesById));
  }
}

function renderTuningSection(tuning, songs, stylesById) {
  const section = document.createElement('section');
  section.className = 'tuning-section';
  section.dataset.tuningId = String(tuning.id);

  const details = document.createElement('details');
  if (songs.length > 0) details.open = true;

  const summary = document.createElement('summary');
  summary.innerHTML = `
    <span class="tuning-name">${escapeHtml(tuning.name)}</span>
    <span class="tuning-notation">(${escapeHtml(tuning.notation)})</span>
    <span class="tuning-count">${songs.length} song${songs.length === 1 ? '' : 's'}</span>
  `;
  details.appendChild(summary);

  const list = document.createElement('ul');
  list.className = 'song-list';
  for (const song of songs) {
    list.appendChild(renderSongRow(song, stylesById));
  }
  details.appendChild(list);

  section.appendChild(details);
  return section;
}

function renderSongRow(song, stylesById) {
  const li = document.createElement('li');
  li.className = 'song-row';
  li.dataset.songId = song.id;

  const styleName = stylesById.get(song.styleId)?.name || '?';
  const capoText = song.capo && song.capo > 0 ? `capo ${song.capo}` : '';
  const keyText = song.key ? `key ${song.key}` : '';

  li.innerHTML = `
    <span class="song-name">${escapeHtml(song.name)}</span>
    <span class="song-style">${escapeHtml(styleName)}</span>
    ${capoText ? `<span class="song-capo">${escapeHtml(capoText)}</span>` : ''}
    ${keyText ? `<span class="song-key">${escapeHtml(keyText)}</span>` : ''}
  `;
  return li;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
```

- [ ] **Step 2: Wire `ui.js` into `main.js`**

Replace `src/main.js` with:

```javascript
import { openDB } from './db.js';
import { init, renderApp } from './ui.js';

const db = await openDB();
init(db);
await renderApp();
```

- [ ] **Step 3: Add styles for the tuning sections**

Append to `styles.css`:

```css
.tuning-section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.tuning-section summary {
  cursor: pointer;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-weight: 600;
}

.tuning-section .tuning-notation {
  font-family: ui-monospace, monospace;
  color: #666;
  font-weight: 400;
}

.tuning-section .tuning-count {
  margin-left: auto;
  font-weight: 400;
  color: #888;
  font-size: 0.85rem;
}

.song-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid #f0f0f0;
}

.song-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.song-row:last-child {
  border-bottom: none;
}

.song-name {
  font-weight: 500;
}

.song-style {
  font-size: 0.8rem;
  background: #eef;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  color: #335;
}

.song-capo,
.song-key {
  font-size: 0.85rem;
  color: #666;
}

#add-song-btn {
  font: inherit;
  padding: 0.4rem 0.9rem;
  border: 1px solid #2a6;
  background: #2a6;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

#add-song-btn:hover {
  background: #248;
  border-color: #248;
}
```

- [ ] **Step 4: Manual verification**

Reload `http://localhost:8000/index.html`. Expected: six tuning sections show (Open G, Double C, Sawmill / Mountain Modal, Double D, Open D, C tuning), each collapsed, each showing "0 songs". No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui.js src/main.js styles.css
git commit -m "Render songs grouped by tuning in collapsible sections"
```

---

## Task 9: Add Song modal — open and close

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/ui.js`
- Modify: `src/main.js`

Modal opens when `+ Add Song` is clicked; closes on Cancel, on backdrop click, or on Escape.

- [ ] **Step 1: Add modal markup to `index.html`**

In `index.html`, add the following inside `<body>`, just before the `<script>` tag:

```html
<dialog id="song-modal" class="modal">
  <form id="song-form" method="dialog">
    <h2 id="song-modal-title">Add Song</h2>

    <label>Name<span class="req">*</span>
      <input type="text" name="name" required>
    </label>

    <label>Tuning<span class="req">*</span>
      <select name="tuningId" required></select>
    </label>

    <label>Style<span class="req">*</span>
      <select name="styleId" required></select>
    </label>

    <label>Capo
      <input type="number" name="capo" min="0" max="12" step="1" placeholder="0">
    </label>

    <label>Key
      <input type="text" name="key" placeholder="G">
    </label>

    <label>Artist
      <input type="text" name="artist">
    </label>

    <label>Source
      <input type="text" name="source" placeholder="book, video, person…">
    </label>

    <label>PDF
      <input type="file" name="pdf" accept="application/pdf">
      <span id="pdf-current"></span>
    </label>

    <div class="modal-actions">
      <button type="button" id="modal-cancel">Cancel</button>
      <button type="submit" id="modal-save">Save</button>
    </div>
  </form>
</dialog>
```

- [ ] **Step 2: Add modal styles**

Append to `styles.css`:

```css
.modal {
  border: none;
  border-radius: 8px;
  padding: 0;
  width: min(90vw, 460px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.35);
}

.modal form {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal h2 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.modal label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #444;
  gap: 0.2rem;
}

.modal input,
.modal select {
  font: inherit;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modal .req {
  color: #c0392b;
  margin-left: 0.15rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.modal-actions button {
  font: inherit;
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ccc;
  background: #fff;
}

.modal-actions #modal-save {
  background: #2a6;
  color: white;
  border-color: #2a6;
}

#pdf-current {
  font-size: 0.8rem;
  color: #666;
}
```

- [ ] **Step 3: Add open/close logic to `ui.js`**

Append to `src/ui.js`:

```javascript
export async function openAddSongModal() {
  const modal = document.getElementById('song-modal');
  const form = document.getElementById('song-form');
  const title = document.getElementById('song-modal-title');
  const pdfCurrent = document.getElementById('pdf-current');

  form.reset();
  title.textContent = 'Add Song';
  pdfCurrent.textContent = '';

  await populateDropdowns();
  modal.showModal();
}

async function populateDropdowns() {
  const [tunings, styles] = await Promise.all([
    getAllTunings(dbHandle),
    getAllStyles(dbHandle),
  ]);
  const form = document.getElementById('song-form');
  const tuningSelect = form.elements.tuningId;
  const styleSelect = form.elements.styleId;

  tuningSelect.innerHTML = '<option value="">Select…</option>' +
    tunings.map((t) => `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.notation)})</option>`).join('');
  styleSelect.innerHTML = '<option value="">Select…</option>' +
    styles.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

export function bindModalControls() {
  const modal = document.getElementById('song-modal');
  const cancel = document.getElementById('modal-cancel');

  cancel.addEventListener('click', () => modal.close());

  modal.addEventListener('click', (e) => {
    // Click outside the form (on the backdrop) closes the dialog.
    if (e.target === modal) modal.close();
  });
}
```

- [ ] **Step 4: Wire the button in `main.js`**

Replace `src/main.js` with:

```javascript
import { openDB } from './db.js';
import { init, renderApp, openAddSongModal, bindModalControls } from './ui.js';

const db = await openDB();
init(db);
bindModalControls();
await renderApp();

document.getElementById('add-song-btn').addEventListener('click', () => {
  openAddSongModal();
});
```

- [ ] **Step 5: Manual verification**

Reload the app. Click `+ Add Song`. Expected: modal opens with empty form. Tuning dropdown lists the 6 seed tunings. Style dropdown lists the 5 seed styles. Click `Cancel` → modal closes. Click `+ Add Song` again, then click outside the form (on the dim backdrop) → modal closes. Press Escape → modal closes.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css src/ui.js src/main.js
git commit -m "Add song modal scaffolding with open/close behavior"
```

---

## Task 10: Add Song — submit and persist

**Files:**
- Modify: `src/ui.js`

The form's `Save` button validates, builds a song record (including reading any selected PDF as a Blob), calls `addSong`, closes the modal, and re-renders.

- [ ] **Step 1: Add the imports and submit handler in `src/ui.js`**

In `src/ui.js`, change the existing import line at the top:

```javascript
import { getAllTunings, getAllStyles, getAllSongs } from './db.js';
```

to:

```javascript
import { getAllTunings, getAllStyles, getAllSongs, addSong } from './db.js';
```

Append a submit handler to the bottom of `src/ui.js`:

```javascript
export function bindSubmitHandler() {
  const form = document.getElementById('song-form');
  const modal = document.getElementById('song-modal');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const pdfFile = data.get('pdf');
    const hasPdf = pdfFile instanceof File && pdfFile.size > 0;

    const fields = {
      name: data.get('name').trim(),
      tuningId: Number(data.get('tuningId')),
      styleId: Number(data.get('styleId')),
      capo: data.get('capo') ? Number(data.get('capo')) : null,
      key: data.get('key').trim() || null,
      artist: data.get('artist').trim() || null,
      source: data.get('source').trim() || null,
      pdfBlob: hasPdf ? pdfFile : null,
      pdfFilename: hasPdf ? pdfFile.name : null,
    };

    if (!fields.name || !fields.tuningId || !fields.styleId) return;

    await addSong(dbHandle, fields);
    modal.close();
    await renderApp();
  });
}
```

- [ ] **Step 2: Wire it in `main.js`**

Replace `src/main.js` with:

```javascript
import { openDB } from './db.js';
import {
  init,
  renderApp,
  openAddSongModal,
  bindModalControls,
  bindSubmitHandler,
} from './ui.js';

const db = await openDB();
init(db);
bindModalControls();
bindSubmitHandler();
await renderApp();

document.getElementById('add-song-btn').addEventListener('click', () => {
  openAddSongModal();
});
```

- [ ] **Step 3: Manual verification**

Reload the app. Click `+ Add Song`. Fill in: Name=`Cripple Creek`, Tuning=`Open G`, Style=`Clawhammer`, Capo=`2`, Key=`A`. Skip PDF for now. Click Save.

Expected: modal closes; the Open G section is open and shows "1 song" with "Cripple Creek" listed alongside a Clawhammer badge, "capo 2", "key A". Reload the page — the song is still there.

Now click `+ Add Song` again, fill in only required fields, attach a PDF, and save. Expected: another row appears. (We'll add the PDF link UI in Task 15.)

- [ ] **Step 4: Commit**

```bash
git add src/ui.js src/main.js
git commit -m "Persist new songs from the Add Song modal"
```

---

## Task 11: Add new tuning / style inline

**Files:**
- Modify: `src/ui.js`

Each dropdown ends with an `Add new…` option. Selecting it prompts the user, inserts the new entry, and re-selects it.

- [ ] **Step 1: Update imports**

In `src/ui.js`, change the import line to:

```javascript
import { getAllTunings, getAllStyles, getAllSongs, addSong, addTuning, addStyle } from './db.js';
```

- [ ] **Step 2: Replace `populateDropdowns`**

Find the existing `populateDropdowns` function in `src/ui.js` and replace it with:

```javascript
const ADD_NEW_VALUE = '__add_new__';

async function populateDropdowns(selectedTuningId = null, selectedStyleId = null) {
  const [tunings, styles] = await Promise.all([
    getAllTunings(dbHandle),
    getAllStyles(dbHandle),
  ]);
  const form = document.getElementById('song-form');
  const tuningSelect = form.elements.tuningId;
  const styleSelect = form.elements.styleId;

  tuningSelect.innerHTML = '<option value="">Select…</option>' +
    tunings.map((t) => `<option value="${t.id}"${t.id === selectedTuningId ? ' selected' : ''}>${escapeHtml(t.name)} (${escapeHtml(t.notation)})</option>`).join('') +
    `<option value="${ADD_NEW_VALUE}">+ Add new tuning…</option>`;

  styleSelect.innerHTML = '<option value="">Select…</option>' +
    styles.map((s) => `<option value="${s.id}"${s.id === selectedStyleId ? ' selected' : ''}>${escapeHtml(s.name)}</option>`).join('') +
    `<option value="${ADD_NEW_VALUE}">+ Add new style…</option>`;
}
```

- [ ] **Step 3: Bind change handlers in `bindModalControls`**

Replace the existing `bindModalControls` function with:

```javascript
export function bindModalControls() {
  const modal = document.getElementById('song-modal');
  const cancel = document.getElementById('modal-cancel');
  const form = document.getElementById('song-form');

  cancel.addEventListener('click', () => modal.close());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  form.elements.tuningId.addEventListener('change', async (e) => {
    if (e.target.value !== ADD_NEW_VALUE) return;
    const name = prompt('Name of new tuning (e.g. "Open G"):');
    if (!name || !name.trim()) {
      e.target.value = '';
      return;
    }
    const notation = prompt('Notation (e.g. "gDGBD"):') || '';
    const created = await addTuning(dbHandle, {
      name: name.trim(),
      notation: notation.trim(),
      isSeed: false,
    });
    await populateDropdowns(created.id, Number(form.elements.styleId.value) || null);
  });

  form.elements.styleId.addEventListener('change', async (e) => {
    if (e.target.value !== ADD_NEW_VALUE) return;
    const name = prompt('Name of new style (e.g. "Three-finger"):');
    if (!name || !name.trim()) {
      e.target.value = '';
      return;
    }
    const created = await addStyle(dbHandle, { name: name.trim(), isSeed: false });
    await populateDropdowns(Number(form.elements.tuningId.value) || null, created.id);
  });
}
```

- [ ] **Step 4: Manual verification**

Reload the app. Open the Add Song modal. In the Tuning dropdown, choose `+ Add new tuning…`. Enter `G Modal` and `gDGCD`. Expected: dropdown closes the prompt, the dropdown now lists "G Modal (gDGCD)" and has it selected.

Repeat for Style with name `Three-finger`. Expected: appears and is selected.

Cancel the modal. Open it again. Expected: the new tuning and style still appear in the dropdowns (persisted). Now press `+ Add new tuning…` and click Cancel on the prompt — dropdown should reset to the empty option.

After these checks, refresh the main view and add a song using the new tuning. Expected: a new "G Modal" section appears in the main list.

- [ ] **Step 5: Commit**

```bash
git add src/ui.js
git commit -m "Allow adding new tunings and styles from the Add Song dropdowns"
```

---

## Task 12: Song detail expand

**Files:**
- Modify: `src/ui.js`
- Modify: `styles.css`

Clicking a song row toggles an expanded detail panel showing all fields plus Edit and Delete buttons (buttons wired in next two tasks).

- [ ] **Step 1: Render the detail panel**

In `src/ui.js`, replace `renderSongRow` with:

```javascript
function renderSongRow(song, stylesById) {
  const li = document.createElement('li');
  li.className = 'song-row';
  li.dataset.songId = song.id;

  const styleName = stylesById.get(song.styleId)?.name || '?';
  const capoText = song.capo && song.capo > 0 ? `capo ${song.capo}` : '';
  const keyText = song.key ? `key ${song.key}` : '';

  li.innerHTML = `
    <button class="song-summary" type="button">
      <span class="song-name">${escapeHtml(song.name)}</span>
      <span class="song-style">${escapeHtml(styleName)}</span>
      ${capoText ? `<span class="song-capo">${escapeHtml(capoText)}</span>` : ''}
      ${keyText ? `<span class="song-key">${escapeHtml(keyText)}</span>` : ''}
    </button>
    <div class="song-detail" hidden>
      <dl>
        ${song.artist ? `<dt>Artist</dt><dd>${escapeHtml(song.artist)}</dd>` : ''}
        ${song.source ? `<dt>Source</dt><dd>${escapeHtml(song.source)}</dd>` : ''}
        <dt>Added</dt><dd>${escapeHtml(song.dateAdded.slice(0, 10))}</dd>
        ${song.pdfFilename ? `<dt>PDF</dt><dd>${escapeHtml(song.pdfFilename)}</dd>` : ''}
      </dl>
      <div class="song-actions">
        <button type="button" class="song-edit">Edit</button>
        <button type="button" class="song-delete">Delete</button>
      </div>
    </div>
  `;

  const summary = li.querySelector('.song-summary');
  const detail = li.querySelector('.song-detail');
  summary.addEventListener('click', () => {
    detail.hidden = !detail.hidden;
  });

  return li;
}
```

- [ ] **Step 2: Add styles for the detail panel**

Append to `styles.css`:

```css
.song-row {
  flex-direction: column;
  align-items: stretch;
  padding: 0;
}

.song-summary {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  width: 100%;
}

.song-summary:hover {
  background: #f5f5f5;
}

.song-detail {
  padding: 0.5rem 1rem 1rem;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.song-detail dl {
  margin: 0 0 0.6rem;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.2rem 0.75rem;
  font-size: 0.9rem;
}

.song-detail dt {
  color: #666;
}

.song-detail dd {
  margin: 0;
}

.song-actions {
  display: flex;
  gap: 0.5rem;
}

.song-actions button {
  font: inherit;
  padding: 0.3rem 0.7rem;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.song-actions .song-delete {
  border-color: #c0392b;
  color: #c0392b;
}
```

- [ ] **Step 3: Manual verification**

Reload the app. Click a song row. Expected: row expands to show Artist (if any), Source (if any), Added date, PDF filename (if any), and Edit/Delete buttons. Click again — collapses.

- [ ] **Step 4: Commit**

```bash
git add src/ui.js styles.css
git commit -m "Expand song rows to show details and action buttons"
```

---

## Task 13: Edit song

**Files:**
- Modify: `src/ui.js`
- Modify: `src/main.js`

The same modal serves both Add and Edit. When opened in edit mode, it pre-fills fields from a song record; on submit it calls `updateSong` instead of `addSong`.

- [ ] **Step 1: Update imports**

In `src/ui.js`, update the import line to:

```javascript
import { getAllTunings, getAllStyles, getAllSongs, getSong, addSong, updateSong, addTuning, addStyle } from './db.js';
```

- [ ] **Step 2: Track which song is being edited**

At the top of `src/ui.js`, just below `let dbHandle = null;`, add:

```javascript
let editingSongId = null;
```

- [ ] **Step 3: Replace `openAddSongModal` and add `openEditSongModal`**

Replace the existing `openAddSongModal` with:

```javascript
export async function openAddSongModal() {
  const modal = document.getElementById('song-modal');
  const form = document.getElementById('song-form');
  const title = document.getElementById('song-modal-title');
  const pdfCurrent = document.getElementById('pdf-current');

  editingSongId = null;
  form.reset();
  title.textContent = 'Add Song';
  pdfCurrent.textContent = '';

  await populateDropdowns();
  modal.showModal();
}

export async function openEditSongModal(songId) {
  const song = await getSong(dbHandle, songId);
  if (!song) return;

  const modal = document.getElementById('song-modal');
  const form = document.getElementById('song-form');
  const title = document.getElementById('song-modal-title');
  const pdfCurrent = document.getElementById('pdf-current');

  editingSongId = songId;
  form.reset();
  title.textContent = 'Edit Song';

  await populateDropdowns(song.tuningId, song.styleId);
  form.elements.name.value = song.name;
  form.elements.capo.value = song.capo ?? '';
  form.elements.key.value = song.key ?? '';
  form.elements.artist.value = song.artist ?? '';
  form.elements.source.value = song.source ?? '';
  pdfCurrent.textContent = song.pdfFilename ? `Current: ${song.pdfFilename}` : '';

  modal.showModal();
}
```

- [ ] **Step 4: Update the submit handler to branch on add vs edit**

Replace the existing `bindSubmitHandler` with:

```javascript
export function bindSubmitHandler() {
  const form = document.getElementById('song-form');
  const modal = document.getElementById('song-modal');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const pdfFile = data.get('pdf');
    const hasNewPdf = pdfFile instanceof File && pdfFile.size > 0;

    const fields = {
      name: data.get('name').trim(),
      tuningId: Number(data.get('tuningId')),
      styleId: Number(data.get('styleId')),
      capo: data.get('capo') ? Number(data.get('capo')) : null,
      key: data.get('key').trim() || null,
      artist: data.get('artist').trim() || null,
      source: data.get('source').trim() || null,
    };

    if (!fields.name || !fields.tuningId || !fields.styleId) return;

    if (editingSongId) {
      const updates = { ...fields };
      if (hasNewPdf) {
        updates.pdfBlob = pdfFile;
        updates.pdfFilename = pdfFile.name;
      }
      await updateSong(dbHandle, editingSongId, updates);
    } else {
      fields.pdfBlob = hasNewPdf ? pdfFile : null;
      fields.pdfFilename = hasNewPdf ? pdfFile.name : null;
      await addSong(dbHandle, fields);
    }

    modal.close();
    editingSongId = null;
    await renderApp();
  });
}
```

- [ ] **Step 5: Wire up Edit button clicks**

Append to `src/ui.js`:

```javascript
export function bindSongActions() {
  const root = document.getElementById('app');
  root.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.song-edit');
    if (editBtn) {
      const row = editBtn.closest('.song-row');
      if (row) openEditSongModal(row.dataset.songId);
    }
  });
}
```

- [ ] **Step 6: Wire `bindSongActions` in `main.js`**

Update `src/main.js` imports and call:

```javascript
import { openDB } from './db.js';
import {
  init,
  renderApp,
  openAddSongModal,
  bindModalControls,
  bindSubmitHandler,
  bindSongActions,
} from './ui.js';

const db = await openDB();
init(db);
bindModalControls();
bindSubmitHandler();
bindSongActions();
await renderApp();

document.getElementById('add-song-btn').addEventListener('click', () => {
  openAddSongModal();
});
```

- [ ] **Step 7: Manual verification**

Reload the app. Click a song to expand. Click `Edit`. Expected: modal opens with title "Edit Song" and all fields populated. Change Capo to a different number, click Save. Expected: modal closes, the song row reflects the new capo. Reload — change persists.

Edit a song without changing the PDF — keeps the old PDF filename in the detail panel. Edit a song and pick a new PDF — replaces it.

- [ ] **Step 8: Commit**

```bash
git add src/ui.js src/main.js
git commit -m "Edit existing songs through the same modal"
```

---

## Task 14: Delete song

**Files:**
- Modify: `src/ui.js`

- [ ] **Step 1: Update imports**

In `src/ui.js`, update the db import line to include `deleteSong`:

```javascript
import { getAllTunings, getAllStyles, getAllSongs, getSong, addSong, updateSong, deleteSong, addTuning, addStyle } from './db.js';
```

- [ ] **Step 2: Extend `bindSongActions`**

Replace `bindSongActions` with:

```javascript
export function bindSongActions() {
  const root = document.getElementById('app');
  root.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.song-edit');
    if (editBtn) {
      const row = editBtn.closest('.song-row');
      if (row) await openEditSongModal(row.dataset.songId);
      return;
    }

    const deleteBtn = e.target.closest('.song-delete');
    if (deleteBtn) {
      const row = deleteBtn.closest('.song-row');
      if (!row) return;
      const nameEl = row.querySelector('.song-name');
      const name = nameEl ? nameEl.textContent : 'this song';
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      await deleteSong(dbHandle, row.dataset.songId);
      await renderApp();
      return;
    }
  });
}
```

- [ ] **Step 3: Manual verification**

Reload the app. Expand a song. Click `Delete`. A confirmation dialog appears with the song name. Click Cancel — nothing happens. Click Delete again, then OK. Expected: song disappears, tuning's count decreases. Reload — song is still gone.

- [ ] **Step 4: Commit**

```bash
git add src/ui.js
git commit -m "Allow deleting songs with confirmation"
```

---

## Task 15: View PDF (open in new tab)

**Files:**
- Modify: `src/ui.js`

When a song has a PDF, render a "PDF ↗" link in the row summary that opens the PDF in a new tab.

- [ ] **Step 1: Add a PDF link to song rows**

In `src/ui.js`, replace `renderSongRow` with:

```javascript
function renderSongRow(song, stylesById) {
  const li = document.createElement('li');
  li.className = 'song-row';
  li.dataset.songId = song.id;

  const styleName = stylesById.get(song.styleId)?.name || '?';
  const capoText = song.capo && song.capo > 0 ? `capo ${song.capo}` : '';
  const keyText = song.key ? `key ${song.key}` : '';

  li.innerHTML = `
    <button class="song-summary" type="button">
      <span class="song-name">${escapeHtml(song.name)}</span>
      <span class="song-style">${escapeHtml(styleName)}</span>
      ${capoText ? `<span class="song-capo">${escapeHtml(capoText)}</span>` : ''}
      ${keyText ? `<span class="song-key">${escapeHtml(keyText)}</span>` : ''}
      ${song.pdfBlob ? `<span class="song-pdf-link" data-action="open-pdf">PDF ↗</span>` : ''}
    </button>
    <div class="song-detail" hidden>
      <dl>
        ${song.artist ? `<dt>Artist</dt><dd>${escapeHtml(song.artist)}</dd>` : ''}
        ${song.source ? `<dt>Source</dt><dd>${escapeHtml(song.source)}</dd>` : ''}
        <dt>Added</dt><dd>${escapeHtml(song.dateAdded.slice(0, 10))}</dd>
        ${song.pdfFilename ? `<dt>PDF</dt><dd>${escapeHtml(song.pdfFilename)}</dd>` : ''}
      </dl>
      <div class="song-actions">
        <button type="button" class="song-edit">Edit</button>
        <button type="button" class="song-delete">Delete</button>
      </div>
    </div>
  `;

  const summary = li.querySelector('.song-summary');
  const detail = li.querySelector('.song-detail');
  summary.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="open-pdf"]')) return;
    detail.hidden = !detail.hidden;
  });

  return li;
}
```

- [ ] **Step 2: Add CSS for the PDF link**

Append to `styles.css`:

```css
.song-pdf-link {
  margin-left: auto;
  font-size: 0.85rem;
  color: #2a6;
  text-decoration: underline;
  cursor: pointer;
}

.song-pdf-link:hover {
  color: #1a4;
}
```

- [ ] **Step 3: Handle the click in `bindSongActions`**

In `src/ui.js`, replace `bindSongActions` with:

```javascript
export function bindSongActions() {
  const root = document.getElementById('app');
  root.addEventListener('click', async (e) => {
    const pdfTrigger = e.target.closest('[data-action="open-pdf"]');
    if (pdfTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const row = pdfTrigger.closest('.song-row');
      if (row) await openPdfForSong(row.dataset.songId);
      return;
    }

    const editBtn = e.target.closest('.song-edit');
    if (editBtn) {
      const row = editBtn.closest('.song-row');
      if (row) await openEditSongModal(row.dataset.songId);
      return;
    }

    const deleteBtn = e.target.closest('.song-delete');
    if (deleteBtn) {
      const row = deleteBtn.closest('.song-row');
      if (!row) return;
      const nameEl = row.querySelector('.song-name');
      const name = nameEl ? nameEl.textContent : 'this song';
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      await deleteSong(dbHandle, row.dataset.songId);
      await renderApp();
      return;
    }
  });
}

async function openPdfForSong(songId) {
  const song = await getSong(dbHandle, songId);
  if (!song || !song.pdfBlob) return;
  const url = URL.createObjectURL(song.pdfBlob);
  window.open(url, '_blank');
  // Revoke after a delay so the new tab has time to load.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
```

- [ ] **Step 4: Manual verification**

Reload the app. For a song with a PDF attached, expected: a "PDF ↗" link sits at the right end of the row. Click it: a new tab opens showing the PDF. Click the rest of the row: row expands without opening a PDF. For a song without a PDF, no link is shown.

- [ ] **Step 5: Commit**

```bash
git add src/ui.js styles.css
git commit -m "Open attached PDFs in a new browser tab"
```

---

## Task 16: Request persistent storage

**Files:**
- Modify: `src/main.js`
- Modify: `index.html`
- Modify: `styles.css`

After the database opens, ask the browser for persistent storage. If denied, show a one-time dismissible banner.

- [ ] **Step 1: Add the banner element to `index.html`**

In `index.html`, just inside `<body>` (above `<header>`), add:

```html
<div id="persistence-banner" class="banner" hidden>
  <span>Browser storage is not marked persistent — your data could be cleared if disk space gets low.</span>
  <button type="button" id="dismiss-banner">Dismiss</button>
</div>
```

- [ ] **Step 2: Style the banner**

Append to `styles.css`:

```css
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1.5rem;
  background: #fff7d6;
  border-bottom: 1px solid #ead27f;
  font-size: 0.9rem;
}

.banner button {
  font: inherit;
  background: none;
  border: 1px solid #ad8a00;
  color: #6b5500;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}
```

- [ ] **Step 3: Wire persistence request and banner in `main.js`**

Replace `src/main.js` with:

```javascript
import { openDB } from './db.js';
import {
  init,
  renderApp,
  openAddSongModal,
  bindModalControls,
  bindSubmitHandler,
  bindSongActions,
} from './ui.js';

const PERSISTENCE_NOTICE_KEY = 'banjo_tracker:persistence_notice_dismissed';

const db = await openDB();
init(db);
bindModalControls();
bindSubmitHandler();
bindSongActions();
await renderApp();

document.getElementById('add-song-btn').addEventListener('click', () => {
  openAddSongModal();
});

await maybeRequestPersistence();

async function maybeRequestPersistence() {
  if (!navigator.storage || typeof navigator.storage.persist !== 'function') return;
  if (localStorage.getItem(PERSISTENCE_NOTICE_KEY) === 'true') return;

  const alreadyPersistent = await navigator.storage.persisted();
  if (alreadyPersistent) return;

  const granted = await navigator.storage.persist();
  if (granted) return;

  const banner = document.getElementById('persistence-banner');
  banner.hidden = false;
  document.getElementById('dismiss-banner').addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem(PERSISTENCE_NOTICE_KEY, 'true');
  });
}
```

- [ ] **Step 4: Manual verification**

Reload the app. Browsers handle this differently:
- Chrome usually grants automatically once data exists or denies silently. If denied, the yellow banner appears.
- Firefox may prompt the user.
- If denied, click `Dismiss`. Reload — the banner does not return.

If you want to re-test the banner, run `localStorage.removeItem('banjo_tracker:persistence_notice_dismissed')` in the browser console and reload.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css src/main.js
git commit -m "Request persistent storage and warn if denied"
```

---

## Task 17: Toast notifications and PDF size warning

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/ui.js`

A small toast surfaces unexpected errors (mostly storage failures) without taking the user out of the form. The PDF picker warns inline when the selected file exceeds 25 MB.

- [ ] **Step 1: Add the toast container to `index.html`**

In `index.html`, add this just before the closing `</body>` tag (after the `<dialog>` element):

```html
<div id="toast" class="toast" hidden></div>
```

And add a hint span next to the PDF input. In the existing `<dialog id="song-modal">`, replace the PDF label with:

```html
    <label>PDF
      <input type="file" name="pdf" accept="application/pdf">
      <span id="pdf-current"></span>
      <span id="pdf-size-warning" class="form-warning" hidden></span>
    </label>
```

- [ ] **Step 2: Style the toast and warning**

Append to `styles.css`:

```css
.toast {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: #2a2a2a;
  color: white;
  padding: 0.65rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  max-width: 90vw;
}

.toast.error {
  background: #c0392b;
}

.form-warning {
  color: #b7791f;
  font-size: 0.8rem;
}
```

- [ ] **Step 3: Add the toast helper and size warning to `src/ui.js`**

Append to `src/ui.js`:

```javascript
const PDF_SIZE_WARNING_BYTES = 25 * 1024 * 1024;
let toastTimer = null;

export function toast(message, { error = false, durationMs = 4000 } = {}) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.toggle('error', !!error);
  el.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, durationMs);
}

export function bindPdfSizeWarning() {
  const form = document.getElementById('song-form');
  const warning = document.getElementById('pdf-size-warning');
  form.elements.pdf.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.size > PDF_SIZE_WARNING_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      warning.textContent = `Heads up: ${mb} MB is large; browser storage may struggle.`;
      warning.hidden = false;
    } else {
      warning.hidden = true;
      warning.textContent = '';
    }
  });
}
```

- [ ] **Step 4: Wrap the submit handler in try/catch**

Replace the existing `bindSubmitHandler` with:

```javascript
export function bindSubmitHandler() {
  const form = document.getElementById('song-form');
  const modal = document.getElementById('song-modal');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const pdfFile = data.get('pdf');
    const hasNewPdf = pdfFile instanceof File && pdfFile.size > 0;

    const fields = {
      name: data.get('name').trim(),
      tuningId: Number(data.get('tuningId')),
      styleId: Number(data.get('styleId')),
      capo: data.get('capo') ? Number(data.get('capo')) : null,
      key: data.get('key').trim() || null,
      artist: data.get('artist').trim() || null,
      source: data.get('source').trim() || null,
    };

    if (!fields.name || !fields.tuningId || !fields.styleId) return;

    try {
      if (editingSongId) {
        const updates = { ...fields };
        if (hasNewPdf) {
          updates.pdfBlob = pdfFile;
          updates.pdfFilename = pdfFile.name;
        }
        await updateSong(dbHandle, editingSongId, updates);
      } else {
        fields.pdfBlob = hasNewPdf ? pdfFile : null;
        fields.pdfFilename = hasNewPdf ? pdfFile.name : null;
        await addSong(dbHandle, fields);
      }

      modal.close();
      editingSongId = null;
      await renderApp();
    } catch (err) {
      console.error('Failed to save song:', err);
      toast(`Could not save: ${err.message}`, { error: true });
      // Modal stays open so the user can retry without re-entering data.
    }
  });
}
```

- [ ] **Step 5: Wire `bindPdfSizeWarning` in `main.js`**

Update `src/main.js`:

```javascript
import { openDB } from './db.js';
import {
  init,
  renderApp,
  openAddSongModal,
  bindModalControls,
  bindSubmitHandler,
  bindSongActions,
  bindPdfSizeWarning,
} from './ui.js';

const PERSISTENCE_NOTICE_KEY = 'banjo_tracker:persistence_notice_dismissed';

const db = await openDB();
init(db);
bindModalControls();
bindSubmitHandler();
bindSongActions();
bindPdfSizeWarning();
await renderApp();

document.getElementById('add-song-btn').addEventListener('click', () => {
  openAddSongModal();
});

await maybeRequestPersistence();

async function maybeRequestPersistence() {
  if (!navigator.storage || typeof navigator.storage.persist !== 'function') return;
  if (localStorage.getItem(PERSISTENCE_NOTICE_KEY) === 'true') return;

  const alreadyPersistent = await navigator.storage.persisted();
  if (alreadyPersistent) return;

  const granted = await navigator.storage.persist();
  if (granted) return;

  const banner = document.getElementById('persistence-banner');
  banner.hidden = false;
  document.getElementById('dismiss-banner').addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem(PERSISTENCE_NOTICE_KEY, 'true');
  });
}
```

- [ ] **Step 6: Manual verification**

Reload the app. Open Add Song. Pick a small PDF — no warning. Pick a large PDF (>25 MB; you can fabricate one with `dd if=/dev/zero of=big.pdf bs=1m count=30` if needed) — yellow warning appears under the file input. The form still submits successfully (warning is informational, not blocking).

To verify the toast: in the browser devtools, run `window.dispatchEvent(new Event('error'))` is not enough — instead, simulate a storage failure by, before clicking Save, opening DevTools → Application → IndexedDB and deleting the `banjo_tracker` database. Then submit the modal. Expected: a red toast appears at the bottom with the error, modal stays open. (After verifying, reload the page so the database is recreated.)

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css src/ui.js src/main.js
git commit -m "Add toast notifications and 25 MB PDF size warning"
```

---

## Task 18: Final styling pass

**Files:**
- Modify: `styles.css`

A small polish round: tighten spacing, improve dialog typography, ensure the layout holds at narrow widths.

- [ ] **Step 1: Append polish CSS**

Append to `styles.css`:

```css
body {
  min-height: 100vh;
}

#app {
  max-width: 760px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  .app-header {
    padding: 0.75rem 1rem;
  }
  #app {
    padding: 1rem;
  }
  .song-summary {
    flex-wrap: wrap;
  }
  .song-pdf-link {
    margin-left: 0;
  }
}

.tuning-section summary::-webkit-details-marker {
  color: #999;
}
```

- [ ] **Step 2: Manual verification**

Reload at full width — content is centered with comfortable margins. Resize the browser to a narrow width — header collapses cleanly, song rows wrap, PDF link stays accessible.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Polish layout and responsive breakpoints"
```

---

## Done

At this point the app is feature-complete against the spec:

- Songs stored in IndexedDB, grouped by tuning in collapsible sections
- Add / edit / delete songs through a single modal
- Tuning and style hybrid dropdowns (seed list + add new)
- PDF upload, stored as a blob, opens in a new tab
- All data persists across reloads; persistent storage requested
- A separate `tests.html` runs the full db.js test suite

Try it: load `index.html`, add a few songs, attach PDFs, refresh the page, restart the browser. Everything should still be there.
