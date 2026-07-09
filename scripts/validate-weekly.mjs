#!/usr/bin/env node
// 週替わりシナリオ JSON を content/weekly.schema.json に沿って検証する（追加依存なし）。
// - 必須キー / 型 / enum
// - i18n フィールド（title/intro/goal/params.hint）の ja / en 両方存在チェック
// - goalConds の op enum・数値チェック
// CI（PR）で実行し、1件でも不正なら非0で失敗する。
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../content/weekly/', import.meta.url));
const OPS = new Set(['>=', '<=', '>', '<', '==', '!=']);
const DIFF = new Set(['easy', 'normal', 'hard']);
const I18N_FIELDS = ['title', 'intro', 'goal'];

let errors = 0;
const fail = (file, msg) => {
  console.error(`❌ ${file}: ${msg}`);
  errors++;
};

function checkI18n(file, obj, name) {
  if (!obj || typeof obj !== 'object') return fail(file, `${name} が無い/オブジェクトでない`);
  for (const lang of ['ja', 'en']) {
    if (typeof obj[lang] !== 'string' || obj[lang].length === 0)
      fail(file, `${name}.${lang} が無い/空`);
  }
}

function validate(file, s) {
  const req = [
    'id',
    'title',
    'intro',
    'page',
    'params',
    'goal',
    'goalConds',
    'difficulty',
    'discoveryId',
  ];
  for (const k of req) if (!(k in s)) fail(file, `必須キー欠落: ${k}`);

  if (typeof s.id !== 'string' || !s.id) fail(file, 'id が空');
  I18N_FIELDS.forEach((f) => checkI18n(file, s[f], f));

  if (!Number.isInteger(s.page) || s.page < 1 || s.page > 4)
    fail(file, `page は1〜4の整数: ${s.page}`);

  if (!s.params || typeof s.params !== 'object') fail(file, 'params が無い');
  else {
    if (!(s.params.p1 || s.params.p2 || s.params.p3 || s.params.p4))
      fail(file, 'params に p1〜p4 が1つも無い');
    if (s.params.hint) checkI18n(file, s.params.hint, 'params.hint');
  }

  if (!Array.isArray(s.goalConds) || s.goalConds.length === 0) fail(file, 'goalConds が空');
  else
    s.goalConds.forEach((c, i) => {
      if (typeof c.metric !== 'string' || !c.metric) fail(file, `goalConds[${i}].metric が無い`);
      if (!OPS.has(c.op)) fail(file, `goalConds[${i}].op が不正: ${c.op}`);
      if (typeof c.value !== 'number') fail(file, `goalConds[${i}].value が数値でない`);
    });

  if (!DIFF.has(s.difficulty)) fail(file, `difficulty が不正: ${s.difficulty}`);
  if (typeof s.discoveryId !== 'string' || !/^sce_/.test(s.discoveryId))
    fail(file, `discoveryId は sce_ 始まり: ${s.discoveryId}`);
}

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error('❌ content/weekly に JSON がありません');
  process.exit(1);
}

for (const f of files) {
  let s;
  try {
    s = JSON.parse(readFileSync(dir + f, 'utf8'));
  } catch (e) {
    fail(f, `JSON パース失敗: ${e.message}`);
    continue;
  }
  validate(f, s);
}

if (errors > 0) {
  console.error(`\n検証失敗: ${errors} 件`);
  process.exit(1);
}
console.log(`✅ ${files.length} 件の週替わりシナリオJSONを検証しました（スキーマOK・ja/en完備）`);

// T42: 在庫残量ガード — 最新在庫週が今日のISO週から3週未満なら警告する（weekly-rotate が
// 在庫切れで失敗する前に、CI/ローカルで補充時期が見えるようにする。検証の成否には影響しない）。
function isoWeekMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const m = new Date(mondayW1);
  m.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
  return m;
}
function currentIsoWeekMonday(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}
const weekIds = files
  .map((f) => f.match(/^(\d{4})-W(\d{2})\.json$/))
  .filter(Boolean)
  .map((m) => ({ id: `${m[1]}-W${m[2]}`, monday: isoWeekMonday(Number(m[1]), Number(m[2])) }))
  .sort((a, b) => a.monday - b.monday);
if (weekIds.length > 0) {
  const latest = weekIds[weekIds.length - 1];
  const weeksLeft = Math.round(
    (latest.monday - currentIsoWeekMonday(new Date())) / (7 * 24 * 3600 * 1000)
  );
  if (weeksLeft < 3) {
    console.warn(
      `⚠ 週次シナリオの在庫が残り${Math.max(0, weeksLeft)}週です（最新: ${latest.id}）。次週分以降の補充を計画してください。`
    );
  } else {
    console.log(`📦 在庫: 残り${weeksLeft}週（最新: ${latest.id}）`);
  }
}
