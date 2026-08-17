# Security Policy / セキュリティポリシー

> 日本語と英語で記載しています。  
> Written in both Japanese and English.

---

## 対象 / Scope

このポリシーは次を対象とします:

- `larai-w/social-system-debugger` リポジトリとその GitHub Pages / AWS CloudFront 上の公開サイト。
- ネイティブアプリ（iOS/Android）は現時点でストア非公開です。

This policy covers:

- The `larai-w/social-system-debugger` repository and its public site on GitHub Pages / AWS CloudFront.
- Native apps (iOS/Android) are not yet publicly distributed via any store.

---

## 脆弱性の報告方法 / How to Report

**GitHub の Private vulnerability reporting を優先してください。**  
リポジトリの **Security タブ → "Report a vulnerability"** からご報告いただくと、
非公開で開発者に届きます。

フォームが使えない場合は **security@veai.jp** までメールでご連絡ください。
**公開 Issue に脆弱性の詳細は書かないでください。** 投稿した時点で誰でも読めるためです。

**Please prefer GitHub's Private vulnerability reporting.**  
Go to the repository's **Security tab → "Report a vulnerability"** to submit a report
confidentially to the maintainer.

If the form is unavailable, email **security@veai.jp** instead.
**Please do not put vulnerability details in a public Issue** — they are readable by
anyone the moment they are posted.

---

## 脆弱性以外のご意見 / Everything else

バグ報告、改善提案、使ってみた感想、授業で使った話 — **Issue で歓迎します**。
非公開にする必要があるのは脆弱性だけです。

Bug reports, ideas, and feedback from using it — **Issues are welcome**.
Only vulnerabilities need to stay private.

---

## 対応方針 / Response Policy

これは個人プロジェクトです。SLA（対応期限）は約束できません。
報告を受け取った場合、内容を確認のうえ、できる範囲で対処します（best-effort）。

This is a personal project maintained by one person. No SLA or guaranteed response
time is offered. Reports will be reviewed and addressed on a best-effort basis.

---

## 既存のセキュリティ対策 / Current Defenses

以下の対策が既に施されています（過剰な主張を避け、事実のみ記載します）:

| 対策 | 詳細 |
|---|---|
| **gitleaks（全履歴スキャン）** | `.github/workflows/secret-scan.yml` が push/PR ごとに `fetch-depth: 0` でリポジトリの全コミット履歴を走査します。長期クレデンシャルの混入を CI として恒久化しています。 |
| **Content-Security-Policy** | `<meta http-equiv="Content-Security-Policy">` を `web/index.html` に実装。`script-src 'self'` ＋インラインハンドラのみを許可し、第三者スクリプトの注入を構造的に遮断します（`object-src 'none'`）。 |
| **依存関係の自動監視** | `dependabot.yml` が npm の依存を定期スキャンし、脆弱性のある版が出た場合は自動 PR を作成します。 |
| **キーレス AWS デプロイ（OIDC）** | AWS へのデプロイは GitHub OIDC で行い、長期 AWS キーをリポジトリやシークレットに保持しません。`main` ブランチ限定・最小権限ロールです。 |

The following defenses are already in place (facts only, no overclaiming):

| Defense | Details |
|---|---|
| **gitleaks (full-history scan)** | `.github/workflows/secret-scan.yml` runs gitleaks with `fetch-depth: 0` on every push and PR, scanning the entire commit history for leaked credentials. |
| **Content-Security-Policy** | A CSP meta tag in `web/index.html` allows only `'self'` and inline handlers as script sources, structurally blocking third-party script injection (`object-src 'none'`). |
| **Dependabot** | `dependabot.yml` monitors npm dependencies and opens automated PRs when a vulnerable version is detected. |
| **Keyless AWS deploy via OIDC** | Deployments to AWS assume an IAM role via GitHub OIDC — no long-lived AWS keys are stored anywhere. The trust policy is scoped to `main` only with least-privilege permissions. |

---

*最終更新 / Last updated: 2026-08-18*
