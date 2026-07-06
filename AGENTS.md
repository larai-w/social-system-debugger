# AGENTS.md — AIエージェント向けオンボーディング

> このファイルは Codex 等のコーディングエージェント向けの入口。Claude Code は `CLAUDE.md` を、
> 人間は `docs/DEVELOPMENT.md` を主に読む。**深い文脈は `CLAUDE.md`（進捗ログ・次のタスク・
> ユーザー設定チェックリスト）が一次ソース**なので、作業前に必ず読むこと。

## このプロジェクトは何か
社会がどう壊れるかをパラメータ操作で体験する教育用シミュレーター「社会デバッガー」。
Web（GitHub Pages / AWS CloudFront）＋ネイティブ（Capacitor iOS/Android）。収益化しない。
多く使われた実績を就活（クラウドエンジニア）・CS博士出願の資料にするのが目的。

## リポジトリ構成（要点）
- `web/` … フロント。`js/{i18n,engine,native,share,scenario,ui}.js`（**バンドラなし・古典スクリプトでグローバル共有**、読込順が意味を持つ）。`engine.js` は **DOM/window 非依存**。
- `content/weekly/` … 週替わりシナリオ JSON（`*.json` + `latest.json` + `weekly.schema.json`）。
- `infra/` … AWS CDK(TS)。S3(OAC)+CloudFront＋GitHub OIDCロール。`cdk-nag` でセキュリティ検査。
- `tests/` … `node:test`（engine・宣言的ゴール・共有URL）。`scripts/` … 検証・生成スクリプト。
- `.github/workflows/` … `ci.yml`(PR) / `deploy.yml`(Pages) / `deploy-aws.yml`(OIDC)。

## よく使うコマンド
`make help` で全コマンドを一覧できる（操作の単一入口）。主なもの:
```bash
make help         # 全タスク一覧
make serve        # http://localhost:8000 （file:// では PWA/fetch が動かない）
make check        # ユニットテスト + 週替わりJSON検証（CI相当）
make synth        # cdk synth（cdk-nag 込み・AWS不要）
make handoff      # ★セッション終了前チェック（競合コピー/未コミット/未push/テスト）
make aws-deploy   # CDKデプロイ→S3同期（要AWS）
make aws-wire     # デプロイ後: CDK出力から GitHub Secrets/Variables と config.js を自動設定
make ios / android
```

## 変更時の必須ルール（退行防止）
1. **見た目・既存挙動を壊さない。** ダーク・ターミナル調は不変。ゼロから書き直さない。
2. **i18n を壊さない。** 新規のユーザー向け文字列は ja/en 両方（辞書 or `tt('日本語','English')`）。
3. **モジュール分割の作法**（`docs/DEVELOPMENT.md` 参照）: 全 js は古典スクリプトでグローバル共有。
   マークアップの `onclick="foo()"` から呼ぶ関数は必ずどこかで定義。トップレベル即時実行が未読み込みの
   シンボルを参照しないこと。JS/CSS を変えたら `web/sw.js` の `CACHE` 版番号を上げる。
4. **ネイティブ機能は `SSD.isNative` / 週替わりは `WEEKLY_ENABLED` でガード**＝Web は no-op に保つ。
5. **倫理方針**: 実在の国・自治体・人物を名指ししない（抽象型で語る）。
6. **段階実装＋タスクごとに完了報告**。コミットメッセージは英語。秘密情報はコミットしない。

## 完了前チェック / セッション終了
`npm run check`（＝`make check`）と、infra を触ったら `make synth` を通す。ブラウザ Console にアプリ由来の
エラーが無いことを確認（拡張機能のログは無視可）。**セッションを終える前に必ず `make handoff`** を実行し、
競合コピー無し・未コミット無し・未push無し・テスト通過を確認する（＝次の担当がそのまま続けられる状態）。

## 引き継ぎ（別エージェント/別マシンへ）
- **一次ソースは `CLAUDE.md`**（進捗・次タスク・ユーザーがやる設定）。
- ローカル専用メモ（`~/.claude/.../memory/`）は引き継がれない前提。文脈は本リポジトリの
  `CLAUDE.md`/`AGENTS.md`/`docs/` に集約している。**作業後は必ず push**（未pushだと引き継げない）。
