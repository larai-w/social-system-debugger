import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../web/css/app.css', import.meta.url), 'utf8');

test('keyboard focus is visible for native and enhanced controls', () => {
  assert.match(css, /:where\(button,a,input,select,textarea,\[role="button"\]\):focus-visible/);
  assert.match(css, /outline:2px solid var\(--cyan\)!important/);
  assert.match(css, /outline-offset:3px/);
  assert.doesNotMatch(css, /\[role="button"\]\.kbd-action:focus-visible/);
});
