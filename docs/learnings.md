# 学びの台帳 / Learnings Log

> バグ・事故が起きるたびに**恒久ガードレールを1件追加する**（ガードレール・ラチェット方針）。
> 同じ失敗を2度しないことより、失敗を仕組みに変換することを記録する。
> ITIL の継続的改善（CSI）を1人プロジェクトに適用した実績として、ポートフォリオにも供する。

---

## 追記ルール（読む前に）

- スプリント完了時、事故・非想定挙動があれば本ファイルの末尾にエントリを追加する。
- 各エントリの3点セット: **何が起きたか（1〜2行）→ 根本原因 → 追加した恒久ガード（ファイル/仕組み名）**。
- 根拠として PROGRESS.md / CHANGELOG.md の参照箇所を短く付ける。
- 誇張・創作なし。実名・実在地名・進行中政局への言及なし（integrity 準拠）。

---

## インシデント一覧

### IN-01: `avg` スコープ破壊・未定義関数呼び出しによる退行バグ群

**何が起きたか**
堅牢化修正の最中に、`updateAll` 内の `avg` 変数がブロック外スコープを壊した。また `checkScenarioGoal` から
未定義の `saveDiscoveries`/`unlock` が呼ばれ、Chart.js `onerror` も定義前の関数を参照していた。
見た目は正常でも Console にエラーが出る状態が見逃され、複数コミットを経て発覚した。

**根本原因**
「見た目確認だけで完了とする」暗黙ルールが存在し、Console 検証を毎回行う習慣がなかった。
グローバルスコープ共有のバンドラなし構成では、変数スコープと読み込み順の誤りが Console に
しか現れないため、見た目テストでは見抜けない。

**追加した恒久ガード**
- `CLAUDE.md` 「完了ごとの必須チェック」節（Console ゼロ・4タブ遷移・Chart.js 失敗時）を明文化（フェーズ1以前）。
- `scripts/verify.mjs`（T1）: Playwright で Chart.js 正常系／CDN 遮断系の2ケースを自動再生し
  Console/pageerror ゼロを検証（`npm run verify` / `make verify`）。後に P2ショック・P3/P4・エクスポート
  生成・≡メニュー/PWAモーダル/導線まで拡張（T32/T73）。

**根拠**: `CLAUDE.md`「完了ごとの必須チェック（退行防止）」節のカッコ書き /"過去に…退行が発生した"。
PROGRESS.md T1 完了ログ。

---

### IN-02: iCloud 競合コピー事故（index.html が巻き戻された）

**何が起きたか**
リポジトリが `~/Documents`（iCloud Drive）配下にあったため、iCloud が `index.html` の編集を
競合コピー（Conflicted Copy）として別名保存し、元ファイルを古い状態に巻き戻した。
複数セッションにまたがる編集ロストが3件確認された。

**根本原因**
iCloud Drive は `.git` ディレクトリと競合しやすく、特に大きなファイル（約33万文字の index.html）で
競合コピーが発生しやすい。iCloud 外にリポジトリを置く運用が徹底されていなかった。

**追加した恒久ガード**
- `scripts/handoff-hook.sh`（Stop フック）: セッション停止毎に競合コピー・未コミット・未 push を自動警告
  （`.claude/settings.json` 経由・非ブロッキング）。
- `scripts/handoff-check.sh`（`make handoff`）: 終了前に競合コピー/未コミット/未 push/テストを一括検証。
- `TODO.md` ☐7: リポジトリの iCloud 外移設を「おすすめプラン」として記録（未実施・人間側 TODO）。

**根拠**: CHANGELOG.md「戦略実装スプリント（T1〜T35）— 開発フロー自動化」節。
PROGRESS.md T6 完了ログ（`TODO.md` に競合コピー3件の実績を明記）。

---

### IN-03: 週次シナリオ W28/W32（＋バンドル2本）の開始即クリア

**何が起きたか**
配信 JSON（W28/latest）および W32、さらにバンドル版 `echo_trap`/`ethics_cascade` の2本が、
開始パラメータの時点でゴール達成済みになっていた。
アプリを起動した瞬間にクリアバナーが出る状態で、シナリオとして成立していなかった。

**根本原因**
シナリオ作成時に「開始状態でゴール未達成であること」を手計算のみで検証しており、
実エンジンへの機械的テストがなかった。goalConds の metric 名の誤記（タイポ）も
永久クリア不能を生む別の経路として潜在していた。

**追加した恒久ガード**
- `tests/weekly-reachability.test.mjs`（T20）: P1 系シナリオを実エンジンのグリッド全探索で
  「到達可能かつ開始即クリアなし」を CI 検証。goalConds の metric 名の実在も確認。
- `tests/weekly-reachability-p234.test.mjs`（T40）: P2〜P4 の到達可能性を ui.js 実関数の
  ソース抽出で検証。開始即クリア・放置クリア・到達不能の3類型を全在庫＋バンドル版でカバー。

**根拠**: CHANGELOG.md「検証・品質基盤 — 週次シナリオ到達可能性テスト」節。
PROGRESS.md T20 完了ログ（「導入即、実バグ2件を検出」）。

---

### IN-04: 週次シナリオ W49 の開始即クリア（P2〜P4 テスト導入後に即検出）

**何が起きたか**
T40 で P2〜P4 の到達可能性テストを導入した直後、W49（P3）が開始時に
integrity ≈ 95 のため、integrity/dopamine だけのゴールが即成立することが判明した。
公開前に CI が自動検出した（ユーザーへの配信事故にはならなかった）。

**根本原因**
P3 は開始パラメータの初期値が高く、integrity 単独条件では起動直後にゴールを満たしてしまう。
P1 テスト（T20）の範囲が P2〜P4 に及んでいなかった。

**追加した恒久ガード**
- `tests/weekly-reachability-p234.test.mjs`（T40）の導入自体が恒久対策。
  W49 の当該ゴールに `searchDepth >= 8` ガードを追加して修正（同スプリント内で完結）。
- P4 のみ「式複製＋ソース同期アサート」: ui.js 側の式が変わるとテストが壊れる設計にし、
  式のドリフトを CI に教えさせる。

**根拠**: PROGRESS.md T40 完了ログ（「導入即、W49 の開始即クリアを実検出」）。
CHANGELOG.md「品質 — P2〜P4 到達可能性テスト」節。

---

### IN-05: Node 20 × `node --test` グロブ非互換（Dependabot PR が露呈）

**何が起きたか**
`node --test 'tests/*.mjs'` のグロブ展開は Node 21+ でサポートされた機能だったが、
CI は Node 20 固定で運用しており、ローカルも Node 20 のため問題が顕在化していなかった。
Dependabot が依存関係更新の PR を8本作成したタイミングで CI が赤くなり、
潜在バグが初めて露呈した。branch protection が未設定だったため PR 初実行まで気付けなかった。

**根本原因**
CI のノードバージョンが Node 20 固定なのに、`package.json` のテストスクリプトが
Node 21+ 前提のグロブ構文を使っていた。CI は main push では tests が少なく通過し、
Dependabot PR 初実行まで潜伏した。

**追加した恒久ガード**
- Node 22 への統一（`ci.yml` / `.nvmrc` 相当）と、グロブを `$(ls tests/*.mjs)` のシェル展開に変更
  （T67 スプリント直営・恒久修正）。
- 教訓として branch protection の重要性を確認（TODO ☐3）。

**根拠**: CHANGELOG.md「品質・CI — Node 22 化＋test グロブのシェル展開化」節。
PROGRESS.md CI 恒久修正のエントリ（「Dependabot PR 8本の red は…潜在バグ」）。

---

### IN-06: サブエージェントの Bash/Write 拒否によるタスク不完遂

**何が起きたか**
Opus サブエージェントに委任したタスクで、サンドボックスが Bash コマンドの実行を拒否した。
さらに T34 では Write まで拒否され、エージェントがファイルを自力で書き込めない状態になった。
委任タスクの受け入れコマンド（`npm run check`）がエージェント内で実行できず、
「green です」という自己申告だけが返ってくる状況が発生した。

**根本原因**
Claude Code のサンドボックス環境はセッションや設定によって Bash/Write 権限が変動する。
親セッションが「サブエージェントの自己申告を鵜呑みにする」運用だと、
実際には未検証の成果物が取り込まれるリスクがある。

**追加した恒久ガード**
- **受け入れコマンドは親が必ず再実行**（T30 でプロトコルに明文化: `CLAUDE.md`「委任プロトコル」節）。
  エージェントの自己申告 green を正式には採用しない。
- **Write 拒否時のフォールバック**（T34 で確立）: エージェントは「完成した成果物全文＋実コードに基づく
  検証トレース」を報告として納品し、親が転記・受け入れする。
- `settings.local.json` に Write/Edit 許可を追加（T39〜T44 スプリントで解禁）:
  サブエージェントが直接ファイルを書き込めるようになり、転記コストをゼロに。

**根拠**: PROGRESS.md T30 完了ログ（「受け入れコマンドの親側代行をプロトコルの正式手順に」）、
T34 完了ログ（「Write も拒否→エージェントは設計＋検証トレース納品、親がファイル転記＋受け入れ代行」）、
T39〜T44 完了ログ（「settings.local.json に Write/Edit 許可」）。

---

### IN-07: セッション上限でのエージェント停止（成果物が報告前に孤立）

**何が起きたか**
T39/T43 で Opus サブエージェントがセッション使用量の上限に達し、
報告メッセージを返す前に停止した。成果物がワークツリーに書き込まれたまま孤立した状態になった。

**根本原因**
大きなタスク（週次4本の設計＋数値トレース・テンプレート集＋教員打診文面）を1委任に詰め込んだため
セッション上限に達した。親は成果物の存在を知らないまま別の対応を取るリスクがあった。

**追加した恒久ガード**
- 「書き込み済み成果物はワークツリーに残る」という事実をプロトコルに明記（CLAUDE.md・AGENTS.md）。
  停止後は親が `git status` でファイルを確認し、仕様書の受け入れ条件を自分で検証してコミットする。
- `docs/operations-runbook.md` §7「委任エージェント関連（セッション上限で停止した）」に
  回収手順を整備（T61）。
- 委任タスクの粒度を「自己完結・新規ファイル単位」に保ち、本体コアの外科手術は直営とするルールを維持。

**根拠**: PROGRESS.md T39〜T44 完了ログ（「成果物は作業ツリーから回収可能という学び」）。
operations-runbook.md §7。

---

### IN-08: ARCHITECTURE の外部依存記述の陳腐化・DEVELOPMENT の版数誤記（親レビューで検出）

**何が起きたか**
T71〜T78 スプリントで Sonnet が AGENTS.md を現行化した際、
`ARCHITECTURE.en.md` §1 の「唯一の外部依存＝CDN Chart.js」という記述が
T57（Chart.js セルフホスト化）以降に陳腐化していたことを親レビューで発見した。
また DEVELOPMENT.md を Opus が更新した際、フッターバージョンが「v6.35x」という
不正確な表記になっていたことを親が確認・修正した（実値は v6.346）。

**根本原因**
サブエージェントは自身が担当したタスク範囲外のドキュメントの陳腐化に気付けない。
ドキュメント同士の整合性チェックが人間のレビューにしか存在しない状態だった。

**追加した恒久ガード**
- 親レビューで「アーキテクチャ的事実の記述」を含む文書は必ずコード実態と照合する運用を継続。
- `tests/` に鮮度見張りテストの追加（T83 として計画中・当スプリントで追加予定）:
  ARCHITECTURE 等の文書中の key facts が engine.js/ui.js の実装と一致するかを CI 化する。
- PROGRESS.md に「親レビューでの修正」を問題管理の記録として残す（T77 完了ログの「問題管理2件」）。

**根拠**: CHANGELOG.md「発信準備スプリント（T65〜T78）— ドキュメント」節（「親レビューでの修正2件」）。
PROGRESS.md T77 完了ログ・T80 完了ログ（「親レビューで版数誤記を修正」）。

---

### IN-09: verify:offline 初回でのイントロモーダル遮蔽（Playwright クリック不能）

**何が起きたか**
T51 で `scripts/verify-offline.mjs`（オフライン起動検証）を初めて実行した際、
初回起動時に表示されるイントロモーダルが Playwright のクリック操作を遮蔽し、
タブ遷移のクリックが到達しないためテストが失敗した。

**根本原因**
イントロモーダルを「閉じてから次の操作をする」という前処理が verify スクリプトに
含まれていなかった。通常の `verify.mjs` はモーダルの存在を意識していたが、
offline 版は新規作成で同じ対処が抜けた。

**追加した恒久ガード**
- `verify-offline.mjs` にイントロモーダルを閉じる処理を追加（T51 内で即修正）。
- 「モーダル閉じ処理の定型化」: 以後、verify 系スクリプトを新規作成または拡張するときは
  イントロモーダル・閉じるボタンの前処理を最初に入れることを DEVELOPMENT.md に示唆として記録。
- `make store-shots`（T69）でも同様の前処理を設計時から組み込んだ（学びの再利用）。

**根拠**: PROGRESS.md T50〜T54 完了ログ（「初回実行でイントロモーダルのクリック遮蔽を検出→対処済み」）。
CHANGELOG.md「品質・CI — オフライン起動検証 `verify:offline`」節（同記述）。

---

### IN-10: classroom.html（ja）が A4 1枚ちょうど満杯で追記不能（T87 で発覚）

**何が起きたか**
T87 のワークシート追加に伴い、教員ガイド ja 版に「ワークシート導線」の短文を追記したところ、
`make classroom-pdf` が ja ガイドを 2 ページで出力した。
原因を調査した結果、ja 版は元々 A4 1 枚ちょうどの満杯設計であり、
いかなる本文追記も 2 枚化することが判明した（en 版は英文の短さから数行の余裕あり）。

**根本原因**
「1 枚に収まる」ことは T10 の受け入れ時に Playwright のページ数チェックで確認されていたが、
「1 枚ちょうど満杯で追記余地がない」という設計上の制約は文書化されていなかった。
ページ数の機械確認は「溢れた」ことを検出したが、事前に追記不可を警告する仕組みはなかった。

**追加した恒久ガード**
- `scripts/gen-classroom-pdf.mjs` のページ数アサート（T63 実装）が T87 で実際に溢れを検出した（仕組みが機能した実例として記録）。
- **ja ガイドへの本文追記は原則不可**。新しい導線・参照は langlink（言語リンク）として画面専用で追加する運用を確立（印刷時は CSS で非表示）。
- en 版はページ余裕があるため短文なら追記可（ja/en 軽微な非対称は意図的と CHANGELOG T87 エントリに記録）。

**根拠**: CHANGELOG.md「見張り駆動・教育キット完成スプリント（T85〜T89）— 教育・公開面」節。
PROGRESS.md T87 完了ログ（「親レビューで退行検出（問題管理）」）。

---

### IN-11: check-vendor の版数抽出が標準バナー形式で fail（T85 で検出・即修正）

**何が起きたか**
`scripts/check-vendor.sh` の Chart.js 版数抽出 regex が jsdelivr ラッパー形式
（`/*!` で始まる CDN 専用ヘッダー）にのみ対応しており、
セルフホスト版（T57）で採用された標準バナー形式（`/*! Chart.js ...`）では
版数を抽出できずにスクリプトが fail していた。
T85 で Chart.js を 4.5.1 に更新した際に副検出として発覚した。

**根本原因**
T57 で CDN 参照を廃止してセルフホスト化した際、`check-vendor.sh` の regex を
新しいファイル形式に合わせて更新しなかった。
CDN ファイルと npm dist ファイルではバナーのフォーマットが微妙に異なる。

**追加した恒久ガード**
- `check-vendor.sh` の regex を両形式対応に修正（T85 内で即修正）。
- **「抽出不能は黙って通さず fail する」設計自体が検出装置として機能した**。
  regex が fail を返すことで「版数が読めない状態を黙認しない」という設計の有効性が確認された
  （IN-01 の教訓「見た目確認だけでは見抜けない」の派生実例）。
- 今後 Chart.js を更新する際は、`make vendor-check` が green になることを受け入れ条件に含める
  （DEVELOPMENT.md「週次ベンダー点検」節に記録済み）。

**根拠**: CHANGELOG.md「見張り駆動・教育キット完成スプリント（T85〜T89）— 見張り駆動」節。
PROGRESS.md T85 完了ログ（「副検出: check-vendor の regex が…」）。

---

### IN-12: aws-wire.sh が空配列展開で unbound variable（☐2 実行時に発覚・即修正）

**何が起きたか**
人間側 TODO ☐2（AWS 自動デプロイ配線）を `make aws-wire` で実行した際、
`scripts/aws-wire.sh:30` の `"${PROFILE_ARGS[@]}"` が
`PROFILE_ARGS[@]: unbound variable` で落ちた。
`AWS_PROFILE` 未設定時に `PROFILE_ARGS` が空配列のまま素で展開されたため。

**根本原因**
macOS 既定の bash 3.2 では `set -u` 下で空配列の `"${arr[@]}"` 展開が
unbound variable エラーになる（bash 4.4+ では空文字に展開され問題ない）。
**IN と同型の事故が `infra/scripts/deploy.sh` でも過去に起きて修正済みだったが、
その教訓が `aws-wire.sh` に横展開されていなかった**（同じ罠を別ファイルで再度踏んだ）。

**追加した恒久ガード**
- `aws-wire.sh:30` を `${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}` ガード付き展開に修正
  （deploy.sh と同じ定石。空配列でも安全に展開される）。
- **横展開スキャンを実施**: `set -u` を持つ全 `.sh` を対象に
  ガード無し `"${arr[@]}"` を grep で総点検 → 他に実バグは無し
  （`handoff-hook.sh:24` は `if [ "${#msgs[@]}" -gt 0 ]` の内側で安全・deploy.sh はコメント）。
- 今後 bash 配列を `set -u` 下で展開する箇所は必ず `${arr[@]+"${arr[@]}"}` を使う
  （macOS bash 3.2 が現役である限り恒久ルール）。

**根拠**: 本セッションの ☐2 実行ログ（`make aws-wire` → 修正 → Secrets/Variables 設定成功）。
CLAUDE.md ライブ環境ログの deploy.sh 同型バグ記述。

---

### IN-13: export-dictionary の陳腐化検出が補助関数名を誤検出（レビュー検出・即修正）

**何が起きたか**
`tests/export-dictionary.test.mjs` の逆方向 warn（辞書にあるがエクスポートに無いコード表記＝
陳腐化の疑い）が、`p2SkillFactor` を「陳腐化候補」として毎回 warn していた。
実際には `p2SkillFactor` は `web/js/ui.js` に**実在する現行の補助関数**で、
DATA-DICTIONARY の `skillStock`/`brand` 行の**数式説明**に正しく登場しているだけ。
export フィールドではないため「エクスポートに無い」と判定されていた（誤検出）。

**根本原因**
陳腐化検出のトークン抽出が「識別子らしい・export別名に無い」だけを条件にしており、
**「辞書が参照するシンボルが現行コードに存在するか」を見ていなかった**。
陳腐化の本質は「参照先がもう存在しない」ことなので、実在シンボルは除外すべきだった。
IN-11（check-vendor の版数抽出 regex）と同型＝正規表現/抽出条件の網が粗い問題。

**追加した恒久ガード**
- 陳腐化判定から `function <名前>(` で定義済みの関数名を除外
  （`uiSrc+engineSrc` から関数名集合を抽出）。`p2SkillFactor` 以外の将来の補助関数も自動救済。
- **原理を明文化**: 陳腐化＝「辞書が参照するコードシンボルが現行コードに存在しない」もののみ。
  実在シンボル（現行の関数）は数式説明に登場しても陳腐化ではない。
- 真に削除されたフィールド参照は引き続き検出される（除外は定義済み関数名に限定）。

**根拠**: 本セッションのタスク1（帳簿バッチ）受け入れ時の `npm run check` 助言1件を調査して修正。

---

### IN-14: classic branch protection が weekly-rotate の直 push を GH006 で拒否（T94 で検出）

**何が起きたか**
2026-07-12 に classic branch protection（必須チェック web/infra・linear history）を有効化した翌朝（月曜定期実行）、
`weekly-rotate.yml` の `GITHUB_TOKEN` による `main` への直接 `git push` が
`GH006 Protected branch update failed` で拒否された。
週次ローテ・lighthouse・dependabot-auto-rebase の3ワークフローが連鎖失敗した。

**根本原因**
ブランチ保護（classic）は bot（GITHUB_TOKEN）も人間と同じルール（PR 必須）で扱う。
「保護を入れたら weekly-rotate の直 push 前提が壊れる」という副作用を着手前に評価していなかった。
「正しい変更（退行防止）が既存の bot 運用の前提を静かに壊す」という構造的衝突（ITIL: 変更の副作用）。

**追加した恒久ガード**
- **ruleset + デプロイキー方式**への移行（T94 直営）: classic protection を撤去し、
  ruleset（id 18896897、名称 "main protection (CI gate, deploy-key bypass)"）に移行。
  バイパス対象を DeployKey のみに限定し、`weekly-rotate.yml` は書き込み専用デプロイキー
  （Actions secret `WEEKLY_ROTATE_DEPLOY_KEY`）で checkout して `git push` する方式に変更。
- `docs/operations-runbook.md` に新章「ブランチ保護と bot 運用」を追加（本 T95 で実施）。
- `scripts/setup-branch-protection.sh`（`make protect`）を再実行禁止の表示に変更（本 T95 で実施）。

**根拠**: CHANGELOG.md「インシデント対応・発信準備スプリント（T94〜T96）」エントリ。
コミット a7ec3ce（デプロイキー最終解）・8ae56a9（T94 3ワークフロー修正）。

---

### IN-15: lighthouse.yml に checkout なしで git コマンド失敗（初回スケジュール実行で露呈）

**何が起きたか**
`lighthouse.yml` の workflow に `actions/checkout` ステップがなく、
LHCI が `git rev-parse HEAD` を実行した際に「not a git repository」で upload が失敗した。
T54 で実装した際には手動 dispatch での検証しか行っておらず、
スケジュール実行（月曜定期）まで問題が表面化しなかった。

**根本原因**
新規ワークフロー実装時に「checkout が必要かどうか」を確認しなかった。
手動 dispatch では初期 workspace の状態で偶然通過するケースがあり、
スケジュール実行まで潜伏した（IN-05 と同型: スケジュール実行まで潜在するバグ）。

**追加した恒久ガード**
- `lighthouse.yml` に `actions/checkout@v7` を追加（T94 内で即修正・コミット 8ae56a9）。
- 今後 workflow を新規作成するときは「git コマンドを使うか」を確認し、使う場合は checkout を最初に入れることを運用知識として記録。

**根拠**: CHANGELOG.md「インシデント対応・発信準備スプリント（T94〜T96）」エントリ。
コミット 8ae56a9（lighthouse checkout 追加）。

---

### IN-16: dependabot-auto-rebase.yml が checkout なしで gh コマンド失敗

**何が起きたか**
T93（直営）で追加した `dependabot-auto-rebase.yml` が、`gh pr comment` を実行した際に
「not a git repository」で失敗した。`gh` コマンドは git リポジトリコンテキストを要求するが、
checkout ステップを省いていた。

**根本原因**
IN-15 と同型（checkout 漏れ）だが、別の workaround で解決した。
`gh` コマンドはリポジトリコンテキストを環境変数 `GH_REPO` でも受け取れるため、
`env: GH_REPO: ${{ github.repository }}` を追加することで checkout 不要のまま動作するようにした。

**追加した恒久ガード**
- `dependabot-auto-rebase.yml` に `env: GH_REPO: ${{ github.repository }}` を追加（T94 内で即修正）。
- `gh` コマンドを使う workflow では checkout か `GH_REPO` 環境変数のどちらかを必ず設定することを慣行化。

**根拠**: CHANGELOG.md「インシデント対応・発信準備スプリント（T94〜T96）」エントリ。
コミット 8ae56a9（dependabot-auto-rebase repo context 追加）。

---

### IN-17: bot による PR 自動マージは GITHUB_TOKEN では実現不能と実証（T94）

**何が起きたか**
IN-14 の修正として「PR + auto-merge 方式」を試みたが2重の壁に当たった。
(1) リポジトリ設定「GitHub Actions is not permitted to create or approve pull requests」で
PR 作成自体が拒否された。API で設定を許可して前進したが——
(2) `GITHUB_TOKEN` が作成した PR は `pull_request` イベントの CI を発火させない
（GitHub の再帰防止ポリシー）。CI を `workflow_dispatch` で明示ディスパッチしても、
後から到着する「承認待ち（action_required）の pull_request 実行」が優先されて
PR は BLOCKED のまま。非フォーク PR への承認 API 呼び出しは HTTP 403（fork 専用）。

**根本原因**
GitHub は再帰防止のため GITHUB_TOKEN 起因の PR に CI を発火させない仕様であり、
これは回避不能。また PR レビュー承認 API は fork PR 専用のため、同リポジトリ内 PR には使えない。
「PR 経由の全自動マージ」は、このリポジトリ構成（パブリック・GITHUB_TOKEN 運用）では構造的に不可能。

**追加した恒久ガード**
- **再挑戦禁止の明文化**: `docs/operations-runbook.md` 新章（本 T95 で追記）に
  「bot の PR 自動マージはこのリポジトリ構成では不可能と実証済み」と明記し、
  将来のセッションが同じ道を試みることを防ぐ。
- **最終解（ruleset + デプロイキー直接 push）**: IN-14 の恒久ガード参照。
  デプロイキーの push は他ワークフローを発火させないため、
  Pages/AWS デプロイは従来どおり `workflow_dispatch` で明示起動する運用を維持。

**根拠**: CHANGELOG.md「インシデント対応・発信準備スプリント（T94〜T96）」エントリ。
コミット 8b7fc06（CI 明示ディスパッチ試行・後に棄却）・a7ec3ce（デプロイキー最終解）。
run 29290558734（週次ローテ green 確認・latest.json 2026-W29 に回転・コミット 58cb4c2）。

---

### IN-18: can_approve_pull_request_reviews をデフォルト以外に変更したままにする副作用

**何が起きたか**
IN-17 の調査中に「GitHub Actions is not permitted to create or approve pull requests」設定を
API で許可（`can_approve_pull_request_reviews: true`）したが、これは必要最小限を超えた権限昇格だった。
最終解（デプロイキー方式）では不要な設定であるため、`false` に戻した。

**根本原因**
「動かすこと」を優先して設定変更を積み重ねる中で、不要になった設定変更を元に戻すのが漏れた。
後始末の確認が調査フローに組み込まれていなかった。

**追加した恒久ガード**
- `can_approve_pull_request_reviews` を `false` に戻した（T94 後始末として実施）。
- `default_workflow_permissions` は引き続き `read`（最小権限）のまま維持。
- **後始末チェックを runbook に明記**: 今後インシデント調査で設定を変更した場合は、
  解決後に「変更した設定を最小権限に戻したか」を確認する。

**根拠**: CHANGELOG.md「インシデント対応・発信準備スプリント（T94〜T96）」エントリ（設定後始末）。

---

スプリント完了時、以下のいずれかに該当する事象があれば本ファイルの末尾に追記する:

1. **想定外の挙動・バグ** — CI が検出した実バグ、手動レビューで発見した誤り。
2. **プロセス上の事故** — ファイル消失・競合コピー・エージェント停止など。
3. **ドキュメントの陳腐化** — コード実態と文書の乖離を発見した場合。

各エントリの3点セット（テンプレート）:

```
### IN-XX: タイトル（1行で何が起きたか）

**何が起きたか**
（1〜2行）

**根本原因**
（構造的な原因。「うっかり」で終わらせない）

**追加した恒久ガード**
（ファイル名 / 仕組み名と、それが何を防ぐかを1〜2行）

**根拠**: （PROGRESS.md / CHANGELOG.md の参照箇所）
```

エントリ番号は IN-01 からの通し番号（`IN-NN`）で管理する。
