# TODO（あなたが手を動かす作業）

> ここに残っているのは **人間の認証情報や GUI・実機が必要で自動化できない作業** だけ。
> 各項目は独立。時間のある時に上から順に消化すればOK。所要時間の目安つき。
> 全体の運用コマンドは `make help`。セッション終了前は `make handoff`。
> ※戦略実装スプリント（2026-07-07、`PROGRESS.md` 参照）で ☐0・☐5〜☐7 が追加。

## 所要時間の目安とおすすめプラン

| # | 作業 | 正味 | 初回セットアップ込み | 難易度 |
|---|---|---|---|---|
| ~~☐0~~ | ~~**`git push`（未pushコミットあり）**~~ | ~~1分~~ | ~~1分~~ | ✅ 完了 |
| ~~☐1~~ | ~~本番サイト目視確認~~ | ~~5分~~ | ~~5分（不要）~~ | ✅ 完了 |
| ~~☐2~~ | ~~Actions 自動デプロイ有効化~~ | ~~10分~~ | ~~計25分~~ | ✅ 完了（2026-07-12・`make aws-wire` で Secrets/Variables 設定済） |
| ~~☐3~~ | ~~main ブランチ保護~~ | ~~5分~~ | ~~5分~~ | ✅ 完了（2026-07-12・`make protect`・CI必須 web/infra） |
| ☐4 | Capacitor 実機（任意） | 30〜60分 | iOS +15分（cocoapods）/ Android +30〜60分（Studio+JDK17）| やや重い |
| ☐5 | 30秒リールを録画して X 固定ポストに | 15分 | 15分 | かんたん |
| ☐6 | 教員向け1枚ガイドを PDF 化（**自動化済み** `make classroom-pdf`） | 0分 | 0分 | 自動 |
| ☐7 | リポジトリの iCloud 外移設（推奨） | 15分 | 15分 | 普通 |

**おすすめの進め方（急ぎでなければ）:**
- **最小限（約6分）**: ☐0 → ☐1。push で Pages 再デプロイ＋今回の classroom.html/エクスポート機能が公開される。
- **一区切り（約30〜40分・1回のまとまった時間）**: ☐2（`gh` 導入→`make aws-wire`）＋ついでに ☐3（`make protect`）。以後は push だけで AWS 自動更新＋退行が main に入らなくなり、運用が完全に楽になる。
- **発信の初手（約20分）**: ☐5＋☐6。X 固定ポストと教員打診用の素材が揃う（20人フェーズの入口）。
- **フル（+1〜2時間）**: ☐4。iOS だけなら +45分程度、Android 含むと初回1〜2時間。実機・署名が絡むので時間に余裕のある日に。後回しでも本番Webの価値は不変。

---

## 現状のライブ環境（参照用）

- **本番サイト（AWS）**: https://d3gpx0wi0z904j.cloudfront.net/ ← 既に公開・動作確認済み
- **GitHub Pages**: 従来URLも並行稼働（push で自動更新）
- AWS: account `339712703146` / region `ap-northeast-1`

| リソース | 値 |
|---|---|
| CloudFront ドメイン | `d3gpx0wi0z904j.cloudfront.net` |
| DistributionId | `E10GS6FTY148VM` |
| S3 バケット | `socialdebuggerstack-sitebucket397a1860-ng9iqq3c1fr7` |
| デプロイロール ARN | `arn:aws:iam::339712703146:role/ssd-github-deploy` |

---

## ✅ ~~☐ 1.（推奨・最優先）本番サイトの目視確認 — 5分~~

ブラウザで https://d3gpx0wi0z904j.cloudfront.net/ を開き、CLAUDE.md の「完了ごとの必須チェック」を実施:

- [ ] Console にエラーが 1 件もない
- [ ] 全4タブ遷移・プリセット1つ・スライダー操作でエラーゼロ
- [ ] Chart.js がブロックされても他機能が動く（グレースフル・デグラデーション）

---

## ☐ 2. GitHub Actions で「push→自動デプロイ」を有効化 — 10分

`gh` CLI が未導入のため自動配線できず。以下のどちらか。

### 方法A（推奨）: gh CLI で一括
```bash
brew install gh        # もしくは https://cli.github.com/
gh auth login
make aws-wire          # CDK出力から Secrets/Variables と web/config.js を自動設定
```

### 方法B: GitHub Web UI で手動
リポジトリ → **Settings → Secrets and variables → Actions** で以下を登録:

| 種別 | キー | 値 |
|---|---|---|
| **Secret** | `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::339712703146:role/ssd-github-deploy` |
| Variable | `AWS_REGION` | `ap-northeast-1` |
| Variable | `S3_BUCKET` | `socialdebuggerstack-sitebucket397a1860-ng9iqq3c1fr7` |
| Variable | `CLOUDFRONT_DIST_ID` | `E10GS6FTY148VM` |
| Variable | `CLOUDFRONT_DOMAIN` | `d3gpx0wi0z904j.cloudfront.net` |

> 未設定でも今の手動デプロイ済みサイトは動く。設定すると以後 `main` への push で AWS も自動更新。
> 手動で再デプロイしたい時はいつでも: `make aws-deploy`
> ※未設定の間、Actions の「Deploy to AWS」は**灰色（skipped）**で表示される。これは意図した挙動（赤=失敗にしない設計）。設定後に緑で動き始める。

---

## ☐ 3. main ブランチ保護（退行防止）— 5分

CI（web / infra）が緑でないと main にマージできなくする。`gh` 導入済みなら:
```bash
make protect
```

`gh` なしなら Web UI: **Settings → Branches → Add rule**
- Branch name pattern: `main`
- ☑ Require status checks to pass →  `web` と `infra` を追加 / ☑ Require branches up to date
- ☑ Require linear history / ☐ Allow force pushes / ☐ Allow deletions
- Required approvals: 0

> 注意: `ci.yml` は PR 時のみ実行。保護を入れて初めて全変更に CI が掛かる（現在の main 直 push では CI 未実行）。

---

## ☐ 4.（任意）Capacitor 実機ビルド — 30〜60分

ネイティブ機能（通知・触覚・共有シート）の実挙動確認。GUI と署名が必要。

> **ストア審査提出まで通す場合の詳細ランブックは `docs/store-submission.md`**（appId 確定 → cap add/sync → iOS(TestFlight)／Android(内部テスト) → 審査対策 → 提出後対応まで、上から順に実行できる1本）。

### iOS
```bash
sudo gem install cocoapods      # brew が無いので gem で
npx cap add ios
npx cap sync ios
npx cap open ios                # Xcode で署名Team設定 → 実機/シミュレータ実行
```

### Android
Android Studio + JDK17 を導入後:
```bash
npx cap add android
npx cap open android
```

> `capacitor.config.json` の `appId`（現 `dev.socialdebugger.app`）を自分の逆ドメインに変更すること。

---

## ✅ ~~☐ 0.（最優先）git push — 1分~~

戦略実装スプリントのコミット（テスト基盤・エクスポート・共有最適化・classroom.html・リール・CI強化・記事ドラフト）が未push。

```bash
git push
```

> push で GitHub Pages が再デプロイされ、`…/classroom.html` とアプリの新機能（📊 エクスポート等）が公開される。
> AWS 側は ☐2 完了後は自動、未完了なら `make aws-deploy` で手動反映。

---

## ☐ 5. 30秒リールを録画して X 固定ポストに — 15分

1. スマホで開く: Mac でリポジトリ直下から `python3 -m http.server 8000` → 同じWi-Fiのスマホで
   `http://<MacのIP>:8000/promo/reel-30s.html`（または `reel-30s.html` を AirDrop して開くだけでも動く）。
2. 全画面表示 → 画面録画 → 30秒撮って止めるだけ（PAUSE/RESTART ボタンは右下・ほぼ透明）。
   Mac だけで済ませるなら: Chrome のウィンドウを縦長にして QuickTime の画面収録でも可。
3. X のプロフィール固定ポストに動画＋Web版URLを投稿。
   - **投稿文に必ず「※演出用に簡略化したデモ映像です」を添える**（制作規約）。
   - ハッシュタグは `#社会デバッガー`（アプリ内の共有と同じ固定タグ）。
   - リールは2本ある: `promo/reel-30s.html`（防災/P2）と `promo/reel-30s-history.html`（歴史/P1・安全版はこちらを先に）。
   - **英語版の録画は URL 末尾に `?lang=en`**（Show HN 用。文言はアプリの実EN i18n）。
   - **本物のエンジンで録りたい場合**: アプリ本体を `?demo=1` 付きで開くと、ゴーストカーソルが
     ワイマール崩壊→介入→回復を自動再生（ループ）。これを画面録画すれば「実物と完全一致」の映像になる
     （この場合「演出用デモ」の注記は不要）。

## ☐ 6. 教員向け1枚ガイドを PDF 化 — **自動化済み（手動印刷は不要）**

```bash
make classroom-pdf     # dist/classroom.pdf と dist/classroom.en.pdf を生成（A4・白地・print メディア）
```

教員打診のたびに上記1コマンドで最新の PDF（日/英）が `dist/` に得られる。
OUTREACH.md の教員向け雛形で打診するとき、URLと一緒にこの PDF を添付する。
（従来の手動手順＝ブラウザで `web/classroom.html` を開いて Ctrl/Cmd + P → PDF保存、も引き続き可能。）

## ☐ 7.（推奨）リポジトリを iCloud 外へ移設 — 15分

`~/Documents` は iCloud 同期対象のため、**編集中に競合コピー（`ui 2.js` 等）が生成される事故が複数回発生**
（2026-07-07 のスプリント中にも3ファイル発生 → diff確認の上で削除済み）。

```bash
mkdir -p ~/dev && mv ~/Documents/veai_ecosystem/social-system-debugger ~/dev/
cd ~/dev/social-system-debugger && git status   # クリーンであることを確認
```

> 移設後、ターミナル・エディタのブックマークとClaude Codeの作業ディレクトリを新パスに更新。

---

## 別マシンでの初回セットアップ補足

`make verify`（ブラウザ検証）を新しいマシンで使う場合は、初回のみ:
```bash
npx playwright install chromium
```

---

## ☐ 8.（20人フェーズ開始後）ユーザーインタビュー 5人 — 15分×5

最初のユーザーが付いたら、`docs/interview-guide.md` のスクリプトで15分インタビューを5人以上。
記録は同ガイドのテンプレ行で `docs/interview-log.md` に追記（ファイルは初回に作成）。
5人たまったら PM.md の優先度を見直す。**返信・反映報告は1週間以内**（OUTREACH と同じ作法）。

## ☐ 9.（告知開始の週に）アナリティクス有効化 — 10分

現状 `track()` は no-op（スクリプト未導入）で、**KPI イベントは1件も記録されていない**。
選択肢と手順は `docs/kpi-log.md` の表を参照。推奨は 20人フェーズの告知開始と同じ週に
Plausible（30日トライアル）を有効化 → `web/index.html` のコメントアウト済み script 行を解除して push。
以後、毎週日曜に `docs/kpi-log.md` へ1行記入。

## ☐ 10.（余裕のある時に）Zenn記事3の質問票に回答 — 15分

`docs/articles/zenn-03-interview.md` の10問に箇条書きで回答（雑なメモでOK・skip可）。
埋まったら Claude Code に「記事3を仕上げて」と頼めば、骨子どおりに執筆します。

## ✅ ~~☐ 12. Dependabot PR の後始末 — 5分（GitHub Web で手動）~~

CI の潜在バグ（Node 20 と test グロブの非互換）は main で修正済み（2c0c8aa）。
Dependabot PR は**古い main から分岐しているため、rebase するまで赤いまま**。手順:

1. リポジトリ → Pull requests を開く。
2. **PR #11〜#18（chore(ci)/chore(deps-infra) の8本）それぞれ**にコメント: `@dependabot rebase`
   → Dependabot が修正済み main に載せ直し、CI が緑になる。
3. 緑になったら: **マイナー/パッチ（checkout, setup-node, pages系, @types/node）はそのままマージ可**。
   **メジャー2本（typescript 6.x / cdk-nag 3.x）はマージ前に Claude Code に「PR #15 と #16 をレビューして」と依頼**（挙動変更の確認）。
4. **PR #10「Add files via upload」（development ブランチ）は心当たりがなければ Close**（古い手動アップロードの残骸）。

> ☐11 で gh 導入済みなら `gh pr comment 18 --body "@dependabot rebase"` の形で一括も可。

## ✅ ~~☐ 11.（就活準備・おすすめ）GitHub Issues をポートフォリオ化 — 10分~~

**完了（2026-07-12）**: `make gh-project` で開発履歴を英語 Issues **96件**＋マイルストーン4件
（Delegation sprints T25–T89 ほか）として一括バックフィル済み。
以後の運用（新タスクは英語で起票 → 完了コミット末尾に `Closes #N`）は `docs/github-project.md`。

> `gh` CLI は Homebrew 無しで `~/.local/bin/gh`（v2.96.0）に導入済み・PATH 済み・認証済み（larai-w）。
> 以後 `make protect` / `make aws-wire` / `gh pr` 等がそのまま使える。

## 週替わりシナリオの在庫メモ（自動運用の前提）

- 在庫は **2027-W01（2027/1/4の週）まで**＝年末年始を無人で越せる。毎週月曜 0:00 JST に `weekly-rotate.yml` が自動切替。
- **在庫が無い週はワークフローが赤く失敗して通知が来る**＝それが「書き足して」のリマインダー。
  さらに `npm run check` が残り3週を切ると警告を出す（T42）。
  補充は Claude Code に「2027-W02 以降のシナリオを4週分作って」と頼めばよい（到達可能性CIが受け入れを自動判定する完全委任運用が確立済み＝T40/T65）。

---

## セッション終了前チェック

```bash
make handoff     # 競合コピー / 未コミット / 未push / テスト を一括検証
```

## よく使うコマンド

| やりたいこと | コマンド |
|---|---|
| 全コマンド一覧 | `make help` |
| ローカルでCI相当を実行 | `make check`（= test + 週次JSON + eslint + prettier）|
| AWS に手動再デプロイ | `make aws-deploy` |
| ローカルサーバー起動 | `make serve` |
