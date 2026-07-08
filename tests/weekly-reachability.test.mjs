// 週替わりシナリオの「クリア可能性」ガードレール
//   1) goalConds の metric 名が、そのページの判定文脈に実在するキーであること
//      （タイポ = evalGoalConds が常に false = 誰にもクリアできないシナリオ、を CI で弾く）
//   2) PAGE 1 のシナリオは実エンジン(engine.js metrics)でグリッド探索し、
//      「ゴールが到達可能」かつ「開始パラメータで即クリアにならない」ことを検証する。
//      （PAGE 2〜4 の metrics は ui.js の動的シミュレーション内のため、ここでは 1) のみ）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const weeklyDir = fileURLToPath(new URL('content/weekly/', root));

// engine.js を関数として読み込み metrics を取り出す（tests/engine.test.mjs と同じ流儀）
const engineSrc = readFileSync(fileURLToPath(new URL('web/js/engine.js', root)), 'utf8');
const eng = new Function('const I18N={ja:{},en:{}};' + engineSrc + '\nreturn { metrics };')();

// 判定文脈に実在する metric 名（出典: web/js/scenario.js scenarioContext + ui.js の checkScenarioGoal 呼び出し4箇所）
const GLOBALS = [
  'ethicsScore',
  'filterRate',
  'skillStock',
  'searchDepth',
  'groundingRate',
  'learningRate',
  'extTraffic',
  'gamification',
];
const PAGE_METRICS = {
  1: [...Object.keys(eng.metrics(50, 50, 'dp')), ...GLOBALS], // entropy, paranoia, ... crash
  2: [
    'infra',
    'heliOp',
    'brand',
    'budget',
    'cpuBlame',
    'cpuRepair',
    'deadlock',
    'crash',
    'infraError',
    'redundancy',
    'skillStock',
    ...GLOBALS,
  ], // ui.js metricsP2
  3: ['integrity', 'dopamine', 'depth', ...GLOBALS], // ui.js updateP3 の checkScenarioGoal
  4: ['drop', 'ratio', ...GLOBALS], // ui.js updateP4 の checkScenarioGoal
};

const OPS = {
  '>=': (v, x) => v >= x,
  '<=': (v, x) => v <= x,
  '>': (v, x) => v > x,
  '<': (v, x) => v < x,
  '==': (v, x) => v === x,
  '!=': (v, x) => v !== x,
};
const passes = (conds, ctx) =>
  conds.every((c) => {
    const v = Number(ctx[c.metric]);
    return !Number.isNaN(v) && OPS[c.op](v, c.value);
  });

const scenarios = readdirSync(weeklyDir)
  .filter((f) => f.endsWith('.json') && f !== 'latest.json')
  .map((f) => ({ file: f, s: JSON.parse(readFileSync(weeklyDir + f, 'utf8')) }));

// バンドル版フォールバック（scenario.js SCENARIOS）も同じガードレールに掛ける
const scenarioSrc = readFileSync(fileURLToPath(new URL('web/js/scenario.js', root)), 'utf8');
const bundled = new Function('document', 'window', scenarioSrc + '\nreturn SCENARIOS;')(
  { addEventListener() {} },
  {}
);
for (const s of bundled) scenarios.push({ file: `bundled:${s.id}`, s });

test('weekly scenarios exist', () => {
  assert.ok(scenarios.length >= 3);
});

test('every goalCond metric exists in its page context (no unclearable typos)', () => {
  const bad = [];
  for (const { file, s } of scenarios) {
    for (const c of s.goalConds) {
      if (!PAGE_METRICS[s.page].includes(c.metric))
        bad.push(`${file}: page${s.page} に metric「${c.metric}」は存在しない`);
    }
  }
  assert.deepEqual(bad, []);
});

// PAGE 1: f×e×algo の全探索で到達可能性と「開始即クリアなし」を実エンジン検証
function p1Context(f, e, al) {
  return { ...eng.metrics(f, e, al), ethicsScore: e, filterRate: f };
}
test('page-1 scenarios: goal reachable and not pre-cleared (real engine grid search)', () => {
  const problems = [];
  for (const { file, s } of scenarios) {
    if (s.page !== 1) continue;
    const p = s.params.p1;
    if (passes(s.goalConds, p1Context(p.f, p.e, p.al)))
      problems.push(`${file}: 開始パラメータで即クリアになる`);
    let reachable = false;
    outer: for (let f = 0; f <= 100; f += 5) {
      for (let e = 0; e <= 100; e += 5) {
        for (const al of ['greedy', 'dp']) {
          if (passes(s.goalConds, p1Context(f, e, al))) {
            reachable = true;
            break outer;
          }
        }
      }
    }
    if (!reachable) problems.push(`${file}: グリッド全探索でゴールに到達できない`);
  }
  assert.deepEqual(problems, []);
});
