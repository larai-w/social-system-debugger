# Social OS Debugger v6.337 (社会＆地域インフラ・デバッガー)

> 🌐 **Language / 言語:** [**日本語版はこちら →**](README.md) ・ **English**（this page）

**Understand how societies collapse — in the language of code.**

An interactive literacy tool that treats society as one giant distributed system (an "OS") and visualizes, in real time, how information contamination and governance failure trigger a **cascade collapse** through physical infrastructure, individual cognition, and stakeholder representation.

🔗 **[Live Demo](https://larai-w.github.io/social-system-debugger/)**

---

## Overview

A **single-file SPA** that maps concepts from machine learning and distributed-systems engineering (overfitting, deadlock, redundancy, dropout, learning rate, sybil attacks) onto social phenomena. Just open `index.html` in a browser — agent simulation, Chart.js, and Canvas animations respond instantly as you move the sliders.

Tune the parameters to bring all four layers into a healthy range and you earn **GRAND OPTIMAL**, which lets you export a Markdown "debug audit report" and share it to 𝕏 (Twitter). It also works as a submittable assignment for coursework.

---

## The 4-Layer Architecture

| Layer | Page | What you debug |
|---|---|---|
| **L1** | Information Space | **Overfitting** of input data via echo chambers. As the filtering rate rises, society loses its generalization ability and the metrics log undergoes **mode collapse** into slogans and exclusionary tokens. |
| **L2** | Regional Infrastructure | **Blame-shift deadlock** caused by low ethics × Greedy strategy (operations halt, rescue helicopter grounded). The loss of **social fault tolerance (Redundancy Buffer)** as the price of efficiency, and the resulting fragility to black-swan shocks. |
| **L3** | Cognitive Recovery | The disguised node's **"justice poisoning attack"** that exploits shallow search depth. A **cognitive freeze mode** where a 0% learning rate rejects all facts. Recovery via DROP_OUT / EARLY_STOPPING / restricted ROOT privilege. |
| **L4** | Stakeholder Asymmetry | **Objective hijack** driven by external **sybil attacks** and fandom-style gamification. The structure by which the policy packets of 5.3M residents (the silent majority) get dropped. |

### Cross-layer cascades (marked by the green "⇄" badge)

- When L4 gamification exceeds 70%, the L2 infrastructure card **pulses red** to warn of destructive stress.
- When L1 overfitting exceeds 70%, the L3 cognitive-parameter card **flickers purple-to-red** to warn of cognitive-hack infiltration.
- L3's "restricted ROOT privilege" blocks L2's blame-shift deadlock via multi-signature approval.
- L3's "falsifiability" references L2's budget-allocation strategy (Greedy/DP); under Greedy, it dramatizes self-deception through an excuse log.

---

## Killer Demos

### 1. Injecting a shock into an efficiency-maxed city (L2)
1. Open Page 2 and apply the preset **"⚙ Efficiency-Maxed City"**.
2. Note that while infrastructure and budget look healthy, the **Redundancy Buffer is below 30%**.
3. Click **"⚡ Inject System Shock"** → instant **SYSTEM CRASH**.
4. For contrast, inject the same shock with the preset **"🛡 Redundancy-Secured City"** (Public Reboot ON) → **SURVIVED**.

> Lesson: The slack that looks like "waste" is the very lifeline that absorbs unknown shocks.

### 2. Debugging a mob in spinal-reflex mode (L3)
1. Open Page 3 and apply the preset **"⚡ Spinal-Reflex Mode"**.
2. Watch ordinary nodes — fooled by the central disguised node (a self-proclaimed voice of reason) — concentrate **red dashed attack edges** on fact-stating neutral nodes.
3. Raise the search depth to **7 or higher** → the attack edges vanish and you reach **DEBUGGED**.
4. Variation: with the **"🧊 Cognitive Freeze"** preset (0% learning rate), confirm that contamination persists even as you raise the depth.

> Lesson: Unverified righteousness becomes fuel for attacks. Recovery needs both "deep search" and the "humility to self-correct."

### 3. Choking policy packets under a spectator flood (L4)
1. Open Page 4 and apply the preset **"🎪 Spectator Flood"**.
2. Watch 1-bit-thinking spam nodes streaming in from off-screen **sever the resident cluster's links with red dashes**.
3. Push the gamification score above 70% → the PACKET LOG loses its diversity and loops on **low-entropy hate tokens**.
4. Run **"▶ EXECUTE: PACKET_FILTERING"** to block the sybil attack → resident packet priority recovers to 100%.

> Lesson: The quiet majority is erased not by loudness but by bandwidth occupation.

---

## Features

- **Four-page tabbed UI** — a unified cyberpunk aesthetic with a theme color per layer
- **Scenario presets** — one-click contrast experiments on every page (Weimar collapse, Nordic democracy, cognitive freeze, fandom flame war, and more)
- **Intro modal** — illustrates the "4-layer model of the Social OS" on first launch (reopen anytime via ℹ GUIDE)
- **(?) explainer modals** — bilingual theory notes plus formulas for all 17 metrics
- **Cascade-collapse effects** — hidden tabs are monitored in the background, warning of cross-layer fault propagation via UI flicker
- **Debug audit report** — reaching GRAND OPTIMAL generates a Markdown report with one-click copy and context-aware sharing
- **Full JA/EN support** — the EN button localizes all UI, live status, logs, and reports
- **Share system** — shares the current parameter state as a reproducible URL, auto-falling back across LINE / 𝕏 / OS share / copy (extended to every layer in v6.3)
- **Mobile-ready** — optimized touch interaction and log readability in both portrait and landscape

---

## Share System

Beyond just "showing a result," this system lets you **share it as an experiment anyone can reproduce under the same conditions**. The shared URL carries each page's parameters and the active tab, so the recipient can open the exact same scenario and verify it.

### Sharing philosophy

Sharing here is designed as an **experiment link for observing structure together** — not as an assertion about, or an attack on, any individual. Every shared message ends with the note "*Not about anyone specific — this is about structures any society can fall into,*" keeping the focus on the reproducibility of parameters and phenomena rather than political name-calling.

### Sharing pathways (introduced in v6.2)

- **Share Guide** — from the header, review the purpose of sharing, how to send it, and usage to avoid.
- **State-specific templates** — pick a message that fits the context: normal share, after applying a preset, after a shock verdict, or after generating an audit report.
- **Context-triggered sharing** — a share toast appears right after a preset is applied, a result-share button right after a verdict is confirmed, and an audit-report share button after GRAND OPTIMAL.
- **Share-target fallback** — opens the OS share sheet where the Web Share API is available; otherwise switches to LINE / 𝕏 / copy link.
- **Result card PNG** — for verdicts and audit reports, generate a 1200×630 result-card image. Supported browsers share it with the image attached; others fall back to PNG download.

### What v6.3 adds

- **"Moment of verdict" sharing on every layer** — the "▶ Share this result" button, previously only on the L2 system-shock verdict, now also appears when a verdict is confirmed on L1 (stable / collapse), L3 (poisoning attack / restored), and L4 (objective hijack / restored).
- **Page-specific share copy** — a dedicated "punchline" template per layer (echo chamber / poisoning attack / objective hijack), eliminating fallback to the generic message.
- **Etiquette card attached alongside** — together with the result-card PNG, a **⇪ How to Share** card (1200×630) summarizing the three rules of good sending is attached as a second image. On environments that can't share multiple files, only the result card is sent and a pointer to the in-app Share Guide is auto-appended to the message.
- **Save button for the etiquette card** — a **⬇ Save this card** button inside the Share Guide: via the share sheet on mobile, via PNG download on desktop.

### Technical changes

- Unified template selection → OS share / LINE / 𝕏 / copy around `shareScenario()`
- Extended `buildShareURL()` to persist not just P1 but all P2–P4 parameters and the active tab into the URL (retaining backward compatibility with legacy `f/e/a/l` URLs)
- `generateResultCard()` generates the OGP-ratio result-card PNG on Canvas
- v6.3: added `shareP1Result()` / `shareP3Result()` / `shareP4Result()`, wired to each layer's confirmed-verdict state
- v6.3: added `generateEtiquetteCard()` (etiquette card) and `shareWithEtiquette()` (two-image send + fallback); the generated card is cached after first render
- OGP / Twitter Card meta tags enable SNS card previews
- Share Guide, share popover, share toast, and etiquette card are all bilingual (JA/EN)

---

## Requirements

- **Standalone SPA** — no build step; just open `index.html` in a browser
- HTML5 / Canvas API / [Chart.js v4](https://www.chartjs.org/) (loaded from CDN)
- Recommended browsers: latest Chrome / Edge / Safari / Firefox (mobile supported)

```bash
git clone https://github.com/larai-w/social-system-debugger.git
cd social-system-debugger
open index.html   # or drag & drop into a browser
```

---

## Educational Use

This app is designed as teaching material for information literacy, social-systems theory, and introductory machine learning. The simulation parameters and formulas are exposed in each metric's (?) modal, so critically examining the model's assumptions is itself part of the learning task.

---

## CI/CD

Develop on the `development` branch → CI runs automatically on PRs to `main` → merging auto-deploys to GitHub Pages.

---

*Engine: Markov Chain + Monte Carlo + Agent-Based Simulation | © 2026 Social OS Debugger — Educational Tool*
