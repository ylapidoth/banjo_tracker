import { openDB } from './db.js';
import { init, renderApp } from './ui.js';

const db = await openDB();
init(db);
await renderApp();
