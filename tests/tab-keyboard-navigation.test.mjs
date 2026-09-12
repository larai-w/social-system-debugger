import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('page tabs support standard keyboard navigation with automatic activation', () => {
  assert.match(ui, /document\.querySelector\('\.tab-bar'\)\?\.addEventListener\('keydown',event=>/);
  assert.match(ui, /\['ArrowLeft','ArrowRight','Home','End'\]\.includes\(event\.key\)/);
  assert.match(ui, /event\.currentTarget\.querySelectorAll\('\[role="tab"\]'\)/);
  assert.match(ui, /tabs\[next\]\.focus\(\)/);
  assert.match(ui, /switchTab\(next\+1\)/);
});
