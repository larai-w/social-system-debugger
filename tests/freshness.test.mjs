// freshness.test.mjs — ドキュメント鮮度の自動見張り（ネットワーク不使用）
//
// fail 条件（確定的な不一致）:
//   ① DEVELOPMENT.md / .en.md に記載の sw cache 版数が web/sw.js の実値と不一致
//   ② web/index.html フッターの版数と DEVELOPMENT の「対応バージョン」記載が不一致
//   ※抽出できない場合は fail（黙って skip しない）
//
// warn 条件（運用判断・console.warn のみで pass）:
//   ③ PROGRESS.md の最大 T番号 > CHANGELOG.md 見出しの最大 T番号（CHANGELOG 未追記）
//   ④ PROGRESS.md の最大 T番号 > gh-project-backfill.mjs TASKS の最大 T番号（バックフィル未追記）
//   ※warn にする理由: スプリント進行中は常に一時的に乖離するため

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL('../' + p, import.meta.url));

const swSrc = readFileSync(root('web/sw.js'), 'utf8');
const devSrc = readFileSync(root('docs/DEVELOPMENT.md'), 'utf8');
const devEnSrc = readFileSync(root('docs/DEVELOPMENT.en.md'), 'utf8');
const indexSrc = readFileSync(root('web/index.html'), 'utf8');
const progressSrc = readFileSync(root('PROGRESS.md'), 'utf8');
const changelogSrc = readFileSync(root('CHANGELOG.md'), 'utf8');
const backfillSrc = readFileSync(root('scripts/gh-project-backfill.mjs'), 'utf8');

// ── ① sw cache 版数の整合 ────────────────────────────────────────────────

test('sw cache version in DEVELOPMENT.md matches web/sw.js', () => {
  // web/sw.js の実値: const CACHE = 'ssd-cache-v6-NNN';
  const swMatch = swSrc.match(/const\s+CACHE\s*=\s*'ssd-cache-(v6-\d+)'/);
  assert.ok(
    swMatch,
    'web/sw.js から CACHE 版数を抽出できません（フォーマット変更の可能性）。\n修正先: web/sw.js の const CACHE 行'
  );
  const swCache = swMatch[1]; // e.g. "v6-364"

  // DEVELOPMENT.md 末尾の「対応バージョン」行: sw cache v6-NNN
  const devMatch = devSrc.match(/sw\s+cache\s+(v6-\d+)/);
  assert.ok(
    devMatch,
    'docs/DEVELOPMENT.md から sw cache 版数を抽出できません（フォーマット変更の可能性）。\n修正先: docs/DEVELOPMENT.md 末尾の「対応バージョン」行'
  );
  const devCache = devMatch[1];

  assert.equal(
    devCache,
    swCache,
    `docs/DEVELOPMENT.md の sw cache 版数（${devCache}）が web/sw.js の実値（${swCache}）と不一致。\n修正先: docs/DEVELOPMENT.md 末尾の「対応バージョン」行を "${swCache}" に更新してください。`
  );
});

test('sw cache version in DEVELOPMENT.en.md matches web/sw.js', () => {
  const swMatch = swSrc.match(/const\s+CACHE\s*=\s*'ssd-cache-(v6-\d+)'/);
  assert.ok(
    swMatch,
    'web/sw.js から CACHE 版数を抽出できません（フォーマット変更の可能性）。\n修正先: web/sw.js の const CACHE 行'
  );
  const swCache = swMatch[1];

  const devEnMatch = devEnSrc.match(/sw\s+cache\s+(v6-\d+)/);
  assert.ok(
    devEnMatch,
    'docs/DEVELOPMENT.en.md から sw cache 版数を抽出できません（フォーマット変更の可能性）。\n修正先: docs/DEVELOPMENT.en.md 末尾の "Applies to:" 行'
  );
  const devEnCache = devEnMatch[1];

  assert.equal(
    devEnCache,
    swCache,
    `docs/DEVELOPMENT.en.md の sw cache 版数（${devEnCache}）が web/sw.js の実値（${swCache}）と不一致。\n修正先: docs/DEVELOPMENT.en.md 末尾の "Applies to:" 行を "${swCache}" に更新してください。`
  );
});

// ── ② フッター版数の整合 ─────────────────────────────────────────────────

test('app version in web/index.html footer matches DEVELOPMENT.md', () => {
  // web/index.html フッター: 社会デバッガー v6.NNN
  const footerMatch = indexSrc.match(/id="footerTxt"[^>]*>社会デバッガー\s+(v6\.\d+)/);
  assert.ok(
    footerMatch,
    'web/index.html のフッター（id="footerTxt"）からアプリ版数を抽出できません（フォーマット変更の可能性）。\n修正先: web/index.html id="footerTxt" の行'
  );
  const footerVer = footerMatch[1]; // e.g. "v6.346"

  // DEVELOPMENT.md: 対応バージョン: v6.NNN
  const devVerMatch = devSrc.match(/対応バージョン:\s*(v6\.\d+)/);
  assert.ok(
    devVerMatch,
    'docs/DEVELOPMENT.md から対応バージョンを抽出できません（フォーマット変更の可能性）。\n修正先: docs/DEVELOPMENT.md 末尾の「対応バージョン」行'
  );
  const devVer = devVerMatch[1];

  assert.equal(
    devVer,
    footerVer,
    `docs/DEVELOPMENT.md の対応バージョン（${devVer}）が web/index.html フッター（${footerVer}）と不一致。\n修正先: docs/DEVELOPMENT.md 末尾の「対応バージョン」行を "${footerVer}" に更新してください。`
  );
});

test('app version in web/index.html footer matches DEVELOPMENT.en.md', () => {
  const footerMatch = indexSrc.match(/id="footerTxt"[^>]*>社会デバッガー\s+(v6\.\d+)/);
  assert.ok(
    footerMatch,
    'web/index.html のフッター（id="footerTxt"）からアプリ版数を抽出できません（フォーマット変更の可能性）。\n修正先: web/index.html id="footerTxt" の行'
  );
  const footerVer = footerMatch[1];

  // DEVELOPMENT.en.md: Applies to: v6.NNN
  const devEnVerMatch = devEnSrc.match(/Applies to:\s*(v6\.\d+)/);
  assert.ok(
    devEnVerMatch,
    'docs/DEVELOPMENT.en.md から対応バージョンを抽出できません（フォーマット変更の可能性）。\n修正先: docs/DEVELOPMENT.en.md 末尾の "Applies to:" 行'
  );
  const devEnVer = devEnVerMatch[1];

  assert.equal(
    devEnVer,
    footerVer,
    `docs/DEVELOPMENT.en.md の対応バージョン（${devEnVer}）が web/index.html フッター（${footerVer}）と不一致。\n修正先: docs/DEVELOPMENT.en.md 末尾の "Applies to:" 行を "${footerVer}" に更新してください。`
  );
});

// ── ③ PROGRESS の最大 T番号 vs CHANGELOG の最大 T番号 ────────────────────

test('CHANGELOG covers all T-numbers in PROGRESS (warn only)', () => {
  // PROGRESS.md: | TNN | ... | の行から最大番号を取得
  const progressNums = [...progressSrc.matchAll(/\|\s*T(\d+)\s*\|/g)].map((m) => Number(m[1]));
  assert.ok(
    progressNums.length > 0,
    'PROGRESS.md から T番号を抽出できません（フォーマット変更の可能性）。\n修正先: PROGRESS.md のタスク一覧表'
  );
  const progressMax = Math.max(...progressNums);

  // CHANGELOG.md: 見出し行の T番号を全て拾う（例: T65〜T78 / T50〜T64）
  const changelogNums = [...changelogSrc.matchAll(/T(\d+)/g)].map((m) => Number(m[1]));
  assert.ok(
    changelogNums.length > 0,
    'CHANGELOG.md から T番号を抽出できません（フォーマット変更の可能性）。\n修正先: CHANGELOG.md のスプリント見出し'
  );
  const changelogMax = Math.max(...changelogNums);

  if (progressMax > changelogMax) {
    console.warn(
      `[warn] PROGRESS.md 最大 T番号（T${progressMax}）が CHANGELOG.md 最大 T番号（T${changelogMax}）を超えています。\n` +
        `       CHANGELOG.md にスプリントエントリの追記が未完了の可能性があります。\n` +
        `       修正先: CHANGELOG.md にスプリント見出しと変更内容を追記してください。`
    );
  }
  // warn のみ（fail しない）
});

// ── ④ PROGRESS の最大 T番号 vs backfill TASKS の最大 T番号 ──────────────────

test('gh-project-backfill.mjs TASKS covers all T-numbers in PROGRESS (warn only)', () => {
  const progressNums = [...progressSrc.matchAll(/\|\s*T(\d+)\s*\|/g)].map((m) => Number(m[1]));
  assert.ok(
    progressNums.length > 0,
    'PROGRESS.md から T番号を抽出できません（フォーマット変更の可能性）。\n修正先: PROGRESS.md のタスク一覧表'
  );
  const progressMax = Math.max(...progressNums);

  // gh-project-backfill.mjs: TASKS 配列内の 'TNN' エントリを拾う
  const backfillNums = [...backfillSrc.matchAll(/'T(\d+)'/g)].map((m) => Number(m[1]));
  assert.ok(
    backfillNums.length > 0,
    'scripts/gh-project-backfill.mjs の TASKS から T番号を抽出できません（フォーマット変更の可能性）。\n修正先: scripts/gh-project-backfill.mjs の TASKS 配列'
  );
  const backfillMax = Math.max(...backfillNums);

  if (progressMax > backfillMax) {
    console.warn(
      `[warn] PROGRESS.md 最大 T番号（T${progressMax}）が gh-project-backfill.mjs TASKS 最大 T番号（T${backfillMax}）を超えています。\n` +
        `       GitHub Issues へのバックフィルが未追記の可能性があります。\n` +
        `       修正先: scripts/gh-project-backfill.mjs の TASKS 配列に T${backfillMax + 1}〜T${progressMax} を追記してください。`
    );
  }
  // warn のみ（fail しない）
});
