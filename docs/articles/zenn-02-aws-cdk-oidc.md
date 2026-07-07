---
title: "個人開発の静的サイトを S3+CloudFront+CDK に載せ、GitHub Actions(OIDC) で長期キーなしデプロイにした話"
emoji: "🔐"
type: "tech"
topics: ["aws", "cdk", "cloudfront", "githubactions", "oidc"]
published: false
---

> **ドラフト**（MARKETING.md 記事2）。公開前チェック: ①アカウントID等の伏せ字確認 ②URL最終確認 ③Xの投稿と同日に公開。

## 前提

「社会デバッガー」という教育用シミュレーター（静的Webアプリ）を個人開発しています。もともと GitHub Pages で公開していて、それは今も動いています。その上で、次の理由から AWS 配信を**追加**しました。

- 週替わりコンテンツ（JSON）を、アプリ本体より短いキャッシュで配信したい
- 将来のフェーズ（API Gateway + Lambda + DynamoDB の共同カウンター）への足場
- 就活・出願向けに「設計判断を語れるインフラ」を自分の手で持ちたい

方針は「**Pages 維持＋AWS 追加**」。既存URLは1文字も変えません。切り替えではなく並行運用です。

## 構成: S3(非公開) + CloudFront(OAC)、CDK(TypeScript)

```
GitHub Actions ──OIDC──▶ IAM Role ──▶ S3 (private) ◀─OAC── CloudFront ──▶ ユーザー
```

- **S3**: `BlockPublicAccess.BLOCK_ALL`・SSE・`enforceSSL`。バケットは完全非公開で、直アクセスは403
- **CloudFront**: OAC（Origin Access Control）経由でのみ S3 を読む。403/404 は `index.html` へ（SPA的フォールバック）
- **キャッシュ設計**: 既定ビヘイビアは長TTL。ただし `content/weekly/latest.json` だけ**専用ビヘイビアで5分TTL** — 週替わりコンテンツの「新鮮さ」とアプリ本体の「キャッシュ効率」を分離
- すべて CDK(TS)。`cdk-nag`（AWS Solutions ルール）を組み込み、警告6件は理由付きで抑制

### なぜ Docker を使わないのか

このスタックは**静的配信＋サーバーレスで、常駐プロセスが1つもありません**。コンテナ化すべき「動き続けるプロセス」が無い以上、Docker はイメージ管理・パッチ・常時課金という運用コストを増やすだけです。

コンテナが正当化されるのは、WebSocket 常時接続や重いバックグラウンドジョブが必要になったとき（その時は Fargate を検討）。次フェーズの共同カウンター程度なら API Gateway + Lambda + DynamoDB で足り、やはりコンテナは不要 — という判断を README に明文化しています。「使わなかった技術を、理由付きで語れる」ことは、使った技術の列挙より設計の証明になると思っています。

## デプロイ: OIDC で長期キーをゼロに

GitHub Actions からのデプロイに、アクセスキーは1つも発行していません。**GitHub の OIDC プロバイダを信頼する IAM ロール**を CDK で作り、Actions が毎回短命トークンで AssumeRole します。

信頼ポリシーは main ブランチに限定:

```
repo:<owner>/<repo>:ref:refs/heads/main
```

権限は**デプロイに必要な最小限だけ**:

- S3: `List` / `Get` / `Put` / `Delete`（対象バケットのみ）
- CloudFront: `CreateInvalidation`（対象ディストリビューションのみ）

`cdk deploy` の権限は**意図的に含めていません**。インフラ変更は人間がローカルで、コンテンツ更新だけがCIの仕事、という分離です。ワークフローは main への push で S3 同期 →（キャッシュが長い）`index.html` と `latest.json` **だけ**を無効化します。ハッシュ付きアセット運用なら全体無効化は不要で、Invalidation のコストも抑えられます。

## 個人開発ならではのハマり所 2 つ

**1. GitHub OIDC プロバイダはアカウントに1つしか作れない**

過去に他のプロジェクトで作った `token.actions.githubusercontent.com` のプロバイダが既にあると、CDK の新規作成が衝突します。既存 ARN をコンテキストで渡して再利用する逃げ道を用意しました:

```bash
cdk deploy -c existingOidcProviderArn=arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com
```

**2. macOS 標準の bash 3.2 と `set -u` の組み合わせ**

デプロイスクリプトで空配列を展開したら `unbound variable` で死にました。bash 3.2 では空配列の `"${ARR[@]}"` が未定義扱いになります。ガード付き展開が正解:

```bash
aws s3 sync ... ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}
```

## 運用の自動化: 「デプロイ後の手作業」を1コマンドに

CDK の出力（ロールARN・バケット名・ディストリビューションID・ドメイン）を GitHub の Secrets/Variables に手で写経するのが一番ミスる工程だったので、`make aws-wire` に固めました。中身は CDK 出力を読んで `gh` CLI で Secrets/Variables を設定し、配信元URLを `web/config.js` に書き込むシェルスクリプトです。

```bash
make aws-bootstrap   # 初回のみ
make aws-deploy      # スタック作成 + S3同期
make aws-wire        # CDK出力 → GitHub Secrets/Variables + config.js
```

## コスト

このワークロード（静的配信・個人開発規模）は AWS 無料枠にほぼ収まります。常駐リソースがないので、「使われなければ請求もほぼゼロ」。教育用・非営利のプロジェクトを続ける上で、この性質は構成そのものより大事かもしれません。

---

アプリはこちら（無料・ブラウザで60秒で試せます）: https://larai-w.github.io/social-system-debugger/

※アプリは架空のシミュレーションです。特定の誰かではなく、どの社会にも起こる構造の話を扱っています。
