# 社会デバッガー — 操作の単一入口。`make` または `make help` で一覧。
# どの担当（人間 / Claude Code / Codex）でも、まずここを見れば操作が分かる。
.DEFAULT_GOAL := help
GITHUB_REPO ?= larai-w/social-system-debugger

.PHONY: help setup hooks serve test check verify lint format gen-og synth handoff protect \
        aws-bootstrap aws-deploy aws-wire ios android

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

## ── 初回セットアップ ──────────────────────────────
setup: ## 依存導入 + git hooks 有効化（クローン後まず実行）
	npm install && (cd infra && npm ci) && git config core.hooksPath .githooks
	@echo "✅ setup done（make help で操作一覧）"

hooks: ## git pre-commit フックを有効化
	git config core.hooksPath .githooks

## ── 開発 ──────────────────────────────────────────
serve: ## ローカル配信（http://localhost:8000 / file:// 不可）
	npm run serve

test: ## ユニットテスト（engine / goal / share）
	npm test

check: ## テスト＋週替わりJSON検証（CIと同じ）
	npm run check

verify: ## ブラウザ実機検証（Consoleゼロ・4タブ・Chart.js失敗時。初回: npx playwright install chromium）
	npm run verify

lint: ## ESLint（構文・明白なバグ検知）
	npm run lint

format: ## Prettier で整形（対象は .prettierignore 以外）
	npm run format

gen-og: ## og-image.png を再生成
	npm run gen:og

synth: ## cdk synth（cdk-nag セキュリティ検査込み・AWS不要）
	cd infra && npm ci && npm run synth

## ── 引き継ぎ ──────────────────────────────────────
handoff: ## セッション終了前チェック（クリーン・未push・テスト）
	bash scripts/handoff-check.sh

protect: ## main をブランチ保護（PR＋CI必須。要 gh admin）
	bash scripts/setup-branch-protection.sh

## ── AWS（要 AWS 認証情報 / gh CLI）────────────────
aws-bootstrap: ## 初回のみ: CDK ブートストラップ
	cd infra && npm ci && npm run bootstrap

aws-deploy: ## CDKスタック作成→web/・content/ をS3同期
	cd infra && npm run deploy:stack -- -c githubRepo=$(GITHUB_REPO) \
		$(if $(EXISTING_OIDC_PROVIDER_ARN),-c existingOidcProviderArn=$(EXISTING_OIDC_PROVIDER_ARN),) \
		--require-approval never && npm run deploy

aws-wire: ## デプロイ後: CDK出力から GitHub Secrets/Variables と web/config.js を自動設定
	bash scripts/aws-wire.sh

## ── ネイティブ（要 Xcode / Android Studio）────────
ios: ## iOS を同期して Xcode で開く
	npx cap sync && npx cap open ios

android: ## Android を同期して Android Studio で開く
	npx cap sync && npx cap open android
