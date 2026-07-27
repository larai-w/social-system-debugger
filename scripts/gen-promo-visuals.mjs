#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../promo/promo-visuals.html', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/promo-visuals/', import.meta.url));
const ids = ['visual1', 'visual2', 'visual3', 'visual4', 'visual5'];
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1240, height: 720 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
page.on('pageerror', (error) => errors.push(error.message));
await page.goto('file://' + source);

for (let index = 0; index < ids.length; index++) {
  const card = page.locator('#' + ids[index]);
  const box = await card.boundingBox();
  if (!box || box.width !== 1200 || box.height !== 675)
    throw new Error(`${ids[index]} の寸法が不正です`);
  const output = `${outDir}promo-visual-${index + 1}.png`;
  await card.screenshot({ path: output });
  if (statSync(output).size < 80 * 1024) throw new Error(`${output} の画像サイズが小さすぎます`);
  console.log(`✅ promo-visual-${index + 1}.png`);
}

await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
console.log(`完了: ${ids.length}枚を ${outDir} に生成しました。`);
