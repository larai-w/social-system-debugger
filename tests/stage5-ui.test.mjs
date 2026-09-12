import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../web/stage5.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../web/js/stage5/ui.js', import.meta.url), 'utf8');

test('Stage 5 explains its prediction lock and provides a restart route', () => {
  assert.match(html, /id="lockNotice"/);
  assert.match(html, /id="restartLocked"/);
  assert.match(html, /結果を見てから書き換えられないよう固定/);
  assert.match(html, /cannot be rewritten after seeing results/);
  assert.match(ui, /state\.scene===1\)locked=true/);
  assert.match(ui, /function restartExperiment\(\)/);
  assert.match(ui, /el\('restartLocked'\)\.onclick=restartExperiment/);
});
