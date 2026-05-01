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
