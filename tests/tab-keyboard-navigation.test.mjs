import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('page tabs support standard keyboard navigation with automatic activation', () => {
  assert.match(ui, /document\.querySelector\('\.tab-bar'\)\?\.addEventListener\('keydown',event=>/);
  assert.match(ui, /\['ArrowLeft','ArrowRight','Home','End'\]\.includes\(event\.key\)/);
  assert.match(ui, /event\.currentTarget\.querySelectorAll\('\[role="tab"\]'\)/);
  assert.match(ui, /tabs\[next\]\.focus\(\)/);
  assert.match(ui, /switchTab\(next\+1\)/);
});

test('only the active page tab is in the Tab sequence', () => {
  assert.match(
    html,
    /id="tab1Btn" role="tab" aria-selected="true" aria-controls="page1" tabindex="0"/
  );
  for (const page of [2, 3, 4]) {
    assert.match(
      html,
      new RegExp(
        `id="tab${page}Btn" role="tab" aria-selected="false" aria-controls="page${page}" tabindex="-1"`
      )
    );
  }
  assert.match(ui, /tb\.tabIndex=n===i\?0:-1/);
});
