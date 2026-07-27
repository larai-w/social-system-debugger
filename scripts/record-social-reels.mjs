#!/usr/bin/env node
// `promo/campaigns/*/reel.html` のX向け30秒リールを一括録画する。
// 実行: npm run record:social-reels
// 個別: npm run record:social-reels -- --only page4-meeting
// 出力: dist/social-reels/*.webm（ffmpeg があれば *.mp4 も生成）
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('dist/social-reels');
const SIZE = { width: 420, height: 740 };
const RECORD_MS = 31000;

const TARGETS = [
  {
    id: 'page4-meeting',
    file: 'promo/campaigns/page4-meeting/reel.html',
    out: '01-page4-meeting',
  },
  {
    id: 'page1-safe',
    file: 'promo/campaigns/page1-safe/reel.html',
    out: '02-page1-safe',
  },
  {
    id: 'page2-resonance',
    file: 'promo/campaigns/page2-resonance/reel.html',
    out: '03-page2-resonance',
  },
  {
    id: 'page3-distance',
    file: 'promo/campaigns/page3-distance/reel.html',
    out: '04-page3-distance',
  },
  {
    id: 'page2-shock-lab',
    file: 'promo/campaigns/page2-shock-lab/reel.html',
    out: '05-page2-shock-lab',
  },
  {
    id: 'page2-timelapse',
    file: 'promo/campaigns/page2-timelapse/reel.html',
    out: '06-page2-timelapse',
  },
  {
    id: 'sector-h-characters',
    file: 'promo/campaigns/sector-h-characters/reel.html',
    out: '07-sector-h-characters',
  },
  {
    id: 'sector-h-flow',
    file: 'promo/campaigns/sector-h-flow/reel.html',
    out: '08-sector-h-flow',
  },
  {
    id: 'page4-outcome',
    file: 'promo/campaigns/page4-outcome/reel.html',
    out: '09-page4-outcome',
  },
  {
    id: 'page2-shock',
    file: 'promo/campaigns/page2-classic-shock/reel.html',
    out: '10-page2-shock',
  },
];

function fmtSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + 'MB';
}

function selectedTargets() {
  const onlyAt = process.argv.indexOf('--only');
  if (onlyAt === -1) return TARGETS;
  const id = process.argv[onlyAt + 1];
  const target = TARGETS.find((item) => item.id === id);
  if (!target) {
    console.error(`不明なリール: ${id || '(未指定)'}`);
    console.error('指定可能: ' + TARGETS.map((item) => item.id).join(', '));
    process.exit(2);
  }
  return [target];
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const produced = [];

try {
  for (const target of selectedTargets()) {
    console.log(`⏺ ${target.id} を録画中…`);
    const context = await browser.newContext({
      viewport: SIZE,
      recordVideo: { dir: OUT_DIR, size: SIZE },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

    await page.goto(pathToFileURL(path.resolve(target.file)).href);
    // 手動録画用の余白・操作ボタンを除き、映像面だけを正確な420x740に固定する。
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        body { padding: 0 !important; min-height: 0 !important; align-items: flex-start !important; }
        .frame { width: 420px !important; max-width: none !important; }
        .stage { border: 0 !important; border-radius: 0 !important; }
        .ctrl, .note, .ctl { display: none !important; }
      `;
      document.head.append(style);
      window.dispatchEvent(new Event('resize'));
      if (typeof window.restart === 'function') window.restart();
    });
    await page.waitForTimeout(100);
    const canvasSize = await page
      .locator('canvas')
      .first()
      .evaluate((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      });
    if (canvasSize.width !== SIZE.width || canvasSize.height !== SIZE.height) {
      errors.push(
        `canvas: ${canvasSize.width}x${canvasSize.height}（期待値 ${SIZE.width}x${SIZE.height}）`
      );
    }

    await page.waitForTimeout(RECORD_MS);
    await page.close();
    const video = page.video();
    const dest = path.join(OUT_DIR, target.out + '.webm');
    await video.saveAs(dest);
    try {
      unlinkSync(await video.path());
    } catch {}

    const verifyPage = await context.newPage();
    await verifyPage.goto(pathToFileURL(dest).href);
    const metadata = await verifyPage.locator('video').evaluate((element) => {
      const read = () => ({
        duration: element.duration,
        width: element.videoWidth,
        height: element.videoHeight,
      });
      if (element.readyState >= 1) return read();
      return new Promise((resolve, reject) => {
        element.addEventListener('loadedmetadata', () => resolve(read()), { once: true });
        element.addEventListener('error', () => reject(new Error('動画メタデータを読めません')), {
          once: true,
        });
      });
    });
    await verifyPage.close();
    if (metadata.width !== SIZE.width || metadata.height !== SIZE.height) {
      errors.push(
        `video: ${metadata.width}x${metadata.height}（期待値 ${SIZE.width}x${SIZE.height}）`
      );
    }
    if (metadata.duration < 30 || metadata.duration > 33) {
      errors.push(`duration: ${metadata.duration.toFixed(2)}秒（期待値 30〜33秒）`);
    }
    await context.close();

    if (errors.length > 0) {
      unlinkSync(dest);
      throw new Error(`${target.id} の録画を中止:\n${errors.join('\n')}`);
    }
    if (statSync(dest).size < 100 * 1024) {
      unlinkSync(dest);
      throw new Error(`${target.id} の動画サイズが小さすぎます`);
    }
    produced.push(dest);
    console.log(`✅ ${path.basename(dest)}  (${fmtSize(statSync(dest).size)})`);
  }
} finally {
  await browser.close();
}

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
if (hasFfmpeg) {
  for (const webm of produced) {
    const mp4 = webm.replace(/\.webm$/, '.mp4');
    const result = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-i',
        webm,
        '-t',
        '30',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        mp4,
      ],
      { stdio: 'ignore' }
    );
    if (result.status !== 0) throw new Error(`${path.basename(mp4)} への変換に失敗しました`);
    console.log(`🎬 ${path.basename(mp4)}  (${fmtSize(statSync(mp4).size)})`);
  }
} else {
  console.log('ℹ️ ffmpeg がないためwebmのみ生成しました。導入後の再実行でmp4も生成されます。');
}

console.log(`完了: ${produced.length}本を ${OUT_DIR} に出力しました。`);
