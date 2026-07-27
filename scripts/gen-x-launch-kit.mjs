#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/x-launch-kit/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const files = [
  ['docs/x-launch-kit.md', '00-POSTING-GUIDE.md'],
  ['dist/promo-visuals/promo-visual-5.png', '02-key-visual.png'],
  ['dist/promo-visuals/promo-visual-3.png', '03-decision-weight.png'],
  ['dist/promo-visuals/promo-visual-2.png', '04-system-map.png'],
  ['dist/promo-visuals/promo-visual-4.png', '05-same-shock.png'],
  ['dist/promo-visuals/promo-visual-1.png', '06-product-intro.png'],
];

const videoMp4 = 'dist/social-reels/01-page4-meeting.mp4';
const videoWebm = 'dist/social-reels/01-page4-meeting.webm';
if (existsSync(root + videoMp4)) files.push([videoMp4, '01-page4-meeting.mp4']);
else if (existsSync(root + videoWebm)) files.push([videoWebm, '01-page4-meeting.webm']);
else console.warn('⚠️ PAGE 4動画は未生成です。make social-reels の後に再実行してください。');

for (const [source, name] of files) {
  const sourcePath = root + source;
  if (!existsSync(sourcePath)) throw new Error(`必要な素材がありません: ${source}`);
  const destination = outDir + name;
  copyFileSync(sourcePath, destination);
  if (statSync(destination).size === 0) throw new Error(`空のファイルです: ${name}`);
  console.log(`✅ ${name}`);
}

console.log(`完了: X投稿直前キットを ${outDir} に作成しました。`);
