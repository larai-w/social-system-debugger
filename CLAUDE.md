# CLAUDE.md — 社会デバッガー プロジェクト文脈

> このファイルは Claude Code がセッション開始時に自動で読み込む。
> 新しいセッションでも、これを読めば「何を作っていて・どこまで進んで・次に何をするか」が分かるようにしておく。
> **重要な作業が終わるたびに、このファイルの「進捗ログ」と「次のタスク」を更新すること。**

## このプロジェクトは何か

社会や地域インフラが「どう壊れるか」を、パラメータ操作で体験できる教育用シミュレーター。
一般ユーザーと研究者が想定ユーザー。収益化はしない。多くのユーザーに使われた実績を、
クラウドエンジニア就活・CS博士課程出願の資料にすることが目的。

- 現在の本体: 単一ファイル `index.html`（約33万文字）。Chart.js + Canvas + レスポンシブ + PWA + i18n(日英)。
- プロダクト名: 「社会デバッガー」／タグライン「あなたの街は、生き残れるか。」
- 4ページ構成: PAGE 1 情報空間 / PAGE 2 地域インフラ / PAGE 3 認知リカバリー / PAGE 4 ステークホルダー非対称性。

## 絶対に守る制約（integrity）

1. **見た目を変えない。** ダーク・ターミナル調（`--bg0:#070b14` / シアン発光 / 等幅フォント）。やわらかくするのは言葉だけ、色や質感ではない。
2. **i18n を壊さない。** 新規のユーザー向け文字列は必ず ja / en 両方の辞書に追加し `applyI18n` に乗せる。
3. **倫理方針。** 「特定の誰かではなく、どの社会にも起こる構造の話」。実在の地名・人名・進行中の政局は、批判でも称賛でも UI に出さない。抽象型（H型/T型 等）で語る。
4. **段階実装。** 一度に1タスク。着手前に宣言し、完了後に差分要点を報告。可能なら git commit を挟む。
5. **ゼロから書き直さない。** 既存の関数・変数・構造を尊重し差分を最小化する。

## 開発ツールの方針（重要）

- **コーディングは Claude Code に一本化する。** モデルは Sonnet か Opus を使う。**Haiku は使わない**（この規模の複雑な改修には力不足で、退行バグの原因になる）。
- GitHub Copilot など他ツールへの乗り換えはしない。ツールをまたぐと文脈が切れ、退行が生まれやすい。
- claude.ai（ブラウザのClaude）で設計・レビューの相談 → 出てきたプロンプトを **ターミナルの Claude Code に貼る**、という役割分担。プロンプトは Copilot ではなく Claude Code に入れる。

## 完了ごとの必須チェック（退行防止）

作業完了を報告する前に、必ず次を実行して結果を報告に含めること:
1. ブラウザでページを開き、**Console にエラーが1件もない**ことを確認する。
2. 全4タブの遷移・プリセットを1つ・スライダー操作を実際に行い、エラーゼロを確認する。
3. Chart.js が読み込めない状況（CDNブロック等）でも、スライダー・タブ・共有など他機能が動くこと（グレースフル・デグラデーション）を確認する。

（過去に、堅牢化修正の最中に `avg` のスコープを壊す・未定義関数を呼ぶ等の退行が発生した。見た目確認だけでは見抜けないので Console 確認は毎回必須。）

## 進捗ログ（新しいものを上に追記）

- ✅ フェーズ1 タスク1（リポジトリ再構成・モジュール分割）: 単一 `index.html` を `/web` 配下へ分割。`web/index.html`（マークアップ＋起動）／`web/css/app.css`／`web/js/i18n.js`（辞書）／`web/js/engine.js`（HIST_REF/PRESETS/MDATA＋モデル状態＋純粋計算。**DOM/window非依存**＝将来サーバー再利用可）／`web/js/ui.js`（DOM・チャート・P2〜P4・共有・図鑑・週次・init）。**古典スクリプトのままグローバルスコープ共有で挙動不変**（連結すると元とバイト一致。唯一 `WEEKLY_ENABLED` だけ engine→ui へ安全に移動）。`manifest.json`/`sw.js`/`icon.svg` も `/web` へ移動、`sw.js` CORE に css/js 追加（cache名 v6-347）。`deploy.yml` は成果物パスを `web/` に変更＝**GitHub Pages のURLは不変**。`ci.yml` は `web/index.html` を参照。share.js/scenario.js/discovery.js の切り出しはタスク3/4で実施予定。
- ✅ PAGE 2 モデル検証（要ユーザー確認）: ユーザーが「確認済み」と回答。DX0固定→skillStock枯渇→ブランド崖→HELI:SUSPENDED の連鎖は動作するものとして確定。
- ✅ Web版UX改修（プロンプト1）: プロダクト名「社会デバッガー」、二人称バナー、街の命名(`ssd_town_name`)、共有前の一言、PAGE 1 巻き戻し、計測ラッパー `track()`、ヘッダー整理（左 EN/GUIDE、右 フィードバック/SHARE/≡メニュー、発見ログは初発見後に出現）、週替わりシナリオは `WEEKLY_ENABLED`(ネイティブ判定)でWeb非表示。
- ✅ PAGE 2 モデル改修（プロンプト1.5）: ブランドの閉ループ化（brand→財政→インフラ→ヘリ）、後継者ストック `skillStock`(遅い状態変数・崖・手遅れ閾値)、ヘリ3状態(OPERATIONAL/WEATHER HOLD/SUSPENDED)。
- ✅ 退行バグ修正: (1)`updateAll` の `avg` をブロック外へ (2)`checkScenarioGoal` の未定義 `saveDiscoveries/unlock` を `discover()` に置換＋Web版早期リターン (3)Chart.js `onerror` を定義前関数呼び出しからフラグ方式へ。

## 次のタスク（フェーズ1・タスクごとに一旦停止して報告する運用）

- 決定事項（このセッションで確定）: 配信は「**GitHub Pages 維持＋AWS 追加**」（今のURLは常に不変）。進め方は「**タスクごとに一旦停止**」。応答は日本語。
- ✅ タスク1（モジュール分割）完了。
2. **タスク2 Capacitor 導入（次）**: `npm init` → Capacitor、`webDir=web`、iOS/Android 追加。appId 例 `dev.socialdebugger.app`。プラグイン: share / preferences（ssd_* を localStorage から移行・二重移行フラグ）/ local-notifications / haptics / status-bar / splash-screen。すべて `Capacitor.isNativePlatform()` でガードし **Web版はlocalStorage継続でフル機能**。README にビルド手順。
3. タスク3 共有経路（X / LINE / 画像保存 の3ボタン＋その他共有）。track に share_x/share_line/card_saved。share.js を ui.js から切り出す。
4. タスク4 週替わりシナリオ（静的JSON配信 `/content/weekly/*.json`＋latest.json）。scenario.js 新規。**注意: ハードコードの `SCENARIOS` の `check` 関数はJSON化不可 → 宣言的条件配列(metric/op/value)へ変換**。通知は初回クリア直後に許可要求。サンプル3週分。
5. タスク5 AWS 配信基盤（CDK/TS, `/infra`）: S3(非公開/OAC)+CloudFront。README に構成図・選定理由・「Dockerを使わない理由(静的配信＋サーバーレスで常駐なし)」。cdk synth 通過まで（deployはユーザー）。
6. タスク6 計測拡充（weekly_*/share_*/card_saved/notification_optin、共通プロパティ app_platform）。
7. タスク7 CI/CD（GitHub Actions + AWS OIDC、最小権限、engine.js のユニットテスト、週次JSONのスキーマ検証）。

## 保留中（条件を満たすまで着手しない）

- フェーズ2: 共同カウンター(累積で守られた街の数)、週替わりの守り人署名、リモートプッシュ(APNs/FCM)、AWS拡張(API Gateway+Lambda+DynamoDB)。
- SWAP THE LEADER 先行版 / PAGE 5「比較OS診断」フル実装。発動条件は別ノート `design-note-page5.md` に凍結済み（実名ゼロ・構造で語る・週替わりシナリオで小出しに検証してから）。
