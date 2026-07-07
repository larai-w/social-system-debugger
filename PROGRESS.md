# PROGRESS — 戦略実装スプリント（2026-07-07 開始）

> PM.md / MARKETING.md / OUTREACH.md / SKILL.md / vertical-reel-and-civic-ux-SKILL.md の戦略から、
> **コーディングで完了できる5タスク**を切り出したスプリント。1タスク＝1コミット。
> 各タスク完了時にここへ ✅ と差分要点を追記し、CLAUDE.md 進捗ログと同期する。

## タスク一覧と根拠

| # | タスク | 戦略上の根拠 | 状態 |
|---|---|---|---|
| T1 | 検証基盤 `scripts/verify.mjs`（Playwright・Consoleゼロ自動検証） | SKILL.md「変更後: Console ゼロ確認（必須）」の自動化。以降の全タスクの退行防止 | ⏳ |
| T2 | US-08 研究者向けエクスポート（JSON/CSV） | PM.md フェーズ1で唯一残っていたコーディングストーリー（P1）。研究者ペルソナの「教材・引用可能な再現性」 | ⏳ |
| T3 | 共有チャネル最適化（PAGE 2 防災変種テンプレ＋固定ハッシュタグ #社会デバッガー） | MARKETING.md「防災文脈はXよりLINEで回る」「固定タグを1つ決めて全投稿に付ける」 | ⏳ |
| T4 | 教員向け1枚モノ `web/classroom.html`（A4印刷→PDF） | MARKETING.md 教育チャネル「授業で使える1枚モノを用意しておくと採用されやすい」。教員1人＝生徒30〜40人の乗数 | ⏳ |
| T5 | 30秒縦型リール `promo/reel-30s.html` | MARKETING.md「X プロフィール固定ポストに30秒動画」。vertical-reel スキル PART 1 の30秒構成に準拠 | ⏳ |

## 実施順

T1 →（T1で検証しながら）T2 → T3 → T4 → T5。
T2/T3 はアプリ本体（web/js）に触れるため、完了ごとに verify（Console ゼロ・Chart.js 失敗時含む）を実施する。

## 完了ログ（新しいものを上に追記）

- （未着手）
