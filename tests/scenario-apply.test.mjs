// applyScenarioParams（週替わりシナリオの読み込み）の回帰テスト。
// 2026-10-15: シナリオを読み込んでも、つまみ横の数字が古いまま（W36 で倫理観 30 なのに 68 と表示）
// だった。PAGE 2 では algoP2 ではなく PAGE 1 の algo を書き換えていて、DP 指定のシナリオ
// （W29・W31・W47・W52）がボタンだけ DP・計算は前の Greedy のまま動いていた。
// scenario.js を最小の DOM スタブと ui.js の状態変数つきで読み込み、関数を直接呼ぶ。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../web/js/scenario.js', import.meta.url)), 'utf8');

function makeEl(id) {
  const classes = new Set();
  let text = 'STALE';
  return {
    id,
    value: '',
    // ブラウザと同じく、数値を入れても文字列になる
    get textContent() {
      return text;
    },
    set textContent(v) {
      text = String(v);
    },
    dataset: {},
    attrs: {},
    style: { setProperty() {} },
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
      contains: (c) => classes.has(c),
    },
  };
}

function load() {
  const els = new Map();
  const document = {
    addEventListener() {},
    getElementById(id) {
      if (!els.has(id)) els.set(id, makeEl(id));
      return els.get(id);
    },
  };
  // ui.js が持つ状態変数と、scenario.js が呼ぶ ui.js の関数
  const state = `
    let filterRate=50, ethicsScore=50, algo='greedy';
    let shrinkRate=10, dxRate=30, algoP2='greedy', ethicsP2=68, publicReboot=false, skillStock=50, skillLost=false, shockState=null;
    let searchDepth=7, groundingRate=20, learningRate=40;
    let extTraffic=50, gamification=50;
    function setPct(){} function updateAll(){} function updateAllP2(){} function updateP3Chart(){} function updateP4Chart(){}
    function setAlgoUI(a){ algo=a; }
  `;
  const api = new Function(
    'document',
    'window',
    state +
      src +
      '\nreturn { applyScenarioParams, get: () => ({ algo, algoP2, shrinkRate, ethicsP2, publicReboot, skillLost, shockState }) };'
  )(document, {});
  return { ...api, el: (id) => document.getElementById(id) };
}

test('P1: scenario load updates the value labels', () => {
  const t = load();
  t.applyScenarioParams({ params: { p1: { f: 66, e: 38, al: 'greedy' } } });
  assert.equal(t.el('filterVal').textContent, '66%');
  assert.equal(t.el('ethicsVal').textContent, '38');
});

test('P2: scenario load updates the value labels (W36: ethics 30 must not show 68)', () => {
  const t = load();
  t.applyScenarioParams({ params: { p2: { s: 20, d: 20, e: 30, al: 'greedy', reboot: false } } });
  assert.equal(t.el('shrinkVal').textContent, '20%');
  assert.equal(t.el('dxVal').textContent, '20%');
  assert.equal(t.el('ethicsP2Val').textContent, '30');
});

test('P2: algorithm goes to algoP2, and PAGE 1 algo is left alone', () => {
  const t = load();
  t.applyScenarioParams({ params: { p2: { s: 30, d: 10, e: 80, al: 'dp', reboot: false } } });
  assert.equal(t.get().algoP2, 'dp');
  assert.equal(t.get().algo, 'greedy');
  assert.equal(t.el('btnDPP2').attrs['aria-pressed'], 'true');
  assert.equal(t.el('btnGreedyP2').attrs['aria-pressed'], 'false');
});

test('P3: scenario load updates the value labels', () => {
  const t = load();
  t.applyScenarioParams({ params: { p3: { depth: 3, ground: 25, lr: 60 } } });
  assert.equal(t.el('depthVal').textContent, '3');
  assert.equal(t.el('groundVal').textContent, '25%');
  assert.equal(t.el('lrVal').textContent, '60%');
});

test('P4: scenario load updates the value labels', () => {
  const t = load();
  t.applyScenarioParams({ params: { p4: { ext: 70, gam: 75 } } });
  assert.equal(t.el('extVal').textContent, '70%');
  assert.equal(t.el('gamVal').textContent, '75%');
});
