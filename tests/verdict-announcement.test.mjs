import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('verdict changes have one polite, atomic screen-reader announcement route', () => {
  assert.match(
    html,
    /id="verdictAnnouncement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"/
  );
  assert.match(ui, /function announceVerdict\(text\)/);
  assert.match(ui, /announceVerdict\(at\.textContent\);/);
  assert.match(ui, /if\(al\.dataset\.bst===sig\)return/);
});
