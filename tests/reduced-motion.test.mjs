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
    /const REDUCED_MOTION = window\.matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)\?\.matches \?\? false;/
  );
  assert.match(ui, /if\(REDUCED_MOTION\)drawAgents\(\);else agentLoop\(\);/);
  assert.match(ui, /if\(REDUCED_MOTION\)drawScatter\(\);else scatterLoop\(\);/);
  assert.match(ui, /if\(!REDUCED_MOTION\)p3Loop\(\);/);
  assert.match(ui, /if\(!REDUCED_MOTION\)p4Loop\(\);/);
  assert.match(ui, /if\(REDUCED_MOTION&&p3Ctx\)\{stepP3\(\);drawP3\(\);\}/);
  assert.match(ui, /if\(REDUCED_MOTION&&p4Ctx\)\{manageSpam\(\);drawP4\(\);\}/);
});
