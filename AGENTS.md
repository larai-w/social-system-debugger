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
```bash
npm run serve            # http://localhost:8000 （file:// では PWA/fetch が動かない）
npm test                 # engine/goal/share のユニットテスト（node:test）
npm run validate:weekly  # 週替わり JSON のスキーマ検証（ja/en 必須）
npm run check            # test + validate をまとめて
npm run gen:og           # og-image.png 再生成
(cd infra && npm run synth)   # cdk synth（cdk-nag 込み・AWS認証情報不要）
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

## 完了前チェック
`npm run check` と（infra を触ったら）`cd infra && npm run synth` を通す。ブラウザ Console にアプリ由来の
エラーが無いことを確認（拡張機能のログは無視可）。詳細な手順は `docs/DEVELOPMENT.md`。

## 引き継ぎ（別エージェント/別マシンへ）
- **一次ソースは `CLAUDE.md`**（進捗・次タスク・ユーザーがやる設定）。
- ローカル専用メモ（`~/.claude/.../memory/`）は引き継がれない前提。文脈は本リポジトリの
  `CLAUDE.md`/`AGENTS.md`/`docs/` に集約している。**作業後は必ず push**（未pushだと引き継げない）。
