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

- ✅ フェーズ1 タスク3（共有経路 X/LINE/画像保存）: `web/js/share.js` を新規（読込順 i18n→engine→native→share→ui）。共有ポップの単一「共有…」ボタンを **3ボタン等格（𝕏 / LINE / 画像を保存）＋ 下に「その他のアプリで共有」** に再設計。LINE は `social-plugins.line.me/lineit/share` で X と同格。画像保存=Webは既存 `shareResultCard`（モバイル共有シート/デスクトップDL）、ネイティブは `@capacitor/filesystem` で書出し→`@capacitor/share`（全て `SSD.isNative` ガード、失敗時Webへフォールバック）。`track('share_x'/'share_line'/'card_saved'/'share_other')`。`renderSharePop` はアクション部を `renderShareActions()` に委譲。CSS `.line-btn/.save-btn`、sw cache v6-349。動的文言は `tt(ja,en)` インライン。
- ✅ フェーズ1 タスク2（Capacitor 導入 / iOS・Android）: バンドラなしで既存Webをネイティブ化。`package.json`＋`capacitor.config.json`（appId プレースホルダ `dev.socialdebugger.app`, `webDir=web`）、Capacitor 8系プラグイン一式。`web/js/native.js`（`window.SSD` ファサード）に集約=StatusBar/SplashScreen ダーク統一・Preferences 耐久ミラー（一度だけ移行＋write-through＋起動時復元。localStorageは同期のソース・オブ・トゥルースのまま）・`haptic()`・`share()`(=@capacitor/share委譲)。ui.js は**全てガード付き**で崩壊遷移時(setVerdictBanner crash)＋巻き戻し成功に触覚、共有はネイティブ時のみ委譲。**`isNativePlatform()` ガードで Web は完全 no-op＝GitHub Pages 挙動不変**。native.js は ui.js の前に読み込み（localStorage ラップを先に有効化）、sw.js cache v6-348。ios/android は .gitignore（`npx cap add`で再生成）。READMEにビルド手順＋実機チェックリスト。
- ✅ フェーズ1 タスク1（リポジトリ再構成・モジュール分割）: 単一 `index.html` を `/web` 配下へ分割。`web/index.html`（マークアップ＋起動）／`web/css/app.css`／`web/js/i18n.js`（辞書）／`web/js/engine.js`（HIST_REF/PRESETS/MDATA＋モデル状態＋純粋計算。**DOM/window非依存**＝将来サーバー再利用可）／`web/js/ui.js`（DOM・チャート・P2〜P4・共有・図鑑・週次・init）。**古典スクリプトのままグローバルスコープ共有で挙動不変**（連結すると元とバイト一致。唯一 `WEEKLY_ENABLED` だけ engine→ui へ安全に移動）。`manifest.json`/`sw.js`/`icon.svg` も `/web` へ移動、`sw.js` CORE に css/js 追加（cache名 v6-347）。`deploy.yml` は成果物パスを `web/` に変更＝**GitHub Pages のURLは不変**。`ci.yml` は `web/index.html` を参照。share.js/scenario.js/discovery.js の切り出しはタスク3/4で実施予定。
- ✅ PAGE 2 モデル検証（要ユーザー確認）: ユーザーが「確認済み」と回答。DX0固定→skillStock枯渇→ブランド崖→HELI:SUSPENDED の連鎖は動作するものとして確定。
- ✅ Web版UX改修（プロンプト1）: プロダクト名「社会デバッガー」、二人称バナー、街の命名(`ssd_town_name`)、共有前の一言、PAGE 1 巻き戻し、計測ラッパー `track()`、ヘッダー整理（左 EN/GUIDE、右 フィードバック/SHARE/≡メニュー、発見ログは初発見後に出現）、週替わりシナリオは `WEEKLY_ENABLED`(ネイティブ判定)でWeb非表示。
- ✅ PAGE 2 モデル改修（プロンプト1.5）: ブランドの閉ループ化（brand→財政→インフラ→ヘリ）、後継者ストック `skillStock`(遅い状態変数・崖・手遅れ閾値)、ヘリ3状態(OPERATIONAL/WEATHER HOLD/SUSPENDED)。
- ✅ 退行バグ修正: (1)`updateAll` の `avg` をブロック外へ (2)`checkScenarioGoal` の未定義 `saveDiscoveries/unlock` を `discover()` に置換＋Web版早期リターン (3)Chart.js `onerror` を定義前関数呼び出しからフラグ方式へ。

## 次のタスク（フェーズ1・タスクごとに一旦停止して報告する運用）

- 決定事項（このセッションで確定）: 配信は「**GitHub Pages 維持＋AWS 追加**」（今のURLは常に不変）。進め方は「**タスクごとに一旦停止**」。応答は日本語。
- ✅ タスク1（モジュール分割）完了。
- ✅ タスク2（Capacitor 導入）完了。
- ✅ タスク3（共有経路 X/LINE/画像保存）完了。
4. **タスク4 週替わりシナリオ（次）**: 静的JSON配信 `/content/weekly/2026-Wxx.json`＋`latest.json`。scenario.js 新規（ui.js から週次分を切り出し）。**注意: ハードコードの `SCENARIOS` の `check` 関数はJSON化不可 → 宣言的条件配列(metric/op/value)へ変換**。起動時 latest.json を fetch（CloudFront URL、失敗時はバンドル同梱フォールバック）。PAGE 1 上部に「今週のシナリオ」カード。クリアは既存判定流用→結果カードに「あなたは今週、街を守った。」＋シナリオ名。`ssd_weekly_cleared`（週ID配列）を永続化＋発見図鑑に記録。通知は初回クリア直後に許可要求（local-notifications、月19:00等の定数）。サンプル3週分（実在の国/自治体/人物を名指ししない）。`WEEKLY_ENABLED`(native)でWeb非表示は現状維持。
4. タスク4 週替わりシナリオ（静的JSON配信 `/content/weekly/*.json`＋latest.json）。scenario.js 新規。**注意: ハードコードの `SCENARIOS` の `check` 関数はJSON化不可 → 宣言的条件配列(metric/op/value)へ変換**。通知は初回クリア直後に許可要求。サンプル3週分。
5. タスク5 AWS 配信基盤（CDK/TS, `/infra`）: S3(非公開/OAC)+CloudFront。README に構成図・選定理由・「Dockerを使わない理由(静的配信＋サーバーレスで常駐なし)」。cdk synth 通過まで（deployはユーザー）。
6. タスク6 計測拡充（weekly_*/share_*/card_saved/notification_optin、共通プロパティ app_platform）。
7. タスク7 CI/CD（GitHub Actions + AWS OIDC、最小権限、engine.js のユニットテスト、週次JSONのスキーマ検証）。

## 保留中（条件を満たすまで着手しない）

- フェーズ2: 共同カウンター(累積で守られた街の数)、週替わりの守り人署名、リモートプッシュ(APNs/FCM)、AWS拡張(API Gateway+Lambda+DynamoDB)。
- SWAP THE LEADER 先行版 / PAGE 5「比較OS診断」フル実装。発動条件は別ノート `design-note-page5.md` に凍結済み（実名ゼロ・構造で語る・週替わりシナリオで小出しに検証してから）。
