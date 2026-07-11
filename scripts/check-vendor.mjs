#!/usr/bin/env node
// check-vendor.mjs — ローカルの vendor 版数と npm 最新版を比較して報告する（手動実行・要ネットワーク）
//
// 使い方: node scripts/check-vendor.mjs
//         make vendor-check
//
// 出力:
//   ✅ vendor は最新（vX.Y.Z）
//   ⚠ 新版 vA.B.C あり（現行 vX.Y.Z）。更新手順: DEVELOPMENT.md 参照
//   （オフライン時）ネットワーク不可のためチェックをスキップします（exit 0）
//
// 注意: このスクリプトは CI には含めない（手動運用・要ネットワーク前提）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const vendorPath = fileURLToPath(new URL('../web/vendor/chart.umd.min.js', import.meta.url));

// ── ローカル版数の抽出 ─────────────────────────────────────────────────────
// バナー例1（標準）: * Chart.js v4.5.1 ／ 例2（jsdelivrラッパー）: /npm/chart.js@4.4.0/dist/...
const vendorSrc = readFileSync(vendorPath, 'utf8').slice(0, 500); // バナーは先頭部のみ見る
const localMatch =
  vendorSrc.match(/Chart\.js v(\d+\.\d+\.\d+)/i) || vendorSrc.match(/chart\.js@(\d+\.\d+\.\d+)/);
if (!localMatch) {
  console.error(
    '❌ web/vendor/chart.umd.min.js のバナーから版数を抽出できませんでした。\n' +
      '   ファイルのバナー形式が変わった可能性があります。手動で確認してください。'
  );
  process.exit(1);
}
const localVersion = localMatch[1]; // e.g. "4.4.0"

// ── npm registry から最新版を取得 ────────────────────────────────────────
const REGISTRY_URL = 'https://registry.npmjs.org/chart.js/latest';

let latestVersion;
try {
  const res = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  latestVersion = json.version;
} catch (err) {
  // オフライン・タイムアウト・その他ネットワーク障害は正常終了（exit 0）
  const reason = err?.message ?? String(err);
  console.log(`ℹ ネットワーク不可のためチェックをスキップします（${reason}）`);
  process.exit(0);
}

// ── 比較して報告 ─────────────────────────────────────────────────────────
if (localVersion === latestVersion) {
  console.log(`✅ vendor は最新（v${localVersion}）`);
} else {
  console.log(
    `⚠ 新版 v${latestVersion} あり（現行 v${localVersion}）。更新手順: DEVELOPMENT.md 参照`
  );
}
