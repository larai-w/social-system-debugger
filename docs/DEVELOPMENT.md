# 開発ガイド / Development

> **[日本語](DEVELOPMENT.md)**（このページ）｜**[English](DEVELOPMENT.en.md)**

「社会＆地域インフラ・デバッガー」に手を入れる人（未来の自分・協力者）向けの実務メモ。モデルの数式は [`METHODOLOGY.md`](METHODOLOGY.md)、変更履歴は [`../CHANGELOG.md`](../CHANGELOG.md) を参照。

---

## アーキテクチャ概要

- **単一HTMLファイル構成**: ロジック・スタイル・マークアップはすべて `index.html` に入っている（`<style>` + HTML + 1つの大きな `<script>`）。**ビルド不要**、`index.html` をブラウザで開くだけで動く。
- 外部依存は **Chart.js v4（CDN）** のみ。エージェント表現は素の Canvas。
- **PWA**: `manifest.json` / `icon.svg` / `sw.js`（Service Worker）。
- **ドキュメント**: `README.md` / `README.en.md`（トップ）、`docs/`（本ガイド・方法論）、`CHANGELOG.md`。

```
social-system-debugger/
├── index.html            # 本体（唯一のアプリファイル）
├── manifest.json         # PWA メタデータ
├── sw.js                 # Service Worker（network-first）
├── icon.svg              # アプリアイコン
├── README.md / .en.md    # 概要（日 / 英）
├── CHANGELOG.md          # 変更履歴
├── docs/
│   ├── METHODOLOGY.md    # 数式・しきい値・限界
│   └── DEVELOPMENT.md    # 本ファイル
└── .github/workflows/    # ci.yml / deploy.yml
```

---

## コードの地図（`index.html` 内の主な部品）

| 領域 | 主な関数・変数 | 役割 |
|---|---|---|
| **多言語 (i18n)** | `I18N = {ja, en}`, `t(id)`, `tt(ja,en)`, `applyI18n()`, `applyI18nAuto()` | `t()`は手動リストのキー、`tt()`はJSインライン、`data-i18n`属性は `applyI18nAuto()` が処理 |
| **L1 情報空間** | `metrics(fr,es,al)`, `updateAll()`, `startAgents()`, `startScatter()`, `getModeCollapseLog()` | 過学習・モード崩壊ログ・エージェント/散布アニメ |
| **L2 物理インフラ** | `metricsP2()`, `calcRedundancyBuffer()`, `updateAllP2()`, `injectSystemShock()` | 冗長性・デッドロック・ショック・タイムラインチャート |
| **L3 個人の認知** | `stepP3()`/`drawP3()`/`updateP3Monitor()`, `p3Fooling()`, `executeDropout()`/`executeEarlyStopping()` | ノードシミュレーション・毒入れ・回復 |
| **L4 当事者性** | `manageSpam()`/`drawP4()`/`updateP4Monitor()`, `executePacketFiltering()` | Sybilフラッド・ドロップ率・当事者比率 |
| **判定バナー** | `setVerdictBanner(alertId, state, key)`（state = `crash`/`warn`/`good`/`''`） | 各ページ共通の3段階バナー。`.at`（大見出し）の `data-i18n` を付け替える |
| **DOM状態ガード** | `setText/setColor/setClassOn/setDisp` | 毎フレーム呼ばれるモニターで「変化時だけ書き込む」＝フリッカー防止 |
| **発見ログ** | `DISCOVERIES[]`, `discover(id)`, `noteSessionPage()`, `notePreset()`, `openDiscoveryLog()` | 収集型ゲーミフィケーション。`localStorage['ssd_discoveries']` |
| **共有** | `buildShareURL()`, `shareScenario()`, `generateResultCard()`, `generateEtiquetteCard()`, `shareWithEtiquette()` | 再現URL・結果カードPNG・作法カード同送 |
| **フィードバック** | `FEEDBACK_ENDPOINT`, `openFeedback()`, `submitFeedback()`, `researcherMode`/`setResearcherMode()` | Formspree へ JSON POST。GitHub Issues 導線 |
| **ナビ/初期化** | `switchTab(n)`, `(function init(){…})()` | タブ切替＋アドレスバー同期、起動処理 |
| **PWA** | `sw.js`（別ファイル）＋末尾の `serviceWorker.register` | インストール・オフライン |

各レイヤーは「**ユーザー操作 → `metrics*` で計算 → `updateAll*` でゲージ/バナー/ログ更新**」という共通構造。P1/P2 は操作時、P3/P4 は requestAnimationFrame ループで毎フレーム更新。

---

## よくある変更の手順

### プリセットを追加する
1. `PRESETS`（P1）/ `PRESETS_P2` / `PRESETS_P3` / `PRESETS_P4` にキーと値を追加。
2. プリセットバーに `<button class="pbtn" id="pN-キー" onclick="setPresetPN('キー')" data-i18n="キー">日本語ラベル</button>` を追加（**並びは危機→模範＝赤→緑**で統一）。
3. `I18N.en` に英語ラベルを追加。
4. 発見と紐づけるなら `setPresetPN` 内で `notePreset(page, id)` / `discover('d_pN_...')`。

### 数式・しきい値を調整する
- 対応する `metrics()` / `metricsP2()` / `updateP3Monitor()` / `updateP4Monitor()` を編集。**変更したら [`METHODOLOGY.md`](METHODOLOGY.md) も更新**（数式ドキュメントが実装とずれないように）。

### バナーの状態・文言を変える
- 判定は各 `updateAll*` の分岐（`crash`/`warn`/`good`）で決定 → `setVerdictBanner('alertBannerPn', state, 'banner_pn_xxx')`。
- 大見出しは `I18N` の `banner_pn_*` キー（日本語はインライン or 明示、英語は `I18N.en`）。詳細（`.am`）は `setText(...)` でJS側から。
- **P3/P4 のバナーはパラメータ即時判定**（`searchDepth`/`learningRate`, `gamification`/`extTraffic`）＝ボタン押下に安定追従する設計（v6.338）。

### 発見（Discovery）を追加する
1. `DISCOVERIES` に `{id, badge:()=>tt(...), learn:()=>tt(...)}` を1件追加。
2. 条件を満たす箇所（`updateAll*` / `setPreset*` / アクション関数）で `discover('id')` を呼ぶ。
3. カウンタ（`(x/N)`）は `DISCOVERIES.length` から自動計算。**禁止**: ストリーク・通知・時間制限・不安を煽る文言（アプリの批判テーマと矛盾するため）。

### i18n（多言語）
- **切替方式（Page1流）**: 要素に `data-i18n="key"`、日本語をインラインに置く（`applyI18nAuto` が ja をキャッシュ）＋ `I18N.en.key` に英語。→ 日本語版=日本語のみ／英語版=英語のみ。
- **二言語併記**: 「日本語 ENGLISH」をそのまま書く（ゲージ見出しなど）。
- 動的文字列は `tt('日本語','English')`。チャートのデータセット名は静的に二言語併記でOK（言語切替で上書きしない）。

---

## バージョン方針

- **0.001 刻み**で進める（v6.342 → v6.343 …）。メジャーは上げない（明示指定時のみ）。
- **タイトル表記は小数点なしの "v6"**（`<title>` / `og:title` / `<h1 id="mainTitle">`）。
- **精密版（v6.34x）を表示するのは**: フッター `#footerTxt`（日本語インライン＋`I18N.en.footerTxt`）、`generateResultCard()`、`generateEtiquetteCard()` のアプリ名行、README（日英）タイトル。
- コード内コメントの `v6.x:` は機能追加の履歴マーカー（書き換えない）。
- **コミットメッセージは英語**（GitHub Actions の実行名が英語になるように）。

---

## デプロイ（CI/CD）

- `.github/workflows/ci.yml`: `main` への PR で軽量チェック。
- `.github/workflows/deploy.yml`: **`main` への push で GitHub Pages に自動デプロイ**（`actions/deploy-pages`）。
- 公開URL: https://larai-w.github.io/social-system-debugger/
- **デプロイが「Deployment failed, try again later.」で落ちたら**、それは GitHub Pages バックエンドの一時障害。対処は「少し待って Actions タブから **Re-run failed jobs**」または再 push（内容は同じでも再デプロイされる）。GitHub全体の稼働は https://www.githubstatus.com で確認。

---

## 運用上の注意（重要）

- **iCloud/Dropbox 同期フォルダに置かない**（`~/Documents` は iCloud 同期下のことが多い）。同期サービスが **`.git` 内部の競合コピー**（`main 2`, `HEAD 2`, `index 2` 等）を作り、`fatal: bad object` で git が壊れる／編集が巻き戻る／push が失敗したように見える、という不具合が起きる。
  - 起きたら: `.git` 配下の `* 2`（末尾が「スペース+数字」）ファイルを削除すれば復旧する。
  - 恒久策: リポジトリを非同期フォルダ（例 `~/dev/…`）へ置く。

---

## ローカル開発

```bash
git clone https://github.com/larai-w/social-system-debugger.git
cd social-system-debugger
open index.html            # ブラウザで開くだけ（ビルド不要）
# 変更の確認は保存 → リロード
```

- 構文の簡易チェック（Node）: `<script>` を抽出して `new vm.Script(...)` に通すと HTML内JSのパースエラーを検出できる。
- PWA/SW のキャッシュで古い版が出たら、ブラウザの「Service Worker を更新」または DevTools → Application → Service Workers → Update/Unregister。

---

*対応バージョン: v6.342*
