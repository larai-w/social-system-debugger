// ストア提出用のアプリアイコン/スプラッシュを生成する（@capacitor/assets の入力規約に準拠）。
//   web/icon.svg と同一デザイン（ダーク地・ノードネットワーク・壊れた赤リンク1本）を
//   プログラム描画で高解像度化する。生成物はコミットする（gen-og と同じ方針）。
//   実行: npm run gen:icons → resources/icon.png(1024) / splash.png・splash-dark.png(2732)
//   実機側: npx cap add ios|android 後に `npx @capacitor/assets generate` が resources/ を読む。
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('resources', { recursive: true });

const BG = '#070b14',
  CYAN = '#00d4ff',
  RED = '#ff2244';

// web/icon.svg（viewBox 512）の忠実な再描画。size=一辺、pad=余白率（スプラッシュでは小さく描く）
function drawIcon(c, size, scaleRatio = 1) {
  const s = (size / 512) * scaleRatio;
  const off = (size - 512 * s) / 2; // 中央寄せ
  c.save();
  c.translate(off, off);
  // 薄いシアン格子（アイコン領域のみ）
  c.strokeStyle = 'rgba(0,212,255,.10)';
  c.lineWidth = 2 * s;
  for (const x of [96, 192, 320, 416]) {
    c.beginPath();
    c.moveTo(x * s, 0);
    c.lineTo(x * s, 512 * s);
    c.stroke();
    c.beginPath();
    c.moveTo(0, x * s);
    c.lineTo(512 * s, x * s);
    c.stroke();
  }
  // リンク（正常2本＝シアン、壊れた1本＝赤破線）
  c.lineWidth = 10 * s;
  c.strokeStyle = CYAN;
  c.beginPath();
  c.moveTo(256 * s, 256 * s);
  c.lineTo(256 * s, 148 * s);
  c.stroke();
  c.beginPath();
  c.moveTo(256 * s, 256 * s);
  c.lineTo(154 * s, 330 * s);
  c.stroke();
  c.strokeStyle = RED;
  c.setLineDash([14 * s, 12 * s]);
  c.beginPath();
  c.moveTo(256 * s, 256 * s);
  c.lineTo(360 * s, 330 * s);
  c.stroke();
  c.setLineDash([]);
  // ノード
  const node = (x, y, r, col) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x * s, y * s, r * s, 0, 7);
    c.fill();
  };
  node(256, 148, 22, CYAN);
  node(154, 330, 22, CYAN);
  node(360, 330, 24, RED);
  node(256, 256, 34, CYAN);
  // ハブの発光リング
  c.strokeStyle = 'rgba(0,212,255,.5)';
  c.lineWidth = 10 * s;
  c.beginPath();
  c.arc(256 * s, 256 * s, 34 * s, 0, 7);
  c.stroke();
  c.restore();
}

function render(size, scaleRatio, file) {
  const cv = createCanvas(size, size);
  const c = cv.getContext('2d');
  c.fillStyle = BG;
  c.fillRect(0, 0, size, size);
  drawIcon(c, size, scaleRatio);
  writeFileSync(file, cv.toBuffer('image/png'));
  console.log(`✅ ${file} (${size}×${size})`);
}

// icon: 全面にデザイン（各OSのマスクで角が丸まる前提。要素は中央寄りなので安全域内）
render(1024, 1, 'resources/icon.png');
// splash: 中央に小さめのモチーフだけ（ガイドライン準拠のシンプル構成）。dark も同一（元々ダーク）
render(2732, 0.28, 'resources/splash.png');
render(2732, 0.28, 'resources/splash-dark.png');
console.log('完了: npx cap add 後に `npx @capacitor/assets generate` で各OSサイズへ展開できます。');
