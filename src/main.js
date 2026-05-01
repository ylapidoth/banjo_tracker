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
