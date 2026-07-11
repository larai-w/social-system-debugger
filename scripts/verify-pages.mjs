#!/usr/bin/env node
// 静的ページ群（classroom / classroom-slides / privacy / announce-cards）の退行検証。
//   アプリ本体は verify.mjs / verify-offline.mjs で守られているが、これらの補助ページは
//   作成時の手動目視のみ＝未検証面だった。CI がラチェットとして退行を捕まえる状態にする。
//   検証内容（各対象で共通）: file:// で開き Console error / pageerror ゼロ。
//   加えてページ種別ごとの構造チェック（下記 targets 参照）。
//   使い方: npm run verify:pages ／ make verify-pages
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = (f) => path.join(root, 'web', f);
const promo = (f) => path.join(root, 'promo', f);
const fileUrl = (abs) => pathToFileURL(abs).href;

// ── ページ種別ごとの検証ロジック ─────────────────────────────
// classroom 系: @media print を含む style ＋ langlink の相互リンク先が実在
async function checkClassroom(page, absPath) {
  const errs = [];
  const src = readFileSync(absPath, 'utf8');
  if (!/@media\s+print/.test(src)) errs.push('@media print が見つからない');
  // langlink の href（相対 .html リンク）先ファイルの実在を確認
  const dir = path.dirname(absPath);
  const links = [...src.matchAll(/<div class="langlink"[^>]*>\s*<a href="([^"]+)"/g)].map(
    (m) => m[1]
  );
  if (links.length === 0) errs.push('langlink が見つからない');
  for (const href of links) {
    if (!/^[\w.-]+\.html$/.test(href)) continue; // 外部/絶対URLは対象外
    if (!existsSync(path.join(dir, href))) errs.push(`langlink 先が実在しない: ${href}`);
  }
  return errs;
}

// classroom-slides 系: ArrowRight×2 → カウンタ「3 /」・ArrowLeft → 「2 /」
async function checkSlides(page) {
  const errs = [];
  const counterText = () => page.$eval('#counter', (el) => el.textContent.trim());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  const afterRight = await counterText();
  if (!/^3\s*\//.test(afterRight))
    errs.push(`ArrowRight×2 後のカウンタが「3 /」でない: 「${afterRight}」`);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  const afterLeft = await counterText();
  if (!/^2\s*\//.test(afterLeft))
    errs.push(`ArrowLeft 後のカウンタが「2 /」でない: 「${afterLeft}」`);
  return errs;
}

// announce-cards: #card1〜#card5 が存在（クエリ有無は呼び出し側で ?lang=en も検証）
async function checkAnnounceCards(page) {
  const errs = [];
  for (let i = 1; i <= 5; i++) {
    const found = await page.$(`#card${i}`);
    if (!found) errs.push(`#card${i} が存在しない`);
  }
  return errs;
}

// privacy 系: Console ゼロのみ（種別固有の追加チェックなし）
async function checkNoop() {
  return [];
}

// ── 検証対象一覧 ─────────────────────────────────────────────
const targets = [
  {
    name: 'classroom.html',
    url: fileUrl(web('classroom.html')),
    check: (p) => checkClassroom(p, web('classroom.html')),
  },
  {
    name: 'classroom.en.html',
    url: fileUrl(web('classroom.en.html')),
    check: (p) => checkClassroom(p, web('classroom.en.html')),
  },
  {
    name: 'classroom-slides.html',
    url: fileUrl(web('classroom-slides.html')),
    check: checkSlides,
  },
  {
    name: 'classroom-slides.en.html',
    url: fileUrl(web('classroom-slides.en.html')),
    check: checkSlides,
  },
  { name: 'privacy.html', url: fileUrl(web('privacy.html')), check: checkNoop },
  { name: 'privacy.en.html', url: fileUrl(web('privacy.en.html')), check: checkNoop },
  // faq: Console ゼロ ＋ langlink の相互リンク先が実在（checkClassroom を流用）
  {
    name: 'faq.html',
    url: fileUrl(web('faq.html')),
    check: (p) => checkClassroom(p, web('faq.html')),
  },
  {
    name: 'faq.en.html',
    url: fileUrl(web('faq.en.html')),
    check: (p) => checkClassroom(p, web('faq.en.html')),
  },
  // 404.html: Console ゼロのみ
  { name: '404.html', url: fileUrl(web('404.html')), check: checkNoop },
  {
    name: 'announce-cards.html',
    url: fileUrl(promo('announce-cards.html')),
    check: checkAnnounceCards,
  },
  {
    name: 'announce-cards.html?lang=en',
    url: fileUrl(promo('announce-cards.html')) + '?lang=en',
    check: checkAnnounceCards,
  },
];

// worksheet は並行タスクで作成中のため、存在すれば対象に含め、無ければスキップ
for (const f of ['worksheet.html', 'worksheet.en.html']) {
  if (existsSync(web(f))) {
    targets.push({ name: f, url: fileUrl(web(f)), check: checkNoop });
  } else {
    console.log(`  スキップ: ${f}（未作成）`);
  }
}

// ── 実行: 1 ブラウザ・1 ページを使い回して全対象を順に検証 ──
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const allErrors = [];
let currentErrors = [];
page.on('pageerror', (exc) => currentErrors.push('pageerror: ' + exc.message));
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  currentErrors.push('console.error: ' + msg.text());
});

for (const t of targets) {
  currentErrors = [];
  await page.goto(t.url);
  await page.waitForTimeout(500);
  const structural = (await t.check(page)) || [];
  const errs = [...currentErrors, ...structural];
  if (errs.length) allErrors.push(...errs.map((e) => `[${t.name}] ${e}`));
  console.log(`  ページ検証 ${t.name}: ${errs.length ? errs.join(' | ') : 'なし ✓'}`);
}

await browser.close();

console.log('ページ検証: ' + (allErrors.length ? allErrors.join('\n') : 'なし ✓'));
process.exit(allErrors.length ? 1 : 0);
