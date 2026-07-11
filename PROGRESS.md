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
| T8 | 週替わりシナリオ W31〜W34（`content/weekly/`） | 在庫が W30 まで＝約3週で枯渇するところを8月下旬まで延長。PM.md「帰ってくる理由」の継続 | ✅ |
| T9 | X投稿テンプレ集（`docs/x-post-templates.md`） | MARKETING.md コンテンツカレンダーの運用を「埋めるだけ」に。W31〜W34の月曜告知は下書き済み | ✅ |
| T10 | classroom 英語版（`web/classroom.en.html`） | 将来の Show HN・海外研究者向け（MARKETING.md 海外チャネル）。ja/en 相互リンク | ✅ |
| T11 | UIフィードバック3点修正（点滅速度・モバイルログ・六角形余白） | ユーザーからの直接フィードバック（2026-07-08）。20人フェーズの「改善が最良のマーケティング」 | ✅ |
| T12 | latest.json 週次自動切替（`weekly-rotate.yml`） | 毎週月曜の手作業を恒久ゼロに。W34まで完全放置で回る | ✅ |
| T13 | リール第2弾・安全版（`promo/reel-30s-history.html`） | vertical-reel スキル「安全版（歴史題材）を先に出す」二本立て戦略 | ✅ |
| T14 | EN ローンチキット（`docs/launch-en.md`） | MARKETING.md 海外チャネル。Show HN/PH はフェーズ2ゲート付きで準備だけ先行 | ✅ |
| T15 | 週替わりシナリオ W35〜W38 | 在庫を9月中旬まで延長（自動ローテの前提） | ✅ |
| T16 | リール2本の英語キャプション（`?lang=en`） | launch-en.md チェックリスト「英語キャプション版リール」の前提を解消 | ✅ |
| T17 | classroom 2ページに OGP メタ | 共有時のリンクプレビュー整備（教員への打診はリンク共有が起点） | ✅ |
| T18 | データ辞書 `docs/DATA-DICTIONARY.md` | US-08 の研究利用を完成させる「式の対応表」。感度分析・モデル批評の受け皿 | ✅ |
| T19 | インタビュー・ガイド `docs/interview-guide.md` | PM.md「5人以上に15分インタビュー」の実施キット（質問・記録・分析の型） | ✅ |
| T20 | 週次シナリオ到達可能性テスト（＋実バグ2件修正） | 「クリア不能/即クリア」の配信事故を CI で構造的に防止 | ✅ |
| T21 | デモモード `?demo=1`（`web/js/demo.js`） | vertical-reel スキル「本体にデモモード＝実エンジン録画が最強」 | ✅ |
| T22 | README鮮度更新＋DATA-DICTIONARY.en＋研究者導線 | launch-en.md「EN磨き」。HN来訪者と海外研究者の受け皿 | ✅ |
| T23 | ストア掲載文 `docs/store-listing.md` | ☐4 実機ビルドの次工程を先回り（審査想定問答つき） | ✅ |
| T24 | KPI週次ログ `docs/kpi-log.md`＋計測有効化手順（TODO ☐9） | 「数字なき実績は実績にならない」の運用開始準備 | ✅ |
| T25 | リール自動録画 `scripts/record-reel.mjs`（**Opus委任パイロット**） | TODO ☐5 の手作業削減。委任プロトコルの実地検証 | ✅ |
| T26 | プライバシーポリシー `web/privacy.html`/`privacy.en.html`（**Opus委任2件目**） | ストア審査の必須物（store-listing の準備物を1つ消し込み） | ✅ |
| T27 | アイコン/スプラッシュ生成 `scripts/gen-icons.mjs` → `resources/` | ☐4 実機ビルドの前提物（capacitor-assets 入力規約準拠） | ✅ |
| T28 | 委任プロトコル（CLAUDE.md＋`docs/task-spec-template.md`） | 「Fable=仕様/レビュー、Opus=自己完結実装」を毎セッション自動適用のルールに | ✅ |
| T29 | Zenn記事3 取材質問票 `docs/articles/zenn-03-interview.md` | 記事3はユーザーの実体験が素材 → 回答が埋まれば執筆可能な形に（TODO ☐10） | ✅ |
| T30 | 週次シナリオ W39〜W42（**Opus委任3件目**） | 在庫を10月中旬（W42=10/12週）まで延長 | ✅ |
| T31 | DEVELOPMENT.md/.en 鮮度更新（**Opus委任4件目**） | コードの地図を現状に同期（demo.js・promo/・weekly-rotate・verify 等） | ✅ |
| T32 | verify.mjs のスモーク範囲拡張 | P2ショック注入・P3/P4操作・エクスポート生成まで Console ゼロ検証 | ✅ |
| T33 | X固定ポスト文面＋AGENTS.md に委任プロトコル | 発信初手の素材と、Codex経由サブエージェントへのルール伝播 | ✅ |
| T34 | 週次シナリオ W43〜W46＝PAGE 5 素材の小出し（**Opus委任5件目**） | design-note-page5.md §4 の融合戦略。SILENT CAPTURE/LOUD CRASH を既存メトリクスで物語化し反応を計測 | ✅ |
| T35 | ≡メニューに classroom/privacy 導線（直営） | 教員導線とストア審査必須物を、作りっぱなしからアプリ内到達可能に | ✅ |
| T36 | CLAUDE.md 進捗ログの圧縮・整備（直営） | セッション毎に読むファイルを軽く保つ（詳細は CHANGELOG/PROGRESS へ集約） | ✅ |
| T37 | CHANGELOG.md を T1〜T35 まで更新（**Opus委任6件目**） | 研究者・コントリビューター向け変更履歴の現状同期 | ✅ |
| T38 | 教員向け投影スライド `web/classroom-slides.html`/`.en.html`（**Opus委任7件目**） | MARKETING.md 教育チャネル。授業準備コストをゼロに（印刷ガイドの投影版） | ✅ |
| T39 | 週次シナリオ W47〜W50＝PAGE 5 素材第2弾（**Opus委任8件目**） | design-note §4。希望（半外部ノード）×2＋監査×2。在庫を12/7週まで延長 | ✅ |
| T40 | P2〜P4 到達可能性テスト自動化 `tests/weekly-reachability-p234.test.mjs`（直営） | 週次委任の親手計算検証を CI に置換。導入即 W49 の実バグを検出 | ✅ |
| T41 | X告知 W43〜W46＋kpi-log 崩壊モード反応比較欄（**Opus委任9件目**） | design-note §4-2 の計測を「埋めるだけ」運用に | ✅ |
| T42 | validate-weekly に在庫残量ガード（直営） | 残り3週未満で警告＝ローテ失敗前に補充時期が見える | ✅ |
| T43 | README/DEVELOPMENT 鮮度＋教員打診文面テンプレ（**Opus委任10件目**） | OUTREACH.md 教育チャネルの実行キット | ✅ |
| T44 | GitHub Issues ポートフォリオ化 `make gh-project`（直営） | NZ就活向け: 開発履歴を英語の Issues/Milestones で可視化（TODO ☐11） | ✅ |
| T45 | README ヒーロー画像 `npm run gen:shot`＋CIバッジ（直営） | 採用担当者・来訪者の第一印象（実エンジン撮影・値の偽装なし） | ✅ |
| T46 | `docs/ARCHITECTURE.en.md` 英語アーキテクチャ文書（**Opus委任11件目**） | ポートフォリオ本体: 設計判断の why を英語15分で読める形に | ✅ |
| T47 | シークレットスキャン CI `secret-scan.yml`（直営） | gitleaks で全履歴を毎 push 走査＝手動監査の恒久化 | ✅ |
| T48 | Zenn 記事1・2 の現状同期（**Opus委任12件目**） | 発信開始時に書き直しゼロで公開できる状態を維持 | ✅ |
| T49 | `docs/cv-highlights.en.md` 英文CV素材＋STAR集（**Opus委任13件目**） | 開発実績を CV の行・面接回答に変換 | ✅ |
| T50 | ≡メニューに PWA インストール導線（直営） | 今日から誰でも「アプリ」としてホーム画面に置ける | ✅ |
| T51 | オフライン起動の自動検証 `verify:offline`（直営） | 「PWAでオフライン動作」の主張を自動テストで裏付け | ✅ |
| T52 | CHANGELOG に T36〜T49 追記（**Opus委任14件目**） | 履歴の鮮度維持（ポートフォリオ整合） | ✅ |
| T53 | `docs/store-submission.md` ストア提出ランブック（**Opus委任15件目**） | ☐4 実機ビルド〜審査提出を1本道に | ✅ |
| T54 | Lighthouse 週次監査 `lighthouse.yml`（**Opus委任16件目**） | PWA/性能/a11y スコアの継続計測（助言的） | ✅ |
| T55 | アクセシビリティパス（スライダー/タブ/モーダルに ARIA・直営） | 教育利用（スクリーンリーダー）＋Lighthouse a11y。見た目不変 | ✅ |
| T56 | i18n 完全性テスト（**Opus委任17件目**） | 絶対制約「i18n を壊さない」を CI に移管（ITIL: 変更有効化） | ✅ |
| T57 | Chart.js セルフホスト化 `web/vendor/`（直営） | 唯一の外部依存を排除＝初回訪問からオフライン完結・誤爆遮断も消滅 | ✅ |
| T58 | ポートフォリオ鮮度（backfill T44〜T54・ARCHITECTURE/cv 追記）（**Opus委任18件目**） | ベネフィット実現の維持（PMP）・継続的改善の記録（ITIL） | ✅ |
| T59 | `docs/ARCHITECTURE.md` 日本語版（**Opus委任19件目**） | 国内の研究者・教育関係者向け＋国内就活の保険 | ✅ |
| T60 | CSP メタ導入（直営） | 外部依存ゼロ化（T57）を防御に転化＝第三者スクリプト注入の構造的遮断 | ✅ |
| T61 | 運用ランブック `docs/operations-runbook.md`（**Opus委任20件目**） | ITIL インシデント管理の実装（症状→切り分け→対処→根拠） | ✅ |
| T62 | CI に verify:offline 追加（直営・助言的） | PWA オフライン保証を変更有効化ゲートに昇格 | ✅ |
| T63 | 教員ガイド PDF 自動生成 `make classroom-pdf`（**Opus委任21件目**） | 人間 TODO ☐6 を恒久自動化（サービス要求の自動化） | ✅ |
| T64 | Zenn 記事4「AI委任統制」ドラフト（**Opus委任22件目**） | 19件の委任実績を発信素材化（published:false 待機） | ✅ |
| T65 | 週次 W51〜2027-W01＝対比「トリガーか条件か」（**Opus委任23件目**） | 在庫を2027/1/4週まで＝年末年始の無人運転。ISO 53週年またぎ処理 | ✅ |
| T66 | CHANGELOG に T50〜T64 追記（**Sonnet委任1件目**） | 履歴鮮度。機械的タスクは Sonnet で足りる使い分けの確立 | ✅ |
| — | CI 恒久修正: Node 22 化＋test グロブのシェル展開化（直営） | Dependabot PR red の根本原因（Node20×グロブ非互換の潜在バグ）を排除 | ✅ |
| T67 | X 月曜告知 W47〜2027-W01（8週分）＋kpi-log 拡張（**Opus委任24件目**） | 年末年始の投稿素材を「埋めるだけ」に | ✅ |
| T68 | Issues バックフィル T55〜T66 追記＝計73件（**Sonnet委任2件目**） | ポートフォリオ鮮度の定期運用 | ✅ |
| T69 | ストア用スクショ自動撮影 `make store-shots`（**Opus委任25件目**） | ☐4 提出物の自動化（実エンジン撮影・6枚） | ✅ |
| T70 | X 告知画像カード4枚＋投稿文 `make announce-cards`（**Opus委任26件目**） | PWA インストールの直感図解＋週次予告（card4 は Web 有効化までゲート） | ✅ |
| T71 | 告知カード英語版 `?lang=en`＝計8枚＋announce-post.en（**Opus委任27件目**） | Show HN・海外打診の画像素材 | ✅ |
| T72 | エクスポート⇔辞書 整合テスト（**Opus委任28件目**） | US-08 の約束を docs-as-tested に（38フィールド・欠落ゼロ） | ✅ |
| T73 | verify スモーク拡張＝メニュー/PWAモーダル/導線（**Opus委任29件目**） | 直近スプリントの新UIを Console ゼロゲートの傘に | ✅ |
| T74 | Zenn 記事1・2 再同期（**Sonnet委任3件目**） | PWA/CSP/Node20実話を反映・発信即応を維持 | ✅ |
| T75 | launch-en / store-listing 鮮度（**Sonnet委任4件目**） | Show HN 素材とスクショ手順の現行化 | ✅ |
| T76 | dependabot 網羅確認＋AGENTS.md 現行化（**Sonnet委任5件目**） | root npm は監視済みと確認。委任ルールの文書を実運用に一致 | ✅ |
| T77 | ポートフォリオ鮮度バッチ＝77 issues 化ほか（**Sonnet委任6件目**） | 鮮度維持サイクル3周目 | ✅ |
| T78 | README ja/en に PWA インストール節（**Opus委任30件目**） | 告知と README の導線整合 | ✅ |
| T79 | METHODOLOGY 監査＝全式照合・**ドリフトゼロ確認**（**Opus委任31件目**） | 研究者向け「検証可能」の約束の裏付け。軽微修正3点・要判断0件 | ✅ |
| T80 | DEVELOPMENT ja/en 現行化（**Sonnet委任7件目**） | 開発ガイドの鮮度（vendor/CSP/スクリプト5本/Node22） | ✅ |
| T81 | CHANGELOG T65〜T78＋SECURITY.md（**Sonnet委任8件目**） | 履歴鮮度＋公開リポジトリの OSS 衛生（脆弱性窓口の明示） | ✅ |

## 実施順

T1 →（T1で検証しながら）T2 → T3 → T4 → T5。
T2/T3 はアプリ本体（web/js）に触れるため、完了ごとに verify（Console ゼロ・Chart.js 失敗時含む）を実施する。

## 完了ログ（新しいものを上に追記）

- ✅ **T65/T66（第14スプリント・制限下の完全委任運用）**: **T65=Opus** 週次補充4本＝「同じ火は、条件が揃った街だけを焼く」対比2組（W51 P1 hard「同じ火は、条件が揃った街だけを焼く」／2027-W01 P1 normal「備えた街には、火が入らない」＝対の回答編／W52 P2「担い手が静かに去る」／W53 P3 hard・groundingRate 条件で pre-clear を構造的に防止）。**ISO 年またぎを自力処理**（2026=53週年→ W53 の次は 2027-W01）。エージェント自身が `npm run check` green まで自己修正＝**到達可能性CI＋Write許可で「委任→CI→親コミット」の完全委任サイクルが初めて全工程で成立**。**T66=Sonnet（初のSonnet委任）** CHANGELOG T50〜T64 エントリ（+35行・無改変追記・自己検証green）。親（Fable）の作業はレビューとコミットのみ＝制限下の運用モデルとして確立。在庫: **2027/1/4週まで・残り26週**。

- ✅ **T60〜T64（第13スプリント・セキュリティと運用・Opus並行委任3件＋直営2件）**: **T60=直営** CSP メタ＝`default-src 'self'`／script は self＋inline（onclick主体の構成のため）＋plausible（将来の計測）／connect は self+formspree+plausible／`object-src 'none'`・`base-uri 'self'`・worker/manifest self。**リスク対応**: file:// の verify との相性懸念→実測で verify 両ケース・verify:offline・gen:shot・gen:classroom-pdf 全green を確認してから確定。sw v6-364。ARCHITECTURE ja/en の品質ゲート節に追記。**T61=Opus委任** 運用ランブック＝§0 まず見る3点＋P1〜P3 優先度マトリクス＋7章（週次ローテ失敗の在庫切れ/その他切り分け・Pages・AWS 手動復旧・SWキャッシュ事故と案内文テンプレ・Console エラー時の verify 3種の使い分け・git revert ロールバック（force-push 禁止明記）・委任エージェント停止→作業ツリー回収）。全手順に根拠ファイル・検証不能な外部障害は「一般的な対応」と明示。**T62=直営** ci.yml verify ジョブに offline 検証ステップ追加（ジョブは助言的のまま）。**T63=Opus委任** `scripts/gen-classroom-pdf.mjs`＝print メディア＋preferCSSPageSize で classroom ja/en → dist/*.pdf。Console 自己検証＋サイズ＋ページ数の機械確認（実測: ja 7.1MB/1p〔CJKフォント埋込〕・en 237KB/1p）。TODO ☐6 を「自動化済み」に書き換え＝人間TODOが1件減。**T64=Opus委任** `docs/articles/zenn-04-ai-delegation.md`＝委任の定義→仕様書の型（実物引用）→統制3原則→実話3つ（Write拒否フォールバック・上限停止からの回収・W49 を CI が検出）→実数値（委任19件・テスト27件）→向く/向かない→まとめ。全数値に根拠箇所を報告で明示・published:false。**バックグラウンド常設化（第一歩）**: 毎朝8:47 の読み取り専用ヘルスチェック cron（git 競合コピー/未push/check/在庫→問題のみ ITIL の型で報告）。制約=セッション限り・最長7日（恒久化は新セッションでの再セット運用。将来はクラウド routine も選択肢）。**受け入れ**: `npm run check` 全green（テスト27）・verify 両ケース・verify:offline・PDF 2枚生成・ヒーロー再生成まで親が実行確認。

- ✅ **T55〜T59（第12スプリント・品質と自立性・Opus並行委任3件＋直営2件。ITIL/PMP 視点の適用開始）**: **T55=直営** ARIA 対応＝スライダー11本 `aria-labelledby`（P2〜P4はラベルspanに id 新設・data-i18n と共存＝言語非依存）／タブ4本 role="tab"+aria-selected（switchTab で同期）＋tabpanel／モーダル11個 role="dialog" aria-modal＋閉じるボタン aria-label="Close"。CSS/文言不変（制約1遵守）。**T56=Opus委任** i18n 完全性テスト＝①index.html の全 data-i18n キーが I18N.en に存在 ②js の t('…') リテラル＋setVerdictBanner 第3引数キーが en に存在 ③ja⇔en 辞書対称。`(?<![\w$])` 後読みで getContext('2d') 等の誤検知を排除、コメント除去は URL の // を保護。現状の欠落ゼロ・allowlist 空（理由必須の枠のみ）。**T57=直営** Chart.js 4.4.0 を `web/vendor/chart.umd.min.js`（205KB・MIT）にセルフホスト＝CDN 参照を削除し**外部依存ゼロ**。sw CORE に追加（v6-363）＝初回訪問後は完全オフライン、広告ブロッカーによる Chart 遮断も構造的に消滅。verify.mjs は失敗系を vendor パス遮断で再現する方式に更新（副産物: 正常系がスタブでなく実 Chart.js で走る＝検証強化）。vendor は .prettierignore へ（第三者コード不改変）。**T58=Opus委任** backfill TASKS に T44〜T54 の11件（英語・delegated 6件）・milestone「Delegation sprints (T25–T54)」改名＋旧名残存時の対処コメント・github-project.md 件数61に更新・ARCHITECTURE.en §4 に offline検証/PWA導線/Lighthouse/gitleaks 追記・cv-highlights bullets 2本追加。**T59=Opus委任** `docs/ARCHITECTURE.md`＝en 原本の忠実和訳（6章・Mermaid2図・訳語は DEVELOPMENT.md 準拠・「原本は en」を冒頭明記）＋README 導線1行。**受け入れ（スコープ検証）**: `npm run check` 全green（**テスト27**=i18n+3）・`make verify` 両ケース green（実Chart/遮断）・`verify:offline` green・backfill 構文OK。**問題管理**: T59 が検出した vendor の prettier warn → .prettierignore で恒久対処。**ITIL/PMP 視点を CLAUDE.md「開発ツールの方針」に恒久方針として明文化**（ユーザー指示 2026-07-10）。

- ✅ **T50〜T54（第11スプリント・PWA完成度・Opus並行委任3件＋直営2件）**: **T50=直営** PWA インストール導線＝≡メニュー「📲 アプリとして入れる」。`beforeinstallprompt` を捕捉して対応ブラウザ（Chrome/Edge/Android）はネイティブプロンプト、非対応（iOS Safari 等）は OS 別手順モーダルにフォールバック。native アプリ内・standalone 起動時は自動非表示。track 2種・i18n ja/en・sw v6-362。invariants テストがインライン `if(...)` を未定義関数と誤検知する既存仕様に合わせ `closePwaInstallIf(e)` ヘルパー化（shareGuide と同じ流儀）。**T51=直営** `scripts/verify-offline.mjs`＝SW は http 必須のため**依存ゼロの極小静的サーバを内蔵**し、オンライン読込→`navigator.serviceWorker.ready`→`context.setOffline(true)`→リロードで「SWキャッシュから起動・イントロ閉→タブ遷移可・Console/pageerror ゼロ」を検証。`npm run verify:offline`／`make verify-offline`。初回実行でイントロモーダルのクリック遮蔽を検出→対処済み。**T52=Opus委任** CHANGELOG「継続整備・ポートフォリオスプリント（T36〜T49）」（+37行・既存無改変・5サブセクション）。**T53=Opus委任** `docs/store-submission.md`（238行）＝前提費用→appId確定（後変更不可の警告）→gen:icons/cap add→iOS(TestFlight)→Android(内部テスト)→審査対策（App Privacy・輸出コンプライアンス・privacy URL 実体）→審査落ち定番対応。Apple/Google 側画面など検証不能箇所は「2026-07時点の一般的な手順・要公式確認」を14箇所明示。TODO ☐4 に参照1行。**T55候補だった掲載文再掲はせず store-listing.md 参照で重複回避。**T54=Opus委任** `lighthouse.yml`＝treosh/lighthouse-ci-action@v11・週1（cron 0 16 * * 0 = 月曜1:00 JST）＋workflow_dispatch・本番 Pages 対象・assert なし（助言的）・artifacts+一時公開ストレージにレポート保存。DEVELOPMENT ja/en に1行ずつ。受け入れ: `npm run check` 全green（テスト24）・`make verify` 両ケース green・`verify:offline` green を親が確認。委任3件とも直接ファイル編集（転記ゼロ）、ただし Bash は3件とも拒否＝受け入れは親が代行（プロトコル通り）。

- ✅ **T45〜T49（第10スプリント・ポートフォリオ強化・Opus並行委任3件＋直営2件）**: **T45=直営** `scripts/gen-screenshot.mjs`＝Playwright でワイマール崩壊プリセットを実エンジンで走らせ崩壊バナー点灯を撮影（Console エラーがあれば失敗する自己検証つき・`npm run gen:shot`→`docs/assets/hero.png` 271KB）。README ja/en 先頭にヒーロー画像＋CI/Deploy/Weekly Rotate の3バッジ。**T46=Opus委任** `docs/ARCHITECTURE.en.md`（263行）＝System overview（Mermaid: 2配信面＋Actions＋週次5分TTL）／設計判断8点の why／Content pipeline（到達可能性CIが実バグ3件を公開前検出した実績を事実ベース記載）／Quality gates／AI-assisted delivery with human governance／Cost。README.en の目立つ位置に導線1行。**T47=直営** `secret-scan.yml`＝gitleaks-action v2・fetch-depth:0 で全履歴走査・main push と PR で実行。**T48=Opus委任** zenn-01（demo.js 含む現構成・検証基盤の現状・実機ビルド未実施を正直に）／zenn-02（synth 検証→**本番ライブの実話**に書き換え・OIDC重複と bash 3.2 のハマり所を「実際に踏んだ」として追記・実値は全て伏せ字・published:false 維持）。**T49=Opus委任** `docs/cv-highlights.en.md`（217行）＝pitch 3案・CV bullets 15本（Cloud/CI-CD/Automation/AI-assisted の4分類）・STAR 4本・想定問答5問・証跡相対リンク。**未計測の数値（ユーザー数等）は一切書かず** analytics 未有効化を明示する誠実設計。受け入れ: `npm run check` 全green（テスト24・在庫22週・prettier clean）を親が最終確認。今回から Write 許可により**委任3件とも全文をエージェント自身が書き込み**、親はレビューと受け入れ再実行のみ（転記ゼロ）。

- ✅ **T39〜T44（第9スプリント・Opus並行委任3件＋直営3件）**: **T39=Opus委任** W47「外から来た担い手が、余白を戻す」(P2 hard・redundancy≥80/budget≥45・希望)／W48「誰かが、また確かめ始める」(P1 normal・legitimacy/ethicsScore・監査)／W49「裁く快感が、静まる街」(P3 normal)／W50「結果を引き受ける人を、また通す」(P4 hard)。**T40=直営** P2〜P4 到達可能性テスト＝ui.js の実関数（metricsP2/tickSkillStock/stepP3/p3Fooling）を波括弧バランスでソース抽出して headless 実行、P4 のみ式複製＋**ソース同期アサート**（式が変わるとテストが教える）。開始即クリア・放置クリア・到達不能の3類型を全在庫＋バンドル版で検証。**導入即、W49 の開始即クリアを実検出**（P3 は開始時 integrity≈95 のため integrity/dopamine だけのゴールは即成立）→ searchDepth≥8 ガード追加で修正。以後、委任シナリオの数値トレース親検証は不要（CI が担保）。**T41=Opus委任** x-post-templates に W43〜W46 月曜告知（静か系/轟音系の質感を文面に反映・goal は JSON 実文言）＋kpi-log に「崩壊モード別の反応比較」表（☐9 前でも X 側の数字だけ記録できる設計）。**T42=直営** validate-weekly に在庫残量ガード（ISO週計算で残り3週未満なら警告・現在22週）。**T43=Opus委任** README ja/en・DEVELOPMENT ja/en に classroom-slides/openAppPage を追記＋`docs/outreach-templates.md`（共通ルール6項目・教員(面識あり/なし)・研究者の3種×日英・送信前チェックリスト）。**T44=直営** `scripts/gh-project-backfill.mjs`＋`docs/github-project.md`＋`make gh-project`＋TODO ☐11＝Phase1+T1〜T43 を英語 Issues(50)/Milestones(3)/Labels(7) に冪等バックフィルし、以後は起票→`Closes #N` 運用。**運用上の学び2つ**: (1) settings.local.json に Write/Edit 許可を追加→サブエージェントが直接ファイル編集できるようになった（T41 で全工程完遂を実証）。(2) サブエージェントがセッション使用量上限で報告前に死んでも、**書き込み済み成果物は作業ツリーに残る**→親が git status から回収してレビュー・検証すれば完遂できる（T39/T43 で実証）。シークレット監査: 追跡ファイル・全 git 履歴とも秘密情報なし（.env は example のみ・認証は OIDC）。

- ✅ **T36〜T38（第8スプリント・Opus並行委任2件＋直営1件）**: **T37=Opus委任** CHANGELOG.md に「戦略実装スプリント（T1〜T35）— 2026-07-07〜09」を追加（検証・品質基盤／機能／コンテンツ・発信／インフラ／ドキュメント／プロセスの6サブセクション。既存エントリは不変更・追記のみ。親レビューで在庫延長の日付表現を W46=11/9週 に事実修正）。**T38=Opus委任** 教員向け投影スライド `web/classroom-slides.html`/`.en.html`＝9枚構成（タイトル→これは何か→4ページ地図→3分デモ→見どころ→問いかけ例→50分の型→扱い方の注意→締め）。完全自己完結・依存ゼロ・ダーク・ターミナル調・本文28px。←→キー/クリック/スワイプ/画面端ボタンで操作、JS無効時は全スライドが縦に並ぶ文書として成立。classroom ja/en 両ページに「🖥 投影用スライド版」導線（印刷時は既存 `.langlink{display:none}` で自動非表示）。sw v6-361。**T36=直営** CLAUDE.md 進捗ログを圧縮＝T1〜T24 とフェーズ1以前の詳細エントリを CHANGELOG/PROGRESS へのポインタ2行に集約（AWS デプロイのハマり所エントリは運用情報として温存）、「次のタスク」を現状同期（在庫切れ前の W47〜 補充を推奨として明記）。**T37/T38 とも Bash に加え Write も拒否**→全文納品→親転記のフォールバックで完遂。受け入れは親が代行: `npm run check` green（テスト22・スキーマ20・eslint・prettier）／`make verify` green（両ケース Console ゼロ）／スライド2ページの Playwright スモーク（キー移動 1→3→2・クリック前進・active 1枚・Console ゼロ）。

- ✅ **T34/T35（第7スプリント・Opus委任＋直営並行）**: **T34=Opus委任** 週次シナリオ W43〜W46＝PAGE 5 素材の小出し（design-note-page5.md §4）。SILENT CAPTURE系×2＝W43「静かに痩せていく街」(P2 hard・skillStock/brand・後継者の静かな枯渇)／W44「疑うのをやめた頭」(P3 normal・integrity/searchDepth)、LOUD CRASH系×2＝W45「轟音の広場を、澄ませる」(P1 normal・diversity/entropy・グリッド自動検証)／W46「洪水の轟く議論場」(P4 hard・ratio/drop)。4ページ全カバー・実名/未実装UI名称ゼロ・在庫は11/9週まで。**今回はサブエージェント環境で Bash に加え Write も拒否**＝エージェントは設計＋実式からの数値トレースまで完了し、ファイル作成と受け入れ（`npm run check` 22テスト・スキーマ20件・`make verify` 両ケースConsoleゼロ）は親が代行。P2〜P4 のトレースは親が metricsP2/tickSkillStock/applyScenarioParams の実コードで裏取り（skillLost 崖→publicReboot 救済経路まで確認）。**T35=直営** ≡メニューに「🏫 教員向けガイド」「🔒 プライバシーポリシー」を追加（`openAppPage()`＝相対URLで Pages/AWS 両対応・言語連動で `.en.html`・track: open_classroom/open_privacy・en辞書キー追加・sw v6-360）。委任の学び: サンドボックス拒否は Bash だけでなく Write にも及ぶ→**「実装不能時は設計＋検証トレースを納品、親が転記」もプロトコルの正式フォールバック**とする。

- ✅ **T30〜T33（第6スプリント・Opus並行委任）**: **T30=Opus委任** W39「再公営化の請求書」(P2 hard・リブートの財政コストがテーマ)／W40「学びすぎる頭」(P3・学習率の暴走)／W41「記憶する街」(P1・viability/resilience)／W42「シビルの洪水を堰き止める」(P4 hard)。エージェントのサンドボックスで Bash が拒否されたため**受け入れコマンドは親が代行実行**: prettier 差分ゼロ（手書きで正規形＝驚異的）・スキーマ16件・テスト22件 green（W41はグリッド自動検証、P2〜P4はエージェントの数値トレース表を親が妥当性確認）。**T31=Opus委任** DEVELOPMENT.md/.en を現状同期（読込順 …→demo、地図に promo/classroom/privacy/scripts5本/weekly-rotate、週次手順を「JSON追加だけ・ローテ自動」に、make verify を必須チェックの自動化版と明記）。**T32** verify.mjs を拡張＝P2ショック注入→P3/P4スライダー→buildExportData まで両ケースで Console ゼロ。**T33** X固定ポスト文面（動画注記ルール付き）＋AGENTS.md に委任プロトコル要点（Codexがサブエージェントに入る場合の commit 禁止等）。委任の学び: エージェント環境で Bash が拒否されるケースがある→**受け入れコマンドの親側代行**をプロトコルの正式手順に含める。

- ✅ **T25〜T29（第5スプリント・Opus委任を初運用）**: **T28** 委任プロトコルを CLAUDE.md に明文化（委任可=自己完結ファイル／直営=本体コア、サブエージェントはコミット禁止、受け入れ=check/verify green）＋仕様書テンプレ。**T25=Opus委任パイロット成功**: `scripts/record-reel.mjs`（Playwright録画でリール4本＋`?demo=1` 実機映像を dist/reels/ へ自動生成、ffmpeg あれば mp4 化。`make reels`）。親レビューで中間ファイル後始末を追加し、**録画済み webm の10秒地点フレームを実際に再生して内容確認**（demo=実エンジンの介入中画面／EN リール=COLLAPSE シーン）。**T26=委任2件目成功**: `web/privacy.html`/`privacy.en.html`（classroom と同一デザイン系・印刷白地・事実ベース7項目・制定日2026-07-09。エージェント自身が「現状は計測ゼロ」と kpi-log の事実を優先する良い判断）。**T27** `scripts/gen-icons.mjs`＝icon.svg のデザインを 1024 アイコン＋2732 スプラッシュに忠実再描画（`resources/`、capacitor-assets 入力規約）。**T29** 記事3の取材質問票10問＋記事骨子（TODO ☐10 で回答待ち）。委任の学び: 仕様書が具体的なら Opus の成果物はレビュー微修正のみで合格水準。並行作業中はサブエージェントの一時ファイルが pre-commit に掛かることがある（完了を待ってからコミットで回避）。

- ✅ **T20〜T24（第4スプリント）**: **T20** `tests/weekly-reachability.test.mjs`＝①goalConds の metric 名がページ判定文脈に実在（タイポ＝永久にクリア不能、を CI で検出）②P1系は実エンジンのグリッド全探索で「到達可能＋開始即クリアなし」を検証。配信JSON＋バンドル版の両方が対象。**導入即、実バグ2件を検出**: W28/latest と W32（＋バンドル echo_trap/ethics_cascade）が開始パラメータでゴール達成済み＝開始と同時にクリアされる設計だった → 劣化状態からの回復型に修正（テスト22件 green・sw v6-357）。**T21** `web/js/demo.js`＝`?demo=1` でゴーストカーソルが実DOMを操作（ワイマール→崩壊→フィルタ/倫理/DP介入→回復→ループ）。値の偽装なし＝実エンジン録画用。通常起動は完全 no-op を実測確認、実ブラウザで f15/e88/dp 到達と緑バナーまで確認（sw v6-359・CORE/読込順/invariants 整合）。**T22** DATA-DICTIONARY.en.md 新規／両READMEの「単一ファイルSPA」記述を現構成に更新＋classroom/辞書リンク追加／アプリ研究者モードに📊データ辞書 doclink（ja/en切替対応・sw v6-358）。**T23** `docs/store-listing.md`＝App Store/Play の掲載文（字数制限内 ja/en）・キーワード・スクショ6枚プラン・審査想定問答（政治性・最小機能・通知・データ収集）・ユーザー準備物。**T24** `docs/kpi-log.md`＝週1行のKPI表＋「track() は現状 no-op」の明示＋有効化3案の比較（Plausible/CF/なし）。TODO ☐9 登録。

- ✅ **T15〜T19（自走スプリント第3弾）**: **T15** W35=毒の底からの帰還(P3 hard)/W36=他責デッドロック解除(P2)/W37=満員の観客席(P4 hard)/W38=静かな劣化(P1)。ゴールは実式から設計（P1は実エンジンで自動検証、P2〜P4は ui.js の式から導出・開始即クリアなし）。在庫は9/14週まで、以降は weekly-rotate の失敗通知が補充リマインダー。**T16** 両リールに `?lang=en` 英語キャプションモード（EN文言もアプリ実i18nから転記、長文はフォント調整、ja/en両モードをスクリーンショット検証。フッター見切れを発見→修正）。**T17** classroom ja/en に og:title/description/image/twitter:card。**T18** `docs/DATA-DICTIONARY.md`＝エクスポート全フィールドの定義と実装式の対応表（P1は式全文、P2は因果連鎖の要旨＋崩壊条件。感度分析・授業・モデル批評の使い方例つき）。PM.md US-08 からリンク。**T19** `docs/interview-guide.md`＝15分スクリプト（再現→理解→行動）・記録テンプレ・5人後の分析の型。PM.md 計測節からリンク、TODO ☐8 に人間側の実施を登録。

- ✅ **T14 EN ローンチキット**: `docs/launch-en.md` 新規。Show HN のタイトル3案＋本文（個人開発・非営利・教育用・プライバシー・技術ノート・「モデルの粗を1つ指摘してほしい」で締める＝OUTREACH と同じ姿勢）＋想定問答の1コメント目。Product Hunt の tagline/description/メーカーコメント。**投稿前チェックリスト9項目をフェーズ2ゲートとして明記**（EN磨き・ENリール・upvote依頼禁止・投稿タイミング・批判対応方針・PH と同日にしない等）。投稿後の KPI 観測もMARKETING.md に接続。
- ✅ **T13 リール第2弾・安全版**: `promo/reel-30s-history.html` 新規（歴史題材＝二本立て戦略の先行安全版）。フック「1933年は、1タップで再現できる。」→ ⚡ワイマール崩壊プリセット（実パラメータ f88/e12/greedy）→ スローガンループ（実文言・スローガン/排外バッジ付き）→ COLLAPSE → 断「歴史は、変えられない。構造は、変えられる。」→ 同じ1933年からスライダー介入（f18/e90/DP）→ STABLE → 対句「同じ1933年から始めても、違う結末に、辿り着ける。」**数値遷移は実エンジン式と整合（entropy 78=crash / 11=p1Good）、判定語 COLLAPSE/STABLE も実カードの実文言**。タイムライン10点スクリーンショットQAでエラーゼロ。

- ✅ **T12 latest.json 週次自動切替**: `.github/workflows/weekly-rotate.yml` 新規。毎週月曜 0:00 JST（cron: 日曜15:00 UTC）に `TZ=Asia/Tokyo date +%G-W%V` でISO週を計算し、`content/weekly/<週>.json` を `latest.json` へコピーして bot コミット。**GITHUB_TOKEN の push は他ワークフローを発火させないため、Pages/AWS デプロイを `gh workflow run` で明示起動**（AWS未配線なら既存の if で安全にスキップ）。**在庫切れ週は意図的に失敗**＝書き足しリマインダー。手動 `workflow_dispatch` も可。README の週次手順を「JSONを書いてPRするだけ・切替は全自動」に更新。
- ✅ **T11 UIフィードバック3点**: ①排外モードの点滅を増速（makeP1 1.2+0.28i→0.9+0.22i / makeP2 下限1.0→0.7s / モバイル一律減速 2.6s→1.8s。可読下限は維持）。②モバイルで METRIC LOG が1文字ずつ折返されていた根本原因は **STABILITY MATRIX 内グリッドがインラインstyle `1fr 1fr` 固定**だったこと → `.stab-grid` クラス化し ≤640px で縦積み＋ログ .72rem。③レーダー（六角形）の `pointLabels.padding` 5→1・凡例 padding 5 で描画半径を拡大。**モバイル390px/デスクトップ1280px 両方をスクリーンショットで確認、verify/check green**。sw cache v6-356。PM.md US-08 にエクスポートの立場別メリット（ユーザー/研究者/開発者）を記録。

- ✅ **T10 classroom 英語版**: `web/classroom.en.html` 新規（自己完結・アプリJS非依存）。ja版と同構成（5-minute start / 4 themes+questions / lesson formats / handling notes）。ja⇔en の相互リンク（印刷時は非表示）、README に EN リンク追加。**A4・1枚に収まることを実測で確認**（印刷幅726pxで1029px < 1054px、Playwright の pageRanges 検査で1ページ確定。EN は文章が長く2ページに溢れたため印刷時フォント/行間を ja より詰めて調整）。
- ✅ **T9 X投稿テンプレ集**: `docs/x-post-templates.md` 新規。全投稿共通の固定ルール6条（#社会デバッガー 1本・URL1本・実名ゼロ・免責1行・演出動画注記・宣伝でなく結果）／月曜告知（**W31〜W34 はそのまま投稿できる下書き済み**）／木曜中間経過（無人の広場回避の注記付き）／日曜結果スレッド3部構成／随時ネタ5種（プリセット変奏・巻き戻し・発見図鑑・開発ログ・許可制引用RT）／送信前チェックリスト。MARKETING.md から参照リンク。
- ℹ️ **Actions の灰色表示は正常**: 「Deploy to AWS」は Secrets 未設定の間 `if: vars.S3_BUCKET != ''` で **skipped（灰色）になる設計**（赤=失敗にしない）。TODO ☐2 完了後に緑で稼働。TODO.md に注記を追加。

- ✅ **T8 週替わりシナリオ W31〜W34**: `2026-W31`＝冗長性ショック対抗（P2・hard）／`W32`＝リーダー倫理観の滝（P1・normal）／`W33`＝当事者の声を取り戻す（P4・normal）＝バンドル済みで未配信だった3本を配信用に本文リライト（W28〜W30と同じ二人称・物語調）。`W34`＝**新規「濁った街を、澄ませる」**（P1・hard・悪化状態 f60/e40/greedy から3条件同時回復）。**実エンジンで達成可能（f10/e85/dp で3条件成立）かつ開始即クリアでないことを確認**。スキーマ検証8件 green・実名ゼロ。W34 は既存 `sce_echo_trap` を再利用（DISCOVERIES 総数を増やさない設計。W28クリア済みユーザーにはCLEAREDバッジが先に見えるが挑戦は可能）。**在庫は8月下旬（W34=8/17週）まで**。※毎週月曜: その週のJSONを `latest.json` へコピーして配信（README の週次手順どおり）。

- ✅ **T7 Zenn 記事ドラフト2本**: `docs/articles/zenn-01-capacitor.md`（33万文字単一HTML→バンドラなし分割→Capacitor化。SSDファサード・Preferences二重化・退行3事例と自動検証）／`docs/articles/zenn-02-aws-cdk-oidc.md`（S3非公開+OAC+CloudFront・latest.json 5分TTL・OIDC最小権限・「Dockerを使わない理由」・ハマり所2つ・make aws-wire）。ともに `published: false` のZenn形式。実名ゼロ・アカウントIDは伏せ字。MARKETING.md にドラフト所在を追記。公開はフェーズ2（Xと同日）。
- ✅ **T6 CI 強化＋TODO最新化**: `ci.yml` に `verify` ジョブ追加（npm ci → playwright chromium → `npm run verify`。web/infra とは独立の助言的ジョブ＝ブランチ保護の必須には未指定）。TODO.md を全面更新: ☐0 push（未pushコミット）、☐5 リール録画→X固定ポスト（※演出用注記の規約付き）、☐6 classroom.html のPDF化、☐7 iCloud外への移設（競合コピー3件の実績を明記）、別マシンでの playwright 初回導入。

- ✅ **T5 30秒縦型リール**: `promo/reel-30s.html` 新規（単一HTML+canvas 420×740・9:16。スマホ全画面→画面録画でSNS動画化）。構成=フック2秒「同じ災害。生き残る街と、崩れる街。」→ 実験1つ（⚙効率至上都市 RB22%→⚡ショック→CRASHED ／ 断の溜め ／ 🛡冗長性確保都市 RB68%→同じショック→SURVIVED）→ 対句の結論「効率は、平時の速さ。／冗長性は、最悪の日の命。」→ エンドカード（アプリ名・URL・CTA点滅・#社会デバッガー）。**UI文言は全て実コードから転記**（プリセット名・ゲージ名・ショックボタン・ヘリ3状態・判定バナー・ターミナルログ、RB<30%崩壊/≥60%生存の実判定条件と整合）。ゴーストカーソル・4拍演出（静転動断復）・PAUSE/RESTART・プログレスバー・REC●・固定免責フッター。promo/ 配下＝本番配信(web/)対象外。**タイムライン10点のスクリーンショットQAでエラーゼロ・全シーン描画確認**。※SNS投稿時は「演出用に簡略化したデモ映像です」を添える（スキル規約）。

- ✅ **T4 教員向け1枚モノ**: `web/classroom.html` 新規（自己完結・アプリJS非依存＝アプリへの退行リスクゼロ）。内容=5分で始める3ステップ／4テーマ×問いの例（公共・情報I・探究向け）／授業の型（10分・50分・探究=T2のエクスポート活用）／扱い方の注意（架空・構造の話・integrity準拠で実名ゼロ）。画面はダーク・ターミナル調、印刷は `@media print` で白地A4・**1枚に収まることをPDF出力で確認**。README にリンク追加。web/ 配下なので Pages/AWS 両方に自動配信（`…/classroom.html`）。OUTREACH.md の教員向け雛形からリンクして使う想定。

- ✅ **T3 共有チャネル最適化**: `shareHashtag()` 新設（ja=`#社会デバッガー` / en=`#SocialDebugger`）。X導線2箇所（share.js の𝕏ボタン・監査成功ツイート）に付与し、旧 `#社会OSデバッガー` を統一。LINE はタグなし（家族・地域グループ宛てのため意図的）。`addBousai()` テンプレ変種（「防災」の語を含む）を PAGE 2 系文脈（ショック共有・P2プリセット共有）に追加。sw cache v6-355。**実ブラウザで shock/preset2 テンプレに防災変種が入ること・ja/en ハッシュタグを確認。check/verify green**。

- ✅ **T2 US-08 エクスポート（JSON/CSV）**: ≡メニューに「📊 データを書き出す (JSON)/(CSV)」を追加。`buildExportData()`（全4ページのパラメータ＋P1/P2主要メトリクス＋再現用共有URL＋街名＋schema/exported_at）→ `exportData('json'|'csv')` でダウンロード。CSVは `key,value` のフラット形式（46行）・カンマ/引用符エスケープ対応。track: `export_json`/`export_csv`。i18n は既存パターン（ja=DOM原文キャッシュ・enのみ辞書追加）。sw cache v6-354。**check green・verify green（Console ゼロ×2ケース）・実ブラウザでdownloadイベント発火まで確認**。PM.md US-08 に ✅。

- ✅ **T1 検証基盤**: `scripts/verify.mjs` 新設（Node+Playwright。SKILL.md の python 雛形を Node に移植・CDN遮断で決定的化）。ケース1=Chart.jsスタブ（正常系）／ケース2=CDN遮断（失敗系）の両方で、4タブ遷移・プリセット・スライダー操作を実行し pageerror/console.error ゼロを確認。意図的なCDN遮断由来の2メッセージのみ許可リスト化。`npm run verify`・`make verify` を配線（`check` には含めず＝CIはブラウザ非依存のまま）。playwright devDep追加＋chromium導入済み。`.claude/settings.local.json` を .prettierignore に追加（ローカル生成物が format:check を壊していた）。**check/verify とも green**。
