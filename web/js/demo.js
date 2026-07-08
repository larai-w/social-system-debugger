// demo.js — デモモード（本物のエンジンでの自動再生。プロモ録画・展示用）
//   有効化: URL に ?demo=1 を付ける。無ければ何もしない（Web/ネイティブとも完全 no-op）。
//   vertical-reel スキル「完全一致が必要なら、アプリ本体にデモモードを実装して
//   本物のエンジンで録画するのが最強」の実装。ゴーストカーソルが実DOM（プリセット・
//   スライダー・アルゴリズム切替）を操作するだけで、値のハードコードや偽装は無い。
//   シーケンス: ⚡ワイマール崩壊 → 崩壊を見せる → フィルタ88→15 → 倫理12→88 → DP切替 → 安定 → ループ。
(function () {
  'use strict';
  try {
    if (new URLSearchParams(location.search).get('demo') !== '1') return;
  } catch (e) { return; }

  var cursor, badge, running = false;
  var raf = window.requestAnimationFrame.bind(window);
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function el(id) { return document.getElementById(id); }

  function makeOverlay() {
    badge = document.createElement('div');
    badge.textContent = 'DEMO';
    badge.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99998;padding:3px 10px;' +
      'border:1px solid var(--cyan,#00d4ff);border-radius:4px;color:var(--cyan,#00d4ff);' +
      'font:10px monospace;letter-spacing:.2em;background:rgba(7,11,20,.6);pointer-events:none';
    document.body.appendChild(badge);
    cursor = document.createElement('div');
    cursor.style.cssText = 'position:fixed;z-index:99999;width:16px;height:16px;border-radius:50%;' +
      'background:rgba(255,255,255,.95);box-shadow:0 0 14px var(--cyan,#00d4ff);' +
      'pointer-events:none;transform:translate(-50%,-50%);left:50%;top:70%;transition:none';
    document.body.appendChild(cursor);
  }

  function cursorPos() {
    var r = cursor.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function centerOf(target) {
    var r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  // なめらか移動（smoothstep）
  function moveTo(target, ms) {
    return new Promise(function (res) {
      var from = cursorPos(), to = centerOf(target), t0 = performance.now();
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms); k = k * k * (3 - 2 * k);
        cursor.style.left = from.x + (to.x - from.x) * k + 'px';
        cursor.style.top = from.y + (to.y - from.y) * k + 'px';
        if (k < 1) raf(step); else res();
      })(t0);
    });
  }
  function clickPulse() {
    var p = document.createElement('div');
    var c = cursorPos();
    p.style.cssText = 'position:fixed;z-index:99999;left:' + c.x + 'px;top:' + c.y + 'px;' +
      'width:16px;height:16px;border-radius:50%;border:2px solid var(--cyan,#00d4ff);' +
      'pointer-events:none;transform:translate(-50%,-50%);opacity:1;transition:all .45s ease-out';
    document.body.appendChild(p);
    raf(function () {
      p.style.width = '52px'; p.style.height = '52px'; p.style.opacity = '0';
    });
    setTimeout(function () { p.remove(); }, 500);
  }
  async function clickEl(target) {
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(450);
    await moveTo(target, 700);
    clickPulse();
    target.click();
  }
  // スライダーを実イベント（input/change）でなめらかに動かす＝本物の updateAll が毎ステップ走る
  async function dragSlider(id, toValue, ms) {
    var s = el(id); if (!s) return;
    s.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(450);
    await moveTo(s, 600);
    var from = Number(s.value), t0 = performance.now();
    await new Promise(function (res) {
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms); k = k * k * (3 - 2 * k);
        s.value = Math.round(from + (toValue - from) * k);
        s.dispatchEvent(new Event('input', { bubbles: true }));
        // つまみ位置にカーソルを追従
        var r = s.getBoundingClientRect();
        var ratio = (Number(s.value) - Number(s.min || 0)) / ((Number(s.max || 100)) - Number(s.min || 0));
        cursor.style.left = r.left + r.width * ratio + 'px';
        cursor.style.top = r.top + r.height / 2 + 'px';
        if (k < 1) raf(step); else res();
      })(t0);
    });
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function sequence() {
    // ⚡ ワイマール崩壊 → 崩壊を観察
    var weimar = el('p-weimar'); if (weimar) await clickEl(weimar);
    await sleep(3500);
    // 介入: フィルタを下げ、倫理を上げ、DP へ
    await dragSlider('filterRate', 15, 2200);
    await sleep(600);
    await dragSlider('ethicsScore', 88, 2200);
    await sleep(600);
    var dp = el('btnDP'); if (dp) await clickEl(dp);
    // 安定を見せる
    await sleep(4500);
  }

  async function run() {
    if (running) return; running = true;
    try {
      if (typeof closeIntro === 'function') closeIntro();
      makeOverlay();
      await sleep(800);
      // ループ再生（録画は好きな周回で止めればよい）
      for (;;) { await sequence(); await sleep(1200); }
    } catch (e) {
      // デモの失敗はアプリ本体に影響させない
      try { console.warn('demo mode stopped:', e && e.message); } catch (_) {}
    }
  }

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', function () { setTimeout(run, 600); });
})();
