// share.js の共有URLビルダー（xIntentUrl / lineShareUrl）の回帰防止テスト。
// share.js はトップレベル即時実行が無い（関数宣言のみ）ので、そのまま関数として読み込める。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../web/js/share.js', import.meta.url)), 'utf8');
const sh = new Function(src + '\nreturn { xIntentUrl, lineShareUrl };')();

test('xIntentUrl encodes the text into the X intent URL', () => {
  const u = sh.xIntentUrl('hello world & 崩壊');
  assert.ok(u.startsWith('https://twitter.com/intent/tweet?text='));
  assert.equal(u, 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('hello world & 崩壊'));
  // 生の空白/アンパサンドが残っていない（正しくエンコードされている）
  assert.ok(!/ /.test(u.split('text=')[1]));
});

test('lineShareUrl uses the official lineit endpoint with url+text params', () => {
  const url = 'https://larai-w.github.io/social-system-debugger/?f=88&e=12';
  const text = '今週のシナリオ';
  const u = sh.lineShareUrl(url, text);
  assert.ok(u.startsWith('https://social-plugins.line.me/lineit/share?'));
  assert.ok(u.includes('url=' + encodeURIComponent(url)));
  assert.ok(u.includes('text=' + encodeURIComponent(text)));
  // 共有URL内の & がパラメータ区切りと混ざらない（エンコード済み）
  assert.ok(u.includes(encodeURIComponent('?f=88&e=12')));
});
