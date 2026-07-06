// og-image.png（1200×630）を生成する。SNS共有時のプレビュー画像。
// アプリ内の結果カード(generateResultCard)と同系のダーク・ターミナル調デザイン。
//   実行: npm run gen:og   → web/og-image.png を出力（生成物はコミットする）
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

try { GlobalFonts.loadSystemFonts(); } catch (e) {}

const W = 1200, H = 630;
const CYAN = '#00d4ff', GREEN = '#00ff88', MUTED = '#5a6f94', BG = '#070b14';
const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans CJK JP",sans-serif';
const MONO = '"Courier New",monospace';

const cv = createCanvas(W, H);
const c = cv.getContext('2d');

// 背景 + 48pxグリッド
c.fillStyle = BG; c.fillRect(0, 0, W, H);
c.strokeStyle = 'rgba(0,212,255,.06)'; c.lineWidth = 1;
for (let x = 48; x < W; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
for (let y = 48; y < H; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }

// 二重フレーム
c.strokeStyle = CYAN; c.lineWidth = 3; c.strokeRect(16, 16, W - 32, H - 32);
c.strokeStyle = 'rgba(0,212,255,.3)'; c.lineWidth = 1; c.strokeRect(26, 26, W - 52, H - 52);

// タイトル + アプリ名 + タグライン
c.fillStyle = CYAN; c.font = `bold 60px ${JP}`;
c.shadowColor = 'rgba(0,212,255,.6)'; c.shadowBlur = 18;
c.fillText('社会デバッガー', 64, 118);
c.shadowBlur = 0;
c.fillStyle = MUTED; c.font = `20px ${MONO}`;
c.fillText('[ SOCIAL DEBUGGER ]', 66, 150);
c.fillStyle = '#c7d3ea'; c.font = `28px ${JP}`;
c.fillText('あなたの街は、生き残れるか。', 64, 210);

// 主要ゲージ3本
const gauges = [
  ['REDUNDANCY', 0.82], ['INFRASTRUCTURE', 0.68], ['COGNITION', 0.9],
];
let gy = 280;
gauges.forEach(([label, v]) => {
  c.fillStyle = MUTED; c.font = `20px ${MONO}`;
  c.fillText(label, 64, gy);
  c.fillStyle = '#172340'; c.fillRect(64, gy + 14, 620, 22);
  c.fillStyle = GREEN; c.fillRect(64, gy + 14, 620 * v, 22);
  gy += 74;
});

// SIMULATION ACTIVE スタンプ（斜め二重枠 + グロー）
c.save();
c.translate(940, 330); c.rotate(-0.1);
c.font = `bold 40px ${MONO}`; c.textAlign = 'center';
const txt = 'SIMULATION ACTIVE';
const tw = c.measureText(txt).width;
c.shadowColor = GREEN; c.shadowBlur = 20;
c.strokeStyle = GREEN; c.lineWidth = 4; c.strokeRect(-tw / 2 - 24, -34, tw + 48, 68);
c.lineWidth = 2; c.strokeRect(-tw / 2 - 32, -42, tw + 64, 84);
c.fillStyle = GREEN; c.fillText(txt, 0, 12);
c.restore();
c.textAlign = 'left'; c.shadowBlur = 0;

// 下部の免責
c.fillStyle = MUTED; c.font = `20px ${JP}`;
c.fillText('※特定の誰かではなく、どの社会にも起こる構造の話です', 64, H - 56);

const out = fileURLToPath(new URL('../web/og-image.png', import.meta.url));
writeFileSync(out, cv.toBuffer('image/png'));
console.log('✅ wrote', out);
