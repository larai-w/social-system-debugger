# 開発ガイド / Development

> **[日本語](DEVELOPMENT.md)**（このページ）｜**[English](DEVELOPMENT.en.md)**

「社会＆地域インフラ・デバッガー」に手を入れる人（未来の自分・協力者）向けの実務メモ。モデルの数式は [`METHODOLOGY.md`](METHODOLOGY.md)、変更履歴は [`../CHANGELOG.md`](../CHANGELOG.md) を参照。

---

## アーキテクチャ概要

- **フロントは `web/` 配下にモジュール分割**（フェーズ1で単一 `index.html` から分離）。**バンドラなし**＝古典的 `<script>` を順に読み込むだけで、全スクリプトが**グローバルスコープを共有**する（`type="module"` にはしていない＝インラインの `onclick=` 等がそのまま動く）。ビルド不要。
- **読み込み順（重要）**: `i18n → engine → native → share → scenario → ui → demo`。この順で、後のファイルが前のファイルの関数/定数を実行時に参照できる。
- `engine.js` は **DOM/window 非依存の純粋計算層**（`metrics` 等）。将来のサーバー側検証やユニットテストに再利用するため、`document`/`window` に触れない。
- ネイティブ機能（Capacitor）は `native.js` の `window.SSD` ファサードに集約し、すべて `SSD.isNative` でガード → **Web は完全 no-op**。
- 外部依存（実行時）は **Chart.js v4（CDN）** のみ。エージェント表現は素の Canvas。
- **PWA**: `web/manifest.json` / `web/icon.svg` / `web/sw.js`。
- **配信**: GitHub Pages（`web/` を公開・現行URL維持）＋ AWS S3/CloudFront（`/infra` の CDK、本命）。

```
social-system-debugger/
├── web/                     # フロント資産（Capacitor webDir 兼 配信元）
│   ├── index.html           #   マークアップ＋起動（外部css/jsを読込）
│   ├── css/app.css          #   スタイル
│   └── js/
│       ├── i18n.js          #   I18N辞書（DOM非依存）
│       ├── engine.js        #   純粋計算・モデル状態（DOM/window 非依存）
│       ├── native.js        #   Capacitor 橋渡し（window.SSD / 全て isNative ガード）
│       ├── share.js         #   共有ルーティング（X/LINE/画像保存）
│       ├── scenario.js      #   週替わりシナリオ（宣言的 goalConds / fetch / 通知）
│       ├── ui.js            #   DOM・チャート・P1〜P4・発見・init（最大）
│       └── demo.js          #   ?demo=1 のデモモード（本物のエンジンを自動操作。既定 no-op）
│   ├── manifest.json / icon.svg / sw.js
│   ├── classroom.html / .en.html   # 教員向け1枚ガイド（自己完結・印刷でA4）
│   ├── classroom-slides.html / .en.html # 授業用 投影スライド（自己完結・9枚・JS無効でも縦に読める）
│   └── privacy.html / .en.html     # プライバシーポリシー（ストア提出／フッター導線）
├── content/weekly/          # 週替わりシナリオJSON（*.json + latest.json）＋ weekly.schema.json
├── infra/                   # AWS CDK (TypeScript): S3(OAC)+CloudFront＋GitHub OIDCロール
├── promo/                   # プロモリールHTML（?lang=en 対応。make reels で自動録画）
├── tests/                   # ユニット/ガードレール（engine / goal / share / invariants / weekly-reachability）
├── scripts/                 # validate-weekly / verify / record-reel / gen-icons / gen-og-image 等
├── capacitor.config.json    # appId / webDir=web / プラグイン設定
├── package.json             # Capacitor 依存 ＋ ルートスクリプト（test / check / verify / reels / gen:icons …）
├── Makefile                 # 全操作の単一入口（make help で一覧）
├── README.md / .en.md       # 概要（日 / 英）
├── CHANGELOG.md
├── docs/                    # METHODOLOGY / DEVELOPMENT（本ファイル） / DATA-DICTIONARY（エクスポート項目）
└── .github/workflows/       # ci.yml / deploy.yml(Pages) / deploy-aws.yml(OIDC) / weekly-rotate.yml
```

---

## コードの地図（どのファイルに何があるか）

| 領域 | ファイル | 主な関数・変数 | 役割 |
|---|---|---|---|
| **多言語 (i18n)** | `i18n.js`(辞書) / `engine.js`(`t`,`tt`) / `ui.js`(`applyI18n`) | `I18N={ja,en}`, `t(id)`, `tt(ja,en)`, `applyI18n()`, `applyI18nAuto()` | `t()`は手動キー、`tt()`はJSインライン、`data-i18n`属性は `applyI18nAuto()` |
| **純粋計算** | `engine.js` | `metrics(fr,es,al)`, `simTimeline()`, `clamp/lerp/seedRng/genScatter`, `HIST_REF/PRESETS/MDATA` | **DOM/window非依存**。テスト対象（`tests/engine.test.mjs`） |
| **L1 情報空間** | `ui.js` | `updateAll()`, `startAgents()`, `startScatter()`, `getModeCollapseLog()` | 過学習・モード崩壊ログ・アニメ |
| **L2 物理インフラ** | `ui.js` | `metricsP2()`, `calcRedundancyBuffer()`, `updateAllP2()`, `injectSystemShock()` | 冗長性・デッドロック・ショック |
| **L3 個人の認知** | `ui.js` | `stepP3()/drawP3()/updateP3Monitor()`, `executeDropout()/executeEarlyStopping()` | ノードシム・毒入れ・回復 |
| **L4 当事者性** | `ui.js` | `drawP4()/updateP4Monitor()`, `executePacketFiltering()` | Sybilフラッド・ドロップ率 |
| **判定バナー** | `ui.js` | `setVerdictBanner(alertId, state, key)`（`crash`/`warn`/`good`/`''`） | 3段階バナー。crash遷移で触覚＋`weekly_fail` |
| **発見ログ** | `ui.js` | `DISCOVERIES[]`, `discover(id)`, `noteSessionPage()`, `notePreset()` | `localStorage['ssd_discoveries']`。`sce_*` は週次(native)のみ到達 |
| **共有** | `share.js`(ルーティング) / `ui.js`(カード生成) | `renderShareActions()`, `xIntentUrl/lineShareUrl`, `generateResultCard()`, `shareWithEtiquette()` | X/LINE/画像保存の3ボタン＋その他。再現URL・結果カードPNG |
| **ネイティブ** | `native.js` | `window.SSD`(`isNative/platform/haptic/share/plugins`) | Capacitor 橋渡し。全て `isNative` ガード＝Web no-op |
| **週替わりシナリオ** | `scenario.js` | `SCENARIOS[]`, `getActiveScenario()`, `evalGoalConds()`, `checkScenarioGoal()`, `loadRemoteScenario()` | 宣言的 `goalConds`・fetch(latest.json)＋フォールバック・通知。全て `WEEKLY_ENABLED`(native)ガード |
| **計測** | `ui.js`(`track`) | `track(event, props)`（共通prop `app_platform` 付与） | Plausible。イベント一覧は README「計測」節 |
| **フィードバック** | `ui.js` | `FEEDBACK_ENDPOINT`, `openFeedback()`, `submitFeedback()` | Formspree へ JSON POST |
| **ナビ/初期化** | `ui.js` | `switchTab(n)`, `openAppPage(name)`, `(function init(){…})()` | タブ切替＋アドレスバー同期、起動処理。`openAppPage('classroom'/'privacy')` は ≡メニューから静的ページを別タブで開く（EN時は `.en.html`・`track('open_*')`） |
| **デモモード** | `demo.js` | `?demo=1` 判定＋ゴーストカーソル | 本物のエンジンを自動操作（値の偽装なし）。プロモ録画/展示用。既定は完全 no-op |
| **PWA** | `web/sw.js` | `CACHE`（更新の度に版を上げる）, `CORE[]` | インストール・オフライン。CORE に全js/cssを列挙 |

各レイヤーは「**ユーザー操作 → `metrics*` で計算 → `updateAll*` でゲージ/バナー/ログ更新**」という共通構造。P1/P2 は操作時、P3/P4 は requestAnimationFrame ループで毎フレーム更新。

> **新しい関数を足すときの注意**: 全ファイルは古典スクリプトでグローバル共有。マークアップの `onclick="foo()"` から呼ぶ関数は必ずどこかのjsで `function foo(){…}` として定義する。あるファイルの関数が別ファイルの関数を呼ぶのは実行時なら安全（読み込み順に関係なくユーザー操作時には全て定義済み）。ただし**トップレベルの即時実行**が未読み込みの関数/定数を参照するとエラーになる。

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
1. `ui.js` の `DISCOVERIES` に `{id, badge:()=>tt(...), learn:()=>tt(...)}` を1件追加。
2. 条件を満たす箇所（`updateAll*` / `setPreset*` / アクション関数）で `discover('id')` を呼ぶ。
3. カウンタ（`(x/N)`）は `DISCOVERIES.length` から自動計算。**禁止**: ストリーク・通知・時間制限・不安を煽る文言（アプリの批判テーマと矛盾するため）。
- 注: `sce_` 始まりの発見は週替わり用で、`WEEKLY_ENABLED`（native）でのみ到達・カウント対象。

### 週替わりシナリオを追加する（人間の作業は「JSONを1枚書く」だけ）
1. `content/weekly/2026-Wxx.json` を作成。スキーマは `content/weekly.schema.json`（必須: `id/title/intro/page/params/goal/goalConds/difficulty/discoveryId`、`title/intro/goal` は ja/en 両方）。
2. **ゴールは宣言的**に：`goalConds: [{ "metric": "diversity", "op": ">=", "value": 80 }, …]`（AND結合）。`metric` は `metrics*` の返り値キー（`diversity/entropy/legitimacy/brand/redundancy/infra/integrity/ratio/drop` など）＋パラメータ（`ethicsScore/skillStock/searchDepth` 等）。判定は `scenario.js` の `evalGoalConds()` が評価。
3. **`latest.json` の差し替えは自動**：`weekly-rotate.yml` が毎週月曜 0:00 JST にその週の `2026-Wxx.json` を `latest.json` へコピー＆コミットし、Pages/AWS デプロイまで起動する。**人間の作業は「その週のJSONを1枚追加して PR する」だけ**（アプリは起動時に `latest.json` を fetch。`scenario.js` の `CONTENT_BASE_URL` が配信元）。在庫が無い週はローテが失敗して「書き足して」というリマインダーになる。
4. ローカル検証: `npm run validate:weekly`（ja/en 欠けやopの不正を弾く）＋ `npm test`（`weekly-reachability.test.mjs` が **goalConds の metric 名の実在＝クリア可能性**を自動検証。タイポで誰もクリアできないシナリオを CI で弾く）。
5. PR → main マージで `deploy-aws.yml` が S3 反映＋`latest.json` 無効化まで自動。
- **禁止**: 実在の特定の国・自治体・人物の名指し（エチケット方針）。既存プリセットの変奏で抽象的に。

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

- `.github/workflows/ci.yml`（PR時）: web ジョブは `npm ci` → **`npm run check`**（ローカルと完全一致＝ユニット/ガードレールテスト＋週次JSONスキーマ検証＋eslint＋prettier）。infra ジョブは `cdk synth`（cdk-nag込み）。
- `.github/workflows/deploy.yml`（main push）: **GitHub Pages に自動デプロイ**（`actions/deploy-pages`。公開元は `web/`）。
- `.github/workflows/deploy-aws.yml`（main push / web・content 変更時）: **AWS OIDC でロールをAssume** → `web/`+`content/` を S3 同期 → `latest.json`+`index.html` のみ CloudFront 無効化。長期キーは保存しない。
- `.github/workflows/weekly-rotate.yml`（毎週月曜 0:00 JST / 手動可）: その週の `content/weekly/<ISO週>.json` を `latest.json` へコピー＆コミット → Pages/AWS デプロイを `workflow_dispatch` で起動。在庫切れの週は失敗して通知（＝シナリオ追加のリマインダー）。
- 公開URL（不変）: https://larai-w.github.io/social-system-debugger/ ／ AWS は CloudFront ドメイン（`infra` の出力）。
- AWSインフラの定義・デプロイ手順・OIDC/最小権限の説明は [`../infra/README.md`](../infra/README.md)。
- **Pages が「Deployment failed, try again later.」で落ちたら**、GitHub Pages バックエンドの一時障害。少し待って Actions から **Re-run failed jobs** か再 push。稼働は https://www.githubstatus.com。

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
npm run serve              # → http://localhost:8000 （http で開く。file:// は PWA/fetch が動かない）
```

- **必ず http:// で開く**（`file://` は manifest・Service Worker・`fetch()` が CORS/オリジン制約で動かない）。
- 構文チェック: `node --check web/js/xxx.js`。
- **操作は `make help` に一覧**（人間 / Claude Code / Codex 共通の単一入口）。主なもの:
  ```bash
  make check       # CIと同じ（テスト＋週次JSON検証＋eslint＋prettier）＝ npm run check
  make verify      # ★完了ごとの必須チェックの自動化（下記）
  make reels       # プロモリールを自動録画（dist/reels/ へ webm、ffmpegがあれば mp4 も）
  make gen-icons   # ストア用アイコン/スプラッシュを resources/ に生成
  make synth       # cdk synth（cdk-nag セキュリティ検査込み・AWS不要）
  ```
- **★「完了ごとの必須チェック」の自動化 = `make verify`**（`scripts/verify.mjs`。Playwright）: CLAUDE.md の手動チェック（Console エラーゼロ・4タブ遷移・プリセット・スライダー・Chart.js 失敗時のグレースフルデグラデーション）を **Chart.js 正常時／CDN遮断時の2ケース**で自動再生し、Console/pageerror がゼロであることを検証する。手で毎回ブラウザを触る代わりにこれを回す（初回のみ `npx playwright install chromium`）。
- **PWA/SW のキャッシュで古いJSが出たら**（デプロイ直後や分割変更後に起きやすい）: DevTools → Application → Service Workers → **Bypass for network** にチェック（開発中はこれが楽）／または Unregister → ハード再読み込み／シークレットウィンドウ。`sw.js` は cache-first なので、CORE を変えたら `CACHE` の版番号（`ssd-cache-v6-xxx`）を必ず上げること。

### ネイティブ（Capacitor）
- `npm install` → `npx cap add ios/android` → `npx cap sync` → `npx cap open ios`（Xcode）/`android`（Android Studio）。詳細は [`../README.md`](../README.md) の「ネイティブアプリ」節。
- Web を触ったら `npx cap sync` で各プラットフォームへ反映。

---

*対応バージョン: v6.346 / フェーズ1（モジュール分割・Capacitor・週替わり・AWS配信・CI-CD）完了*
