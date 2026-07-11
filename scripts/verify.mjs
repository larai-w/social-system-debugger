#!/usr/bin/env node
// SKILL.md「完了ごとの必須チェック」の自動化（Node + Playwright 版）
//   ケース1: Chart.js 正常時（スタブ注入）／ケース2: Chart.js 失敗時（CDN遮断）
//   両ケースで 4タブ遷移・プリセット・スライダー操作に加え、P2ショック注入・
//   P3/P4 スライダー・エクスポート生成までをスモークし、Console/pageerror ゼロを確認する。
//   さらに主要流入がスマホ（X/LINE）のため、デスクトップ(1400×1000)とモバイル(390×844)の
//   2ビューポートで同一スモークを実行し、モバイル限定のレイアウト起因退行も検出する（計4パス）。
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

// ビューポート定義。モバイルは isMobile/hasTouch も付与し、スマホ縦の実挙動に近づける。
const VIEWPORTS = [
  { name: 'desktop', opts: { viewport: { width: 1400, height: 1000 } } },
  {
    name: 'mobile',
    opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  },
];

// browser を使い回し、パスごとに context を分ける（起動コスト削減・状態は context 単位で分離）。
async function run(browser, withChartStub, viewport) {
  const errors = [];
  const context = await browser.newContext(viewport.opts);
  const page = await context.newPage();
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
  // 外部CDNは常に遮断（ネット環境に依らず決定的）。T57 で Chart.js はセルフホスト化されたため、
  // 正常系はローカル vendor/ の実 Chart.js が読み込まれ、失敗系は vendor パスを遮断して再現する。
  await context.route(/https?:\/\/(cdn|cdnjs|unpkg|jsdelivr)[^ ]*/, (r) => r.abort());
  if (!withChartStub) await context.route(/vendor\/chart[^ ]*/, (r) => r.abort());
  if (withChartStub) await context.addInitScript(CHART_STUB);

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
  const drag = (id, v) =>
    page.evaluate(`
    const s = document.getElementById('${id}');
    if (s) { s.value = ${v};
      s.dispatchEvent(new Event('input', { bubbles: true }));
      s.dispatchEvent(new Event('change', { bubbles: true })); }
  `);
  await drag('filterRate', 60);
  await page.waitForTimeout(500);
  // P2: ショック注入（判定バナー・ヘリ状態遷移まで走らせる）
  await page.evaluate('switchTab(2)');
  await page.waitForTimeout(400);
  await page.evaluate('typeof injectSystemShock==="function" && injectSystemShock()');
  await page.waitForTimeout(900);
  // P3/P4: 各ページの主要スライダー
  await page.evaluate('switchTab(3)');
  await drag('searchDepth', 9);
  await page.waitForTimeout(400);
  await page.evaluate('switchTab(4)');
  await drag('gamification', 80);
  await page.waitForTimeout(400);
  // エクスポート（US-08）のデータ生成経路
  await page.evaluate(
    'typeof buildExportData==="function" && JSON.stringify(buildExportData()).length > 0'
  );
  await page.waitForTimeout(200);
  // ≡メニュー: 開閉トグル（#headerMenu の .open 付与→解除）
  const menuStates = await page.evaluate(`(function(){
    const m = document.getElementById('headerMenu');
    if (typeof toggleHeaderMenu !== 'function' || !m) return null;
    toggleHeaderMenu(); const opened = m.classList.contains('open');
    toggleHeaderMenu(); const closed = !m.classList.contains('open');
    return { opened, closed };
  })()`);
  if (!menuStates || !menuStates.opened || !menuStates.closed)
    errors.push('verify: toggleHeaderMenu open/close failed ' + JSON.stringify(menuStates));
  await page.waitForTimeout(200);
  // PWA インストールモーダル: openPwaInstall→.on 付与→closePwaInstall→.on 解除
  const pwaStates = await page.evaluate(`(function(){
    const mo = document.getElementById('pwaInstallModal');
    if (typeof openPwaInstall !== 'function' || typeof closePwaInstall !== 'function' || !mo) return null;
    openPwaInstall(); const opened = mo.classList.contains('on');
    closePwaInstall(); const closed = !mo.classList.contains('on');
    return { opened, closed };
  })()`);
  if (!pwaStates || !pwaStates.opened || !pwaStates.closed)
    errors.push('verify: openPwaInstall/closePwaInstall failed ' + JSON.stringify(pwaStates));
  await page.waitForTimeout(200);
  // classroom/privacy 導線: window.open をスタブして openAppPage が正しい URL を渡すか確認（実タブは開かない）
  const openedUrls = await page.evaluate(`(function(){
    if (typeof openAppPage !== 'function') return null;
    const orig = window.open; const urls = [];
    window.open = function(u){ urls.push(u); return null; };
    try { openAppPage('classroom'); openAppPage('privacy'); }
    finally { window.open = orig; }
    return urls;
  })()`);
  if (
    !Array.isArray(openedUrls) ||
    openedUrls.length !== 2 ||
    !/^classroom(\.en)?\.html$/.test(openedUrls[0] || '') ||
    !/^privacy(\.en)?\.html$/.test(openedUrls[1] || '')
  )
    errors.push('verify: openAppPage classroom/privacy URLs wrong ' + JSON.stringify(openedUrls));
  await page.waitForTimeout(200);
  await context.close();
  return errors;
}

const browser = await chromium.launch();
let total = 0;
try {
  for (const [label, withChartStub] of [
    ['Chart正常時', true],
    ['Chart失敗時', false],
  ]) {
    for (const vp of VIEWPORTS) {
      const errs = await run(browser, withChartStub, vp);
      console.log(`${label}(${vp.name}) errors:`, errs.length ? errs : 'なし ✓');
      total += errs.length;
    }
  }
} finally {
  await browser.close();
}
process.exit(total ? 1 : 0);
