// ══════════════════════════════════════════════════════════
// scenario.js — 週替わりシナリオ（フェーズ1 タスク4）
//   ・機能全体は WEEKLY_ENABLED（= ネイティブのみ true）でガード。Web は完全 no-op。
//   ・ハードコードの check 関数を宣言的な goalConds[{metric,op,value}] に変換
//     （JSON配信可能に）。バンドル版はオフライン/取得失敗時のフォールバック。
//   ・起動時に CloudFront の latest.json を fetch。成功すればそれを今週分に採用。
//   ・クリアは既存判定を流用。ssd_weekly_cleared に週IDを永続化し、
//     発見図鑑に「今週の守り人」を記録。初回クリア直後に通知許可を求める。
//   ui.js より前に読み込むが中身は宣言のみ（即時実行は DOMContentLoaded 内だけ）。
// ══════════════════════════════════════════════════════════

// 配信元（タスク5の CloudFront ドメインに置換する）。取得失敗時はバンドルへフォールバック。
const CONTENT_BASE_URL = 'https://REPLACE_WITH_CLOUDFRONT_DOMAIN/content/weekly';
const LATEST_URL = CONTENT_BASE_URL + '/latest.json';

// 週次通知の曜日・時刻（変更可能な定数）: 月曜 19:00
const WEEKLY_NOTIFY_DOW = 1;   // 0=Sun .. 1=Mon（JS Date 準拠）
const WEEKLY_NOTIFY_HOUR = 19;
const WEEKLY_NOTIF_ID = 42;

// ── バンドル版シナリオ（宣言的 goalConds / フォールバック） ─────────────
const SCENARIOS = [
  {
    id: 'echo_trap',
    title: { ja: 'エコーチェンバーの罠', en: 'Echo Chamber Trap' },
    intro: { ja: 'フィルタリングが徐々に強まる世界で、情報空間は澄むか、濁るか？', en: 'As filtering gradually increases, will your information space stay clear or become clouded?' },
    page: 1,
    params: { p1: { f: 0, e: 100, al: 'dp' }, hint: { ja: 'フィルタリングを少しずつ上げていき、多様性とエントロピーがどう変わるかを観察してください。', en: 'Gradually increase filtering and observe how diversity and entropy change.' } },
    goal: { ja: 'エントロピーを70以上に上昇させずに、多様性を80以上に保つ', en: 'Keep diversity above 80 while preventing entropy from rising above 70' },
    goalConds: [ { metric: 'diversity', op: '>=', value: 80 }, { metric: 'entropy', op: '<', value: 70 } ],
    difficulty: 'normal',
    discoveryId: 'sce_echo_trap'
  },
  {
    id: 'ethics_cascade',
    title: { ja: 'リーダー倫理観の滝', en: 'Leader Ethics Waterfall' },
    intro: { ja: 'リーダーの倫理観が低下するとき、社会全体がどうカスケードするか？', en: 'When a leader\'s ethics drops, how does the entire society cascade?' },
    page: 1,
    params: { p1: { f: 30, e: 100, al: 'dp' }, hint: { ja: 'リーダーの倫理スコアをゆっくり下げ、パラノイア、信頼、正当性がどう悪化するかを見てください。', en: 'Slowly lower the leader\'s ethics score and watch paranoia, trust, and legitimacy deteriorate.' } },
    goal: { ja: '正当性（Legitimacy）を60以上に保ちながら、倫理スコアを50以上に上げ直す', en: 'Keep legitimacy above 60 while raising the ethics score back to 50+' },
    goalConds: [ { metric: 'legitimacy', op: '>=', value: 60 }, { metric: 'ethicsScore', op: '>=', value: 50 } ],
    difficulty: 'normal',
    discoveryId: 'sce_ethics_cascade'
  },
  {
    id: 'successor_crisis',
    title: { ja: '後継者ストック危機', en: 'Successor Stock Crisis' },
    intro: { ja: 'DXに投資しなければ、後継者ストックが枯渇し、ブランドが崖から落ちる。', en: 'Without DX investment, successor stock depletes and the brand collapses off a cliff.' },
    page: 2,
    params: { p2: { s: 30, d: 10, e: 80, al: 'dp', reboot: false }, hint: { ja: 'DX投資を急速に上げて、後継者ストック（スキルゲージ）の回復を見てください。平穏→崖落ちの瞬間を体験できます。', en: 'Rapidly increase DX investment to recover the successor stock (skill gauge). Experience the calm→cliff moment.' } },
    goal: { ja: '後継者ストックを50以上に回復させ、ブランド産業の崩壊を止める', en: 'Recover successor stock above 50 and prevent brand industry collapse' },
    goalConds: [ { metric: 'skillStock', op: '>=', value: 50 }, { metric: 'brand', op: '>=', value: 40 } ],
    difficulty: 'normal',
    discoveryId: 'sce_successor_crisis'
  },
  {
    id: 'redundancy_shock',
    title: { ja: '冗長性ショック対抗', en: 'Redundancy Shock Resilience' },
    intro: { ja: 'インフラの集約化を進めると、ショックに脆くなる。冗長性バッファを上げてショックに耐える。', en: 'Consolidating infrastructure makes you vulnerable to shocks. Build redundancy buffer to survive.' },
    page: 2,
    params: { p2: { s: 50, d: 30, e: 80, al: 'dp', reboot: false }, hint: { ja: '集約化（Consolidation）を下げて冗長性を上げ、そのあと⚡ショックを注入してください。生存の分岐点を見てください。', en: 'Lower consolidation to raise redundancy, then inject ⚡ shock. Watch the survival branching point.' } },
    goal: { ja: '冗長性バッファを75以上に上げ、ショック注入後も生き残る', en: 'Raise redundancy buffer above 75 and survive after shock injection' },
    goalConds: [ { metric: 'redundancy', op: '>=', value: 75 }, { metric: 'infra', op: '>=', value: 20 } ],
    difficulty: 'hard',
    discoveryId: 'sce_redundancy_shock'
  },
  {
    id: 'cognitive_grounding',
    title: { ja: '認知のグラウンディング', en: 'Cognitive Grounding' },
    intro: { ja: 'SNS断食と現実同期：深い探索と高い学習率でバランスを取る。', en: 'SNS fasting & reality sync: balance deep reasoning with high learning rate.' },
    page: 3,
    params: { p3: { depth: 3, ground: 20, lr: 20 }, hint: { ja: 'パラメータを調整して、「毒入れ」（赤い攻撃）が消えるか、認知健全性が改善するか観察してください。', en: 'Adjust parameters to watch the "poisoning attack" (red arrows) disappear and cognitive integrity improve.' } },
    goal: { ja: '認知健全性（Integrity）を80以上に上げ、探索深度を7以上にする', en: 'Raise cognitive integrity above 80 and achieve search depth 7+' },
    goalConds: [ { metric: 'integrity', op: '>=', value: 80 }, { metric: 'searchDepth', op: '>=', value: 7 } ],
    difficulty: 'normal',
    discoveryId: 'sce_cognitive_grounding'
  },
  {
    id: 'stakeholder_voice',
    title: { ja: '当事者の声を取り戻す', en: 'Restore Stakeholder Voice' },
    intro: { ja: 'ゲーム化が進むと、当事者比率が低下する。フィルタリングで本来の声を優先させる。', en: 'As gamification rises, stakeholder ratio drops. Use filtering to restore true voices.' },
    page: 4,
    params: { p4: { ext: 50, gam: 40 }, hint: { ja: 'ゲーム化（Gamification）とパケットドロップ率の関係を観察し、フィルタリングで当事者比率を改善してください。', en: 'Observe how gamification links to packet drop, and use filtering to improve stakeholder ratio.' } },
    goal: { ja: '当事者コミット比率を70以上に上げ、パケットドロップ率を40以下に下げる', en: 'Raise stakeholder commit ratio above 70 and drop packet rate below 40%' },
    goalConds: [ { metric: 'ratio', op: '>=', value: 70 }, { metric: 'drop', op: '<=', value: 40 } ],
    difficulty: 'normal',
    discoveryId: 'sce_stakeholder_voice'
  }
];

let _remoteScenario = null;   // latest.json 取得成功時にセット

// intro/brief どちらの表記でも扱えるよう正規化し、goalConds を保証
function normalizeScenario(s) {
  if (!s) return null;
  if (!s.intro && s.brief) s.intro = s.brief;
  if (!s.brief && s.intro) s.brief = s.intro;
  if (!Array.isArray(s.goalConds)) s.goalConds = [];
  return s;
}

// バンドル版の週替わり選択（年初からの週番号でローテーション）
function getWeeklyScenario() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const diffWeeks = Math.floor((now - jan1) / (1000 * 60 * 60 * 24 * 7));
  return SCENARIOS[diffWeeks % SCENARIOS.length];
}

// アクティブなシナリオ = 配信版があればそれ、なければバンドル版
function getActiveScenario() {
  return _remoteScenario || getWeeklyScenario();
}

// ── 宣言的ゴール判定 ───────────────────────────────────────
// 現在のパラメータ（グローバル）に、ページ別に渡される metricsObj を重ねた文脈で評価
function scenarioContext(metricsObj) {
  const base = {
    ethicsScore: (typeof ethicsScore !== 'undefined') ? ethicsScore : 0,
    filterRate: (typeof filterRate !== 'undefined') ? filterRate : 0,
    skillStock: (typeof skillStock !== 'undefined') ? skillStock : 0,
    searchDepth: (typeof searchDepth !== 'undefined') ? searchDepth : 0,
    groundingRate: (typeof groundingRate !== 'undefined') ? groundingRate : 0,
    learningRate: (typeof learningRate !== 'undefined') ? learningRate : 0,
    extTraffic: (typeof extTraffic !== 'undefined') ? extTraffic : 0,
    gamification: (typeof gamification !== 'undefined') ? gamification : 0
  };
  return Object.assign(base, metricsObj || {});
}
function evalGoalConds(conds, ctx) {
  if (!conds || !conds.length) return false;
  return conds.every(function (c) {
    const v = Number(ctx[c.metric]);
    if (Number.isNaN(v)) return false;
    switch (c.op) {
      case '>=': return v >= c.value;
      case '<=': return v <= c.value;
      case '>':  return v > c.value;
      case '<':  return v < c.value;
      case '==': return v === c.value;
      case '!=': return v !== c.value;
      default:   return false;
    }
  });
}

// ── クリア記録の永続化 ─────────────────────────────────────
function getWeeklyCleared() {
  try { return JSON.parse(localStorage.getItem('ssd_weekly_cleared') || '[]'); }
  catch (e) { return []; }
}
function isWeeklyCleared(id) { return getWeeklyCleared().indexOf(id) !== -1; }
function markWeeklyCleared(id) {
  const a = getWeeklyCleared();
  if (a.indexOf(id) === -1) { a.push(id); try { localStorage.setItem('ssd_weekly_cleared', JSON.stringify(a)); } catch (e) {} }
}

// ── パラメータ適用（既存ロジックを踏襲） ─────────────────────
function applyScenarioParams(scenario) {
  if (scenario.params.p1) {
    const p = scenario.params.p1;
    filterRate = p.f; ethicsScore = p.e; algo = p.al;
    document.getElementById('filterRate').value = p.f;
    document.getElementById('ethicsScore').value = p.e;
    document.getElementById('btnDP').classList.toggle('on', p.al === 'dp');
    document.getElementById('btnDP').classList.toggle('green-on', p.al === 'dp');
    document.getElementById('btnGreedy').classList.toggle('on', p.al === 'greedy');
    document.getElementById('btnGreedy').classList.toggle('red-on', p.al === 'greedy');
    setPct(document.getElementById('filterRate'));
    setPct(document.getElementById('ethicsScore'));
    updateAll();
  }
  if (scenario.params.p2) {
    const p = scenario.params.p2;
    shrinkRate = p.s; dxRate = p.d; ethicsP2 = p.e; algo = p.al; publicReboot = p.reboot || false;
    if (p.d >= 45) skillStock = 80; else if (p.d < 25) skillStock = 10; else skillStock = 50;
    document.getElementById('shrinkRate').value = p.s;
    document.getElementById('dxRate').value = p.d;
    document.getElementById('ethicsScoreP2').value = p.e;
    if (p.al === 'dp') {
      document.getElementById('btnDPP2').classList.add('on');
      document.getElementById('btnDPP2').classList.add('green-on');
      document.getElementById('btnGreedyP2').classList.remove('on');
      document.getElementById('btnGreedyP2').classList.remove('red-on');
    } else {
      document.getElementById('btnGreedyP2').classList.add('on');
      document.getElementById('btnGreedyP2').classList.add('red-on');
      document.getElementById('btnDPP2').classList.remove('on');
      document.getElementById('btnDPP2').classList.remove('green-on');
    }
    document.getElementById('btnRebootOff').classList.toggle('on', !p.reboot);
    document.getElementById('btnRebootOn').classList.toggle('on', p.reboot);
    document.getElementById('btnRebootOn').classList.toggle('green-on', p.reboot);
    setPct(document.getElementById('shrinkRate'));
    setPct(document.getElementById('dxRate'));
    setPct(document.getElementById('ethicsScoreP2'));
    updateAllP2();
  }
  if (scenario.params.p3) {
    const p = scenario.params.p3;
    searchDepth = p.depth; groundingRate = p.ground; learningRate = p.lr;
    document.getElementById('searchDepth').value = p.depth;
    document.getElementById('groundingRate').value = p.ground;
    document.getElementById('learningRate').value = p.lr;
    setPct(document.getElementById('groundingRate'));
    setPct(document.getElementById('learningRate'));
    // P3 のモニターは常時アニメーションループが更新するため、ここではチャートのみ再描画
    updateP3Chart();
  }
  if (scenario.params.p4) {
    const p = scenario.params.p4;
    extTraffic = p.ext; gamification = p.gam;
    document.getElementById('extTraffic').value = p.ext;
    document.getElementById('gamification').value = p.gam;
    setPct(document.getElementById('extTraffic'));
    setPct(document.getElementById('gamification'));
    updateP4Chart();
  }
}

// ── モーダル / カード ──────────────────────────────────────
function openScenarios() {
  if (!WEEKLY_ENABLED) return;
  const s = getActiveScenario();
  const titleEl = document.getElementById('scenarioTitle');
  const descEl = document.getElementById('scenarioDesc');
  const goalEl = document.getElementById('scenarioGoal');
  const hintEl = document.getElementById('scenarioHint');
  const checkEl = document.getElementById('scenarioCheckContainer');
  if (titleEl) titleEl.textContent = tt(s.title.ja, s.title.en);
  if (descEl) descEl.textContent = tt(s.intro.ja, s.intro.en);
  if (goalEl) goalEl.textContent = tt(s.goal.ja, s.goal.en);
  if (hintEl) hintEl.textContent = (s.params.hint ? tt(s.params.hint.ja, s.params.hint.en) : '');
  if (checkEl) checkEl.style.display = 'none';
  document.getElementById('scenarioModal').classList.add('on');
}
function closeScenarios() { document.getElementById('scenarioModal').classList.remove('on'); }
function closeScenarioIf(e) { if (e.target === document.getElementById('scenarioModal')) closeScenarios(); }

function startScenario() {
  const s = getActiveScenario();
  window._weeklyCleared = null;   // 新しい挑戦を始めるので前回クリア表示をリセット
  applyScenarioParams(s);
  switchTab(s.page);
  closeScenarios();
  track('weekly_start', { id: s.id });
  showShareToast({ kind: 'scenario', title: tt(s.title.ja, s.title.en) });
}

function initWeeklyScenarioCard() {
  if (!WEEKLY_ENABLED) return;
  const s = getActiveScenario();
  const cleared = isWeeklyCleared(s.id) || (s.discoveryId && typeof _discovered !== 'undefined' && _discovered.has(s.discoveryId));
  const set = function (id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set('scenarioCardTitle', tt(s.title.ja, s.title.en));
  set('scenarioCardBrief', tt(s.intro.ja, s.intro.en));
  set('scenarioCardGoal', tt(s.goal.ja, s.goal.en));
  const statusEl = document.getElementById('scenarioCardStatus');
  const btnEl = document.getElementById('scenarioCardBtn');
  if (!btnEl) return;
  if (cleared) {
    if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = tt('✓ CLEARED — 来週のシナリオをお楽しみに！', '✓ CLEARED — Another challenge next week!'); }
    btnEl.textContent = tt('来週のシナリオまで待機中', 'Waiting for next week');
    btnEl.disabled = true; btnEl.style.opacity = '0.5'; btnEl.style.cursor = 'default';
  } else {
    if (statusEl) statusEl.style.display = 'none';
    btnEl.disabled = false; btnEl.style.opacity = '1'; btnEl.style.cursor = 'pointer';
    btnEl.textContent = tt('▶ 挑戦する', '▶ Take the challenge');
  }
}

function startWeeklyScenarioFromCard() {
  const s = getActiveScenario();
  window._weeklyCleared = null;
  applyScenarioParams(s);
  switchTab(s.page);
  track('weekly_start', { id: s.id });
  showShareToast({ kind: 'scenario', title: tt(s.title.ja, s.title.en) });
}

// ── ゴール判定（updateAll から各ページで呼ばれる） ───────────
function checkScenarioGoal(metricsObj) {
  if (!WEEKLY_ENABLED) return;   // Web は無効
  const s = getActiveScenario();
  if (!s) return;
  // シナリオ説明モーダルを開いている間は判定しない
  if (document.getElementById('scenarioModal') && document.getElementById('scenarioModal').classList.contains('on')) return;
  const passed = evalGoalConds(s.goalConds, scenarioContext(metricsObj));
  if (!passed) return;

  const firstEver = getWeeklyCleared().length === 0;
  let newly = false;
  if (s.discoveryId && typeof _discovered !== 'undefined' && !_discovered.has(s.discoveryId)) { discover(s.discoveryId); newly = true; }
  if (!isWeeklyCleared(s.id)) { markWeeklyCleared(s.id); newly = true; }
  if (!newly) return;

  discover('sce_weekly_guardian');           // 「今週の守り人」
  window._weeklyCleared = { title: tt(s.title.ja, s.title.en), id: s.id };
  track('weekly_clear', { id: s.id });
  if (window.SSD) SSD.haptic('success');
  const checkEl = document.getElementById('scenarioCheckContainer');
  if (checkEl) checkEl.style.display = 'block';
  initWeeklyScenarioCard();
  if (firstEver) maybeAskWeeklyNotifications();   // 初回クリア直後に通知許可
}

// ── 通知（local-notifications / ネイティブのみ） ──────────────
async function maybeAskWeeklyNotifications() {
  if (!(window.SSD && SSD.isNative)) return;
  const P = SSD.plugins || {};
  if (!P.LocalNotifications) return;
  try { if (localStorage.getItem('ssd_notif_optin') != null) return; } catch (e) {}   // 既に決定済み
  const ok = window.confirm(tt('来週も新しいシナリオが届きます。通知を受け取りますか？',
    'A new scenario arrives next week. Want a reminder?'));
  track('notification_optin', { granted: ok });
  try { localStorage.setItem('ssd_notif_optin', ok ? '1' : '0'); } catch (e) {}
  if (!ok) return;
  try {
    const perm = await P.LocalNotifications.requestPermissions();
    if (perm && perm.display === 'granted') scheduleWeeklyNotification();
  } catch (e) {}
}
async function scheduleWeeklyNotification() {
  const P = (window.SSD && SSD.plugins) || {};
  if (!P.LocalNotifications) return;
  try {
    await P.LocalNotifications.schedule({
      notifications: [{
        id: WEEKLY_NOTIF_ID,
        title: tt('今週のシナリオが届いています', 'This week\'s scenario is live'),
        body: tt('あなたの街は、今週も生き残れるか。', 'Can your town survive this week too?'),
        // Capacitor の weekday は 1=Sun..7=Sat。JS の dow(=1:Mon) に +1 で対応。
        schedule: { on: { weekday: WEEKLY_NOTIFY_DOW + 1, hour: WEEKLY_NOTIFY_HOUR, minute: 0 }, allowWhileIdle: true, repeats: true }
      }]
    });
  } catch (e) {}
}

// ── 配信版の取得（起動時 / ネイティブのみ） ───────────────────
async function loadRemoteScenario() {
  if (!WEEKLY_ENABLED) return;
  try {
    const res = await fetch(LATEST_URL, { cache: 'no-store' });
    if (res.ok) { _remoteScenario = normalizeScenario(await res.json()); }
  } catch (e) { /* オフライン/失敗時はバンドル版フォールバック */ }
  initWeeklyScenarioCard();
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof WEEKLY_ENABLED !== 'undefined' && WEEKLY_ENABLED) loadRemoteScenario();
});
