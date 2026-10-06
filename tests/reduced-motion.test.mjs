import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../web/css/app.css', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('reduced-motion preference suppresses decorative motion and continuous canvas loops', () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /animation-duration:\.01ms!important/);
  assert.match(
    ui,
    /const OS_REDUCED_MOTION = window\.matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)\?\.matches \?\? false;/
  );
  assert.match(ui, /const REDUCED_MOTION = OS_REDUCED_MOTION && !MOTION_OPT_IN;/);
  assert.match(ui, /if\(REDUCED_MOTION\)drawAgents\(\);else agentLoop\(\);/);
  assert.match(ui, /if\(REDUCED_MOTION\)drawScatter\(\);else scatterLoop\(\);/);
  assert.match(ui, /if\(!REDUCED_MOTION\)p3Loop\(\);/);
  assert.match(ui, /if\(!REDUCED_MOTION\)p4Loop\(\);/);
  assert.match(ui, /if\(REDUCED_MOTION&&p3Ctx\)\{stepP3\(\);drawP3\(\);\}/);
  assert.match(ui, /if\(REDUCED_MOTION&&p4Ctx\)\{manageSpam\(\);drawP4\(\);\}/);
});

test('people on a reduced-motion device can choose to see the simulation move', () => {
  // 既定は端末の設定に従う（選んだときだけ動かす）
  assert.match(ui, /let MOTION_OPT_IN = false;/);
  assert.match(ui, /localStorage\.getItem\('ssd_motion_optin'\) === '1'/);
  // 設定がオンの端末にだけ、動かす／止めるボタンを出す
  assert.match(ui, /function renderMotionNotice\(\)\{\n  if\(!OS_REDUCED_MOTION\)return;/);
  assert.match(ui, /▶ 動かして見る/);
  assert.match(ui, /■ 動きを止める/);
  assert.match(ui, /\(function init\(\)\{\n  renderMotionNotice\(\);/);
});
