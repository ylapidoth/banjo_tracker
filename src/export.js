// Export the entire banjo tracker database to a self-contained JSON object.
// Pure logic lives in `buildExport`; `exportToFile` (added in Task 5) handles
// JSON-stringify and download.
import { getAllTunings, getAllStyles, getAllSongs } from './db.js';

export const SCHEMA_VERSION = 1;

export async function buildExport(db) {
  const [tunings, styles, songs] = await Promise.all([
    getAllTunings(db),
    getAllStyles(db),
    getAllSongs(db),
  ]);

  const exportedSongs = await Promise.all(songs.map(serializeSong));

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tunings,
    styles,
    songs: exportedSongs,
  };
}

async function serializeSong(song) {
  const { pdfBlob, pdfFilename, tefBlob, tefFilename, ...rest } = song;
  const out = { ...rest };
  if (pdfBlob instanceof Blob) {
    out.pdf = {
      filename: pdfFilename || 'tab.pdf',
      mimeType: pdfBlob.type || 'application/pdf',
      data: await blobToBase64(pdfBlob),
    };
  }
  if (tefBlob instanceof Blob) {
    out.tef = {
      filename: tefFilename || 'tab.tef',
      mimeType: tefBlob.type || 'application/octet-stream',
      data: await blobToBase64(tefBlob),
    };
  }
  return out;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Result is a data URL like "data:application/pdf;base64,JVBERi0…"
      // Strip the prefix; we keep the mimeType separately.
      const result = reader.result;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
