#!/usr/bin/env node
// TODO ☐6 自動化: 教員向け1枚ガイド（classroom.html / classroom.en.html）を
//   print メディア・A4・白地の PDF に自動変換する。
//   使い方: npm run gen:classroom-pdf（出力: dist/classroom.pdf, dist/classroom.en.pdf）
//   gen-screenshot.mjs と同じ流儀: file:// 読み込み・Console/pageerror で非0失敗・生成物を自己検証。
//   @page(size:A4/margin) は classroom.html の @media print に任せる（preferCSSPageSize:true）。
import { chromium } from 'playwright';
import { mkdirSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../dist/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const jobs = [
  { src: '../web/classroom.html', out: 'classroom.pdf' },
  { src: '../web/classroom.en.html', out: 'classroom.en.pdf' },
];

// PDF のページ数を簡易カウント（生バイト列の /Type /Page 出現数）。
function pdfPageCount(path) {
  const buf = readFileSync(path).toString('latin1');
  const m = buf.match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : NaN;
}

const browser = await chromium.launch();
const errors = [];

for (const job of jobs) {
  const target = fileURLToPath(new URL(job.src, import.meta.url));
  const outPath = outDir + job.out;
  const page = await browser.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${job.out}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${job.out}] ${String(e)}`));

  await page.goto('file://' + target, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' }); // 白地A4の @media print を適用
  await page.pdf({
    path: outPath,
    printBackground: true,
    preferCSSPageSize: true, // @page の A4/margin を尊重
  });
  await page.close();

  const size = statSync(outPath).size;
  if (size <= 10 * 1024) {
    errors.push(`[${job.out}] 生成物が小さすぎます (${size} bytes <= 10KB)`);
  } else {
    const pages = pdfPageCount(outPath);
    console.log(`✅ ${job.out} (${(size / 1024).toFixed(1)} KB, ページ数=${pages})`);
  }
}

await browser.close();
if (errors.length) {
  console.error('❌ 失敗:', errors);
  process.exit(1);
}
console.log('✅ dist/classroom.pdf, dist/classroom.en.pdf を生成しました（print/A4・白地）');
