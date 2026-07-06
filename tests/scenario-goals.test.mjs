// scenario.js の宣言的ゴール評価（evalGoalConds / scenarioContext / normalizeScenario）の
// ユニットテスト。check()→goalConds への変換はフェーズ1の中核なので回帰を防ぐ。
// scenario.js は末尾で document.addEventListener を呼ぶだけなので、document をスタブして読み込む。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../web/js/scenario.js', import.meta.url)), 'utf8');
const documentStub = { addEventListener() {} };
const sc = new Function('document', src + '\nreturn { evalGoalConds, scenarioContext, normalizeScenario };')(documentStub);

test('evalGoalConds: all conditions must pass (AND)', () => {
  const ctx = { diversity: 85, entropy: 60 };
  assert.equal(eval2([{ metric: 'diversity', op: '>=', value: 80 }, { metric: 'entropy', op: '<', value: 70 }], ctx), true);
  assert.equal(eval2([{ metric: 'diversity', op: '>=', value: 80 }, { metric: 'entropy', op: '<', value: 50 }], ctx), false);
  function eval2(c, x) { return sc.evalGoalConds(c, x); }
});

test('evalGoalConds: every operator behaves', () => {
  const x = { v: 10 };
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '>=', value: 10 }], x), true);
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '<=', value: 10 }], x), true);
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '>', value: 10 }], x), false);
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '<', value: 11 }], x), true);
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '==', value: 10 }], x), true);
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '!=', value: 10 }], x), false);
});

test('evalGoalConds: empty conds and missing metric are false (never accidental clear)', () => {
  assert.equal(sc.evalGoalConds([], { a: 1 }), false);
  assert.equal(sc.evalGoalConds([{ metric: 'missing', op: '>=', value: 1 }], { a: 1 }), false);
  assert.equal(sc.evalGoalConds([{ metric: 'v', op: '??', value: 1 }], { v: 5 }), false); // 未知のop
});

test('scenarioContext: merges globals (default 0) with page metrics', () => {
  const ctx = sc.scenarioContext({ diversity: 80, brand: 42 });
  assert.equal(ctx.diversity, 80);
  assert.equal(ctx.brand, 42);
  assert.equal(ctx.ethicsScore, 0); // グローバル未定義時は 0 にフォールバック
});

test('normalizeScenario: aliases intro/brief and guarantees goalConds array', () => {
  const a = sc.normalizeScenario({ brief: { ja: 'あ', en: 'a' } });
  assert.equal(a.intro.en, 'a');            // brief -> intro
  assert.ok(Array.isArray(a.goalConds));
  const b = sc.normalizeScenario({ intro: { ja: 'い', en: 'b' } });
  assert.equal(b.brief.en, 'b');            // intro -> brief
});
