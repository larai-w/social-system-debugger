import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const read = (p) => readFileSync(root(p), 'utf8');
const stage5Files = ['web/stage5.html', 'web/stage5.en.html'];
const stage5Menu = /openAppPage\(['"](?:stage5|page5)['"]\)/i;

function section(path) {
  const content = read(path);
  const match = content.match(/^## Stage 5[^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
  assert.ok(match, `${path}: Stage 5 section missing`);
  return match[0];
}

test('Stage 5 public claims match the shipped app', () => {
  const menu = read('web/index.html');
  const implemented = stage5Files.every((path) => existsSync(root(path))) && stage5Menu.test(menu);
  const ja = section('README.md');
  const en = section('README.en.md');
  const designJa = read('docs/STAGE5.md');
  const designEn = read('docs/STAGE5.en.md');

  if (implemented) {
    assert.doesNotMatch(ja, /設計のみ・未実装|まだアプリに入っていません/);
    assert.doesNotMatch(en, /design only|not yet implemented|not in the app yet/i);
    return;
  }

  assert.match(ja, /設計のみ・未実装/);
  assert.match(ja, /まだアプリに入っていません/);
  assert.match(en, /design only.*not yet implemented/i);
  assert.match(en, /not in the app yet/i);
  assert.match(designJa, /設計文書です。この機能はまだアプリに入っていません/);
  assert.match(designEn, /This is a design document. The feature is not in the app yet/);
  assert.doesNotMatch(ja, /アプリのメニューから[^\n]*開けます/);
  assert.doesNotMatch(en, /(?:can|may) open[^\n]*from the app menu/i);
});
