// T40: 週替わりシナリオの「クリア可能性」ガードレール — PAGE 2〜4 版
//   PAGE 1 は tests/weekly-reachability.test.mjs が実エンジンのグリッド探索で検証済み。
//   PAGE 2〜4 の metrics は ui.js の動的シミュレーション内にあるため、ここでは ui.js の
//   実装関数をソース抽出して headless 実行し、次の2点を CI で検証する:
//     (a) 開始パラメータ（＋開始直後の状態・放置）でクリアにならない（開始即クリア事故の防止）
//     (b) スライダー/アクションの探索空間でゴールに到達可能（クリア不能事故の防止）
//   これにより委任時の「数値トレース表の親検証」を機械化する。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(fileURLToPath(new URL(p, root)), 'utf8');
const uiSrc = read('web/js/ui.js');

// ── ui.js から関数定義をソース抽出（波括弧バランスで切り出し） ──────────────
function fnSrc(name) {
  const i = uiSrc.indexOf(`function ${name}(`);
  assert.ok(
    i >= 0,
    `ui.js に function ${name} が見つからない（リネームされたらこのテストを同期して）`
  );
  let depth = 0;
  for (let k = uiSrc.indexOf('{', i); k < uiSrc.length; k++) {
    if (uiSrc[k] === '{') depth++;
    else if (uiSrc[k] === '}' && --depth === 0) return uiSrc.slice(i, k + 1);
  }
  throw new Error(`function ${name} の波括弧が閉じない`);
}

// ── P4 だけは updateP4Monitor が DOM に密結合のため式を複製する。
//    実装が変わったら気づけるように、式の文字列がソースに存在することをアサートする。
assert.ok(
  uiSrc.includes('jamRatio*72+gamification*(filterActive?0.08:0.3)'),
  'ui.js の P4 drop 式が変更された — このテストの p4Metrics を同期して'
);
assert.ok(
  uiSrc.includes('100-gamification*0.85-(filterActive?0:extTraffic*0.2)'),
  'ui.js の P4 ratio 式が変更された — このテストの p4Metrics を同期して'
);
assert.ok(
  uiSrc.includes('clamp(100-avgC*100,0,100)'),
  'ui.js の P3 integrity 式が変更された — このテストの integ 計算を同期して'
);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── 判定文脈（scenario.js scenarioContext の再現: グローバル既定0 + ページ metrics 重ね） ──
const GLOBAL_DEFAULTS = {
  ethicsScore: 0,
  filterRate: 0,
  skillStock: 0,
  searchDepth: 0,
  groundingRate: 0,
  learningRate: 0,
  extTraffic: 0,
  gamification: 0,
};
const ctx = (globals, metricsObj) => Object.assign({}, GLOBAL_DEFAULTS, globals, metricsObj);

const OPS = {
  '>=': (v, x) => v >= x,
  '<=': (v, x) => v <= x,
  '>': (v, x) => v > x,
  '<': (v, x) => v < x,
  '==': (v, x) => v === x,
  '!=': (v, x) => v !== x,
};
const passes = (conds, c) =>
  conds.every((cond) => {
    const v = Number(c[cond.metric]);
    return !Number.isNaN(v) && OPS[cond.op](v, cond.value);
  });

// ── シナリオ読込（配信JSON + バンドル版フォールバック。既存テストと同じ流儀） ──
const weeklyDir = fileURLToPath(new URL('content/weekly/', root));
const scenarios = readdirSync(weeklyDir)
  .filter((f) => f.endsWith('.json') && f !== 'latest.json')
  .map((f) => ({ file: f, s: JSON.parse(readFileSync(weeklyDir + f, 'utf8')) }));
const scenarioSrc = read('web/js/scenario.js');
const bundled = new Function('document', 'window', scenarioSrc + '\nreturn SCENARIOS;')(
  { addEventListener() {} },
  {}
);
for (const s of bundled) scenarios.push({ file: `bundled:${s.id}`, s });

// ── PAGE 2 ハーネス: metricsP2 + tickSkillStock を実ソースで実行 ─────────────
function makeP2() {
  return new Function(`
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    let skillStock=50, skillLost=false, publicReboot=false, rootRestricted=false,
        shockState=null, dxRate=30;
    const updateAllP2=()=>{};
    ${fnSrc('calcRedundancyBuffer')}
    ${fnSrc('p2SkillFactor')}
    ${fnSrc('metricsP2')}
    ${fnSrc('tickSkillStock')}
    return {
      metrics:(s,d,al,e)=>metricsP2(s,d,al,e),
      tick:()=>tickSkillStock(),
      set:(o)=>{
        if('skillStock' in o)skillStock=o.skillStock;
        if('skillLost' in o)skillLost=o.skillLost;
        if('publicReboot' in o)publicReboot=o.publicReboot;
        if('rootRestricted' in o)rootRestricted=o.rootRestricted;
        if('dxRate' in o)dxRate=o.dxRate;
      },
      skill:()=>skillStock,
    };
  `)();
}
// applyScenarioParams の skillStock 初期化規則（scenario.js と同期）
assert.ok(
  scenarioSrc.includes(
    'if (p.d >= 45) skillStock = 80; else if (p.d < 25) skillStock = 10; else skillStock = 50;'
  ),
  'scenario.js の skillStock 初期化規則が変更された — p2StartSkill を同期して'
);
const p2StartSkill = (d) => (d >= 45 ? 80 : d < 25 ? 10 : 50);

// skillStock は d>45 のtickで上昇・d<25 で下降・reboot で60復帰できるため、
// 時間をかければ [0,100] の任意値に到達可能（到達可能性探索では自由変数として扱う）。
const GRID = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function p2PreCleared(s) {
  const p = s.params.p2;
  const h = makeP2();
  h.set({ publicReboot: !!p.reboot, skillStock: p2StartSkill(p.d), dxRate: p.d });
  const m = h.metrics(p.s, p.d, p.al, p.e);
  if (passes(s.goalConds, ctx({}, m))) return true;
  // 放置クリアの検査: 開始パラメータのまま skillStock だけ時間発展させる（60tick ≒ 72秒）
  for (let t = 0; t < 60; t++) {
    h.tick();
    if (passes(s.goalConds, ctx({}, h.metrics(p.s, p.d, p.al, p.e)))) return true;
  }
  return false;
}
function p2Reachable(s) {
  const h = makeP2();
  for (const reboot of [false, true])
    for (const rr of [false, true])
      for (const al of ['greedy', 'dp'])
        for (const sv of GRID)
          for (const dv of GRID)
            for (const ev of GRID)
              for (const skill of GRID) {
                h.set({
                  publicReboot: reboot,
                  rootRestricted: rr,
                  skillStock: skill,
                  skillLost: false,
                });
                const m = h.metrics(sv, dv, al, ev);
                if (passes(s.goalConds, ctx({}, m))) return true;
              }
  return false;
}

// ── PAGE 3 ハーネス: stepP3 + p3Fooling を実ソースで実行（1一般ノードで代表） ──
function makeP3() {
  return new Function(`
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    let searchDepth=5, groundingRate=50, learningRate=50, dropoutActive=false;
    let p3Nodes=[{type:'fake',c:1,dop:100,pulse:0},{type:'general',c:0.05,dop:6}];
    ${fnSrc('p3Fooling')}
    ${fnSrc('stepP3')}
    return {
      step:()=>stepP3(),
      set:(o)=>{
        if('searchDepth' in o)searchDepth=o.searchDepth;
        if('groundingRate' in o)groundingRate=o.groundingRate;
        if('learningRate' in o)learningRate=o.learningRate;
        if('dropoutActive' in o)dropoutActive=o.dropoutActive;
      },
      state:()=>({c:p3Nodes[1].c,dop:p3Nodes[1].dop}),
      seed:(c,dop)=>{p3Nodes[1].c=c;p3Nodes[1].dop=dop;},
    };
  `)();
}
const p3Ctx = (depth, ground, lr, st) =>
  ctx(
    { searchDepth: depth, groundingRate: ground, learningRate: lr },
    {
      integrity: Math.round(clamp(100 - st.c * 100, 0, 100)),
      dopamine: Math.round(st.dop),
      depth,
    }
  );
function p3PreCleared(s) {
  const p = s.params.p3;
  const h = makeP3();
  h.set({ searchDepth: p.depth, groundingRate: p.ground, learningRate: p.lr });
  h.seed(0.05, 6); // 開始時の一般ノード初期値（c=r()*0.1, dop=r()*12 の期待値）
  if (passes(s.goalConds, p3Ctx(p.depth, p.ground, p.lr, h.state()))) return true;
  for (let t = 0; t < 600; t++) {
    h.step();
    if (passes(s.goalConds, p3Ctx(p.depth, p.ground, p.lr, h.state()))) return true;
  }
  return false;
}
function p3Reachable(s) {
  const p = s.params.p3;
  // 開始パラメータで300step 汚染を進めた状態から、候補パラメータへ切替えて回復を試みる
  const seed = makeP3();
  seed.set({ searchDepth: p.depth, groundingRate: p.ground, learningRate: p.lr });
  seed.seed(0.05, 6);
  for (let t = 0; t < 300; t++) seed.step();
  const s0 = seed.state();
  const DEPTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (const dropout of [false, true])
    for (const depth of DEPTHS)
      for (const ground of GRID)
        for (const lr of GRID) {
          const h = makeP3();
          h.set({
            searchDepth: depth,
            groundingRate: ground,
            learningRate: lr,
            dropoutActive: dropout,
          });
          h.seed(s0.c, s0.dop);
          for (let t = 0; t < 600; t++) {
            if (passes(s.goalConds, p3Ctx(depth, ground, lr, h.state()))) return true;
            h.step();
          }
          if (passes(s.goalConds, p3Ctx(depth, ground, lr, h.state()))) return true;
        }
  return false;
}

// ── PAGE 4: 式複製（冒頭のソース同期アサートでドリフト検知） ────────────────
function p4Metrics(gam, ext, filterActive, jam) {
  const drop = Math.round(clamp(jam * 72 + gam * (filterActive ? 0.08 : 0.3), 0, 100));
  const ratio = Math.round(clamp(100 - gam * 0.85 - (filterActive ? 0 : ext * 0.2), 0, 100));
  return { drop, ratio };
}
const p4Ctx = (gam, ext, m) => ctx({ gamification: gam, extTraffic: ext }, m);
function p4PreCleared(s) {
  const p = s.params.p4;
  // 開始直後（スパム未到達 jam≈0）〜定常（extに比例して詰まる）まで、どこかで通れば事故
  for (const jam of [0, (0.5 * p.ext) / 100, Math.min(1, p.ext / 100)])
    if (passes(s.goalConds, p4Ctx(p.gam, p.ext, p4Metrics(p.gam, p.ext, false, jam)))) return true;
  return false;
}
function p4Reachable(s) {
  for (const filter of [false, true])
    for (const gam of GRID)
      for (const ext of GRID)
        for (const jamF of [0, 0.25, 0.5, 0.75, 1]) {
          const jam = filter ? 0 : jamF * (ext / 100);
          if (passes(s.goalConds, p4Ctx(gam, ext, p4Metrics(gam, ext, filter, jam)))) return true;
        }
  return false;
}

// ── 実行 ─────────────────────────────────────────────────────
const CHECKERS = {
  2: { pre: p2PreCleared, reach: p2Reachable, params: 'p2' },
  3: { pre: p3PreCleared, reach: p3Reachable, params: 'p3' },
  4: { pre: p4PreCleared, reach: p4Reachable, params: 'p4' },
};

test('page-2〜4 scenarios: not pre-cleared (start params + idle time)', () => {
  const problems = [];
  for (const { file, s } of scenarios) {
    const c = CHECKERS[s.page];
    if (!c || !s.params[c.params]) continue;
    if (c.pre(s)) problems.push(`${file}: 開始パラメータ（＋放置）でクリアになってしまう`);
  }
  assert.deepEqual(problems, []);
});

test('page-2〜4 scenarios: goal reachable via slider/action search', () => {
  const problems = [];
  for (const { file, s } of scenarios) {
    const c = CHECKERS[s.page];
    if (!c || !s.params[c.params]) continue;
    if (!c.reach(s)) problems.push(`${file}: 探索空間でゴールに到達できない`);
  }
  assert.deepEqual(problems, []);
});
