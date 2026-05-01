# Add Link Field and TEF Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional URL and an optional TEF (TablEdit) file attachment per song, alongside the existing optional PDF.

**Architecture:** Pure additions on top of the v1 codebase. The IndexedDB layer (`src/db.js`) needs no changes — the existing `addSong`/`updateSong` already spread arbitrary fields onto records. All work is in `index.html` (form inputs), `src/ui.js` (lifecycle, render, click routing), `styles.css` (badge styling), and `src/tests/db.test.js` (round-trip tests for the new fields).

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), IndexedDB. No build step.

**Spec:** [docs/superpowers/specs/2026-05-01-add-link-and-tef-design.md](../specs/2026-05-01-add-link-and-tef-design.md)

**Setup note:** Run `python3 -m http.server 8000` from the project root and open `http://localhost:8000/tests.html` to run tests. Browser ES module loading requires a server; `file://` won't work in Chrome.

---

## Task 1: DB round-trip tests for `link` and TEF

**Files:**
- Modify: `src/tests/db.test.js`

These tests lock in that the new fields persist correctly. The existing `addSong`/`updateSong` already spread arbitrary fields, so the implementation in `db.js` requires no change. The tests document the contract.

- [ ] **Step 1: Append three new tests to `src/tests/db.test.js`**

```javascript
test('songs: link round-trips through the database', async () => {
  await withFreshDB(async (db) => {
    const inserted = await addSong(db, {
      ...SAMPLE_SONG,
      link: 'https://www.youtube.com/watch?v=abc123',
    });
    const fetched = await getSong(db, inserted.id);
    assertEq(fetched.link, 'https://www.youtube.com/watch?v=abc123');
  });
});

test('songs: updating a song to clear link works', async () => {
  await withFreshDB(async (db) => {
    const inserted = await addSong(db, {
      ...SAMPLE_SONG,
      link: 'https://example.com/x',
    });
    await updateSong(db, inserted.id, { link: null });
    const fetched = await getSong(db, inserted.id);
    assertEq(fetched.link, null);
  });
});

test('songs: tefBlob round-trips through the database', async () => {
  await withFreshDB(async (db) => {
    const blob = new Blob([new Uint8Array([0xfe, 0xed, 0xfa, 0xce])], {
      type: 'application/octet-stream',
    });
    const inserted = await addSong(db, {
      ...SAMPLE_SONG,
      tefBlob: blob,
      tefFilename: 'cripple_creek.tef',
    });
    const fetched = await getSong(db, inserted.id);
    assert(fetched.tefBlob instanceof Blob, 'tefBlob should be a Blob');
    assertEq(fetched.tefFilename, 'cripple_creek.tef');
    const bytes = new Uint8Array(await fetched.tefBlob.arrayBuffer());
    assertEq(Array.from(bytes), [0xfe, 0xed, 0xfa, 0xce]);
  });
});
```

- [ ] **Step 2: Verify syntax**

```bash
node --check src/tests/db.test.js
```

Expected: exit 0.

- [ ] **Step 3: Verify tests pass in browser**

The implementer cannot do this directly. Note in the report that browser verification is the controller's responsibility — the implementer's job is to write code that should pass.

(The controller will start a server, open `tests.html`, and confirm "19 passed, 0 failed".)

- [ ] **Step 4: Commit**

```bash
git add src/tests/db.test.js
git commit -m "Test link and TEF blob round-trip through the database"
```

---

## Task 2: Add Link and TEF inputs to the modal

**Files:**
- Modify: `index.html`

Insert two new `<label>` blocks into the existing `<dialog id="song-modal">`, immediately after the PDF row. The new TEF block mirrors the PDF's structure (file input + "current" filename span); the Link block is a single URL text input.

- [ ] **Step 1: Find the existing PDF label in `index.html`**

It currently reads:

```html
    <label>PDF
      <input type="file" name="pdf" accept="application/pdf">
      <span id="pdf-current"></span>
      <span id="pdf-size-warning" class="form-warning" hidden></span>
    </label>
```

- [ ] **Step 2: Add TEF and Link labels right after it**

Replace the PDF label with:

```html
    <label>PDF
      <input type="file" name="pdf" accept="application/pdf">
      <span id="pdf-current"></span>
      <span id="pdf-size-warning" class="form-warning" hidden></span>
    </label>

    <label>TEF
      <input type="file" name="tef" accept=".tef,application/octet-stream">
      <span id="tef-current"></span>
    </label>

    <label>Link
      <input type="url" name="link" placeholder="https://youtube.com/...">
    </label>
```

(The PDF block is preserved; only the two new blocks are additions.)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add TEF file picker and Link URL input to song modal"
```

---

## Task 3: Pre-fill and clear new fields in modal lifecycle

**Files:**
- Modify: `src/ui.js`

`openAddSongModal` already clears `pdf-current` — it should also clear `tef-current`. `openEditSongModal` already pre-fills the existing fields — it should also pre-fill `link` and set `tef-current` text from the song record.

- [ ] **Step 1: Update `openAddSongModal`**

Find the existing function. It currently looks like:

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
  const pdfWarning = document.getElementById('pdf-size-warning');
  if (pdfWarning) {
    pdfWarning.hidden = true;
    pdfWarning.textContent = '';
  }

  await populateDropdowns();
  modal.showModal();
}
```

Replace with this version that also clears `tef-current`:

```javascript
export async function openAddSongModal() {
  const modal = document.getElementById('song-modal');
  const form = document.getElementById('song-form');
  const title = document.getElementById('song-modal-title');
  const pdfCurrent = document.getElementById('pdf-current');
  const tefCurrent = document.getElementById('tef-current');

  editingSongId = null;
  form.reset();
  title.textContent = 'Add Song';
  pdfCurrent.textContent = '';
  if (tefCurrent) tefCurrent.textContent = '';
  const pdfWarning = document.getElementById('pdf-size-warning');
  if (pdfWarning) {
    pdfWarning.hidden = true;
    pdfWarning.textContent = '';
  }

  await populateDropdowns();
  modal.showModal();
}
```

- [ ] **Step 2: Update `openEditSongModal`**

Find the existing function. It currently looks like:

```javascript
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
  const pdfWarning = document.getElementById('pdf-size-warning');
  if (pdfWarning) {
    pdfWarning.hidden = true;
    pdfWarning.textContent = '';
  }

  modal.showModal();
}
```

Replace with this version that also pre-fills `link` and sets `tef-current`:

```javascript
export async function openEditSongModal(songId) {
  const song = await getSong(dbHandle, songId);
  if (!song) return;

  const modal = document.getElementById('song-modal');
  const form = document.getElementById('song-form');
  const title = document.getElementById('song-modal-title');
  const pdfCurrent = document.getElementById('pdf-current');
  const tefCurrent = document.getElementById('tef-current');

  editingSongId = songId;
  form.reset();
  title.textContent = 'Edit Song';

  await populateDropdowns(song.tuningId, song.styleId);
  form.elements.name.value = song.name;
  form.elements.capo.value = song.capo ?? '';
  form.elements.key.value = song.key ?? '';
  form.elements.artist.value = song.artist ?? '';
  form.elements.source.value = song.source ?? '';
  form.elements.link.value = song.link ?? '';
  pdfCurrent.textContent = song.pdfFilename ? `Current: ${song.pdfFilename}` : '';
  if (tefCurrent) tefCurrent.textContent = song.tefFilename ? `Current: ${song.tefFilename}` : '';
  const pdfWarning = document.getElementById('pdf-size-warning');
  if (pdfWarning) {
    pdfWarning.hidden = true;
    pdfWarning.textContent = '';
  }

  modal.showModal();
}
```

- [ ] **Step 3: Verify syntax**

```bash
node --check src/ui.js
```

- [ ] **Step 4: Commit**

```bash
git add src/ui.js
git commit -m "Reset and pre-fill TEF/Link fields in modal lifecycle"
```

---

## Task 4: Persist Link and TEF on submit

**Files:**
- Modify: `src/ui.js`

`bindSubmitHandler` currently builds a `fields` object from the form, then either inserts (add mode) or merges (edit mode). It needs to read the new `link` and `tef` form fields, applying the same edit semantics as PDF (only overwrite the blob if a new file was picked).

- [ ] **Step 1: Replace `bindSubmitHandler`**

Find the existing function — it has a `try/catch` and an `if (editingSongId)` branch. Replace it entirely with:

```javascript
export function bindSubmitHandler() {
  const form = document.getElementById('song-form');
  const modal = document.getElementById('song-modal');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const pdfFile = data.get('pdf');
    const hasNewPdf = pdfFile instanceof File && pdfFile.size > 0;

    const tefFile = data.get('tef');
    const hasNewTef = tefFile instanceof File && tefFile.size > 0;

    const fields = {
      name: data.get('name').trim(),
      tuningId: Number(data.get('tuningId')),
      styleId: Number(data.get('styleId')),
      capo: data.get('capo') ? Number(data.get('capo')) : null,
      key: data.get('key').trim() || null,
      artist: data.get('artist').trim() || null,
      source: data.get('source').trim() || null,
      link: data.get('link').trim() || null,
    };

    if (!fields.name || !fields.tuningId || !fields.styleId) return;

    try {
      if (editingSongId) {
        const updates = { ...fields };
        if (hasNewPdf) {
          updates.pdfBlob = pdfFile;
          updates.pdfFilename = pdfFile.name;
        }
        if (hasNewTef) {
          updates.tefBlob = tefFile;
          updates.tefFilename = tefFile.name;
        }
        await updateSong(dbHandle, editingSongId, updates);
      } else {
        fields.pdfBlob = hasNewPdf ? pdfFile : null;
        fields.pdfFilename = hasNewPdf ? pdfFile.name : null;
        fields.tefBlob = hasNewTef ? tefFile : null;
        fields.tefFilename = hasNewTef ? tefFile.name : null;
        await addSong(dbHandle, fields);
      }

      modal.close();
      editingSongId = null;
      await renderApp();
    } catch (err) {
      console.error('Failed to save song:', err);
      toast(`Could not save: ${err.message}`, { error: true });
    }
  });
}
```

- [ ] **Step 2: Verify syntax**

```bash
node --check src/ui.js
```

- [ ] **Step 3: Commit**

```bash
git add src/ui.js
git commit -m "Persist link and TEF on song save"
```

---

## Task 5: Render Link and TEF badges + detail-panel rows

**Files:**
- Modify: `src/ui.js`

`renderSongRow` currently renders the song summary (name, style badge, capo, key, optional `PDF ↗`) and a hidden detail panel (artist, source, added date, optional PDF filename). Extend it to also render `Link ↗` and `TEF ↓` badges in the summary, and `Link` and `TEF` rows in the detail panel.

- [ ] **Step 1: Replace `renderSongRow`**

Find the existing function. Replace it with:

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

- [ ] **Step 2: Verify syntax**

```bash
node --check src/ui.js
```

- [ ] **Step 3: Commit**

```bash
git add src/ui.js
git commit -m "Render Link and TEF badges and detail rows on song"
```

---

## Task 6: CSS for Link and TEF badges

**Files:**
- Modify: `styles.css`

The existing `.song-pdf-link` rules style the PDF badge. The Link and TEF badges should match in size and hover behaviour. Easiest approach: add `.song-link` and `.song-tef-link` rules that share the same look. Keep them as separate selectors so future tweaks (e.g. different colour per type) stay easy.

- [ ] **Step 1: Find the existing PDF-link CSS**

It's currently:

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

- [ ] **Step 2: Replace it with shared rules**

Replace the two PDF-link blocks above with:

```css
.song-pdf-link,
.song-tef-link,
.song-link {
  font-size: 0.85rem;
  color: #2a6;
  text-decoration: underline;
  cursor: pointer;
}

.song-pdf-link:hover,
.song-tef-link:hover,
.song-link:hover {
  color: #1a4;
}

/* Push the first attachment badge to the right edge of the row. */
.song-summary > .song-link,
.song-summary > .song-tef-link,
.song-summary > .song-pdf-link {
  margin-left: auto;
}

/* When an earlier attachment badge already pushed right, subsequent
   badges sit next to it instead of distributing the free space. */
.song-summary > .song-link ~ .song-tef-link,
.song-summary > .song-link ~ .song-pdf-link,
.song-summary > .song-tef-link ~ .song-pdf-link {
  margin-left: 0;
}
```

The selector logic: whichever attachment badge appears first in the row gets `margin-left: auto` (pushing it to the right edge). Subsequent badges sit immediately after it without their own auto-margin. Because the render order is fixed (`Link`, `TEF`, `PDF`), this collapses cleanly: if Link is present it gets the auto-margin; otherwise TEF; otherwise PDF.

- [ ] **Step 3: Append the responsive rule update**

The existing responsive section in `styles.css` already has:

```css
@media (max-width: 600px) {
  ...
  .song-pdf-link {
    margin-left: 0;
  }
}
```

Replace that single rule line with:

```css
  .song-link,
  .song-tef-link,
  .song-pdf-link {
    margin-left: 0;
  }
```

(So on narrow viewports all three badges flow naturally rather than being pushed right.)

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "Style Link and TEF badges to match PDF"
```

---

## Task 7: Click handlers and helpers for Link and TEF

**Files:**
- Modify: `src/ui.js`

`bindSongActions` currently handles `open-pdf`, edit, and delete. Add `open-link` and `open-tef` branches, and define two new helpers (`openLinkForSong`, `openTefForSong`) plus a small `downloadBlob` utility.

- [ ] **Step 1: Replace `bindSongActions`**

Find the existing function. Replace it with:

```javascript
export function bindSongActions() {
  const root = document.getElementById('app');
  root.addEventListener('click', async (e) => {
    const linkTrigger = e.target.closest('[data-action="open-link"]');
    if (linkTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const row = linkTrigger.closest('.song-row');
      if (row) await openLinkForSong(row.dataset.songId);
      return;
    }

    const tefTrigger = e.target.closest('[data-action="open-tef"]');
    if (tefTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const row = tefTrigger.closest('.song-row');
      if (row) await openTefForSong(row.dataset.songId);
      return;
    }

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
```

- [ ] **Step 2: Add helpers**

Just below the existing `openPdfForSong` function, add:

```javascript
async function openLinkForSong(songId) {
  const song = await getSong(dbHandle, songId);
  if (!song || !song.link) return;
  window.open(song.link, '_blank', 'noopener,noreferrer');
}

async function openTefForSong(songId) {
  const song = await getSong(dbHandle, songId);
  if (!song || !song.tefBlob) return;
  downloadBlob(song.tefBlob, song.tefFilename || 'tab.tef');
}

function downloadBlob(blob, filename) {
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

- [ ] **Step 3: Verify syntax**

```bash
node --check src/ui.js
```

- [ ] **Step 4: Commit**

```bash
git add src/ui.js
git commit -m "Wire Link and TEF badge clicks to open or download"
```

---

## Done

After Task 7, the feature is complete:

- A song can have any combination of PDF, TEF, and link.
- The modal exposes all three; `Link ↗` opens in a new tab, `TEF ↓` triggers a download with the original filename, `PDF ↗` opens (unchanged).
- Edits pre-fill all three; clearing link saves null; replacing TEF/PDF replaces the blob; not picking a new file leaves the existing blob intact.

The controller is responsible for browser verification:

1. Run `python3 -m http.server 8000` from the project root.
2. Open `http://localhost:8000/tests.html` and confirm 19 tests pass (16 existing + 3 new).
3. Open `http://localhost:8000/index.html`, add a song with all three attachments, click each badge in turn, edit and clear values, reload, confirm everything persists.
