# CV Highlights — Social Debugger (EN)

> Résumé bullets, LinkedIn phrasing, and STAR interview stories distilled from this
> repository, for a cloud-engineering job search in New Zealand.
>
> **Facts only.** Every claim here is backed by a file in this repo (see
> [Links to evidence](#links-to-evidence)). No user-count or traffic numbers are
> claimed — privacy-first analytics is wired but intentionally not enabled yet
> (`track()` is a no-op; see `docs/kpi-log.md`). AWS account IDs and any real
> place/person names are deliberately omitted. Add a bullet here whenever a new
> milestone lands.

---

## 1. One-line project pitch

Pick one for the "Projects" section of a CV; all three are true.

- **Social Debugger** — a browser-based educational simulator of how societies and
  local infrastructure fail under parameter stress; solo-built, non-commercial,
  shipped to production on AWS (S3 + CloudFront/OAC) with keyless OIDC CI/CD.
- **Social Debugger** — an interactive Canvas/Chart.js simulator deployed as a PWA
  to both GitHub Pages and AWS CloudFront, backed by a console-zero browser test
  gate and a content-reachability CI that caught real bugs before release.
- **Social Debugger** — a solo full-cycle project (frontend, IaC, CI/CD, content
  ops) where infrastructure is defined in TypeScript CDK and content ships weekly
  through an automated rotation pipeline.

---

## 2. CV bullets

Action-verb first, one line each. Group by theme; drop the headers on a real CV.

### Cloud / Infrastructure

- Provisioned a static-hosting stack in **AWS CDK (TypeScript)** — S3 (private,
  BlockPublicAccess ALL, SSE, enforceSSL) fronted by **CloudFront with Origin
  Access Control (OAC)** — and deployed it live to `ap-northeast-1`.
- Designed **two CloudFront cache policies**: long-TTL for immutable assets and a
  5-minute TTL for the weekly `latest.json` pointer, so content swaps propagate
  fast without over-invalidating.
- Kept the workload on **serverless static delivery with no long-running process**,
  and documented in `infra/README.md` why Docker was deliberately not used (no
  resident process to containerize).
- Ran the stack within the **AWS free tier (~$0/month)** at the current scale, and
  limited CloudFront invalidations to `latest.json` and `index.html` only to stay
  inside the free invalidation quota.
- Hardened the IaC with **cdk-nag (AWS Solutions ruleset)**, resolving or
  documenting suppressions with justifications.

### CI/CD & Quality

- Built a **keyless deploy pipeline** using **GitHub OIDC → a least-privilege IAM
  role** (scoped to S3 sync + a single CloudFront `CreateInvalidation`; no
  long-lived AWS keys, `cdk deploy` intentionally excluded from the role).
- Authored a **console-zero browser gate** in Playwright (`scripts/verify.mjs`)
  that drives all four app tabs, presets, sliders, shock injection, and export,
  asserting zero `pageerror`/`console.error` in both a Chart.js-healthy and a
  CDN-blocked (graceful-degradation) case.
- Wrote **content-reachability tests** that treat scenario content as testable
  code — grid-searching the real engine for "goal is reachable and not already
  met at start" — which **caught 3 real pre-release bugs** (2 via `weekly-reachability.test.mjs`, 1 via the PAGE 2–4 variant).
- Unified local and CI checks so **`npm run check` = unit tests + weekly-JSON
  schema validation + eslint + prettier**, and made the CI web job run the same
  `npm ci && npm run check` — plus a **pre-commit hook** running the identical
  check (local = CI parity).
- Configured **branch protection** (`scripts/setup-branch-protection.sh`) requiring
  PRs and passing CI, with CodeQL kept advisory.
- Wrote an **automated offline-start verification harness** (`npm run verify:offline`)
  that stands up a dependency-free static server, registers the service worker, cuts the
  network, and asserts the PWA still starts from cache with zero console/pageerror —
  turning the "works offline" claim into a test.
- Added **continuous advisory monitoring**: a weekly **Lighthouse** audit
  (`lighthouse.yml`, PWA/perf/a11y, non-blocking) and a **gitleaks** full-git-history
  secret scan on every push/PR — making a one-off manual audit a permanent CI gate.

### Automation & Ops

- Automated **weekly content rotation** (`weekly-rotate.yml`): a scheduled job
  computes the ISO week, promotes that week's JSON to `latest.json`, commits, and
  triggers the Pages/AWS deploys — with a **stock-depletion guard** that fails
  loudly when the content runway runs low.
- Added **session-handoff hooks** that warn on uncommitted/unpushed work and
  iCloud competing-copies, plus a `make handoff` pre-exit check, to keep a
  solo repo consistent across machines.
- Provided a single operator entry point via a **`Makefile` (`make help`)** and a
  **devcontainer** (Node 20 + gh + aws-cli) for reproducible setup on any machine.

### AI-assisted engineering

- Established a **spec-driven delegation protocol**: self-contained tasks are
  delegated to AI subagents against a written spec (`docs/task-spec-template.md`),
  while a senior session retains **spec authoring, review, verification, and commit
  authority** — subagents are commit-forbidden.
- Made verification non-negotiable by **re-running acceptance commands
  (`npm run check`, `make verify`) on the reviewer side** rather than trusting a
  subagent's self-reported green, and defined a **fallback** for when the sandbox
  blocks writes (deliver design + verification trace; reviewer transcribes).

---

## 3. STAR interview stories

### (a) Keyless deploy with a least-privilege role

- **Situation.** The project deploys from GitHub Actions to AWS S3 + CloudFront.
  Long-lived AWS access keys in CI are a standing credential-leak risk.
- **Task.** Deploy from CI with no static secrets and the narrowest possible IAM
  permissions.
- **Action.** I defined a **GitHub OIDC identity provider and a deploy role in
  CDK**, with a trust policy limited to this repo on the `main` branch and a
  permission set of only S3 List/Get/Put/Delete plus a single CloudFront
  `CreateInvalidation`. I deliberately left `cdk deploy` out of the role — infra
  changes stay a human-run step. A snag: an **OIDC provider for GitHub already
  existed in the account**, and CDK tried to create a duplicate; I passed the
  existing provider ARN via context so the stack reused it instead of failing.
- **Result.** CI deploys with **zero long-lived AWS keys**; a leaked token can only
  sync one bucket and invalidate two paths. The pipeline runs on `main` only, and
  GitHub Pages continues in parallel so the public URL never changes.

### (b) Testing content in CI — reachability tests that caught real bugs

- **Situation.** The app ships a new "weekly scenario" (start parameters + a goal)
  as JSON. A goal that is unreachable, or already satisfied at start, is a silent
  content bug: nobody notices until a user is stuck or the scenario "clears"
  instantly.
- **Task.** Prevent broken scenarios from reaching production without hand-checking
  every one.
- **Action.** I wrote reachability tests that (1) assert every goal `metric` name
  actually exists in that page's evaluation context (a typo = permanently
  unclearable), and (2) for PAGE 1, **grid-search the real engine** to confirm the
  goal is reachable and not met by the starting parameters. A later variant did
  the same for PAGE 2–4 by extracting the live UI functions and running them
  headless.
- **Result.** The suite **caught 3 real bugs before release** — on introduction it
  found two scenarios (plus bundled ones) that were already cleared at start (T20),
  and the PAGE 2–4 variant immediately caught a third instant-clear case (T40). I
  fixed them into "recover-from-degraded-state" designs. After that, per-scenario
  numeric traces no longer needed manual review — CI guarantees it.

### (c) Byte-for-byte, zero-downtime split of a 330k-character single HTML file

- **Situation.** The whole app lived in one ~330,000-character `index.html`.
  It worked, but was unmaintainable and impossible to unit-test.
- **Task.** Split it into modules (CSS + i18n/engine/ui JS) **without changing any
  behavior or the public URL**.
- **Action.** I split mechanically into `web/` — markup + `css/app.css` +
  `js/{i18n,engine,ui}.js` — keeping them as **classic scripts sharing global
  scope**, so concatenating the modules reproduced the original **byte-for-byte**.
  I isolated `engine.js` to be **DOM/window-independent** (reusable for tests and a
  future server) and moved exactly one flag between files. The Pages workflow was
  repointed at `web/` so the deployed URL stayed identical.
- **Result.** Same runtime behavior with a testable, reviewable codebase; the
  engine now backs the reachability tests above. Later share/scenario modules were
  carved out the same way.

### (d) Governing AI-subagent delegation

- **Situation.** I use AI subagents to move faster solo, but unreviewed AI output
  is a regression risk — and this codebase has a strict "don't change the look,
  don't break i18n" constraint.
- **Task.** Get leverage from delegation while keeping a human in control of
  quality and history.
- **Action.** I formalized a protocol: subagents take **self-contained tasks
  against a written spec** and are **commit-forbidden**; the senior session owns
  review, verification, and commits. Two hard-won rules became policy —
  **acceptance commands are re-run on the reviewer side** (never trust
  self-reported green), and when the sandbox **blocks file writes**, the subagent
  delivers a design + verification trace that the reviewer transcribes.
- **Result.** Delegated work lands only after the reviewer re-runs `npm run check`
  and `make verify` green. The whole history is visible as English GitHub Issues,
  with a `process:ai-subagent` label marking delegated tasks (see
  `docs/github-project.md`).

---

## 4. Likely interview questions & answers

- **Why no Docker?** The workload is static delivery + serverless — there's no
  long-running process to containerize. Docker would only add image management,
  patching, and cost. I'd reach for containers (e.g. Fargate) only when a resident
  process appears; even the planned Phase 2 features fit API Gateway + Lambda +
  DynamoDB.
- **Why run GitHub Pages and CloudFront in parallel?** Pages was the original,
  stable public URL; adding CloudFront gave a production AWS story (edge caching,
  HTTPS, OAC) without ever changing the URL users and links depend on. The two
  deploy paths are independent, so one can't break the other.
- **How did you assure quality as a solo developer?** Three layers: a console-zero
  Playwright gate for the browser, content-reachability tests that treat scenarios
  as code, and a single `npm run check` enforced identically by a pre-commit hook,
  CI, and branch protection — so local, commit, and CI can't diverge.
- **Why OIDC instead of AWS access keys in CI?** No long-lived secret to leak or
  rotate. Actions assumes a role scoped to this repo's `main` branch, and the role
  can do only S3 sync + one CloudFront invalidation — least privilege by design.
- **How do you keep weekly content shipping without manual toil?** A scheduled
  Action computes the ISO week, promotes that week's JSON to `latest.json`, and
  triggers deploys; schema validation and reachability tests gate the content, and
  a stock guard warns before the runway runs out.

---

## 5. Links to evidence

Relative paths within this repo.

- **AWS / IaC:** `infra/README.md`, `infra/lib/social-debugger-stack.ts`
- **Keyless deploy (OIDC + least privilege):** `.github/workflows/deploy-aws.yml`,
  OIDC provider + deploy role in `infra/lib/`
- **CI / checks:** `.github/workflows/ci.yml`, `package.json` (`check` script),
  `.githooks/`, `scripts/setup-branch-protection.sh`
- **Console-zero browser gate:** `scripts/verify.mjs`
- **Content-reachability tests:** `tests/weekly-reachability.test.mjs`,
  `tests/weekly-reachability-p234.test.mjs`
- **Weekly rotation & stock guard:** `.github/workflows/weekly-rotate.yml`,
  `scripts/validate-weekly.mjs`
- **Module split (byte-for-byte):** `web/js/engine.js`, `web/js/ui.js`,
  `docs/DEVELOPMENT.md`, `docs/articles/zenn-01-capacitor.md`
- **AI-subagent governance:** `AGENTS.md`, `docs/task-spec-template.md`,
  `docs/github-project.md` (`process:ai-subagent` label)
- **Analytics status (why no user numbers here):** `docs/kpi-log.md`
- **Operator entry point:** `Makefile` (`make help`), `docs/session-handoff.md`
- **Full history:** `CHANGELOG.md`, `PROGRESS.md`; English portfolio view via
  `make gh-project` (`docs/github-project.md`)
