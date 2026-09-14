import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('percentage sliders expose their unit in accessible value text', () => {
  for (const id of [
    'filterRate',
    'historicalImmunity',
    'shrinkRate',
    'dxRate',
    'groundingRate',
    'learningRate',
    'extTraffic',
    'gamification',
  ]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*data-value-unit="percent"`));
  }
  assert.match(
    ui,
    /if\(el\.dataset\.valueUnit==='percent'\)el\.setAttribute\('aria-valuetext',el\.value\+'%'\)/
  );
  assert.match(ui, /setPct\(document\.getElementById\('historicalImmunity'\)\)/);
});
