# 社会デバッガー — 操作の単一入口。`make` または `make help` で一覧。
# どの担当（人間 / Claude Code / Codex）でも、まずここを見れば操作が分かる。
.DEFAULT_GOAL := help
GITHUB_REPO ?= larai-w/social-system-debugger

.PHONY: help serve test check gen-og synth handoff \
        aws-bootstrap aws-deploy aws-wire ios android

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

## ── 開発 ──────────────────────────────────────────
serve: ## ローカル配信（http://localhost:8000 / file:// 不可）
	npm run serve

test: ## ユニットテスト（engine / goal / share）
	npm test

check: ## テスト＋週替わりJSON検証（CIと同じ）
	npm run check

gen-og: ## og-image.png を再生成
	npm run gen:og

synth: ## cdk synth（cdk-nag セキュリティ検査込み・AWS不要）
	cd infra && npm ci && npm run synth

## ── 引き継ぎ ──────────────────────────────────────
handoff: ## セッション終了前チェック（クリーン・未push・テスト）
	bash scripts/handoff-check.sh

## ── AWS（要 AWS 認証情報 / gh CLI）────────────────
aws-bootstrap: ## 初回のみ: CDK ブートストラップ
	cd infra && npm ci && npm run bootstrap

aws-deploy: ## CDKスタック作成→web/・content/ をS3同期
	cd infra && npm run deploy:stack -- -c githubRepo=$(GITHUB_REPO) && npm run deploy

aws-wire: ## デプロイ後: CDK出力から GitHub Secrets/Variables と web/config.js を自動設定
	bash scripts/aws-wire.sh

## ── ネイティブ（要 Xcode / Android Studio）────────
ios: ## iOS を同期して Xcode で開く
	npx cap sync && npx cap open ios

android: ## Android を同期して Android Studio で開く
	npx cap sync && npx cap open android
