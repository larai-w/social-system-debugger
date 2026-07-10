#!/usr/bin/env node
// X 告知用 画像カードの生成（PWA インストール告知素材）。
//   promo/announce-cards.html の #card1〜#card4 を 1200×675 PNG で dist/announce/ へ撮影する。
//   使い方: npm run gen:announce（出力: dist/announce/announce-card{1..4}.png）
//   gen-screenshot.mjs と同じ file:// 読み込み。外部依存ゼロ（Playwright のみ）。
//   自己検証: Console エラーで非0終了・各PNGが 30KB 超であることを確認。
import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../promo/announce-cards.html', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/announce/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const CARDS = ['card1', 'card2', 'card3', 'card4'];
const MIN_BYTES = 30 * 1024;

const browser = await chromium.launch();
// deviceScaleFactor:2 で高精細（X タイムライン縮小でも読める）。撮影は要素サイズ 1200×675 に従う。
const page = await browser.newPage({
  viewport: { width: 1240, height: 720 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + target);
await page.waitForTimeout(400); // レイアウト確定待ち

const results = [];
for (const id of CARDS) {
  const el = await page.$('#' + id);
  if (!el) {
    console.error('❌ 要素が見つかりません: #' + id);
    await browser.close();
    process.exit(1);
  }
  const path = outDir + 'announce-' + id + '.png';
  await el.screenshot({ path });
  const bytes = statSync(path).size;
  results.push({ id, bytes });
}

await browser.close();

if (errors.length) {
  console.error('❌ Console エラーあり:', errors);
  process.exit(1);
}

const tooSmall = results.filter((r) => r.bytes <= MIN_BYTES);
if (tooSmall.length) {
  console.error(
    '❌ サイズが小さすぎるカードがあります（>30KB 期待）:',
    tooSmall.map((r) => `${r.id}=${r.bytes}B`).join(', ')
  );
  process.exit(1);
}

console.log('✅ dist/announce/ に告知カード 4 枚を生成しました:');
for (const r of results) {
  console.log(`   announce-${r.id}.png  ${(r.bytes / 1024).toFixed(1)} KB`);
}
