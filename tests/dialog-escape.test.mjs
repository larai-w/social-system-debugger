import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('Escape closes only the topmost open dialog through its own close control', () => {
  assert.match(ui, /function closeTopDialogOnEscape\(event\)/);
  assert.match(ui, /document\.querySelectorAll\('\.mo\.on'\)\]\.?at\(-1\)/);
  assert.match(ui, /dialog\.querySelector\('\.mc'\)\?\.click\(\)/);
  assert.match(ui, /closeTopDialogOnEscape\(e\);/);
  assert.doesNotMatch(ui, /closeModal\(\);closeIntro\(\);closeAudit\(\)/);
  assert.doesNotMatch(
    ui,
    /closeSharePop\(\);closeShareGuide\(\);closeFeedback\(\);closeDiscoveryLog\(\)/
  );
});
