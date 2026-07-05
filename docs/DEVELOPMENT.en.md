# Development Guide

> **[日本語](DEVELOPMENT.md) | [English](DEVELOPMENT.en.md)** (this page)

Practical notes for anyone who touches the "Social System Debugger" (future me, collaborators). For the model's formulas see [`METHODOLOGY.en.md`](METHODOLOGY.en.md); for release history see [`../CHANGELOG.md`](../CHANGELOG.md).

---

## Architecture overview

- **Single HTML file**: logic, style, and markup all live in `index.html` (`<style>` + HTML + one big `<script>`). **No build step** — just open `index.html` in a browser.
- The only external dependency is **Chart.js v4 (CDN)**. Agents are drawn on raw Canvas.
- **PWA**: `manifest.json` / `icon.svg` / `sw.js` (Service Worker).
- **Docs**: `README.md` / `README.en.md` (top level), `docs/` (this guide + methodology), `CHANGELOG.md`.

```
social-system-debugger/
├── index.html            # the app (the one and only app file)
├── manifest.json         # PWA metadata
├── sw.js                 # Service Worker (network-first)
├── icon.svg              # app icon
├── README.md / .en.md    # overview (JA / EN)
├── CHANGELOG.md          # release history
├── docs/
│   ├── METHODOLOGY.md / .en.md   # formulas, thresholds, limits
│   └── DEVELOPMENT.md / .en.md    # this file
└── .github/workflows/    # ci.yml / deploy.yml
```

---

## Code map (the main parts inside `index.html`)

| Area | Key functions / variables | Role |
|---|---|---|
| **i18n** | `I18N = {ja, en}`, `t(id)`, `tt(ja,en)`, `applyI18n()`, `applyI18nAuto()` | `t()` uses manual-list keys, `tt()` is for JS inline strings, and `data-i18n` attributes are handled by `applyI18nAuto()` |
| **L1 Information Space** | `metrics(fr,es,al)`, `updateAll()`, `startAgents()`, `startScatter()`, `getModeCollapseLog()` | overfitting, mode-collapse log, agent/scatter animation |
| **L2 Regional Infrastructure** | `metricsP2()`, `calcRedundancyBuffer()`, `updateAllP2()`, `injectSystemShock()` | redundancy, deadlock, shock, timeline chart |
| **L3 Individual Cognition** | `stepP3()`/`drawP3()`/`updateP3Monitor()`, `p3Fooling()`, `executeDropout()`/`executeEarlyStopping()` | node simulation, poisoning, recovery |
| **L4 Stakeholder Asymmetry** | `manageSpam()`/`drawP4()`/`updateP4Monitor()`, `executePacketFiltering()` | sybil flood, drop rate, stakeholder ratio |
| **Verdict banners** | `setVerdictBanner(alertId, state, key)` (state = `crash`/`warn`/`good`/`''`) | the shared 3-tier banner on every page; swaps the `data-i18n` of `.at` (the headline) |
| **DOM state guards** | `setText/setColor/setClassOn/setDisp` | in monitors that run every frame, "write only when the value changes" — prevents flicker |
| **Discovery log** | `DISCOVERIES[]`, `discover(id)`, `noteSessionPage()`, `notePreset()`, `openDiscoveryLog()` | collection-style gamification; `localStorage['ssd_discoveries']` |
| **Sharing** | `buildShareURL()`, `shareScenario()`, `generateResultCard()`, `generateEtiquetteCard()`, `shareWithEtiquette()` | reproducible URL, result-card PNG, etiquette-card co-send |
| **Feedback** | `FEEDBACK_ENDPOINT`, `openFeedback()`, `submitFeedback()`, `researcherMode`/`setResearcherMode()` | JSON POST to Formspree; GitHub Issues path |
| **Nav / init** | `switchTab(n)`, `(function init(){…})()` | tab switch + address-bar sync, startup |
| **PWA** | `sw.js` (separate file) + the trailing `serviceWorker.register` | install, offline |

Every layer follows the same shape: **user input → compute in `metrics*` → update gauges/banners/logs in `updateAll*`**. P1/P2 update on input; P3/P4 update every frame via `requestAnimationFrame`.

---

## Common changes, step by step

### Add a preset
1. Add a key/value to `PRESETS` (P1) / `PRESETS_P2` / `PRESETS_P3` / `PRESETS_P4`.
2. Add a button to the preset bar: `<button class="pbtn" id="pN-key" onclick="setPresetPN('key')" data-i18n="key">Japanese label</button>` (**always order danger → healthy = red → green**).
3. Add the English label to `I18N.en`.
4. To tie it to a discovery, call `notePreset(page, id)` / `discover('d_pN_...')` inside `setPresetPN`.

### Adjust a formula or threshold
- Edit the relevant `metrics()` / `metricsP2()` / `updateP3Monitor()` / `updateP4Monitor()`. **When you do, also update [`METHODOLOGY.en.md`](METHODOLOGY.en.md)** (and the JA version) so the formula docs don't drift from the implementation.

### Change a banner's state or wording
- The verdict is decided by the `crash`/`warn`/`good` branches in each `updateAll*` → `setVerdictBanner('alertBannerPn', state, 'banner_pn_xxx')`.
- The headline is the `banner_pn_*` key in `I18N` (Japanese inline or explicit, English in `I18N.en`). The detail line (`.am`) is set from JS via `setText(...)`.
- **P3/P4 banners are decided instantly from parameters** (`searchDepth`/`learningRate`, `gamification`/`extTraffic`) so they track button presses stably (v6.338).

### Add a discovery
1. Add one entry to `DISCOVERIES`: `{id, badge:()=>tt(...), learn:()=>tt(...)}`.
2. Call `discover('id')` wherever the condition is met (`updateAll*` / `setPreset*` / action functions).
3. The counter (`(x/N)`) is derived automatically from `DISCOVERIES.length`. **Forbidden**: streaks, notifications, time limits, anxiety-inducing copy (they contradict the app's own critique).

### i18n
- **Switch style (the Page 1 way)**: put `data-i18n="key"` on the element with Japanese inline (`applyI18nAuto` caches the ja) + English in `I18N.en.key`. → JA build shows only Japanese / EN build shows only English.
- **Bilingual inline**: write "日本語 ENGLISH" as-is (e.g. gauge headings).
- Dynamic strings use `tt('Japanese','English')`. Chart dataset names can stay statically bilingual (not overwritten on language switch).

---

## Versioning policy

- Advance in **0.001 steps** (v6.342 → v6.343 …). Do not bump the major (only when explicitly asked).
- **The title shows "v6" with no decimal** (`<title>` / `og:title` / `<h1 id="mainTitle">`).
- **The precise version (v6.34x) is shown in**: the footer `#footerTxt` (Japanese inline + `I18N.en.footerTxt`), the app-name line of `generateResultCard()` and `generateEtiquetteCard()`, and the README (JA/EN) titles.
- In-code `v6.x:` comments are history markers for feature additions (don't rewrite them).
- **Commit messages are in English** (so GitHub Actions run names show in English).

---

## Deploy (CI/CD)

- `.github/workflows/ci.yml`: lightweight checks on PRs to `main`.
- `.github/workflows/deploy.yml`: **push to `main` auto-deploys to GitHub Pages** (`actions/deploy-pages`).
- Public URL: https://larai-w.github.io/social-system-debugger/
- **If a deploy fails with "Deployment failed, try again later."**, that's a transient GitHub Pages backend issue. Fix: wait a bit and **Re-run failed jobs** from the Actions tab, or push again (it redeploys even with identical content). Check overall GitHub status at https://www.githubstatus.com.

---

## Operational note (important)

- **Don't keep the repo in an iCloud/Dropbox sync folder** (`~/Documents` is often under iCloud sync). The sync service creates **conflict copies inside `.git`** (`main 2`, `HEAD 2`, `index 2`, etc.), which breaks git with `fatal: bad object` — edits revert, and pushes look like they failed.
  - If it happens: delete the `* 2` files under `.git` (name ending in "space + digit") to recover.
  - Permanent fix: move the repo to a non-synced folder (e.g. `~/dev/…`).

---

## Local development

```bash
git clone https://github.com/larai-w/social-system-debugger.git
cd social-system-debugger
open index.html            # just open in a browser (no build)
# to check a change: save → reload
```

- Quick syntax check (Node): extract the `<script>` and run it through `new vm.Script(...)` to catch parse errors in the inline JS.
- If the PWA/SW cache serves a stale build, use the browser's "Update Service Worker" or DevTools → Application → Service Workers → Update/Unregister.

---

*Applies to: v6.343*
