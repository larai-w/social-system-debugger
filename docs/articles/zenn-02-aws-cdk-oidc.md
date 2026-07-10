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

執筆時点で AWS 側は**本番デプロイ済み・ライブ**です（東京リージョン・CloudFront ドメインで HTTP 200、S3 直アクセスは 403＝OAC が効いている状態）。以下は「synth が通った」話ではなく、実際にデプロイして踏んだ話です（アカウントID・バケット名・ディストリビューションIDは伏せ字で書きます）。

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

## 実際に踏んだハマり所 2 つ（synth では出ない・deploy で出た）

この2つは `cdk synth` では一切表面化せず、**本番デプロイの当日に踏みました**。個人開発でアカウントを使い回していると、まさに刺さる類のものです。

**1. GitHub OIDC プロバイダはアカウントに1つしか作れない**

過去に他のプロジェクトで作った `token.actions.githubusercontent.com` のプロバイダが既にアカウントにあると、CDK の新規作成が `EntityAlreadyExists` で衝突します。CDK が「無ければ作る／有れば使う」を自動で判断してくれるわけではないので、既存 ARN をコンテキストで渡して再利用する逃げ道を用意しました（実際にこれで抜けました）:

```bash
cdk deploy -c existingOidcProviderArn=arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

Makefile の既定ターゲットにはこのコンテキストが入っていないので、既存プロバイダのあるアカウントでは**手で渡すか Makefile を拡張する**必要がある、というのも実運用で分かった注意点です。

**2. macOS 標準の bash 3.2 と `set -u` の組み合わせ**

デプロイスクリプト（`infra/scripts/deploy.sh`）が `set -u` 下で空配列 `"${PROFILE_ARGS[@]}"` を展開した瞬間、`unbound variable` で落ちました。macOS 同梱の bash 3.2 では**空配列の `"${ARR[@]}"` が未定義扱い**になるためです（新しめの bash では起きない）。ガード付き展開に直して解決:

```bash
aws s3 sync ... ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}
```

どちらも「クラウド側の設計」ではなく「手元の環境と履歴」に起因するバグで、synth の緑では検出できない。個人開発でインフラを自分の手で通す価値は、こういう所に出ると思います。

## 運用の自動化: 「デプロイ後の手作業」を1コマンドに

CDK の出力（ロールARN・バケット名・ディストリビューションID・ドメイン）を GitHub の Secrets/Variables に手で写経するのが一番ミスる工程だったので、`make aws-wire` に固めました。中身は CDK 出力を読んで `gh` CLI で Secrets/Variables を設定し、必要なら配信元URLを `web/config.js` に書き込むシェルスクリプトです。

なお今回は CloudFront が本体と週替わりJSONを**同一オリジン**で配信するので、`web/config.js` の `contentBaseUrl` は空（相対）のままで動きます。別オリジンから content を引く構成になったときだけ、ここに絶対URLが入る、という切り分けです。

```bash
make aws-bootstrap   # 初回のみ
make aws-deploy      # スタック作成 + S3同期
make aws-wire        # CDK出力 → GitHub Secrets/Variables + config.js
```

## セキュリティ追加: CSP メタと gitleaks

### CSP メタ — 外部依存ゼロ化を防御に転化

Chart.js をセルフホスト化して外部依存をゼロにしたタイミングで、Content Security Policy を `<meta http-equiv="Content-Security-Policy">` として HTML に埋め込みました（CloudFront のレスポンスヘッダーポリシーではなく、HTML 側で宣言することで Pages/AWS どちらでも同じ保護が効きます）。

ポリシーの骨格は次のとおりです:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://plausible.io;
connect-src 'self' https://formspree.io https://plausible.io;
object-src 'none';
base-uri 'self';
```

`script-src` に `'unsafe-inline'` が残っているのは、HTML 内のインラインスクリプトを全部外出しにするリファクタリングコストが高すぎるためです（33万文字の既存コードに手を入れない、という制約と同じ理由）。ただし `object-src 'none'` で Flash/object 系は完全遮断し、`connect-src` で通信先をホワイトリスト化しています。「外部依存ゼロ化」は当初パフォーマンスと可用性のために行いましたが、CSP を有効にしてみると**防御の副産物**でもあったことが分かりました。外部スクリプトが1本もなければ、`script-src` を `'self'` に近い形に保てます。

### gitleaks によるシークレットスキャン

OIDC でアクセスキーをゼロにしたとしても、過去のコミット履歴にうっかり秘密情報が混入するリスクは別の話です。そこで `.github/workflows/secret-scan.yml` に gitleaks-action v2 を追加し、毎 push および PR で `fetch-depth: 0`（全 git 履歴）を走査するようにしました。

「長期キーを発行しない設計」と「シークレットが漏れていないことを継続的に確認する CI」は、セキュリティの別々のレイヤーをカバーします。OIDC で入り口を塞いでも、コードに書かれた秘密情報の流出は防げないため、両方が必要です。

## CI バグの実体験: Node のバージョン変更が依存 PR で露呈した話

Dependabot が送ってくる依存更新 PR が、ある時期から一斉に CI red になりました。最初は `actions/checkout` などの Actions バージョン更新が原因だと思い込みましたが、調べると真因は別の場所にありました。

CI のテストは `node --test` のグロブ展開（`tests/*.test.mjs` のような指定）に依存していました。このグロブ展開は **Node 21 以降の機能**で、Node 20 ではシェルが展開しない限り動きません。プロジェクトの CI は Node 20 で固定されていたため、PR ワークフローが初めて走るまで（= ブランチ保護がかかってテストが実行されるまで）この非互換が表面化していませんでした。

対処は2ステップです:

1. CI の Node バージョンを 22 に変更（LTS として安定）
2. `package.json` のテストコマンドを `node --test tests/*.test.mjs` ではなく、シェルがグロブを展開する形式に修正（`node --test $(ls tests/*.test.mjs)` など）

教訓は「**依存更新 PR が一斉に red になったとき、原因は依存そのものではなく CI 環境の前提が変わった可能性がある**」です。Dependabot PR はタイミングを揃えて来る傾向があるため、実は以前から潜んでいたバグが複数 PR の初実行で一気に露呈することがあります。

## コスト

このワークロード（静的配信・個人開発規模）は AWS 無料枠にほぼ収まります。常駐リソースがないので、「使われなければ請求もほぼゼロ」。教育用・非営利のプロジェクトを続ける上で、この性質は構成そのものより大事かもしれません。

---

アプリはこちら（無料・ブラウザで60秒で試せます）: https://larai-w.github.io/social-system-debugger/

※アプリは架空のシミュレーションです。特定の誰かではなく、どの社会にも起こる構造の話を扱っています。
