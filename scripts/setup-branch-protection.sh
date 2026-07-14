#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# setup-branch-protection.sh — [実行禁止]
#
# 2026-07-14 以降、classic branch protection は ruleset（id 18896897、
# 名称 "main protection (CI gate, deploy-key bypass)"）に移行済み。
#
# このスクリプトを実行すると classic protection が ruleset と二重に有効になり、
# weekly-rotate.yml（デプロイキー直接 push）が GH006 で再び失敗します。
#
# 詳細: docs/operations-runbook.md §8「ブランチ保護と bot 運用」
# TODO.md ☐3 の完了注記も参照。
# ══════════════════════════════════════════════════════════════════
echo "❌ このスクリプトは実行禁止です。" >&2
echo "   classic 保護は ruleset（id 18896897）に移行済み。再設定すると週次ローテが壊れます。" >&2
echo "   詳細: docs/operations-runbook.md §8" >&2
echo "" >&2
echo "   ruleset の確認:" >&2
echo "     gh api repos/larai-w/social-system-debugger/rulesets/18896897" >&2
exit 1

# ── 以下は移行前のコード（参考用に温存・実行されない） ─────────────────
# set -euo pipefail
# command -v gh >/dev/null || { echo "❌ gh CLI が必要です（gh auth login）" >&2; exit 1; }
#
# ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# REPO="${GITHUB_REPO:-$(git -C "$ROOT" remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')}"
# BRANCH="${BRANCH:-main}"
# echo "→ $REPO の $BRANCH を保護します（必須CI: web, infra）"
#
# gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" \
#   --input - <<'JSON'
# {
#   "required_status_checks": { "strict": true, "contexts": ["web", "infra"] },
#   "enforce_admins": false,
#   "required_pull_request_reviews": { "required_approving_review_count": 0 },
#   "restrictions": null,
#   "required_linear_history": true,
#   "allow_force_pushes": false,
#   "allow_deletions": false
# }
# JSON
#
# echo "✅ 保護を設定しました。以後は作業ブランチ→PR→CI緑→マージ。"
# echo "   解除: gh api -X DELETE repos/$REPO/branches/$BRANCH/protection"
