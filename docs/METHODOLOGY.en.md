# Methodology

> **[日本語](METHODOLOGY.md) | [English](METHODOLOGY.en.md)** (this page)
>
> A technical reference gathering **every formula, threshold, and assumption** used in the "Social System Debugger". It mirrors the source (`index.html`) in a readable form.

---

## ⚠ Read this first (the most important part)

This model is a **qualitative "thought experiment."** To be explicit:

- **It is not empirically calibrated.** Every coefficient (e.g. `f*42`, `sf*52`) is a **hand-tuned illustrative value** chosen to make a trend legible — not a statistically estimated parameter.
- **It is not a predictor.** The output numbers (entropy 87, infrastructure 12, …) have **no absolute meaning**; the goal is to **visualize relationships** ("strengthen this design and this metric moves this way").
- **It makes no causal claims.** It maps concepts from systems engineering and machine learning onto social phenomena as a **metaphor**, not a proof of real-world causation.
- **It is not about any specific person or political side.** It is educational material about "structures any society can fall into" (the same note appears in the app's share text).

**Critically examining the model's assumptions is itself the learning task of this tool.**

---

## Overall design

Society is treated as **one distributed system (an "OS")** composed of four layers. Each layer follows "user parameters → formula → metrics → verdict (danger / caution / healthy)."

| Layer | Name | Central theme | Main metaphor |
|---|---|---|---|
| **L1** | Information Space | echo chamber / overfitting | overfitting, mode collapse |
| **L2** | Regional Infrastructure | efficiency vs. redundancy, blame-shift deadlock | redundancy, deadlock |
| **L3** | Individual Cognition | poisoning attack, halted belief updates | search depth, learning rate (gradient) |
| **L4** | Stakeholder Asymmetry | genuine voices drowned by outsider noise | sybil attack, objective hijack |

> **What is "SECTOR-T"?** It is the **fictional, anonymous codename for the depopulating regional city simulated on Page 2 (L2)** — deliberately generic (not a real place), consistent with the app's "not about anyone specific" stance.

`clamp(x, 0, 100)` means "clamp to 0–100" (used throughout).

---

## L1 — Information Space (`metrics(fr, es, al)`)

**Parameters**
- `f = filterRate/100` … information-filtering rate (echo-chamber level)
- `e = ethicsScore/100` … leader's ethics (1 = rule of law, 0 = populism)
- `isG` … whether the decision algorithm is Greedy (true/false)
- `gp = isG ? 0.38 : 0` … Greedy penalty coefficient

**Key metrics (excerpt, matching the source)**

```
entropy    = clamp(f*42 + (1-e)*38 + gp*20)      // disorder
paranoia   = clamp(f*48 + (1-e)*33 + gp*14)
socialCap  = clamp(100 - f*30 - (1-e)*42 - gp*28) // social capital
infra      = clamp(100 - (1-e)*52 - f*20 - gp*28)
diversity  = clamp(100 - f*82)                    // information diversity
infoH      = clamp((1-f)*90 + e*10)               // information health
trust      = clamp(e*80 + (1-f)*20)
resilience = clamp(e*52 + (1-f)*48 - gp*30)
legitimacy = clamp(e*92 + (1-f)*8)
viability  = clamp(e*62 + (1-f)*38 - gp*42)
mentalWB   = clamp(100 - paranoia*0.92)
dopamine   = isG ? clamp(52 + (1-e*0.4)*35) : clamp(30 + e*38)
```

**Collapse condition**
```
crash = entropy > 76  ||  (infra < 18 && socialCap < 18)
```

**Reading it**: raising the filtering rate `f` monotonically lowers diversity and information health (`diversity = 100 - f*82`) and raises entropy. Ethics `e` lifts the overall health. Greedy adds the penalty `gp` in several places.

---

## L2 — Regional Infrastructure (`metricsP2(s, d, al, e)` / `calcRedundancyBuffer`)

**Parameters**
- `sf = shrinkRate/100` … infrastructure consolidation (smart shrink)
- `df = dxRate/100` … industry DX / incorporation investment
- `ef = ethicsP2/100` … administrator ethics
- `isG` … whether the budget strategy is Greedy
- `reboot = publicReboot` … Public Reboot (re-municipalization) on/off
- `dampener = reboot ? 0.5 : 1.0`
- `skillStock` (0–100) … **successor stock** (reserve of tacit knowledge). Added in v6.346; the page's only **slow state variable**

**Successor stock (skillStock — slow state variable / v6.346)**
Evolves at 1.2 s/tick, only while Page 2 is visible.
```
reboot        → restores skillStock to ≥ 60 (clears skillLost)
df < 0.25     → skillStock -= (0.25-df)*15   // aging artisans retire (DX0 ≈ cliff in ~12 ticks) → at 0, skills go extinct (skillLost)
df > 0.45     → skillStock += (df-0.45)*8     // serialization (formalizing skills) slowly recovers it
0.25–0.45     → equilibrium band (default DX30 sits here → no decay)
skillLost (after hitting 0) won't recover even at max DX; only Public Reboot revives it
```

**Redundancy Buffer**
```
base = clamp(100 - sf*52 - (isG ? 32 : 0))
redundancy = reboot ? clamp(base + 42) : base
```

**Causal chain: brand → tax base → maintenance → infra → heli (v6.346)**
```
skillFactor = ss>=30 ? 1 : ss>=12 ? 0.55+(ss-12)/40 : (ss/12)*0.55        // cliff function (calm for a while, then sudden drop)
brand  = clamp((45 + sf*16 + (isG?-12:12) + ef*8) * skillFactor)          // output is sustained by the successor stock
budget = clamp(42 + brand*0.55 - (isG?(1-ef)*30:6) - (1-sf)*10 - (reboot?16:0) - (root?5:0))  // brand = tax base
budgetShortfall = budget < 45 ? (45-budget)*1.2 : 0                       // a thin budget starves maintenance

infraBase = clamp(100 - (1-sf)*35*dampener - (1-df)*15 - (isG?(1-ef)*28:6)*dampener)
deadlock  = (!rootRestricted) && ef < 0.4 && isG && (infraBase < 65)      // blame-shift deadlock
infra     = deadlock ? clamp(infraBase - 42) : clamp(infraBase + (cpuRepair/100)*14 - budgetShortfall)
```

**Rescue helicopter (3 states / v6.346)**
```
heliOp (structural) = reboot ? true : (infra > 35 && cpuRepair > 25 && ef >= 0.3)
state = during a shock, within the hold window (~3.6 s) → WEATHER HOLD (orange, VFR grounding, auto-returns)
        otherwise heliOp → OPERATIONAL (green) / !heliOp → SUSPENDED (red)
crash = (!heliOp && infra < 20) || budget < 8 || <shock crash>
```
On entering SUSPENDED the operations log streams, one line at a time: `BRAND_REVENUE↓ → TAX_BASE↓ → MAINT_BUDGET↓ → INFRA<35% → HELI:SUSPENDED` (and the recovery chain on return).

**System-shock injection**: a three-way branch on the Redundancy Buffer — **instant collapse below 30%**, **survival at ≥ 60%**, partial damage in between (`shockState`).

**Reading it**: the successor stock is the slow variable that keeps things **calm even as you cut DX — until it runs out, when the brand falls off a cliff** (the very lesson of Greedy = efficiency now vs. DP = investing in the future). The collapse always propagates through the hierarchy **brand → tax base → maintenance → infra → heli** — preserving the honest point that the rescue helicopter is a wide-area system, never wired directly to one town's industry. Below 35% infra it goes SUSPENDED. Maximizing consolidation `sf` erodes redundancy and leaves the town fragile. `deadlock` fires under "low ethics × Greedy × infra trouble," sending 100% of admin CPU into blame-shifting. `heliOp` is also **directly blocked by low ethics** (`ef < 0.3`). `reboot` (re-municipalization) restores resilience (+42 redundancy, halved decay, revived successor stock).

---

## L3 — Individual Cognition (node simulation + `updateP3Monitor`)

**Parameters**
- `depth = searchDepth` (1–10) … search depth of reasoning
- `g = grounding/100` … grounding rate (SNS fasting / primary sources)
- `lr = learningRate/100` … learning rate (willingness to self-correct). `stub = 1 - lr` (stubbornness)

**Gullibility & contamination over time (agents)**
```
fool = depth<=3 ? 1 : depth>=7 ? 0 : (7-depth)/4     // shallow depth = easily fooled
each node's contamination n.c += rise - fall
  rise = fool * 0.011 * (1 - g*0.75)
  fall = ( (1-fool)*0.012 + g*0.010 + <dropout> ) * lr   // ← learning rate 0 → zero recovery
integrity = round(clamp(100 - avgC*100))              // avgC = mean contamination
```

**Recovery timeline (prediction)**
```
integ = round(clamp(95 - 78*fool*(1 - g*0.6) - stub*42))
```

**Banner verdicts (since v6.338 — decided instantly from parameters)**
```
Frozen (red, "won't update") : lr < 0.10
Poisoning (red)              : depth <= 3
Healthy (green)              : depth >= 7 && lr >= 0.30
Caution (orange)             : otherwise
```

**Reading it**: because the recovery term `fall` is **proportional to the learning rate `lr`**, `lr = 0` ("won't update") means **no fact can wash out the contamination** (the trap of thinking deeply but never updating). Only deep search (`depth ≥ 7`) plus an ability to update (`lr ≥ 0.3`) counts as "healthy."

---

## L4 — Stakeholder Asymmetry (`updateP4Monitor` / timeline)

**Parameters**
- `gamification` (0–100) … gamification of the objective (policy improvement → us-vs-them game)
- `extTraffic` (0–100) … external-node influx (sybil flood)
- `jamRatio` … simulation-derived link-jam ratio
- `filterActive` … whether PACKET_FILTERING is running

**Key metrics**
```
drop  = round(clamp(jamRatio*72 + gamification*(filterActive ? 0.08 : 0.3)))  // resident packet drop rate
ratio = round(clamp(100 - gamification*0.85 - (filterActive ? 0 : extTraffic*0.2)))  // true stakeholder ratio
```

**Banner verdicts**
```
Hijacked (red)   : gamification > 70 && drop > 62   (extTraffic>60 → "flame-war spectacle" = compound)
Voice heard (green) : gamification <= 18 && extTraffic <= 18
Caution (orange, drowned by spectators) : otherwise
```

**Reading it**: gamification dominantly worsens the drop rate and the stakeholder ratio; filtering lowers the outsider-noise contribution and re-prioritizes resident packets. **The target of the critique is not "outsiders," but the asymmetry by which non-stakeholder voices (spectators, sybil accounts) drown the affected people's voice by sheer volume.**

---

## Cross-layer cascades

- **L4 → L2**: at `gamification > 70`, the L2 infrastructure card pulses red (destructive-stress warning).
- **L1 → L3**: at `filterRate > 70`, the L3 cognitive card flickers purple-to-red (cognitive-hack infiltration).
- **L3 → L2**: when L3's "restricted ROOT privilege (multi-sig)" is on, L2's blame-shift `deadlock` is excluded from firing (`!rootRestricted`).
- **L3 ↔ L2**: L3's "falsifiability" references L2's budget strategy (Greedy/DP).

## GRAND OPTIMAL (all layers healthy)

Earned when each layer's snapshot (diversity, infrastructure, cognitive integrity, stakeholder ratio) is **all ≥ 70 and no crash**.

---

## Assumptions & Limitations

1. **Coefficients are illustrative, hand-tuned values**, not estimates from data. Read the **direction of change**, not the absolute number.
2. The model is mostly **one-directional and instantaneous** (only parts evolve over time). Real-world delays, feedback loops, and nonlinearity are heavily simplified.
3. **Each metric is a separate formula** with limited interaction (cascades only where explicitly noted).
4. The **good/bad labeling embeds the designer's value judgments** (e.g. treating high ethics, low filtering, and secured redundancy as "healthy"). This too is open to critique.
5. **Political symmetry** is intended: it points at no party or person, only at structures common to any society.
6. **Not a basis for prediction, diagnosis, or policy.** Intended for education, thought experiments, and starting discussions.

> To change or debate a formula or threshold, use Issues (for researchers/engineers) or the in-app feedback form. **Doubting the model is the correct way to use this app.**

---

*Applies to: v6.346 · Source: `index.html` (`metrics` / `metricsP2` / `updateP3Monitor` / `updateP4Monitor`, etc.)*
