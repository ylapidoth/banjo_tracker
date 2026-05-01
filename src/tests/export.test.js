import { test, assert, assertEq } from './runner.js';
import { openDB, addSong } from '../db.js';
import { buildExport } from '../export.js';

async function withFreshDB(fn) {
  const name = 'banjo_test_' + crypto.randomUUID();
  const db = await openDB(name);
  try {
    await fn(db);
  } finally {
    db.close();
    await new Promise((resolve) => {
      const r = indexedDB.deleteDatabase(name);
      r.onsuccess = r.onerror = r.onblocked = () => resolve();
    });
  }
}

const SAMPLE_SONG = {
  name: 'Cripple Creek',
  tuningId: 1,
  styleId: 1,
  capo: 2,
  key: 'A',
  artist: '',
  source: '',
};

test('export: empty database yields shape with seeded tunings/styles and no songs', async () => {
  await withFreshDB(async (db) => {
    const out = await buildExport(db);
    assertEq(out.schemaVersion, 1);
    assert(typeof out.exportedAt === 'string', 'exportedAt should be a string');
    assert(Array.isArray(out.tunings), 'tunings should be an array');
    assert(Array.isArray(out.styles), 'styles should be an array');
    assert(Array.isArray(out.songs), 'songs should be an array');
    assertEq(out.songs.length, 0);
    assert(out.tunings.length >= 5, `expected at least 5 seeded tunings, got ${out.tunings.length}`);
    assert(out.styles.length >= 4, `expected at least 4 seeded styles, got ${out.styles.length}`);
  });
});

test('export: encodes a PDF blob to base64 that decodes to the original bytes', async () => {
  await withFreshDB(async (db) => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    await addSong(db, {
      ...SAMPLE_SONG,
      pdfBlob: new Blob([bytes], { type: 'application/pdf' }),
      pdfFilename: 'tab.pdf',
    });
    const out = await buildExport(db);
    assertEq(out.songs.length, 1);
    const exported = out.songs[0];
    assert(exported.pdf, 'pdf object should exist');
    assertEq(exported.pdf.filename, 'tab.pdf');
    assertEq(exported.pdf.mimeType, 'application/pdf');
    const decoded = Uint8Array.from(atob(exported.pdf.data), (c) => c.charCodeAt(0));
    assertEq(Array.from(decoded), [0x25, 0x50, 0x44, 0x46]);
  });
});

test('export: encodes a TEF blob to base64 that decodes to the original bytes', async () => {
  await withFreshDB(async (db) => {
    const bytes = new Uint8Array([0xfe, 0xed, 0xfa, 0xce]);
    await addSong(db, {
      ...SAMPLE_SONG,
      tefBlob: new Blob([bytes], { type: 'application/octet-stream' }),
      tefFilename: 'tab.tef',
    });
    const out = await buildExport(db);
    const exported = out.songs[0];
    assert(exported.tef, 'tef object should exist');
    assertEq(exported.tef.filename, 'tab.tef');
    assertEq(exported.tef.mimeType, 'application/octet-stream');
    const decoded = Uint8Array.from(atob(exported.tef.data), (c) => c.charCodeAt(0));
    assertEq(Array.from(decoded), [0xfe, 0xed, 0xfa, 0xce]);
  });
});

test('export: omits pdf/tef keys when the song has no attachments', async () => {
  await withFreshDB(async (db) => {
    await addSong(db, SAMPLE_SONG);
    const out = await buildExport(db);
    const exported = out.songs[0];
    assertEq('pdf' in exported, false);
    assertEq('tef' in exported, false);
  });
});
