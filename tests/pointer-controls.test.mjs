import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../web/js/ui.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../web/css/app.css', import.meta.url), 'utf8');

test('clickable metric explanations and links gain keyboard button semantics', () => {
  assert.match(ui, /function enhancePointerControls\(\)/);
  assert.match(ui, /\.si\[onclick\],\.link-badge\[onclick\],\[onclick\*="openModal\("\]/);
  assert.match(ui, /el\.setAttribute\('role','button'\)/);
  assert.match(ui, /event\.key!==\'Enter\'&&event\.key!==\' \'/);
  assert.match(ui, /enhancePointerControls\(\);/);
  assert.match(css, /\[role="button"\]\.kbd-action:focus-visible/);
});
