import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const m = new Function(
  readFileSync(new URL('../web/js/stage5/model.js', import.meta.url), 'utf8') + '\nreturn Stage5;'
)();
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10);
test('same-strength exchange is a mathematical null, not evidence about leaders', () => {
  const r = m.evaluate(m.defaults);
  r.original.forEach((a, i) => {
    near(a.spread, r.swapped[i].spread);
    near(a.hidden, r.swapped[i].hidden);
  });
});
test('unequal strengths create exchange effects; matched structures remove sector difference', () => {
  const r = m.evaluate({ ...m.defaults, alpha: 40 });
  assert.notEqual(r.original[0].spread, r.swapped[0].spread);
  const same = m.evaluate({ ...m.defaults, aGround: 50, bGround: 50, aAudit: 50, bAudit: 50 });
  near(same.factorial[0].spread, same.factorial[2].spread);
  near(same.factorial[1].hidden, same.factorial[3].hidden);
});
test('interventions charge fixed budget, target one path and keep shock/assignment fixed', () => {
  const r = m.evaluate(m.defaults, { a: 'ground', b: 'audit' });
  assert.deepEqual(r.cost, { a: 25, b: 25 });
  near(r.repaired[0].spread, 38.5);
  near(r.repaired[0].hidden, r.original[0].hidden);
  near(r.repaired[1].hidden, 38.5);
  assert.equal(r.repaired[0].operator, r.original[0].operator);
  assert.equal(r.changed.alpha, r.initial.alpha);
});
test('none preserves all results; capped interventions never exceed 100', () => {
  const r = m.evaluate(m.defaults);
  assert.deepEqual(r.original, r.repaired);
  const cap = m.evaluate({ ...m.defaults, aGround: 95 }, { a: 'ground', b: 'none' });
  assert.equal(cap.changed.aGround, 100);
  assert.equal(cap.cost.a, 25);
  near(cap.repaired[0].spread, 0);
});
test('zero shock yields no outcomes and data are not mutated', () => {
  const s = { ...m.defaults, alpha: 0, beta: 0 };
  const before = JSON.stringify(s);
  const r = m.evaluate(s, { a: 'ground', b: 'audit' });
  assert.equal(JSON.stringify(s), before);
  for (const row of r.factorial) {
    near(row.spread, 0);
    near(row.hidden, 0);
  }
});
test('replay validates before restoring and recomputes untrusted results', () => {
  const d = {
    version: m.version,
    scene: 7,
    input: m.defaults,
    choices: { a: 'none', b: 'audit' },
    prediction: 'unsure',
    confidence: 50,
    answers: { reason: '理由', explanation: '', revision: '', transfer: '' },
    result: 'fake',
  };
  assert.deepEqual(m.decode(JSON.stringify(d)).result, m.evaluate(d.input, d.choices));
  for (const invalid of [
    { scene: 8 },
    { confidence: NaN },
    { version: 'future' },
    { choices: { a: 'magic', b: 'none' } },
    { input: { ...m.defaults, alpha: -1 } },
    { answers: {} },
  ])
    assert.throws(() => m.decode(JSON.stringify({ ...d, ...invalid })));
});
