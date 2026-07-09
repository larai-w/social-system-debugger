#!/usr/bin/env node
// T45: README ヒーロー画像の自動生成（実アプリのスクリーンショット・値の偽装なし）。
//   ワイマール崩壊プリセット → 崩壊バナー点灯までを実エンジンで再現して撮影する。
//   使い方: npm run gen:shot（出力: docs/assets/hero.png）
//   verify.mjs と同じ file:// 読み込み（Chart.js は CDN から通常読込）。
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../web/index.html', import.meta.url));
const outDir = fileURLToPath(new URL('../docs/assets/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + target);
await page.waitForTimeout(1500); // Chart.js 初期化待ち

// イントロモーダルが出ていれば閉じる（ボタンIDに依存せず overlay を直接処理）
await page.evaluate(() => {
  document
    .querySelectorAll('.modal-overlay, #introModal')
    .forEach((el) => (el.style.display = 'none'));
  if (typeof closeIntro === 'function')
    try {
      closeIntro();
    } catch (e) {}
});

// ワイマール崩壊プリセット → 崩壊バナー点灯まで実エンジンで進める
await page.click('#p-weimar');
await page.waitForTimeout(2500);
await page.screenshot({ path: outDir + 'hero.png' });

await browser.close();
if (errors.length) {
  console.error('❌ Console エラーあり:', errors);
  process.exit(1);
}
console.log('✅ docs/assets/hero.png を生成しました（ワイマール崩壊・実エンジン撮影）');
