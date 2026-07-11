#!/usr/bin/env node
// X 告知用 画像カードの生成（PWA インストール告知素材）。
//   promo/announce-cards.html の #card1〜#card5 を 1200×675 PNG で dist/announce/ へ撮影する。
//   ja（クエリなし）と en（?lang=en）の両方を撮影＝計 10 枚。
//   使い方: npm run gen:announce
//     出力: dist/announce/announce-card{1..5}.png（ja） / announce-card{1..5}.en.png（en）
//   gen-screenshot.mjs と同じ file:// 読み込み。外部依存ゼロ（Playwright のみ）。
//   自己検証: Console エラーで非0終了・各PNGが 30KB 超であることを確認。
import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../promo/announce-cards.html', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/announce/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const CARDS = ['card1', 'card2', 'card3', 'card4', 'card5'];
const MIN_BYTES = 30 * 1024;
// ja=クエリなし（既定・不変） / en=?lang=en。suffix は en のとき '.en' を付ける。
const LANGS = [
  { query: '', suffix: '' },
  { query: '?lang=en', suffix: '.en' },
];

const browser = await chromium.launch();
const errors = [];
const results = [];

for (const lang of LANGS) {
  // deviceScaleFactor:2 で高精細（X タイムライン縮小でも読める）。撮影は要素サイズ 1200×675 に従う。
  const page = await browser.newPage({
    viewport: { width: 1240, height: 720 },
    deviceScaleFactor: 2,
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('file://' + target + lang.query);
  await page.waitForTimeout(400); // レイアウト確定待ち

  for (const id of CARDS) {
    const el = await page.$('#' + id);
    if (!el) {
      console.error('❌ 要素が見つかりません: #' + id + ' (' + (lang.suffix || 'ja') + ')');
      await browser.close();
      process.exit(1);
    }
    const name = 'announce-' + id + lang.suffix + '.png';
    const path = outDir + name;
    await el.screenshot({ path });
    const bytes = statSync(path).size;
    results.push({ name, bytes });
  }

  await page.close();
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
    tooSmall.map((r) => `${r.name}=${r.bytes}B`).join(', ')
  );
  process.exit(1);
}

console.log(`✅ dist/announce/ に告知カード ${results.length} 枚を生成しました（ja + en）:`);
for (const r of results) {
  console.log(`   ${r.name}  ${(r.bytes / 1024).toFixed(1)} KB`);
}
