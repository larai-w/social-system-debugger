// 週替わりシナリオを「今週のファイル」から直接取る仕組みのテスト（2026-10-05）。
// latest.json を毎週 main に push する方式がリポジトリのルールで止まっていたため、
// アプリが日本時間の ISO 週（`TZ=Asia/Tokyo date +%G-W%V` と同じ）でファイルを選ぶ。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../web/js/scenario.js', import.meta.url)), 'utf8');

function load({ fetchImpl } = {}) {
  const documentStub = {
    addEventListener() {},
    getElementById() {
      return null;
    },
  };
  const windowStub = { SSD_CONFIG: { contentBaseUrl: 'https://cdn.example/content/weekly' } };
  return new Function(
    'document',
    'window',
    'fetch',
    'WEEKLY_ENABLED',
    src +
      '\ninitWeeklyScenarioCard = function () {};' +
      '\nreturn { weekIdJST, loadRemoteScenario, getActiveScenario };'
  )(documentStub, windowStub, fetchImpl, true);
}

// 期待値は Python の isocalendar() で UTC+9 に直してから出したもの
const cases = [
  ['2026-10-04T14:30:00Z', '2026-W40'], // 日曜 23:30 JST
  ['2026-10-04T15:10:00Z', '2026-W41'], // 月曜 00:10 JST（UTC ではまだ日曜）
  ['2025-12-31T16:00:00Z', '2026-W01'], // 2026-01-01 JST
  ['2026-12-31T15:30:00Z', '2026-W53'], // 2027-01-01 JST はまだ 2026 年の第53週
  ['2027-01-03T14:59:00Z', '2026-W53'],
  ['2027-01-03T15:00:00Z', '2027-W01'],
];

for (const [iso, expected] of cases) {
  test(`weekIdJST(${iso}) is ${expected}`, () => {
    assert.equal(load().weekIdJST(new Date(iso)), expected);
  });
}

test('the week ids the app asks for exist in content/weekly for the stocked range', () => {
  const sc = load();
  const id = sc.weekIdJST(new Date('2026-12-31T15:30:00Z'));
  assert.ok(
    existsSync(fileURLToPath(new URL(`../content/weekly/${id}.json`, import.meta.url))),
    id
  );
});

test("loader asks for this week's file first and does not need latest.json", async () => {
  const asked = [];
  const sc = load({
    fetchImpl: async (url) => {
      asked.push(url);
      return {
        ok: true,
        json: async () => ({
          id: 'from-week-file',
          title: { ja: 'a', en: 'a' },
          intro: { ja: 'b', en: 'b' },
          goalConds: [],
        }),
      };
    },
  });
  await sc.loadRemoteScenario();
  assert.equal(asked.length, 1, asked.join(', '));
  assert.match(asked[0], /\/content\/weekly\/\d{4}-W\d{2}\.json$/);
  assert.equal(sc.getActiveScenario().id, 'from-week-file');
});

test('loader falls back to latest.json when this week is missing', async () => {
  const asked = [];
  const sc = load({
    fetchImpl: async (url) => {
      asked.push(url);
      if (url.endsWith('/latest.json')) {
        return {
          ok: true,
          json: async () => ({
            id: 'from-latest',
            title: { ja: 'a', en: 'a' },
            intro: { ja: 'b', en: 'b' },
            goalConds: [],
          }),
        };
      }
      return { ok: false };
    },
  });
  await sc.loadRemoteScenario();
  assert.equal(asked.length, 2);
  assert.equal(sc.getActiveScenario().id, 'from-latest');
});

test('the weekly reminder is scheduled as inexact (no exact-alarm prompt on Android 12+)', async () => {
  let scheduled = null;
  const documentStub = {
    addEventListener() {},
    getElementById() {
      return null;
    },
  };
  const windowStub = {
    SSD: {
      plugins: {
        LocalNotifications: {
          schedule: async (arg) => {
            scheduled = arg;
          },
        },
      },
    },
  };
  const sc = new Function(
    'document',
    'window',
    'SSD',
    'tt',
    src + '\nreturn { scheduleWeeklyNotification };'
  )(documentStub, windowStub, windowStub.SSD, (ja) => ja);
  await sc.scheduleWeeklyNotification();
  assert.ok(scheduled, 'schedule() was not called');
  assert.equal(scheduled.notifications[0].isExactNotification, false);
});
