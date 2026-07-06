#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# handoff-check.sh — セッションを「引き継ぎ可能な状態」で終えるための一括チェック。
#   別の Claude Code ユーザー / Codex / 別マシンがそのまま続けられるかを確認する。
#   使い方:  make handoff  もしくは  bash scripts/handoff-check.sh
# ══════════════════════════════════════════════════════════════════
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
warn=0; fail=0

echo "── 引き継ぎチェック ──────────────────────────"

# 1) iCloud等の競合コピー（' 2.xxx'）が無いか
CONFLICTS="$(find . -path ./node_modules -prune -o -path ./.git -prune -o -path '*/node_modules' -prune -o -name '* [0-9].*' -print 2>/dev/null | grep -vE 'node_modules|\.git/' || true)"
if [ -n "$CONFLICTS" ]; then
  echo "⚠️  同期の競合コピーがあります（削除推奨。iCloud外への移設を検討）:"; echo "$CONFLICTS"; warn=1
else
  echo "✅ 競合コピーなし"
fi

# 2) 作業ツリーがクリーンか（未コミットの変更がないか）
DIRTY="$(git status --porcelain | grep -v 'share-card-generator.html' || true)"
if [ -n "$DIRTY" ]; then
  echo "⚠️  未コミットの変更があります（コミットしてから終えるのを推奨）:"; echo "$DIRTY"; warn=1
else
  echo "✅ 作業ツリーはクリーン"
fi

# 3) 未push commit が無いか（引き継ぎには push 必須）
if git rev-parse '@{u}' >/dev/null 2>&1; then
  AHEAD="$(git rev-list --count '@{u}..HEAD')"
  if [ "$AHEAD" != "0" ]; then echo "⚠️  未pushコミット $AHEAD 件（push しないと引き継げません）"; warn=1
  else echo "✅ 未pushなし（リモート最新）"; fi
else
  echo "⚠️  upstream 未設定（git push -u origin <branch>）"; warn=1
fi

# 4) テスト＋週替わりJSON検証（CI相当）
if npm run check >/tmp/ssd-check.log 2>&1; then echo "✅ npm run check 通過"; else echo "❌ npm run check 失敗（/tmp/ssd-check.log 参照）"; fail=1; fi

echo "──────────────────────────────────────────────"
if [ "$fail" != "0" ]; then echo "❌ 引き継ぎ不可: テストを直してください"; exit 1
elif [ "$warn" != "0" ]; then echo "⚠️  引き継ぎ可能だが要対応（上記の⚠️）。commit/push を推奨"; exit 0
else echo "✅ 引き継ぎ準備OK: 別ユーザー/Codex/別マシンでそのまま続行できます"; fi
