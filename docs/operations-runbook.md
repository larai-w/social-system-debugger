# 運用ランブック / Operations Runbook

> 障害・不具合が起きたときに「迷わず・順に・根拠つきで」対応するための1本。
> ITIL のインシデント管理（優先度判定 → 切り分け → 復旧 → 恒久対策）とナレッジ管理を、
> このリポジトリの実装に対応づけて記述する。**各手順の末尾に必ず根拠（実装ファイル）を書く**。
> 推測では書かない。検証できない外部要因（GitHub / AWS の広域障害）は「一般的な対応・status 確認」と明示する。

関連ドキュメント（重複は繰り返さず参照で済ませる）:

- 開発・SW キャッシュ対処・http 配信の詳細: [`DEVELOPMENT.md`](DEVELOPMENT.md)
- AWS 構成・手動デプロイ・OIDC/最小権限: [`../infra/README.md`](../infra/README.md)
- セッション引き継ぎ・委任の回収: [`session-handoff.md`](session-handoff.md) ／ [`../CLAUDE.md`](../CLAUDE.md)「開発ツールの方針 > 委任プロトコル」／ [`../AGENTS.md`](../AGENTS.md)
- 全操作の単一入口: `make help`（[`../Makefile`](../Makefile)）

---

## 0. まず最初に見る3点（トリアージ）

障害の一報を受けたら、深追いする前にこの3点だけ先に確認する。ここで影響範囲がほぼ確定する。

1. **GitHub Actions の失敗通知** — どのワークフローが赤いか。
   - `weekly-rotate.yml`（週次ローテ）／ `deploy.yml`（Pages）／ `deploy-aws.yml`（AWS）／ `ci.yml`（PR検証）のどれか。
   - 根拠: [`../.github/workflows/`](../.github/workflows/) 一式。
2. **本番URL が生きているか**（2配信面を両方）。
   - Pages: https://larai-w.github.io/social-system-debugger/
   - AWS(CloudFront): https://d3gpx0wi0z904j.cloudfront.net/
   - 根拠: URL は [`DEVELOPMENT.md`](DEVELOPMENT.md)（Pages）／ [`../CLAUDE.md`](../CLAUDE.md) 進捗ログ（CloudFront ドメイン・HTTP 200 実測記録）。
3. **`npm run check` がローカルで green か** — コード側の退行かどうかの一次切り分け。
   - `check` = テスト＋週次JSON検証＋eslint＋prettier（CI と完全一致）。
   - 根拠: [`../package.json`](../package.json) `scripts.check`（`npm test && npm run validate:weekly && npm run lint && npm run format:check`）。

確認コマンド例:

```bash
# 本番の生存確認（HTTP ステータスだけ見る）
curl -sI https://larai-w.github.io/social-system-debugger/ | head -1
curl -sI https://d3gpx0wi0z904j.cloudfront.net/ | head -1
# コード側の一次切り分け
npm run check
```

---

## 優先度マトリクス（P1〜P3）と初動時間の目安

「ユーザー影響」×「緊急度」で優先度を決める。これは運用上の目安であり、外部依存の障害は事業者の復旧に従う。

| | 緊急度：高（悪化中／自然回復しない） | 緊急度：中〜低（静的・自然回復しうる） |
|---|---|---|
| **ユーザー影響：大**（本番が全ユーザーに壊れて見える） | **P1** — 即着手。初動 目安 30 分以内。例: 両配信面が落ちる、本番で Console エラーが出て操作不能、退行 JS が全員に配られた | **P2** — 当日中着手。例: 片方の配信面だけ古い/落ちている（もう一方は生存）、SW キャッシュで一部ユーザーだけ古い画面 |
| **ユーザー影響：小**（機能の一部・限定的） | **P2** — 当日中。例: 週次ローテ失敗で「今週のシナリオ」だけ差し替わらない（アプリ本体は動作） | **P3** — 計画対応。例: 在庫残量の警告、Lighthouse スコア低下（助言的）、docs のずれ |

補足:

- **配信は Pages ＋ AWS の二重化**。片方が落ちても、もう一方の URL が生存していれば全損にはならない（P1 → P2 に格下げできる）。根拠: [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) と [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml) が独立に main push で走る二面構成。
- 週次ローテの失敗は多くが「在庫切れ」= 意図的な失敗（下記 §1）で、アプリ本体は落ちないため通常 **P2**。根拠: [`../.github/workflows/weekly-rotate.yml`](../.github/workflows/weekly-rotate.yml) が在庫無しの週を `exit 1` で失敗させる設計（＝リマインダー）。

---

## 1. 週次ローテが失敗した

**症状**: 月曜 0:00 JST（日曜 15:00 UTC）に走る `Weekly scenario rotation` が赤い。あるいは手動起動が失敗する。

**切り分け**: 失敗ログの最初のステップ（`Rotate latest.json ...`）を見て、以下2系統のどちらか判定する。

- **(A) 在庫切れ** — ログに `::error::content/weekly/<今週のISO週>.json がありません。週替わりシナリオの在庫切れです` が出ている。
  - これは**設計どおりの失敗**（＝「今週分のシナリオを書き足せ」というリマインダー）。バグではない。
  - 根拠: [`../.github/workflows/weekly-rotate.yml`](../.github/workflows/weekly-rotate.yml)（`SRC` が無ければ `exit 1`）。
- **(B) それ以外の失敗** — 在庫はあるがコミット/push や後続ディスパッチで落ちている。ログの該当ステップを見る。
  - `git push` 失敗 → 一時的な競合や権限。`permissions: contents: write` は設定済み。再実行で解消することが多い。
  - `Trigger deploys` の `gh workflow run` 失敗 → `actions: write` 権限・後続ワークフロー名の不一致を疑う。
  - 根拠: [`../.github/workflows/weekly-rotate.yml`](../.github/workflows/weekly-rotate.yml)（`permissions: contents: write / actions: write`、`gh workflow run deploy.yml` / `deploy-aws.yml`）。

事前確認（在庫がどれだけ残っているか）:

```bash
npm run validate:weekly   # 末尾に「在庫: 残りN週（最新: 2026-Wxx）」を表示。3週未満で警告
```

根拠: [`../scripts/validate-weekly.mjs`](../scripts/validate-weekly.mjs)（末尾の在庫残量ガード。残り3週未満で `⚠` 警告）。

**対処**:

- (A) 在庫切れ → その週の `content/weekly/2026-Wxx.json` を追加する。作り方（スキーマ・ゴール宣言・検証）は [`DEVELOPMENT.md`](DEVELOPMENT.md)「週替わりシナリオを追加する」に一本化。追加を main にマージ後、`weekly-rotate.yml` を **手動再実行**（`workflow_dispatch`）すれば即反映できる。
- (B) その他 → 原因ステップを直し、Actions から `Re-run failed jobs`。push 競合なら最新 main を取り込んでから再実行。
- 手動起動: GitHub → Actions → `Weekly scenario rotation` → `Run workflow`（`workflow_dispatch` 対応済み）。根拠: [`../.github/workflows/weekly-rotate.yml`](../.github/workflows/weekly-rotate.yml)（`on: workflow_dispatch`）。

**恒久対策**:

- 在庫を先行して積む（`validate:weekly` の残量警告を CI/ローカルで拾い、残り3週を切る前に補充）。根拠: [`../scripts/validate-weekly.mjs`](../scripts/validate-weekly.mjs)。
- ローテ後の Pages/AWS デプロイは `GITHUB_TOKEN` の再帰防止のため `gh workflow run` で明示起動している。デプロイが走らないときはこのディスパッチ段の失敗を疑う。根拠: [`../.github/workflows/weekly-rotate.yml`](../.github/workflows/weekly-rotate.yml) 冒頭コメント＋`Trigger deploys` ステップ。

---

## 2. GitHub Pages のデプロイが失敗した・サイトが古いまま

**症状**: `Deploy to GitHub Pages` が赤い、または main にマージ済みなのに Pages の内容が更新されない。

**切り分け**:

1. Actions → `Deploy to GitHub Pages` の最新実行を確認。
   - `Deployment failed, try again later.` 等 → **GitHub Pages バックエンドの一時障害**（こちらのコードの問題ではない）。検証できない外部要因。https://www.githubstatus.com を確認。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md)「Pages が『Deployment failed…』で落ちたら」。
2. 「デプロイは緑だが古く見える」場合 → **ブラウザ/SW のキャッシュ**を疑う（→ §4）。まずシークレットウィンドウで本番URLを開いて、サーバー側が新しいかを切り分ける。
3. アップロード対象パスの取り違えを疑う → Pages が公開するのは `web/` 配下のみ。`web/` 外（`content/` 等）は Pages には出ない。根拠: [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)（`upload-pages-artifact` の `path: 'web'`）。

**対処**:

- 外部一時障害 → 少し待って Actions から `Re-run failed jobs`、または空コミット等で再 push。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md) 該当節。
- 反映漏れ → `deploy.yml` は `on: push: branches:[main]` と `workflow_dispatch`。手動で `Run workflow` から再実行できる。根拠: [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)。
- 古く見えるだけ → §4（SW キャッシュ）へ。

**恒久対策**:

- Pages はサーバー障害以外ではコード側が原因になりにくい（`web/` をそのまま公開するだけ）。稼働状況は事業者の status ページに依存する（＝一般的な対応）。根拠: [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) の単純構成。

**404 ページの挙動**:

- 存在しないパスへのアクセスは [`../web/404.html`](../web/404.html) が返る（GitHub Pages がルートの `404.html` を自動採用）。SW 制御下のクライアントはオフライン時に navigate フェッチを `index.html` へフォールバックするため、この 404 が表示されるのはオンライン直アクセス時に限られる。根拠: [`../web/sw.js`](../web/sw.js) `fetch` ハンドラ（navigate/document の `.catch(() => caches.match('./index.html'))`）。

---

## 3. AWS(CloudFront) 側だけ古い・落ちている

**症状**: Pages は正常だが CloudFront ドメイン（https://d3gpx0wi0z904j.cloudfront.net/）だけ古い/エラー。あるいは `Deploy to AWS (S3 + CloudFront)` が赤い/skipped。

**影響範囲**: 二重配信のうち AWS 面だけの問題。Pages が生きていれば全損ではない（優先度は P2 に下がる）。根拠: [`deploy.yml`](../.github/workflows/deploy.yml) と [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml) が独立。

**切り分け**:

1. `deploy-aws.yml` が **skipped（灰色）** → これは異常ではない場合がある。`vars.S3_BUCKET` 未設定だとジョブ全体を意図的にスキップする設計。根拠: [`../.github/workflows/deploy-aws.yml`](../.github/workflows/deploy-aws.yml)（`if: ${{ vars.S3_BUCKET != '' }}`）。
2. `deploy-aws.yml` が **赤い** → どのステップか:
   - `Configure AWS credentials (OIDC)` 失敗 → OIDC 信頼関係／`secrets.AWS_DEPLOY_ROLE_ARN`／`vars.AWS_REGION` を確認。長期キーは使わない設計。根拠: [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml)（`aws-actions/configure-aws-credentials@v4`、冒頭コメントの Secrets/Variables 一覧）。
   - `Sync web/` / `Sync content/` 失敗 → バケット名（`vars.S3_BUCKET`）とロール権限（S3 List/Get/Put/Delete）を確認。根拠: [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml) の同期ステップ、権限範囲は [`../infra/README.md`](../infra/README.md)。
   - `Invalidate ...` 失敗 → `vars.CLOUDFRONT_DIST_ID` と CreateInvalidation 権限。根拠: [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml)。
3. **CloudFront/S3 側の広域障害** → こちら側の設定では直せない。https://health.aws.amazon.com/health/status（AWS Health Dashboard）で確認（一般的な対応）。

**対処（手動復旧）**:

- CI 経由で直せないとき、AWS 認証情報がある環境から手動デプロイできる:

  ```bash
  make aws-deploy   # CDKスタック確認 → web/・content/ を S3 同期
  ```

  根拠: [`../Makefile`](../Makefile)（`aws-deploy` ターゲット）＋ [`../infra/README.md`](../infra/README.md)「デプロイの流れ」。
- 「古いだけ」なら latest.json / index.html の無効化が要点。手動同期の `npm run deploy`（`make aws-deploy` の後段）が `latest.json` と `index.html` のみを無効化する（全パス `/*` はコスト/時間の無駄なので避ける）。根拠: [`../infra/README.md`](../infra/README.md)「コスト」節（無効化は latest.json と index.html のみ）。
- Secrets/Variables を CDK 出力から張り直すには `make aws-wire`。根拠: [`../Makefile`](../Makefile)（`aws-wire` → [`../scripts/aws-wire.sh`](../scripts/aws-wire.sh)）。
- 既知のハマり所（OIDC プロバイダ重複・macOS bash 3.2 の空配列展開）は解決済み。詳細は [`../CLAUDE.md`](../CLAUDE.md) 進捗ログ「AWS 本番デプロイ完了」節を参照。

**恒久対策**:

- 二重配信を維持する（片面障害を全損にしない）。根拠: 独立した2ワークフロー構成。
- AWS 側は S3(非公開/OAC) + CloudFront の静的配信で常駐プロセスなし＝落ちる面が少ない。設計判断は [`../infra/README.md`](../infra/README.md)。

---

## 4. SW キャッシュ事故（ユーザーに古い画面が残る）

**症状**: サーバー側（シークレットウィンドウ）は新しいのに、通常ウィンドウでは古い画面/古い JS のまま。デプロイ直後や `web/js` の分割変更後に起きやすい。

**設計の前提（誤解しないため）**:

- `sw.js` は **ドキュメントと同一オリジンの js/css を network-first**（新デプロイを必ず優先し、古いキャッシュに固定されない）。それ以外の静的資産（icon 等）と Chart.js CDN は cache-first（オフライン動作用）。
- したがって「JS だけ古い」は本来起きにくいが、`CACHE` 版数を上げ忘れて CORE の内容だけ変えたとき等に古いキャッシュが残りうる。
- 根拠: [`../web/sw.js`](../web/sw.js) 冒頭方針コメント＋ `fetch` ハンドラ（navigate/document と js/css は network-first、その他 cache-first）。

**切り分け**:

- DevTools → Application → Service Workers で登録中の SW と `CACHE` 名（`ssd-cache-v6-xxx`）を確認。現在の版は [`../web/sw.js`](../web/sw.js) の `const CACHE`。
- 「Bypass for network」で改善するなら、キャッシュ由来と確定。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md)「PWA/SW のキャッシュで古いJSが出たら」。

**対処**:

1. **CACHE 版数バンプ**（配信側の根本対処）— `CORE[]` を変えた／古いキャッシュを確実に捨てたいときは、[`../web/sw.js`](../web/sw.js) の `const CACHE = 'ssd-cache-v6-xxx'` の番号を必ず1つ上げる。`activate` が旧キャッシュを全削除し、`skipWaiting` + `clients.claim` で即時切替する。根拠: [`../web/sw.js`](../web/sw.js)（`activate` の `keys().filter(k=>k!==CACHE).map(caches.delete)` ＋ `skipWaiting()`/`clients.claim()`）。バージョン刻みは 0.001（例 v6-362 → v6-363）。
2. **開発中の一時回避** — DevTools → Application → Service Workers → `Bypass for network`、または `Unregister` → ハード再読み込み、またはシークレットウィンドウ。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md) 同節。

**ユーザーへの強制解除 案内文テンプレ（そのまま配布可）**:

> 古い画面が表示される場合は、次のいずれかで解消します。
> ・スマホ/PC ともに **ページを再読み込み**（多くの場合これだけで最新化されます）。
> ・改善しない場合は **一度ページを閉じて開き直す**、または **プライベート/シークレットウィンドウ**で開いてください。
> ・PC なら **Ctrl/⌘ + Shift + R**（キャッシュを無視した再読み込み）も有効です。
> （このアプリは最新版を優先して読み込む設計です。上記で必ず最新になります。）

**恒久対策**:

- CORE を変更したら **必ず `CACHE` の版数を上げる**運用を徹底（レビュー観点）。根拠: [`../web/sw.js`](../web/sw.js) ＋ [`DEVELOPMENT.md`](DEVELOPMENT.md)「PWA」注記。

---

## 5. 本番で Console エラーが出ている

**症状**: 本番（または検証環境）でページを開くと DevTools Console にエラー。操作不能・機能欠落を伴う場合は最優先（P1）。

**切り分け（verify 3種の使い分け）**: どのモードで再現するかで原因を絞る。

- **`npm run verify`（= `make verify`）** — Playwright で **Chart.js 正常時／CDN 遮断時の2ケース**を自動再生し、Console/pageerror がゼロかを検証。4タブ遷移・プリセット・スライダー・Chart.js 失敗時のグレースフルデグラデーションを含む。まずこれを回す（初回のみ `npx playwright install chromium`）。根拠: [`../package.json`](../package.json)（`verify` → `scripts/verify.mjs`）＋ [`DEVELOPMENT.md`](DEVELOPMENT.md)「★『完了ごとの必須チェック』の自動化」。
- **`npm run verify:offline`（= `make verify-offline`）** — PWA のオフライン起動検証（SW 登録 → 回線遮断 → リロードで動くか）。SW/キャッシュ絡み（§4 と併読）を疑うときに使う。根拠: [`../package.json`](../package.json)（`verify:offline` → `scripts/verify-offline.mjs`）＋ [`../Makefile`](../Makefile)（`verify-offline`）。
- **`npm run gen:shot`** — スクリーンショットを生成し、見た目/描画の崩れを目視確認するとき。Console 検証ではなく描画確認用。根拠: [`../package.json`](../package.json)（`gen:shot` → `scripts/gen-screenshot.mjs`）。

**対処**:

- `verify` が赤い → 出力の Console/pageerror メッセージからファイルを特定。グローバルスコープ共有・読み込み順（`i18n → engine → native → share → scenario → ui → demo`）に起因する未定義参照が典型。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md)「アーキテクチャ概要 > 読み込み順」＋「新しい関数を足すときの注意」。
- Chart.js 遮断ケースだけ赤い → グレースフルデグラデーションの退行。Chart.js が無くてもタブ/スライダー/共有が動くこと。根拠: [`../CLAUDE.md`](../CLAUDE.md)「完了ごとの必須チェック」項3。
- 修正後は `npm run verify` を再実行してゼロを確認してから配信（§6 も参照）。

**恒久対策**:

- CLAUDE.md「完了ごとの必須チェック」を毎回実行（Console ゼロ・4タブ・Chart.js 失敗時）。その自動化が `make verify`。根拠: [`../CLAUDE.md`](../CLAUDE.md)「完了ごとの必須チェック（退行防止）」。
- ※ `verify` 系は Playwright ブラウザに依存するため CI（`ci.yml`）には含めない（CI はブラウザ非依存を維持）。手元で回す。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md)「デプロイ（CI/CD）」＋ 進捗ログ（verify を CI に含めずブラウザ非依存を維持）。

---

## 6. ロールバック手順

**症状**: 直近の main へのマージが退行を招いた。前の正常な状態へ戻したい。

**原則**: **`git revert` で戻す。`git push --force` はしない**（履歴を壊さない・他所の作業を消さない）。root/CLAUDE.md の integrity 方針「差分を最小化・ゼロから書き直さない」に整合。根拠: [`../CLAUDE.md`](../CLAUDE.md)「絶対に守る制約」。

**手順**:

1. 問題のコミットを特定（`git log --oneline`）。
2. revert して戻す:

   ```bash
   git revert <bad-sha>        # 複数なら範囲/個別で。マージコミットは -m 1 が要る場合あり
   git push                    # main へ（force-push しない）
   ```

3. **Pages は自動反映** — main への push で `deploy.yml` が走る。根拠: [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)（`on: push: branches:[main]`）。
4. **AWS は条件つき自動＋必要なら手動** — `web/`・`content/` に触れる revert なら `deploy-aws.yml` が自動で走る（`vars.S3_BUCKET` 設定時）。走らない/急ぐときは `make aws-deploy` で手動反映。根拠: [`../.github/workflows/deploy-aws.yml`](../.github/workflows/deploy-aws.yml)（`paths: web/** content/**`、`if: vars.S3_BUCKET != ''`）＋ [`../Makefile`](../Makefile)（`aws-deploy`）。
5. 反映後、古いキャッシュが残るなら §4（SW キャッシュ／案内文）を併用。
6. revert したことを `npm run check` と `npm run verify` で確認してから完了とする。根拠: [`../package.json`](../package.json)。

**禁止**: `git push --force`（および `--force-with-lease` を安易に使うこと）。iCloud 同期下では `.git` 競合コピー事故と重なると復旧困難になる。根拠: [`DEVELOPMENT.md`](DEVELOPMENT.md)「運用上の注意」＋ [`session-handoff.md`](session-handoff.md)「禁止事項」。

---

## 7. 委任エージェント関連（セッション上限で停止した）

**症状**: Opus サブエージェントへ委任したタスクが、セッション使用量の上限などで**報告前に停止**した。成果物が中途に見える。

**前提（このプロジェクトの記憶は git と md にある）**: 委任先は**コミット禁止**で、成果物はワークツリーに書き込むだけ。親セッションがレビュー → 検証 → コミットする運用。停止しても**書き込み済みファイルは残る**ため、親が回収できる。根拠: [`../CLAUDE.md`](../CLAUDE.md)「開発ツールの方針 > 委任プロトコル」（サブエージェントはコミット禁止／親がレビュー・検証・コミット）＋ [`../AGENTS.md`](../AGENTS.md)（同要旨）。実例（T39/T43 が上限で停止したが成果物は書き込み済み → 親がレビュー・検証）は [`../CLAUDE.md`](../CLAUDE.md) 進捗ログ「T39〜T44」節。

**回収手順**:

1. ワークツリーの差分を確認: `git status` / `git diff`（委任先が書いたファイルがそのまま残っている）。
2. 仕様書（[`task-spec-template.md`](task-spec-template.md) 形式）の受け入れ条件を**親が必ず再実行**する（自己申告の green を鵜呑みにしない）:
   - 最低 `npm run check` green。
   - アプリ（`web/`）に触れていれば `npm run verify` も green。
   - 根拠: [`../CLAUDE.md`](../CLAUDE.md)「委任プロトコル」（**受け入れコマンドは親が必ず再実行**）＋ [`../AGENTS.md`](../AGENTS.md)。
3. 問題なければ親がレビューして commit（英語メッセージ）。
4. セッションの引き継ぎ・ログアウト・アカウント切替の全手順は [`session-handoff.md`](session-handoff.md) に一本化。終了前は `make handoff`。根拠: [`session-handoff.md`](session-handoff.md)＋ [`../Makefile`](../Makefile)（`handoff` → [`../scripts/handoff-check.sh`](../scripts/handoff-check.sh)）。

**恒久対策**:

- 委任は自己完結タスク（新規の独立ファイル・翻訳・データ）に限る。本体コアの外科手術や i18n/sw の整合が絡む改修は直営。根拠: [`../CLAUDE.md`](../CLAUDE.md)「委任してよい／委任しない」。
- 停止に備え、md（CLAUDE.md / PROGRESS.md / TODO.md）へ進捗を書き残す運用を維持。根拠: [`session-handoff.md`](session-handoff.md)「何が引き継がれ、何が引き継がれないか」。

---

## 8. ブランチ保護と bot 運用（ruleset・デプロイキー）

**背景**: 2026-07-12 に classic branch protection を有効化した翌朝、`weekly-rotate.yml` の
`GITHUB_TOKEN` による `main` への直 push が `GH006` で拒否され、週次ローテが失敗した（IN-14）。
調査・試行錯誤の末、**ruleset + デプロイキー直接 push** が最終解として確立・実装済み（コミット a7ec3ce）。

---

### 8-1. ローテが GH006 で失敗した（切り分け）

**症状**: `weekly-rotate.yml` のログに `GH006 Protected branch update failed` が出る。

**切り分け**:

1. **classic protection が有効になっていないか確認**:
   ```bash
   gh api repos/larai-w/social-system-debugger/branches/main/protection 2>&1
   ```
   `404` なら classic protection なし（正常）。値が返ってきたら classic protection が有効 → 後述の対処。

2. **ruleset の状態を確認**:
   ```bash
   gh api repos/larai-w/social-system-debugger/rulesets/18896897
   ```
   `bypass_actors` に `repository_roles` の `"name": "deploy_key"` が含まれているかを確認する。
   含まれていない場合、デプロイキーのバイパスが効いておらず、直 push が拒否される原因になる。

3. **`WEEKLY_ROTATE_DEPLOY_KEY` シークレットが正しく設定されているか確認**:
   - GitHub → Settings → Secrets → Actions で `WEEKLY_ROTATE_DEPLOY_KEY` の有無を確認。
   - シークレットは存在しても値の妥当性は確認できないため、もし疑わしければ後述のデプロイキーローテ手順で再生成する。

**根拠**: `weekly-rotate.yml`（`ssh-key: ${{ secrets.WEEKLY_ROTATE_DEPLOY_KEY }}` で checkout し
`git push origin HEAD:main`）。ruleset id 18896897（名称 "main protection (CI gate, deploy-key bypass)"）。

---

### 8-2. デプロイキーのローテ手順

既存のデプロイキーが失効・漏洩した場合、または定期ローテ時の手順。

```bash
# 1. 新しい SSH キーペアを生成（パスフレーズなし・ファイルは作業後に削除）
ssh-keygen -t ed25519 -C "weekly-rotate deploy key" -f /tmp/weekly_rotate_key -N ""

# 2. GitHub リポジトリに公開鍵を登録（title は任意）
#    deploy key id 157203959 が既存キー — 削除してから新規登録する
gh api -X DELETE repos/larai-w/social-system-debugger/keys/157203959
gh api -X POST repos/larai-w/social-system-debugger/keys \
  -f title="weekly-rotate deploy key $(date +%Y%m%d)" \
  -f key="$(cat /tmp/weekly_rotate_key.pub)" \
  -F read_only=false

# 3. 秘密鍵を Actions シークレットに登録
gh secret set WEEKLY_ROTATE_DEPLOY_KEY --repo larai-w/social-system-debugger \
  < /tmp/weekly_rotate_key

# 4. 作業ファイルを削除
rm /tmp/weekly_rotate_key /tmp/weekly_rotate_key.pub
```

新しいデプロイキーの id を記録しておくこと（`gh api repos/larai-w/social-system-debugger/keys` で確認可）。

**根拠**: `weekly-rotate.yml`（`actions/checkout` の `ssh-key` 入力でデプロイキー checkout）。

---

### 8-3. 絶対にやらないこと（bot による PR 自動マージ）

> **「GITHUB_TOKEN で PR を作り、CI 通過後に自動マージする」方式は、このリポジトリ構成では完全自動化不可能と実証済みである（IN-17）。再挑戦しないこと。**

理由（2点）:

1. **CI が発火しない**: `GITHUB_TOKEN` が作成した PR は、GitHub の再帰防止ポリシーにより
   `pull_request` イベントの CI ジョブが発火しない。`workflow_dispatch` で CI を明示起動しても、
   後から到着する「承認待ち（action_required）の pull_request 実行」が競合して PR は BLOCKED のまま。

2. **承認 API は fork PR 専用**: 非 fork PR に対する `/approve` API は HTTP 403 で拒否される。
   承認要件を 0 にしても、CI が通過しない限り BLOCKED は解消しない。

代替案は存在しない（これは GitHub のプラットフォーム設計上の制約）。
週次ローテのような自動コミットは「デプロイキーで直接 push」一択。

---

### 8-4. classic protection と ruleset の二重設定に注意

> `make protect`（`scripts/setup-branch-protection.sh`）は **実行禁止**。

`make protect` は classic branch protection を設定するスクリプトであり、
現在は ruleset（id 18896897）に移行済み。両方を有効にすると以下の問題が発生する:

- classic protection はデプロイキーのバイパスを認識しない → 週次ローテが再び GH006 で失敗する（IN-14 の再発）。
- `make protect` の実行は設定の二重化であり、解決よりも問題を増やす。

`make protect` を実行したくなった場合は、まずこの節を読んで ruleset の状態を確認すること。
ruleset の設定確認・変更は GitHub Web UI（Settings → Rules → Rulesets → id 18896897）か
`gh api` で行う。

現在の ruleset 設定概要:

| 項目 | 値 |
|---|---|
| ruleset id | 18896897 |
| 名称 | "main protection (CI gate, deploy-key bypass)" |
| 必須チェック | `web`, `infra` |
| linear history | 必須 |
| force push/削除 | 禁止 |
| バイパス | DeployKey, Repository admin |

**根拠**: `scripts/setup-branch-protection.sh`（現在は実行禁止の表示のみ）・`TODO.md` ☐3 の完了注記。

---

## 付録: この文書のメンテナンス

- 手順が実装とずれたら、**先に実装（ワークフロー / `sw.js` / スクリプト）を正**として本書を直す。各手順の根拠パスを頼りに追随する。
- URL・アカウントID 等の環境固有値は [`../CLAUDE.md`](../CLAUDE.md) 進捗ログと [`DEVELOPMENT.md`](DEVELOPMENT.md) を一次ソースとし、本書は参照で軽く保つ。
