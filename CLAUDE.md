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

- ✅ **スプリント追加2タスク（T6/T7・詳細は `PROGRESS.md`）**: **T6** `ci.yml` に verify ジョブ（PRでも Playwright Console ゼロ検証・助言的）＋ TODO.md 全面更新（☐0 push / ☐5 リール録画 / ☐6 教員PDF / ☐7 iCloud移設）。**T7** Zenn 記事ドラフト2本を `docs/articles/` に（記事1 Capacitor化・記事2 AWS CDK+OIDC。`published: false`、公開はフェーズ2でXと連動）。
- ✅ **戦略実装スプリント（5タスク・詳細は `PROGRESS.md`）**: 戦略文書（PM.md/MARKETING.md/OUTREACH.md/SKILL.md/vertical-reel スキル）を追加コミットし、そこから切り出した5タスクを完了。**T1** `scripts/verify.mjs`＝SKILL.md 必須Consoleゼロ検証の自動化（Playwright、Chart.js正常/失敗の2ケース、`npm run verify`/`make verify`。CIには含めずブラウザ非依存を維持）。**T2** US-08 エクスポート＝≡メニューから全パラメータ＋P1/P2メトリクス＋再現URLを JSON/CSV でDL（track: export_json/export_csv）。**T3** 共有最適化＝固定ハッシュタグ `shareHashtag()`（ja #社会デバッガー / en #SocialDebugger、X導線2箇所に統一適用）＋PAGE 2 系文脈に「防災」語入りテンプレ変種 `addBousai()`（LINE拡散狙い）。**T4** `web/classroom.html`＝教員向けA4・1枚ガイド（自己完結・印刷は白地・README導線あり、Pages/AWS両配信）。**T5** `promo/reel-30s.html`＝30秒縦型リール（実UI文言転記・免責フッター固定・配信対象外の promo/ 配下）。sw cache v6-355。PM.md US-08 に✅。全コミット済み（未push）。

- ✅ **AWS 本番デプロイ完了・ライブ**（account `339712703146` / ap-northeast-1）。公開URL **https://d3gpx0wi0z904j.cloudfront.net/**（HTTP 200・title「社会デバッガー」、latest.json 200、S3 直アクセスは 403＝OAC 正常）。CDK出力: Bucket=`socialdebuggerstack-sitebucket397a1860-ng9iqq3c1fr7` / DistId=`E10GS6FTY148VM` / DeployRole=`arn:aws:iam::339712703146:role/ssd-github-deploy`。**ハマり所2つ**: (1) 既存の GitHub OIDC プロバイダがアカウントに存在 → `-c existingOidcProviderArn=arn:aws:iam::339712703146:oidc-provider/token.actions.githubusercontent.com` を渡して重複作成回避（Makefile 既定には無いので手動 or Makefile 拡張が必要）。(2) `infra/scripts/deploy.sh` が macOS bash 3.2＋`set -u` で空配列 `"${PROFILE_ARGS[@]}"` 展開が unbound variable で落ちる → `${arr[@]+"${arr[@]}"}` ガードで修正済み。`web/config.js` は `contentBaseUrl:""`（相対）のままで CloudFront 同一オリジン配信は正常動作＝変更不要。**残: `aws-wire` の GitHub Secrets/Variables 設定は `gh` 未導入のため未実施**（値は下記「ユーザーが手を動かす設定」参照）。
- ✅ リント/整形ツールチェーン導入: **prettier + eslint**（`.prettierrc.json`/`.prettierignore`/`eslint.config.mjs`）。eslint は「バンドラなし・古典スクリプトでグローバル共有」設計に合わせ `no-undef`/`no-unused-vars` は無効化＝**明白なバグ系ルールのみ検知**（関数解決は `invariants.test.mjs` が別途担保）。prettier は密な手書きフロント（`web/js`/`web/css`/`web/*.html`/`web/config.js`/`*.md`）を **除外**（意図的な圧縮スタイル維持・大差分/退行回避）＝対象はコード/データ/設定のみ。`package.json` に `lint`/`format`/`format:check` を追加し `check` に合流（＝`npm run check` = test＋週次検証＋eslint＋prettier）。`Makefile` に `lint`/`format`/`protect`。`scripts/setup-branch-protection.sh`（`make protect`：main を PR＋CI(web/infra)必須で保護、CodeQLは助言的で非必須）。`share-card-generator.html`（OGP/共有カード生成の単体ツール）。設定/データ/スクリプト類を prettier 整形、sw cache `v6-353`。**`ci.yml` の web ジョブを `npm ci`＋`npm run check` に置換＝ローカルとCIを完全一致**（lint/format崩れが main に入らない）。全チェック green（テスト19 pass・eslint clean・prettier clean・package-lock 同期）。
- ✅ 引き継ぎ自動化: **Stop フック**（`.claude/settings.json`→`scripts/handoff-hook.sh`）でセッション停止毎に競合コピー/未コミット/未pushを自動警告（systemMessage・非ブロッキング）。**pre-commit フック**（`.githooks/`＋`core.hooksPath`、`make setup`/`make hooks`で有効化）でコミット前に `npm run check`。**devcontainer**（Node20＋gh＋aws-cli、postCreateで依存導入＋hooks有効化）で別マシン/Codespaces/Codex でも同一環境。※`.claude/settings.json` は今セッション開始時に未存在だったため、Stopフックは次回起動 or `/hooks` を一度開くと有効化。
- ✅ 仕組み化（継続性・自動化・簡素化）: `AGENTS.md`(Codex向け入口)・`CONTRIBUTING.md`・`Makefile`(`make help` 単一入口)。`cdk-nag`(AWS Solutions)を CDK に組込み6件を理由付き抑制、`infra/.env.example`。`dependabot.yml`、Issue/PRテンプレ。CONTENT_BASE_URL を `web/config.js` に分離（`deploy-aws.yml` が `CLOUDFRONT_DOMAIN` から自動生成）。**AWS簡素化: `make aws-deploy`→`make aws-wire` で CDK出力→GitHub Secrets/Variables と config.js を gh CLI で自動配線**。**`make handoff`（`scripts/handoff-check.sh`）でセッション終了前に競合コピー/未コミット/未push/テストを一括検証**。⚠️ iCloud(`~/Documents`)がindex.html編集を巻き戻し competing copy を作った事例あり→リポジトリのiCloud外移設を推奨。
- ✅ 仕上げ2: `sw.js` を**同一オリジンのjs/cssも network-first**化（デプロイ後の stale-JS を根絶・オフラインはキャッシュ、cache v6-352）。`web/og-image.png`(1200×630) を生成（`scripts/gen-og-image.mjs`＋`@napi-rs/canvas` devDep、`npm run gen:og`。og:imageは相対URLでPages/AWS両対応）。`tests/scenario-goals.test.mjs`・`tests/share-url.test.mjs` 追加（計15テスト）。`deploy-aws.yml` は `if: vars.S3_BUCKET != ''` で未設定時スキップ。
- ✅ 仕上げ1: `docs/DEVELOPMENT.md`/`.en.md` を新モジュール構成に更新（コードの地図をファイル別に・週替わり追加手順・http配信/SWキャッシュ対処）。ルート `package.json` に `test`(engine node:test)/`validate:weekly`/`check`/`gen:og` を追加（ローカルでCI再現可）。
- ✅ **フェーズ1 完了（タスク1〜7 / コミット済み・未push）**。残るはユーザー側の実設定（下記「ユーザーが手を動かす設定」）。
- ✅ フェーズ1 タスク7（CI/CD + AWS OIDC）: CDK に **GitHub OIDC プロバイダ＋最小権限デプロイロール**（信頼= `repo:OWNER/REPO:ref:refs/heads/main` プレースホルダ、権限= S3 List/Get/Put/Delete＋CloudFront CreateInvalidation のみ、cdk deployは意図的に除外）。出力 `GithubDeployRoleArn`。`.github/workflows/ci.yml`（PR: engine.js `node:test`＋週次JSONスキーマ検証(ja/en)＋cdk synth）。`.github/workflows/deploy-aws.yml`（main/web・content変更時: OIDC Assume→S3同期→latest.json/index.html無効化）。**GitHub Pages の deploy.yml は維持**（Pages+AWS並行）。`tests/engine.test.mjs`(8)・`scripts/validate-weekly.mjs`・`content/weekly.schema.json`。README に CI/CD Mermaid・OIDC選定理由・最小権限・毎週更新手順。ローカルで tests/JSON検証/cdk synth 全通過。
- ✅ フェーズ1 タスク6（計測拡充）: `track()` に共通プロパティ `app_platform`(web/ios/android=`SSD.platform`) 付与。`weekly_fail` 追加（scenario.js が挑戦を追跡し、ui.js の崩壊バナー遷移で1回発火・native/web no-op）。README に計測イベント表＋「20人フェーズKPI対応表」。sw cache v6-351。
- ✅ フェーズ1 タスク5（AWS配信基盤 CDK）: `/infra` に TypeScript CDK。**S3(非公開/BlockPublicAccess ALL/SSE/enforceSSL) + CloudFront(OAC)** の静的配信最小構成。既定ビヘイビア=長TTL（ハッシュ運用の方針をコメント）、`content/weekly/latest.json` 専用=5分TTL。403/404→index.html。出力=BucketName/DistributionId/DistributionDomainName。`scripts/deploy.sh`=web/(content除外・--delete安全)＋content/ をS3同期→latest.json/index.html のみ無効化。account/region/profile は環境変数プレースホルダ。`infra/README.md`=Mermaid構成図・選定理由・コスト(無料枠)・セキュリティ・「Docker不要の理由」・フェーズ2拡張。**`cdk synth` 通過確認済み**（tsc/synth OK、S3+CloudFront+OAC+2キャッシュ生成確認）。node_modules/cdk.out は gitignore。**残: scenario.js の CONTENT_BASE_URL を実CloudFrontドメインに差し替え（deploy後）**。
- ✅ フェーズ1 タスク4（週替わりシナリオ）: `web/js/scenario.js` を新規（読込順 …share→scenario→ui）。週次ロジックを ui.js から切り出し。**`check` 関数を宣言的 `goalConds[{metric,op,value}]` ＋ `evalGoalConds`（param/metrics 統合文脈）に変換**＝JSON化可能。静的配信 `content/weekly/2026-W28..W30.json`＋`latest.json`（id/title/intro/page/params/goal/goalConds/difficulty/discoveryId, 日英, 実名なし）。起動時 `latest.json` を CloudFront(プレースホルダURL) から fetch、失敗時バンドル版フォールバック。`ssd_weekly_cleared[]` 永続化＋**DISCOVERIES に未登録だった `sce_*` 発見を追加**（`sce_weekly_guardian`「今週の守り人」含む）。クリア時=結果カードに「あなたは今週、街を守った。」＋シナリオ名／成功ハプティクス／**初回クリア直後に通知許可**（月19:00 週次 local-notifications）。track: weekly_start/weekly_clear/notification_optin。潜在バグ修正: applyScenarioParams の未定義 updateP1Chart/updateP2Chart→updateAll/updateAllP2。**全体 WEEKLY_ENABLED(native) ガードで Web は no-op**。sw cache v6-350。`content/` は task5 で S3/CloudFront 配信（Pages(web/)では配信されない）。
- ✅ フェーズ1 タスク3（共有経路 X/LINE/画像保存）: `web/js/share.js` を新規（読込順 i18n→engine→native→share→ui）。共有ポップの単一「共有…」ボタンを **3ボタン等格（𝕏 / LINE / 画像を保存）＋ 下に「その他のアプリで共有」** に再設計。LINE は `social-plugins.line.me/lineit/share` で X と同格。画像保存=Webは既存 `shareResultCard`（モバイル共有シート/デスクトップDL）、ネイティブは `@capacitor/filesystem` で書出し→`@capacitor/share`（全て `SSD.isNative` ガード、失敗時Webへフォールバック）。`track('share_x'/'share_line'/'card_saved'/'share_other')`。`renderSharePop` はアクション部を `renderShareActions()` に委譲。CSS `.line-btn/.save-btn`、sw cache v6-349。動的文言は `tt(ja,en)` インライン。
- ✅ フェーズ1 タスク2（Capacitor 導入 / iOS・Android）: バンドラなしで既存Webをネイティブ化。`package.json`＋`capacitor.config.json`（appId プレースホルダ `dev.socialdebugger.app`, `webDir=web`）、Capacitor 8系プラグイン一式。`web/js/native.js`（`window.SSD` ファサード）に集約=StatusBar/SplashScreen ダーク統一・Preferences 耐久ミラー（一度だけ移行＋write-through＋起動時復元。localStorageは同期のソース・オブ・トゥルースのまま）・`haptic()`・`share()`(=@capacitor/share委譲)。ui.js は**全てガード付き**で崩壊遷移時(setVerdictBanner crash)＋巻き戻し成功に触覚、共有はネイティブ時のみ委譲。**`isNativePlatform()` ガードで Web は完全 no-op＝GitHub Pages 挙動不変**。native.js は ui.js の前に読み込み（localStorage ラップを先に有効化）、sw.js cache v6-348。ios/android は .gitignore（`npx cap add`で再生成）。READMEにビルド手順＋実機チェックリスト。
- ✅ フェーズ1 タスク1（リポジトリ再構成・モジュール分割）: 単一 `index.html` を `/web` 配下へ分割。`web/index.html`（マークアップ＋起動）／`web/css/app.css`／`web/js/i18n.js`（辞書）／`web/js/engine.js`（HIST_REF/PRESETS/MDATA＋モデル状態＋純粋計算。**DOM/window非依存**＝将来サーバー再利用可）／`web/js/ui.js`（DOM・チャート・P2〜P4・共有・図鑑・週次・init）。**古典スクリプトのままグローバルスコープ共有で挙動不変**（連結すると元とバイト一致。唯一 `WEEKLY_ENABLED` だけ engine→ui へ安全に移動）。`manifest.json`/`sw.js`/`icon.svg` も `/web` へ移動、`sw.js` CORE に css/js 追加（cache名 v6-347）。`deploy.yml` は成果物パスを `web/` に変更＝**GitHub Pages のURLは不変**。`ci.yml` は `web/index.html` を参照。share.js/scenario.js/discovery.js の切り出しはタスク3/4で実施予定。
- ✅ PAGE 2 モデル検証（要ユーザー確認）: ユーザーが「確認済み」と回答。DX0固定→skillStock枯渇→ブランド崖→HELI:SUSPENDED の連鎖は動作するものとして確定。
- ✅ Web版UX改修（プロンプト1）: プロダクト名「社会デバッガー」、二人称バナー、街の命名(`ssd_town_name`)、共有前の一言、PAGE 1 巻き戻し、計測ラッパー `track()`、ヘッダー整理（左 EN/GUIDE、右 フィードバック/SHARE/≡メニュー、発見ログは初発見後に出現）、週替わりシナリオは `WEEKLY_ENABLED`(ネイティブ判定)でWeb非表示。
- ✅ PAGE 2 モデル改修（プロンプト1.5）: ブランドの閉ループ化（brand→財政→インフラ→ヘリ）、後継者ストック `skillStock`(遅い状態変数・崖・手遅れ閾値)、ヘリ3状態(OPERATIONAL/WEATHER HOLD/SUSPENDED)。
- ✅ 退行バグ修正: (1)`updateAll` の `avg` をブロック外へ (2)`checkScenarioGoal` の未定義 `saveDiscoveries/unlock` を `discover()` に置換＋Web版早期リターン (3)Chart.js `onerror` を定義前関数呼び出しからフラグ方式へ。

## 次のタスク（フェーズ1・タスクごとに一旦停止して報告する運用）

- 決定事項（このセッションで確定）: 配信は「**GitHub Pages 維持＋AWS 追加**」（今のURLは常に不変）。進め方は「**タスクごとに一旦停止**」。応答は日本語。
**フェーズ1（タスク1〜7）はコード完了・全コミット済み（未push）。** コーディング側の残作業なし。
次はユーザーの実設定（下記「ユーザーが手を動かす設定」）→ 20人フェーズ運用 → フェーズ2。

## ユーザーが手を動かす設定（コードは完了。ここは人間の作業）

A. **push**: `git push`（7タスク分＋docsコミットが未push）。pushで Pages(web/) 再デプロイ・CI稼働。
B. **Capacitor 実機**（ネイティブ機能の実挙動確認に必須）: `npm install` → `npx cap add ios/android` → `npx cap open ...`。`capacitor.config.json` の `appId`(現 `dev.socialdebugger.app`)を自分のIDに。Xcodeで署名Team、Android Studio/JDK17、通知権限。
C. **AWS デプロイ（簡素化済み）**: 環境変数(`CDK_DEFAULT_ACCOUNT/REGION`, 任意`AWS_PROFILE`。`infra/.env.example` 参照) → `make aws-bootstrap`（初回のみ）→ `make aws-deploy` → **`make aws-wire`**。
   - `make aws-wire` が **CDK出力から GitHub の Secret/Variables（AWS_DEPLOY_ROLE_ARN / AWS_REGION / S3_BUCKET / CLOUDFRONT_DIST_ID / CLOUDFRONT_DOMAIN）を gh CLI で自動設定＋`web/config.js` に配信元を自動書込み**（＝旧D手順とscenario.js手書きが不要に）。前提: `aws` 認証済み＋`gh auth login` 済み。
   - CDKの `githubRepo` は Makefile 既定（`larai-w/social-system-debugger`）。既存OIDCプロバイダがある場合のみ `cd infra && npm run deploy:stack -- -c existingOidcProviderArn=...`。
D. （任意）カスタムドメイン: infra スタックの ACM(us-east-1)/Route53 コメント解除。
- 全操作は `make help` に一覧。**セッション終了前は `make handoff`**（クリーン・未push・テストを検証）。
4. タスク4 週替わりシナリオ（静的JSON配信 `/content/weekly/*.json`＋latest.json）。scenario.js 新規。**注意: ハードコードの `SCENARIOS` の `check` 関数はJSON化不可 → 宣言的条件配列(metric/op/value)へ変換**。通知は初回クリア直後に許可要求。サンプル3週分。
5. タスク5 AWS 配信基盤（CDK/TS, `/infra`）: S3(非公開/OAC)+CloudFront。README に構成図・選定理由・「Dockerを使わない理由(静的配信＋サーバーレスで常駐なし)」。cdk synth 通過まで（deployはユーザー）。
6. タスク6 計測拡充（weekly_*/share_*/card_saved/notification_optin、共通プロパティ app_platform）。
7. タスク7 CI/CD（GitHub Actions + AWS OIDC、最小権限、engine.js のユニットテスト、週次JSONのスキーマ検証）。

## 保留中（条件を満たすまで着手しない）

- フェーズ2: 共同カウンター(累積で守られた街の数)、週替わりの守り人署名、リモートプッシュ(APNs/FCM)、AWS拡張(API Gateway+Lambda+DynamoDB)。
- SWAP THE LEADER 先行版 / PAGE 5「比較OS診断」フル実装。発動条件は別ノート `design-note-page5.md` に凍結済み（実名ゼロ・構造で語る・週替わりシナリオで小出しに検証してから）。
