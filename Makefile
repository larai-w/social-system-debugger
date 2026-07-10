# 社会デバッガー — 操作の単一入口。`make` または `make help` で一覧。
# どの担当（人間 / Claude Code / Codex）でも、まずここを見れば操作が分かる。
.DEFAULT_GOAL := help
GITHUB_REPO ?= larai-w/social-system-debugger

.PHONY: help setup hooks serve test check verify lint format gen-og gen-icons classroom-pdf store-shots announce-cards reels synth handoff protect \
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

verify-offline: ## PWA オフライン起動検証（SW登録→回線遮断→リロードで動くか）
	npm run verify:offline

verify: ## ブラウザ実機検証（Consoleゼロ・4タブ・Chart.js失敗時。初回: npx playwright install chromium）
	npm run verify

lint: ## ESLint（構文・明白なバグ検知）
	npm run lint

format: ## Prettier で整形（対象は .prettierignore 以外）
	npm run format

gen-og: ## og-image.png を再生成
	npm run gen:og

gen-icons: ## ストア用アイコン/スプラッシュを resources/ に生成
	npm run gen:icons

classroom-pdf: ## 教員向け1枚ガイドを dist/classroom.pdf / .en.pdf に自動生成（A4・白地）
	npm run gen:classroom-pdf

store-shots: ## ストア提出用スクショ6枚を実アプリから自動撮影（dist/store-shots/01〜06.png・430×932@3x）
	npm run gen:store-shots

announce-cards: ## X 告知用 画像カード4枚を dist/announce/ に生成（PWAインストール告知）
	npm run gen:announce

reels: ## リール5本を自動録画（dist/reels/ へ webm、ffmpegがあればmp4も）
	npm run record:reels

synth: ## cdk synth（cdk-nag セキュリティ検査込み・AWS不要）
	cd infra && npm ci && npm run synth

## ── 引き継ぎ ──────────────────────────────────────
handoff: ## セッション終了前チェック（クリーン・未push・テスト）
	bash scripts/handoff-check.sh

protect: ## main をブランチ保護（PR＋CI必須。要 gh admin）
	bash scripts/setup-branch-protection.sh

gh-project: ## 開発履歴を GitHub Issues/Milestones へバックフィル（英語・要 gh。手順: docs/github-project.md）
	node scripts/gh-project-backfill.mjs

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
