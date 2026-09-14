import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('non-metric dialogs receive focus, trap Tab, and restore their trigger', () => {
  assert.match(ui, /function dialogControls\(dialog\)/);
  assert.match(ui, /getComputedStyle\(el\)\.display!==\'none\'/);
  assert.match(ui, /function trapOpenDialogFocus\(event\)/);
  assert.match(ui, /document\.querySelectorAll\('\.mo\.on:not\(#modal\)'\)/);
  assert.match(
    ui,
    /if\(!dialog\.contains\(active\)\)\{event\.preventDefault\(\);first\.focus\(\);return;\}/
  );
  assert.match(ui, /function observeDialogFocus\(\)/);
  assert.match(ui, /new MutationObserver/);
  assert.match(ui, /requestAnimationFrame\(\(\)=>dialogControls\(dialog\)\[0\]\?\.focus\(\)\)/);
  assert.match(
    ui,
    /if\(dialog\.contains\(document\.activeElement\)&&target\?\.isConnected\)requestAnimationFrame\(\(\)=>target\.focus\(\)\)/
  );
});
