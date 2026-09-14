import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('metric modal names its content, receives focus, and restores its trigger', () => {
  assert.match(
    html,
    /role="dialog" aria-modal="true" aria-labelledby="mTitle" aria-describedby="mBody mFormula" id="modal"/
  );
  assert.match(ui, /let modalReturnFocus=null/);
  assert.match(
    ui,
    /modalReturnFocus=active instanceof HTMLElement&&active!==document\.body\?active:null/
  );
  assert.match(
    ui,
    /requestAnimationFrame\(\(\)=>document\.querySelector\('#modal \.mc'\)\?\.focus\(\)\)/
  );
  assert.match(ui, /if\(target\?\.isConnected\)requestAnimationFrame\(\(\)=>target\.focus\(\)\)/);
});
