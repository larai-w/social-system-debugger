import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('metric modal keeps Tab focus within its close and methodology controls', () => {
  assert.match(ui, /trapMetricModalFocus\(e\)/);
  assert.match(ui, /function trapMetricModalFocus\(event\)/);
  assert.match(ui, /if\(event\.key!==\'Tab\'\)return/);
  assert.match(ui, /modal\.querySelectorAll\('button:not\(\[disabled\]\),a\[href\]'\)/);
  assert.match(ui, /event\.shiftKey&&document\.activeElement===first/);
  assert.match(ui, /document\.activeElement===last/);
});
