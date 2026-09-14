import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('applying a preset announces the selected scenario through the existing polite status route', () => {
  assert.match(ui, /function announcePreset\(prefix,id\)/);
  assert.match(ui, /announceVerdict\(tt\(`\$\{label\} を適用しました`,`\$\{label\} applied\.`\)\)/);
  for (const prefix of ['p-', 'p2-', 'p3-', 'p4-']) {
    assert.match(ui, new RegExp(`announcePreset\\('${prefix}',id\\)`));
  }
});
