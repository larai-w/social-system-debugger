// i18n-completeness.test.mjs — CLAUDE.md 絶対制約2「i18n を壊さない」を CI に移す。
//
// 設計前提（web/js/ui.js applyI18nAuto / engine.js t を読んだ結果）:
//   - ja 原文 = HTML の既定文（applyI18nAuto が初回に el.innerHTML を I18N.ja[k] にキャッシュ）。
//     ＝ data-i18n キーは ja 辞書に無くても HTML 側で担保される。
//   - en = I18N.en 辞書のみが唯一のソース。ここに欠落すると EN 切替時に v===undefined で
//     翻訳が当たらず「生キー or ja のまま」が表示される（= 制約2 違反バグ）。
//   ⇒ 核心の保証は「使われている全キーが I18N.en に存在すること」。
//
// t() は engine.js に `function t(k){return I18N[lang][k]||k}` として1つだけ定義され、
// ui.js/engine.js から t('リテラルキー') で呼ばれる。scenario.js/share.js は tt(ja,en)
// インライン方式なので i18n キーを持たない（走査対象だが t('...') は出現しない）。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const web = (p) => fileURLToPath(new URL('../web/' + p, import.meta.url));

// ── i18n.js を new Function で評価して I18N を取り出す（invariants.test.mjs と同流儀） ──
// i18n.js は `const I18N = {...};` のみ。末尾に return を足して純粋オブジェクトを得る。
const i18nSrc = readFileSync(web('js/i18n.js'), 'utf8');
const I18N = new Function(i18nSrc + '\n;return I18N;')();
const enKeys = new Set(Object.keys(I18N.en));
const jaKeys = new Set(Object.keys(I18N.ja));

// ── allowlist: 構造上 en 辞書に不要なキー（理由必須・1件ごとに明記・乱用しない） ──
// data-i18n だが en を持たせない設計＝ applyI18nAuto は v===undefined でスキップし
// HTML 既定文（＝ja）をそのまま出す。i18n.js コメント v6.341/v6.35 の
// 「日本語版=日本語のみ / 英語版=英語のみ」ポリシーに該当するステータス見出し類。
// これらは EN でも英字ラベル（RESCUE HELI 等）を HTML 既定に持つため翻訳不要。
const EN_ALLOWLIST = new Map([
  // 例: ['p2_sl_heli', 'v6.341: ステータス見出しは HTML 既定が英字ラベルで en 翻訳不要'],
]);

const html = readFileSync(web('index.html'), 'utf8');
const jsFiles = readdirSync(web('js')).filter((f) => f.endsWith('.js'));

// 欠落レポート整形（出典ファイル付き・修正が一目でできる形）
function report(label, missing) {
  if (missing.length === 0) return '';
  const lines = missing.map((m) => `  - ${m.key}   (出典: ${m.src})`);
  return `\n${label}（${missing.length}件）:\n${lines.join('\n')}\n`;
}

// ── 検査1: index.html の全 data-i18n キーが I18N.en に存在する ──
test('every data-i18n key in index.html exists in I18N.en', () => {
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) keys.add(m[1]);
  const missing = [];
  for (const k of keys) {
    if (enKeys.has(k) || EN_ALLOWLIST.has(k)) continue;
    missing.push({ key: k, src: 'web/index.html [data-i18n]' });
  }
  assert.deepEqual(
    missing,
    [],
    'EN 辞書に欠落した data-i18n キー（EN 切替で生キー表示のバグ）:' +
      report('web/index.html', missing)
  );
});

// ── 検査2: js の t('リテラルキー') が I18N.en に存在する ──
// 誤検知防止:
//   (1) 先頭の (?<![\w$]) で「関数 t の呼び出し」だけを拾う。
//       createElement('div') / getContext('2d') / params.get('f') 等は直前が語字なので除外。
//   (2) setVerdictBanner('id','state','キー') の第3引数（data-i18n キー）も対象に含める
//       — ui.js に実在する既知パターン（第3引数は setVerdictBanner 内で at.dataset.i18n=key）。
//   (3) 行コメント //... を除去してからマッチ（コメント内の t('...') を拾わない）。
test("every t('key') / setVerdictBanner(...,'key') literal in js exists in I18N.en", () => {
  const missing = [];
  for (const f of jsFiles) {
    const raw = readFileSync(web('js/' + f), 'utf8');
    // コメント除去。ブロック /*...*/ を除去 → 行コメント //... を除去。
    // ただし URL の "://"（例: 'https://...'）を誤って行コメント扱いしないため、
    // 直前が ':' でない // のみをコメント開始とみなす（保守的・false negative 回避）。
    const src = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((ln) => ln.replace(/(^|[^:])\/\/.*$/, '$1'))
      .join('\n');

    // (1) 関数 t の呼び出し: 直前が語字/$ でない t('...') / t("...")
    for (const m of src.matchAll(/(?<![\w$])t\(\s*(['"])([A-Za-z0-9_]+)\1\s*\)/g)) {
      const k = m[2];
      if (enKeys.has(k) || EN_ALLOWLIST.has(k)) continue;
      missing.push({ key: k, src: `web/js/${f} t('${k}')` });
    }
    // (2) setVerdictBanner の第3引数（data-i18n キー）
    for (const m of src.matchAll(
      /setVerdictBanner\(\s*(['"])[^'"]+\1\s*,\s*(['"])[^'"]*\2\s*,\s*(['"])([A-Za-z0-9_]+)\3/g
    )) {
      const k = m[4];
      if (enKeys.has(k) || EN_ALLOWLIST.has(k)) continue;
      missing.push({ key: k, src: `web/js/${f} setVerdictBanner(...,'${k}')` });
    }
  }
  assert.deepEqual(
    missing,
    [],
    "EN 辞書に欠落した t('...') / setVerdictBanner キー:" + report('web/js', missing)
  );
});

// ── 検査3: I18N.ja のキーは I18N.en にも存在する（辞書間の非対称＝片言語追加の検出） ──
test('every key in I18N.ja also exists in I18N.en', () => {
  const missing = [];
  for (const k of jaKeys) {
    if (enKeys.has(k) || EN_ALLOWLIST.has(k)) continue;
    missing.push({ key: k, src: 'I18N.ja' });
  }
  assert.deepEqual(
    missing,
    [],
    'I18N.ja にあって I18N.en に無いキー（片言語のみの追加）:' + report('I18N.ja', missing)
  );
});
