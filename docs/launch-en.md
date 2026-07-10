# EN Launch Kit — Show HN / Product Hunt (draft)

> MARKETING.md 海外チャネル（フェーズ2以降）。**投稿はフェーズ2の条件を満たしてから**:
> EN の i18n を磨き終えている／デモ動画（英語キャプション版）がある／週次運用が安定している。
> HN はやり直しが利きにくい（再投稿制限）ので、下のチェックリストを全部消してから出す。

---

## 1. Show HN

### Title（80字以内・誇張なし・HN文化では小文字めの平叙文が好まれる）

```
Show HN: Social Debugger – an educational sim of how societies fail (no login, browser-only)
```

代替案:
```
Show HN: I built a simulator where you debug a collapsing society
Show HN: An agent-based toy model of societal collapse you can play in 60 seconds
```

### 本文（投稿フォームの text 欄。個人的・技術的・非営利を前面に）

```
Hi HN — I'm a solo developer in Japan. I built a free, non-commercial educational
simulator that lets you experience *how* societies and regional infrastructure
fail — and how interventions change the outcome. It runs entirely in the browser,
no login, ~60 seconds to try:

https://larai-w.github.io/social-system-debugger/

What it is:
- Four "pages", each a small dynamical model you can break and repair with
  sliders: information space (filter bubbles / overfitting), regional
  infrastructure (efficiency vs. redundancy, successor shortage), cognitive
  recovery (why outrage becomes self-sustaining), and stakeholder voice
  (how outside traffic drowns out the people actually affected).
- One-tap presets (e.g. recreate the 1933-style collapse, then change the
  parameters and watch it recover instead).
- A "rewind" mechanic: after a collapse, go back and change exactly one thing.
- JSON/CSV export of all parameters + metrics, and share URLs that reproduce
  any run exactly (built with classroom/research use in mind).

Tech notes, in case they're interesting:
- The app was a single 330k-character HTML file. I split it into classic
  scripts with no bundler — concatenating the files reproduces the original
  byte-for-byte — so the deployed behavior never changed during the refactor.
- The simulation core is DOM-free and unit-tested with node:test.
- **Installable PWA (offline-capable).** Once installed it launches
  full-screen and works without a network. Chart.js is self-hosted — there are
  zero external JS dependencies at runtime — so the app and its service worker
  have no third-party origin to worry about. If the CDN were somehow blocked,
  graceful degradation (sliders, tabs, sharing keep working) is asserted in CI,
  not just hoped for. Install instructions: README §"Install as an app (PWA)"
  or ≡ menu → "📲 Install as an app" inside the app.
- Native builds (iOS/Android) are the same code via Capacitor behind a
  no-op-on-web facade.
- Static hosting on S3+CloudFront via CDK; GitHub Actions deploys with OIDC
  (no long-lived keys). No Docker — there is no resident process to contain.
  For the full technical story see [`docs/ARCHITECTURE.en.md`](ARCHITECTURE.en.md).
- **Reachability CI caught 3 real bugs before shipping.** A grid-search test
  runs against the real engine to confirm every weekly scenario is (a) beatable
  and (b) not already satisfied at the starting parameters ("instant-clear" bug).
  Two such bugs were found at T20 and one more at T40; all were fixed before the
  scenario reached users.
- Privacy: no accounts, no cookies, anonymous aggregate analytics only.

Important framing: it deliberately names no real places, people, or current
politics. The models are about *structures* any society can fall into, and the
disclaimers say so on every share card. It's a toy model for intuition, not a
forecasting tool.

I'd especially appreciate criticism of the models from anyone in computational
social science / ABM — point out one flaw and I'll try to fix it.
```

### 投稿1コメント目（自分で置く補足。質問が来る前に技術詳細の受け皿を作る）

```
A few anticipated questions:

Q: Is this "just" a toy model?
A: Yes, proudly. Every mechanism (echo-chamber overfitting, redundancy
   buffers, blame-avoidance deadlock) is a simplified caricature meant to
   build intuition. The formulas are shown in-app for every metric.

Q: Why no framework / bundler?
A: The app predates the split and correctness mattered more than tooling.
   Classic scripts sharing globals, verified by tests that the split files
   concatenate back to the original. Boring, but zero regressions.

Q: Data / research use?
A: Menu -> Export gives JSON/CSV of all parameters and metrics plus a URL
   that reproduces the exact run. There's also a printable one-page
   classroom guide (EN): https://larai-w.github.io/social-system-debugger/classroom.en.html

Q: Where's the full technical write-up?
A: docs/ARCHITECTURE.en.md in the repo covers the module split, DOM-free
   engine, dual delivery (Pages + CloudFront OAC), keyless OIDC deploy,
   the Playwright Console-zero harness, and the reachability CI in depth.
   It's written with a cloud/infrastructure reviewer in mind.
```

---

## 2. Product Hunt

### Tagline（60字以内）

```
Debug a collapsing society — an educational sim, free in your browser
```

### Description

```
Social Debugger is a free, non-commercial educational simulator of how
societies and regional infrastructure fail. Tap a preset to watch an
information space, a shrinking town, or a public debate collapse — then move
the sliders and find the configuration that survives. Rewind a collapse and
change exactly one thing. Export any run as JSON/CSV with a reproducible
share URL. No login, no ads, no real names — it's about structures, not
about anyone in particular. Works on phones; also available as an app.
```

### Maker's first comment

```
Hi! Solo dev here. I built this because "why societies break" is usually
taught as opinion, and I wanted it to feel like debugging: reproducible,
parameterized, and slightly addictive in the way good failure analysis is.
Everything is a deliberately simplified toy model — the formulas are shown
in-app, and I'd love to hear where they're most wrong. Teachers: there's a
printable one-page classroom guide in the app's README.
```

---

## 3. 投稿前チェックリスト（フェーズ2ゲート）

- [ ] EN の i18n を全ページ点検（機械翻訳っぽい箇所の磨き込み）
- [ ] 英語キャプション版リール（30秒）を用意（reel-30s / reel-30s-history の EN 化）
- [ ] classroom.en.html の URL が生きている（公開済み）
- [ ] OGP（og:image・description）が EN 環境で自然に見える
- [ ] HN ガイドライン再読。**upvote のお願いを誰にもしない**（リング検出で死ぬ）
- [ ] 投稿タイミング: 平日の米国東部 午前（日本の夜）。投稿後2〜3時間は張り付いて全コメントに返信
- [ ] 批判コメントへの姿勢を事前に決めておく: モデルの粗の指摘は**歓迎して Issue 化**（OUTREACH の精神と同じ）
- [ ] 「政治的では？」への定型回答を用意: 実名ゼロ・構造の話・両陣営に同じ力学が働くことをアプリ内で明示している
- [ ] Show HN と Product Hunt は**同日にしない**（それぞれのトラフィックを観測可能に保つ）
- [ ] announce cards (en) ready — `docs/announce-post.en.md` を素材に X/各チャネル向けカードを最終確認

## 4. 投稿後の観測（MARKETING.md KPI と接続）

- HN: 順位・コメント数・滞在（Plausible の referrer=news.ycombinator.com）
- PH: upvote・コメント・フォロー
- どちらも、来訪→`weekly_start`／`share_*` への転換率を1行メモに残す（出願資料の素材）
