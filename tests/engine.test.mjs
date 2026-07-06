// engine.js のユニットテスト（node:test / 追加依存なし）
// engine.js は DOM/window 非依存の純粋ロジック層（タスク1で分離）。
// 分類スクリプトを使わず、ソースを関数として読み込み、公開したい関数を return で取り出す。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../web/js/engine.js', import.meta.url)), 'utf8');
// engine.js の中の関数/定数はこの Function スコープに閉じる。必要なものだけ返す。
const eng = new Function(src + '\nreturn { clamp, lerp, seedRng, genScatter, simTimeline, metrics };')();

test('clamp bounds values', () => {
  assert.equal(eng.clamp(5, 0, 10), 5);
  assert.equal(eng.clamp(-3, 0, 10), 0);
  assert.equal(eng.clamp(42, 0, 10), 10);
});

test('lerp interpolates linearly', () => {
  assert.equal(eng.lerp(0, 10, 0), 0);
  assert.equal(eng.lerp(0, 10, 1), 10);
  assert.equal(eng.lerp(0, 10, 0.5), 5);
});

test('seedRng is deterministic and in [0,1)', () => {
  const a = eng.seedRng(123), b = eng.seedRng(123);
  for (let i = 0; i < 5; i++) {
    const x = a();
    assert.equal(x, b(), 'same seed -> same sequence');
    assert.ok(x >= 0 && x < 1, 'within [0,1)');
  }
});

test('metrics returns all keys within [0,100] and a boolean crash', () => {
  const m = eng.metrics(50, 50, 'dp');
  const keys = ['entropy','paranoia','socialCap','dopamine','infra','diversity','trust','resilience','legitimacy','infoH','viability','mentalWB'];
  for (const k of keys) assert.ok(m[k] >= 0 && m[k] <= 100, `${k} in range (got ${m[k]})`);
  assert.equal(typeof m.crash, 'boolean');
});

test('metrics: healthy (nordic-like) beats collapse (weimar-like)', () => {
  const weimar = eng.metrics(88, 12, 'greedy');
  const nordic = eng.metrics(18, 90, 'dp');
  assert.ok(nordic.socialCap > weimar.socialCap, 'nordic social capital higher');
  assert.ok(nordic.diversity > weimar.diversity, 'nordic diversity higher');
  assert.ok(nordic.legitimacy > weimar.legitimacy, 'nordic legitimacy higher');
});

test('metrics: extreme echo-chamber + low ethics + greedy triggers crash', () => {
  const m = eng.metrics(100, 0, 'greedy');
  assert.equal(m.crash, true);
});

test('simTimeline returns arrays of the requested length', () => {
  const r = eng.simTimeline(50, 50, 'dp', 65);
  assert.equal(r.dp.length, 65);
  assert.equal(r.sc.length, 65);
  assert.equal(r.inf.length, 65);
  for (const v of r.sc) assert.ok(v >= 0 && v <= 100);
});

test('genScatter returns real+fake points totalling 130', () => {
  const g = eng.genScatter(50);
  assert.equal(g.real.length + g.fake.length, 130);
});
