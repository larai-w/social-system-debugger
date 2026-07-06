# インフラ (AWS CDK) — 社会デバッガー 配信基盤

フェーズ1の配信基盤を **AWS CDK (TypeScript)** で IaC 定義したもの。
「静的配信＋サーバーレス」に振り切った**意図的に最小の構成**です。

---

## ユーザーが設定する箇所（デプロイ前チェックリスト）

- [ ] AWS 認証情報（`aws configure` もしくは SSO）
- [ ] 環境変数（プレースホルダ）:
  - `CDK_DEFAULT_ACCOUNT` = 12桁のアカウントID
  - `CDK_DEFAULT_REGION` = 例 `ap-northeast-1`（東京）
  - `AWS_PROFILE` = 任意
- [ ] 初回のみ: `npm run bootstrap`
- [ ] `npm run synth` で構成確認（**本タスクで検証済み**）
- [ ] `npm run deploy:stack`（`cdk deploy`）→ 続けて `npm run deploy`（資産同期）
- [ ] 出力 `DistributionDomainName` を `web/js/scenario.js` の
      `CONTENT_BASE_URL`（`https://<domain>/content/weekly`）へ反映
- [ ] （任意）カスタムドメイン: `lib/social-debugger-stack.ts` のコメント参照
      （CloudFront 用証明書は **us-east-1 の ACM 必須**）

---

## 構成図

```mermaid
flowchart LR
    U[ユーザー / ネイティブアプリ] -- HTTPS --> CF[CloudFront<br/>REDIRECT_TO_HTTPS]
    CF -- OAC 署名リクエスト --> S3[(S3 バケット<br/>パブリックアクセス全ブロック)]
    subgraph S3 の中身
      A[index.html / css / js<br/>manifest / sw / icon]
      B[content/weekly/*.json<br/>latest.json]
    end
    S3 --- A
    S3 --- B
    CF -. 既定ビヘイビア: 長TTL .-> A
    CF -. /content/weekly/latest.json: 5分TTL .-> B

    subgraph "フェーズ2の拡張余地（未実装）"
      API[API Gateway] --> L[Lambda] --> D[(DynamoDB<br/>共同カウンター / 署名)]
    end
    CF -. 将来 /api/* ビヘイビアを追加 .-> API
```

---

## 各サービスの選定理由

| 選定 | 理由 |
|---|---|
| **S3（非公開）** | 常駐プロセスの無い純粋な静的配信。運用ゼロ・従量課金・ほぼ無料枠。バケットは**決して公開せず**、到達は CloudFront 経由のみ。 |
| **CloudFront + OAC** | エッジ配信で低遅延＆HTTPS必須化。**OAC（Origin Access Control）** は旧 OAI に代わる推奨方式で、S3 バケットポリシーを CDK が自動で最小権限に絞る。 |
| **2つのキャッシュポリシー** | 週替わりの「最新」ポインタ `latest.json` だけ **5分TTL** で素早く差し替え。その他の静的資産は**長TTL**（＋将来ファイル名ハッシュ運用で `immutable` 化）。 |
| **CDK (TypeScript)** | インフラを型付きコードでレビュー可能に。差分は `cdk diff`、再現性は CloudFormation が担保。 |
| **PriceClass 200** | 日本を含むアジア/北米/欧州のエッジのみ。全世界(ALL)より安価。 |

---

## セキュリティ上の判断

- **S3 はパブリックアクセス全ブロック**（`BlockPublicAccess.BLOCK_ALL`）。公開しない。
- 到達は **CloudFront OAC 経由のみ**（バケットポリシーで CloudFront 配信のみ許可）。
- **HTTPS 強制**（S3 側 `enforceSSL` ＋ CloudFront `REDIRECT_TO_HTTPS`）。
- 保存時暗号化（SSE-S3）。
- **秘密情報はコード/リポジトリに置かない**。アカウントID・リージョン・プロファイルは
  すべて環境変数/プレースホルダ。`cdk.out` と `node_modules` は `.gitignore` 済み。

---

## コスト

想定トラフィック（初期20人規模〜数千PV/月）では **ほぼ無料枠に収まる**見込み。

- **S3**: 数MBの静的資産。ストレージ/リクエストとも無料枠内。
- **CloudFront**: 毎月 1TB のデータ転送・1,000万リクエストが恒久無料枠。
  本アプリの規模では桁違いに下回る。
- 無効化は **latest.json と index.html のみ**に限定（毎月1,000パスまで無料。
  全パス `/*` 無効化はコストと時間の無駄なので避ける）。

---

## デプロイの流れ

```bash
cd infra
npm install
npm run bootstrap        # 初回のみ（アカウント/リージョンに CDK 用リソースを用意）
npm run deploy:stack     # cdk deploy でスタック作成（S3 + CloudFront）
npm run deploy           # web/ と content/ を S3 同期 + latest.json/index.html を無効化
```

毎週のシナリオ更新は `content/weekly/` に JSON を1つ追加して `latest.json` を差し替え、
`npm run deploy` を打つだけ（CI/CD 化はタスク7で自動化）。

---

## なぜ Docker を使わないのか

このスタックは **静的配信＋サーバーレス**で、**常駐プロセスが1つも存在しない**。
コンテナ化すべき「動き続けるプロセス」が無いため、Docker はむしろ運用コスト（イメージ管理・
パッチ・常時課金）を増やすだけになる。

コンテナ化が正当化されるのは将来、常駐処理が必要になったとき
（例: WebSocket の常時接続や重いバックグラウンドジョブ）で、その場合は **Fargate** 等を検討する。
フェーズ2の共同カウンター/署名程度なら **API Gateway + Lambda + DynamoDB**（サーバーレス）で足り、
やはりコンテナは不要。

---

## フェーズ2への拡張余地

この Distribution に `/api/*` ビヘイビアを足すだけで、既存の配信を壊さずに
**API Gateway + Lambda + DynamoDB** を後付けできる（共同カウンター＝累積で守られた街の数、
週替わりの守り人署名、等）。`engine.js` は DOM 非依存に分離済みなので、
ゴール判定のサーバー側検証にそのまま再利用できる。
