# Banjo Tracker — Design

A personal, browser-based app for tracking banjo songs the user is learning. Songs are grouped by tuning, tagged with style and capo, and can have a PDF (tab/notes) attached. All data persists locally in the browser.

## Goals

- Record songs the user knows or is learning, grouped by tuning.
- Capture style (clawhammer, Scruggs, etc.), capo, key, artist, source, and an optional PDF per song.
- Persist data and PDFs across page loads on a single device.
- Stay simple enough to maintain for years: no build step, no framework, no backend.
- Leave a clean seam for a future server-backed, multi-device version.

## Non-Goals (v1)

- Multi-device sync, accounts, or hosting.
- Search, filter, sort, or tagging beyond what's listed.
- Progress states (learning / mastered), notes fields, BPM, date-learned tracking.
- In-app PDF preview pane (the browser's PDF viewer in a new tab is enough).
- Multiple PDFs per song.

## Architecture

- **Static frontend.** A single `index.html` opened directly in the browser, or hosted as static files later. No build step.
- **Vanilla JS** in small ES modules. No framework, no dependencies.
- **IndexedDB** for storage. Stores both metadata (songs, tunings, styles) and PDFs as Blobs. IndexedDB handles binary natively, unlike localStorage.
- **Single storage seam.** All reads/writes go through `src/db.js`. Replacing IndexedDB with a server API later is a contained change to one file.

## Data Model

Three IndexedDB object stores.

### `songs`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string (uuid) | yes | auto-generated |
| `name` | string | yes | song title |
| `tuningId` | number | yes | FK → `tunings.id` |
| `styleId` | number | yes | FK → `styles.id` |
| `capo` | integer 0–12 | no | `null` or `0` means none |
| `key` | string | no | e.g. "G", "Am" |
| `artist` | string | no | |
| `source` | string | no | where the user learned it (book, video, person) |
| `pdfBlob` | Blob | no | the PDF file |
| `pdfFilename` | string | no | original filename, shown in UI |
| `dateAdded` | string (ISO) | yes | auto-set on create |

### `tunings`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | number | auto |
| `name` | string | e.g. "Open G" |
| `notation` | string | e.g. "gDGBD" |
| `isSeed` | boolean | informational; built-in vs user-added |

### `styles`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | number | auto |
| `name` | string | e.g. "Clawhammer" |
| `isSeed` | boolean | informational |

### Seed data

**Tunings:** Open G (`gDGBD`), Double C (`gCGCD`), Sawmill / Mountain Modal (`gDGCD`), Double D (`f#DF#AD`), Open D (`f#DF#AD`), C tuning (`gCGBD`).

**Styles:** Clawhammer, Scruggs (3-finger), Melodic, Frailing, Old-time.

Seeded on the first run only (when the database is created). User-added tunings and styles are stored in the same tables and behave identically.

## UI

Single page, no routing.

### Main view

Songs grouped into collapsible sections by tuning. Each section header shows the tuning name, notation, and a song count. Empty tunings are listed but collapsed. Each song row shows:

- Name
- Style badge
- Capo (if set)
- Key (if set)
- "PDF ↗" link on the right (opens in new tab) if a PDF is attached

A header bar holds the app title and an `+ Add Song` button.

### Add / Edit song

Clicking `+ Add Song` opens a modal dialog with the form: name, tuning dropdown, style dropdown, capo, key, artist, source, PDF file picker.

Tuning and style dropdowns end with an `Add new…` option. Selecting it prompts for a name (and notation, for tunings) and inserts the new entry, then selects it in the dropdown.

Editing reopens the same modal, pre-filled. The PDF picker shows the current filename and lets the user replace or clear it.

### Song detail

Clicking a song row expands it inline to show all fields plus `Edit` and `Delete` buttons. Delete asks for confirmation.

### Visual style

Clean and minimal. Light background, readable typography. CSS in one hand-rolled stylesheet. No icons library; emoji or unicode for any glyphs.

## Storage Details

### PDFs

- Uploaded via `<input type="file" accept="application/pdf">` and read into a Blob.
- Stored on the song record as `pdfBlob`.
- Opening: `URL.createObjectURL(blob)` → `window.open(url, '_blank')`. Revoke the URL after a delay to free memory.
- Replacing: a new upload during edit overwrites the old blob.
- Soft size warning at 25 MB; not blocked, just flagged in the form.

### Persistence

On first add of a song, call `navigator.storage.persist()` to request persistent storage. If the browser declines, the app still works — the data is just evictable under storage pressure. Show a one-time notice if persistence wasn't granted.

### Seeding

`db.js` opens (or creates) the database. The schema upgrade handler creates the three object stores. After the database opens, `seed.js` checks if `tunings` is empty; if so, it inserts the seed tunings and styles. This runs once.

## Error Handling

- Storage failures (quota exceeded, IndexedDB blocked): toast message, log to console, leave the user's form data intact.
- PDF read failure: toast, keep the modal open so the user can retry.
- Form validation: required fields enforced inline before submit. No silent failures.
- No defensive try/catch around operations that cannot fail.

## File Layout

```
banjo_tracker/
├── index.html          entry point, DOM structure
├── styles.css          all styling
└── src/
    ├── main.js         app entry, wires DOM events
    ├── db.js           IndexedDB wrapper — only file that touches storage
    ├── ui.js           rendering + event handlers for views and modal
    └── seed.js         initial tunings and styles, run once on first load
```

## Future Extensibility

The single storage seam (`db.js`) is the main affordance for a future hosted version: its functions become async HTTP calls instead of IndexedDB calls, and the rest of the app is untouched. Multi-device sync, accounts, or a mobile-friendly hosted deploy can build on that without rewriting the UI layer.
