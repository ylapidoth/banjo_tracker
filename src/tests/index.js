import { run, test, assertEq } from './runner.js';
import './db.test.js';

test('runner: smoke test passes', () => {
  assertEq(1 + 1, 2);
});

await run();
