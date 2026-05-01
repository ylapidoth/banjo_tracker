# Export Feature + UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the JSON export feature, plus three small follow-ups requested alongside it: fix the broken dismiss button on the persistence banner, shrink the song-name font slightly, and surface the artist as a subtitle under the song name.

**Architecture:** Polish tasks are localized CSS/JS edits in existing files. The export feature adds one new module (`src/export.js`) that owns the format and download trigger; the existing `downloadBlob` helper from `src/ui.js` is exported for reuse.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), IndexedDB. No build step.

**Spec (export feature only):** [docs/superpowers/specs/2026-05-02-export-feature-design.md](../specs/2026-05-02-export-feature-design.md)

**Setup note:** Run `python3 -m http.server 8000` from the project root and open `http://localhost:8000/tests.html` to run tests. Browser ES module loading requires a server; `file://` won't work in Chrome.

---

## Task 1: Fix persistence-banner dismiss bug

**Files:**
- Modify: `styles.css`

The `.banner` rule sets `display: flex`, which (as an author-stylesheet rule) overrides the user-agent `[hidden] { display: none }` rule. Result: setting `banner.hidden = true` in JS doesn't visually hide it.

Fix is one CSS rule that re-asserts `display: none` for the hidden state on the banner.

- [ ] **Step 1: Append a hidden-state rule next to the existing `.banner` rule**

In `styles.css`, find the existing `.banner` block (currently around line 270). Immediately after it (before the `.banner button` rule), add:

```css
.banner[hidden] {
  display: none;
}
```

The full sequence after the edit should read:

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

.banner[hidden] {
  display: none;
}

.banner button {
  ...
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "Fix persistence banner dismiss not hiding the banner"
```

---

## Task 2: Shrink song name and add artist subtitle

**Files:**
- Modify: `src/ui.js`
- Modify: `styles.css`

The song name in each row currently uses default 1rem (same as the tuning section header). Shrink it slightly. When a song has an artist, show it as a smaller, lighter subtitle directly under the name. Detail panel still shows artist (no change there).

- [ ] **Step 1: Update `renderSongRow` in `src/ui.js`**

Find the existing `renderSongRow` function. Replace it with this version, which wraps the name in a `<span class="song-title">` and conditionally adds a `<span class="song-artist">` subtitle:

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
      <span class="song-title">
        <span class="song-name">${escapeHtml(song.name)}</span>
        ${song.artist ? `<span class="song-artist">${escapeHtml(song.artist)}</span>` : ''}
      </span>
      <span class="song-style">${escapeHtml(styleName)}</span>
      ${capoText ? `<span class="song-capo">${escapeHtml(capoText)}</span>` : ''}
      ${keyText ? `<span class="song-key">${escapeHtml(keyText)}</span>` : ''}
      ${song.link ? `<span class="song-link" data-action="open-link">Link ↗</span>` : ''}
      ${song.tefBlob ? `<span class="song-tef-link" data-action="open-tef">TEF ↓</span>` : ''}
      ${song.pdfBlob ? `<span class="song-pdf-link" data-action="open-pdf">PDF ↗</span>` : ''}
    </button>
    <div class="song-detail" hidden>
      <dl>
        ${song.artist ? `<dt>Artist</dt><dd>${escapeHtml(song.artist)}</dd>` : ''}
        ${song.source ? `<dt>Source</dt><dd>${escapeHtml(song.source)}</dd>` : ''}
        ${song.link ? `<dt>Link</dt><dd><a href="${escapeHtml(song.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(song.link)} ↗</a></dd>` : ''}
        <dt>Added</dt><dd>${escapeHtml(song.dateAdded.slice(0, 10))}</dd>
        ${song.pdfFilename ? `<dt>PDF</dt><dd>${escapeHtml(song.pdfFilename)}</dd>` : ''}
        ${song.tefFilename ? `<dt>TEF</dt><dd>${escapeHtml(song.tefFilename)}</dd>` : ''}
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
    if (e.target.closest('[data-action="open-pdf"], [data-action="open-tef"], [data-action="open-link"]')) return;
    detail.hidden = !detail.hidden;
  });

  return li;
}
```

The only changes from the previous version: the `song-name` is now wrapped in a `song-title` container, and the optional `song-artist` subtitle is rendered inside the same container.

- [ ] **Step 2: Verify syntax**

```bash
node --check src/ui.js
```

- [ ] **Step 3: Update CSS in `styles.css`**

Find the existing `.song-name` rule. Replace it (and add new `.song-title` and `.song-artist` rules) with:

```css
.song-title {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.song-name {
  font-weight: 500;
  font-size: 0.95rem;
}

.song-artist {
  font-size: 0.8rem;
  color: #666;
  font-weight: 400;
}
```

`.song-title` keeps the name and artist stacked vertically inside a single flex item, so the rest of the row's flex layout (style badge, capo, key, attachment badges) is unchanged. The `inline-flex` plus `align-items: flex-start` keeps the subtitle left-aligned and lets `line-height: 1.2` tighten the spacing between the two lines.

- [ ] **Step 4: Commit**

```bash
git add src/ui.js styles.css
git commit -m "Add artist subtitle and shrink song name in row"
```

---

## Task 3: Export — unit tests for `buildExport` (TDD)

**Files:**
- Create: `src/tests/export.test.js`
- Modify: `src/tests/index.js`

Tests will fail because `buildExport` doesn't exist yet. Task 4 implements it.

- [ ] **Step 1: Create `src/tests/export.test.js`**

```javascript
import { test, assert, assertEq } from './runner.js';
import { openDB, addSong } from '../db.js';
import { buildExport } from '../export.js';

async function withFreshDB(fn) {
  const name = 'banjo_test_' + crypto.randomUUID();
  const db = await openDB(name);
  try {
    await fn(db);
  } finally {
    db.close();
    await new Promise((resolve) => {
      const r = indexedDB.deleteDatabase(name);
      r.onsuccess = r.onerror = r.onblocked = () => resolve();
    });
  }
}

const SAMPLE_SONG = {
  name: 'Cripple Creek',
  tuningId: 1,
  styleId: 1,
  capo: 2,
  key: 'A',
  artist: '',
  source: '',
};

test('export: empty database yields shape with seeded tunings/styles and no songs', async () => {
  await withFreshDB(async (db) => {
    const out = await buildExport(db);
    assertEq(out.schemaVersion, 1);
    assert(typeof out.exportedAt === 'string', 'exportedAt should be a string');
    assert(Array.isArray(out.tunings), 'tunings should be an array');
    assert(Array.isArray(out.styles), 'styles should be an array');
    assert(Array.isArray(out.songs), 'songs should be an array');
    assertEq(out.songs.length, 0);
    assert(out.tunings.length >= 5, `expected at least 5 seeded tunings, got ${out.tunings.length}`);
    assert(out.styles.length >= 4, `expected at least 4 seeded styles, got ${out.styles.length}`);
  });
});

test('export: encodes a PDF blob to base64 that decodes to the original bytes', async () => {
  await withFreshDB(async (db) => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    await addSong(db, {
      ...SAMPLE_SONG,
      pdfBlob: new Blob([bytes], { type: 'application/pdf' }),
      pdfFilename: 'tab.pdf',
    });
    const out = await buildExport(db);
    assertEq(out.songs.length, 1);
    const exported = out.songs[0];
    assert(exported.pdf, 'pdf object should exist');
    assertEq(exported.pdf.filename, 'tab.pdf');
    assertEq(exported.pdf.mimeType, 'application/pdf');
    const decoded = Uint8Array.from(atob(exported.pdf.data), (c) => c.charCodeAt(0));
    assertEq(Array.from(decoded), [0x25, 0x50, 0x44, 0x46]);
  });
});

test('export: encodes a TEF blob to base64 that decodes to the original bytes', async () => {
  await withFreshDB(async (db) => {
    const bytes = new Uint8Array([0xfe, 0xed, 0xfa, 0xce]);
    await addSong(db, {
      ...SAMPLE_SONG,
      tefBlob: new Blob([bytes], { type: 'application/octet-stream' }),
      tefFilename: 'tab.tef',
    });
    const out = await buildExport(db);
    const exported = out.songs[0];
    assert(exported.tef, 'tef object should exist');
    assertEq(exported.tef.filename, 'tab.tef');
    assertEq(exported.tef.mimeType, 'application/octet-stream');
    const decoded = Uint8Array.from(atob(exported.tef.data), (c) => c.charCodeAt(0));
    assertEq(Array.from(decoded), [0xfe, 0xed, 0xfa, 0xce]);
  });
});

test('export: omits pdf/tef keys when the song has no attachments', async () => {
  await withFreshDB(async (db) => {
    await addSong(db, SAMPLE_SONG);
    const out = await buildExport(db);
    const exported = out.songs[0];
    assertEq('pdf' in exported, false);
    assertEq('tef' in exported, false);
  });
});
```

- [ ] **Step 2: Wire it into the test index**

In `src/tests/index.js`, add the import line after the existing `import './db.test.js';` line. The full file should read:

```javascript
import { run, test, assertEq } from './runner.js';
import './db.test.js';
import './export.test.js';

test('runner: smoke test passes', () => {
  assertEq(1 + 1, 2);
});

await run();
```

- [ ] **Step 3: Verify syntax**

```bash
node --check src/tests/export.test.js
node --check src/tests/index.js
```

Both should exit 0. (The actual test failures only manifest when the browser runs them; `node --check` validates syntax only.)

- [ ] **Step 4: Commit**

```bash
git add src/tests/export.test.js src/tests/index.js
git commit -m "Add failing tests for buildExport"
```

---

## Task 4: Implement `buildExport` and `blobToBase64`

**Files:**
- Create: `src/export.js`

The pure function half of the feature. No DOM, no download — just reads from the database and returns a JSON-serializable object. Tests from Task 3 should pass after this.

- [ ] **Step 1: Create `src/export.js`**

```javascript
// Export the entire banjo tracker database to a self-contained JSON object.
// Pure logic lives in `buildExport`; `exportToFile` (added in Task 5) handles
// JSON-stringify and download.
import { getAllTunings, getAllStyles, getAllSongs } from './db.js';

export const SCHEMA_VERSION = 1;

export async function buildExport(db) {
  const [tunings, styles, songs] = await Promise.all([
    getAllTunings(db),
    getAllStyles(db),
    getAllSongs(db),
  ]);

  const exportedSongs = await Promise.all(songs.map(serializeSong));

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tunings,
    styles,
    songs: exportedSongs,
  };
}

async function serializeSong(song) {
  const { pdfBlob, pdfFilename, tefBlob, tefFilename, ...rest } = song;
  const out = { ...rest };
  if (pdfBlob instanceof Blob) {
    out.pdf = {
      filename: pdfFilename || 'tab.pdf',
      mimeType: pdfBlob.type || 'application/pdf',
      data: await blobToBase64(pdfBlob),
    };
  }
  if (tefBlob instanceof Blob) {
    out.tef = {
      filename: tefFilename || 'tab.tef',
      mimeType: tefBlob.type || 'application/octet-stream',
      data: await blobToBase64(tefBlob),
    };
  }
  return out;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Result is a data URL like "data:application/pdf;base64,JVBERi0…"
      // Strip the prefix; we keep the mimeType separately.
      const result = reader.result;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
```

- [ ] **Step 2: Verify syntax**

```bash
node --check src/export.js
```

- [ ] **Step 3: Commit**

```bash
git add src/export.js
git commit -m "Implement buildExport with base64-encoded attachments"
```

(The browser tests now pass — controller will verify.)

---

## Task 5: Implement `exportToFile` and reuse `downloadBlob`

**Files:**
- Modify: `src/export.js`
- Modify: `src/ui.js`

Add the side-effect: serialize the export object to JSON, wrap it in a Blob, and trigger a download. Reuse `downloadBlob` from `src/ui.js` by exporting it.

- [ ] **Step 1: Export `downloadBlob` from `src/ui.js`**

In `src/ui.js`, find the existing `downloadBlob` function (currently `function downloadBlob(blob, filename)` with no `export` keyword). Add the `export` keyword in front. The full updated declaration should read:

```javascript
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a delay so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
```

(The body is unchanged — only the `function` is now `export function`.)

- [ ] **Step 2: Add `exportToFile` to `src/export.js`**

Two edits inside `src/export.js`:

(a) Add a new import line just below the existing `import { getAllTunings, getAllStyles, getAllSongs } from './db.js';` at the top:

```javascript
import { downloadBlob } from './ui.js';
```

(b) Append the new functions at the bottom of the file (after `blobToBase64`):

```javascript
export async function exportToFile(db) {
  const data = await buildExport(db);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, exportFilename(new Date()));
}

export function exportFilename(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `banjo_tracker_${yyyy}-${mm}-${dd}.json`;
}
```

`exportFilename` is split out so it's pure and easy to verify locally if needed. It uses local date components (`getFullYear`, `getMonth`, `getDate`) so the filename matches the user's calendar day.

- [ ] **Step 3: Verify syntax**

```bash
node --check src/export.js
node --check src/ui.js
```

- [ ] **Step 4: Commit**

```bash
git add src/export.js src/ui.js
git commit -m "Add exportToFile that writes JSON and triggers download"
```

---

## Task 6: Add the Export button to the header

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

Add a button before the existing `+ Add Song` and give it neutral styling so it's visually distinct from the green primary action.

- [ ] **Step 1: Add the button to `index.html`**

Find the existing header:

```html
  <header class="app-header">
    <h1>Banjo Tracker</h1>
    <button id="add-song-btn" type="button">+ Add Song</button>
  </header>
```

Replace it with:

```html
  <header class="app-header">
    <h1>Banjo Tracker</h1>
    <div class="app-header-actions">
      <button id="export-btn" type="button">Export</button>
      <button id="add-song-btn" type="button">+ Add Song</button>
    </div>
  </header>
```

The wrapper `<div class="app-header-actions">` keeps the two buttons grouped together at the right edge of the header.

- [ ] **Step 2: Add CSS**

In `styles.css`, find the existing `#add-song-btn` rules. Just below them (or immediately after the closing brace of `#add-song-btn:hover`), append:

```css
.app-header-actions {
  display: flex;
  gap: 0.5rem;
}

#export-btn {
  font: inherit;
  padding: 0.4rem 0.9rem;
  border: 1px solid #ccc;
  background: #fff;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
}

#export-btn:hover {
  background: #f5f5f5;
}
```

The button reuses the layout values from `#add-song-btn` (same padding, font-size via `font: inherit`, same border-radius) but with a neutral white-on-grey palette so it reads as secondary.

- [ ] **Step 3: Commit**

```bash
git add index.html styles.css
git commit -m "Add Export button to header alongside Add Song"
```

---

## Task 7: Wire the Export button click

**Files:**
- Modify: `src/main.js`

Hook the button to `exportToFile`. Wrap in try/catch and toast errors via the existing helper.

- [ ] **Step 1: Update `src/main.js`**

Replace the existing file contents with:

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
  toast,
} from './ui.js';
import { exportToFile } from './export.js';

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

document.getElementById('export-btn').addEventListener('click', async () => {
  try {
    await exportToFile(db);
  } catch (err) {
    console.error('Export failed:', err);
    toast(`Export failed: ${err.message}`, { error: true });
  }
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

The only changes from the previous version: `toast` added to the imports from `./ui.js`, `exportToFile` imported from `./export.js`, and a new click handler on `#export-btn`.

- [ ] **Step 2: Verify syntax**

```bash
node --check src/main.js
```

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "Wire Export button to download JSON"
```

---

## Done

After Task 7, every requested item is shipped:

1. Persistence-banner dismiss now actually hides the banner.
2. Song name is `0.95rem` (smaller than the `1rem` tuning header), with the artist as an `0.8rem` subtitle when present.
3. Export button in the header writes `banjo_tracker_YYYY-MM-DD.json` containing all tunings, styles, and songs (with PDF and TEF base64-encoded inline).

Controller verification:

1. `python3 -m http.server 8000` from the project root.
2. Open `tests.html` and confirm 23 tests pass (16 from v1 + 3 link/TEF + 4 export).
3. Open `index.html`. Add a song with an artist set; the artist should appear as a smaller, lighter line under the name. Tuning headers should look slightly larger than song names.
4. If the persistence banner is showing, click Dismiss — it should disappear and stay gone after reload.
5. Click Export — a `banjo_tracker_2026-MM-DD.json` should download. Open it: pretty-printed JSON with `schemaVersion: 1`, the seeded tunings/styles, your songs (with `pdf` / `tef` objects on songs that have attachments), and `exportedAt` set to the current UTC timestamp.
