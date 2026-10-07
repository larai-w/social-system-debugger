import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const lp = await readFile(new URL('../web/lp/index.html', import.meta.url), 'utf8');

test('landing page stays script-free', () => {
  assert.match(lp, /script-src 'none'/);
  assert.doesNotMatch(lp, /<script/i);
});

test('people on a reduced-motion device can choose to see the landing page move', () => {
  // 既定は端末の設定に従い、:has() が使えないブラウザでは止めたまま
  assert.match(lp, /@supports not selector\(:has\(a\)\)/);
  assert.match(
    lp,
    /body:not\(:has\(#motion-optin:checked\)\) video \{\s*display: none !important;/
  );
  // 切り替えはチェックボックスとラベル（JavaScript なし）
  assert.match(lp, /<input type="checkbox" id="motion-optin"/);
  assert.match(lp, /<label for="motion-optin"/);
  assert.match(lp, /▶ 動画を再生する/);
  assert.match(lp, /■ 動画を止める/);
});

test('still images do not show under the videos on ordinary devices', () => {
  // .clip img { display: block } より強いセレクタで隠す（#202 では動画の下に静止画が重なっていた）
  assert.match(lp, /\.clip \.still,[\s\S]*?\{\s*display: none;/);
});

test('YouTube videos are plain links, so nothing reaches YouTube until someone taps one', () => {
  assert.doesNotMatch(lp, /<iframe/i);
  assert.doesNotMatch(lp, /frame-src/);
  // 画像は自分のサイトからだけ（YouTube のサムネイルは読み込まない）
  assert.match(lp, /img-src 'self' data:;/);
});

test('placeholder YouTube ids never show on the landing page', () => {
  // 公開後に VIDEO_ID_* を本物の id に差し替えるまで、動画の場所は hidden のままにする
  if (/VIDEO_ID_/.test(lp)) assert.match(lp, /<section id="videos" hidden>/);
});
