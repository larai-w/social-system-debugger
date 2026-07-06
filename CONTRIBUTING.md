# CONTRIBUTING — 開発・引き継ぎガイド

人間の開発者向け。AIエージェント（Claude Code / Codex）は [`AGENTS.md`](AGENTS.md) と [`CLAUDE.md`](CLAUDE.md) を参照。

## セットアップ
```bash
git clone https://github.com/larai-w/social-system-debugger.git
cd social-system-debugger        # ※ iCloud/Dropbox 同期フォルダ外を推奨（.git 破損回避）
npm install                       # Capacitor / 生成スクリプト等の依存
npm run serve                     # → http://localhost:8000 （http で開くこと）
```

## テスト・検証（CIと同じものをローカルで）
```bash
npm run check                     # ユニットテスト + 週替わりJSON検証
(cd infra && npm install && npm run synth)   # CDK 構成 + cdk-nag セキュリティ検査
```

## ブランチ / PR
- CI（`ci.yml`）は **`main` への PR** で走る（テスト・JSON検証・cdk synth）。
- できれば作業ブランチ → PR で CI を通してからマージ（直 push はCIを飛ばす）。
- マージで `deploy.yml`（Pages）と `deploy-aws.yml`（AWS・設定済みなら）が走る。
- コミットメッセージは**英語**（Actions の実行名を英語にするため）。

## よくある変更
- **数式/しきい値・プリセット・バナー・発見・i18n**: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)「よくある変更の手順」。
- **週替わりシナリオ追加**: `content/weekly/2026-Wxx.json` を1枚書く → `latest.json` 差替 → `npm run validate:weekly` → PR。詳細は DEVELOPMENT.md。
- **モジュール分割の作法**（グローバル共有・読込順・SW版番号）は DEVELOPMENT.md「コードの地図」を必ず読む。

## デプロイ / インフラ
- 配信は GitHub Pages（現行URL）＋ AWS S3/CloudFront（`infra/`）の並行運用。手順・OIDC・最小権限・コストは [`infra/README.md`](infra/README.md)。
- ユーザーが手を動かす設定（push / AWS / GitHub Secrets / Capacitor 実機）の最新チェックリストは [`CLAUDE.md`](CLAUDE.md) 末尾。

## 引き継ぎのルール
- **一次ソースは `CLAUDE.md`**（何を作り・どこまで進み・次に何をするか）。作業したら更新する。
- **作業後は必ず `git push`**（未pushだと別マシン/別ユーザー/別エージェントへ引き継げない）。
