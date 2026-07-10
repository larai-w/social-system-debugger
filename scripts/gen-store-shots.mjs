#!/usr/bin/env node
// TODO ☐4 自動化: ストア提出用スクリーンショット6枚を実アプリから自動撮影する。
//   docs/store-listing.md「スクリーンショット撮影プラン（6枚）」を正とし、
//   実エンジンで到達可能な状態だけを撮る（値の偽装なし）。
//   使い方: npm run gen:store-shots（出力: dist/store-shots/01〜06.png）
//   gen-screenshot.mjs / gen-classroom-pdf.mjs と同じ流儀:
//     file:// 読み込み・イントロモーダル閉じ・Console/pageerror で非0失敗・生成物を自己検証。
//   ビューポート: スマホ縦 430×932 / deviceScaleFactor 3（≒iPhone 6.7" 1290×2796 出力）。
//   撮影は日本語UI（既定）。
import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../web/index.html', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/store-shots/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const MIN_BYTES = 30 * 1024; // 各ショットは >30KB を要求（真っ黒/空でないことの下限）

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
});
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + target);
await page.waitForTimeout(1500); // Chart.js 初期化待ち

// イントロモーダル/オーバーレイを閉じる（既存流儀: ボタンIDに依存せず overlay を直接処理）
async function dismissModals() {
  await page.evaluate(() => {
    document
      .querySelectorAll('.modal-overlay, #introModal')
      .forEach((el) => (el.style.display = 'none'));
    if (typeof closeIntro === 'function')
      try {
        closeIntro();
      } catch (e) {}
  });
}
await dismissModals();

// 各ショットのプラン。store-listing.md「6枚プラン」に対応（到達可能な状態のみ）。
// prepare: 撮影前の実操作（実エンジンで状態を作る）。wait: アニメ安定待ち(ms)。
const shots = [
  {
    file: '01.png',
    // プラン#2: PAGE 1 ワイマール崩壊の赤バナー＋スローガンログ
    async prepare() {
      await page.evaluate(() => switchTab(1));
      await page.click('#p-weimar');
    },
    wait: 2800,
  },
  {
    file: '02.png',
    // プラン#1: PAGE 2 ショック生存の緑バナー（🛡冗長性確保都市 → ⚡ショック注入）
    async prepare() {
      await page.evaluate(() => switchTab(2));
      await page.click('#p2-redundant');
      await page.waitForTimeout(1200);
      await page.click('#shockBtn'); // injectSystemShock() → survived（RB≥60）
    },
    wait: 2500,
  },
  {
    file: '03.png',
    // プラン#6: PAGE 3 認知リカバリー（ネットワーク／散布・エージェント可視化）
    async prepare() {
      await page.evaluate(() => switchTab(3));
    },
    wait: 2500,
  },
  {
    file: '04.png',
    // 代替: PAGE 4 ステークホルダー非対称性（プラン#3=週次カードは Web で no-op のため差し替え）
    async prepare() {
      await page.evaluate(() => switchTab(4));
    },
    wait: 2500,
  },
  {
    file: '05.png',
    // プラン#4: 発見ログ（前ステップまでで複数アンロック済み → 📖 発見ログ）
    async prepare() {
      await page.evaluate(() => switchTab(1));
      await page.evaluate(() => openDiscoveryLog());
    },
    wait: 1800,
  },
  {
    file: '06.png',
    // プラン#5: 結果カード共有ポップ（3ボタン等）。閉じてから開く。
    async prepare() {
      await page.evaluate(() => {
        if (typeof closeDiscoveryLog === 'function')
          try {
            closeDiscoveryLog();
          } catch (e) {}
        document
          .querySelectorAll('.modal-overlay.on, .modal.on')
          .forEach((el) => el.classList.remove('on'));
        shareScenario({ kind: 'generic' });
      });
    },
    wait: 1800,
  },
];

for (const shot of shots) {
  await shot.prepare();
  await page.waitForTimeout(shot.wait);
  const outPath = outDir + shot.file;
  await page.screenshot({ path: outPath });
  const size = statSync(outPath).size;
  if (size <= MIN_BYTES) {
    errors.push(`[${shot.file}] 生成物が小さすぎます (${size} bytes <= ${MIN_BYTES})`);
  } else {
    console.log(`✅ store-shots/${shot.file} (${(size / 1024).toFixed(1)} KB)`);
  }
}

await browser.close();
if (errors.length) {
  console.error('❌ 失敗:', errors);
  process.exit(1);
}
console.log('✅ dist/store-shots/01〜06.png を生成しました（実エンジン撮影・430×932@3x）');
