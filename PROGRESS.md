# PROGRESS — 戦略実装スプリント（2026-07-07 開始）

> PM.md / MARKETING.md / OUTREACH.md / SKILL.md / vertical-reel-and-civic-ux-SKILL.md の戦略から、
> **コーディングで完了できる5タスク**を切り出したスプリント。1タスク＝1コミット。
> 各タスク完了時にここへ ✅ と差分要点を追記し、CLAUDE.md 進捗ログと同期する。

## タスク一覧と根拠

| # | タスク | 戦略上の根拠 | 状態 |
|---|---|---|---|
| T1 | 検証基盤 `scripts/verify.mjs`（Playwright・Consoleゼロ自動検証） | SKILL.md「変更後: Console ゼロ確認（必須）」の自動化。以降の全タスクの退行防止 | ✅ |
| T2 | US-08 研究者向けエクスポート（JSON/CSV） | PM.md フェーズ1で唯一残っていたコーディングストーリー（P1）。研究者ペルソナの「教材・引用可能な再現性」 | ✅ |
| T3 | 共有チャネル最適化（PAGE 2 防災変種テンプレ＋固定ハッシュタグ #社会デバッガー） | MARKETING.md「防災文脈はXよりLINEで回る」「固定タグを1つ決めて全投稿に付ける」 | ✅ |
| T4 | 教員向け1枚モノ `web/classroom.html`（A4印刷→PDF） | MARKETING.md 教育チャネル「授業で使える1枚モノを用意しておくと採用されやすい」。教員1人＝生徒30〜40人の乗数 | ✅ |
| T5 | 30秒縦型リール `promo/reel-30s.html` | MARKETING.md「X プロフィール固定ポストに30秒動画」。vertical-reel スキル PART 1 の30秒構成に準拠 | ✅ |
| T6 | CI に browser verify ジョブ追加（`ci.yml`） | T1 の Console ゼロ検証を PR にも適用（助言的ジョブ・保護必須には未指定）。TODO.md も手動作業を最新化 | ✅ |
| T7 | Zenn 記事ドラフト2本（`docs/articles/`） | MARKETING.md「Zenn/Qiita は就活の本命」。記事1 Capacitor 化・記事2 AWS CDK+OIDC（Dockerを使わない理由の節入り）。公開はフェーズ2で X と連動 | ✅ |

## 実施順

T1 →（T1で検証しながら）T2 → T3 → T4 → T5。
T2/T3 はアプリ本体（web/js）に触れるため、完了ごとに verify（Console ゼロ・Chart.js 失敗時含む）を実施する。

## 完了ログ（新しいものを上に追記）

- ✅ **T7 Zenn 記事ドラフト2本**: `docs/articles/zenn-01-capacitor.md`（33万文字単一HTML→バンドラなし分割→Capacitor化。SSDファサード・Preferences二重化・退行3事例と自動検証）／`docs/articles/zenn-02-aws-cdk-oidc.md`（S3非公開+OAC+CloudFront・latest.json 5分TTL・OIDC最小権限・「Dockerを使わない理由」・ハマり所2つ・make aws-wire）。ともに `published: false` のZenn形式。実名ゼロ・アカウントIDは伏せ字。MARKETING.md にドラフト所在を追記。公開はフェーズ2（Xと同日）。
- ✅ **T6 CI 強化＋TODO最新化**: `ci.yml` に `verify` ジョブ追加（npm ci → playwright chromium → `npm run verify`。web/infra とは独立の助言的ジョブ＝ブランチ保護の必須には未指定）。TODO.md を全面更新: ☐0 push（未pushコミット）、☐5 リール録画→X固定ポスト（※演出用注記の規約付き）、☐6 classroom.html のPDF化、☐7 iCloud外への移設（競合コピー3件の実績を明記）、別マシンでの playwright 初回導入。

- ✅ **T5 30秒縦型リール**: `promo/reel-30s.html` 新規（単一HTML+canvas 420×740・9:16。スマホ全画面→画面録画でSNS動画化）。構成=フック2秒「同じ災害。生き残る街と、崩れる街。」→ 実験1つ（⚙効率至上都市 RB22%→⚡ショック→CRASHED ／ 断の溜め ／ 🛡冗長性確保都市 RB68%→同じショック→SURVIVED）→ 対句の結論「効率は、平時の速さ。／冗長性は、最悪の日の命。」→ エンドカード（アプリ名・URL・CTA点滅・#社会デバッガー）。**UI文言は全て実コードから転記**（プリセット名・ゲージ名・ショックボタン・ヘリ3状態・判定バナー・ターミナルログ、RB<30%崩壊/≥60%生存の実判定条件と整合）。ゴーストカーソル・4拍演出（静転動断復）・PAUSE/RESTART・プログレスバー・REC●・固定免責フッター。promo/ 配下＝本番配信(web/)対象外。**タイムライン10点のスクリーンショットQAでエラーゼロ・全シーン描画確認**。※SNS投稿時は「演出用に簡略化したデモ映像です」を添える（スキル規約）。

- ✅ **T4 教員向け1枚モノ**: `web/classroom.html` 新規（自己完結・アプリJS非依存＝アプリへの退行リスクゼロ）。内容=5分で始める3ステップ／4テーマ×問いの例（公共・情報I・探究向け）／授業の型（10分・50分・探究=T2のエクスポート活用）／扱い方の注意（架空・構造の話・integrity準拠で実名ゼロ）。画面はダーク・ターミナル調、印刷は `@media print` で白地A4・**1枚に収まることをPDF出力で確認**。README にリンク追加。web/ 配下なので Pages/AWS 両方に自動配信（`…/classroom.html`）。OUTREACH.md の教員向け雛形からリンクして使う想定。

- ✅ **T3 共有チャネル最適化**: `shareHashtag()` 新設（ja=`#社会デバッガー` / en=`#SocialDebugger`）。X導線2箇所（share.js の𝕏ボタン・監査成功ツイート）に付与し、旧 `#社会OSデバッガー` を統一。LINE はタグなし（家族・地域グループ宛てのため意図的）。`addBousai()` テンプレ変種（「防災」の語を含む）を PAGE 2 系文脈（ショック共有・P2プリセット共有）に追加。sw cache v6-355。**実ブラウザで shock/preset2 テンプレに防災変種が入ること・ja/en ハッシュタグを確認。check/verify green**。

- ✅ **T2 US-08 エクスポート（JSON/CSV）**: ≡メニューに「📊 データを書き出す (JSON)/(CSV)」を追加。`buildExportData()`（全4ページのパラメータ＋P1/P2主要メトリクス＋再現用共有URL＋街名＋schema/exported_at）→ `exportData('json'|'csv')` でダウンロード。CSVは `key,value` のフラット形式（46行）・カンマ/引用符エスケープ対応。track: `export_json`/`export_csv`。i18n は既存パターン（ja=DOM原文キャッシュ・enのみ辞書追加）。sw cache v6-354。**check green・verify green（Console ゼロ×2ケース）・実ブラウザでdownloadイベント発火まで確認**。PM.md US-08 に ✅。

- ✅ **T1 検証基盤**: `scripts/verify.mjs` 新設（Node+Playwright。SKILL.md の python 雛形を Node に移植・CDN遮断で決定的化）。ケース1=Chart.jsスタブ（正常系）／ケース2=CDN遮断（失敗系）の両方で、4タブ遷移・プリセット・スライダー操作を実行し pageerror/console.error ゼロを確認。意図的なCDN遮断由来の2メッセージのみ許可リスト化。`npm run verify`・`make verify` を配線（`check` には含めず＝CIはブラウザ非依存のまま）。playwright devDep追加＋chromium導入済み。`.claude/settings.local.json` を .prettierignore に追加（ローカル生成物が format:check を壊していた）。**check/verify とも green**。
