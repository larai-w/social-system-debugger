// アクセシビリティ退行ガード（2026-10 監査の再発防止）: 静的に検査できるものだけを CI で固定する。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('--muted は最も明るい面(--bg2)の上で 4.5:1 以上（アプリ・LP 英語版）', () => {
  for (const f of ['web/css/app.css', 'web/lp/index.en.html']) {
    const m = read(f).match(/--muted:\s*(#[0-9a-fA-F]{6})/);
    assert.ok(m, f + ' に --muted がない');
    assert.ok(ratio(m[1], '#0f1829') >= 4.5, `${f}: ${m[1]} のコントラスト不足`);
  }
});

test('日本語 LP の主CTA は白文字で 4.5:1 以上', () => {
  const m = read('web/lp/index.html').match(/\.btn-main\s*\{\s*background:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m, '.btn-main の背景が固定色でない');
  assert.ok(ratio('#ffffff', m[1]) >= 4.5, m[1] + ' はコントラスト不足');
});

test('モーダルの閉じるボタンは英語固定の aria-label を持たない（i18n で切替）', () => {
  assert.equal(/class="mc"[^>]*aria-label="Close"/.test(read('web/index.html')), false);
  assert.match(read('web/js/ui.js'), /querySelectorAll\('\.mc'\)[^\n]*aria-label/);
});

test('index.html の読ませる文は .7rem 未満のインライン font-size を使わない', () => {
  const small = read('web/index.html').match(/font-size:\.[0-6]\d*rem/g) || [];
  assert.deepEqual(small, []);
});

test('SHARE のクリップボード失敗は握りつぶさず手動コピーに落とす', () => {
  const src = read('web/js/ui.js');
  const body = src.slice(src.indexOf('function shareURL()'), src.indexOf('let modalReturnFocus'));
  assert.match(body, /manualCopy/);
  assert.match(body, /\},manualCopy\)/);
});

test('≡メニューは狭幅で画面内に収まる fixed 配置（CSS）', () => {
  const css = read('web/css/app.css');
  assert.match(css, /\.menu-dropdown\{position:fixed;[^}]*left:10px;right:10px/);
});
