# Data Dictionary — every field in the 📊 export (JSON/CSV)

> Definitions for the data produced by ≡ menu → "📊 Export data (JSON/CSV)".
> Intended for research, teaching and reports. **Every formula is transcribed from the
> implementation** (`web/js/engine.js` / `web/js/ui.js`) and matches the in-app "(?)" modals.
> Unless noted, values are clamped to 0–100. The models are deliberately simplified toy
> models for building intuition — not forecasting tools.

## Top level

| Key | Meaning |
|---|---|
| `app` / `schema` | Fixed `social-system-debugger` / export format version (currently 1) |
| `exported_at` | Export timestamp (ISO 8601, UTC) |
| `lang` | UI language at export time (ja/en) |
| `town_name` | The user's nickname for their town (null if unset; an arbitrary label, not personal data) |
| `share_url` | **Opening this URL restores all parameters and reproduces the exact run** (the reproducibility anchor) |
| `params.*` | Input parameters below (exactly what the user set) |
| `metrics.*` | Derived metrics below (computed deterministically from parameters; P1/P2 only — P3/P4 run dynamic simulations and are omitted) |

## params — input parameters

| Path | Range | Meaning |
|---|---|---|
| `p1_information.filterRate` | 0–100 | Information filter rate (echo-chamber level) |
| `p1_information.ethicsScore` | 0–100 | Leader's ethics (decision fairness) |
| `p1_information.algo` | greedy / dp | Governance algorithm: greedy = short-term reward maximization, dp = long-term optimization |
| `p1_information.historicalImmunity` | 0–100 | Historical immunity (how much past failures are consulted) |
| `p2_infrastructure.shrinkRate` | 0–100 | Smart-shrink rate (planned consolidation of infrastructure) |
| `p2_infrastructure.dxRate` | 0–100 | DX investment (skill-transfer investment; the recovery source of successor stock) |
| `p2_infrastructure.ethicsP2` / `algoP2` | as above | PAGE 2 governance ethics / algorithm |
| `p2_infrastructure.publicReboot` | bool | Public reboot (re-municipalization: suspends market logic, prioritizes public service) |
| `p2_infrastructure.rootRestricted` | bool | Root restriction (multi-approval blocks a leader's unilateral destructive ops) |
| `p2_infrastructure.skillStock` | 0–100 | Successor stock (slow state variable; gates brand strength) |
| `p3_cognition.searchDepth` | 1–10 | Search depth (how deeply one reasons before judging) |
| `p3_cognition.groundingRate` | 0–100 | Grounding rate (offline contact with reality) |
| `p3_cognition.learningRate` | 0–100 | Learning rate (intake speed of new information; too high and poison is learned fast too) |
| `p4_stakeholder.extTraffic` | 0–100 | Outside traffic (inflow of non-stakeholder spectators) |
| `p4_stakeholder.gamification` | 0–100 | Gamification score (how far debate has turned into entertainment) |

## metrics.p1_information — PAGE 1 derived metrics

Implementation: `engine.js metrics(fr, es, al)`, with `f = filterRate/100`, `e = ethicsScore/100`, `gp = (algo==='greedy' ? 0.38 : 0)`.

| Key | Formula (clamped 0–100) | Reading |
|---|---|---|
| `entropy` | `f*42 + (1-e)*38 + gp*20` | Disorder. **Crash condition above 76** |
| `paranoia` | `f*48 + (1-e)*33 + gp*14` | Accumulated cognitive bias / persecution thinking |
| `socialCap` | `100 - f*30 - (1-e)*42 - gp*28` | Social capital (accumulated mutual trust) |
| `dopamine` | greedy: `52 + (1-e*0.4)*35` / dp: `30 + e*38` | Dopamine index (dependence on instant reward) |
| `infra` | `100 - (1-e)*52 - f*20 - gp*28` | Infrastructure capacity |
| `diversity` | `100 - f*82` | Diversity index (the filter's direct casualty) |
| `trust` | `e*80 + (1-f)*20` | Trust index |
| `resilience` | `e*52 + (1-f)*48 - gp*30` | Resilience |
| `legitimacy` | `e*92 + (1-f)*8` | Legitimacy (almost entirely ethics-driven — broken in a moment, rebuilt only through ethics) |
| `infoH` | `(1-f)*90 + e*10` | Information health |
| `viability` | `e*62 + (1-f)*38 - gp*42` | Long-term viability (greedy's largest hidden cost) |
| `mentalWB` | `100 - paranoia*0.92` | Mental well-being |
| `crash` | `entropy>76 or (infra<18 and socialCap<18)` | Collapse flag (bool) |

## metrics.p2_infrastructure — PAGE 2 derived metrics

Implementation: `ui.js metricsP2(s, d, al, e)`, with `sf=s/100`, `df=d/100`, `ef=e/100`, `isG=(algo==='greedy')`.
PAGE 2 carries the causal chain **brand → tax base → maintenance budget → infrastructure → rescue heli**, plus the slow state variable `skillStock`.

| Key | Definition (summary; see code for full formulas) | Reading |
|---|---|---|
| `redundancy` | `calcRedundancyBuffer(s, al, publicReboot)` | Redundancy buffer. **On shock: <30% instant collapse / ≥60% survival** |
| `infra` | Base `100-(1-sf)*35·D-(1-df)*15-(isG?(1-ef)*28:6)·D` (D=0.5 under reboot), adjusted by repair, budget shortfall and shocks | Infrastructure capacity; <65 raises infraError |
| `deadlock` | `!rootRestricted && ef<0.4 && isG && infraError` | **Blame deadlock**: admin CPU flips to 100% blame, infrastructure decays 3× faster |
| `cpuBlame` / `cpuRepair` | 100/0 under deadlock; otherwise `cpuBlame=(1-ef)*22+(isG?14:0)`, `cpuRepair=100-cpuBlame` | Admin CPU split between blame-avoidance and repair |
| `skillStock` | Slow state variable (recovers with DX investment, depletes when neglected; `p2SkillFactor` cliff: full at ≥30, steep drop below 12) | Successor stock — the gate on brand |
| `brand` | `(45+sf*16+(isG?-12:12)+ef*8) × p2SkillFactor(skillStock)` | Brand industry = the region's tax base |
| `budget` | `42 + brand*0.55 - (isG?(1-ef)*30:6) - (1-sf)*10 - reboot cost 16 - …`, minus shock penalties | Municipal budget. **Crash condition below 8** |
| `heliOp` | false on shock collapse; true under reboot; otherwise `infra>35 && cpuRepair>25 && ef>=0.3` | Rescue heli operating (OPERATIONAL vs. not, of the 3 states) |
| `infraError` / `crash` | `infra<65` / `(!heliOp && infra<20) or budget<8 or shock collapse` | Warning flag / collapse flag |

## Usage patterns

- **Sensitivity analysis**: freeze a state via `share_url` → change one parameter → re-export → diff the CSVs (e.g. sweep ethicsScore in steps of 10 and measure the legitimacy response; the formulas are linear, so it should match hand calculation — if it doesn't, that's a bug report we welcome).
- **Class reports**: hypothesis → experiment → export → chart in a spreadsheet (the 50-minute lesson format in `web/classroom.en.html`).
- **Model critique**: challenges to the formulas go to GitHub Issues. Critiques of the form "this weighting is inconsistent with real-world ◯◯" are the most useful kind.
