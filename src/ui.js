// Rendering and event handlers. Reads the DOM via id, talks to db.js for data.
import { getAllTunings, getAllStyles, getAllSongs, addSong } from './db.js';

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
