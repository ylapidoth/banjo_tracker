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
