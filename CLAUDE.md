# CLAUDE.md — 社会デバッガー プロジェクト文脈

> このファイルは Claude Code がセッション開始時に自動で読み込む。
> 新しいセッションでも、これを読めば「何を作っていて・どこまで進んで・次に何をするか」が分かるようにしておく。
> **重要な作業が終わるたびに、このファイルの「進捗ログ」と「次のタスク」を更新すること。**

## このプロジェクトは何か

社会や地域インフラが「どう壊れるか」を、パラメータ操作で体験できる教育用シミュレーター。
一般ユーザーと研究者が想定ユーザー。収益化はしない。多くのユーザーに使われた実績を、
クラウドエンジニア就活・CS博士課程出願の資料にすることが目的。

- 現在の本体: 単一ファイル `index.html`（約33万文字）。Chart.js + Canvas + レスポンシブ + PWA + i18n(日英)。
- プロダクト名: 「社会デバッガー」／タグライン「あなたの街は、生き残れるか。」
- 4ページ構成: PAGE 1 情報空間 / PAGE 2 地域インフラ / PAGE 3 認知リカバリー / PAGE 4 ステークホルダー非対称性。

## 絶対に守る制約（integrity）

1. **見た目を変えない。** ダーク・ターミナル調（`--bg0:#070b14` / シアン発光 / 等幅フォント）。やわらかくするのは言葉だけ、色や質感ではない。
2. **i18n を壊さない。** 新規のユーザー向け文字列は必ず ja / en 両方の辞書に追加し `applyI18n` に乗せる。
3. **倫理方針。** 「特定の誰かではなく、どの社会にも起こる構造の話」。実在の地名・人名・進行中の政局は、批判でも称賛でも UI に出さない。抽象型（H型/T型 等）で語る。
4. **段階実装。** 一度に1タスク。着手前に宣言し、完了後に差分要点を報告。可能なら git commit を挟む。
5. **ゼロから書き直さない。** 既存の関数・変数・構造を尊重し差分を最小化する。

## 開発ツールの方針（重要）

- **コーディングは Claude Code に一本化する。** モデルは Sonnet か Opus を使う。**Haiku は使わない**（この規模の複雑な改修には力不足で、退行バグの原因になる）。
- **委任プロトコル（2026-07-09 確立）**: メインセッション（Fable 等の上位モデル）が仕様・レビュー・コミットを担い、**自己完結タスクは Opus サブエージェント（Agent tool, model: opus）に委任**する。
  - **委任してよい**: 新規の独立ファイル（scripts/・docs/・content/・promo/・web/*.html の単体ページ）、翻訳、データ作成。
  - **委任しない（直営）**: `web/js/ui.js` など本体コアの外科手術、i18n辞書・sw.js の整合が絡む改修、CLAUDE.md/進捗ログの更新。
  - **手順**: 仕様書は `docs/task-spec-template.md` の形式で書いて渡す／サブエージェントは**コミット禁止**（親がレビュー→検証→コミット）／受け入れ条件は最低限 `npm run check` green＋アプリに触れた場合は `make verify` green。**サブエージェント環境で Bash が拒否される場合があるため、受け入れコマンドは親が必ず再実行する**（エージェントの自己申告 green を鵜呑みにしない）。**Write まで拒否される場合もある**→その場合エージェントは「完成した成果物全文＋実コードに基づく検証トレース」を報告として納品し、親が転記・受け入れする（T34 で確立したフォールバック）。
  - ユーザーが「委任で」と言えば委任、指定がなければ上記基準でメインセッションが判断する。他社ツール（GPT/Copilot等）への委任はしない（文脈切断＝退行リスク。本方針の一本化と同じ理由）。
- **PM の視点（2026-07-10 ユーザー指示・恒久方針）**: スプリントは **PMP の型**（目的=ビジネス価値／スコープ／受け入れ基準／リスクと対応）で提案・報告し、**ITIL の型**（変更有効化=CIゲート通過のみ main へ・リリース管理=swキャッシュ版数・問題管理=インシデント→根本原因→恒久対策の記録・継続的改善=学びのプロトコル昇格）で運用する。1人プロジェクトなので過剰な官僚化はしない＝用語より「何を防ぐ仕組みか」を成果物に落とす。
- GitHub Copilot など他ツールへの乗り換えはしない。ツールをまたぐと文脈が切れ、退行が生まれやすい。
- claude.ai（ブラウザのClaude）で設計・レビューの相談 → 出てきたプロンプトを **ターミナルの Claude Code に貼る**、という役割分担。プロンプトは Copilot ではなく Claude Code に入れる。

## 完了ごとの必須チェック（退行防止）

作業完了を報告する前に、必ず次を実行して結果を報告に含めること:
1. ブラウザでページを開き、**Console にエラーが1件もない**ことを確認する。
2. 全4タブの遷移・プリセットを1つ・スライダー操作を実際に行い、エラーゼロを確認する。
3. Chart.js が読み込めない状況（CDNブロック等）でも、スライダー・タブ・共有など他機能が動くこと（グレースフル・デグラデーション）を確認する。

（過去に、堅牢化修正の最中に `avg` のスコープを壊す・未定義関数を呼ぶ等の退行が発生した。見た目確認だけでは見抜けないので Console 確認は毎回必須。）

**ガードレール・ラチェット方針（2026-07-11 制度化）**: バグ・事故・レビュー検出が1件出るたびに、**恒久ガードレール（テスト/CI/フック/プロトコル改訂）を必ず1件追加**する。その場しのぎの修正だけで閉じない。台帳は `docs/learnings.md`（「何が起きた→根本原因→追加したガード」の3点セットで、スプリント完了時に追記）。

## 進捗ログ（新しいものを上に追記）

- ✅ **T93（週次補充・Opus委任1件）**: 週次シナリオ **2027-W02〜W05** の4週分補充＝PAGE 5 素材第4弾「同じ火/毒/洪水も、あらかじめ開いていた条件のある街だけを壊す」（監査系・W02=P1 断層×対立フレーム／W03=P2 予備削減／W04=P3 浅読み癖／W05=P4 開けた門）。在庫は **2027-W05 まで（30週）**。確立済みの完全委任運用（委任→到達可能性CI green→親レビュー→コミット）どおり。あわせて Dependabot PR の自動 rebase ワークフロー追加（`dependabot-auto-rebase.yml`・☐12 の恒久自動化）。Issues #118。
- ✅ **T90〜T92（利用形態の説明・モバイル検証スプリント・Opus2件＋Sonnet1件＋直営）**: **T90=Opus** `web/faq.html`/`.en.html`＝「ブラウザ/PWA/ストア版（準備中）」の**正直な3形態比較**が核（週次・通知に触れないゲート遵守）＋データ保存/オフライン/研究利用。比較カード **card5**（「中身は同じ、起動のしかたを選ぶだけ」）で告知画像は計10枚。verify-pages に faq/404 追加・README 導線。**直営**: ≡メニューに「❓ よくある質問」（openAppPage('faq')・sw v6-366・DEVELOPMENT footer同期）。**T91=Sonnet** 帳簿＝CHANGELOG T85〜T89・バックフィル96 issues・learnings に IN-10/11。**T92=Opus** verify.mjs にモバイル 390×844 パス＝**4パス体制**（ブラウザ1回起動に最適化・分岐なし同一スモーク）。ユーザー側も ☐0/☐1/☐12 完了（Dependabot rebase 済み）。受け入れ: check 36 green・warn ゼロ→（本エントリ追記で T92 分の warn が再点灯=設計どおり）・4パス green・ページ検証 green・カード10枚生成・card5/FAQ 目視。
- ✅ **T87〜T89（教育キット完成・検証面の完結スプリント・Opus2件＋Sonnet1件）**: **T87=Opus** 生徒用ワークシート `web/worksheet.html`/`.en.html`（探究の型: 予想→実験→観察→考察・A4白地・書き込み罫線・PDF目視で品質確認）＋`make classroom-pdf` が4枚体制に＝**教育3点セット完成**（ガイド/スライド/ワークシート）。**親レビューで退行検出（問題管理）**: 追記文で ja ガイドが A4 1枚→2枚に溢れ→切り分けの結果 **ja 版は元々1枚ちょうどの満杯**と判明→ja は画面専用 langlink を導線に（本文追記なし）・en は短文が収まるため維持（軽微な非対称は意図的と記録）。**T88=Opus** `verify:pages`＝静的ページ群（classroom/slides/privacy/announce-cards/worksheet×両言語）の Console ゼロ＋構造検証を CI に追加＝**最後の未検証面が消滅**。**T89=Sonnet** `web/404.html`（ダーク調・日英併記・相対リンク・Pages 自動採用）＋runbook に SW との関係注記。鮮度warn は T86超過分が新たに蓄積中（設計どおり=次回バッチの指示）。受け入れ: check 36 green・verify:pages green・PDF 4枚生成。
- ✅ **T85/T86（見張り駆動スプリント＝自己改善ループの初回転）**: **T85（直営）** Chart.js 4.4.0→4.5.1（vendor-check の初検出に対応・全ハーネス green・README ja/en の「CDN読み込み」残骸も修正）。副検出: check-vendor の regex が jsdelivr ラッパー形式にしか対応しておらず標準バナーで fail →「黙って通さない」設計が機能し regex を両形式対応に修正。sw v6-365（鮮度テストの強制で DEVELOPMENT 両footerと同時更新）。**T86=Sonnet** CHANGELOG に T79〜T84 エントリ＋バックフィル T71〜T84 追記（**91 issues**・milestone T25–T84）＝**鮮度見張りの warn 2件を起点に発生した初の「機械が指示した」スプリント**。warn 解消を受け入れ条件として確認済み。
- ✅ **T82〜T84（自己改善の仕組み化スプリント・Opus1件＋Sonnet2件＋直営）**: **T82=Opus** weekly-rotate 失敗時に `restock` ラベルの Issue を自動起票（冪等=open最大1件・runbook§1参照・**Claude Code に貼るだけの補充プロンプト入り**＝障害→作業指示書の自動変換。Actions ベースなので永続）。**T83=Sonnet** `tests/freshness.test.mjs`＝sw版数/アプリ版数の文書不一致は fail・CHANGELOG/バックフィルの追記漏れは warn（**テスト36件体制**。初回実行で実バックログ2件を正しく検出）＋`make vendor-check`（Chart.js 新版点検・オフライン安全。**初回で 4.5.1 を検出**→更新は次スプリント候補）。**T84=Sonnet** `docs/learnings.md`＝インシデント9件（IN-01〜09）を「何が起きた→根本原因→恒久ガード」で台帳化。**直営**: CLAUDE.md「完了ごとの必須チェック」節に**ガードレール・ラチェット方針**（バグ1件=恒久ガード1件・台帳追記必須）を制度化。受け入れ: check 全green・vendor-check 動作確認。
- ✅ **T79〜T81（文書の正しさスプリント・Opus1件＋Sonnet2件）**: **T79=Opus** METHODOLOGY 監査＝文書の全数式・しきい値を engine.js/ui.js と全項目照合し**ドリフトゼロを確認**（研究者向け「検証可能」の約束が裏付けられた）。軽微修正3点のみ（出典パスをモジュール分割後の実在パスに・製品名統一・SECTOR-T 注記の ja/en 対称化）・要判断0件。**T80=Sonnet** DEVELOPMENT ja/en 現行化（vendor/CSP/新スクリプト5本/テスト8ファイル/新makeターゲット/完全委任フロー/Node22。親レビューで「v6.35x」という不正確な版数表記を v6.346 実値に修正）。**T81=Sonnet** CHANGELOG に T65〜T78 エントリ＋`SECURITY.md` 新規（Private vulnerability reporting 導線・best-effort 方針・既存防御4点の事実列挙）。受け入れ: check 全green（テスト30）。
- ✅ **T71〜T78（品質ゲート・発信素材の英語化スプリント・Opus4件＋Sonnet4件・親はレビュー/コミットのみ）**: **第1波(Opus)** T73=verify に≡メニュー/PWAモーダル/導線（window.open スタブ）検証を追加／T72=エクスポート38フィールド⇔DATA-DICTIONARY ja/en の整合テスト（欠落ゼロ・**テスト30件体制**）／T78=README ja/en に「アプリとして入れる(PWA)」節／T71=告知カード英語版（`?lang=en`・計8枚・card4 の⛔ゲートは en 版にも継承・`docs/announce-post.en.md`）。**第2波(Sonnet)** T74=Zenn記事1・2 に PWA/CSP/Node20実話を追記／T75=launch-en に PWA・ARCHITECTURE・実バグ3件検出ストーリー＋store-listing のスクショ節を `make store-shots` 手順に更新／T76=dependabot は root npm 監視済みと判定（変更なし）＋AGENTS.md を現行化（Write可/Bash拒否・モデル使い分け・完全委任例）／T77=バックフィル T67〜T70 追記（**計77 issues**・milestone T25–T70）＋ARCHITECTURE/cv に自己検証パイプライン追記。**親レビューでの修正2件（問題管理）**: ①ARCHITECTURE §1「唯一の外部依存=CDN Chart.js」が T57 以降陳腐化→「外部依存ゼロ（vendor同梱）」に ja/en 修正 ②AGENTS.md の「validate:weekly が到達可能性判定」誤記→到達可能性はテストスイート側と訂正。受け入れ: check 全green（30テスト）・verify 両ケース・カード8枚生成・EN card1 目視。
- ✅ **T67〜T70＋CI恒久修正（発信準備スプリント・Opus3件＋Sonnet1件＋直営）**: **CI修正（直営・問題管理）** Dependabot PR 8本の red は checkout v7 ではなく**潜在バグ**（`node --test` のグロブは Node 21+ / CI は Node 20 固定・branch protection 未設定で PR 初実行まで露呈せず）→ Node 22 化＋グロブのシェル展開化で恒久対処（push 済み 2c0c8aa）。PR の rebase 手順は **TODO ☐12**。**T67=Opus** X 月曜告知 8週分（W47〜2027-W01・対の関係を告知文でも活用）＋kpi-log に希望系vs監査系・対比ペアの計測表。**T68=Sonnet** Issues バックフィル T55〜T66 追記（計73件・milestone T25–T66）。**T69=Opus** `make store-shots`＝ストア用スクショ6枚を実エンジン操作で自動撮影（430×932@3x・ショック生存の緑バナー等。週次カードは Web 到達不能のため P4 に正しく代替）。**T70=Opus** `make announce-cards`＝X 告知画像4枚（メイン告知/iPhone 3タップ図解/Android・PC手順/週次予告）＋投稿文 `docs/announce-post.md`。**card4（週次）は使用条件ゲート付き＝Web 有効化まで投稿禁止**（保留中の決定と整合）。card1〜3 は即使用可。親の受け入れ: check green・画像10枚の実生成と目視確認済み。
- ✅ **T65/T66（制限下スプリント・委任のみ2件＝親はコミットだけ）**: **T65=Opus委任** 週次 W51〜W54 補充＝PAGE 5 素材第3弾「同じ火は、条件が揃った街だけを焼く」対比2組（P1×2 燃える街/備えた街・P2 担い手喪失・P3 確かめる習慣）。**2026年が53週の年である ISO 週の年またぎを自力処理**し `2026-W51/W52/W53 + 2027-W01` を採番。在庫は **2027/1/4週まで（残り26週）**。到達可能性CIが受け入れを自動判定（エージェント自身が check green まで自己修正・pre-clear をテストで確認しながら設計）。**T66=Sonnet委任** CHANGELOG に T50〜T64 エントリ（+35行・既存無改変）。**学び: 到達可能性CI＋Write許可により、週次補充は「委任→CI green→親コミット」だけで完結する運用が確立**（親の手計算・転記ゼロ）。機械的タスクは Sonnet で十分＝モデル使い分けの型もできた。
- ✅ **T60〜T64（セキュリティ・運用スプリント・Opus並行委任3件＋直営2件）**: **T60（直営）** CSP メタ導入＝`script-src 'self'`＋inline許容・connect は formspree/plausible のみ・object-src 'none'（T57 の外部依存ゼロ化を防御に転化。file:// 検証との相性を実測して問題なし・sw v6-364・ARCHITECTURE ja/en に追記）。**T61=Opus委任** `docs/operations-runbook.md`＝インシデント7章（ローテ失敗/Pages/AWS/SWキャッシュ事故/Console エラー/ロールバック/委任エージェント停止）を「症状→切り分け→対処→根拠ファイル」の型で。優先度マトリクス P1〜P3 付き。**T62（直営）** CI の verify ジョブに `verify:offline` を追加（助言的のまま）。**T63=Opus委任** `make classroom-pdf`＝教員ガイド ja/en を A4 PDF 自動生成（`scripts/gen-classroom-pdf.mjs`・ページ数の機械確認つき・**人間TODO ☐6 を自動化で削除**）。**T64=Opus委任** Zenn 記事4 ドラフト「AI委任統制の記録」（委任19件・W49 検出等すべて実数値・published:false）。**バックグラウンド**: 毎朝8:47 のヘルスチェック cron をセッション内に設定（check/在庫/未push/競合コピーを検査・問題のみ報告。**セッション限り・最長7日**＝新セッションで「ヘルスチェックを再セットして」と依頼すれば再設定できる）。詳細は `PROGRESS.md`。
- ✅ **T55〜T59（品質・自立性スプリント・Opus並行委任3件＋直営2件）**: **T55（直営）** アクセシビリティパス＝スライダー11本に `aria-labelledby`（ラベルspanにid付与＝言語非依存）・タブに WAI-ARIA tabs（role/aria-selected を switchTab で同期）・モーダル11個に `role="dialog" aria-modal`・閉じるボタンに aria-label。見た目は不変。**T57（直営）** Chart.js 4.4.0 をセルフホスト化（`web/vendor/`・sw CORE 追加 v6-363・.prettierignore 追加）＝**外部依存ゼロ**・初回訪問からオフライン完結。verify.mjs の失敗系は vendor パス遮断に変更（正常系は実 Chart.js で検証するようになり強化）。**T56=Opus委任** `tests/i18n-completeness.test.mjs`＝data-i18n/t()リテラル/setVerdictBanner キーの I18N.en 存在＋ja⇔en対称性を CI 化（現状欠落ゼロ・誤検知対策=後読み正規表現）。**T58=Opus委任** ポートフォリオ鮮度＝backfill に T44〜T54 追加（計61 issues・milestone名 T25–T54 に改名）・ARCHITECTURE.en/cv-highlights に PWA/オフライン検証/Lighthouse/gitleaks 反映。**T59=Opus委任** `docs/ARCHITECTURE.md`（日本語版・en原本の忠実訳・README に導線）。**ITIL/PMP 視点を恒久方針化**（本ファイル「開発ツールの方針」＋メモリ）。詳細は `PROGRESS.md`。
- ✅ **T50〜T54（PWA完成度スプリント・Opus並行委任3件＋直営2件）**: **T50（直営）** ≡メニューに「📲 アプリとして入れる」＝`beforeinstallprompt` 対応ブラウザはネイティブプロンプト、iOS Safari 等は手順モーダル（`pwaInstallModal`）へフォールバック。native/インストール済みでは非表示（`syncPwaInstallBtn`）。track: pwa_install_click/pwa_installed。i18n ja/en。sw v6-362。※インライン onclick の `if(...)` は invariants テストが誤検知するため `closePwaInstallIf(e)` ヘルパー方式（closeShareGuideIf と同じ流儀）。**T51（直営）** `npm run verify:offline`／`make verify-offline`＝依存ゼロの極小 http サーバで web/ を配信→SW 登録→回線遮断→リロードで SW キャッシュから起動・タブ遷移・Console ゼロを検証（PWA主張の自動裏付け）。**T52=Opus委任** CHANGELOG に T36〜T49 エントリ。**T53=Opus委任** `docs/store-submission.md`（238行: appId確定→共通準備→iOS/Android→審査対策→提出後。検証不能な箇所は「一般的な手順・要公式確認」明示×14。TODO ☐4 から参照）。**T54=Opus委任** `.github/workflows/lighthouse.yml`＝週1（月曜1:00 JST）＋手動で本番 Pages を Lighthouse 計測（助言的・artifacts保存・CIは落とさない）。詳細は `PROGRESS.md`。
- ✅ **T45〜T49（ポートフォリオ強化スプリント・Opus並行委任3件＋直営2件）**: **T45（直営）** README ヒーロー画像＝`npm run gen:shot`（`scripts/gen-screenshot.mjs`: 実エンジンでワイマール崩壊まで進めて撮影・値の偽装なし・`docs/assets/hero.png`）＋CI/Deploy/Weekly バッジを README ja/en 先頭に。**T46=Opus委任** `docs/ARCHITECTURE.en.md`（263行・採用担当者向け15分ツアー: Mermaid 2図・設計判断の why・コンテンツパイプライン・品質ゲート・AI委任統制・コスト。README.en に導線）。**T47（直営）** `.github/workflows/secret-scan.yml`＝gitleaks で push/PR ごとに全履歴走査（2026-07-09 の手動監査ゼロ件を CI で恒久化）。**T48=Opus委任** Zenn 記事1・2 を T44 時点の実態に同期（AWS本番ライブ化・実際に踏んだハマり所・実値は伏せ字・published:false 維持）。**T49=Opus委任** `docs/cv-highlights.en.md`（217行: pitch 3案・CV bullets 15本・STAR 4本・想定問答5問・証跡リンク。未計測のユーザー数等は書かない事実ベース）。詳細は `PROGRESS.md`。
- ✅ **T39〜T44（Opus並行委任3件＋直営3件）**: **T39** 週次 W47〜W50＝PAGE 5 素材第2弾（希望×2: W47 P2「外から来た担い手」redundancy/budget・W48 P1「誰かが、また確かめ始める」legitimacy／監査×2: W49 P3「裁く快感が、静まる街」・W50 P4。在庫12/7週まで）。**T40（直営）** `tests/weekly-reachability-p234.test.mjs`＝P2〜P4 の到達可能性を ui.js 実関数のソース抽出で自動検証（開始即クリア＋放置クリア＋到達不能を CI で検出。**導入即 W49 の開始即クリアを実検出→searchDepth≥8 ガードで修正**。P4 のみ式複製＋ソース同期アサート）。**T41** X告知 W43〜W46 下書き＋kpi-log に静か系vs轟音系の反応比較表。**T42（直営）** validate-weekly に在庫残量ガード（3週未満で警告）。**T43** README/DEVELOPMENT 鮮度＋`docs/outreach-templates.md`（教員/コミュニティ/研究者×ja/en）。**T44（直営）** GitHub ポートフォリオ化＝`make gh-project`（`scripts/gh-project-backfill.mjs`: Phase1+T1〜T43 を英語 Issues/Milestones/Labels に冪等バックフィル・運用は `docs/github-project.md`・人間側 TODO ☐11）。**権限改善: settings.local.json に Write/Edit 許可→サブエージェントが直接ファイル編集可能に**（T41 で実証）。※T39/T43 はセッション使用量上限で報告前に停止したが成果物は書き込み済み→親がレビュー・検証。**シークレット監査実施: 秘密情報の混入なし**（詳細は当該コミット時の報告）。
- ✅ **T36〜T38（Opus並行委任2件＋直営1件）**: **T37** CHANGELOG.md に「戦略実装スプリント（T1〜T35）」エントリを追加（6サブセクション: 検証基盤/機能/コンテンツ/インフラ/docs/プロセス）。**T38** 教員向け投影スライド `web/classroom-slides.html`/`.en.html`（9枚・自己完結・←→/クリック/スワイプ・JS無効でも文書として成立・classroom 両ページから導線・sw v6-361）。T37/T38 とも **Write 拒否→全文納品→親転記**のフォールバックで完遂、受け入れ（check＋verify＋スライドの Playwright スモーク）は親が代行し全green。**T36** 本ファイルの進捗ログを圧縮（T1〜T24 とフェーズ1以前を CHANGELOG/PROGRESS へのポインタ2行に集約）。詳細は `PROGRESS.md`。
- ✅ **T34/T35（Opus委任1件＋直営1件）**: **T34** 週次シナリオ W43〜W46＝PAGE 5 素材の小出し（SILENT CAPTURE系: W43 P2「静かに痩せていく街」/W44 P3「疑うのをやめた頭」、LOUD CRASH系: W45 P1「轟音の広場を、澄ませる」/W46 P4「洪水の轟く議論場」。在庫11/9週まで・4ページ全カバー）。今回はサブエージェント環境で **Write も拒否**→エージェントは設計＋数値トレース納品、親がファイル転記＋受け入れ代行（check/verify 全green）。**T35** ≡メニューに教員向けガイド/プライバシーポリシー導線（`openAppPage()` 言語連動・track付き・sw v6-360）。詳細は `PROGRESS.md`。
- ✅ **T30〜T33（Opus並行委任2件＋直営2件）**: 週次シナリオ W39〜W42（在庫10/12週まで・受け入れは親が代行実行し全green）／DEVELOPMENT.md/.en 現状同期／verify.mjs 拡張（P2ショック・P3/P4・エクスポートまでスモーク）／X固定ポスト文面＋AGENTS.md 委任ルール。プロトコル改訂: **受け入れコマンドは親が必ず再実行**。詳細は `PROGRESS.md`。
- ✅ **T25〜T29（Opus委任を初運用・パイロット成功）**: 委任プロトコル明文化（本ファイル「開発ツールの方針」参照）／リール自動録画 `make reels`（Opus実装・親レビュー済み）／プライバシーポリシー ja/en（Opus実装）／ストア用アイコン・スプラッシュ生成 `make gen-icons`／Zenn記事3質問票（TODO ☐10）。詳細は `PROGRESS.md`。
- ✅ **T1〜T24（2026-07-07〜08 の5スプリント）**: 検証基盤 verify.mjs／US-08 エクスポート／共有最適化／classroom ja/en／リール2本＋EN対応／週次 W31〜W38＋自動ローテ weekly-rotate.yml／到達可能性テスト（実バグ2件検出→修正）／デモモード ?demo=1／ストア掲載文・KPIログ・各種docs。**詳細は `PROGRESS.md` と `CHANGELOG.md`「戦略実装スプリント」に集約済み。**

- ✅ **AWS 本番デプロイ完了・ライブ**（account `339712703146` / ap-northeast-1）。公開URL **https://d3gpx0wi0z904j.cloudfront.net/**（HTTP 200・title「社会デバッガー」、latest.json 200、S3 直アクセスは 403＝OAC 正常）。CDK出力: Bucket=`socialdebuggerstack-sitebucket397a1860-ng9iqq3c1fr7` / DistId=`E10GS6FTY148VM` / DeployRole=`arn:aws:iam::339712703146:role/ssd-github-deploy`。**ハマり所2つ**: (1) 既存の GitHub OIDC プロバイダがアカウントに存在 → `-c existingOidcProviderArn=arn:aws:iam::339712703146:oidc-provider/token.actions.githubusercontent.com` を渡して重複作成回避（Makefile 既定には無いので手動 or Makefile 拡張が必要）。(2) `infra/scripts/deploy.sh` が macOS bash 3.2＋`set -u` で空配列 `"${PROFILE_ARGS[@]}"` 展開が unbound variable で落ちる → `${arr[@]+"${arr[@]}"}` ガードで修正済み。`web/config.js` は `contentBaseUrl:""`（相対）のままで CloudFront 同一オリジン配信は正常動作＝変更不要。**残: `aws-wire` の GitHub Secrets/Variables 設定は `gh` 未導入のため未実施**（値は下記「ユーザーが手を動かす設定」参照）。
- ✅ **それ以前の基盤整備（フェーズ1〜）**: モジュール分割・Capacitor・共有経路・週次シナリオ・CDK/CI-CD（フェーズ1の7タスク）、prettier+eslint と CI 一致、Stop/pre-commit フック・devcontainer・Makefile/aws-wire の仕組み化、v6.345/346 の UX・PAGE 2 モデル改修と退行バグ修正。**全て `CHANGELOG.md`（Phase 1 と v6.34x エントリ）に集約済み。**

## 次のタスク

- 決定事項: 配信は「**GitHub Pages 維持＋AWS 追加**」（URLは常に不変）。応答は日本語。委任プロトコルは上記「開発ツールの方針」。**セッション終了は `make handoff`（手順とポリシーは `docs/session-handoff.md`）**。
- **フェーズ1は完了。T1〜T38 のスプリント履歴と詳細は `PROGRESS.md` と `CHANGELOG.md`**。人間の残作業は `TODO.md`（☐2 aws-wire / ☐3 protect / ☐4 実機 / ☐5 リール投稿 / ☐9 計測有効化 ほか）。
- **T54 まで完了＝コーディング側の提案タスクは全消化**。アプリの入手経路: 今すぐ=ブラウザURL＋PWAインストール（≡メニュー「📲 アプリとして入れる」）／将来=ネイティブ（`docs/store-submission.md` のランブック、人間側 ☐4）。ポートフォリオ資産（ARCHITECTURE.en / cv-highlights.en / hero画像 / Issues バックフィル）は整備済み。次の主ボトルネックは人間側 TODO（☐11 gh 導入→`make gh-project`・☐9 計測有効化・☐5 リール投稿）と W43〜W50 の反応データ収集。週次在庫は 2027-W05（2027/2/1週）まで、`npm run check` が残り3週で警告する。
- **GitHub Issues 運用（☐11 完了後）**: スプリント開始時にタスクを**英語で issue 起票**し、完了コミット末尾に `Closes #N`。委任タスクには `process:ai-subagent` ラベル。手順は `docs/github-project.md`。
- **PAGE 5 / SWAP THE LEADER の投入判定**: design-note-page5.md §5 の状態条件（先行版=週次4週運用＋20〜30人）。現状は未達＝着手しない。素材の小出し（T34）だけ先行。

## ユーザーが手を動かす設定

**`TODO.md` に一本化した**（所要時間・手順・おすすめプラン付き）。ここには重複を書かない。
全操作は `make help` に一覧。**セッション終了前は `make handoff`**（ポリシー: `docs/session-handoff.md`）。

## 保留中（条件を満たすまで着手しない）

- **週次シナリオの Web 有効化（WEEKLY_ENABLED ガードの解除）**: ユーザー判断で保留（2026-07-10「十分に準備できたらやっていい」）。実施はユーザーの明示 OK を待つ。着手時は ①ガード解除（通知許可はネイティブ限定のまま） ②verify 3種 ③告知素材 card4/announce-post の解禁、をセットで。**それまで X 告知で週次に触れない**（見えない機能の宣伝＝嘘になる）。

- フェーズ2: 共同カウンター(累積で守られた街の数)、週替わりの守り人署名、リモートプッシュ(APNs/FCM)、AWS拡張(API Gateway+Lambda+DynamoDB)。
- SWAP THE LEADER 先行版 / PAGE 5「比較OS診断」フル実装。発動条件は別ノート `design-note-page5.md` に凍結済み（実名ゼロ・構造で語る・週替わりシナリオで小出しに検証してから）。
