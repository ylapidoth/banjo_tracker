# Export Feature

A one-click export of all banjo tracker data to a self-contained JSON file. The user can stash the file as a backup or move it to another browser. Import is intentionally not in scope for v1, but the format is designed so import is straightforward to add.

## Goal

Export every song, tuning, and style — with PDF and TEF attachments base64-encoded inline — to a single timestamped JSON file. One click; no configuration.

## Non-goals

- No import. (Defer until v2.)
- No selective export ("only these tunings", date range, etc.). Always exports everything.
- No streaming or chunked I/O. The whole document is built in memory.
- No compression. JSON pretty-printed with 2-space indent for human readability.
- No tests for the click flow / download trigger; that is manually verified. Unit tests cover the pure format-building function only (see Tests).

## UI

A new `Export` button sits in the header, immediately to the left of the existing `+ Add Song` button.

```
Banjo Tracker                              [ Export ] [ + Add Song ]
```

Clicking it builds the export and triggers a download of `banjo_tracker_YYYY-MM-DD.json` (local date), using the same `<a download>` mechanism already used for TEF downloads.

The button is always enabled. If the export fails — most likely a blob read rejecting — the existing `toast(message, { error: true })` helper surfaces the error. The button is not disabled during export; the operation is fast enough on a typical library that flicker isn't worth the complexity.

## File format

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-05-02T14:30:00.000Z",
  "tunings": [
    { "id": 1, "name": "Open G", "notation": "gDGBD", "isSeed": true }
  ],
  "styles": [
    { "id": 1, "name": "Clawhammer", "isSeed": true }
  ],
  "songs": [
    {
      "id": "uuid",
      "name": "Cripple Creek",
      "tuningId": 1,
      "styleId": 1,
      "capo": 2,
      "key": "A",
      "artist": null,
      "source": null,
      "link": "https://youtu.be/abc",
      "dateAdded": "2026-05-01T12:00:00.000Z",
      "pdf": {
        "filename": "cripple_creek.pdf",
        "mimeType": "application/pdf",
        "data": "JVBERi0xLjQK…"
      },
      "tef": {
        "filename": "cripple_creek.tef",
        "mimeType": "application/octet-stream",
        "data": "/v3+…"
      }
    }
  ]
}
```

### Field rules

- **`schemaVersion`** — always `1` for this design. A future format change increments it.
- **`exportedAt`** — UTC ISO 8601 timestamp.
- **`tunings`** and **`styles`** — every record from the corresponding store, including seeded ones. The `isSeed` flag travels along so an importer can skip duplicating seeds. Numeric `id`s are kept as-is; on import they may need remapping.
- **`songs`** — every song record. All scalar fields appear regardless of value (so a song with no key still has `"key": null`).
- **`pdf` / `tef`** — present only when the song has the corresponding blob. The whole object is omitted when there is no attachment (so JSON consumers don't see `"pdf": null`).
  - **`filename`** — from `pdfFilename` / `tefFilename`.
  - **`mimeType`** — from `blob.type`. PDFs typically `application/pdf`; TEFs typically `application/octet-stream` (since TEF has no registered MIME).
  - **`data`** — base64 of the blob's bytes. No data URL prefix.

### Filename

`banjo_tracker_YYYY-MM-DD.json` where `YYYY-MM-DD` is the user's local date at export time. If the user runs export twice on the same day, the browser will append a numeric suffix (`(1)`, `(2)`, etc.) per its standard download behavior — we do not embed time-of-day in the filename.

## Architecture

A single new module owns the format and the download trigger.

### `src/export.js`

Two exports:

- **`buildExport(db)`** — pure async function. Reads from db, returns the JSON-serializable object described above. No DOM, no download. This is what the unit test exercises.
- **`exportToFile(db)`** — calls `buildExport`, JSON-stringifies (pretty-printed), wraps in a `Blob` with `type: 'application/json'`, calls the existing `downloadBlob` helper from `src/ui.js` (or copies the trivial pattern; see below).

`buildExport` does the work:

1. `getAllTunings(db)` and `getAllStyles(db)` are already exported from `db.js`; use them directly.
2. `getAllSongs(db)` — same.
3. For each song, if `pdfBlob` is present, await `blobToBase64(pdfBlob)` and assemble the nested `pdf` object. Same for `tef`. Strip the raw blob fields from the output.
4. Return the assembled object.

A small helper `blobToBase64(blob)` converts a `Blob` to a base64 string. Implemented using `FileReader.readAsDataURL` then stripping the `data:…;base64,` prefix; this works in every modern browser without any new dependencies.

### `src/ui.js`

Either expose `downloadBlob` so `export.js` can reuse it, or duplicate the eight-line helper. Since `downloadBlob` is already used for TEF downloads, exporting it once is cleaner. Add `export` to its declaration in `src/ui.js`.

### `src/main.js`

Add a click handler on the new `#export-btn` that calls `exportToFile(db)` inside a `try/catch`. On error, log and toast.

### `index.html`

Add the button to the header, before `+ Add Song`:

```html
<button id="export-btn" type="button">Export</button>
```

### `styles.css`

The button reuses the existing styling pattern. Add a small rule to give it a neutral (not green) treatment so it's visually distinct from the primary `+ Add Song`. A bordered button with a transparent or off-white background is enough.

## Tests

A single new test file or a new section in an existing one — `src/tests/export.test.js`:

1. **`buildExport returns the expected shape on an empty (seeded) database`** — open a fresh DB, call `buildExport`, assert top-level keys (`schemaVersion`, `exportedAt`, `tunings`, `styles`, `songs`), array lengths roughly match seeds, no songs.
2. **`buildExport encodes a PDF blob to base64`** — seed a song with a tiny PDF blob, call `buildExport`, assert the song's `pdf.data` decodes back to the original bytes (`atob` round-trip with `Uint8Array.from(atob(data), c => c.charCodeAt(0))`).
3. **`buildExport encodes a TEF blob to base64`** — same pattern as PDF.
4. **`buildExport omits the pdf/tef objects when blobs are absent`** — song without attachments should have neither `pdf` nor `tef` key in the exported record.

The download trigger itself (clicking, file appearing on disk) is verified manually in the browser. Headless test of the `<a download>` trick is more trouble than it's worth.

## File Layout After This Change

```
banjo_tracker/
├── index.html                  Export button added in header
├── styles.css                  Small rule for #export-btn
├── src/
│   ├── main.js                 Click handler wired to exportToFile
│   ├── db.js                   (unchanged)
│   ├── seed.js                 (unchanged)
│   ├── ui.js                   `downloadBlob` exported
│   ├── export.js               NEW: buildExport, exportToFile, blobToBase64
│   └── tests/
│       ├── runner.js           (unchanged)
│       ├── db.test.js          (unchanged)
│       ├── export.test.js      NEW
│       └── index.js            Imports export.test.js
└── tests.html                  (unchanged)
```

## Future Extensibility

When import is added later (out of scope here):

1. Read the JSON, validate `schemaVersion === 1`.
2. Insert tunings and styles. For each: if `isSeed === true`, look for an existing seed with the same `name` and skip if found; otherwise insert and capture the new id. Build a `Map<oldId, newId>` per table.
3. Insert songs, remapping `tuningId` and `styleId` through those maps. Decode `pdf.data` and `tef.data` from base64 back into Blobs with the recorded `mimeType` and `filename`.
4. Re-render.

The shape of the export is chosen so this flow is mostly mechanical — the only real judgment call (seed dedupe by name) is documented in the format above.
