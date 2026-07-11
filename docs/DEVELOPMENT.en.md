# Development Guide

> **[日本語](DEVELOPMENT.md) | [English](DEVELOPMENT.en.md)** (this page)

Practical notes for anyone who touches the "Social System Debugger" (future me, collaborators). For the model's formulas see [`METHODOLOGY.en.md`](METHODOLOGY.en.md); for release history see [`../CHANGELOG.md`](../CHANGELOG.md).

---

## Architecture overview

- **Front-end split into modules under `web/`** (separated from the single `index.html` in Phase 1). **No bundler** — plain classic `<script>` tags loaded in order, all sharing the **global scope** (not `type="module"`, so inline `onclick=` handlers keep working). No build step.
- **Load order (important)**: `i18n → engine → native → share → scenario → ui → demo`. Later files reference earlier files' functions/constants at runtime.
- `engine.js` is the **DOM/window-free pure-logic layer** (`metrics`, etc.) — no `document`/`window`, so it can be reused for server-side validation and unit tests.
- Native features (Capacitor) live behind the `window.SSD` facade in `native.js`, all gated by `SSD.isNative` → **web is a full no-op**.
- The only runtime external dependency is **Chart.js v4 (self-hosted)**. Bundled at `web/vendor/chart.umd.min.js` (to update, just replace the file). Agents are drawn on raw Canvas. The `<meta http-equiv="Content-Security-Policy">` in `web/index.html` blocks script injection from external origins.
- **PWA**: `web/manifest.json` / `web/icon.svg` / `web/sw.js`.
- **Delivery**: GitHub Pages (serves `web/`, URL unchanged) + AWS S3/CloudFront (CDK in `/infra`).

```
social-system-debugger/
├── web/                     # front-end assets (Capacitor webDir + delivery root)
│   ├── index.html           #   markup + bootstrap (loads external css/js)
│   ├── css/app.css
│   └── js/
│       ├── i18n.js          #   I18N dictionary (DOM-free)
│       ├── engine.js        #   pure calc + model state (DOM/window-free)
│       ├── native.js        #   Capacitor bridge (window.SSD, all isNative-gated)
│       ├── share.js         #   share routing (X / LINE / save image)
│       ├── scenario.js      #   weekly scenarios (declarative goalConds / fetch / notify)
│       ├── ui.js            #   DOM, charts, P1–P4, discovery, init (largest)
│       └── demo.js          #   ?demo=1 demo mode (auto-drives the real engine; no-op by default)
│   ├── manifest.json / icon.svg / sw.js
│   ├── vendor/chart.umd.min.js     # self-hosted Chart.js (the only runtime external dependency)
│   ├── classroom.html / .en.html   # one-page teacher guide (self-contained; prints to A4)
│   ├── classroom-slides.html / .en.html # classroom projector slides (self-contained; 9 slides; still reads stacked when JS is off)
│   └── privacy.html / .en.html     # privacy policy (store submission / footer link)
├── content/weekly/          # weekly scenario JSON (*.json + latest.json) + weekly.schema.json
├── infra/                   # AWS CDK (TypeScript): S3(OAC)+CloudFront + GitHub OIDC role
├── promo/                   # promo reel HTML (?lang=en supported; auto-recorded by make reels)
├── tests/                   # unit / guardrail tests (engine / goal / share / invariants / weekly-reachability / i18n-completeness / export-dictionary) — 8 files
├── scripts/                 # validate-weekly / verify / verify-offline / record-reel / gen-icons / gen-og-image /
│                            #   gen-classroom-pdf / gen-store-shots / gen-announce-cards / gh-project-backfill, etc.
├── capacitor.config.json    # appId / webDir=web / plugin config
├── package.json             # Capacitor deps + root scripts (test / check / verify / reels / gen:icons …)
├── Makefile                 # single entry point for all ops (make help)
├── README.md / .en.md
├── CHANGELOG.md
├── docs/                    # METHODOLOGY / DEVELOPMENT (this file) / DATA-DICTIONARY (export fields)
└── .github/workflows/       # ci.yml / deploy.yml(Pages) / deploy-aws.yml(OIDC) / weekly-rotate.yml
```

---

## Code map (which file holds what)

| Area | File | Key functions / variables | Role |
|---|---|---|---|
| **i18n** | `i18n.js`(dict) / `engine.js`(`t`,`tt`) / `ui.js`(`applyI18n`) | `I18N={ja,en}`, `t(id)`, `tt(ja,en)`, `applyI18n()`, `applyI18nAuto()` | `t()` manual keys, `tt()` JS inline, `data-i18n` via `applyI18nAuto()`. Coverage enforced by `tests/i18n-completeness.test.mjs` |
| **Pure calc** | `engine.js` | `metrics(fr,es,al)`, `simTimeline()`, `clamp/lerp/seedRng/genScatter`, `HIST_REF/PRESETS/MDATA` | **DOM/window-free**. Tested by `tests/engine.test.mjs` and `tests/invariants.test.mjs` |
| **L1 Information Space** | `ui.js` | `updateAll()`, `startAgents()`, `startScatter()`, `getModeCollapseLog()` | overfitting, mode-collapse log, animation |
| **L2 Regional Infrastructure** | `ui.js` | `metricsP2()`, `calcRedundancyBuffer()`, `updateAllP2()`, `injectSystemShock()` | redundancy, deadlock, shock |
| **L3 Individual Cognition** | `ui.js` | `stepP3()/drawP3()/updateP3Monitor()`, `executeDropout()/executeEarlyStopping()` | node sim, poisoning, recovery |
| **L4 Stakeholder Asymmetry** | `ui.js` | `drawP4()/updateP4Monitor()`, `executePacketFiltering()` | sybil flood, drop rate |
| **Verdict banners** | `ui.js` | `setVerdictBanner(alertId, state, key)` (`crash`/`warn`/`good`/`''`) | 3-tier banner; on crash-transition fires haptic + `weekly_fail` |
| **Discovery log** | `ui.js` | `DISCOVERIES[]`, `discover(id)`, `noteSessionPage()`, `notePreset()` | `localStorage['ssd_discoveries']`; `sce_*` reachable only when weekly (native) |
| **Sharing** | `share.js`(routing) / `ui.js`(card gen) | `renderShareActions()`, `xIntentUrl/lineShareUrl`, `generateResultCard()`, `shareWithEtiquette()` | X/LINE/save 3-button + others; reproducible URL, result-card PNG |
| **Native** | `native.js` | `window.SSD` (`isNative/platform/haptic/share/plugins`) | Capacitor bridge; all `isNative`-gated = web no-op |
| **Weekly scenarios** | `scenario.js` | `SCENARIOS[]`, `getActiveScenario()`, `evalGoalConds()`, `checkScenarioGoal()`, `loadRemoteScenario()` | declarative `goalConds`, fetch(latest.json)+fallback, notifications; all `WEEKLY_ENABLED`(native)-gated |
| **Analytics** | `ui.js`(`track`) | `track(event, props)` (adds common prop `app_platform`) | Plausible; event list in README "Analytics" |
| **Feedback** | `ui.js` | `FEEDBACK_ENDPOINT`, `openFeedback()`, `submitFeedback()` | JSON POST to Formspree |
| **Nav / init** | `ui.js` | `switchTab(n)`, `openAppPage(name)`, `(function init(){…})()` | tab switch + address-bar sync, startup. `openAppPage('classroom'/'privacy')` opens a static page in a new tab from the ≡ menu (`.en.html` when EN; `track('open_*')`) |
| **Demo mode** | `demo.js` | `?demo=1` check + ghost cursor | auto-drives the real engine (no faked values); for promo recording / kiosks. Full no-op by default |
| **PWA** | `web/sw.js` | `CACHE` (bump on every change), `CORE[]` | install, offline; CORE lists all js/css |

Every layer follows the same shape: **user input → compute in `metrics*` → update gauges/banners/logs in `updateAll*`**. P1/P2 update on input; P3/P4 update every frame via `requestAnimationFrame`.

> **When adding a function**: all files are classic scripts sharing globals. Any function called from markup `onclick="foo()"` must be defined as `function foo(){…}` in some js file. Cross-file calls are safe at runtime (everything is defined by the time the user interacts), but **top-level immediate code** must not reference a not-yet-loaded function/constant.

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
1. Add one entry to `DISCOVERIES` (in `ui.js`): `{id, badge:()=>tt(...), learn:()=>tt(...)}`.
2. Call `discover('id')` wherever the condition is met (`updateAll*` / `setPreset*` / action functions).
3. The counter (`(x/N)`) is derived automatically from `DISCOVERIES.length`. **Forbidden**: streaks, notifications, time limits, anxiety-inducing copy (they contradict the app's own critique).
- Note: `sce_`-prefixed discoveries are for weekly scenarios and are only reachable/counted when `WEEKLY_ENABLED` (native).

### Add a weekly scenario (the human step is just "write one JSON file" — CI auto-validates reachability)
1. Create `content/weekly/2026-Wxx.json`. Schema is `content/weekly.schema.json` (required: `id/title/intro/page/params/goal/goalConds/difficulty/discoveryId`; `title/intro/goal` need both ja/en).
2. **Goals are declarative**: `goalConds: [{ "metric": "diversity", "op": ">=", "value": 80 }, …]` (AND-combined). `metric` is any key returned by `metrics*` (`diversity/entropy/legitimacy/brand/redundancy/infra/integrity/ratio/drop`…) plus params (`ethicsScore/skillStock/searchDepth`…). Evaluated by `evalGoalConds()` in `scenario.js`.
3. **Swapping `latest.json` is automated**: `weekly-rotate.yml` runs every Monday 00:00 JST, copies that week's `2026-Wxx.json` to `latest.json`, commits it, and triggers the Pages/AWS deploys. **The human step is only "add one JSON for the week and open a PR."** (The app fetches `latest.json` at startup; `CONTENT_BASE_URL` in `scenario.js` is the origin.) A week with no stock makes the rotation fail — a built-in "write more scenarios" reminder.
4. Validate locally: `npm run validate:weekly` (rejects missing ja/en or bad ops) + `npm test` (`tests/weekly-reachability.test.mjs` and `tests/weekly-reachability-p234.test.mjs` check that every `goalConds` metric name **exists, and the scenario is neither instantly clearable nor permanently unreachable**; caught in CI). **Full delegation to a subagent is safe**: create the JSON and make `npm run check` green — CI handles reachability; commit is done by the parent session.
5. PR → merge to main → `deploy-aws.yml` syncs to S3 and invalidates `latest.json` automatically.
- **Forbidden**: naming real countries/municipalities/people (etiquette policy). Keep it abstract, a variation of existing presets.

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

- `.github/workflows/ci.yml` (on PR): the web job runs `npm ci` → **`npm run check`** (identical to local = unit/guardrail tests + weekly JSON schema validation + eslint + prettier). The infra job runs `cdk synth` (with cdk-nag).
- `.github/workflows/deploy.yml` (main push): **auto-deploy to GitHub Pages** (`actions/deploy-pages`; serves `web/`).
- `.github/workflows/deploy-aws.yml` (main push / when web·content change): **assume an AWS role via OIDC** → sync `web/`+`content/` to S3 → invalidate only `latest.json`+`index.html`. No long-lived keys stored.
- `.github/workflows/weekly-rotate.yml` (every Monday 00:00 JST / manual): copies that week's `content/weekly/<ISO-week>.json` to `latest.json`, commits it, and kicks off the Pages/AWS deploys via `workflow_dispatch`. A week with no stock fails loudly (a reminder to add scenarios).
- `.github/workflows/lighthouse.yml` (every Monday 01:00 JST / manual): audits the production Pages with Lighthouse (performance/accessibility/PWA, etc.) as an **advisory job that never fails on score**; reports land in the Actions artifacts. Manual run: Actions → Lighthouse → Run workflow.
- Public URL (unchanged): https://larai-w.github.io/social-system-debugger/ ; AWS via the CloudFront domain (an `infra` output).
- Infra definition, deploy steps, and the OIDC/least-privilege rationale are in [`../infra/README.md`](../infra/README.md).
- **If Pages fails with "Deployment failed, try again later."**, that's a transient GitHub Pages backend issue. Wait, then **Re-run failed jobs**, or push again. Status: https://www.githubstatus.com.

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
npm run serve              # → http://localhost:8000 (open over http; file:// breaks PWA/fetch)
```

- **Always open over http://** (`file://` breaks manifest, Service Worker, and `fetch()` due to CORS/origin rules).
- Syntax check: `node --check web/js/xxx.js`.
- **All ops are listed in `make help`** (a single entry point shared by humans / Claude Code / Codex). The main ones:
  ```bash
  make check          # same as CI (tests + weekly JSON validation + eslint + prettier) = npm run check
  make verify         # ★ automated "checks before reporting done" (see below)
  make verify-offline # PWA offline boot check (SW register → offline emulation → reload)
  make reels          # auto-record promo reels (webm to dist/reels/, mp4 too if ffmpeg is present)
  make gen-icons      # generate store icons/splash into resources/
  make classroom-pdf  # generate teacher guide as dist/classroom.pdf / .en.pdf (A4)
  make store-shots    # capture 6 store screenshots into dist/store-shots/
  make announce-cards # generate 4 X announcement cards into dist/announce/
  make gh-project     # backfill dev history to GitHub Issues/Milestones (requires gh)
  make synth          # cdk synth (with cdk-nag security checks; no AWS needed)
  ```
- **★ Automated "checks before reporting done" = `make verify`** (`scripts/verify.mjs`, Playwright): replays CLAUDE.md's manual checklist (zero Console errors, all 4 tabs, a preset, slider input, and graceful degradation when Chart.js fails) across **two cases — Chart.js OK and CDN blocked** — and asserts zero Console/pageerror. Run this instead of poking the browser by hand every time (first run: `npx playwright install chromium`).
- **If the SW serves stale JS** (common right after a deploy or a module change): DevTools → Application → Service Workers → check **Bypass for network** (easiest during dev) / or Unregister → hard reload / incognito. `sw.js` is cache-first, so whenever you change CORE, bump the `CACHE` version (`ssd-cache-v6-xxx`).

### Native (Capacitor)
- `npm install` → `npx cap add ios/android` → `npx cap sync` → `npx cap open ios` (Xcode) / `android` (Android Studio). Details in the "Native app" section of [`../README.md`](../README.md).
- After touching web code, run `npx cap sync` to push it to each platform.

---

*Applies to: v6.346 (app version) at sw cache v6-366 / Phase 1 (module split, Capacitor, weekly scenarios, AWS delivery, CI/CD) complete. Node.js 22+ recommended (CI and devcontainer pin Node 22).*
