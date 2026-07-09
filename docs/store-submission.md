# ストア提出ランブック — 実機ビルド〜審査提出（App Store / Google Play）

> **これは1本のランブックです。上から順に実行すれば、実機ビルドからストア審査提出まで到達できます。**
> ネイティブ配信の準備物（掲載文・アイコン/スプラッシュ・プライバシーポリシー・Capacitor 設定）は既に揃っています。
> このドキュメントは、それらを「実行する順序」に並べ直したものです。TODO ☐4 を実際にやる時に、ここだけ見れば迷わないことが目的。
>
> **他ドキュメントとの分担（このファイルは再掲しません）:**
> - 掲載文・スクリーンショット計画・審査想定問答 → `docs/store-listing.md`
> - ビルドの技術的背景（プラグイン構成・ガード方針）→ `README.md`「ネイティブアプリ」節
> - 実機ビルドの所要時間の目安 → `TODO.md` ☐4
>
> **重要な注意:** Apple / Google 側の Web 画面（App Store Connect・Play Console・Xcode の一部ダイアログ）は
> このリポジトリでは検証できません。該当箇所には **「2026-07 時点の一般的な手順」** と明示しています。
> 画面の文言・項目名は各社の更新で変わり得るため、実行時は必ず公式ドキュメントで最新を確認してください。

---

## 0. 前提（アカウント・費用・所要時間）

| 項目 | iOS | Android |
|---|---|---|
| 開発者登録 | Apple Developer Program（**年額の会費あり／目安 約99USD・要公式確認**） | Google Play デベロッパー（**初回のみの登録料／目安 約25USD・要公式確認**） |
| 必要な母艦 | **macOS + Xcode 必須**（本リポは macOS 前提） | macOS / Windows / Linux いずれも可 |
| 主なツール | Xcode（＋Command Line Tools）／CocoaPods | Android Studio ／ JDK 17 |
| 審査期間 | **目安 数時間〜数日・要公式確認**（初回は長め） | **目安 数時間〜数日・要公式確認**（初回は長め） |

> 費用・年会費・審査期間の数値はいずれも **目安**です。金額は為替・地域・各社ポリシーで変わるため、
> 提出前に Apple / Google の公式ページで最新を確認してください（本ドキュメントでは断定しません）。

**このランブックで前提とする状態（先に済ませておくこと）:**
- リポジトリはローカルにクローン済み・`npm install` 実行済み。
- Web 版が正常動作している（`make serve` でローカル確認できる）。
- プライバシーポリシーが公開済み（下記 4 章参照。push 済みで URL が生きていること）。

---

## 1. 【最初の意思決定】appId を確定する

**これが最初にやるべき唯一の意思決定です。** 現在の `capacitor.config.json` の `appId` は
プレースホルダ `dev.socialdebugger.app` です。**実機ビルド前に、自分が管理する逆ドメイン形式のIDへ確定してください。**
一度ストアに登録すると **後から変更できない**ため、ここで慎重に決めます。

- 形式: 逆ドメイン（例: `com.yourname.socialdebugger`）。所有／管理しているドメインを反映するのが慣例。
- App Store の Bundle ID・Google Play の applicationId と **完全一致**させる（3プラットフォームで同一文字列）。
- 変更箇所は `capacitor.config.json` の `"appId"` の1箇所のみ。

```bash
# 例: エディタで capacitor.config.json を開き "appId" を確定値に変更
#   "appId": "dev.socialdebugger.app"  →  "appId": "com.yourname.socialdebugger"
```

> `appName`（`社会デバッガー`）や `webDir`（`web`）は変更不要。ダーク統一の SplashScreen/StatusBar 設定もそのまま。

---

## 2. 共通準備（アイコン生成 → cap add → cap sync）

iOS / Android どちらにも共通の前段です。

### 2-1. アイコン/スプラッシュを生成

生成物（`resources/icon.png`（1024）・`resources/splash.png`・`resources/splash-dark.png`（2732））は
すでにコミット済みですが、`web/icon.svg` を変えた場合や再生成したい場合は:

```bash
npm run gen:icons          # = make gen-icons。resources/ に icon.png / splash.png / splash-dark.png を生成
```

これらは `@capacitor/assets` の入力規約に準拠しています（詳細は `scripts/gen-icons.mjs` 冒頭コメント）。
`cap add` の後に次のコマンドで各プラットフォーム用の全サイズへ展開します:

```bash
npx @capacitor/assets generate      # resources/ を読んで ios/ android/ にアイコン・スプラッシュを配置
```

### 2-2. ネイティブプロジェクトを生成（初回のみ）

`ios/` `android/` は `.gitignore` 済みで、`cap add` でいつでも再生成できます。

```bash
npm install                 # 未実行なら（依存取得）

# iOS（CocoaPods が必要。未導入なら: sudo gem install cocoapods）
npx cap add ios

# Android（Android Studio + JDK 17 導入後）
npx cap add android
```

### 2-3. web/ の変更を同期

`web/` を触るたび（＝毎ビルド前）に必ず実行:

```bash
npx cap sync                # = npm run cap:sync。web/ の最新を ios/ android/ に反映
```

---

## 3. iOS 手順（Xcode 署名 → TestFlight → 審査提出）

> **この章の App Store Connect / Xcode のダイアログ操作は「2026-07 時点の一般的な手順」です。**
> 画面名・ボタン名は Xcode / App Store Connect の更新で変わり得ます。

### 3-1. Xcode で開く

```bash
npx cap open ios            # = npm run cap:open:ios。Xcode でワークスペースが開く
```

### 3-2. 署名（Signing & Capabilities）

Xcode 左のプロジェクト → ターゲット選択 → **Signing & Capabilities** タブ:
1. **Team** に自分の Apple Developer Team を選択（Automatically manage signing を推奨）。
2. **Bundle Identifier** が 1 章で確定した appId と一致していることを確認。
3. まず **実機 or シミュレータで Run**（▶）して起動を確認（クラッシュ・白画面がないこと）。

### 3-3. App Store Connect でアプリ枠を作成（一般的な手順）

App Store Connect（Web）→ **My Apps → ＋ → New App**:
- Platform: iOS ／ Name: `社会デバッガー` ／ Bundle ID: 確定済みの appId ／ SKU: 任意の一意文字列。
- 掲載メタデータ（サブタイトル・説明文・キーワード・スクショ）は **`docs/store-listing.md` の内容を転記**（本書では再掲しない）。

### 3-4. アーカイブして TestFlight へアップロード（一般的な手順）

Xcode:
1. 実行先を **Any iOS Device（arm64）** に変更。
2. メニュー **Product → Archive**。
3. Organizer が開いたら **Distribute App → App Store Connect → Upload**。
4. アップロード完了後、App Store Connect の **TestFlight** タブに処理済みビルドが現れる（数分〜数十分かかることがある）。
5. 自分の端末で TestFlight アプリからインストールし、ネイティブ機能（週次カード・ローカル通知・触覚・共有シート・オフライン）を実機確認。

### 3-5. 審査提出（一般的な手順）

App Store Connect の対象バージョン画面:
1. **Build** に TestFlight のビルドを紐付け。
2. スクリーンショット・説明文・**プライバシーポリシーURL**（下記 5 章）・年齢区分・カテゴリ（教育）を入力。
3. **App Privacy**（データ収集）を回答（下記 5 章）。
4. **輸出コンプライアンス**の設問に回答（下記 5 章）。
5. **Review Notes** に審査対策の要点を記入（下記 5 章・`store-listing.md` の想定問答から）。
6. **Add for Review → Submit for Review**。

---

## 4. Android 手順（署名鍵 → 内部テスト → 審査提出）

> **この章の Play Console 操作は「2026-07 時点の一般的な手順」です。** 画面名は Play Console の更新で変わり得ます。

### 4-1. Android Studio で開く

```bash
npx cap open android        # = npm run cap:open:android。初回は Gradle 同期が走る
```

### 4-2. リリース用の署名鍵を作成（一般的な手順）

**Play App Signing（Google が署名鍵を管理）を利用する前提**でも、アップロード鍵は自分で作成します。
Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle** を選ぶと、
新規キーストア（`.jks`）作成のダイアログが出ます。

> ⚠️ 作成したキーストアとパスワードは **絶対に紛失しない・リポジトリにコミットしない**（`.gitignore` の外に安全保管）。
> 失うとアプリの更新ができなくなります。

### 4-3. リリースビルド（AAB）を作成

上記フローで **release** バリアントの **`.aab`（Android App Bundle）** を生成します
（Play は APK ではなく AAB を要求するのが現行の一般的な仕様・要公式確認）。

### 4-4. Play Console でアプリ作成 → 内部テスト（一般的な手順）

Play Console（Web）:
1. **アプリを作成**（名称 `社会デバッガー`・言語・無料）。
2. **テスト → 内部テスト**トラックに `.aab` をアップロードし、テスターに自分のアカウントを追加。
3. 配布リンクから端末にインストールし、ネイティブ機能（週次カード・ローカル通知〈Android 13+ は `POST_NOTIFICATIONS` の実行時許可〉・触覚・共有シート・オフライン）を実機確認。

### 4-5. ストア掲載情報 → 審査提出（一般的な手順）

Play Console:
1. **ストアの掲載情報**: 簡単な説明・詳細な説明・スクショ・アイコンを `docs/store-listing.md` から転記。
2. **アプリのコンテンツ**: プライバシーポリシーURL（5 章）・データセーフティ（5 章）・コンテンツのレーティング（アンケート）・対象年齢を回答。
3. **製品版**（または内部テストからの昇格）トラックにビルドを配置し、**審査に送信**。

---

## 5. 審査対策（想定問答・privacy URL・定番設問）

### 5-1. プライバシーポリシーURL（提出必須）

両ストアの提出フォームに入力する公開URL（push 済みで有効）:
- 日本語: `https://larai-w.github.io/social-system-debugger/privacy.html`
- 英語: `https://larai-w.github.io/social-system-debugger/privacy.en.html`

実体は `web/privacy.html` / `web/privacy.en.html`（自己完結・アプリのJSに非依存）。
提出前に **URLがブラウザで開けること**を必ず確認。

### 5-2. 審査で聞かれそうな点

想定問答（政治的コンテンツでは？／最小機能では？〈iOS 4.2〉／通知の用途／データ収集）は
**`docs/store-listing.md`「審査で聞かれそうな点と回答」節に集約済み**です。ここでは再掲しません。
Review Notes（iOS）／レビュー用メモ（Android）には、その節の要点を転記してください。特に:
- 実在の国・政党・人物への言及ゼロ／全共有物に免責常時表示（＝教育カテゴリのリテラシー教材）。
- Web版との差分（週替わりシナリオ・ローカル通知・触覚・共有シート・オフライン）を列挙（iOS 4.2 対策）。

### 5-3. App Privacy / データセーフティ

- 現状はアカウントなし・端末内 localStorage/Preferences のみ＝**「データ収集なし（Data Not Collected）」**を選択。
- アナリティクス（Plausible 等）を有効化した場合のみ「**非特定の利用データ**」区分に変更する（TODO ☐9 と連動）。

### 5-4. 輸出コンプライアンス（iOS の定番設問）

App Store Connect のビルド提出時に暗号化に関する設問が出ます（一般的な手順）:
- 本アプリは標準的な HTTPS 通信のみで**独自の暗号化を実装していない**ため、
  一般に「該当する免除に当てはまる」旨を選択する運用が多いです。**ただし最終判断は自己責任・要公式確認**。
  不明な場合は Apple の輸出コンプライアンス ドキュメントを確認してください（本書では断定しません）。

### 5-5. 年齢区分・カテゴリ

- カテゴリ: **教育（Education）** ／ サブ: シミュレーション。
- 年齢区分: **4+ / Everyone**（暴力・実在人物への言及なし）。
- コンテンツレーティングのアンケート（Android）では、暴力・性的表現・ギャンブル等すべて「なし」で回答できる想定。

---

## 6. 提出後（審査落ち時の定番対応）

審査は初回に落ちることがあります。落ちても慌てず、以下の順で対応します（一般的な対応・各社の指摘文が最優先）:

1. **リジェクトの根拠条項を読む。** iOS は App Store Review Guidelines の条番号、Android は該当ポリシー名が示されます。まずその条文を確認。
2. **多い指摘の定番:**
   - **iOS 4.2（Minimum Functionality／Webの薄いラッパー）** → Review Notes に Web版との差分（週次シナリオ・通知・触覚・共有シート・オフライン）を具体的に再説明。`store-listing.md` の該当節を強化。
   - **政治的コンテンツ懸念** → 実名ゼロ・抽象モデル・常時免責の設計を Review Notes で明示。必要なら該当画面のスクショを添付。
   - **プライバシー表記の不一致** → App Privacy／データセーフティの回答と privacy.html の記述を一致させる。
3. **Resolution Center（iOS）／ポリシー通知（Android）で返信・再提出。** 指摘に対する具体的な修正点を書いて再送。
4. **コード修正が必要な場合**は `web/` を直し、`npx cap sync` → 再アーカイブ／再ビルド → バージョン（ビルド番号）を上げて再アップロード。
   - バージョニングは `docs`（MEMORY のバージョン規約）に従う。ビルド番号は提出のたびに増やす。

> 迷ったら「実名ゼロ・構造で語る・教育カテゴリ」という本プロジェクトの軸（CLAUDE.md の倫理方針）に照らして説明すれば、
> 大半のグレーな指摘は説明で解消できます。
