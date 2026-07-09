---
title: "単一HTML・33万文字のシミュレーターを、バンドラなしでCapacitorアプリにした話"
emoji: "🏙️"
type: "tech"
topics: ["capacitor", "javascript", "pwa", "ios", "android"]
published: false
---

> **ドラフト**（MARKETING.md 記事1）。公開前チェック: ①実名・実在地域への言及ゼロ ②アプリURL・リポジトリURLの最終確認 ③Xの投稿と同日に公開。

## 何を作っているか

「社会デバッガー」という教育用シミュレーターを個人開発しています。社会や地域インフラが**どう壊れるか**を、スライダー操作で体験できるWebアプリです（非営利・無料・ブラウザだけで動く）。

- 本体は**単一の `index.html`、約33万文字**。Chart.js + Canvas + PWA + i18n(日英)
- GitHub Pages で公開中。URLを開いて60秒でプリセット1タップ→崩壊が見られる、が売り

この記事は、その33万文字を **バンドラを一切入れずに** モジュール分割し、**Capacitor で iOS/Android アプリ化**したときの設計判断と、実際に踏んだ地雷の記録です。

## 制約: 「Webの挙動を1バイトも変えない」

アプリ化にあたって自分に課した制約は1つです。

> GitHub Pages で動いている既存のWeb版の挙動を変えない。アプリ化はWeb版への**追加**であって、書き換えではない。

理由は単純で、このアプリはすでに公開されていて、URLが共有カードに埋め込まれて拡散していく設計だからです。「アプリ化ついでにビルドパイプラインを刷新」は、退行バグの温床になります。

## 手順1: バンドラなしのモジュール分割

33万文字の単一HTMLを、**古典スクリプト（`<script src>` の逐次読込・グローバルスコープ共有）のまま**分割しました。

```
web/
  index.html      … マークアップ＋起動
  css/app.css
  js/i18n.js      … 辞書
  js/engine.js    … 定数＋純粋計算（DOM/window 非依存）
  js/native.js    … Capacitor ファサード（後述）
  js/share.js     … 共有ルーティング
  js/scenario.js  … 週替わりシナリオ
  js/ui.js        … DOM・チャート・初期化（いちばん大きい）
  js/demo.js      … ?demo=1 のデモ自動再生（通常は no-op）
```

読み込み順は **`i18n → engine → native → share → scenario → ui → demo`** で固定です。後のファイルが前のファイルの関数・定数を実行時に参照するので、この順序が唯一の「暗黙の契約」になります（`<script src>` の逐次読込なので、ユーザーが操作する頃には全部定義済み＝クロスファイル参照は安全）。

ポイントは2つ。

1. **ESM化しない。** `import/export` に書き換えると、読み込み順・スコープ・`this` の意味が一斉に変わり、33万文字ぶんの暗黙の依存が全部リスクになる。分割後のファイルを連結すると**元のHTMLとバイト一致**する状態をゴールにした（唯一の例外は変数1つの移動）。
2. **`engine.js` だけは DOM/window 非依存の純粋計算に隔離。** これで Node の `node:test` でそのままユニットテストでき、将来サーバー側（Lambda等）で再利用もできる。「エンジンがDOMに触れていないこと」自体をテストで固定している：

```js
test('engine.js and i18n.js stay DOM/window-free', () => {
  const src = fs.readFileSync('web/js/engine.js', 'utf8');
  assert.ok(!/document\.|window\./.test(src));
});
```

## 手順2: Capacitor は「ファサード1枚」だけ触らせる

Capacitor 8 を `webDir: "web"` でそのまま被せました。ビルドステップはありません。ネイティブAPIへのアクセスは **`native.js` の `window.SSD` ファサードに全部集約**し、UI側は必ずガード付きで呼びます。

```js
// native.js — Webでは完全 no-op になるファサード
window.SSD = {
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),          // 'web' | 'ios' | 'android'
  haptic(style) { if (this.isNative) Haptics.impact({ style }); },
  share(opts)  { return Share.share(opts); },
  // …
};

// ui.js 側は常にガード
if (window.SSD && SSD.isNative) SSD.haptic('MEDIUM');
```

この構造のおかげで:

- **Web（GitHub Pages）では全ネイティブコードが no-op** → 既存挙動不変の制約を満たす
- 週替わりシナリオなどネイティブ専用機能は `WEEKLY_ENABLED`（= ネイティブ判定）で出し分け。コードは消さない
- プラグインが欠けても `try/catch + フォールバック` でWeb動作に落ちる

### localStorage と Preferences の二重化

ネイティブの WebView は OS の都合で localStorage が消えることがあります。そこで `@capacitor/preferences` を**耐久ミラー**にしました。

- localStorage を**同期のソース・オブ・トゥルース**のまま維持（既存コードは書き換えない）
- 書き込みだけ write-through で Preferences にも複製
- 起動時、localStorage が空で Preferences にデータがあれば復元（一度だけ移行）

「既存コードのストレージ呼び出しを非同期APIに書き換える」選択肢は最初に捨てました。同期→非同期の書き換えは33万文字アプリでは事故率が高すぎます。

## 実際に踏んだ地雷（退行バグ3連発）

アプリ化と並行した堅牢化で、実際に3つの退行を出しました。全部「見た目確認では気づけない」タイプです。

1. **ブロックで包んだらスコープが死んだ**: 既存コードを `if(chart){ … }` で包んだら、中で定義していた `const avg` がブロックスコープに閉じ込められ、外の後続コードが `avg is not defined` で死んだ。
2. **存在しない関数を呼んだ**: 新機能が `saveDiscoveries()` を呼んでいたが、実在するのは `discover()` だった。
3. **`onerror` 属性の時序バグ**: `<script onerror="handler()">` は handler の定義前に発火し得る。属性側はフラグを立てるだけにして、スクリプト側で拾うのが正解。

この反省から、**Console エラーゼロ確認を Playwright で自動化**しました（`make verify`）。Chart.js が正常な場合と CDN がブロックされた場合の両方で、全タブ遷移・プリセット・スライダー操作（さらに P2 ショック注入・エクスポート生成まで）を行い、`pageerror`/`console.error` がゼロであることを検証します。「インラインの `onclick` が全部実在の関数に解決すること」も静的テストにしました（地雷2の再発防止）。ローカルの `npm run check`（ユニット/ガードレールテスト＋週次JSON検証＋eslint＋prettier）を CI の web ジョブがそのまま実行するので、ローカルで通ればCIでも通る、という一致を保っています。

## 結果

- Web版: URL・挙動とも従来どおり（Pages でそのまま配信継続。この記事執筆時点でもライブ）
- アプリ版: 同じコードベースから iOS/Android が出る**構成**が用意できた。週替わりシナリオ・ローカル通知・触覚・共有シートだけがネイティブで追加される設計
- バンドラ・トランスパイラ・フレームワーク: **導入ゼロ**。ビルドは `npx cap sync` だけ

正直に書くと、**実機（Xcode / Android Studio）でのビルド・審査提出はこの記事執筆時点では未実施**で、`ios/`・`android/` は `.gitignore`（`npx cap add` で再生成）に置いたまま、Preferences 耐久ミラーや `isNative` ガードといった「ネイティブ側の設計と Web 無影響」の担保を先に固めた段階です。実機・ストア審査の話は次の記事に回します。

「33万文字の単一HTML」は一般には技術的負債ですが、**負債の返済（フレームワーク移行）とアプリ化を同時にやらない**、と決めたのがいちばん効いた判断でした。

---

アプリはこちら（無料・ブラウザで60秒で試せます）: https://larai-w.github.io/social-system-debugger/

※アプリは架空のシミュレーションです。特定の誰かではなく、どの社会にも起こる構造の話を扱っています。
