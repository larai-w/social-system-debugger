#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# setup-branch-protection.sh — main を保護し、PR＋CI通過を必須にする。
#   効果: 誰が書いたコードでも、CI（web=テスト/不変条件, infra=cdk synth）が緑に
#         ならない限り main にマージできない＝退行が本流に入らない。
#   前提: gh CLI 認証済み ＆ 対象リポジトリの admin 権限。
#   使い方: make protect  もしくは  bash scripts/setup-branch-protection.sh
#   注意: これ以降 main への直 push はできなくなる（PR運用へ）。緊急時は解除するか
#         enforce_admins=false のため admin は設定変更で回避可能。
# ══════════════════════════════════════════════════════════════════
set -euo pipefail
command -v gh >/dev/null || { echo "❌ gh CLI が必要です（gh auth login）" >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${GITHUB_REPO:-$(git -C "$ROOT" remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')}"
BRANCH="${BRANCH:-main}"
echo "→ $REPO の $BRANCH を保護します（必須CI: web, infra）"

# 必須ステータスチェックは ci.yml のジョブ名（web / infra）。確実にPRで走るもののみ必須化。
# （CodeQL は助言的なので必須にしない＝結果はSecurityタブで確認）
gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["web", "infra"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

echo "✅ 保護を設定しました。以後は作業ブランチ→PR→CI緑→マージ。"
echo "   解除: gh api -X DELETE repos/$REPO/branches/$BRANCH/protection"
