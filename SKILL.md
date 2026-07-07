---
name: social-debugger-dev
description: 社会デバッガー（単一HTML・約33万文字のシミュレーターアプリ）の開発・修正・検証を安全に行うためのスキル。index.htmlへの機能追加、バグ修正、リファクタリング、UX改修を行うとき、または修正後の動作検証を行うときに必ず使う。退行バグの防止、Playwrightによる自動検証、integrity制約の遵守を含む。
---

# 社会デバッガー開発スキル

このスキルは、これまでの開発で確立された「うまくいったやり方」と「実際に起きた失敗」を記録したもの。
このプロジェクトのコードを触るとき、以下のワークフローを必ず守る。

## ワークフロー（この順番で）

### 1. 変更前：必ず現状把握から

- コードを変える前に、対象の関数・変数・i18nキー・関連するUI要素を grep で特定し、実装箇所（関数名・行の目安）を短くレポートしてから着手する。
- 憶測で書かない。「たぶんこういう構造だろう」で書いたコードが退行の温床になる。
- 変更は差分最小。既存の関数・変数名・構造を尊重する。ゼロからの書き直しは禁止。

### 2. 変更中：1タスクずつ、コミットを挟む

- 複数の変更を一度にしない。1タスク完了→動作確認→git commit→次へ。
- 新規のユーザー向け文字列は必ず ja / en 両方の i18n 辞書に追加する。ハードコードした裸の文字列を画面に出さない。
- モーダル内の formula（数式）表示を変更した場合、古い式を残さない（式を見せるのはこのアプリの誠実さの一部）。

### 3. 変更後：Console ゼロ確認（必須・省略禁止）

見た目の確認だけでは退行を見抜けない。以下を毎回実行し、結果を報告に含める:

1. ブラウザでページを開き、**Console にエラーが1件もない**こと。
2. 全4タブの遷移、プリセット1つ、スライダー操作を実際に行い、エラーゼロであること。
3. Chart.js が読み込めない状況でも他機能が動くこと（下記スクリプト参照）。

Playwright が使える環境では `scripts/verify.py` を実行する（なければ本スキル末尾のコードで作成する）。

## 実際に起きた失敗パターン（同じ轍を踏まない）

### パターン1: ガード追加によるスコープ事故
堅牢化のため既存コードを `if(chart){ try{...} }` で包んだとき、ブロック内で定義されていた
`const avg` がブロックスコープに閉じ込められ、ブロック外の後続コードが `avg is not defined` で
クラッシュした。**教訓: コードをブロックで包むときは、その中で定義される変数がブロック外で
参照されていないか必ず grep で確認する。**

### パターン2: 存在しない関数の呼び出し
新機能（週次シナリオ判定）が `saveDiscoveries()` / `unlock()` という存在しない関数を呼んでいた。
実在するのは `discover()`（保存・トースト込み）。**教訓: 新しいコードから関数を呼ぶ前に、
その関数が実際に定義されているか grep で確認する。似た名前の既存関数があればそれを使う。**

### パターン3: onerror属性の時序バグ
`<script onerror="handleChartLoadFailure()">` は、その関数が定義されるより前に発火し得る。
**教訓: HTML属性のインラインハンドラからは、後方で定義される関数を直接呼ばない。
属性側ではフラグを立てるだけにし（`window.__flag=true`）、スクリプト側で検知して処理する。**

### パターン4: 初期化の連鎖死
スクリプトは上から実行されるため、初期化途中の1つのエラーが、それ以降のすべての初期化
（チャート生成・イベント登録・i18n適用）を道連れにする。症状は「一部の機能が消えた」に
見えるが、実際は「生まれる前に親が倒れている」。**教訓: 「要素が消えた」報告を受けたら、
まずConsoleのエラーとスタックトレースを確認し、エラー行が初期化フローのどこで止めているかを
特定する。消えた要素そのものを調べるのは二番目。**

## integrity 制約（コードより優先）

- ダーク・ターミナル調の見た目を変えない。やわらかくするのは言葉、色ではない。
- 実在の地名・人名・進行中の政局は、批判でも称賛でもUIに出さない。抽象型（H型/T型）で語る。
- 「特定の誰かではなく、どの社会にも起こる構造の話」の姿勢を、文言・診断ログ・共有カードすべてで維持。
- 週次シナリオ等のネイティブ専用機能は `WEEKLY_ENABLED`（Capacitor判定）で出し分け、コードは削除しない。

## 完了時の報告テンプレート

1. 変更箇所（関数名・行の目安）と変更概要
2. i18n に追加/変更したキー一覧（ja/en 揃い確認）
3. Console ゼロ確認の実施結果（ケース1: 通常、ケース2: Chart.js失敗時）
4. 手動テスト手順（ユーザーが自分で確認すべきこと）
5. CLAUDE.md の進捗ログ・次のタスクを更新したか

## scripts/verify.py（検証スクリプト雛形）

```python
# 使い方: python3 scripts/verify.py path/to/index.html
# Chart.js正常時と失敗時の両方でエラーゼロを確認する
import sys
from playwright.sync_api import sync_playwright

STUB = """
window.Chart = class Chart {
  static defaults = { color:'', borderColor:'', font:{ family:'', size:10 } };
  constructor(ctx, config){ this.config=config; this.data=config.data; this.options=config.options; }
  update(){} destroy(){}
};
"""

def run(path, with_stub):
    errs = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width':1400,'height':1000})
        page.on('pageerror', lambda exc: errs.append(exc.message))
        if with_stub:
            page.add_init_script(STUB)
        page.goto(f'file://{path}')
        page.wait_for_timeout(1500)
        page.evaluate('typeof closeIntro==="function" && closeIntro()')
        page.keyboard.press('Escape'); page.wait_for_timeout(300)
        for t in [2,3,4,1]:
            page.evaluate(f'switchTab({t})'); page.wait_for_timeout(600)
        page.evaluate('typeof setPreset==="function" && setPreset(Object.keys(PRESETS)[0])')
        page.wait_for_timeout(500)
        browser.close()
    return errs

if __name__ == '__main__':
    import os
    path = os.path.abspath(sys.argv[1])
    e1 = run(path, with_stub=True)   # Chart.js 正常相当
    e2 = run(path, with_stub=False)  # Chart.js 失敗時（CDNなし環境）
    print('Chart正常時 errors:', e1 or 'なし ✓')
    print('Chart失敗時 errors:', e2 or 'なし ✓')
    sys.exit(1 if (e1 or e2) else 0)
```
