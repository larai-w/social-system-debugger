#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# deploy.sh — web/ と content/ を S3 へ同期し、最小限の CloudFront 無効化を打つ。
#   前提: `npm run deploy:stack`（cdk deploy）でスタックが作成済みであること。
#   使い方:  (infra/ で)  npm run deploy
#   環境変数: STACK_NAME(既定 SocialDebuggerStack) / CDK_DEFAULT_REGION / AWS_PROFILE
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

STACK_NAME="${STACK_NAME:-SocialDebuggerStack}"
AWS_REGION="${CDK_DEFAULT_REGION:-ap-northeast-1}"
PROFILE_ARGS=()
[ -n "${AWS_PROFILE:-}" ] && PROFILE_ARGS=(--profile "$AWS_PROFILE")

# スタック出力からバケット名・配信ID を取得
get_output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" "${PROFILE_ARGS[@]}" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET="$(get_output BucketName)"
DIST_ID="$(get_output DistributionId)"
if [ -z "$BUCKET" ] || [ "$BUCKET" = "None" ]; then
  echo "❌ スタック '$STACK_NAME' の出力が見つかりません。先に 'npm run deploy:stack' を実行してください。" >&2
  exit 1
fi
echo "→ Bucket: $BUCKET  Distribution: $DIST_ID  Region: $AWS_REGION"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"  # infra/scripts/ の2つ上 = リポジトリルート

# 1) Web資産を同期。
#    --delete で不要ファイルを掃除するが、content/ は別管理なので削除対象から除外する
#    （web/ を root に同期する際に content/* まで消さないための安全策）。
echo "→ syncing web/ ..."
aws s3 sync "$ROOT/web/" "s3://$BUCKET/" "${PROFILE_ARGS[@]}" --region "$AWS_REGION" \
  --delete --exclude "content/*" \
  --cache-control "public,max-age=300"   # 未ハッシュのため短め。ハッシュ導入後に immutable 長TTLへ

# 2) 週替わりコンテンツを同期（content/ 配下だけを個別に）。
echo "→ syncing content/ ..."
aws s3 sync "$ROOT/content/" "s3://$BUCKET/content/" "${PROFILE_ARGS[@]}" --region "$AWS_REGION" \
  --delete --cache-control "public,max-age=300"

# 3) 無効化は最小限（latest.json と index.html のみ）。
#    全パス(/*)の無効化はコストと時間の無駄なので避ける。
echo "→ invalidating latest.json + index.html ..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" "${PROFILE_ARGS[@]}" \
  --paths "/content/weekly/latest.json" "/index.html" >/dev/null

echo "✅ Done."
