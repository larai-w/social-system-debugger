#!/usr/bin/env node
// SKILL.md「完了ごとの必須チェック」の自動化（Node + Playwright 版）
//   ケース1: Chart.js 正常時（スタブ注入）／ケース2: Chart.js 失敗時（CDN遮断）
//   両ケースで 4タブ遷移・プリセット1つ・スライダー操作を行い、Console/pageerror ゼロを確認する。
// 使い方: npm run verify   （または node scripts/verify.mjs [path/to/index.html]）
import { chromium } from 'playwright';
import path from 'node:path';
import process from 'node:process';

const target = path.resolve(process.argv[2] || 'web/index.html');

// Chart.js 正常時相当の最小スタブ（CDN 到達不能な CI/サンドボックスでも「正常系」を再現する）
const CHART_STUB = `
window.Chart = class Chart {
  static defaults = { color:'', borderColor:'', font:{ family:'', size:10 } };
  static register(){}
  constructor(ctx, config){ this.config=config||{}; this.data=this.config.data||{datasets:[]}; this.options=this.config.options||{}; this.canvas=ctx&&ctx.canvas?ctx.canvas:ctx; }
  update(){} destroy(){} resize(){}
};
`;

async function run(withChartStub) {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // 想定内メッセージ: 検証側が意図的に CDN を遮断するためのリソース失敗と、
  // それを受けたアプリ自身のグレースフル・デグラデーション通知ログのみ許可
  const EXPECTED = [/Failed to load resource/, /Chart\.js CDN 読み込み失敗/];
  page.on('pageerror', (exc) => errors.push('pageerror: ' + exc.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (EXPECTED.some((re) => re.test(text))) return;
    errors.push('console.error: ' + text);
  });
  // 外部CDN（Chart.js 等）は常に遮断し、正常系はスタブで再現＝ネット環境に依らず決定的
  await page.route(/https?:\/\/(cdn|cdnjs|unpkg|jsdelivr)[^ ]*/, (r) => r.abort());
  if (withChartStub) await page.addInitScript(CHART_STUB);

  await page.goto('file://' + target);
  await page.waitForTimeout(1500);
  await page.evaluate('typeof closeIntro==="function" && closeIntro()');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  for (const t of [2, 3, 4, 1]) {
    await page.evaluate(`switchTab(${t})`);
    await page.waitForTimeout(500);
  }
  await page.evaluate('typeof setPreset==="function" && setPreset(Object.keys(PRESETS)[0])');
  await page.waitForTimeout(500);
  // スライダー操作（input/change 両イベントを実発火）
  await page.evaluate(`
    const s = document.getElementById('filterRate');
    if (s) { s.value = 60;
      s.dispatchEvent(new Event('input', { bubbles: true }));
      s.dispatchEvent(new Event('change', { bubbles: true })); }
  `);
  await page.waitForTimeout(500);
  await browser.close();
  return errors;
}

const e1 = await run(true); // Chart.js 正常時
const e2 = await run(false); // Chart.js 失敗時（グレースフル・デグラデーション）
console.log('Chart正常時 errors:', e1.length ? e1 : 'なし ✓');
console.log('Chart失敗時 errors:', e2.length ? e2 : 'なし ✓');
process.exit(e1.length || e2.length ? 1 : 0);
