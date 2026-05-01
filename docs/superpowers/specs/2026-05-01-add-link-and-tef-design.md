# Add Link Field and TEF File Attachment

Two related additive features for songs:

1. **Optional link** — a single URL per song (e.g. a YouTube video) for tunes learned from a video or any online source.
2. **Optional TEF file** — TablEdit's binary tab format. Often the editable source paired with a printable PDF rendering of the same arrangement.

Both are independent of the existing PDF attachment. A song may have any combination of {PDF, TEF, link, none, all}.

## Goals

- Track up to one URL and one TEF file per song, alongside the existing optional PDF.
- Display each as a small badge in the song row; click opens (PDF, link) or downloads (TEF) in/to the browser.
- Edit and clear all three independently from the existing Add/Edit modal.

## Non-goals

- Multiple links or multiple TEFs per song.
- URL validation beyond the browser's `type="url"` hint.
- Host-specific labels (badge is always `Link ↗`, regardless of YouTube/Vimeo/etc.).
- In-app TEF preview or conversion.

## Data Model Change

Add three optional fields to the `songs` store:

| Field        | Type   | Required | Notes |
| ---          | ---    | ---      | --- |
| `link`       | string | no       | any URL; `null` or absent means "no link" |
| `tefBlob`    | Blob   | no       | the TEF file bytes |
| `tefFilename`| string | no       | the original filename, shown in the detail panel |

No schema migration needed — IndexedDB is schemaless and existing records simply have these fields undefined.

## UI Changes

### Modal form

Two new inputs are inserted into the existing modal, right after the PDF row, so the new file pickers and the link field are visually grouped with PDF as "where this song came from":

```
PDF
  [ Choose File ]  (current filename if editing)
TEF
  [ Choose File ]  (current filename if editing)
Link
  [ https://youtube.com/...                                ]
```

Markup:

```html
<label>TEF
  <input type="file" name="tef" accept=".tef,application/octet-stream">
  <span id="tef-current"></span>
</label>

<label>Link
  <input type="url" name="link" placeholder="https://youtube.com/...">
</label>
```

`accept=".tef,application/octet-stream"` covers the case where the OS doesn't have a registered MIME for `.tef` (most don't).

The submit handler reads each new field; for `link` it trims and stores `null` on empty; for `tef` it stores the new blob if one was picked, otherwise leaves the existing one untouched (mirrors current PDF edit behaviour).

### Song row

The summary row gains up to two more badges. Each is independent:

```
Cripple Creek  [Clawhammer]  capo 2  key A     Link ↗  TEF ↓  PDF ↗
```

- `Link ↗` — anchor-style badge, opens `song.link` in a new tab (`noopener,noreferrer`).
- `TEF ↓` — anchor-style badge, downloads the blob using its `tefFilename`.
- `PDF ↗` — unchanged.

All three reuse the same hover styling and the same click semantics as the existing PDF badge: clicking the badge does **not** toggle row expansion (handled via `data-action="open-pdf"`, `data-action="open-tef"`, `data-action="open-link"` so `bindSongActions` can route precisely).

### Detail panel

Each present attachment shows a row in the `<dl>`:

```
Artist:  Pete Seeger
Source:  YouTube
Link:    https://www.youtube.com/watch?v=… ↗
PDF:     cripple-creek.pdf
TEF:     cripple-creek.tef
Added:   2026-05-01
```

The `Link` value renders as a clickable `<a>` with `target="_blank"` and `rel="noopener noreferrer"`. PDF/TEF lines stay informational text (the badges in the summary row are the click target).

## Behaviour Details

### Opening a PDF (unchanged)

`URL.createObjectURL(pdfBlob)` → `window.open(url, '_blank')` → revoke after 60s.

### Downloading a TEF (new)

Helper inside `ui.js`:

```js
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'tab.tef';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
```

The `download` attribute makes the browser save the file rather than navigate; the original filename is preserved.

### Opening a link (new)

```js
window.open(song.link, '_blank', 'noopener,noreferrer');
```

The window-features string disables `window.opener` access from the new tab — small security win for a URL that came from outside the app.

### Edit / clear

- **PDF picker:** picking a new file replaces the blob; not picking leaves the old one. (Existing behaviour — unchanged.)
- **TEF picker:** same semantics as PDF.
- **Link input:** pre-filled from the record on edit; saving an empty string clears it (`link: null`).
- A future "remove this attachment" affordance is out of scope; users who want to clear a PDF or TEF can replace it with another file.

## Files Touched

- `index.html` — two new `<label>` blocks in the modal.
- `styles.css` — small badge rule for `Link ↗` and `TEF ↓` (extend or share `.song-pdf-link`).
- `src/ui.js`:
  - `openAddSongModal` — clear the `tef-current` span (mirrors existing `pdf-current` clear).
  - `openEditSongModal` — pre-fill `form.elements.link.value`, set `tef-current` text.
  - `bindSubmitHandler` — read `link` and `tef` from `FormData`; build `fields` accordingly; on edit, only overwrite `tefBlob`/`tefFilename` when a new file was picked, mirroring PDF.
  - `renderSongRow` — render three optional badges in summary; add `Link` and `TEF` rows in the detail `<dl>`.
  - `bindSongActions` — handle the two new `data-action` triggers; add `openTefForSong(songId)` helper.

`src/db.js` requires no changes — three new fields flow through the existing `addSong`/`updateSong` spread.

## Testing

Three new tests in `src/tests/db.test.js`:

1. `songs: link round-trips through the database` — insert with `link: 'https://example.com/x'`, fetch, assert.
2. `songs: updating a song to clear link works` — start with a link, update with `{ link: null }`, fetch, assert link is null.
3. `songs: tefBlob round-trips through the database` — same pattern as the existing PDF round-trip test, but for TEF.

Manual UI checks after implementation:

- Add a song with link, PDF, and TEF; verify all three badges show in the row.
- Click `Link ↗` — opens the URL in a new tab.
- Click `TEF ↓` — downloads the file with its original name.
- Click `PDF ↗` — opens in a new tab.
- Edit the song, clear the link, save — `Link ↗` badge disappears.
- Reload — every change persisted.
