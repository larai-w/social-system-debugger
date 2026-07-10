// export-dictionary.test.mjs — US-08「全エクスポート項目は実装式と対応表で検証できる」を CI で担保する。
//
// 研究者向けの約束: 📊 エクスポート（JSON/CSV）が出す全フィールドは docs/DATA-DICTIONARY.md
// と .en.md の対応表に載っている。フィールドを追加して辞書更新を忘れると、このテストが落ちる。
//
// 抽出方式（採用理由）: (a) buildExportData を実ソースから抽出し headless 実行 → 返却オブジェクトの
//   キーを再帰列挙（dot 記法）。metrics.* は buildExportData 内では metrics()/metricsP2() の呼び出し
//   結果であり、キーがソースに文字列リテラルとして現れない。実行方式なら engine.js/ui.js に
//   メトリクスを1つ足しただけで自動的に検査対象に入る（正規表現抽出方式では取りこぼす）＝最も頑健。
//   buildExportData の DOM 依存は getTownName()/buildShareURL() の2箇所のみでスカラーにスタブ可能。
//
// 辞書側マッチ: 対応表はバッククォート内にキーを書く。params は full dot path（`p1_information.filterRate`）、
//   metrics は leaf key（`entropy`）、複合セル（`app` / `schema`、`ethicsP2` / `algoP2`）もある。
//   ⇒ フィールドは「full dot path または leaf key のどちらかが、辞書のバッククォート トークンに出現」で present とみなす。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(fileURLToPath(new URL(p, root)), 'utf8');
const uiSrc = read('web/js/ui.js');
const engineSrc = read('web/js/engine.js');

// ── ソースから関数定義を波括弧バランスで切り出す（weekly-reachability-p234.test.mjs と同流儀） ──
function fnSrc(src, name) {
  const i = src.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name} が見つからない（リネームされたらこのテストを同期して）`);
  let depth = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1);
  }
  throw new Error(`function ${name} の波括弧が閉じない`);
}

// ── buildExportData を headless 実行し、返却オブジェクトのキーを dot 記法で再帰列挙 ──
function extractExportKeys() {
  // buildExportData が参照するもの:
  //   スカラー: getTownName()/buildShareURL()（DOM 依存 → スタブ）
  //   パラメータ グローバル: filterRate, ethicsScore, algo, ... （数値/真偽/文字列にスタブ）
  //   関数: metrics()（engine.js）, metricsP2()（ui.js）とその依存
  //     metricsP2 は publicReboot/rootRestricted/shockState/skillStock/clamp に依存
  const harness = `
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    // DOM 依存のスタブ（値の中身はキー列挙に無関係。null 分岐も担保するため町名は文字列を返す）
    const getTownName=()=>'town';
    const buildShareURL=()=>'https://example/#x';
    const lang='ja';
    // 入力パラメータ（P1〜P4）— 実際に操作しうる代表値
    let filterRate=40, ethicsScore=60, algo='greedy', historicalImmunity=50;
    let shrinkRate=30, dxRate=30, ethicsP2=60, algoP2='dp',
        publicReboot=false, rootRestricted=false, skillStock=50;
    let searchDepth=5, groundingRate=50, learningRate=50;
    let extTraffic=40, gamification=40;
    // metricsP2 の追加グローバル依存
    let shockState=null;
    // 実ソース（engine.js metrics / ui.js の P2 系）
    ${fnSrc(engineSrc, 'metrics')}
    ${fnSrc(uiSrc, 'calcRedundancyBuffer')}
    ${fnSrc(uiSrc, 'p2SkillFactor')}
    ${fnSrc(uiSrc, 'metricsP2')}
    ${fnSrc(uiSrc, 'buildExportData')}
    return buildExportData();
  `;
  return new Function(harness)();
}

// 返却オブジェクトを dot 記法で平坦化。配列は現状のエクスポートに無いが念のため index 付与。
function flattenKeys(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flattenKeys(v, key, out);
    else out.add(key);
  }
  return out;
}

const exportObj = extractExportKeys();
const exportKeys = [...flattenKeys(exportObj, '', new Set())];

// ── 辞書ファイルからバッククォート内トークンを全抽出（複合セル `a` / `b` も個別に拾う） ──
function dictTokens(md) {
  const set = new Set();
  for (const m of md.matchAll(/`([^`]+)`/g)) set.add(m[1].trim());
  return set;
}
const jaTokens = dictTokens(read('docs/DATA-DICTIONARY.md'));
const enTokens = dictTokens(read('docs/DATA-DICTIONARY.en.md'));

// フィールドキーの「辞書で使われうる別名」を列挙する。
// 辞書は params/metrics の各セクション内で「セクション相対パス」を書く。すなわち
//   params.p1_information.filterRate → 辞書では `p1_information.filterRate`（先頭 params. を省く）
//   metrics.p1_information.entropy   → 辞書では leaf `entropy`（さらにセクション相対も省く）
// そのため full path / セクション相対（先頭1段を剥がす）/ leaf の全てを候補にする。
function keyAliases(fullKey) {
  const parts = fullKey.split('.');
  const aliases = new Set([fullKey]);
  // 先頭 1 段を剥がした相対パス（params./metrics. を落とす）
  if (parts.length > 1) aliases.add(parts.slice(1).join('.'));
  // 先頭 2 段を剥がした相対パス（params.p1_information. まで落とす）
  if (parts.length > 2) aliases.add(parts.slice(2).join('.'));
  // leaf
  aliases.add(parts[parts.length - 1]);
  return aliases;
}

// フィールドキーが辞書に present か: 別名のいずれかがバッククォート トークンに出現。
function inDict(tokens, fullKey) {
  for (const a of keyAliases(fullKey)) if (tokens.has(a)) return true;
  return false;
}

// ── allowlist: 構造上 辞書に個別行を持たない項目（理由必須・1件ごと明記・乱用しない） ──
// 現状は空。欠落が実在した場合は辞書側の修正が本筋であり、ここへ安易に足さないこと。
const ALLOWLIST = new Map([
  // 例: ['some.key', '理由（辞書がまとめて説明している 等）'],
]);

function report(missing) {
  return missing.map((k) => `  - ${k}`).join('\n');
}

// ── 検査本体: 全エクスポート フィールドが ja / en 両辞書に出現する ──
test('every export field appears in DATA-DICTIONARY.md (ja)', () => {
  const missing = exportKeys.filter((k) => !ALLOWLIST.has(k) && !inDict(jaTokens, k));
  assert.deepEqual(
    missing,
    [],
    `docs/DATA-DICTIONARY.md に載っていないエクスポート フィールド（${missing.length}件）:\n` +
      report(missing) +
      '\n→ 辞書は仕様外のため親が対応表に追記すること。'
  );
});

test('every export field appears in DATA-DICTIONARY.en.md (en)', () => {
  const missing = exportKeys.filter((k) => !ALLOWLIST.has(k) && !inDict(enTokens, k));
  assert.deepEqual(
    missing,
    [],
    `docs/DATA-DICTIONARY.en.md に載っていないエクスポート フィールド（${missing.length}件）:\n` +
      report(missing) +
      '\n→ 辞書は仕様外のため親が対応表に追記すること。'
  );
});

// サニティ: 抽出が空でない（スタブ崩壊で 0 件のまま緑になる事故を防ぐ）。
test('sanity: buildExportData yielded a non-trivial key set', () => {
  assert.ok(
    exportKeys.length >= 30,
    `抽出フィールドが少なすぎる（${exportKeys.length}件）— buildExportData/metrics のスタブが壊れた可能性`
  );
  // トップレベルと各ページのキーが最低限含まれること
  for (const must of [
    'app',
    'share_url',
    'params.p1_information.filterRate',
    'params.p4_stakeholder.gamification',
    'metrics.p1_information.entropy',
    'metrics.p2_infrastructure.redundancy',
  ]) {
    assert.ok(exportKeys.includes(must), `期待キー ${must} が抽出結果に無い`);
  }
});

// ── 逆方向（陳腐化検出）: 辞書にあるがエクスポートに無いキーを warn（fail にはしない） ──
// 辞書トークンがどのエクスポート フィールドの別名にも一致しない場合を陳腐化候補とする。
// さらに式トークン（記号を含む）や散文中のコード表記を除くため、識別子 or dot-path のみに絞る。
{
  const coveredAliases = new Set();
  for (const k of exportKeys) for (const a of keyAliases(k)) coveredAliases.add(a);
  const isIdentifierLike = (t) => /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(t);
  const stale = (tokens, file) => {
    const out = [];
    for (const t of tokens) {
      if (!isIdentifierLike(t)) continue; // 式・URL・記号を含むコード表記は対象外
      if (coveredAliases.has(t)) continue;
      out.push(t);
    }
    if (out.length) {
      // 陳腐化は fail にしない（変更履歴的に残す行を許容）。出典付きで一覧を残す。
      console.warn(
        `[export-dictionary] ${file} に載っているがエクスポートに無いコード表記（陳腐化の疑い・${out.length}件、fail ではない）:\n` +
          out.map((t) => `  - \`${t}\``).join('\n')
      );
    }
  };
  stale(jaTokens, 'docs/DATA-DICTIONARY.md');
  stale(enTokens, 'docs/DATA-DICTIONARY.en.md');
}
