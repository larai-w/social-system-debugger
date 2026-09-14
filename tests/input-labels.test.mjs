import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');

test('free-text inputs have programmatic labels from their visible context', () => {
  for (const [input, label] of [
    ['auditText', 'auditTitle'],
    ['townNameInput', 'townNameLabel'],
    ['fbMessage', 'fbMessageLabel'],
    ['fbEmail', 'fbEmailLabel'],
    ['shareCommentInput', 'shareCommentTitle'],
  ]) {
    assert.match(html, new RegExp(`id="${input}"[^>]*aria-labelledby="${label}"`));
    assert.match(html, new RegExp(`id="${label}"`));
  }
});
