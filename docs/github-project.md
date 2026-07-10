# GitHub プロジェクト運用 — Issues をポートフォリオにする

> 目的: このリポジトリの開発履歴（Phase 1 + T タスク）を、採用担当者（NZ・英語圏）が
> GitHub 上でそのまま読める「計画 → 実行 → 完了」の形で見せる。
> **Issue のタイトル・本文は英語**で書く（コミットメッセージが英語なのと同じ理由）。

## 初回セットアップ（1回だけ・TODO ☐11）

```bash
brew install gh
gh auth login          # ブラウザで GitHub 認証
make gh-project        # Phase 1 + T1〜T54 を Issues/Milestones/Labels に一括バックフィル
```

- スクリプトは **冪等**（同名 issue はスキップ）。何度実行しても重複しない。
- 事前確認は `node scripts/gh-project-backfill.mjs --dry-run`。
- バックフィルされる構成:
  - **Milestones(3)**: Phase 1 ／ Strategy sprints (T1–T24) ／ Delegation sprints (T25–T66)
  - **Labels**: `area:app / infra / testing / content / docs / marketing` ＋ `process:ai-subagent`
  - **Issues(73)**: 全て英語・完了済みは closed(completed) で作成

## 以後の運用（スプリントごと）

1. **スプリント開始時**: タスクごとに英語で issue を起票する（Claude Code に依頼すれば
   `gh issue create` で自動起票できる）。ラベルとマイルストーンを付ける。
   - タイトル例: `Weekly scenarios W51–W54 (stock through early January)`
   - AI サブエージェントに委任したタスクには `process:ai-subagent` ラベル。
2. **完了コミット**: コミットメッセージ末尾に `Closes #<issue番号>` を書く。
   push すると GitHub が自動で issue を閉じ、コミットと issue が相互リンクされる。
3. **CLAUDE.md / PROGRESS.md は従来通り**（セッション用の文脈）。GitHub Issues は
   その「外向きの英語ビュー」という関係。二重管理を避けるため、issue 本文は1〜3行に留める。

## Projects ボード（任意・見栄え用）

Issues が入った後、GitHub Web UI から Projects (v2) ボードを作ると一覧性が上がる:
リポジトリ → Projects → New project → **Board** → 「Add items」で全 issue を追加 →
Status 列は closed issue が自動で Done に入る。
（CLI でも `gh project create` 可能だが、auth に `project` スコープの追加が必要:
`gh auth refresh -s project`）

## ポートフォリオとしての見どころ（README や履歴書から誘導する時の論点）

- **Milestones** = フェーズ計画（モバイル化→戦略実装→AI委任）が読める。
- **`process:ai-subagent` ラベル** = AI サブエージェントへの委任を仕様書・受け入れ検証つきで
  運用した実績（メインセッションがレビュー・検証・コミットを担う統制の話は AGENTS.md 参照）。
- **`area:infra`** = S3+CloudFront(OAC)/CDK・OIDC キーレスデプロイ・週次自動ローテなど
  クラウドエンジニアリングの実装群。
- **`area:testing`** = 「コンテンツ品質を CI で保証する」発想（到達可能性テストが実バグを
  検出した話は T20 / T40 の issue に明記済み）。
