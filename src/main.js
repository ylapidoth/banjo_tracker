import { openDB } from './db.js';
import { init, renderApp, openAddSongModal, bindModalControls } from './ui.js';

const db = await openDB();
init(db);
bindModalControls();
await renderApp();

document.getElementById('add-song-btn').addEventListener('click', () => {
  openAddSongModal();
});
