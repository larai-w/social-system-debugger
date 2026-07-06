#!/usr/bin/env bash
# handoff-hook.sh — Claude Code の Stop フック用の「軽量」チェック（テストは走らせない＝高速）。
# 問題（同期の競合コピー / 未コミット / 未push）があるときだけ、systemMessage を JSON で出して警告する。
# 全て正常なら何も出さない（静かに終わる）。重い検証は `make handoff`（テスト込み）。
# 常に exit 0（Stop をブロックしない）。
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 0
msgs=()

CONFLICTS="$(find . -path ./node_modules -prune -o -path ./.git -prune -o -path '*/node_modules' -prune -o -name '* [0-9].*' -print 2>/dev/null | grep -vE 'node_modules|\.git/' | tr '\n' ' ' || true)"
[ -n "${CONFLICTS// }" ] && msgs+=("同期の競合コピーあり（iCloud等・削除推奨）: ${CONFLICTS}")

DIRTY="$(git status --porcelain 2>/dev/null | grep -v 'share-card-generator.html' || true)"
[ -n "$DIRTY" ] && msgs+=("未コミットの変更あり")

if git rev-parse '@{u}' >/dev/null 2>&1; then
  AHEAD="$(git rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)"
  [ "$AHEAD" != "0" ] && msgs+=("未pushコミット ${AHEAD} 件")
fi

if [ "${#msgs[@]}" -gt 0 ]; then
  text="⚠️ 引き継ぎ注意: "
  for m in "${msgs[@]}"; do text+="${m} / "; done
  text+="→ コミット & git push を（詳細は make handoff）"
  # JSON 文字列としてエスケープ（バックスラッシュ・ダブルクオート）
  esc="$(printf '%s' "$text" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  printf '{"systemMessage":"%s"}\n' "$esc"
fi
exit 0
