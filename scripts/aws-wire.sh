#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# aws-wire.sh — デプロイ後の「配線」を1コマンドで。
#   CDK スタックの出力を読み、
#     ① GitHub リポジトリの Secret / Variables を gh CLI で設定
#     ② web/config.js に CloudFront ドメインを書き込み
#   これで「出力を手で GitHub 設定にコピペ」「scenario.js を手で書き換え」が不要になる。
#
#   前提: aws CLI 認証済み ＆ gh CLI 認証済み（gh auth login）＆ deploy:stack 実行済み。
#   使い方: (リポジトリルートで)  make aws-wire   もしくは  bash scripts/aws-wire.sh
#   環境変数: STACK_NAME(既定 SocialDebuggerStack) / CDK_DEFAULT_REGION / AWS_PROFILE
#            GITHUB_REPO(既定 origin から自動取得)
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

STACK_NAME="${STACK_NAME:-SocialDebuggerStack}"
AWS_REGION="${CDK_DEFAULT_REGION:-ap-northeast-1}"
PROFILE_ARGS=()
[ -n "${AWS_PROFILE:-}" ] && PROFILE_ARGS=(--profile "$AWS_PROFILE")

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 対象リポジトリ（未指定なら git remote origin から owner/repo を推定）
REPO="${GITHUB_REPO:-$(git -C "$ROOT" remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')}"

command -v aws >/dev/null || { echo "❌ aws CLI が必要です" >&2; exit 1; }
command -v gh  >/dev/null || { echo "❌ gh CLI が必要です（gh auth login）" >&2; exit 1; }

get_output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

BUCKET="$(get_output BucketName)"
DIST_ID="$(get_output DistributionId)"
DOMAIN="$(get_output DistributionDomainName)"
ROLE_ARN="$(get_output GithubDeployRoleArn)"

if [ -z "$BUCKET" ] || [ "$BUCKET" = "None" ]; then
  echo "❌ スタック '$STACK_NAME' の出力が取得できません。先に 'make aws-deploy' を実行してください。" >&2
  exit 1
fi

echo "→ Repo: $REPO"
echo "→ Bucket=$BUCKET  Dist=$DIST_ID  Domain=$DOMAIN"

# ① GitHub の Secret / Variables を設定（deploy-aws.yml が参照）
echo "→ GitHub Actions の Secret/Variables を設定..."
gh -R "$REPO" secret   set AWS_DEPLOY_ROLE_ARN --body "$ROLE_ARN"
gh -R "$REPO" variable set AWS_REGION          --body "$AWS_REGION"
gh -R "$REPO" variable set S3_BUCKET           --body "$BUCKET"
gh -R "$REPO" variable set CLOUDFRONT_DIST_ID  --body "$DIST_ID"
gh -R "$REPO" variable set CLOUDFRONT_DOMAIN   --body "$DOMAIN"

# ② web/config.js に配信元を書き込み（ネイティブ/ローカルでも配信版を取得できる）
printf 'window.SSD_CONFIG = { contentBaseUrl: "https://%s/content/weekly" };\n' "$DOMAIN" > "$ROOT/web/config.js"
echo "→ web/config.js を更新: https://$DOMAIN/content/weekly"

echo "✅ 配線完了。以後は main への push で deploy-aws.yml が自動デプロイします。"
echo "   （web/config.js の変更をコミットすると、ネイティブビルドにも配信元が反映されます）"
