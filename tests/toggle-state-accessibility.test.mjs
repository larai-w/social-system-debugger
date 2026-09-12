import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('algorithm and public-reboot choices expose their selected state', () => {
  for (const id of [
    'btnDP',
    'btnGreedy',
    'btnDPP2',
    'btnGreedyP2',
    'btnRebootOff',
    'btnRebootOn',
  ]) {
    assert.match(html, new RegExp(`id="${id}" aria-pressed="(?:true|false)"`));
  }
  assert.match(ui, /function setAlgoUI\(a\)/);
  assert.match(ui, /btnGreedy'\)\.setAttribute\('aria-pressed',String\(greedy\)\)/);
  assert.match(ui, /btnGreedyP2'\)\.setAttribute\('aria-pressed',String\(a==='greedy'\)\)/);
  assert.match(ui, /btnRebootOn'\)\.setAttribute\('aria-pressed',String\(on\)\)/);
  assert.match(ui, /btnRebootOn'\)\.setAttribute\('aria-pressed',String\(p\.r\)\)/);
});
