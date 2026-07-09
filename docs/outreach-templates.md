# 打診文面テンプレ集 — 教員・教育コミュニティ・研究者向け

> `OUTREACH.md`（アプローチの戦略・相手プロファイル・運用ログ）を実行に移すための、
> **そのまま送れる文面**のストック。戦略の背景は `OUTREACH.md` を、体裁の参考は
> `x-post-templates.md` を見ること。
> このファイルの文面は「教育チャネル」（教員・教育系コミュニティ・教材として使う研究者）に特化する。

## 全テンプレ共通の固定ルール（送信ボタンの前に毎回確認）

1. **実在の国・自治体・政党・人物・進行中の政局に触れない。** アプリは「特定の誰かではなく、
   どの社会にも起こる構造の話」。打診文でも同じ姿勢を貫く（相手が政治色で受け取らないように）。
2. **免責を必ず1行入れる**: 「特定の誰か・どこかの話ではなく、どの社会にも起こる構造の教材です」。
3. **一斉送信しない。** テンプレはあくまで骨格。相手の授業・記事・研究に触れる1行を必ず足し、
   1通ずつ書き換える。コピペ感が出た時点で負け（`OUTREACH.md` §2 と同じ鉄則）。
4. **URL は Pages 固定の1本だけ**: `https://larai-w.github.io/social-system-debugger/`
5. **押し売りしない・返事を強要しない。** お願いは1つだけ、結びは「もしご興味が向いたときにでも」。
   良ければ相手が勝手に使う／広めてくれる、という前提で書く。
6. **相手のメリットから書く**（準備物なし・A4ガイド・投影スライド・無料・登録なし・約10分）。

### 紹介する成果物（相手に応じて出し分ける・全部貼らない）

| 成果物 | URL | 誰に効くか |
|---|---|---|
| アプリ本体 | `https://larai-w.github.io/social-system-debugger/` | 全員（まず触ってもらう入口） |
| 教員向け1枚ガイド（A4） | `https://larai-w.github.io/social-system-debugger/classroom.html` | 授業に組み込みたい教員（配布・板書用の問い付き） |
| 授業用 投影スライド（9枚） | `https://larai-w.github.io/social-system-debugger/classroom-slides.html` | 教室でそのまま提示したい教員（プロジェクター投影） |
| プライバシーポリシー | `https://larai-w.github.io/social-system-debugger/privacy.html` | 学校・組織で使う前に安全性を確認したい相手 |

> 英語版は各 URL の `.html` を `.en.html` に置き換える（例 `classroom.en.html`）。

---

## テンプレ (1) 面識のある教員への個人メッセージ

面識がある相手には、いきなり長文を送らない。1つの成果物に絞り、負担ゼロで試せることだけ伝える。

```
お久しぶりです。社会や地域インフラが「どう壊れるか」をスライダーで体験できる
無料の教材アプリを個人で作っていて、公共・情報I・探究あたりで使えそうなので
[相手の授業/専門]を思い出してご連絡しました。

準備物なし・ブラウザのみ・登録なしで、1テーマ約10分です。
授業でそのまま投影できるスライドと、配布用のA4ガイドも付けています:
https://larai-w.github.io/social-system-debugger/classroom.html

特定の誰か・どこかの話ではなく、どの社会にも起こる「構造」の教材です。
もし手が空いたときに触ってみて、「授業で使うなら何が足りないか」を
一言もらえたら嬉しいです。返信はいつでも / なくても大丈夫です。
```

---

## テンプレ (2) 面識のない教員・教育系コミュニティへの打診

先に相手の投稿・実践に実のあるリプや引用を1〜2回してから送る（`OUTREACH.md` §2-1）。
本文は短く、リンクは「アプリ＋投影スライド」に絞る。

```
[相手の授業実践/投稿]を拝見しご連絡しました。[具体的な感想を1行]。

社会がどう壊れるかをスライダー操作で体験できる無料の教材を個人で作っています。
準備物なし・ブラウザのみ・1テーマ約10分で、教室でそのまま投影できるスライド版もあります:
https://larai-w.github.io/social-system-debugger/classroom-slides.html
（授業の流れ・問いの例をまとめたA4ガイドは classroom.html にあります）

特定の地域や人物ではなく、どの社会にも起こる「構造」を扱う教材として設計しています。
教える側の視点で「これがあれば使える／ここが足りない」を一言いただけたら幸いです。
お忙しいところ恐れ入ります。ご興味が向いたときにでも。
```

---

## テンプレ (3) 研究者への紹介（DATA-DICTIONARY / METHODOLOGY 導線つき）

研究者にはメリットではなく「検証できる素材」を出す。お願いは「モデルの粗を1つ」だけ。

```
はじめまして。[相手の論文/発表/記事名]を拝見し、[具体的に何が参考になったか1行]。

社会や地域インフラが「どう壊れるか」を体験できる教育用シミュレーターを
個人で開発しています（非営利・ブラウザで開くだけ・約60秒で試せます）:
https://larai-w.github.io/social-system-debugger/

全パラメータ・メトリクスと実装式の対応表（DATA-DICTIONARY）、
全計算式・しきい値・前提と限界（METHODOLOGY）を公開しているので、
モデルの妥当性をそのまま検証していただけます:
・docs/DATA-DICTIONARY.md（エクスポート項目 ⇔ 実装式）
・docs/METHODOLOGY.md（数式・しきい値・前提と限界の免責つき）

[相手の専門]のご視点で、モデルの粗をひとつだけご指摘いただけないでしょうか。
特に[相手に関係する具体的な部分]の妥当性についてご意見を伺えたら幸いです。
10分ほどで触れる規模です。ご興味が向いたときにでも。
```

> DATA-DICTIONARY / METHODOLOGY はリポジトリ（`docs/`）内。相手が GitHub を見ない場合は
> アプリ内の (?) モーダルに同じ式が載っていることを一言添える。

---

## 英語版文面（Show HN / PH 前の個別連絡や海外の教員・研究者にも流用可）

### EN (1) A teacher you already know

```
Hi — I've been building a free educational simulator that lets people *experience*
how societies and regional infrastructure fail by moving sliders. It seemed a fit for
your class, so I thought of you.

No prep, browser only, no signup — about 10 minutes per theme. There's a projector
slide deck to present as-is, plus a printable one-page guide with discussion prompts:
https://larai-w.github.io/social-system-debugger/classroom.en.html

It's not about any specific place or person — it's a teaching tool about structures
any society can fall into. If you get a spare moment, I'd love one line on what's
missing to use it in class. No need to reply — whenever it suits you.
```

### EN (2) A teacher or education community you haven't met

```
I came across your [class activity / post] and [one specific line]. I'm building a
free educational simulator where students *experience* how societies fail by moving
sliders — no prep, browser only, ~10 minutes per theme, with a slide deck you can
project as-is:
https://larai-w.github.io/social-system-debugger/classroom-slides.en.html
(A one-page guide with the lesson flow and prompts is at classroom.en.html.)

It's designed around structures any society can fall into, not any specific place or
person. I'd value one line from a teacher's view on what would make it usable in class.
Whenever it suits you — no pressure to reply.
```

### EN (3) A researcher

```
Hi — I came across your work on [specific paper/project] and found [one specific line].
I'm building a free, non-commercial educational simulator that lets people experience
*how* societies and regional infrastructure fail (browser-only, ~60s to try):
https://larai-w.github.io/social-system-debugger/

Every export field maps to its implementation formula (DATA-DICTIONARY.en.md) and
every formula, threshold, assumption and limitation is documented (METHODOLOGY.en.md),
so the model is fully inspectable. Would you point out one flaw in the model from your
perspective? I'd especially value your view on [specific mechanism].
It's about 10 minutes to try. Whenever it suits you.
```

---

## 送る前チェックリスト（10秒）

- [ ] 実在の地名・人名・政局を想起させる語が混ざっていないか
- [ ] 免責1行（「特定の誰か・どこかの話ではなく、どの社会にも起こる構造」）が入っているか
- [ ] URL は Pages の1本か（相手が英語なら `.en.html`）
- [ ] お願いは1つだけか／返事を強要していないか（結びは「ご興味が向いたときにでも」）
- [ ] 相手の授業・記事・研究に触れる1行を足して、テンプレのコピペ感を消したか
- [ ] 送付したら `OUTREACH.md` §4 の運用ログに記録したか
