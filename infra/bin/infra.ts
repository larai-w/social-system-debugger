#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { SocialDebuggerStack } from '../lib/social-debugger-stack';

/**
 * ══════════════════════════════════════════════════════════════════
 * ユーザーが設定する箇所（デプロイ前チェックリスト）
 * ══════════════════════════════════════════════════════════════════
 *  1. AWS 認証情報を用意（`aws configure` か SSO）。
 *  2. 環境変数（プレースホルダ）:
 *       export CDK_DEFAULT_ACCOUNT=<your 12-digit account id>
 *       export CDK_DEFAULT_REGION=ap-northeast-1     # 東京。任意
 *       export AWS_PROFILE=<profile>                 # 任意
 *  3. 初回のみブートストラップ:  npm run bootstrap
 *  4. 構成確認:  npm run synth   （← 本タスクではここまで検証済み）
 *  5. デプロイ:  npm run deploy:stack   → その後 npm run deploy（資産同期）
 *  6. 出力された DistributionDomainName を web/js/scenario.js の
 *     CONTENT_BASE_URL（https://<domain>/content/weekly）に反映。
 *  （カスタムドメインを使う場合は lib/social-debugger-stack.ts のコメント参照）
 * ══════════════════════════════════════════════════════════════════
 */
const app = new cdk.App();

new SocialDebuggerStack(app, 'SocialDebuggerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,          // プレースホルダ（環境変数）
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
  description:
    'Social Debugger — static web + weekly content delivery via private S3 (OAC) behind CloudFront.',
});

// cdk-nag: AWS Solutions ルールセットで synth 時にセキュリティ静的検査（AWS認証情報不要・CIで走る）。
// 受容する指摘はスタック側で NagSuppressions に理由付きで明示（面接で説明できる素材にする）。
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
