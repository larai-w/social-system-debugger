# ストア掲載文ドラフト — App Store / Google Play

> Capacitor 実機ビルド（TODO ☐4）の次に必要になる素材。文字数制限に合わせて調整済み。
> **提出前チェック**: appId を自分の逆ドメインに変更済みか／プライバシーポリシーURLが生きているか／
> スクリーンショットが最新UIか。

## 共通事項

| 項目 | 値 |
|---|---|
| アプリ名 | 社会デバッガー ／ Social Debugger |
| カテゴリ | 教育（Education）。サブ: シミュレーション |
| 価格 | 無料・広告なし・課金なし |
| 年齢区分 | 4+ / Everyone（暴力・実在人物への言及なし。抽象的な社会構造の話のみ） |
| プライバシー | アカウントなし・個人データ収集なし。匿名の集計アナリティクスのみ（App Store「データ収集なし」または「利用データ（非特定）」区分） |

## App Store（iOS）

**サブタイトル（30字以内）**
```
あなたの街は、生き残れるか。
```
EN:
```
Will your town survive?
```

**プロモーションテキスト（170字以内・随時変更可）**
```
今週のシナリオ配信中。同じ災害でも、備えの設定しだいで街の結末は変わります。プリセット1タップで社会が壊れる構造を体験し、あなたの手で巻き戻してください。
```

**説明文（ja）**
```
社会や地域インフラが「どう壊れるか」を、スライダー操作で体験できる教育用シミュレーターです。

・プリセット1タップで、情報空間の濁り・インフラの崩壊・認知の暴走・当事者の声の遮断を再現
・パラメータを動かして介入し、崩壊する未来を巻き戻す
・週替わりシナリオ: 毎週月曜、新しい「今週の困難」に3分で挑戦
・発見ログ: 注目すべき状態を見つけるたびに、短い学びが図鑑に collect される
・結果カードを X・LINE・画像で共有。URLだけで同じ実験を誰でも再現可能
・研究・授業向け: 全パラメータとメトリクスを JSON/CSV でエクスポート

このアプリは架空のシミュレーションです。実在の地名・人名・進行中の政治的話題は登場しません。
「特定の誰かではなく、どの社会にも起こる構造の話」を、ゲームのように操作できる形にしました。

無料・広告なし・アカウント不要・個人データの収集なし。
```

**説明文（en）**
```
An educational simulator where you experience HOW societies and regional
infrastructure fail — by moving sliders.

- One-tap presets recreate clouded information spaces, infrastructure
  collapse, runaway outrage, and drowned-out stakeholder voices
- Intervene with parameters and rewind a collapsing future
- Weekly scenarios: a new 3-minute challenge every Monday
- Discovery log: collectable one-line lessons for notable states
- Share result cards to X/LINE or as images; a URL alone reproduces
  the exact experiment
- For research & classrooms: export all parameters and metrics as JSON/CSV

This app is a fictional simulation. No real places, people, or ongoing
politics appear. It is about structures any society can fall into —
made playable.

Free, no ads, no account, no personal data collected.
```

**キーワード（100字以内・カンマ区切り）**
```
社会,シミュレーション,教育,防災,インフラ,民主主義,メディアリテラシー,教材,探究,公共
```

## Google Play（Android）

**簡単な説明（80字以内）**
```
社会が壊れる構造をスライダーで体験する教育シミュレーター。週替わりシナリオ配信中。
```
EN:
```
An educational sim of how societies fail. Move sliders, rewind collapse. Weekly scenarios.
```

**詳細な説明**: App Store の説明文と同一（Play は 4000 字まで・改行可）。

## スクリーンショット自動生成（6枚）

`make store-shots` で6枚を自動生成できる（出力先: `dist/store-shots/01〜06.png`、実エンジン撮影、430×932 @3x ≈ iPhone 6.7"）。

```
make store-shots
# 内部: npm run gen:store-shots → scripts/gen-store-shots.mjs
# 前提: npm ci 済み（playwright を含む devDependencies）
```

生成される6枚の内容（スクリプトの撮影順）:

| ファイル | シーン | 撮影内容 |
|---|---|---|
| `01.png` | PAGE 1 崩壊 | ワイマール崩壊プリセット → 赤バナー＋スローガンログ |
| `02.png` | PAGE 2 生存 | 🛡冗長性確保都市 → ⚡ショック注入 → 緑バナー「あなたの街は、生き残った」 |
| `03.png` | PAGE 3 認知リカバリー | 認知ネットワーク可視化（エージェント散布図） |
| `04.png` | PAGE 4 非対称性 | ステークホルダー非対称性の初期状態 |
| `05.png` | 発見ログ | 前ステップで複数アンロック後に 📖 発見ログを開いた状態 |
| `06.png` | 共有ポップ | 結果カード共有ポップ（𝕏 / LINE / 画像を保存 の3ボタン） |

- 端末フレーム: iOS 6.7"（必須）/ 6.5" / iPad は後回し可。Android は 16:9 か 9:16。
- すべて**ダークテーマのまま**（ブランド）。文字が小さいシーンは避ける。
- Console エラーや生成物が 30 KB 未満の場合はスクリプトが非0で終了する（自己検証込み）。

## 審査で聞かれそうな点と回答（準備）

- **「政治的コンテンツでは？」** → 実在の国・政党・人物への言及は一切なし。抽象モデル（H型/T型等）のみで、
  アプリ内の全共有物に「特定の誰かではなく、どの社会にも起こる構造の話」の免責を常時表示。教育カテゴリの
  リテラシー教材である旨を Review Notes に明記する。
- **「最小機能では？」（4.2 Minimum Functionality）** → Web 版との差分（週替わりシナリオ・ローカル通知・
  触覚・共有シート・オフライン動作）を Review Notes に列挙。
- **通知の用途** → 週1回・月曜19時のローカル通知のみ。リモートプッシュなし。初回クリア後に文脈付きで
  許可を求める（起動即許可ダイアログではない）。
- **データ収集** → なし（アカウントなし・端末内 localStorage/Preferences のみ）。App Privacy は
  「Data Not Collected」を選択（Plausible 等を有効化した場合は「非特定の利用データ」に変更）。

## ユーザー（あなた）が用意するもの

- Apple Developer Program（年99ドル）／ Google Play デベロッパー登録（初回25ドル）
- ~~プライバシーポリシーの公開URL~~ → **作成済み**: `https://larai-w.github.io/social-system-debugger/privacy.html`（EN: `privacy.en.html`。push 後に有効）
- `capacitor.config.json` の appId 確定（現: `dev.socialdebugger.app` はプレースホルダ）
