// Rendering and event handlers. Reads the DOM via id, talks to db.js for data.
import { getAllTunings, getAllStyles, getAllSongs, getSong, addSong, updateSong, deleteSong, addTuning, addStyle } from './db.js';

let dbHandle = null;
let editingSongId = null;

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

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

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
