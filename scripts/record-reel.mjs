#!/usr/bin/env node
// プロモリールの自動録画（MARKETING.md のX運用向け縦型リール／手動画面録画の置き換え）。
//   promo/ 配下のリールHTML（DUR=30秒・?lang=en で英語版）と web の demo モードを
//   Playwright の動画録画で 9:16（420×740）の webm として書き出す。
//   ffmpeg があれば X 投稿用に mp4 へも変換する。
//   実行: npm run record:reels   （出力先: dist/reels/ ＝ gitignore 対象）
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// ── 出力ディレクトリ（dist/ は .gitignore 済み）──────────
const OUT_DIR = path.resolve('dist/reels');
mkdirSync(OUT_DIR, { recursive: true });

// 録画サイズ＝縦型9:16（リールHTML の aspect-ratio 420/740 と一致）
const SIZE = { width: 420, height: 740 };

// ── 録画対象5本（リールは32秒＝DUR30秒を録り切る余白／demo は30秒）──
const TARGETS = [
  { file: 'promo/reel-30s.html', out: 'reel-p2-ja.webm', wait: 32000 },
  { file: 'promo/reel-30s.html?lang=en', out: 'reel-p2-en.webm', wait: 32000 },
  { file: 'promo/reel-30s-history.html', out: 'reel-history-ja.webm', wait: 32000 },
  { file: 'promo/reel-30s-history.html?lang=en', out: 'reel-history-en.webm', wait: 32000 },
  { file: 'web/index.html?demo=1', out: 'demo-p1.webm', wait: 30000 },
];

// クエリ付き file:// URL を作る（? より前だけを resolve し、クエリはそのまま付与）
function fileUrl(spec) {
  const q = spec.indexOf('?');
  const filePart = q === -1 ? spec : spec.slice(0, q);
  const query = q === -1 ? '' : spec.slice(q);
  return 'file://' + path.resolve(filePart) + query;
}

function fmtSize(bytes) {
  return (bytes / 1024).toFixed(0) + 'KB';
}

// ── 直列に1本ずつ録画 ────────────────────────────────
const browser = await chromium.launch();
const produced = [];
for (const t of TARGETS) {
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: OUT_DIR, size: SIZE },
  });
  const page = await context.newPage();
  await page.goto(fileUrl(t.file));
  await page.waitForTimeout(t.wait);
  await page.close(); // close で録画が確定する
  const dest = path.join(OUT_DIR, t.out);
  await page.video().saveAs(dest);
  // saveAs はコピーのため、Playwright の中間ファイル（page@hash.webm）を後始末する
  try {
    unlinkSync(await page.video().path());
  } catch (e) {}
  await context.close();
  const size = statSync(dest).size;
  produced.push(dest);
  console.log(`✅ ${t.out}  (${fmtSize(size)})`);
}
await browser.close();

// ── ffmpeg があれば mp4 へ変換（X 投稿は mp4 必須）──────────
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
if (hasFfmpeg) {
  for (const webm of produced) {
    const mp4 = webm.replace(/\.webm$/, '.mp4');
    const r = spawnSync(
      'ffmpeg',
      ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4],
      { stdio: 'ignore' }
    );
    if (r.status === 0) {
      console.log(`🎬 ${path.basename(mp4)}  (${fmtSize(statSync(mp4).size)})`);
    } else {
      console.log(`⚠️  ${path.basename(mp4)} への変換に失敗（webm は生成済み）`);
    }
  }
} else {
  console.log(
    '\nℹ️ ffmpeg が見つかりません。X 投稿には mp4 が必要です。\n' +
      '   ffmpeg を導入して再実行するか（例: brew install ffmpeg）、\n' +
      '   Mac の場合は QuickTime Player で webm を開いて mp4 として書き出してください。'
  );
}

console.log(`\n完了: ${produced.length} 本を ${OUT_DIR} に出力しました。`);
