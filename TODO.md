# TODO（あなたが手を動かす作業）

> コード側はすべて完了・push 済み。ここに残っているのは **人間の認証情報や GUI が必要で自動化できない作業** だけ。
> 各項目は独立。時間のある時に上から順に消化すればOK。所要時間の目安つき。
> 全体の運用コマンドは `make help`。セッション終了前は `make handoff`。

## 所要時間の目安とおすすめプラン

| # | 作業 | 正味 | 初回セットアップ込み | 難易度 |
|---|---|---|---|---|
| ☐1 | 本番サイト目視確認 | 5分 | 5分（不要） | かんたん |
| ☐2 | Actions 自動デプロイ有効化 | 10分 | +15分（`gh` 導入・認証）→ 計25分 / Web UI手動なら10分 | 普通 |
| ☐3 | main ブランチ保護 | 5分 | ☐2で `gh` 済みなら5分 | かんたん |
| ☐4 | Capacitor 実機（任意） | 30〜60分 | iOS +15分（cocoapods）/ Android +30〜60分（Studio+JDK17）| やや重い |

**おすすめの進め方（急ぎでなければ）:**
- **最小限（約5分）**: ☐1 だけ。本番はもう動いているので、これで「公開できている」を確定できる。
- **一区切り（約30〜40分・1回のまとまった時間）**: ☐2（`gh` 導入→`make aws-wire`）＋ついでに ☐3（`make protect`）。以後は push だけで AWS 自動更新＋退行が main に入らなくなり、運用が完全に楽になる。
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

## ☐ 1.（推奨・最優先）本番サイトの目視確認 — 5分

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
