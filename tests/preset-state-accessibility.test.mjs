import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

const presetIds = [
  'p-weimar',
  'p-populism',
  'p-sns',
  'p-techno',
  'p-nordic',
  'p2-deadlock',
  'p2-efficiency',
  'p2-smart',
  'p2-redundant',
  'p3-reflex',
  'p3-frozen',
  'p3-fasting',
  'p3-debugger',
  'p4-flamewar',
  'p4-gamified',
  'p4-spectators',
  'p4-plaza',
];

test('scenario presets expose their initial pressed state', () => {
  for (const id of presetIds) {
    assert.match(html, new RegExp(`id="${id}" aria-pressed="false"`));
  }
});

test('scenario presets update visual and accessible state together on every page', () => {
  assert.match(ui, /function setPresetButtonState\(prefix,presets,selectedId\)/);
  assert.match(ui, /button\.classList\.toggle\('sel',selected\)/);
  assert.match(ui, /button\.setAttribute\('aria-pressed',String\(selected\)\)/);
  for (const [prefix, presets] of [
    ['p-', 'PRESETS'],
    ['p2-', 'PRESETS_P2'],
    ['p3-', 'PRESETS_P3'],
    ['p4-', 'PRESETS_P4'],
  ]) {
    assert.match(ui, new RegExp(`setPresetButtonState\\('${prefix}',${presets},id\\)`));
    assert.match(ui, new RegExp(`setPresetButtonState\\('${prefix}',${presets},null\\)`));
  }
});
