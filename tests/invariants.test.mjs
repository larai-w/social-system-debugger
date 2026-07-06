// invariants.test.mjs — このリポジトリ特有の「壊れ方」を機械的に検知するガードレール。
// 能力差のある後任（別エージェント/Copilot 等）が触っても、退行した瞬間に CI/pre-commit が落ちる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const web = (p) => fileURLToPath(new URL('../web/' + p, import.meta.url));
const jsFiles = readdirSync(web('js')).filter((f) => f.endsWith('.js'));
const allJs = jsFiles.map((f) => readFileSync(web('js/' + f), 'utf8')).join('\n');
const html = readFileSync(web('index.html'), 'utf8');
const sw = readFileSync(web('sw.js'), 'utf8');

// ── 1) マークアップの inline ハンドラが呼ぶ関数は、必ずどこかの js で定義されている ──
// （モジュール分割・関数移動でグローバル参照が切れる＝過去に何度も起きた退行を防ぐ）
test('every inline on*="fn()" handler resolves to a defined function', () => {
  const BUILTINS = new Set(['event', 'window', 'document', 'Math', 'JSON', 'console',
    'stopPropagation', 'preventDefault', 'parseInt', 'parseFloat', 'alert', 'confirm',
    'prompt', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'Number', 'String', 'Boolean']);
  const handlers = html.match(/on[a-z]+="[^"]*"/g) || [];
  const names = new Set();
  for (const h of handlers) {
    for (const m of h.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) names.add(m[1]);
  }
  const missing = [];
  for (const fn of names) {
    if (BUILTINS.has(fn)) continue;
    const def = new RegExp(`function\\s+${fn}\\b|(?:const|let|var)\\s+${fn}\\b|\\b${fn}\\s*=\\s*(?:function|\\()`);
    if (!def.test(allJs)) missing.push(fn);
  }
  assert.deepEqual(missing, [], `未定義のハンドラ関数: ${missing.join(', ')}`);
});

// ── 2) engine.js / i18n.js は DOM/window 非依存（サーバー再利用・テストのため） ──
test('engine.js and i18n.js stay DOM/window-free', () => {
  for (const f of ['engine.js', 'i18n.js']) {
    const src = readFileSync(web('js/' + f), 'utf8');
    assert.ok(!/\bdocument\b/.test(src), `${f} が document を参照している`);
    assert.ok(!/\bwindow\b/.test(src), `${f} が window を参照している`);
  }
});

// ── 3) sw.js の CORE が全アプリコード(js/css/config)を網羅（オフライン/更新漏れ防止） ──
test('sw.js CORE lists every app js/css asset', () => {
  const assets = [...jsFiles.map((f) => 'js/' + f), 'css/app.css', 'config.js'];
  const missing = assets.filter((a) => !sw.includes(a));
  assert.deepEqual(missing, [], `sw.js CORE 未登録: ${missing.join(', ')}`);
});

// ── 4) index.html は全 js を読み込んでいる（config は js より前） ──
test('index.html loads every js module, config.js first', () => {
  for (const f of jsFiles) {
    assert.ok(html.includes(`js/${f}`), `index.html が js/${f} を読み込んでいない`);
  }
  const iConfig = html.indexOf('config.js');
  const iEngine = html.indexOf('js/engine.js');
  assert.ok(iConfig !== -1 && iConfig < iEngine, 'config.js は他 js より前に読み込むこと');
});
