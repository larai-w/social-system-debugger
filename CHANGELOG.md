# 変更履歴 / Changelog

「社会＆地域インフラ・デバッガー」の主な変更点。バージョン方針は [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) を参照（v6.3 以降は 0.001 刻み、タイトル表記は小数点なしの "v6"、精密版はフッター/結果カード/README）。

---

## Phase 1 — 2026-07-06 — モバイル化・週替わりシナリオ・AWS配信基盤

配信・アーキテクチャの基盤整備（アプリのUI見た目は不変・Web挙動は維持）。7タスク。

- **タスク1 モジュール分割**: 単一 `index.html` を `web/` 配下へ機械的に分割（`css/app.css` ＋ `js/{i18n,engine,ui}.js`、以降 `native/share/scenario` を追加）。古典スクリプトでグローバル共有＝**挙動不変**（連結すると元とバイト一致）。`engine.js` は **DOM/window 非依存**（サーバー再利用・テスト用）。`deploy.yml` は `web/` を公開＝**公開URL不変**。
- **タスク2 Capacitor（iOS/Android）**: バンドラなしでネイティブ化。`native.js` の `window.SSD` ファサードに StatusBar/SplashScreen・Preferences 耐久ミラー・Haptics・Share を集約。**全て `isNative` ガードで Web は no-op**。
- **タスク3 共有経路**: 共有ポップを **X / LINE / 画像を保存** の3ボタン＋「その他のアプリで共有」に再設計（`share.js`）。LINE を `lineit/share` で X と同格に。`track('share_x'/'share_line'/'card_saved')`。
- **タスク4 週替わりシナリオ**: `check()` を宣言的 `goalConds[{metric,op,value}]` に変換（JSON化）。静的配信 `content/weekly/*.json` ＋ `latest.json`（起動時fetch・失敗時バンドルへフォールバック）。クリアで結果カードに「あなたは今週、街を守った。」＋発見「今週の守り人」、初回クリア後に週次通知許可。全て native ガード。
- **タスク5 AWS配信基盤（CDK/TS）**: `/infra` に **S3(非公開/OAC)+CloudFront**（`latest.json` のみ短TTL）。`deploy.sh` で S3同期＋最小無効化。`infra/README.md` に構成図・選定理由・コスト・セキュリティ・「Docker不要の理由」。`cdk synth` 検証済み。
- **タスク6 計測拡充**: `track()` に共通プロパティ **`app_platform`**（web/ios/android）。`weekly_fail` 追加。README に KPI 対応表。
- **タスク7 CI/CD（GitHub Actions + AWS OIDC）**: 長期キーを持たない OIDC デプロイ（main 限定・最小権限ロールを CDK 定義）。`ci.yml`（engine.js ユニットテスト・週次JSONスキーマ検証・`cdk synth`）、`deploy-aws.yml`（OIDC→S3同期→最小無効化）。**GitHub Pages の deploy は維持**（Pages＋AWS 並行）。
- **ドキュメント/DX**: `docs/DEVELOPMENT`（日英）を新モジュール構成へ更新、ルート `npm test`/`validate:weekly`/`check` を追加。

## v6.346 — 2026-07-05
- **PAGE 2 エンジン改修（ブランド閉ループ・後継者ストック・ヘリ3状態）**
- **Task A**: ブランドを因果ループへ組み込み。`brand → 税収(budget) → 保守財源 → infra → heli` の多段連鎖。財政に `budgetShortfall`（財政 < 45 で保守不足）を追加。
- **Task B**: 遅い状態変数 `skillStock`（後継者ストック）を導入。P2表示中のみ 1.2秒/tick で時間発展。DX低で減少・高で回復、均衡帯（DX25–45%）でデフォルト維持。残量が尽きると **崖関数** でブランド急落（当面平穏→ある日崩落）、0で技術消滅（`skillLost`・Public Rebootのみ復活）。ブランドカードに後継者ストックゲージを追加。
- **Task C**: 救命ヘリを **3状態化**（OPERATIONAL / WEATHER HOLD / SUSPENDED）。WEATHER HOLD はショック中の一時停止（有視界飛行の制約・約3.6秒で自動復帰）。SUSPENDED 突入時に因果連鎖 `BRAND_REVENUE↓ → TAX_BASE↓ → MAINT_BUDGET↓ → INFRA<35% → HELI:SUSPENDED` を運用ログへ1行ずつ表示（復帰時は回復の連鎖）。
- **Task D**: 回帰確認（default平穏＋4プリセットの物語を数値検証で維持）。モーダル式（Infra/Brand/Budget/Heli）と `docs/METHODOLOGY`（日英）を新モデルに更新。
- 因果の階層は厳守（ブランド→ヘリ直結はせず、必ず税収→保守→インフラを経由）。
- **SECTOR-T OPERATION LOG** の項目名を言語連動に（日本語版＝日本語ラベル／英語版＝英語ラベル、ステータス語 OK/DETECTED 等は共通）。
- 製品名リブランドの追随: フッター・結果カード・作法カードの表記を旧「社会＆地域インフラ・デバッガー」から新名称 **「社会デバッガー / Social Debugger」** に統一。

## v6.345 — 2026-07-05
- **UX改修 Tasks 1–7** (all in one release)
- **Task 1**: Product name → "社会デバッガー / Social Debugger"; tagline → "あなたの街は、生き残れるか。"
- **Task 2**: Intro modal rewritten in second-person ("あなたの街はどこから壊れるか。")
- **Task 3**: Optional town name input (`ssd_town_name`); substituted into verdict banners and result card PNG
- **Task 4**: Pre-share comment step — quick chips + free text injected into `shareMessage()` and result card
- **Task 5**: Rewind experience (P1 MVP) — after collapse, pick 1 param to change; discovery `d_p1_rewind` added
- **Task 6**: Privacy-first analytics — Plausible placeholder in `<head>`; `track()` wrapper with calls at verdict/share/preset/rewind
- **Task 7**: `manifest.json` name/short_name updated to "社会デバッガー"; `sw.js` cache bumped to `ssd-cache-v6-345`

## v6.344 — 2026-07-05
- **P2 L2 モデル修正**: `heliOp` に倫理観条件 `ef >= 0.3` を直結。低倫理なら、インフラ・予算が充分でも救命ヘリが飛ばない（実例：兵庫ドクヘリ停止）。
- リーダーの判断力・協調性の欠如が実務停止・ヘリ停止を引き起こす因果を直接表現。

## v6.343 — 2026-07-05
- **ドキュメント導線**: (?) メトリクス解説モーダルと研究者モード（フィードバック）に、**METHODOLOGY ドキュメントへのリンク**を追加。数式を検証したい研究者が最短で辿り着ける。
- 言語連動: 日本語UI時は `.md`、英語UI時は `.en.md` を GitHub Markdown ビューで開く。

## v6.342 — 2026-07-05
- **PWA化**: `manifest.json` / SVGアイコン / **network-first** Service Worker を追加。インストール可能・オフライン対応（見た目は不変）。
- **`docs/METHODOLOGY.md`** を追加（全レイヤーの計算式・しきい値・カスケード・**前提と限界**）。README 日英からリンク。

## v6.341 — 2026-07-05
- P2/P3/P4 のステータスグリッド見出しを **Page 1 と同じ言語切替方式**に（日本語版＝日本語のみ／英語版＝英語のみ）。

## v6.340 — 2026-07-05
- P2/P3/P4 のステータス見出しに日本語を追加。
- P4 ネットワークの「生活者クラスター」ラベルの**文字被りを修正**（左上へ移動）。
- 認知健全性 `HEALTHY` に日本語説明を追加。Asymmetry Timeline のラベルを日本語併記。

## v6.339 — 2026-07-04
- P2 の良好状態を **「盤石」（冗長性バッファ≥85）** と **「平穏」** で区別。

## v6.338 — 2026-07-04
- **P3 バナーをパラメータ即時判定に変更**（ノード汚染度依存の不安定さを解消）。
- P1 の中間（注意）状態を3種に区別: 分断で軋む／エコーチェンバー／あと一歩で澄む。

## v6.337 — 2026-07-04
- フィードバックフォームを実 **Formspree** エンドポイントへ接続。

## v6.336 — 2026-07-04
- P3 プリセットの並べ替え（**脊髄反射モード**を最悪＝左端に）。
- 「思考凍結」→ **「アップデート拒否 / Won't Update」** に改名（分かりやすさ）。

## v6.335 — 2026-07-04
- 全シナリオにバナーが出るよう **オレンジの「注意（中間）」バナー** を追加。
- P4「推し活炎上（複合）」と「ゲーム化進行（乗っ取り）」のバナーを区別。文言を**当事者中心**（排外的表現の是正）に。
- P3 の EARLY_STOPPING で選択中プリセットの色が残るバグを修正。
- 全ページのプリセット並びを **危機→模範（赤→緑）** で統一。

## v6.334 — 2026-07-04
- 各ページのデフォルトを初期から良好に統一。P2 バナーを「平穏／生存」で書き分け。
- **収集型「発見ログ」（全15項目）** を追加（ストリーク・通知・緊急性の煽りは不採用）。
- P3 の「アップデート拒否」に専用バナー。

## v6.333 — 2026-07-04
- 全ページに **緑の「良い状態」バナー** を追加。P4 ハイジャックログの点滅を穏やかに。

## v6.332 — 2026-07-04
- **フィードバックモーダル**（研究者トグル付き）と、各ページへの**クリーンな直接リンク**を追加。

## v6.331 — 2026-07-04
- **詳細設定アコーディオン**（P1–P3）と判定バナーのスタイル差別化。

## v6.33 — 2026-07-04
- モード崩壊ログの可読化（点滅を穏やかに）。P4 の正常ルーティングパケットを緑に。

## v6.32 — 2026-07-04
- ヘッダー・フッター・バナー・導入・結果カードを **二人称コピー（「あなたの街」）** に。

## v6.31 — 2026-07-04
- 毎フレーム閾値トグルによる**全画面フリッカーを解消**（ヒステリシス＋状態変化ガード）。

## v6.3 — 2026-07-04
- **共有システム拡張**: 全レイヤーの「判定の瞬間」共有、ページ固有テンプレ、共有作法カード同送、保存ボタン。

## v6.2 — 2026-07-03
- **共有システム追加**（文脈トリガー共有・状態別テンプレ・結果カードPNG・共有ガイド・OGP）。英語版 README 追加。

## v6.0 / v6.1 — 2026-07-02
- v6.0: 最終仕上げ（README・モバイル最適化・完全 i18n 同期）。
- v6.1: 全体監査による構造バグの一括修正。

## v5.2 — 2026-07-02
- **4ページ構成**の社会システムデバッガーへ拡張。

## v3.0 — 2026-06-20
- 地方インフラ・シミュレーション（L2）を加えた**2ページ構成**に。モード崩壊ログ（スローガン／排外トークン）を追加。

## v2.0 — 2026-06-20
- **初回リリース**（情報空間デバッガー）。CI/CD・GitHub Pages 自動デプロイを整備。

---

*出典: git 履歴（`git log`）。細部は各コミットメッセージ参照。*
