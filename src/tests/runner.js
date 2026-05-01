// Tiny in-browser test runner. No dependencies.
const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertEq(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg ? msg + ': ' : ''}expected ${e}, got ${a}`);
  }
}

export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}

export async function run() {
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    const row = document.createElement('div');
    row.className = 'test';
    row.textContent = name;
    results.appendChild(row);
    try {
      await fn();
      row.classList.add('pass');
      passed++;
    } catch (err) {
      row.classList.add('fail');
      const pre = document.createElement('pre');
      pre.textContent = err.stack || err.message;
      row.appendChild(pre);
      failed++;
    }
  }

  summary.textContent = `${passed} passed, ${failed} failed`;
  summary.classList.add(failed === 0 ? 'pass' : 'fail');
}
