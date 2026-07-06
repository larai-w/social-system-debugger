
const HIST_REF = [
  { match:(f,e,a)=>f>80&&e<20&&a==='greedy',
    ja:'📍 ワイマール共和国末期（1932–33年） — 情報統制×ポピュリスト指導者×短期政治が複合。制度への信頼が消滅し3年でシステムが全崩壊した。',
    en:'📍 Late Weimar Republic (1932–33) — Info control × populist leader × short-termism combined. Institutional trust vanished; full collapse within 3 years.' },
  { match:(f,e,a)=>f>60&&e<30&&a==='greedy',
    ja:'📍 現代ポピュリズム（ハンガリー2010〜 / ブラジル2018〜） — 選挙で選ばれた指導者による制度の内部侵食。司法・メディア・選挙管理が順番に無力化された。',
    en:'📍 Modern Populism (Hungary 2010–, Brazil 2018–) — Institutional erosion by elected leaders. Courts, media, and electoral bodies systematically neutralized.' },
  { match:(f,e,a)=>f>65&&e<50,
    ja:'📍 1930年代ファシズム台頭期（イタリア/ドイツ） — エコーチェンバーが反知性主義と外集団嫌悪を増幅。中程度の倫理観は崩壊を遅らせたが止められなかった。',
    en:'📍 Rise of Fascism 1930s (Italy/Germany) — Echo chambers amplified anti-intellectualism and outgroup hatred. Moderate ethics slowed but could not stop collapse.' },
  { match:(f,e,a)=>f>50&&e>=45&&e<72,
    ja:'📍 SNS時代の情報分断（2016年〜） — アルゴリズム的フィルターバブルが政治的二極化を加速。社会的粘着性が年率3–5%で低下中。',
    en:'📍 Social Media Polarization (2016–) — Algorithmic filter bubbles accelerated polarization. Social cohesion declining 3–5%/year.' },
  { match:(f,e,a)=>f>45&&e>=70&&a==='dp',
    ja:'📍 テクノクラシー（シンガポール1980年代〜） — 強い情報管理と高行政倫理の共存。短期的安定は高いが情報多様性が犠牲になり長期イノベーション力が減退する。',
    en:'📍 Technocracy (Singapore 1980s–) — Strong info control with high administrative ethics. High stability, but diversity sacrificed, reducing long-term innovation.' },
  { match:(f,e,a)=>f<30&&e>=80&&a==='dp',
    ja:'📍 北欧型社会民主主義（1970年代〜） — 低フィルタリング×高倫理×長期最適化の実在例。現存する最も持続可能な社会モデルの一つ。信頼資本が自己強化ループを形成。',
    en:'📍 Nordic Social Democracy (1970s–) — Low filtering × high ethics × DP in practice. One of the most sustainable social models. Trust capital forms a self-reinforcing loop.' },
  { match:(f,e,a)=>f<35&&e>=68&&a==='greedy',
    ja:'📍 新自由主義的民主主義（1990年代） — 情報は比較的開放的だが短期経済優先。所得格差が拡大し始めソーシャルキャピタルが緩やかに侵食されるパターン。',
    en:'📍 Neoliberal Democracy (1990s) — Relatively open information but short-term economic focus. Income inequality grew; social capital gradually eroded.' },
  { match:()=>true,
    ja:'📍 パラメーターを変化させると、類似する歴史的事例が参照されます。',
    en:'📍 Adjust parameters to see matching historical case references.' },
];

const PRESETS = {
  weimar:  { f:88, e:12,  a:'greedy' },
  sns:     { f:72, e:48,  a:'greedy' },
  nordic:  { f:18, e:90,  a:'dp'     },
  techno:  { f:35, e:76,  a:'dp'     },
  populism:{ f:65, e:8,   a:'greedy' },
};

const MDATA = {
  entropy:{
    tag:'METRIC · ENTROPY',
    jaTitle:'エントロピー（社会的無秩序度）', enTitle:'Entropy (Social Disorder)',
    jaBody:`<strong>エントロピー</strong>は情報理論の無秩序度概念を社会システムに応用したメトリクスです。<br><br>エコーチェンバーが進行すると、<strong>ボルツマン的無秩序</strong>（社会の混乱度）が増大します。高い値は社会的コンセンサスの崩壊、制度への不信、法の形骸化を示します。<br><br>過学習したモデルが現実のデータを正しく処理できないように、エントロピーが高い社会は外部ショックに対応できなくなります。`,
    enBody:`<strong>Entropy</strong> applies information theory's disorder concept to social systems.<br><br>As echo chambers advance, <strong>Boltzmann-style disorder</strong> increases. High values indicate breakdown of social consensus, institutional distrust, and failure of rule of law.<br><br>Just as an overfitted model can't process real-world data, a high-entropy society loses the ability to respond to external shocks.`,
    formula:'H = 0.42·FilterRate + 0.38·(1−Ethics) + 0.20·GreedyPenalty'
  },
  paranoia:{
    tag:'METRIC · MENTAL HEALTH',
    jaTitle:'精神病・パラノイア発症リスク（ノイズ蓄積度）', enTitle:'Paranoia Risk (Noise Accumulation)',
    jaBody:`エコーチェンバー内では<strong>確証バイアス</strong>が増幅され、外部情報（反証）が拒絶されます。<br><br>これは<strong>ニューラルネットワークの過学習</strong>と同じ構造です。訓練データのノイズまで学習したモデルが実世界の入力を正しく処理できなくなるように、長期的なフィルタリングは集団的パラノイアと陰謀論の蔓延を引き起こします。`,
    enBody:`Inside echo chambers, <strong>confirmation bias</strong> amplifies and counter-evidence is rejected.<br><br>This mirrors <strong>neural network overfitting</strong>: a model that learns training noise can no longer process real-world inputs correctly. Long-term filtering causes collective paranoia and conspiracy theories.`,
    formula:'P = 0.48·FilterRate + 0.33·(1−Ethics) + 0.14·GreedyPenalty'
  },
  socialCap:{
    tag:'METRIC · SOCIAL CAPITAL',
    jaTitle:'ソーシャルキャピタル（社会的信用）', enTitle:'Social Capital (Social Trust)',
    jaBody:`パットナムが定義した<strong>ソーシャルキャピタル</strong>は、社会的ネットワークの信頼・規範・協力の蓄積です。<br><br>これが低下すると公共財への協力が減少しフリーライダー問題が悪化します。エコーチェンバーは外集団への不信を増大させ、社会的粘着性を破壊します。<br><br>信頼は壊すのは一瞬、築くのに何年もかかる。ソーシャルキャピタルはシステムの<strong>スイッチングコスト</strong>です。`,
    enBody:`Putnam's <strong>Social Capital</strong> represents accumulated trust, norms, and cooperation.<br><br>As it falls, cooperation on public goods decreases and free-rider problems worsen. Echo chambers amplify outgroup distrust, destroying social cohesion.<br><br>"Trust takes years to build, seconds to break." Social capital is the system's <strong>switching cost</strong>.`,
    formula:'SC = 100 − 0.30·FR − 0.42·(1−E) − 0.28·GP'
  },
  dopamine:{
    tag:'METRIC · REWARD FUNCTION',
    jaTitle:'ドーパミンインデックス（即時報酬強度）', enTitle:'Dopamine Index (Immediate Reward Intensity)',
    jaBody:`ポピュリスト的コミュニケーションは複雑な政策議論より<strong>感情的・刺激的コンテンツ</strong>を優先し、脳内ドーパミン報酬系を直接刺激します。<br><br>Greedyアルゴリズムはこの即時報酬を最大化しますが、<strong>ドーパミン耐性</strong>が生じより強い刺激が必要になります。これがポピュリズムの「過激化スパイラル」の数学的モデルです。`,
    enBody:`Populist communication prioritizes <strong>emotionally stimulating content</strong>, directly triggering the brain's dopamine reward system.<br><br>The Greedy algorithm maximizes immediate reward, but <strong>dopamine tolerance</strong> builds, requiring stronger stimuli — the mathematical model of populism's "radicalization spiral."`,
    formula:'D = 52 + (1−E/2)·35 [Greedy] | 30 + E·38 [DP]'
  },
  infra:{
    tag:'METRIC · INFRASTRUCTURE',
    jaTitle:'インフラ維持力（医療・交通・教育）', enTitle:'Infrastructure Health',
    jaBody:`公共インフラは<strong>長期的投資の典型例</strong>です。DPモデルでは将来コストを内部化し、今の整備が将来のコスト削減に繋がることを計算します。<br><br>Greedyモードでは予算が短期的支持率を上げる<strong>バラマキ政策</strong>に流用され、メンテナンスが後回しになります。インフラが臨界値を下回ると正のフィードバックループで崩壊が加速します。`,
    enBody:`Public infrastructure is the classic example of <strong>long-term investment</strong>. DP internalizes future costs.<br><br>Under Greedy, budgets are redirected to short-term populist spending. Below critical threshold, <strong>positive feedback loops</strong> accelerate collapse.`,
    formula:'I = 100 − (1−E)·52 − FR·0.20 − GP·0.28'
  },
  diversity:{
    tag:'METRIC · GENERALIZATION',
    jaTitle:'情報多様性インデックス（汎化性能の代理指標）', enTitle:'Information Diversity (Generalization Proxy)',
    jaBody:`機械学習において<strong>訓練データの多様性</strong>はモデルの汎化性能に直結します。社会においても情報多様性は「どれだけ多様な現実シナリオに対応できるか」を示します。<br><br>フィルタリング率が高いほど同質情報が支配的になりこの指数は急落します。多様性が低いシステムは<strong>ブラックスワン・イベント</strong>に致命的に脆弱です。`,
    enBody:`In ML, <strong>training data diversity</strong> directly correlates with generalization. Socially, information diversity indicates how well a society handles varied real-world scenarios.<br><br>Higher filtering causes homogeneous information dominance. Low-diversity systems become fatally vulnerable to <strong>black swan events</strong>.`,
    formula:'DI = max(0, 100 − FilterRate·0.82)'
  },
  // ── v5.2: P2 メトリクス ──
  p2Infra:{
    tag:'METRIC · P2 INFRASTRUCTURE',
    jaTitle:'インフラ維持力（道路・水道・公共施設）', enTitle:'Infrastructure Capacity',
    jaBody:`人口減少地域における物理インフラの維持能力。<strong>集約化率</strong>が低いと広域レガシーインフラの延命コストが財政を圧迫し続けます。<br><br>他責デッドロック発動中は修復処理がゼロになり崩壊速度が3倍に。<strong>Public Reboot ON</strong>で劣化速度は半減します。<br><br>また<strong>財政（税収）が薄いと保守予算が不足</strong>し、インフラ維持力の実効値が下がります（財政 &lt; 45 で保守不足ペナルティ）。ブランド産業→税収→保守→インフラという連鎖の末端です。`,
    enBody:`Capacity to maintain physical infrastructure in a depopulating region. Low <strong>consolidation</strong> keeps costly life-support for sprawling legacy assets.<br><br>Under blame-shift deadlock, repair drops to zero and decay triples. <strong>Public Reboot</strong> halves the decay rate.<br><br>A <strong>thin budget (tax base) starves maintenance</strong>, lowering effective infrastructure capacity (penalty when budget &lt; 45). This is the tail of the chain: brand industry → tax base → maintenance → infrastructure.`,
    formula:'I = [100 − (1−Shrink)·35·D − (1−DX)·15 − Greedy(1−E)·28·D] + RepairCPU·0.14 − BudgetShortfall   [D=0.5 if Reboot; Shortfall=max(0,45−M)·1.2]'
  },
  p2Redundancy:{
    tag:'METRIC · REDUNDANCY',
    jaTitle:'社会的耐故障性（Redundancy Buffer）', enTitle:'Redundancy Buffer',
    jaBody:`システム工学の<strong>冗長性</strong>の概念。一見「無駄」に見える余白・予備・重複こそが、想定外のショック（ブラックスワン）を吸収する生命線です。<br><br>効率化（集約×Greedy）を極めるほどバッファは消失し、<strong>30%未満でショックが来ると即時の致命的崩壊</strong>を起こします。再公営化（Public Reboot）で回復します。`,
    enBody:`The systems-engineering concept of <strong>redundancy</strong>. Seemingly "wasteful" slack is what absorbs black-swan shocks.<br><br>Maximal efficiency (consolidation × Greedy) erases the buffer; <strong>below 30%, a shock causes instant System Crash</strong>. Public Reboot (re-municipalization) restores it.`,
    formula:'RB = 100 − Shrink·0.52 − (Greedy?32:0) + (Reboot?42:0)'
  },
  p2Heli:{
    tag:'METRIC · LIFELINE',
    jaTitle:'救命ヘリ（ライフラインの象徴）', enTitle:'Rescue Helicopter (Lifeline)',
    jaBody:`「効率」の物差しでは測れない<strong>非市場的な公共サービス</strong>の象徴。稼働率が低くても、存在すること自体に価値があります。<br><br>状態は3つ：<br>● <strong style="color:var(--green)">OPERATIONAL</strong> 常時稼働<br>◐ <strong style="color:var(--ora)">WEATHER HOLD</strong> ショック中の一時見合わせ（有視界飛行の制約で悪天候時は飛べない。天候回復後、構造条件を満たせば自動復帰）<br>■ <strong style="color:var(--red)">SUSPENDED</strong> 長期運休（インフラ35%未満／低倫理／他責デッドロック）<br><br>救命ヘリは広域システムであり、一自治体の産業と直結しません。停止は必ず<strong>ブランド→税収→保守→インフラ→ヘリ</strong>という連鎖を経由します（停止時はログに連鎖が流れます）。<strong>Public Reboot ON</strong>なら常時ONLINE。`,
    enBody:`A symbol of <strong>non-market public services</strong> that efficiency metrics cannot capture — its value lies in existing at all.<br><br>Three states:<br>● <strong style="color:var(--green)">OPERATIONAL</strong> always on duty<br>◐ <strong style="color:var(--ora)">WEATHER HOLD</strong> temporary hold during a shock (VFR limits ground it in bad weather; auto-returns after the storm if structure holds)<br>■ <strong style="color:var(--red)">SUSPENDED</strong> long-term (infra &lt; 35% / low ethics / blame-shift deadlock)<br><br>The heli is a wide-area system, never wired directly to one town's industry. It only stops via the chain <strong>brand → tax base → maintenance → infra → heli</strong> (the cascade streams into the log when it stops). <strong>Public Reboot</strong> keeps it online.`,
    formula:'Heli = WEATHER HOLD (shock中の一時) · SUSPENDED (Infra≤35 ∨ E<0.3 ∨ deadlock) · else OPERATIONAL'
  },
  p2Brand:{
    tag:'METRIC · LOCAL INDUSTRY',
    jaTitle:'地域ブランド産業（農業・特産品）', enTitle:'Local Brand Industry',
    jaBody:`地域経済の自立を支える産業の持続性。産業の出力は<strong>後継者ストック（暗黙知の残量）</strong>に支えられています。<br><br><strong>DX投資</strong>が低いと高齢職人の引退で後継者ストックがじわじわ減り——<strong>当面は何も起きません</strong>。しかし残量が尽きると、ブランドは段階的でなく<strong>崖のように急落</strong>し（後継者断絶）、税収→保守→インフラへ連鎖します。<strong>0で技術ごと消滅</strong>し、DXを最大にしても回復しません（再公営化のみ復活）。<br><br>スマート自動化は「伝統の破壊」ではなく、技術を次世代へ引き継ぐための<strong>シリアライズ（保存形式への変換）</strong>——後継者ストックを保つ手段です。これはGreedy（今の効率）とDP（将来への投資）の教材そのものです。`,
    enBody:`Sustainability of the industry that keeps the region economically independent. Output is sustained by a <strong>successor stock (reserve of tacit knowledge)</strong>.<br><br>Low <strong>DX investment</strong> lets aging artisans retire and the stock slowly drains — and <strong>for a while nothing happens</strong>. But once it runs out, the brand does not decline gradually: it <strong>falls off a cliff</strong> (succession break), cascading into tax base → maintenance → infrastructure. At <strong>zero it goes extinct</strong> and won't recover even at max DX (only re-municipalization revives it).<br><br>Smart automation is not destroying tradition — it is <strong>serializing</strong> skills so the next generation can load them, keeping the successor stock alive. This is the very lesson of Greedy (efficiency now) vs. DP (investing in the future).`,
    formula:'B = (45 + Shrink·16 + (DP?+12:−12) + Ethics·8) × SkillFactor(SuccessorStock)'
  },
  p2Budget:{
    tag:'METRIC · FISCAL',
    jaTitle:'自治体財政（Municipal Budget）', enTitle:'Municipal Budget',
    jaBody:`行政の体力ゲージ。最大の収入源は<strong>地域ブランド産業の税収基盤</strong>です——ブランドが崖のように崩れると税収が細り、保守予算が不足してインフラ維持力まで連鎖的に低下します。<br><br>Greedy戦略の利益誘導が最大の流出源。<strong>Public Reboot</strong>と<strong>Root権限制限</strong>はいずれも財政コストを伴います——公共性とガバナンスは「タダではない」が、崩壊よりはるかに安い保険です。`,
    enBody:`The administration's stamina gauge. Its main income is the <strong>tax base of the local brand industry</strong> — if the brand falls off a cliff, tax revenue thins, maintenance is underfunded, and infrastructure capacity drops in turn.<br><br>Greedy patronage is the biggest drain. <strong>Public Reboot</strong> and <strong>Root restriction</strong> both cost budget — public good and governance aren't free, but they are far cheaper insurance than collapse.`,
    formula:'M = 42 + Brand·0.55 − Greedy(1−E)·30 − (1−Shrink)·10 − RebootCost − GovCost'
  },
  p2Deadlock:{
    tag:'STATE · DEADLOCK',
    jaTitle:'他責デッドロック（Blame-Shifting Deadlock）', enTitle:'Blame-Shifting Deadlock',
    jaBody:`エラー発生時に行政CPUの100%が「責任回避・他者攻撃」に占有され、修復処理が完全停止する状態。OSの<strong>デッドロック</strong>と同型です。<br><br>発動条件は「低倫理×Greedy×インフラエラー」の3点同時成立。<strong>Page 3のRoot権限制限（⇄）</strong>で単独発動をブロックできます。`,
    enBody:`A state where 100% of admin CPU is consumed by blame-shifting, halting all repair — structurally identical to an OS <strong>deadlock</strong>.<br><br>Triggers when low ethics × Greedy × infra error coincide. <strong>Root restriction on Page 3 (⇄)</strong> blocks unilateral activation.`,
    formula:'Deadlock = !RootRestricted && Ethics<40 && Greedy && InfraError'
  },
  // ── v5.2: P3 メトリクス ──
  p3Dopamine:{
    tag:'METRIC · P3 REWARD',
    jaTitle:'正義感カウンター（Justice Dopamine Surge）', enTitle:'Justice Dopamine Surge',
    jaBody:`「悪を裁いている」という感覚は脳内で<strong>最も強力な報酬</strong>の一つです。偽装ノードはこの回路をハックし、攻撃行動を「正義の実行」として快感に変換します。<br><br>暴走域に入ると、事実を述べる中立ノードへの毒入れ攻撃が「気持ちいい」行為になります。`,
    enBody:`The feeling of "punishing evil" is one of the brain's <strong>strongest rewards</strong>. The disguised node hacks this circuit, converting aggression into the pleasure of "executing justice".<br><br>In runaway mode, poisoning attacks on fact-stating neutral nodes literally feel good.`,
    formula:'D += Fooled·(1−Grounding·0.7)·1.6 − Recovery·LearningRate'
  },
  p3Integrity:{
    tag:'METRIC · P3 COGNITION',
    jaTitle:'認知健全性（Cognitive Integrity）', enTitle:'Cognitive Integrity',
    jaBody:`偽装情報への<strong>過適合（オーバーフィット）</strong>していない度合い。全一般ノードの平均汚染度から算出されます。<br><br>回復には「探索深度を上げる（検証）」「現実同期を上げる（グラウンディング）」「学習率を保つ（素直さ）」の3つが必要——<strong>どれか1つがゼロだと回復しません</strong>。`,
    enBody:`How far cognition remains un-<strong>overfitted</strong> to disguised information, computed from average node contamination.<br><br>Recovery needs all three: deeper search (verification), higher grounding, and a non-zero learning rate — <strong>if any one is zero, recovery stalls</strong>.`,
    formula:'CI = 100 − avg(contamination)·100'
  },
  p3Falsifiability:{
    tag:'METRIC · P3 EPISTEMICS',
    jaTitle:'反証許容度（Falsifiability）', enTitle:'Falsifiability',
    jaBody:`ポパーの科学哲学における<strong>反証可能性</strong>。健全なモデルはエラー（予測の失敗）を仮説の棄却として受理し、自己修正します。<br><br><strong>Page 2の戦略がGreedyのとき（⇄）</strong>、エラーはすべて「タイミングが悪い」「妨害があった」という後付けダミー変数で言い訳処理され、モデルは反証不能＝自己欺瞞状態に陥ります。`,
    enBody:`Popper's <strong>falsifiability</strong>. A healthy model accepts errors as hypothesis rejection and self-corrects.<br><br>When <strong>Page 2's strategy is Greedy (⇄)</strong>, every error gets excused by post-hoc dummy variables ("bad timing", "sabotage") — the model becomes unfalsifiable, i.e., self-deceiving.`,
    formula:'F = Greedy ? 0 (UNFALSIFIABLE) : LR·0.55 + Depth·4.5'
  },
  // ── v5.2: P4 メトリクス ──
  p4Drop:{
    tag:'METRIC · P4 NETWORK',
    jaTitle:'サイレントマジョリティのパケットドロップ率', enTitle:'Silent-Majority Packet Drop Rate',
    jaBody:`530万人の生活者が発する政策要求（パケット）のうち、ネットワークに届かず<strong>破棄される割合</strong>。<br><br>Canvas上で実際に遮断された通信リンクの比率から算出されます。声の大きさではなく<strong>帯域の占拠</strong>によって、静かな多数派の声は物理的に消されます。`,
    enBody:`The share of policy requests (packets) from 5.3M residents that get <strong>discarded</strong> before reaching the network.<br><br>Computed from actually-jammed links on the canvas. The quiet majority is silenced not by volume but by <strong>bandwidth occupation</strong>.`,
    formula:'PDR = JammedLinks/TotalLinks·72 + Gamification·0.3'
  },
  p4Ratio:{
    tag:'METRIC · P4 GOVERNANCE',
    jaTitle:'真の当事者コミット比率（True Stakeholder Ratio）', enTitle:'True Stakeholder Ratio',
    jaBody:`議論参加者のうち、その決定の<strong>結果を実際に引き受ける人</strong>の割合。<br><br>ゲーム化が進むほど「勝敗だけ消費して結果は引き受けない」観客が支配的になり、この比率は急落します。当事者比率の低い意思決定は、<strong>誰も責任を取らない決定</strong>です。`,
    enBody:`The share of participants who will actually <strong>live with the consequences</strong> of the decision.<br><br>As gamification rises, spectators who consume the win/lose drama without bearing outcomes dominate. A decision with a low stakeholder ratio is <strong>a decision nobody answers for</strong>.`,
    formula:'TSR = 100 − Gamification·0.85 − ExternalTraffic·0.2'
  }
};

let algo = 'greedy', filterRate = 0, ethicsScore = 100, historicalImmunity = 50, lang = 'ja';
let activePreset = null;
let animPlaying = false, animStep = 0, animTimer = null, fullTimeline = null;
let pinnedData = null;

// SCATTER DRIFT STATE
const SC_N = 130;
let scPts = [], scCtx2, scW2, scH2, scAnimId2, pinnedPts = null;

function randn(mu, s) {
  let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();
  return mu + s * Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function lerp(a,b,t){return a+(b-a)*t}
function seedRng(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/2**32}}
function t(k){return I18N[lang][k]||k}
function tt(ja,en){return lang==='ja'?ja:en}

function genScatter(fr){
  const f=fr/100, tot=130, rN=Math.max(5,Math.floor(tot*(1-f*0.88)));
  const real=[], fake=[];
  for(let i=0;i<rN;i++) real.push({x:clamp(randn(55,26),4,98),y:clamp(randn(48,22),4,96)});
  for(let i=0;i<tot-rN;i++){
    const cx=14+f*22, cy=74+f*14, sp=Math.max(2,11-f*8);
    fake.push({x:clamp(randn(cx,sp),1,95),y:clamp(randn(cy,sp),5,99)});
  }
  return{real,fake};
}

function simTimeline(fr,es,al,steps=65){
  const f=fr/100,e=es/100,isG=al==='greedy';
  const dp=[],sc=[],inf=[];
  for(let i=0;i<steps;i++){
    const tn=i/steps, n=()=>randn(0,2.4);
    if(isG){
      const bell=Math.exp(-Math.pow((tn-0.22)*7,2));
      const col=tn>0.38?Math.pow((tn-0.38)/0.62,1.6)*(1-e*0.4):0;
      dp.push(clamp(15+85*bell*(1-e*0.25)-col*50+n(),0,100));
      sc.push(clamp(lerp(100,4,f*0.45+(1-e)*tn*1.3)+n(),0,100));
      inf.push(clamp(96-(1-e)*tn*85-f*22+n(),0,100));
    } else {
      const g=1-Math.exp(-3.2*tn);
      dp.push(clamp(28+48*g*e+n(),0,100));
      sc.push(clamp(58+36*g*e-f*22+n(),0,100));
      inf.push(clamp(68+28*g*e+n(),0,100));
    }
  }
  return{dp,sc,inf};
}

function metrics(fr,es,al){
  const f=fr/100,e=es/100,isG=al==='greedy',gp=isG?0.38:0;
  const entropy  =clamp(f*42+(1-e)*38+gp*20,0,100);
  const paranoia =clamp(f*48+(1-e)*33+gp*14,0,100);
  const socialCap=clamp(100-f*30-(1-e)*42-gp*28,0,100);
  const dopamine =clamp(isG?52+(1-e*0.4)*35:30+e*38,0,100);
  const infra    =clamp(100-(1-e)*52-f*20-gp*28,0,100);
  const diversity=clamp(100-f*82,0,100);
  const trust    =clamp(e*80+(1-f)*20,0,100);
  const resilience=clamp(e*52+(1-f)*48-gp*30,0,100);
  const legitimacy=clamp(e*92+(1-f)*8,0,100);
  const infoH    =clamp((1-f)*90+e*10,0,100);
  const viability=clamp(e*62+(1-f)*38-gp*42,0,100);
  const mentalWB =clamp(100-paranoia*0.92,0,100);
  const crash    =entropy>76||(infra<18&&socialCap<18);
  return{entropy,paranoia,socialCap,dopamine,infra,diversity,trust,resilience,legitimacy,infoH,viability,mentalWB,crash};
}

function getHistRef(f,e,a){
  for(const r of HIST_REF){if(r.match(f,e,a))return lang==='ja'?r.ja:r.en;}
  return '';
}
