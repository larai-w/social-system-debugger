import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../web/css/app.css', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('reduced-motion preference suppresses decorative CSS motion; canvas loops stop only when the person stops them', () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /animation-duration:\.01ms!important/);
  assert.match(
    ui,
    /const OS_REDUCED_MOTION = window\.matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)\?\.matches \?\? false;/
  );
  assert.match(ui, /const REDUCED_MOTION = OS_REDUCED_MOTION && MOTION_OFF;/);
  assert.match(ui, /if\(REDUCED_MOTION\)drawAgents\(\);else agentLoop\(\);/);
  assert.match(ui, /if\(REDUCED_MOTION\)drawScatter\(\);else scatterLoop\(\);/);
  assert.match(ui, /if\(!REDUCED_MOTION\)p3Loop\(\);/);
  assert.match(ui, /if\(!REDUCED_MOTION\)p4Loop\(\);/);
  assert.match(ui, /if\(REDUCED_MOTION&&p3Ctx\)\{stepP3\(\);drawP3\(\);\}/);
  assert.match(ui, /if\(REDUCED_MOTION&&p4Ctx\)\{manageSpam\(\);drawP4\(\);\}/);
});

test('reduced-motion devices see gentle canvas motion by default and can stop it', () => {
  // 既定は動かす（点の漂い）。止めたら、その端末では覚えておく
  assert.match(ui, /let MOTION_OFF = false;/);
  assert.match(ui, /localStorage\.getItem\('ssd_motion_off'\) === '1'/);
  // 止める／再生するボタンは「動きを減らす」の端末にだけ出す
  assert.match(ui, /function renderMotionNotice\(\)\{\n  if\(!OS_REDUCED_MOTION\)return;/);
  assert.match(ui, /■ アニメーションを止める/);
  assert.match(ui, /▶ アニメーションを再生する/);
  assert.match(ui, /\(function init\(\)\{\n  renderMotionNotice\(\);/);
  // CSS の飾りの動き（揺れ・点滅）は今までどおり止める
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
