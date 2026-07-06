// ══════════════════════════════════════════════════════════
// native.js — Capacitor ネイティブ橋渡し（フェーズ1 タスク2）
//   設計方針:
//   ・バンドラを使わない（既存は古典スクリプト構成）。ネイティブ実行時に
//     Capacitor が WebView へ注入する window.Capacitor.Plugins.* を実行時参照する。
//   ・Web（GitHub Pages / AWS）では window.Capacitor が存在しない →
//     すべて no-op。localStorage も一切ラップしない＝従来動作を完全維持。
//   ・全メソッドは try/catch で保護し、ネイティブ機能が欠けても本体を壊さない。
//   window.SSD という薄いファサードを公開し、ui.js からは常に SSD.xxx() を安全に呼べる。
// ══════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CAP = window.Capacitor;
  var isNative = !!(CAP && typeof CAP.isNativePlatform === 'function' && CAP.isNativePlatform());
  var P = (CAP && CAP.Plugins) || {};
  var platform = (CAP && typeof CAP.getPlatform === 'function') ? CAP.getPlatform() : 'web';

  // ssd_* データの localStorage キー（Preferences ミラー対象）
  var SSD_PREFIX = 'ssd_';
  var MIGRATED_FLAG = 'ssd_prefs_migrated';

  // ---- Haptics ----------------------------------------------------------
  // kind: 'crash'（崩壊 = 強めの衝撃）/ 'success'（巻き戻し成功）/ 'light'
  function haptic(kind) {
    if (!isNative || !P.Haptics) return;
    try {
      if (kind === 'success') {
        P.Haptics.notification({ type: 'SUCCESS' });
      } else if (kind === 'crash') {
        // 崩壊: 警告通知 + 強い衝撃の二段（短く）
        P.Haptics.notification({ type: 'WARNING' });
        P.Haptics.impact({ style: 'HEAVY' });
      } else {
        P.Haptics.impact({ style: 'LIGHT' });
      }
    } catch (e) {}
  }

  // ---- Share ------------------------------------------------------------
  // opts: { title?, text?, url?, files?[], dialogTitle? } → Promise<boolean>
  function share(opts) {
    if (!isNative || !P.Share) return Promise.resolve(false);
    try {
      return P.Share.share(opts || {}).then(function () { return true; })
        .catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  // ---- Preferences 永続化（ネイティブのみ） ------------------------------
  // 方針: WebView の localStorage は同期・既存コードがそのまま使える唯一の
  //   ソース・オブ・トゥルース。Preferences(UserDefaults/SharedPreferences)は
  //   OS のストレージ逼迫でも消えにくい「耐久ミラー」として併用する。
  //   ① 起動時に一度だけ localStorage の ssd_* を Preferences へ複製（フラグで二重防止）
  //   ② 以降 localStorage への ssd_* 書き込みを write-through でミラー
  //   ③ 起動時、localStorage に無く Preferences にある ssd_* を復元（耐久性、結果整合）
  var _origSet = null, _origRemove = null;

  function mirrorSet(key, value) {
    if (!P.Preferences) return;
    try { P.Preferences.set({ key: key, value: String(value) }); } catch (e) {}
  }
  function mirrorRemove(key) {
    if (!P.Preferences) return;
    try { P.Preferences.remove({ key: key }); } catch (e) {}
  }

  function installWriteThrough() {
    if (_origSet) return; // 二重ラップ防止
    try {
      _origSet = localStorage.setItem.bind(localStorage);
      _origRemove = localStorage.removeItem.bind(localStorage);
      localStorage.setItem = function (k, v) {
        _origSet(k, v);
        if (typeof k === 'string' && k.indexOf(SSD_PREFIX) === 0) mirrorSet(k, v);
      };
      localStorage.removeItem = function (k) {
        _origRemove(k);
        if (typeof k === 'string' && k.indexOf(SSD_PREFIX) === 0) mirrorRemove(k);
      };
    } catch (e) {}
  }

  function migrateOnce() {
    if (!P.Preferences) return;
    try {
      if (localStorage.getItem(MIGRATED_FLAG)) return;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(SSD_PREFIX) === 0) mirrorSet(k, localStorage.getItem(k));
      }
      localStorage.setItem(MIGRATED_FLAG, '1');
    } catch (e) {}
  }

  function restoreFromPrefs() {
    if (!P.Preferences || !P.Preferences.keys) return;
    try {
      P.Preferences.keys().then(function (res) {
        var keys = (res && res.keys) || [];
        keys.forEach(function (k) {
          if (k.indexOf(SSD_PREFIX) !== 0) return;
          if (localStorage.getItem(k) !== null) return; // localStorage 優先
          P.Preferences.get({ key: k }).then(function (r) {
            if (r && r.value != null) { (_origSet || localStorage.setItem.bind(localStorage))(k, r.value); }
          }).catch(function () {});
        });
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- ネイティブ起動シーケンス -----------------------------------------
  function initNative() {
    if (!isNative) return;
    // ダークテーマ統一
    try {
      if (P.StatusBar) {
        P.StatusBar.setStyle({ style: 'DARK' });
        if (platform === 'android') P.StatusBar.setBackgroundColor({ color: '#070b14' });
      }
    } catch (e) {}
    // 永続化: write-through を先に入れてから復元・移行
    installWriteThrough();
    migrateOnce();
    restoreFromPrefs();
    // スプラッシュを閉じる（描画が落ち着いてから）
    try { if (P.SplashScreen) setTimeout(function () { P.SplashScreen.hide(); }, 300); } catch (e) {}
  }

  // Web でも write-through は入れない（isNative ガード）。native は即時に facade を用意し、
  // Capacitor ランタイム準備後に initNative を走らせる。
  if (isNative) {
    // localStorage ラップは ui.js の書き込みより前に有効化したいので同期で実行
    installWriteThrough();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNative);
    } else {
      initNative();
    }
  }

  // ---- 公開ファサード ---------------------------------------------------
  window.SSD = {
    isNative: isNative,
    platform: platform,   // 'web' | 'ios' | 'android' — タスク6で全イベント共通プロパティに使う
    haptic: haptic,
    share: share,
    plugins: P            // 週次通知(LocalNotifications)等をタスク4で参照
  };
})();
