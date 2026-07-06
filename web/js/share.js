// ══════════════════════════════════════════════════════════
// share.js — 共有ルーティング（フェーズ1 タスク3）
//   共有ポップの3ボタン UI（X / LINE / 画像を保存）＋「その他のアプリで共有」。
//   ui.js より前に読み込むが、中身は関数宣言のみ（即時実行なし）。実際の呼び出しは
//   すべてユーザー操作時＝ui.js 読込後なので、shareMessage/buildShareURL/generateResultCard
//   等（ui.js 定義のグローバル）を実行時に安全に参照できる。
//   ネイティブ機能は window.SSD（native.js）経由でガード。Web は従来どおり。
// ══════════════════════════════════════════════════════════

// ---- 共有URLビルダー --------------------------------------------------
function xIntentUrl(text) {
  return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
}
// LINE公式の共有プラグイン（家族・地域グループへの最重要導線 → X と同格の扱い）
function lineShareUrl(url, text) {
  return 'https://social-plugins.line.me/lineit/share?url=' +
    encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
}
// 外部リンクを開く（Web=新規タブ / ネイティブ=Capacitor が target=_blank を
// システムブラウザへ委譲）
function openShareWindow(u) {
  window.open(u, '_blank', 'noopener');
}

// ---- 結果カード画像の保存/共有 ----------------------------------------
function blobToBase64(blob) {
  return new Promise(function (res, rej) {
    var r = new FileReader();
    r.onloadend = function () { res(String(r.result).split(',')[1]); };
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}
// ネイティブ: Filesystem に書き出してから共有シートへ（画像添付）。
// 未対応（Web / プラグイン欠落）なら false を返して呼び出し側でフォールバック。
async function nativeSaveImage(blob, filename) {
  try {
    var P = (window.SSD && SSD.plugins) || {};
    if (!(window.SSD && SSD.isNative) || !P.Filesystem || !P.Share) return false;
    var base64 = await blobToBase64(blob);
    var w = await P.Filesystem.writeFile({ path: filename, data: base64, directory: 'CACHE' });
    var uri = (w && w.uri) ? w.uri
      : (await P.Filesystem.getUri({ path: filename, directory: 'CACHE' })).uri;
    await P.Share.share({
      files: [uri],
      text: shareMessage() + '\n' + buildShareURL(),
      dialogTitle: tt('画像を共有', 'Share image')
    });
    return true;
  } catch (e) { return false; }
}
// 「画像を保存」ボタンの実体
async function saveResultCardImage() {
  if (window.SSD && SSD.isNative) {
    try {
      var cv = generateResultCard((typeof shareCtx !== 'undefined' && shareCtx) || { kind: 'generic' });
      var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); });
      if (blob && await nativeSaveImage(blob, 'ssd-result-card.png')) return;
    } catch (e) {}
  }
  // Web: 既存フロー（モバイル=共有シートで「画像を保存」/ デスクトップ=PNGダウンロード）
  await shareResultCard();
}

// ---- 3ボタン共有アクション UI -----------------------------------------
// #shareActions（X / LINE / 画像を保存）と #shareCardRow（ヒント・コピー・その他）を描画。
// renderSharePop（ui.js）から呼ばれる。shareCtx / shareMessage / buildShareURL は
// ui.js のグローバル（実行時参照）。
function renderShareActions() {
  var act = document.getElementById('shareActions');
  var row = document.getElementById('shareCardRow');
  if (!act || !row) return;
  act.innerHTML = '';
  row.innerHTML = '';
  var kind = (typeof shareCtx !== 'undefined' && shareCtx && shareCtx.kind) || 'generic';
  var msg = function () { return shareMessage(); };           // 選択テンプレ＋一言＋フッター
  var url = function () { return buildShareURL(); };          // 現在のパラメータ状態を含むURL

  var mk = function (label, fn, cls, container) {
    var b = document.createElement('button');
    b.className = 'sbtn' + (cls ? ' ' + cls : '');
    b.style.marginTop = '0';
    b.innerHTML = label;
    b.onclick = fn;
    (container || act).appendChild(b);
    return b;
  };

  // ── 3ボタン等格: X / LINE / 画像を保存 ──
  mk(tt('𝕏 でポスト', '𝕏 Post'), function () {
    track('share_x', { kind: kind });
    openShareWindow(xIntentUrl(msg() + '\n' + url()));
  }, 'x-btn');

  mk(tt('💬 LINEで送る', '💬 Send via LINE'), function () {
    track('share_line', { kind: kind });
    openShareWindow(lineShareUrl(url(), msg()));
  }, 'line-btn');

  mk(tt('🖼 画像を保存', '🖼 Save image'), async function (ev) {
    track('card_saved', { kind: kind });
    await saveResultCardImage();
  }, 'save-btn');

  // ── 保存画像はそのまま LINE / Instagram に貼れる、というヒント ──
  var hint = document.createElement('div');
  hint.className = 'cs';
  hint.style.cssText = 'margin-top:8px;color:var(--muted);font-size:.56rem;line-height:1.5';
  hint.textContent = tt(
    '💡 保存した画像は、そのまま LINE や Instagram にも貼れます。',
    '💡 The saved image can be pasted straight into LINE or Instagram.'
  );
  row.appendChild(hint);

  // ── リンクをコピー ──
  mk(tt('⎘ リンクをコピー', '⎘ Copy link'), function (ev) {
    copyShareLink(ev.currentTarget);
  }, '', row);

  // ── その他のアプリで共有（OS 共有シート） ──
  if ((window.SSD && SSD.isNative) || navigator.share) {
    mk(tt('⇪ その他のアプリで共有…', '⇪ Share to other apps…'), async function () {
      track('share_other', { kind: kind });
      var text = msg() + '\n' + url();
      if (window.SSD && SSD.isNative) {
        await SSD.share({ text: text, url: url(), dialogTitle: tt('共有', 'Share') });
      } else {
        try { await navigator.share({ text: text }); } catch (e) {}
      }
    }, '', row);
  }
}
