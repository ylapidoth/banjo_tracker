// Seed data inserted on first run when the database is empty.
// Pure data — `db.js` reads these and inserts them.

export const SEED_TUNINGS = [
  { name: 'Open G',                     notation: 'gDGBD' },
  { name: 'Double C',                   notation: 'gCGCD' },
  { name: 'Sawmill / Mountain Modal',   notation: 'gDGCD' },
  { name: 'Double D',                   notation: 'f#DF#AD' },
  { name: 'Open D',                     notation: 'f#DF#AD' },
  { name: 'C tuning',                   notation: 'gCGBD' },
];

export const SEED_STYLES = [
  'Clawhammer',
  'Scruggs (3-finger)',
  'Melodic',
  'Frailing',
  'Old-time',
];
