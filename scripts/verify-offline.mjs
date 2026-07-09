#!/usr/bin/env node
// T51: PWA オフライン起動の自動検証。
//   Service Worker は http(s) でしか動かないため、依存ゼロの極小静的サーバで web/ を配信し、
//   ① オンラインで読み込み → SW 登録・プリキャッシュ完了を待つ
//   ② 回線を遮断（Playwright の offline エミュレーション）してリロード
//   ③ アプリが SW キャッシュから起動し、Console/pageerror ゼロであることを確認する。
//   使い方: npm run verify:offline ／ make verify-offline
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../web/', import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (p === '/' || p === '') p = '/index.html';
    const file = normalize(join(root, p));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`pageerror: ${e}`));

// ① オンラインで読み込み、SW の登録＋プリキャッシュ（install→activate）完了を待つ
await page.goto(url);
const swReady = await page.evaluate(
  () =>
    new Promise((resolve) => {
      if (!('serviceWorker' in navigator)) return resolve(false);
      navigator.serviceWorker.ready.then(() => resolve(true));
      setTimeout(() => resolve(false), 15000);
    })
);
if (!swReady) {
  console.error('❌ Service Worker が登録されませんでした');
  await browser.close();
  server.close();
  process.exit(1);
}
await page.waitForTimeout(1500); // CDN(Chart.js) の cache-first 格納を待つ

// ② 回線遮断 → リロード（SW キャッシュからの起動を強制）
await context.setOffline(true);
await page.reload();
await page.waitForTimeout(2000);
// 初回訪問イントロモーダルが出ていれば閉じる（クリック遮蔽を解除）
await page.evaluate(() => {
  if (typeof closeIntro === 'function') closeIntro();
});

// ③ アプリ本体が描画され、操作でき、エラーゼロであること
const title = await page.title();
const headerOk = await page.$eval('#mainTitle', (el) => el.textContent.includes('社会デバッガー'));
await page.click('#tab2Btn'); // オフラインでもタブ遷移が動く
await page.waitForTimeout(600);
const tab2Active = await page.$eval('#page2', (el) => el.classList.contains('active'));

await browser.close();
server.close();

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};
if (!headerOk) fail('オフライン起動でヘッダーが描画されない');
if (!tab2Active) fail('オフラインでタブ遷移が動かない');
if (errors.length) fail(`オフライン起動で Console エラー: ${errors.join(' | ')}`);
console.log(
  `✅ オフライン起動 OK — title「${title}」・タブ遷移可・Console エラーなし（SW キャッシュから復元）`
);
