import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('detail accordions name their controlled panel and initial state', () => {
  for (const id of ['p1Details', 'p2Details', 'p3Details']) {
    assert.match(
      html,
      new RegExp(
        `aria-controls="${id}" aria-expanded="false" onclick="toggleAcc\\('${id}',this\\)"`
      )
    );
  }
});

test('detail accordion visual and accessible state change together', () => {
  assert.match(ui, /btn\.classList\.toggle\('open',open\)/);
  assert.match(ui, /btn\.setAttribute\('aria-expanded',String\(open\)\)/);
});
