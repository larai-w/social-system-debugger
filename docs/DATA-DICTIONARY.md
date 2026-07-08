# データ辞書 — 📊 エクスポート（JSON/CSV）の全フィールド

> ≡メニュー「📊 データを書き出す (JSON/CSV)」が出力するデータの定義集。
> 研究・教材・レポートでの利用を想定。**式はすべて実装（`web/js/engine.js` / `web/js/ui.js`）からの転記**で、
> アプリ内の各ゲージの「(?)」モーダルと同一。値は特記なき限り 0〜100 に clamp される。
> モデルは直感を育てるための意図的に単純化した玩具モデルであり、予測ツールではない。

## トップレベル

| キー | 意味 |
|---|---|
| `app` / `schema` | 固定 `social-system-debugger` / エクスポート形式のバージョン（現在 1） |
| `exported_at` | 書き出し時刻（ISO 8601 / UTC） |
| `lang` | 書き出し時の表示言語（ja/en） |
| `town_name` | ユーザーが付けた街の名前（未設定なら null。個人情報ではなく任意の愛称） |
| `share_url` | **このURLを開くと全パラメータが復元され、同じ実験を再現できる**（再現性の要） |
| `params.*` | 下記の入力パラメータ（ユーザーが操作した値そのもの） |
| `metrics.*` | 下記の導出メトリクス（パラメータから決定的に計算。P1/P2 のみ。P3/P4 は動的シミュレーションのため省略） |

## params — 入力パラメータ

| パス | 範囲 | 意味 |
|---|---|---|
| `p1_information.filterRate` | 0–100 | 情報フィルタリング率（エコーチェンバー度） |
| `p1_information.ethicsScore` | 0–100 | リーダーの倫理観（意思決定の公正性） |
| `p1_information.algo` | greedy / dp | 統治アルゴリズム。greedy=短期報酬最大化、dp=長期最適化 |
| `p1_information.historicalImmunity` | 0–100 | 歴史的免疫（過去の失敗の記憶がどれだけ参照されるか） |
| `p2_infrastructure.shrinkRate` | 0–100 | スマート縮退率（インフラの計画的集約） |
| `p2_infrastructure.dxRate` | 0–100 | DX投資率（技術継承の投資。後継者ストックの回復源） |
| `p2_infrastructure.ethicsP2` / `algoP2` | 同上 | PAGE 2 の統治倫理・アルゴリズム |
| `p2_infrastructure.publicReboot` | bool | 公共性リブート（再公営化。効率主義を停止し公共性を最優先） |
| `p2_infrastructure.rootRestricted` | bool | Root権限制限（リーダー単独の破壊的操作を多重承認でブロック） |
| `p2_infrastructure.skillStock` | 0–100 | 後継者ストック（遅い状態変数。ブランド維持力のゲート） |
| `p3_cognition.searchDepth` | 1–10 | 探索深度（どれだけ深く考えてから判断するか） |
| `p3_cognition.groundingRate` | 0–100 | 現実同期レート（オフラインの現実接触） |
| `p3_cognition.learningRate` | 0–100 | 学習率（新情報の取り込み速度。高すぎると毒も速く学ぶ） |
| `p4_stakeholder.extTraffic` | 0–100 | 外部トラフィック（当事者でない観客の流入量） |
| `p4_stakeholder.gamification` | 0–100 | ゲーム化スコア（議論が娯楽化している度合い） |

## metrics.p1_information — PAGE 1 導出メトリクス

実装: `engine.js metrics(fr, es, al)`。以下 `f = filterRate/100`, `e = ethicsScore/100`, `gp = (algo==='greedy' ? 0.38 : 0)`。

| キー | 式（clamp 0–100） | 読み方 |
|---|---|---|
| `entropy` | `f*42 + (1-e)*38 + gp*20` | 無秩序度。**76 超で崩壊条件** |
| `paranoia` | `f*48 + (1-e)*33 + gp*14` | 認知バイアス・被害妄想の蓄積 |
| `socialCap` | `100 - f*30 - (1-e)*42 - gp*28` | ソーシャルキャピタル（相互信頼の蓄積） |
| `dopamine` | greedy: `52 + (1-e*0.4)*35` ／ dp: `30 + e*38` | ドーパミン熱狂度（即時報酬への依存） |
| `infra` | `100 - (1-e)*52 - f*20 - gp*28` | インフラ維持力 |
| `diversity` | `100 - f*82` | 多様性指数（フィルタの直接の犠牲） |
| `trust` | `e*80 + (1-f)*20` | 信頼指数 |
| `resilience` | `e*52 + (1-f)*48 - gp*30` | 回復力 |
| `legitimacy` | `e*92 + (1-f)*8` | 正当性（ほぼ倫理で決まる＝壊すのは一瞬、戻すのも倫理から） |
| `infoH` | `(1-f)*90 + e*10` | 情報健全性 |
| `viability` | `e*62 + (1-f)*38 - gp*42` | 長期持続性（greedy の隠れコストが最大） |
| `mentalWB` | `100 - paranoia*0.92` | 精神的健全性 |
| `crash` | `entropy>76 or (infra<18 and socialCap<18)` | 崩壊判定（bool） |

## metrics.p2_infrastructure — PAGE 2 導出メトリクス

実装: `ui.js metricsP2(s, d, al, e)`。以下 `sf=s/100`, `df=d/100`, `ef=e/100`, `isG=(algo==='greedy')`。
PAGE 2 は「ブランド→税収→保守財源→インフラ→ヘリ」の因果連鎖と、遅い状態変数 `skillStock` を持つ。

| キー | 定義（要旨。式全文はコード参照） | 読み方 |
|---|---|---|
| `redundancy` | `calcRedundancyBuffer(s, al, publicReboot)` | 冗長性バッファ。**ショック時 <30% 即時崩壊 / ≥60% 生存継続** |
| `infra` | 基礎値 `100-(1-sf)*35·D-(1-df)*15-(isG?(1-ef)*28:6)·D`（D=リブート時0.5）に修復・財源不足・ショックを加減 | インフラ維持力。<65 で infraError |
| `deadlock` | `!rootRestricted && ef<0.4 && isG && infraError` | **他責デッドロック**。成立すると cpuBlame=100・インフラ3倍速崩壊 |
| `cpuBlame` / `cpuRepair` | deadlock時 100/0。通常 `cpuBlame=(1-ef)*22+(isG?14:0)`、`cpuRepair=100-cpuBlame` | 行政CPUの「責任回避」対「修復」の配分 |
| `skillStock` | 遅い状態変数（DX投資で回復・放置で枯渇。`p2SkillFactor`: ≥30で満額 / <12で急落の崖） | 後継者ストック。ブランドのゲート |
| `brand` | `(45+sf*16+(isG?-12:12)+ef*8) × p2SkillFactor(skillStock)` | ブランド産業力＝地域の税収基盤 |
| `budget` | `42 + brand*0.55 - (isG?(1-ef)*30:6) - (1-sf)*10 - リブート費16 - …` からショック減算 | 自治体財政。**<8 で崩壊条件** |
| `heliOp` | ショック崩壊時 false。リブート時 true。通常 `infra>35 && cpuRepair>25 && ef>=0.3` | 救命ヘリ稼働（3状態のうち OPERATIONAL か否か） |
| `infraError` / `crash` | `infra<65` ／ `(!heliOp && infra<20) or budget<8 or ショック崩壊` | 警告フラグ／崩壊判定 |

## 使い方の例

- **感度分析**: `share_url` で状態を固定 → 1パラメータだけ変えて再エクスポート → CSV を並べて差分を見る（例: ethicsScore を10刻みで動かし legitimacy の応答を測る。式が線形なので手計算と一致するはず——一致しなければバグ報告を歓迎します）。
- **授業レポート**: 「生き残る設定」の仮説→実験→エクスポート→表計算でグラフ化（`web/classroom.html` の50分の型）。
- **モデル批評**: 式の妥当性への指摘は GitHub Issues へ。「この重み付けは現実の◯◯と整合しない」という形の指摘が最も助かります。
