# 変更履歴 / Changelog

「社会＆地域インフラ・デバッガー」の主な変更点。バージョン方針は [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) を参照（v6.3 以降は 0.001 刻み、タイトル表記は小数点なしの "v6"、精密版はフッター/結果カード/README）。

---

## 発信準備・完全委任運用スプリント（T65〜T78）— 2026-07-10〜11 — 在庫2027年へ・告知素材 ja/en・品質ゲート追加

T50〜T64 に続く第14〜16スプリント（T65〜T78）。**アプリのUI見た目は不変・Web挙動は維持**（sw cache は v6-364 から変更なし）。実名・実在地名・進行中政局への言及なし（integrity準拠）。

### コンテンツ

- **週次 W51〜2027-W01（年またぎ・4本）（T65）**: 「同じ火は、条件が揃った街だけを焼く」対比2組（W51 P1 hard「同じ火は…」／2027-W01 P1 normal「備えた街には、火が入らない」という希望の対、W52 P2「担い手が静かに去る」、W53 P3 hard）。**2026年が ISO 53週の年**であることを自力処理し、`2026-W51/W52/W53 + 2027-W01` を正しく採番。**在庫は 2027/1/4週まで（残り26週）**。到達可能性 CI が受け入れを自動判定（エージェント自身が `npm run check` green まで自己修正。委任→CI green→親コミットのみ、という完全委任サイクルが初めて全工程で成立）（T65=Opus委任）。
- **X 月曜告知 8週分（W47〜2027-W01）（T67）**: `docs/x-post-templates.md` に W47〜W54・W51〜2027-W01 の月曜告知を追加。希望系（外から来た担い手・備えた街）と監査系（裁く快感・結果を引き受ける人）を交互に組み合わせ、対比ペアとしての文脈を告知文でも活用。`docs/kpi-log.md` に「希望系 vs 監査系」×「週次 vs 通常投稿」の反応比較表を追加（T67=Opus委任）。

### 品質・CI

- **Node 22 化＋test グロブのシェル展開化（直営・恒久修正）**: Dependabot PR 8本の CI red を調査した結果、原因は `node --test 'tests/*.mjs'` のグロブが Node 21+ 固定の機能であり、CI が Node 20 を使っていたことが判明（branch protection 未設定のため PR 初実行まで露呈しなかった潜在バグ）。Node 22 化＋グロブを `tests/*.mjs` からシェル展開（`$(ls tests/*.mjs)`）に変更し恒久対処。
- **エクスポート⇔辞書 整合テスト（T72）**: `tests/export-dictionary-consistency.test.mjs` を新規追加。`buildExportData()` が出力する38フィールド全てが `docs/DATA-DICTIONARY.md`/`.en.md` に定義されていることを CI 化（欠落ゼロ・**テスト30件体制**に到達）（T72=Opus委任28件目）。
- **verify スモーク拡張＝メニュー/PWAモーダル/導線（T73）**: `scripts/verify.mjs` に≡メニュー開閉・「アプリとして入れる」モーダル表示・classroom/privacy 導線の `window.open` スタブ検証を追加。直近スプリントで追加した UI を Console ゼロゲートの傘に組み込み（T73=Opus委任29件目）。

### 発信素材

- **X 告知画像・英語版（告知カード計8枚）（T71）**: `scripts/gen-announce-cards.mjs` で `?lang=en` を付与した英語版カード4枚を追加生成。メイン告知（card1）・iPhone 3タップ図解（card2）・Android/PC 手順（card3）・週次予告（card4）の en 版。card4 は Web WEEKLY_ENABLED 有効化まで投稿禁止のゲートを英語版にも継承。投稿文 `docs/announce-post.en.md` を追加（Show HN・海外打診向け）（T71=Opus委任27件目）。
- **ストア用スクショ自動撮影 `make store-shots`（T69）**: `scripts/gen-store-shots.mjs` を新規追加。Playwright で実エンジンを操作し、430×932@3x のストア規格スクリーンショット6枚を自動生成（ショック生存の緑バナー等。週次カードは Web 到達不能のため P4 に正しく代替）（T69=Opus委任25件目）。
- **README ja/en に「アプリとして入れる（PWA）」節（T78）**: ≡メニューの PWA インストール導線と README の告知が整合した。iOS Safari / Chrome / Edge の手順を簡潔に記載し、告知素材 card2 と参照を統一（T78=Opus委任30件目）。

### ドキュメント

- **Zenn 記事1・2 再同期（T74）**: `docs/articles/zenn-01-capacitor.md`・`zenn-02-aws-cdk-oidc.md` に PWA 完成・CSP 導入・Node 20 潜在バグの実話を追記。いずれも `published: false` 待機（T74=Sonnet委任3件目）。
- **launch-en / store-listing 鮮度（T75）**: `docs/launch-en.md` に PWA/ARCHITECTURE.en/実バグ3件検出ストーリーを追記。`docs/store-listing.md` のスクショ節を `make store-shots` の手順に更新（T75=Sonnet委任4件目）。
- **AGENTS.md 現行化（T76）**: 委任モデルの使い分け（Opus=創造的タスク・Sonnet=機械的タスク）、Write 可/Bash 拒否のサンドボックス実態、完全委任サイクルの確立を反映（T76=Sonnet委任5件目）。
- **Issues バックフィル77件化（T77）**: `scripts/gh-project-backfill.mjs` に T67〜T70 を追記（計77 issues・milestone を T25–T70 に更新）。`docs/ARCHITECTURE.en.md`・`docs/cv-highlights.en.md` に自己検証パイプライン（告知画像・スクショ・エクスポートの実エンジン撮影）を追記（T77=Sonnet委任6件目）。**親レビューでの修正2件（問題管理）**: ①ARCHITECTURE §1「唯一の外部依存=CDN Chart.js」が T57 以降陳腐化→「外部依存ゼロ（vendor同梱）」に ja/en 修正 ②AGENTS.md の「validate:weekly が到達可能性判定」誤記→到達可能性はテストスイート側と訂正。
- **CHANGELOG T50〜T64 追記（T66）**: 「PWA完成・品質と運用スプリント（T50〜T64）」エントリを追加（+35行・既存無改変）（T66=Sonnet委任1件目）。

### プロセス

- **Sonnet 委任の確立＝モデル使い分けの型（T66・T74〜T77）**: 機械的タスク（CHANGELOG 追記・鮮度更新・バックフィル）は Sonnet で足りると実証。Opus は設計・新規実装・数値トレースが必要な創造的タスクに集中させることで、委任サイクルの効率と品質が両立。
- **完全委任サイクルの確立（T65）**: 到達可能性 CI と Write 許可の組み合わせにより、週次シナリオ補充は「委任→CI green→親コミット」だけで完結する運用が成立。親の手計算・転記・受け入れコマンド代行がゼロになった。

## PWA完成・品質と運用スプリント（T50〜T64）— 2026-07-09〜10 — アプリとして配れる品質・外部依存ゼロ・運用ランブック

T36〜T49 に続く第11〜13スプリント（T50〜T64）。**アプリのUI見た目は不変・Web挙動は維持**（sw cache は v6-362→v6-364 に前進）。実名・実在地名・進行中政局への言及なし（integrity準拠）。

### アプリ

- **PWA インストール導線（T50）**: ≡メニューに「📲 アプリとして入れる」を追加。`beforeinstallprompt` を捕捉して対応ブラウザ（Chrome/Edge/Android）はネイティブプロンプト、iOS Safari 等は OS 別手順モーダルにフォールバック。native アプリ内・standalone 起動時は自動非表示。track 2種・i18n ja/en。`closePwaInstallIf(e)` ヘルパー方式（closeShareGuideIf と同じ流儀で invariants 誤検知を回避）。sw v6-362。
- **ARIA アクセシビリティ（T55）**: スライダー11本に `aria-labelledby`（ラベル span に id 付与＝言語非依存）、タブ4本に WAI-ARIA tabs（role/aria-selected を switchTab で同期）、モーダル11個に `role="dialog" aria-modal`、閉じるボタンに `aria-label="Close"`。CSS/文言は一切不変（制約1遵守）。Lighthouse a11y 向上の前提整備。
- **Chart.js セルフホスト化（T57）**: Chart.js 4.4.0（205KB・MIT）を `web/vendor/chart.umd.min.js` としてリポジトリに同梱。CDN 参照を削除し**外部依存ゼロ**を達成。sw CORE に追加（v6-363）＝初回訪問後は完全オフライン。広告ブロッカーによる Chart 遮断も構造的に消滅。verify.mjs の失敗系を vendor パス遮断で再現する方式に更新（副産物: 正常系が実 Chart.js で走るため検証が強化）。
- **CSP メタ（T60）**: `<meta http-equiv="Content-Security-Policy">` を導入（`default-src 'self'`・script は self＋inline＋plausible・connect は self＋formspree＋plausible・`object-src 'none'`・`base-uri 'self'`）。T57 の外部依存ゼロ化を防御に転化し、第三者スクリプト注入を構造的に遮断。file:// 検証との相性を実測確認（verify 両ケース・verify:offline・gen:shot・gen:classroom-pdf 全 green）。sw v6-364。ARCHITECTURE ja/en に追記。

### 品質・CI

- **オフライン起動検証 `verify:offline`（T51/T62）**: 依存ゼロの極小静的サーバを内蔵した `scripts/verify-offline.mjs` を新規追加。オンライン読込→SW 登録→回線遮断→リロードで「SW キャッシュから起動・イントロ閉→タブ遷移可・Console/pageerror ゼロ」を自動検証（`npm run verify:offline`／`make verify-offline`）。PWA 主張の自動裏付け。初回実行でイントロモーダルのクリック遮蔽を検出→対処済み（T51）。T62 で CI の verify ジョブに offline 検証ステップを追加（助言的のまま）。
- **i18n 完全性テスト（T56）**: `tests/i18n-completeness.test.mjs` を新規追加。① index.html の全 `data-i18n` キーが `I18N.en` に存在、② js の `t('…')` リテラル＋`setVerdictBanner` 第3引数キーが en に存在、③ ja⇔en 辞書対称性を CI 化。後読み正規表現（`(?<![\w$])`）で `getContext('2d')` 等の誤検知を排除。現状の欠落ゼロ確認済み。**テスト合計27件**に到達。
- **Lighthouse 週次監査（T54）**: `.github/workflows/lighthouse.yml` を追加。毎週月曜1:00 JST＋手動実行で本番 Pages を Lighthouse 計測（PWA/性能/a11y）。assert なし（助言的）・artifacts 保存。DEVELOPMENT ja/en に1行ずつ反映。

### 運用・ドキュメント

- **運用ランブック（T61）**: `docs/operations-runbook.md`（§0 まず見る3点＋P1〜P3 優先度マトリクス＋7章構成）。週次ローテ失敗（在庫切れ/その他）・Pages/AWS 手動復旧・SW キャッシュ事故と案内文テンプレ・Console エラー時の verify 3種の使い分け・git revert ロールバック（force-push 禁止明記）・委任エージェント停止→作業ツリー回収。全手順に根拠ファイル記載、検証不能な外部障害は「一般的な対応」と明示。ITIL インシデント管理の実装。
- **ストア提出ランブック（T53）**: `docs/store-submission.md`（238行）＝前提費用・appId 確定（後変更不可の警告）・gen:icons/cap add → iOS（TestFlight）→ Android（内部テスト）→ 審査対策（App Privacy・輸出コンプライアンス・privacy URL 実体）→ 審査落ち定番対応。Apple/Google 側画面など検証不能箇所は「2026-07時点の一般的な手順・要公式確認」を14箇所に明示。TODO ☐4 から参照。
- **教員ガイド PDF 自動生成 `make classroom-pdf`（T63）**: `scripts/gen-classroom-pdf.mjs` を新規追加。print メディア＋preferCSSPageSize で classroom ja/en を A4 PDF に自動生成（実測: ja 7.1MB/1p・en 237KB/1p）。Console 自己検証＋サイズ＋ページ数の機械確認つき。**人間 TODO ☐6 を自動化で削除**（ITIL: サービス要求の自動化）。
- **CHANGELOG T36〜T49 追記（T52）**: 「継続整備・ポートフォリオスプリント（T36〜T49）」エントリを追加（+37行・既存無改変）。

### ポートフォリオ・発信

- **ARCHITECTURE 日本語版（T59）**: `docs/ARCHITECTURE.md` を新規追加（en 原本の忠実和訳・6章・Mermaid 2図・訳語は DEVELOPMENT.md 準拠・「原本は en」を冒頭明記）。README に導線1行。国内研究者・教育関係者向け＋国内就活の保険。
- **Issues バックフィル61件化・cv-highlights 追記（T58）**: `gh-project-backfill.mjs` に T44〜T54 の11件（英語・委任6件）を追加して合計61件に。milestone「Delegation sprints (T25–T54)」に改名。ARCHITECTURE.en §4 にオフライン検証・PWA導線・Lighthouse・gitleaks を追記。cv-highlights bullets を2本追加。
- **Zenn 記事4「AI委任統制の記録」ドラフト（T64）**: `docs/articles/zenn-04-ai-delegation.md` を追加。委任の定義→仕様書の型（実物引用）→統制3原則→実話3つ（Write拒否フォールバック・上限停止からの回収・W49 を CI が検出）→実数値（委任19件・テスト27件）→向く/向かない→まとめ。全数値に根拠箇所を明示。`published: false` で待機。

### プロセス

- **ITIL/PMP 視点の恒久方針化**: CLAUDE.md「開発ツールの方針」に PMP の型（目的＝ビジネス価値／スコープ／受け入れ基準／リスクと対応）と ITIL の型（変更有効化＝CI ゲート通過のみ main へ・リリース管理＝sw キャッシュ版数・問題管理＝インシデント→根本原因→恒久対策の記録・継続的改善＝学びのプロトコル昇格）をスプリント提案・報告の標準様式として明文化（ユーザー指示 2026-07-10）。1人プロジェクトのため過剰な官僚化はせず、用語より「何を防ぐ仕組みか」を成果物に落とす。
- **バックグラウンド・ヘルスチェック（第一歩）**: 毎朝8:47 の読み取り専用 cron（git 競合コピー/未 push/check/在庫残量を検査し、問題のみ ITIL の型で報告）をセッション内に設定。制約＝セッション限り・最長7日（恒久化は新セッションで再セット、将来はクラウド routine も選択肢）。

## 継続整備・ポートフォリオスプリント（T36〜T49）— 2026-07-09 — コンテンツ第2弾・到達可能性CI全ページ化・GitHub/英語ポートフォリオ

T1〜T35 に続く第8〜10スプリント（T36〜T49）。**アプリのUI見た目は不変・Web挙動は維持**（sw cache は v6-360→v6-361 に前進）。実名・実在地名・進行中政局への言及なし（integrity準拠）。

### コンテンツ

- **週次シナリオ W47〜W50（PAGE 5 素材第2弾）**: design-note-page5.md §4 の融合戦略の第2弾。W47「外から来た担い手が、余白を戻す」（P2 hard・redundancy≥80/budget≥45＝**希望**＝半外部ノードの流入）、W48「誰かが、また確かめ始める」（P1 normal・legitimacy/ethicsScore＝**監査**）、W49「裁く快感が、静まる街」（P3 normal）、W50「結果を引き受ける人を、また通す」（P4 hard）。**在庫を W46 から W50（12/7週）まで延長**（T39）。
- **X告知 W43〜W46 下書き**: `docs/x-post-templates.md` に W43〜W46 の月曜告知を追加（静か系＝SILENT CAPTURE／轟音系＝LOUD CRASH の質感を文面に反映・goal は配信JSONの実文言を転記）（T41）。
- **kpi-log 反応比較表**: `docs/kpi-log.md` に「崩壊モード別の反応比較」表を追加（design-note §4-2 の計測を、analytics 有効化前でも X 側の数字だけ埋められる運用に）（T41）。

### 品質

- **P2〜P4 到達可能性テスト**: `tests/weekly-reachability-p234.test.mjs`＝ui.js の実関数（`metricsP2`/`tickSkillStock`/`stepP3`/`p3Fooling`）を波括弧バランスでソース抽出して headless 実行（P4 のみ式複製＋**ソース同期アサート**＝式が変わるとテストが教える）。開始即クリア・放置クリア・到達不能の3類型を全在庫＋バンドル版で検証。**導入即、W49 の開始即クリアを実検出**（P3 は開始時 integrity≈95 のため integrity/dopamine だけのゴールが即成立）→ searchDepth≥8 ガードで修正。以後、委任シナリオの数値トレース親検証は不要（CI が担保）（T40）。
- **在庫残量ガード**: `scripts/validate-weekly.mjs` に ISO週計算で残り3週未満なら警告する在庫残量チェックを追加＝週次ローテ失敗前に補充時期が見える（T42）。
- **gitleaks シークレットスキャン CI**: `.github/workflows/secret-scan.yml`＝gitleaks-action v2・`fetch-depth:0` で全 git 履歴を毎 push／PR 走査＝手動シークレット監査（当スプリントも追跡ファイル・全履歴とも秘密情報ゼロを確認）の恒久化（T47）。

### アプリ

- **≡メニューに classroom/privacy 導線**: 「教員向けガイド」「プライバシーポリシー」を ≡ メニューに追加（`openAppPage()`＝相対URL・言語連動で `.en.html`・track: open_classroom/open_privacy）。作りっぱなしだった教員導線とストア審査必須物をアプリ内到達可能に（T35）。
- **教員向け投影スライド ja/en**: `web/classroom-slides.html`/`.en.html`＝9枚構成（タイトル→これは何か→4ページ地図→3分デモ→見どころ→問いかけ例→50分の型→扱い方の注意→締め）。完全自己完結・依存ゼロ・ダーク/ターミナル調・本文28px。←→キー/クリック/スワイプ/画面端ボタン操作、JS無効時は全スライドが縦に並ぶ文書として成立。classroom ja/en 両ページに投影スライド版導線（印刷時は自動非表示）（T38）。

### ポートフォリオ・ドキュメント

- **CHANGELOG に T1〜T35 エントリ**: 「戦略実装スプリント（T1〜T35）」を追加（検証・品質基盤／機能／コンテンツ・発信／インフラ／ドキュメント／プロセスの6サブセクション）（T37）。
- **CLAUDE.md 進捗ログ圧縮**: T1〜T24 とフェーズ1以前の詳細エントリを CHANGELOG/PROGRESS へのポインタに集約し、セッション毎に読むファイルを軽く保つ（AWS デプロイのハマり所は運用情報として温存）（T36）。
- **`make gh-project`（英語 Issues 50件バックフィル）**: `scripts/gh-project-backfill.mjs`＋`docs/github-project.md`＝Phase1＋T1〜T43 を英語 Issues(50)/Milestones(3)/Labels(7) に冪等バックフィルし、以後は起票→`Closes #N` 運用（採用向けに開発履歴を英語で可視化）（T44）。
- **`docs/ARCHITECTURE.en.md`（英語アーキテクチャ文書・263行）**: System overview（Mermaid: 2配信面＋Actions＋週次5分TTL）／設計判断8点の why／Content pipeline（到達可能性CIが公開前に実バグ3件を検出した実績）／Quality gates／AI-assisted delivery with human governance／Cost。README.en に導線1行（T46）。
- **`docs/cv-highlights.en.md`（英文CV素材・217行）**: pitch 3案・CV bullets 15本（Cloud/CI-CD/Automation/AI-assisted の4分類）・STAR 4本・想定問答5問・証跡相対リンク。**未計測の数値（ユーザー数等）は一切書かず** analytics 未有効化を明示する誠実設計（T49）。
- **README ヒーロー画像＋バッジ**: `scripts/gen-screenshot.mjs`（`npm run gen:shot`）＝Playwright でワイマール崩壊プリセットを**実エンジンで走らせ崩壊バナー点灯を撮影**（Console エラーがあれば失敗する自己検証つき→`docs/assets/hero.png`）。README ja/en 先頭にヒーロー画像＋CI/Deploy/Weekly Rotate の3バッジ（値の偽装なし）（T45）。
- **Zenn 記事同期**: `docs/articles/` の記事1（demo.js 含む現構成・検証基盤の現状・実機ビルド未実施を正直に）／記事2（synth 検証→**本番ライブの実話**に書き換え・OIDC重複と macOS bash 3.2 のハマり所を実体験として追記・実値は伏せ字・`published:false` 維持）（T48）。
- **outreach テンプレ**: `docs/outreach-templates.md`（共通ルール6項目・教員(面識あり/なし)・研究者の3種×日英・送信前チェックリスト）＋ README/DEVELOPMENT（日英）に classroom-slides/openAppPage を反映（T43）。

### プロセス

- **サブエージェントの直接編集を解禁**: `settings.local.json` に Write/Edit 許可を追加＝サブエージェントが全文納品→親転記のフォールバックなしに**直接ファイルを書き込める**ようになった（当スプリントの委任は全文をエージェント自身が書き込み、親はレビューと受け入れ再実行のみ）。
- **成果物は作業ツリーから回収可能という学び**: サブエージェントがセッション使用量上限で報告前に死んでも、**書き込み済み成果物は作業ツリーに残る**→親が `git status` から回収してレビュー・検証すれば完遂できる（T39/T43 で実証）。

## 戦略実装スプリント（T1〜T35）— 2026-07-07〜09 — 検証基盤・研究者/教育導線・AWS本番ライブ・委任プロトコル

フェーズ1後の7スプリント（T1〜T35）。**アプリのUI見た目は不変・Web挙動は維持**、フッターバージョンは v6.346 据え置き（sw cache は v6-347→v6-360 に前進）。実名・実在地名・進行中政局への言及なし（integrity準拠）。

### 検証・品質基盤

- **検証スクリプト `scripts/verify.mjs`**: Playwright で Chart.js 正常系／CDN遮断（失敗系）の2ケースを実行し、4タブ遷移・プリセット・スライダー操作の Console/pageerror ゼロを自動検証（`npm run verify`／`make verify`）。後に **P2ショック注入→P3/P4スライダー→エクスポート生成まで**スモーク範囲を拡張（T1/T32）。
- **週次シナリオ到達可能性テスト**: `tests/weekly-reachability.test.mjs`＝goalConds の metric 名が判定文脈に実在するか、P1系は実エンジンのグリッド全探索で「到達可能かつ開始即クリアなし」を検証。**導入即、実バグ2件を検出**（配信JSON／バンドル版が開始パラメータでゴール達成済み＝即クリア設計）→ 劣化状態からの回復型に修正（T20）。
- **リント/整形と CI 一致**: prettier + eslint を導入（`no-undef`/`no-unused-vars` は無効化＝明白なバグ系ルールのみ、密な手書きフロントは整形対象外）。`npm run check` = test＋週次検証＋eslint＋prettier に合流し、**CI の web ジョブを `npm ci`＋`npm run check` に統一**（lint/format 崩れが main に入らない）。ブランチ保護スクリプト `make protect`。
- **開発フロー自動化**: セッション停止時に競合コピー/未コミット/未push を警告する Stop フック、コミット前に `npm run check` を走らせる pre-commit フック（`make hooks`）、Node20＋gh＋aws-cli の devcontainer で別マシン/Codespaces でも同一環境。`make handoff` で終了前一括検証。

### 機能

- **US-08 研究者向けエクスポート**: ≡メニューから全4ページのパラメータ＋P1/P2主要メトリクス＋再現用共有URL＋街名を **JSON/CSV** でダウンロード（`buildExportData()`／`exportData()`、track: `export_json`/`export_csv`）。研究者ペルソナの「教材・引用可能な再現性」に対応（T2）。
- **共有チャネル最適化**: 固定ハッシュタグ `shareHashtag()`（ja=`#社会デバッガー` / en=`#SocialDebugger`）を X 導線に統一。PAGE 2 系文脈に「防災」語を含むテンプレ変種 `addBousai()`（LINE拡散狙い）（T3）。
- **デモモード `?demo=1`**: ゴーストカーソルが実DOMを操作して自動再生（ワイマール→崩壊→介入→回復→ループ）。値の偽装なし＝実エンジン録画用。通常起動は完全 no-op（T21）。
- **≡メニューに classroom/privacy 導線**: 「教員向けガイド」「プライバシーポリシー」を追加（`openAppPage()`＝相対URLで Pages/AWS 両対応・言語連動で `.en.html`・track: open_classroom/open_privacy・sw v6-360）。作りっぱなしだった教員導線とストア審査必須物をアプリ内到達可能に（T35）。

### コンテンツ・発信

- **週次シナリオ在庫 W31〜W46**: 在庫を W30 から W46（11/9週）まで段階延長（自動ローテの前提）。**W43〜W46 は PAGE 5 素材の小出し**＝design-note-page5.md §4 の融合戦略で、SILENT CAPTURE系（後継者の静かな枯渇・疑うのをやめた頭）と LOUD CRASH系（轟音の広場・洪水の議論場）を既存メトリクスで物語化し反応を計測。全ページカバー・実名/未実装UI名称ゼロ（T8/T15/T30/T34）。
- **週次自動ローテ `weekly-rotate.yml`**: 毎週月曜0:00 JST に ISO週を計算して `content/weekly/<週>.json` を `latest.json` へコピーして bot コミットし、Pages/AWS デプロイを `gh workflow run` で明示起動。在庫切れ週は意図的に失敗＝補充リマインダー（T12）。
- **教育・広報素材**: 教員向け1枚モノ `web/classroom.html`/`.en.html`（A4印刷→PDF・アプリJS非依存・ja⇔en相互リンク・OGP付き）、プライバシーポリシー `web/privacy.html`/`.en.html`（ストア審査必須物）、30秒縦型リール2本（`promo/reel-30s.html`＝効率vs冗長性／`reel-30s-history.html`＝歴史題材の安全版、両者 `?lang=en` 対応）とその自動録画 `make reels`（`scripts/record-reel.mjs`）、ストア用アイコン/スプラッシュ生成 `scripts/gen-icons.mjs`（T4/T5/T10/T13/T16/T25/T26/T27）。

### インフラ

- **AWS 本番デプロイ・ライブ**（ap-northeast-1）: S3(非公開/OAC)+CloudFront を実デプロイし CloudFront URL で公開（HTTP 200・S3直アクセスは403＝OAC正常）。**GitHub Pages と並行**（公開URLは常に不変）。
- **仕組み化**: `make aws-deploy`→`make aws-wire`（CDK出力→GitHub Secrets/Variables と `web/config.js` を gh CLI で自動配線）、cdk-nag(AwsSolutions) 組込み、`deploy.sh` の macOS bash 3.2 空配列バグ修正。

### ドキュメント

- データ辞書 `docs/DATA-DICTIONARY.md`/`.en.md`（エクスポート全フィールドの定義と実装式の対応表）、METHODOLOGY/DEVELOPMENT（日英）の現状同期、EN ローンチキット `docs/launch-en.md`（Show HN/PH ドラフト＋フェーズ2ゲート）、ストア掲載文 `docs/store-listing.md`、KPI週次ログ `docs/kpi-log.md`、インタビュー・ガイド `docs/interview-guide.md`、X投稿テンプレ集 `docs/x-post-templates.md`、Zenn 記事ドラフト3本（`docs/articles/`）、**PAGE 5 設計凍結 `design-note-page5.md`**（実名ゼロ・構造で語る発動条件）。

### プロセス

- **委任プロトコル確立**: メインセッション（上位モデル）が仕様・レビュー・コミットを担い、自己完結タスクを Opus サブエージェントに委任（`docs/task-spec-template.md`・AGENTS.md）。サブエージェントは**コミット禁止**。学び2点をプロトコルに正式化: **受け入れコマンド（`npm run check`／`make verify`）は親が必ず再実行**（自己申告 green を鵜呑みにしない）／**サンドボックスで Write が拒否された場合は設計＋検証トレースを納品し親が転記**するフォールバック（T25〜T35 で実運用）。

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
