#!/usr/bin/env node
// T44: プロジェクト履歴を GitHub Issues / Milestones / Labels にバックフィルする（英語・ポートフォリオ用）。
//   - PROGRESS.md / CHANGELOG.md で管理してきた Phase 1 + T1〜T43 を、採用担当者が読める形で
//     GitHub 上に「計画 → 実行 → 完了」の履歴として再構成する。
//   - 冪等: 同名タイトルの issue が既にあればスキップ（何度実行しても重複しない）。
//   - 前提: gh CLI 導入済み・`gh auth login` 済み（TODO ☐11）。実行は `make gh-project`。
//   - オプション: --dry-run（作成せず一覧表示）
// 以後の運用: スプリント開始時に英語で issue を起票し、完了コミットの末尾に
// 「Closes #N」を書く（GitHub が自動で close する）。手順は docs/github-project.md。
import { execFileSync } from 'node:child_process';

const DRY = process.argv.includes('--dry-run');

const gh = (args, opts = {}) =>
  execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });

// ── 前提チェック ─────────────────────────────────────────────
let repo;
try {
  gh(['auth', 'status']);
  repo = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();
} catch {
  console.error(
    '❌ gh CLI が使えません。`brew install gh && gh auth login` の後に再実行してください（TODO ☐11）。'
  );
  process.exit(1);
}
console.log(`対象リポジトリ: ${repo}${DRY ? '（dry-run）' : ''}`);

// ── ラベル ───────────────────────────────────────────────────
const LABELS = [
  ['area:app', '00b8d9', 'Web app (web/) — UI, engine, PWA'],
  ['area:infra', '0e8a16', 'AWS CDK, CI/CD, GitHub Actions'],
  ['area:testing', 'fbca04', 'Automated tests & verification harnesses'],
  ['area:content', 'd93f0b', 'Weekly scenarios & in-app content'],
  ['area:docs', '0075ca', 'Documentation'],
  ['area:marketing', 'c2185b', 'Promotion, education & outreach assets'],
  [
    'process:ai-subagent',
    '8250df',
    'Implemented by an AI subagent under a written spec; reviewed & verified by the maintainer',
  ],
];

// ── マイルストーン ───────────────────────────────────────────
const MILESTONES = [
  {
    title: 'Phase 1 — Mobile, weekly scenarios & AWS foundation',
    description:
      'Module split of the monolith, Capacitor wrapper, share paths, declarative weekly scenarios, S3+CloudFront via CDK, keyless OIDC CI/CD.',
  },
  {
    title: 'Strategy sprints (T1–T24)',
    description:
      'Verification harnesses, researcher export, education channel assets, weekly content pipeline with reachability guarantees.',
  },
  {
    title: 'Delegation sprints (T25–T93)',
    description:
      'AI-subagent delegation protocol: main session writes specs, reviews, verifies and commits; subagents implement self-contained tasks. Includes portfolio-hardening, PWA-completion (T44–T54), quality/security (T55–T64), the first Sonnet-delegated task (T66), release-prep (T67–T70), the methodology-audit / self-improvement sprint (T79–T84), the sentinel-driven / education-kit sprint (T85–T89), and the usage-modes / mobile-verification sprint (T90–T92).',
  },
];
// NOTE: this milestone was previously named 'Delegation sprints (T25–T43)', then
// 'Delegation sprints (T25–T54)', then 'Delegation sprints (T25–T66)', then
// 'Delegation sprints (T25–T70)', then 'Delegation sprints (T25–T84)', then
// 'Delegation sprints (T25–T89)'.
// If an older milestone with any of those prior titles already exists in the repo,
// either rename it via:
//   gh api -X PATCH repos/OWNER/REPO/milestones/<n> -f title='Delegation sprints (T25–T92)'
// or close the stale one by hand — the create step below is idempotent by title, so it
// will add the new one alongside the old rather than renaming it.
const msOf = (id) =>
  id.startsWith('P')
    ? MILESTONES[0].title
    : Number(id.slice(1)) <= 24
      ? MILESTONES[1].title
      : MILESTONES[2].title;

// ── タスク（英語タイトル＝issue タイトル。done は close 済みで作成） ──────────
// [id, title, areas, delegated, note]
const TASKS = [
  [
    'P1',
    'Split the 330k-char monolith index.html into web/ modules with byte-identical behavior',
    ['area:app'],
    false,
    'Classic scripts sharing global scope; concatenating the split files reproduces the original byte-for-byte. engine.js is DOM-free for reuse and testing.',
  ],
  [
    'P2',
    'Wrap the web app for iOS/Android with Capacitor (no bundler)',
    ['area:app'],
    false,
    'window.SSD facade: StatusBar/SplashScreen, Preferences durability mirror, haptics, share. Fully no-op on web.',
  ],
  [
    'P3',
    'Redesign share paths: X / LINE / save-image as equal first-class actions',
    ['area:app'],
    false,
    'share.js; native filesystem+share behind isNative guards with web fallback.',
  ],
  [
    'P4',
    'Weekly scenarios: declarative goalConds + remote latest.json with bundled fallback',
    ['area:app', 'area:content'],
    false,
    'JSON-serializable goal conditions; first-clear notification opt-in; native-gated.',
  ],
  [
    'P5',
    'AWS delivery infrastructure: private S3 (OAC) + CloudFront via CDK (TypeScript)',
    ['area:infra'],
    false,
    'Long-TTL hashed assets, 5-min TTL for latest.json, 403/404 SPA fallback, cdk-nag.',
  ],
  [
    'P6',
    'Analytics groundwork: app_platform common property + weekly_fail event',
    ['area:app'],
    false,
    'Privacy-first wrapper; no-op until Plausible is enabled.',
  ],
  [
    'P7',
    'CI/CD with GitHub Actions + AWS OIDC (keyless deploy, least privilege)',
    ['area:infra'],
    false,
    'Trust policy pinned to repo:main; S3 sync + minimal CloudFront invalidation; GitHub Pages kept in parallel.',
  ],
  [
    'T1',
    'Playwright console-zero verification harness (scripts/verify.mjs)',
    ['area:testing'],
    false,
    'Runs the app with Chart.js working and blocked; asserts zero console/page errors across tabs, presets and sliders.',
  ],
  [
    'T2',
    'Researcher export: all parameters + metrics + repro URL as JSON/CSV',
    ['area:app'],
    false,
    'US-08. Every export field maps to an implementation formula (see DATA-DICTIONARY).',
  ],
  [
    'T3',
    'Share optimization: fixed hashtag + disaster-prep template variant for LINE',
    ['area:app', 'area:marketing'],
    false,
    '',
  ],
  [
    'T4',
    'Teacher one-pager web/classroom.html (prints to A4 PDF)',
    ['area:marketing'],
    false,
    'Self-contained page; white print layout while the app stays dark-terminal.',
  ],
  [
    'T5',
    '30-second vertical promo reel (promo/reel-30s.html)',
    ['area:marketing'],
    false,
    'Real UI copy transcribed; disclaimer footer pinned.',
  ],
  ['T6', 'Add advisory browser-verify job to CI', ['area:infra', 'area:testing'], false, ''],
  ['T7', 'Zenn article drafts: Capacitor port & CDK+OIDC without Docker', ['area:docs'], false, ''],
  [
    'T8',
    'Weekly scenarios W31–W34 (stock through late August)',
    ['area:content'],
    false,
    'W34 verified reachable against the real engine.',
  ],
  ['T9', 'X post template kit with fixed operating rules', ['area:marketing'], false, ''],
  [
    'T10',
    'English classroom guide (classroom.en.html) with cross-links',
    ['area:marketing'],
    false,
    '',
  ],
  [
    'T11',
    'UI feedback fixes: blink rate, mobile radar/log stacking, hexagon padding',
    ['area:app'],
    false,
    'Root cause of the mobile issue was an inline 1fr 1fr grid.',
  ],
  [
    'T12',
    'Weekly auto-rotation workflow (latest.json swap every Monday 0:00 JST)',
    ['area:infra'],
    false,
    'Out-of-stock weeks fail loudly as a restock reminder; triggers Pages/AWS deploys.',
  ],
  [
    'T13',
    'Second promo reel: history-themed safe variant',
    ['area:marketing'],
    false,
    '10-point QA against real engine copy.',
  ],
  [
    'T14',
    'English launch kit: Show HN / Product Hunt drafts behind phase-2 gates',
    ['area:docs', 'area:marketing'],
    false,
    '',
  ],
  ['T15', 'Weekly scenarios W35–W38 (stock through mid-September)', ['area:content'], false, ''],
  ['T16', 'English caption mode (?lang=en) for both reels', ['area:marketing'], false, ''],
  ['T17', 'OGP meta for classroom pages', ['area:marketing'], false, ''],
  [
    'T18',
    'Data dictionary: every export field mapped to its implementation formula',
    ['area:docs'],
    false,
    'Enables sensitivity analysis and model critique by researchers.',
  ],
  ['T19', 'User interview kit (15 min × 5 people)', ['area:docs'], false, ''],
  [
    'T20',
    'Weekly-scenario reachability tests — caught 2 real shipping bugs',
    ['area:testing'],
    false,
    'Two scenarios were already cleared at their start parameters; redesigned as recovery-type. Grid search against the real engine for PAGE 1.',
  ],
  [
    'T21',
    'Demo mode ?demo=1: ghost cursor drives the real engine (no faked values)',
    ['area:app'],
    false,
    'Complete no-op on normal startup.',
  ],
  [
    'T22',
    'README freshness + English data dictionary + researcher entry points',
    ['area:docs'],
    false,
    '',
  ],
  ['T23', 'App/Play store listing drafts with review Q&A', ['area:docs'], false, ''],
  ['T24', 'KPI weekly log + analytics enablement plan', ['area:docs'], false, ''],
  [
    'T25',
    'Automated reel recording pipeline (make reels)',
    ['area:marketing'],
    true,
    'Playwright records 5 reels to dist/reels/, mp4 via ffmpeg when available. Pilot task of the delegation protocol.',
  ],
  ['T26', 'Privacy policy ja/en (store submission requirement)', ['area:docs'], true, ''],
  ['T27', 'Store icon/splash generation (capacitor-assets input spec)', ['area:app'], false, ''],
  [
    'T28',
    'Delegation protocol: spec template + rules (main session reviews, verifies, commits)',
    ['area:docs'],
    false,
    'Subagents never commit; acceptance commands are always re-run by the parent session.',
  ],
  ['T29', 'Interview question sheet for Zenn article #3', ['area:docs'], false, ''],
  [
    'T30',
    'Weekly scenarios W39–W42 (stock through mid-October)',
    ['area:content'],
    true,
    'Numeric clearability traces reviewed against the real formulas by the parent session.',
  ],
  ['T31', 'DEVELOPMENT docs synchronized to current architecture', ['area:docs'], true, ''],
  [
    'T32',
    'Extend verify.mjs smoke scope: P2 shock, P3/P4 sliders, export generation',
    ['area:testing'],
    false,
    '',
  ],
  [
    'T33',
    'Pinned X post copy + delegation rules in AGENTS.md',
    ['area:marketing', 'area:docs'],
    false,
    '',
  ],
  [
    'T34',
    'Weekly W43–W46: PAGE 5 material teasers (silent-capture / loud-crash framing)',
    ['area:content'],
    true,
    'Sandbox denied file writes; the subagent delivered full designs + numeric traces, parent transcribed and verified.',
  ],
  [
    'T35',
    'In-app menu links to classroom & privacy pages (language-aware)',
    ['area:app'],
    false,
    '',
  ],
  [
    'T36',
    'Compress CLAUDE.md progress log into CHANGELOG/PROGRESS pointers',
    ['area:docs'],
    false,
    '',
  ],
  ['T37', 'CHANGELOG entry covering strategy sprints T1–T35', ['area:docs'], true, ''],
  [
    'T38',
    'Teacher projector slide decks ja/en (9 slides, self-contained, JS-optional)',
    ['area:marketing'],
    true,
    '',
  ],
  [
    'T39',
    'Weekly W47–W50: PAGE 5 teasers batch 2 (hope / audit themes)',
    ['area:content'],
    true,
    'Stock extended to the week of Dec 7.',
  ],
  [
    'T40',
    'Automated reachability tests for pages 2–4 (headless execution of extracted ui.js functions)',
    ['area:testing'],
    false,
    'Caught a start-instantly-cleared bug in W49 on first run; replaces manual numeric-trace review for delegated content.',
  ],
  [
    'T41',
    'X drafts for W43–W46 + failure-mode reaction comparison in the KPI log',
    ['area:marketing'],
    true,
    '',
  ],
  [
    'T42',
    'Weekly stock-level guard in the content validator (warns under 3 weeks)',
    ['area:testing'],
    false,
    '',
  ],
  [
    'T43',
    'Docs freshness (README/DEVELOPMENT) + educator outreach message templates ja/en',
    ['area:docs', 'area:marketing'],
    true,
    '',
  ],
  [
    'T44',
    'GitHub Issues portfolio backfill: Phase 1 + T1–T43 as English Issues/Milestones/Labels',
    ['area:docs'],
    false,
    'Idempotent make gh-project; from here on, sprints are tracked by opening an issue and writing "Closes #N".',
  ],
  [
    'T45',
    'README hero image (npm run gen:shot) + CI/Deploy/Weekly badges',
    ['area:docs', 'area:marketing'],
    false,
    'Playwright drives the real engine to the Weimar-collapse preset and screenshots the lit collapse banner; the shot fails if any console error occurs (self-verifying, no faked values).',
  ],
  [
    'T46',
    'ARCHITECTURE.en.md — English architecture doc (15-minute reviewer tour)',
    ['area:docs'],
    true,
    'System overview, the why behind 8 design decisions, content pipeline, quality gates, AI-assisted delivery governance, cost.',
  ],
  [
    'T47',
    'Secret-scan CI (gitleaks full git-history scan on every push/PR)',
    ['area:infra'],
    false,
    'Makes the one-off manual secret audit permanent; fetch-depth:0 scans the whole history.',
  ],
  [
    'T48',
    'Sync Zenn article drafts #1/#2 to the current architecture',
    ['area:docs'],
    true,
    'Article #2 rewritten from synth-only to the real production-live story, real values redacted, published:false kept.',
  ],
  [
    'T49',
    'cv-highlights.en.md — English CV bullets + STAR interview stories',
    ['area:docs'],
    true,
    'Fact-based: no uncounted user numbers; analytics not yet enabled is stated explicitly.',
  ],
  [
    'T50',
    'In-app PWA install path in the ≡ menu (beforeinstallprompt + iOS fallback)',
    ['area:app'],
    false,
    'Native prompt on supported browsers; per-OS instructions modal otherwise; auto-hidden in native/standalone. track: pwa_install_click/pwa_installed.',
  ],
  [
    'T51',
    'Automated offline-start verification (npm run verify:offline)',
    ['area:testing'],
    false,
    'A dependency-free tiny static server serves web/, registers the SW, goes offline, reloads, and asserts start-from-cache + tab navigation + zero console/pageerror — backing the PWA-offline claim with a test.',
  ],
  ['T52', 'CHANGELOG entry covering sprints T36–T49', ['area:docs'], true, ''],
  [
    'T53',
    'store-submission.md — iOS/Android submission runbook',
    ['area:docs'],
    true,
    'appId finalization → shared prep → iOS/Android → review defenses → post-submission; unverifiable steps flagged as "general procedure, confirm officially".',
  ],
  [
    'T54',
    'Weekly Lighthouse advisory audit workflow (lighthouse.yml)',
    ['area:infra', 'area:testing'],
    true,
    'Runs weekly (Mon 01:00 JST) + on demand against the live Pages URL; advisory only (never fails CI), reports saved as artifacts.',
  ],
  [
    'T55',
    'Accessibility pass: ARIA labels on all sliders, tabs, and modals (WAI-ARIA)',
    ['area:app'],
    false,
    'aria-labelledby on 11 sliders, role="tab"+aria-selected on 4 tabs, role="dialog" aria-modal on 11 modals. Visual appearance unchanged.',
  ],
  [
    'T56',
    'i18n completeness test: CI checks that every data-i18n / t() key exists in both dictionaries',
    ['area:testing'],
    true,
    'Covers data-i18n attributes, t("…") literals, and setVerdictBanner key args. Lookbehind regex prevents false positives on getContext("2d") etc. Zero missing keys on first run.',
  ],
  [
    'T57',
    'Self-host Chart.js 4.4.0 under web/vendor/ to eliminate the last external dependency',
    ['area:app'],
    false,
    'CDN reference removed; vendor file added to SW CORE cache (v6-363). Offline-complete from first visit. verify.mjs failure-case updated to block vendor path instead of CDN, incidentally making the success-case run against real Chart.js.',
  ],
  [
    'T58',
    'Portfolio freshness: backfill T44–T54, update ARCHITECTURE.en & cv-highlights',
    ['area:docs'],
    true,
    'Added 11 issues to backfill TASKS; milestone renamed to T25–T54; ARCHITECTURE.en §4 expanded with offline verification, PWA install path, Lighthouse, and gitleaks; 2 new CV bullets.',
  ],
  [
    'T59',
    'ARCHITECTURE.md — Japanese translation of the English architecture doc',
    ['area:docs'],
    true,
    'Faithful translation of ARCHITECTURE.en.md; terminology follows DEVELOPMENT.md conventions; README updated with a link.',
  ],
  [
    'T60',
    'Add Content Security Policy <meta> tag (script-src self+inline, object-src none)',
    ['area:app', 'area:infra'],
    false,
    'Converts the zero-external-dependency posture (T57) into a structural defence. connect-src: self+formspree+plausible. Verified compatible with file:// verify runs and all offline checks.',
  ],
  [
    'T61',
    'Operations runbook: 7-chapter incident response guide (operations-runbook.md)',
    ['area:docs'],
    true,
    'Chapters: weekly-rotate failure, Pages down, AWS down, SW cache incident + user message template, console errors (verify triage), git revert rollback (force-push forbidden), delegated agent recovery. P1–P3 priority matrix.',
  ],
  [
    'T62',
    'Add verify:offline step to CI advisory verify job',
    ['area:infra', 'area:testing'],
    false,
    'Elevates the offline-start guarantee to a change-validation gate; job remains advisory.',
  ],
  [
    'T63',
    'Automate teacher-guide PDF generation: make classroom-pdf (scripts/gen-classroom-pdf.mjs)',
    ['area:docs'],
    true,
    'Puppeteer + print CSS; generates dist/classroom.pdf and dist/classroom.en.pdf. Page count verified programmatically. Removes human TODO ☐6.',
  ],
  [
    'T64',
    'Zenn article #4 draft: AI delegation governance — 22 delegations, real numbers',
    ['area:docs'],
    true,
    'Documents the delegation protocol with real statistics (22 delegations, 27 tests). Three true stories: Write-denied fallback, session-limit recovery, W49 bug caught by CI. published:false.',
  ],
  [
    'T65',
    'Weekly scenarios W51–2027-W01: contrast pair "same fire, different outcome" (stock through Jan 2027)',
    ['area:content'],
    true,
    'ISO 53-week year handled autonomously by the subagent (2026-W53 → 2027-W01). Reachability CI green before delivery; full delegation cycle (delegate → CI → parent commit) first end-to-end success.',
  ],
  [
    'T66',
    'CHANGELOG entry covering sprints T50–T64',
    ['area:docs'],
    true,
    'First Sonnet-delegated task (all prior subagent work used Opus). Mechanical append-only task confirmed Sonnet is sufficient for CHANGELOG maintenance.',
  ],
  [
    'T67',
    'X post drafts for W47–2027-W01 (8 weeks) + KPI log hope-vs-audit comparison table',
    ['area:marketing'],
    true,
    'Announces the contrast-pair weekly scenarios in matching tone (quiet / loud). CI fix landed alongside: Node 22 upgrade + shell-glob expansion for node:test eliminates a latent Node-version incompatibility that Dependabot PRs exposed.',
  ],
  [
    'T68',
    'GitHub Issues portfolio backfill T55–T66 (total 73 issues, milestone renamed to T25–T66)',
    ['area:docs'],
    true,
    'Idempotent append to gh-project-backfill.mjs; milestone description updated; github-project.md count updated to 73.',
  ],
  [
    'T69',
    'Automated store-screenshot pipeline: make store-shots (6 screenshots, real engine)',
    ['area:marketing'],
    true,
    'Playwright drives the real engine through shock-survival, panic, etc.; each screenshot fails if any console error occurs (self-verifying, no faked values). Weekly-card shot replaced with P4 because the weekly feature is web-gated.',
  ],
  [
    'T70',
    'Announce-card pipeline: make announce-cards (4 images + post copy)',
    ['area:marketing'],
    true,
    'Cards: main announcement / iPhone 3-tap PWA install / Android+PC install / weekly teaser (card 4 gated until weekly feature is web-enabled). Post copy in docs/announce-post.md.',
  ],
  [
    'T71',
    'English announce-card variants (?lang=en, 8 cards total) + announce-post.en.md',
    ['area:marketing'],
    true,
    'All 4 cards regenerated with ?lang=en suffix; announce-post.en.md added for Show HN / international outreach.',
  ],
  [
    'T72',
    'Export-dictionary consistency test: CI checks all 38 buildExportData() fields against DATA-DICTIONARY',
    ['area:testing'],
    true,
    '38 fields verified present in docs/DATA-DICTIONARY.md and .en.md on every CI run. Zero missing fields on first run. Test count reached 30.',
  ],
  [
    'T73',
    'Extend verify smoke: ≡ menu open/close, PWA install modal, classroom/privacy nav links',
    ['area:testing'],
    true,
    'Recently added UI elements brought under the console-zero gate; window.open stubbed for link assertions.',
  ],
  [
    'T74',
    'Re-sync Zenn articles #1 and #2 (PWA completion, CSP, Node 20 latent bug story)',
    ['area:docs'],
    true,
    'Article #2 updated with three real incidents (vendor, CSP file:// check, Dependabot Node-version bug). published:false kept.',
  ],
  [
    'T75',
    'Freshen launch-en.md and store-listing.md (PWA/ARCHITECTURE.en/real bugs)',
    ['area:docs'],
    true,
    'launch-en.md expanded with PWA/CSP/Node-20 real stories; store-listing.md screenshot section updated to make store-shots.',
  ],
  [
    'T76',
    'AGENTS.md update: Opus vs Sonnet model split, sandbox realities, full-delegation cycle',
    ['area:docs'],
    true,
    'Clarifies which tasks go to Opus (creative) vs Sonnet (mechanical); documents Write-denied sandbox behaviour and the complete delegation cycle.',
  ],
  [
    'T77',
    'Portfolio freshness: GitHub Issues backfill to 77 (T67–T70), ARCHITECTURE.en + cv-highlights updates',
    ['area:docs'],
    true,
    'Added 4 issues to backfill TASKS; milestone description updated to T25–T70; github-project.md count updated to 77. Parent corrected 2 stale claims in ARCHITECTURE.en and AGENTS.md.',
  ],
  [
    'T78',
    'README ja/en: "Install as app (PWA)" section aligned with ≡ menu and announce cards',
    ['area:docs'],
    true,
    'iOS Safari / Chrome / Edge install steps added; references card2 from the announce-card pipeline.',
  ],
  [
    'T79',
    'METHODOLOGY audit: zero formula drift confirmed, 3 minor notation fixes',
    ['area:docs'],
    true,
    'Every formula, parameter definition, and goal condition in docs/METHODOLOGY.md cross-checked against engine.js and ui.js. Zero judgment-required items found.',
  ],
  [
    'T80',
    'DEVELOPMENT.md / .en.md brought up to date (vendor, CSP, 5 scripts, Node 22, auto-rotate)',
    ['area:docs'],
    true,
    'Parent review caught 1 version-number typo that the subagent missed.',
  ],
  [
    'T81',
    'CHANGELOG entry for T65–T78 + SECURITY.md vulnerability reporting policy',
    ['area:docs'],
    true,
    'SECURITY.md: responsible disclosure window, scope definition, response commitment. OSS hygiene for a public repo.',
  ],
  [
    'T82',
    'Auto-create ITIL work-order issue on weekly-rotate failure (idempotent, permanent)',
    ['area:infra'],
    true,
    'Appended failure hook to weekly-rotate.yml; gh issue create with symptom/triage/action/paste-prompt template. Deduplicated per week to avoid duplicates on repeated failures.',
  ],
  [
    'T83',
    'Freshness-watch test suite (tests/freshness.test.mjs) + make vendor-check',
    ['area:testing'],
    true,
    '4 fail assertions (sw/app version drift in DEVELOPMENT ja+en) and 2 warn checks (CHANGELOG/backfill T-number lag). Test count reached 36. First run caught Chart.js 4.5.1 upstream and 2 real backlog items.',
  ],
  [
    'T84',
    'Learnings ledger docs/learnings.md (IN-01–IN-09) + ratchet policy in CLAUDE.md',
    ['area:docs'],
    true,
    'Nine past incidents recorded in incident→root-cause→permanent-guard format. Ratchet policy: every bug earns one permanent guard. Ledger by Sonnet; policy line added by the parent session.',
  ],
  [
    'T85',
    'Upgrade Chart.js vendor from 4.4.0 to 4.5.1 + fix check-vendor regex for standard banner format',
    ['area:app'],
    false,
    'make vendor-check (T83) detected Chart.js 4.5.1 on its first run. Side discovery: check-vendor.sh regex only matched the jsdelivr wrapper form and silently failed on the standard banner — fixed to support both forms. "Fail loudly rather than silently pass" design caught the bug.',
  ],
  [
    'T86',
    'Freshness-warn resolution batch: CHANGELOG T79–T84 entry + backfill T71–T84 (91 issues total)',
    ['area:docs'],
    true,
    'First sprint driven by machine-generated warnings (freshness.test.mjs warn × 2). Milestone renamed to T25–T84. Acceptance gated on warn count reaching zero.',
  ],
  [
    'T87',
    'Student worksheet web/worksheet.html + .en.html — education kit now complete (guide / slides / worksheet)',
    ['area:marketing'],
    true,
    'Exploration template (predict→experiment→observe→reflect). A4 white layout with write-in lines; PDF verified by page-count assertion. Parent review detected ja guide overflow from 1 page to 2 — root cause: ja was already a perfectly full single page, so no body-text additions are possible; langlink used for cross-references instead.',
  ],
  [
    'T88',
    'verify:pages CI check: console-zero + structure validation for all static pages',
    ['area:testing'],
    true,
    'scripts/verify-pages.mjs covers classroom/slides/privacy/announce-cards/worksheet in both ja and en. Added to the CI advisory verify job. Eliminates the last unverified surface.',
  ],
  [
    'T89',
    'web/404.html — dark-terminal 404 page auto-adopted by GitHub Pages',
    ['area:app'],
    true,
    'Bilingual (ja/en), relative links, dark-terminal style consistent with the app. Runbook updated with a note on the SW relationship (404.html shows before SW registration; after registration the SW handles SPA fallback).',
  ],
  [
    'T90',
    'FAQ page ja/en (browser / PWA / store-app) + web-vs-app comparison card',
    ['area:docs'],
    true,
    'web/faq.html + .en.html give an honest 3-mode comparison (browser now / installable PWA now / native store app "coming soon") covering data storage, offline, cost and research use — with zero mention of the still-gated weekly scenarios. Announce card5 "same core, just pick how you launch it" (ja/en) brings the announce set to 10 images. verify-pages.mjs extended to cover faq (console-zero + @media print + langlink) and 404. Direct work by parent: FAQ header-menu entry (openAppPage), sw cache v6-366, DEVELOPMENT footer sync.',
  ],
  [
    'T91',
    'Ledger batch: CHANGELOG T85–T89 entry + backfill to 96 issues + learnings IN-10/11',
    ['area:docs'],
    true,
    'Freshness-warn resolution batch. Milestone renamed to T25–T89. learnings.md gained IN-10 (ja classroom.html A4 overflow) and IN-11 (check-vendor version regex only matched the jsdelivr wrapper form). Acceptance gated on warn count reaching zero.',
  ],
  [
    'T92',
    'verify.mjs mobile pass (390×844) — 4-pass smoke (Chart-ok/fail × desktop/mobile)',
    ['area:testing'],
    true,
    'Adds a mobile viewport (390×844, isMobile/hasTouch) so the primary phone form factor is verified. Single browser launch, context-per-pass isolation, identical smoke across all four passes — no branching. Closes the last untested surface for mobile users.',
  ],
  [
    'T93',
    'Restock weekly scenarios 2027-W02 to 2027-W05',
    ['area:content'],
    true,
    'Adds 4 weekly scenarios extending inventory from 2027-W01 to 2027-W05 (30 weeks). PAGE 5 teaser vol.4 — unified audit-type theme "the same shock only breaks the town whose conditions were already open", one scenario per PAGE 1-4. Reachability CI green; parent reviewed ethics/i18n. Same commit also added dependabot-auto-rebase.yml (permanent automation of the manual rebase chore).',
  ],
];

// ── 実行 ─────────────────────────────────────────────────────
if (DRY) {
  for (const [id, title, areas, delegated] of TASKS)
    console.log(`[${msOf(id)}] ${title} ${areas.join(',')}${delegated ? ' +ai-subagent' : ''}`);
  process.exit(0);
}

console.log('1/4 ラベル作成...');
for (const [name, color, desc] of LABELS)
  gh(['label', 'create', name, '--color', color, '--description', desc, '--force']);

console.log('2/4 マイルストーン作成...');
const existingMs = JSON.parse(gh(['api', `repos/${repo}/milestones?state=all&per_page=100`]));
for (const m of MILESTONES) {
  if (!existingMs.some((e) => e.title === m.title)) {
    gh([
      'api',
      '-X',
      'POST',
      `repos/${repo}/milestones`,
      '-f',
      `title=${m.title}`,
      '-f',
      `description=${m.description}`,
    ]);
    console.log(`  + ${m.title}`);
  }
}

console.log('3/4 issue 作成（既存タイトルはスキップ）...');
const existing = new Set(
  JSON.parse(gh(['issue', 'list', '--state', 'all', '--limit', '500', '--json', 'title'])).map(
    (i) => i.title
  )
);
let created = 0;
for (const [id, title, areas, delegated, note] of TASKS) {
  if (existing.has(title)) continue;
  const labels = delegated ? [...areas, 'process:ai-subagent'] : areas;
  const body = [
    note,
    delegated
      ? '_Implemented by an AI subagent under a written task spec; reviewed, verified (`npm run check` / `make verify`) and committed by the maintainer._'
      : '',
    `_Backfilled from the in-repo task log (${id}). Full history: PROGRESS.md / CHANGELOG.md._`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const url = gh([
    'issue',
    'create',
    '--title',
    title,
    '--body',
    body,
    '--milestone',
    msOf(id),
    ...labels.flatMap((l) => ['--label', l]),
  ]).trim();
  gh(['issue', 'close', url, '--reason', 'completed']);
  created++;
  console.log(`  ✓ ${id} ${title}`);
}

console.log('4/4 マイルストーンをクローズ...');
const msAll = JSON.parse(gh(['api', `repos/${repo}/milestones?state=all&per_page=100`]));
for (const m of msAll)
  if (MILESTONES.some((x) => x.title === m.title) && m.state === 'open' && m.open_issues === 0)
    gh(['api', '-X', 'PATCH', `repos/${repo}/milestones/${m.number}`, '-f', 'state=closed']);

console.log(
  `\n✅ 完了: issue ${created} 件を新規作成（既存 ${TASKS.length - created} 件はスキップ）。`
);
console.log(
  '   以後のスプリントは docs/github-project.md の運用（起票→Closes #N）で継続してください。'
);
