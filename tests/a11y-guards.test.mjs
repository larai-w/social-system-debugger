// a11y-guards.test.mjs — 2026-10 の監査で見つかったアクセシビリティ退行の再発防止ガード（docs/learnings.md IN-22）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const web = (p) => fileURLToPath(new URL('../web/' + p, import.meta.url));
const css = readFileSync(web('css/app.css'), 'utf8');
const html = readFileSync(web('index.html'), 'utf8');
const ui = readFileSync(web('js/ui.js'), 'utf8');

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('--muted keeps WCAG AA contrast (4.5:1) on every card background', () => {
  const muted = css.match(/--muted:(#[0-9a-f]{6})/i)[1];
  for (const bg of ['--bg0', '--bg1', '--bg2']) {
    const bgHex = css.match(new RegExp(bg + ':(#[0-9a-f]{6})', 'i'))[1];
    assert.ok(
      ratio(muted, bgHex) >= 4.5,
      `${muted} on ${bgHex} = ${ratio(muted, bgHex).toFixed(2)}`
    );
  }
});

test('modal close buttons are 44px targets with a localized aria-label', () => {
  assert.match(css, /\.mc\{[^}]*width:44px;height:44px/);
  assert.ok(!/aria-label="Close"/.test(html), 'aria-label="Close" は日本語表示で英語のままになる');
  assert.match(ui, /querySelectorAll\('\.mc'\)[^;]*aria-label[^;]*tt\('閉じる','Close'\)/);
});

test('mobile ≡ menu stays inside the viewport (fixed, 10px gutters)', () => {
  assert.match(
    css,
    /\.menu-dropdown\{position:fixed;[^}]*left:10px;right:10px;[^}]*max-height:70vh;overflow-y:auto/
  );
});

test('PLAY/RESET buttons carry no inline size that shrinks the tap target', () => {
  assert.ok(!/class="ibtn"[^>]*style="font-size:\.58rem/.test(html));
});

test('link-badge is never nested in a clickable card/label (stopPropagation signature)', () => {
  assert.ok(!/link-badge"[^>]*onclick="event\.stopPropagation\(\)/.test(html));
  assert.ok(!/p3_gl_fals":?[^>]*>[^<]*<span class="link-badge"/.test(html));
});

test('SHARE URL copy shows a fallback when the clipboard promise rejects', () => {
  const m = ui.match(/function shareURL\(\)\{[\s\S]*?\n\}/)[0];
  assert.match(m, /\.catch\(\(\)=>\{prompt\(/);
});
