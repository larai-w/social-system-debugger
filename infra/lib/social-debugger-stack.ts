import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

/**
 * フェーズ1 の配信基盤（意図的に最小構成）。
 *
 *   [ユーザー] --HTTPS--> [CloudFront] --OAC--> [S3 (非公開)]
 *                              |                    ├─ index.html / css / js / manifest / sw / icon
 *                              |                    └─ content/weekly/*.json（latest.json は短TTL）
 *
 * 設計理由（面接で説明できるように各所へコメント）:
 *  - サーバー（常駐プロセス）が無い純粋な静的配信 → S3+CloudFront が最安・最小運用。
 *  - S3 は絶対に公開しない。到達は CloudFront の OAC（Origin Access Control）経由のみ。
 *  - フェーズ2で共同カウンター等の API が必要になったら、この Distribution に
 *    /api/* ビヘイビアを足して API Gateway + Lambda + DynamoDB を後付けできる（拡張余地）。
 */
export class SocialDebuggerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── S3: 非公開バケット（Web資産 + content/weekly/*.json をホスティング）──
    const bucket = new s3.Bucket(this, 'SiteBucket', {
      // バケットは決して公開しない（パブリックアクセス全ブロック）。到達は OAC 経由のみ。
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED, // 保存時暗号化（SSE-S3）
      enforceSSL: true,                           // 非HTTPSアクセスを拒否
      versioned: false,
      // デモ/ポートフォリオ用途: cdk destroy で綺麗に消せるように。
      // 本番運用なら RemovalPolicy.RETAIN + autoDeleteObjects:false が定石。
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── キャッシュポリシー ────────────────────────────────────────────
    // 既定（静的資産）: 長めの TTL。
    //   ※ JS/CSS はファイル名ハッシュ運用（例 ui.<hash>.js）にすると 1年 immutable が安全。
    //     現状は未ハッシュのため deploy 側で短めの Cache-Control を付与し、
    //     ハッシュ導入後にここを長TTLの主力にする方針。
    const longCache = new cloudfront.CachePolicy(this, 'StaticLongCache', {
      cachePolicyName: 'ssd-static-long',
      defaultTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });
    // latest.json 専用: 5分の短TTL（毎週の差し替えを素早く反映するため）。
    const latestCache = new cloudfront.CachePolicy(this, 'LatestJsonShortCache', {
      cachePolicyName: 'ssd-latest-5min',
      defaultTtl: cdk.Duration.minutes(5),
      maxTtl: cdk.Duration.minutes(5),
      minTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // ── CloudFront: OAC 経由で S3 を配信 ─────────────────────────────
    // withOriginAccessControl = 新方式 OAC（旧 OAI より推奨）。バケットポリシーは CDK が自動付与。
    const origin = origins.S3BucketOrigin.withOriginAccessControl(bucket);

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Social Debugger static delivery',
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200, // 日本含むアジア/欧米。ALL より安価
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: longCache,
        compress: true,
      },
      additionalBehaviors: {
        // 週替わりの「最新」ポインタだけ短TTL。他コンテンツは既定(long)のまま。
        'content/weekly/latest.json': {
          origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: latestCache,
          compress: true,
        },
      },
      // 直リンク時の 403/404 は index.html にフォールバック（単一HTMLアプリのため）。
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.minutes(5) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.minutes(5) },
      ],

      // ── カスタムドメイン（任意・雛形。使う場合のみコメント解除）─────────
      //   ※ CloudFront 用の証明書は us-east-1 の ACM 必須。Route53 で ARecord(alias) を張る。
      // domainNames: ['debugger.example.com'],
      // certificate: acm.Certificate.fromCertificateArn(
      //   this, 'SiteCert', 'arn:aws:acm:us-east-1:<ACCOUNT>:certificate/<ID>'),
    });

    // ── 出力（deploy スクリプト / scenario.js の URL 反映に使う）──────────
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'この値を web/js/scenario.js の CONTENT_BASE_URL (https://<domain>/content/weekly) に反映',
    });
  }
}
