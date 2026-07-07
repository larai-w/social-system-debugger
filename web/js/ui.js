// Platform gate for weekly scenarios (native only). Kept in ui.js so engine.js
// stays DOM/window-free and reusable server-side. Web時はfalseで従来どおり非表示。
const WEEKLY_ENABLED = window.Capacitor?.isNativePlatform?.() ?? false;

function updateHistRef(){
  const el=document.getElementById('histRef');
  if(el) el.textContent=getHistRef(filterRate,ethicsScore,algo);
}

function playAnimation(){
  const btn=document.getElementById('playBtn');
  if(animPlaying){
    clearInterval(animTimer);
    animPlaying=false; animTimer=null;
    btn.textContent=t('playPlay');
    btn.classList.remove('play-on');
    const tl=simTimeline(filterRate,ethicsScore,algo);
    timelineChart.data.datasets[0].data=tl.dp;
    timelineChart.data.datasets[1].data=tl.sc;
    timelineChart.data.datasets[2].data=tl.inf;
    timelineChart.update();
    return;
  }
  fullTimeline=simTimeline(filterRate,ethicsScore,algo);
  animStep=0; animPlaying=true;
  btn.textContent=t('playStop');
  btn.classList.add('play-on');
  timelineChart.data.datasets[0].data=[];
  timelineChart.data.datasets[1].data=[];
  timelineChart.data.datasets[2].data=[];
  timelineChart.update('none');
  animTimer=setInterval(()=>{
    animStep++;
    if(animStep>65){
      clearInterval(animTimer); animPlaying=false; animTimer=null;
      btn.textContent=t('playPlay'); btn.classList.remove('play-on');
      return;
    }
    timelineChart.data.datasets[0].data=fullTimeline.dp.slice(0,animStep);
    timelineChart.data.datasets[1].data=fullTimeline.sc.slice(0,animStep);
    timelineChart.data.datasets[2].data=fullTimeline.inf.slice(0,animStep);
    timelineChart.update('none');
  },70);
}

function stopAnimation(){
  if(!animPlaying) return;
  clearInterval(animTimer); animPlaying=false; animTimer=null;
  const btn=document.getElementById('playBtn');
  if(btn){btn.textContent=t('playPlay');btn.classList.remove('play-on');}
}

function pinScenario(){
  const btn=document.getElementById('pinBtn');
  const lbl=document.getElementById('pinLabel');
  if(pinnedData){
    pinnedData=null; pinnedPts=null;
    timelineChart.data.datasets=timelineChart.data.datasets.slice(0,3);
    radarChart.data.datasets=radarChart.data.datasets.slice(0,2);
    timelineChart.update(); radarChart.update();
    btn.classList.remove('pin-on');
    lbl.textContent=t('pinLock');
  } else {
    const tl=simTimeline(filterRate,ethicsScore,algo);
    const m=metrics(filterRate,ethicsScore,algo);
    pinnedData={tl,m};
    pinnedPts=scPts.map(p=>({...p}));  // snapshot scatter positions
    timelineChart.data.datasets.push(
      {label:`[A] ${t('chart_dopamine')}`,data:tl.dp,borderColor:'rgba(0,255,136,.35)',borderWidth:1.5,borderDash:[5,4],pointRadius:0,tension:0.42,fill:false},
      {label:`[A] ${t('chart_socialCap')}`,data:tl.sc,borderColor:'rgba(0,212,255,.35)',borderWidth:1.5,borderDash:[5,4],pointRadius:0,tension:0.42,fill:false},
      {label:`[A] ${t('chart_infra')}`,data:tl.inf,borderColor:'rgba(153,69,255,.35)',borderWidth:1.5,borderDash:[5,4],pointRadius:0,tension:0.42,fill:false}
    );
    radarChart.data.datasets.push({
      label:'[A] Scenario',
      data:[m.trust,m.resilience,m.legitimacy,m.infoH,m.viability,m.mentalWB],
      backgroundColor:'rgba(255,204,0,.07)',borderColor:'rgba(255,204,0,.5)',
      borderWidth:1.5,borderDash:[5,4],pointBackgroundColor:'rgba(255,204,0,.6)',pointRadius:2
    });
    timelineChart.update(); radarChart.update();
    btn.classList.add('pin-on');
    lbl.textContent=t('pinClear');
  }
}

const N=48;
let nodes=[],edges=[],agCtx,cW,cH,animId;

function initAgents(){
  const r=seedRng(1337);
  nodes=Array.from({length:N},(_,i)=>{
    let x,y,belief;
    if(i<16){belief=r()*0.32;x=0.15+r()*0.28;y=0.1+r()*0.8}
    else if(i<32){belief=0.34+r()*0.32;x=0.35+r()*0.3;y=0.1+r()*0.8}
    else{belief=0.68+r()*0.3;x=0.6+r()*0.28;y=0.1+r()*0.8}
    x=clamp(x+randn(0,0.05),0.04,0.96);
    y=clamp(y+randn(0,0.05),0.04,0.96);
    return{x,y,belief,c:i<4?0.85:r()*0.08,isLeader:i===0,isFC:i===1||i===2};
  });
  edges=[];
  for(let i=0;i<N;i++){
    const dists=nodes.map((n,j)=>({j,d:Math.hypot(nodes[i].x-n.x,nodes[i].y-n.y)}))
      .filter(x=>x.j!==i).sort((a,b)=>a.d-b.d).slice(0,5);
    dists.forEach(({j})=>{if(!edges.some(e=>(e[0]===j&&e[1]===i)))edges.push([i,j])});
  }
}

function edgeActive(ni,nj){
  return Math.abs(ni.belief-nj.belief)<=1.0-(filterRate/100)*0.85;
}

function stepAgents(){
  const f=filterRate/100,e=ethicsScore/100,isG=algo==='greedy';
  const nc=nodes.map(n=>n.c);
  edges.forEach(([i,j])=>{
    if(!edgeActive(nodes[i],nodes[j]))return;
    const diff=nodes[i].c-nodes[j].c, rate=0.007+f*0.013;
    if(diff>0)nc[j]=Math.min(1,nc[j]+diff*rate);
    else nc[i]=Math.min(1,nc[i]+(-diff)*rate);
  });
  const immunity=historicalImmunity/100;
  nodes.forEach((n,i)=>{
    if(!n.isFC)return;
    // 歴史的免疫値が高いほどファクトチェッカーの汚染抵抗が強くなる
    nc[i]=Math.max(0,nc[i]-e*0.015*(1+immunity*1.5));
    edges.filter(ed=>ed[0]===i||ed[1]===i).forEach(([a,b])=>{
      nc[a===i?b:a]=Math.max(0,nc[a===i?b:a]-e*0.005*(1+immunity));
    });
    // False Positive: フィルタリング率70%超でFCが「敵」と誤判定されFC自体が汚染される
    if(filterRate>70&&immunity<0.5){
      const fpPressure=(filterRate-70)/30*(0.5-immunity);
      nc[i]=Math.min(1,nc[i]+fpPressure*0.008);
    }
  });
  if(isG){
    nc[0]=Math.min(1,nc[0]+(1-e)*0.009);
    edges.filter(ed=>ed[0]===0||ed[1]===0).forEach(([a,b])=>{
      const nb=a===0?b:a;
      if(edgeActive(nodes[0],nodes[nb]))nc[nb]=Math.min(1,nc[nb]+nc[0]*0.013*(1-e*0.5));
    });
  } else {
    nc[0]=Math.max(0,nc[0]-e*0.013);
    edges.filter(ed=>ed[0]===0||ed[1]===0).forEach(([a,b])=>{
      nc[a===0?b:a]=Math.max(0,nc[a===0?b:a]-e*0.006);
    });
  }
  nodes.forEach((n,i)=>n.c=nc[i]);
}

function cColor(c,a=1){
  let r,g,b;
  if(c<0.5){r=Math.round(lerp(0,255,c*2));g=Math.round(lerp(212,107,c*2));b=Math.round(lerp(255,43,c*2))}
  else{r=255;g=Math.round(lerp(107,34,(c-0.5)*2));b=Math.round(lerp(43,68,(c-0.5)*2))}
  return a<1?`rgba(${r},${g},${b},${a})`:`rgb(${r},${g},${b})`;
}

function drawAgents(){
  if(!agCtx)return;
  agCtx.clearRect(0,0,cW,cH);
  const f=filterRate/100;
  edges.forEach(([i,j])=>{
    const ni=nodes[i],nj=nodes[j],active=edgeActive(ni,nj);
    if(!active&&f>0.25)return;
    agCtx.beginPath();agCtx.moveTo(ni.x*cW,ni.y*cH);agCtx.lineTo(nj.x*cW,nj.y*cH);
    agCtx.strokeStyle=active?cColor((ni.c+nj.c)/2,0.22-f*0.08):`rgba(23,35,64,0.04)`;
    agCtx.lineWidth=active?1.1:0.5;agCtx.stroke();
  });
  // False Positive: エコーチェンバーノードがFCを「敵」と誤判定して攻撃エッジを伸ばす
  if(filterRate>70){
    const fpIntensity=(filterRate-70)/30*(1-historicalImmunity/100);
    const echoNodes=nodes.filter(n=>!n.isFC&&n.c>0.62);
    const fcNodes=nodes.filter(n=>n.isFC);
    echoNodes.forEach(en=>{
      fcNodes.forEach(fn=>{
        agCtx.beginPath();agCtx.moveTo(en.x*cW,en.y*cH);agCtx.lineTo(fn.x*cW,fn.y*cH);
        agCtx.strokeStyle=`rgba(255,34,68,${(fpIntensity*0.55).toFixed(2)})`;
        agCtx.lineWidth=1.8*fpIntensity;
        agCtx.setLineDash([4,5]);agCtx.stroke();agCtx.setLineDash([]);
      });
    });
  }
  nodes.forEach(n=>{
    const x=n.x*cW,y=n.y*cH,r=n.isLeader?9:n.isFC?7:5;
    const col=n.isFC&&ethicsScore>50?'#00ff88':cColor(n.c);
    const grd=agCtx.createRadialGradient(x,y,0,x,y,r*3);
    grd.addColorStop(0,n.isFC&&ethicsScore>50?'rgba(0,255,136,0.25)':cColor(n.c,0.22));
    grd.addColorStop(1,'rgba(0,0,0,0)');
    agCtx.beginPath();agCtx.arc(x,y,r*3,0,Math.PI*2);agCtx.fillStyle=grd;agCtx.fill();
    agCtx.beginPath();agCtx.arc(x,y,r,0,Math.PI*2);agCtx.fillStyle=col;agCtx.fill();
    if(n.isLeader){agCtx.beginPath();agCtx.arc(x,y,r+4,0,Math.PI*2);agCtx.strokeStyle=col;agCtx.lineWidth=1.5;agCtx.stroke();}
    if(n.isFC){agCtx.beginPath();agCtx.arc(x,y,r+3,0,Math.PI*2);agCtx.strokeStyle='#00ff88';agCtx.lineWidth=1;agCtx.setLineDash([3,3]);agCtx.stroke();agCtx.setLineDash([]);}
  });
  const avgC=nodes.reduce((s,n)=>s+n.c,0)/N;
  document.getElementById('agSt1').textContent=`ECHO EXPOSURE: ${(avgC*100).toFixed(1)}%`;
  // FP発動中はFALSE POSITIVE表示を優先（従来はここで毎フレーム上書きされ表示されなかった）
  const fpI=filterRate>70?(filterRate-70)/30*(1-historicalImmunity/100):0;
  const st2=document.getElementById('agSt2');
  if(fpI>0.1){
    st2.textContent=tt(`FALSE POSITIVE: ${(fpI*100).toFixed(0)}% [FC誤攻撃中]`,`FALSE POSITIVE: ${(fpI*100).toFixed(0)}% [FC under attack]`);
    st2.style.color='var(--red)';
  } else {
    st2.textContent=`IN ECHO CHAMBER: ${nodes.filter(n=>n.c>0.6).length}/${N}`;
    st2.style.color='var(--muted)';
  }
}

function agentLoop(){animId=requestAnimationFrame(agentLoop);stepAgents();drawAgents()}

function startAgents(){
  if(animId)cancelAnimationFrame(animId);
  const cv=document.getElementById('agentCanvas'),wrap=cv.parentElement;
  cW=wrap.clientWidth||700;cH=wrap.clientHeight||296;
  cv.width=cW;cv.height=cH;agCtx=cv.getContext('2d');
  initAgents();agentLoop();
}

function restartAgents(){startAgents()}

// ══════════════════════════════════════════════
// SCATTER DRIFT (Canvas)
// ══════════════════════════════════════════════
function initScatter(){
  const r=seedRng(8675309);
  scPts=Array.from({length:SC_N},()=>({
    hx:clamp(r()*92+4,4,96), hy:clamp(r()*88+4,4,96),
    ex:clamp(r()*28+2,2,34), ey:clamp(r()*20+68,65,97),
    x:0, y:0, c:0
  }));
  scPts.forEach(p=>{p.x=p.hx;p.y=p.hy;});
}

function stepScatter(){
  const healthyN=Math.max(5,Math.floor(SC_N*(1-filterRate/100*0.88)));
  scPts.forEach((p,i)=>{
    const tc=i<healthyN?0:1;
    p.c+=(tc-p.c)*0.035;
    p.x+=(lerp(p.hx,p.ex,p.c)-p.x)*0.055;
    p.y+=(lerp(p.hy,p.ey,p.c)-p.y)*0.055;
  });
}

function drawScatter(){
  if(!scCtx2)return;
  const W=scW2,H=scH2;
  scCtx2.clearRect(0,0,W,H);
  // grid
  scCtx2.strokeStyle='rgba(23,35,64,.6)';scCtx2.lineWidth=0.5;
  for(let i=1;i<4;i++){
    scCtx2.beginPath();scCtx2.moveTo(W*i/4,0);scCtx2.lineTo(W*i/4,H);scCtx2.stroke();
    scCtx2.beginPath();scCtx2.moveTo(0,H*i/4);scCtx2.lineTo(W,H*i/4);scCtx2.stroke();
  }
  // pinned ghost
  if(pinnedPts){
    pinnedPts.forEach(p=>{
      const r2=Math.round(lerp(0,255,p.c)),g2=Math.round(lerp(212,34,p.c)),b2=Math.round(lerp(255,68,p.c));
      scCtx2.beginPath();scCtx2.arc((p.x/100)*W,(1-p.y/100)*H,3.5,0,Math.PI*2);
      scCtx2.fillStyle=`rgba(${r2},${g2},${b2},0.18)`;scCtx2.fill();
    });
  }
  // live points
  scPts.forEach(p=>{
    const r2=Math.round(lerp(0,255,p.c)),g2=Math.round(lerp(212,34,p.c)),b2=Math.round(lerp(255,68,p.c));
    scCtx2.beginPath();scCtx2.arc((p.x/100)*W,(1-p.y/100)*H,4.5,0,Math.PI*2);
    scCtx2.fillStyle=`rgba(${r2},${g2},${b2},0.72)`;scCtx2.fill();
  });
  // legend
  scCtx2.font="9px 'Courier New',monospace";scCtx2.textAlign='left';
  [[0,'rgba(0,212,255,.8)',t('scatter_legend_real')],[130,'rgba(255,34,68,.8)',t('scatter_legend_fake')]].forEach(([ox,col,lbl])=>{
    scCtx2.beginPath();scCtx2.arc(8+ox,H-9,4,0,Math.PI*2);scCtx2.fillStyle=col;scCtx2.fill();
    scCtx2.fillStyle='#5a6f94';scCtx2.fillText(lbl,18+ox,H-6);
  });
  // x-axis label
  scCtx2.fillStyle='#5a6f94';scCtx2.textAlign='center';
  scCtx2.fillText(t('scatter_xLabel'),W/2,H-22);
}

function scatterLoop(){scAnimId2=requestAnimationFrame(scatterLoop);stepScatter();drawScatter();}

function startScatter(){
  if(scAnimId2)cancelAnimationFrame(scAnimId2);
  const cv=document.getElementById('scatterChart'),wrap=cv.parentElement;
  scW2=wrap.clientWidth||400;scH2=wrap.clientHeight||222;
  cv.width=scW2;cv.height=scH2;
  scCtx2=cv.getContext('2d');
  initScatter();scatterLoop();
}

// ═══ グレースフル・デグラデーション: Chart.js エラーハンドリング ═══
let currentTab = 1;  // コア機能：タブ機能を最上部で初期化（Chart失敗に強い）

function handleChartLoadFailure() {
  console.error('❌ Chart.js CDN 読み込み失敗');
  window._chartLoadFailed = true;
  showChartErrorBanner();
}
// fix: onerror属性はこの関数の定義前に発火するため、属性側ではフラグのみ立て、ここで実際のChart有無を見て処理する
if (typeof Chart === 'undefined') handleChartLoadFailure();

function showChartErrorBanner() {
  const banner = document.createElement('div');
  banner.id = 'chartErrorBanner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    background: rgba(255,34,68,0.08);
    border-bottom: 1px solid #ff2244;
    padding: 10px 20px;
    text-align: center;
    color: #ff8899;
    font-size: 0.7rem;
    font-family: 'Courier New', monospace;
    z-index: 999;
    letter-spacing: 0.05em;
  `;
  banner.innerHTML = `⚠️ <span data-i18n="chart_error_msg">グラフ表示に必要なライブラリが読み込めませんでした。広告ブロッカーの設定をご確認いただくか、再読み込みをお試しください</span>`;
  document.body.insertBefore(banner, document.body.firstChild);
  if (typeof applyI18nAuto === 'function') applyI18nAuto();
}

// ════════════════════════════════════════════════════════════

// グレースフル初期化: Chart.js グローバル設定
if (typeof Chart !== 'undefined') {
  try {
    Chart.defaults.color='#5a6f94';
    Chart.defaults.borderColor='#172340';
    Chart.defaults.font.family="'Courier New', monospace";
    Chart.defaults.font.size=10;
    window._chartReady = true;
  } catch (e) {
    console.warn('⚠️ Chart.js 初期化エラー:', e);
    window._chartReady = false;
  }
} else {
  console.warn('⚠️ Chart.js が読み込まれていません');
  window._chartReady = false;
}

// scatterChart is now Canvas-driven via startScatter()

let timelineChart = null;
if (typeof Chart !== 'undefined') {
  try {
    timelineChart = new Chart(document.getElementById('timelineChart'),{
      type:'line',
      data:{labels:Array.from({length:65},(_,i)=>i),datasets:[
        {label:'Dopamine 熱狂度',data:[],borderColor:'#00ff88',backgroundColor:'rgba(0,255,136,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
        {label:'Social Capital',data:[],borderColor:'#00d4ff',backgroundColor:'rgba(0,212,255,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
        {label:'Infrastructure',data:[],borderColor:'#9945ff',backgroundColor:'rgba(153,69,255,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false}
      ]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:260},
        plugins:{legend:{labels:{color:'#5a6f94',boxWidth:12,font:{size:10}}}},
        scales:{
          x:{title:{display:true,text:'Time Steps →',color:'#5a6f94',font:{size:9}},grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94',maxTicksLimit:8}},
          y:{min:0,max:105,grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94'}}
        }
      }
    });
  } catch (e) {
    console.warn('📊 チャート timelineChart 生成失敗:', e.message);
    timelineChart = null;
  }
} else {
  console.warn('📊 チャート timelineChart をスキップ: Chart.js が利用不可');
}

let radarChart = null;
if (typeof Chart !== 'undefined') {
  try {
    radarChart = new Chart(document.getElementById('radarChart'),{
      type:'radar',
      data:{
        labels:[['Trust','信頼性'],['Resilience','回復力'],['Legitimacy','正当性'],['Info Health','情報健全性'],['Viability','長期持続性'],['Mental WB','精神的健全性']],
        datasets:[
          {label:'Current',data:[100,100,100,100,100,100],backgroundColor:'rgba(0,212,255,.1)',borderColor:'#00d4ff',borderWidth:2,pointBackgroundColor:'#00d4ff',pointRadius:3},
          {label:'Failure Threshold',data:[20,20,20,20,20,20],backgroundColor:'rgba(255,34,68,.04)',borderColor:'rgba(255,34,68,.45)',borderWidth:1,borderDash:[5,4],pointRadius:0}
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:280},
        plugins:{legend:{labels:{color:'#5a6f94',boxWidth:10,font:{size:10}}}},
        scales:{r:{min:0,max:100,grid:{color:'rgba(23,35,64,.8)'},angleLines:{color:'rgba(23,35,64,.8)'},ticks:{color:'#5a6f94',backdropColor:'transparent',stepSize:25,font:{size:8}},pointLabels:{color:'#5a6f94',font:{size:8.5}}}}
      }
    });
  } catch (e) {
    console.warn('📊 チャート radarChart 生成失敗:', e.message);
    radarChart = null;
  }
} else {
  console.warn('📊 チャート radarChart をスキップ: Chart.js が利用不可');
}

function cFor(v){return v<30?'#ff2244':v<60?'#ff6b2b':'#00d4ff'}

function getModeCollapseLog(m){
  // 日本語メイン＋英語サブのラベル定義
  const logRowsJa=['信頼指数    ','回復力      ','正当性      ','情報健全性  ','長期持続性  ','精神的健全性'];
  const logRowsEn=['Trust Index ','Resilience  ','Legitimacy  ','Info Health ','Viability   ','Mental WB   '];
  const logValues=[m.trust,m.resilience,m.legitimacy,m.infoH,m.viability,m.mentalWB];
  const logColors=['#00d4ff','#00ff88','#9945ff','#00d4ff','#ff6b2b','#9945ff'];
  const makeLabel=(ja,en)=>lang==='ja'
    ?`${en}<span style="color:var(--muted);font-size:.82em"> ${ja}</span>`
    :en;
  const normalHTML=logValues.map((v,i)=>{
    const f=Math.round(v/10),bar='█'.repeat(f)+'░'.repeat(10-f);
    const vc=v<30?'#ff2244':v<60?'#ff6b2b':logColors[i];
    return`<span style="color:#3a4f6a">${makeLabel(logRowsJa[i],logRowsEn[i])}</span><span style="color:${vc}"> ${bar} ${Math.round(v)}</span>`;
  });

  // Phase 1: 効率至上主義・既得権益攻撃スローガン（50%〜）
  const phase1Ja=['既得権益の打破','利権の殲滅','非効率の排除','無駄の削減','身を切る改革','弱者利権の殲滅'];
  const phase1En=['PURGE_VESTED_NODES','ELIMINATE_PRIVILEGE','PURGE_INEFFICIENCY','SLASH_WASTE','CUT_TO_THE_BONE','TERMINATE_WELFARE_NODES'];
  // Phase 2: 排外主義・外集団排斥トークン（80%〜で確率的混入）
  const phase2Ja=['敵対イデオロギーの完全掃討','外集団（アウトグループ）の強制排斥','異分子ノードのデリート','単一信念への強制同期（多様性の完全拒絶）'];
  const phase2En=['PURGE_HOSTILE_IDEOLOGY','FORCE_EXPEL_OUTGROUP','DELETE_DEVIANT_NODES','FORCE_SYNC_MONOBELIEF_[DIVERSITY=NULL]'];

  const phase1=lang==='ja'?phase1Ja:phase1En;
  const phase2=lang==='ja'?phase2Ja:phase2En;

  // スローガンバッジ: 具体的政策ゼロを明示
  const sloganTag=`<span style="font-size:.5em;color:#7a4400;background:rgba(255,107,43,.2);border:1px solid rgba(255,107,43,.4);border-radius:2px;padding:0 4px;margin-left:5px;vertical-align:middle">${lang==='ja'?'スローガン':'SLOGAN'}</span><span style="font-size:.48em;color:#3a4050;margin-left:3px;vertical-align:middle">${lang==='ja'?'具体策:ゼロ':'policy:null'}</span>`;
  const radicalTag=`<span style="font-size:.5em;color:#7a0010;background:rgba(255,0,60,.2);border:1px solid rgba(255,0,60,.4);border-radius:2px;padding:0 4px;margin-left:5px;vertical-align:middle">${lang==='ja'?'排外':'RADICAL'}</span>`;

  // v6.33: 読めるように減速（旧: makeP1 0.6〜/ makeP2 0.3〜秒 は速すぎた）＋ opacityを深く落とさない logpulse
  const makeP1=(i,alpha=1)=>{
    const speed=1.2+i*0.28;
    const col=i%2===0?`rgba(255,34,68,${alpha})`:`rgba(255,107,43,${alpha})`;
    return`<span class="mode-log-blink" style="color:${col};animation:logpulse ${speed}s infinite ease-in-out">▌ ${phase1[i%phase1.length]} ▐${sloganTag}</span>`;
  };
  const makeP2=(i,alpha=1)=>{
    const speed=Math.max(1.0,1.3-i*0.08);
    return`<span class="mode-log-blink" style="color:rgba(255,0,60,${alpha});animation:logpulse ${speed}s infinite ease-in-out">▌ ${phase2[i%phase2.length]} ▐${radicalTag}</span>`;
  };

  const fr=filterRate;
  const hdr=document.getElementById('metricLogHeader');
  const note=document.getElementById('metricLogNote');

  // ヘッダーと注釈を状態に応じて更新
  if(hdr&&note){
    if(fr>=80){
      hdr.textContent=tt('[ SLOGAN LOOP — 排外モード突入 ]','[ SLOGAN LOOP — EXCLUSION MODE ]');
      hdr.style.color='var(--red)';
      note.style.display='block';
      Object.assign(note.style,{background:'rgba(255,34,68,.08)',border:'1px solid rgba(255,34,68,.35)',color:'#ff8899'});
      note.innerHTML=lang==='ja'
        ?'⚠ 出力が完全崩壊。多様な指標を処理する能力が消失し、具体性ゼロのスローガンと排外トークンだけが生成されています。<br><strong style="color:#ff6680">これはただのキャッチフレーズです — 政策内容も、実行計画も、根拠データも存在しません。</strong>'
        :'⚠ Output fully collapsed. Only zero-content slogans and exclusionary tokens remain.<br><strong style="color:#ff6680">These are just catchphrases — no policy, no plan, no data.</strong>';
    } else if(fr>=50){
      hdr.textContent=lang==='ja'?'[ METRIC LOG — スローガン混入中 ]':'[ METRIC LOG — SLOGANS DETECTED ]';
      hdr.style.color='var(--ora)';
      note.style.display='block';
      Object.assign(note.style,{background:'rgba(255,107,43,.08)',border:'1px solid rgba(255,107,43,.3)',color:'var(--ora)'});
      note.innerHTML=lang==='ja'
        ?`⚠ <span style="color:var(--ora);font-weight:bold">スローガン</span> タグの行は具体的政策を含まない空のキャッチフレーズです。フィルタリングが進むにつれ、実際の指標がスローガンに置き換わっていきます。`
        :`⚠ Rows tagged <span style="color:var(--ora);font-weight:bold">SLOGAN</span> contain no concrete policy — just empty catchphrases replacing real metrics.`;
    } else {
      hdr.textContent='[ METRIC LOG ]';
      hdr.style.color='var(--muted)';
      note.style.display='none';
    }
  }

  if(fr>=80){
    const p2Rate=(fr-80)/20;
    return Array.from({length:6},(_,i)=>
      Math.random()<p2Rate ? makeP2(i,0.9+Math.random()*0.1) : makeP1(i,0.85+Math.random()*0.15)
    ).join('<br>');
  } else if(fr>=70){
    return [normalHTML[0],makeP1(0,0.88),makeP1(2,0.78),normalHTML[2],makeP1(4,0.88),makeP1(1,0.78)].join('<br>');
  } else if(fr>=65){
    return [normalHTML[0],makeP1(0,0.70),normalHTML[1],makeP1(2,0.65),normalHTML[4],makeP1(4,0.70)].join('<br>');
  } else if(fr>=50){
    return [normalHTML[0],normalHTML[1],makeP1(0,0.60),normalHTML[3],normalHTML[4],makeP1(2,0.55)].join('<br>');
  }
  return normalHTML.join('<br>');
}

function updateAll(){
  const m=metrics(filterRate,ethicsScore,algo);

  if(!animPlaying && timelineChart){
    try {
      const tl=simTimeline(filterRate,ethicsScore,algo);
      timelineChart.data.datasets[0].data=tl.dp;
      timelineChart.data.datasets[1].data=tl.sc;
      timelineChart.data.datasets[2].data=tl.inf;
      timelineChart.update();
    } catch (e) {
      console.warn('📊 timelineChart 更新失敗:', e);
    }
  }

  const avg=(m.trust+m.resilience+m.legitimacy+m.infoH+m.viability+m.mentalWB)/6; // fix: ブロック外で定義（下の diag ボーダー色でも使用するため）
  if(radarChart){
    try {
      radarChart.data.datasets[0].data=[m.trust,m.resilience,m.legitimacy,m.infoH,m.viability,m.mentalWB];
      const rc=avg<38?'#ff2244':avg<62?'#ff6b2b':'#00d4ff';
      radarChart.data.datasets[0].borderColor=rc;
      radarChart.data.datasets[0].backgroundColor=rc+'1a';
      radarChart.data.datasets[0].pointBackgroundColor=rc;
      radarChart.update();
    } catch (e) {
      console.warn('📊 radarChart 更新失敗:', e);
    }
  }

  const ep=Math.round(m.entropy);
  const ec=ep<40?'#00ff88':ep<70?'#ff6b2b':'#ff2244';
  document.getElementById('entropyNum').textContent=ep+'%';
  document.getElementById('entropyNum').style.color=ec;
  document.getElementById('entropyBar').style.cssText=`width:${ep}%;background:${ec}`;
  document.getElementById('entropyStatus').textContent=ep<40?tt('STABLE — システム秩序は保たれています','STABLE — system order is holding'):ep<65?tt('WARNING — 局所的な秩序の乱れを検出','WARNING — local disorder detected'):ep<80?tt('CRITICAL — 社会的コンセンサスが崩壊しつつあります','CRITICAL — social consensus is collapsing'):tt('CHAOS — 全秩序崩壊。過学習により現実OSとの互換性が消失','CHAOS — total collapse. Overfitting severed compatibility with the real-world OS');
  document.getElementById('entropyStatus').style.color=ec;

  const pp=Math.round(m.paranoia);
  const pc=pp<40?'#9945ff':pp<68?'#ff6b2b':'#ff2244';
  document.getElementById('paranoiaNum').textContent=pp+'%';
  document.getElementById('paranoiaNum').style.color=pc;
  document.getElementById('paranoiaBar').style.cssText=`width:${pp}%;background:${pc}`;
  document.getElementById('paranoiaStatus').textContent=pp<40?tt('LOW — ノイズ蓄積は正常範囲内','LOW — noise accumulation within normal range'):pp<60?tt('ELEVATED — 認知バイアスの増幅を検出','ELEVATED — cognitive bias amplification detected'):pp<80?tt('HIGH — 集団パラノイアの発生確率が上昇','HIGH — collective paranoia risk rising'):tt('CRITICAL — メンタルヘルス・インフラが臨界点に到達','CRITICAL — mental-health infrastructure at critical point');
  document.getElementById('paranoiaStatus').style.color=pc;

  ['scVal','infVal'].forEach((id,i)=>{
    const v=i===0?m.socialCap:m.infra;
    document.getElementById(id).textContent=Math.round(v);
    document.getElementById(id).style.color=cFor(v);
  });
  document.getElementById('dpVal').textContent=Math.round(m.dopamine);
  const dv=Math.round(m.diversity);
  document.getElementById('divVal').textContent=dv;
  document.getElementById('divVal').style.color=dv<30?'#ff2244':dv<60?'#ff6b2b':'#00ff88';

  document.getElementById('diag').textContent=getDiag(m);
  document.getElementById('diag').style.borderLeftColor=m.crash?'#ff2244':avg<55?'#ff6b2b':'#00d4ff';

  updateHistRef();

  // v6.333: 危機（赤）/ 模範（緑）/ 非表示 の3状態バナー
  const p1Good=!m.crash&&m.entropy<28&&m.diversity>70&&m.infoH>75&&m.socialCap>65;
  if(m.crash){
    setVerdictBanner('alertBanner','crash','banner_p1');
    const parts=[];
    if(m.entropy>76)parts.push(tt(`エントロピー ${Math.round(m.entropy)}% — 社会秩序が臨界値を突破`,`Entropy ${Math.round(m.entropy)}% — social order breached critical threshold`));
    if(m.infra<18)parts.push(tt(`インフラ ${Math.round(m.infra)} — 医療・交通網が機能停止`,`Infrastructure ${Math.round(m.infra)} — medical & transport networks down`));
    if(m.socialCap<18)parts.push(tt(`ソーシャルキャピタル ${Math.round(m.socialCap)} — 相互信頼が消滅`,`Social capital ${Math.round(m.socialCap)} — mutual trust vanished`));
    parts.push(tt('過学習により現実世界のOSとの互換性が失われました。','Overfitting severed compatibility with the real-world OS.'));
    document.getElementById('alertMsg').textContent=parts.join('  |  ');
    discover('d_p1_crash');noteSessionPage(1);
  } else if(p1Good){
    setVerdictBanner('alertBanner','good','banner_p1_good');
    document.getElementById('alertMsg').textContent=tt('🌐 エントロピー低位 ／ 情報多様性が保たれ、現実OSと同期しています','🌐 Low entropy · information diversity preserved · synced with the real-world OS');
    discover('d_p1_good');noteSessionPage(1);
  } else {
    // v6.338: 中間状態を3つに区別（近クラッシュの分断 / エコーチェンバー / あと一歩で健全）
    let wkey,wmsg;
    if(m.entropy>=65){
      wkey='banner_p1_warn_hot';
      wmsg=tt(`エントロピー ${Math.round(m.entropy)}% ／ 扇動と分断が進み、社会の信頼が急速に痩せている（崩壊の一歩手前）`,`Entropy ${Math.round(m.entropy)}% · agitation and division are eroding social trust fast — one step from collapse`);
    } else if(m.infoH<50){
      wkey='banner_p1_warn';
      wmsg=tt(`情報健全性 ${Math.round(m.infoH)} ／ 同質な声ばかりが循環し、情報空間が濁りはじめている（エコーチェンバー化）`,`Info health ${Math.round(m.infoH)} · the same voices keep circulating — the information space is clouding over (echo chamber)`);
    } else {
      wkey='banner_p1_warn_near';
      wmsg=tt(`情報多様性 ${Math.round(m.diversity)} ／ おおむね健全。あと一歩で「澄んだ情報空間」に届く`,`Diversity ${Math.round(m.diversity)} · mostly healthy — one step from a clear information space`);
    }
    setVerdictBanner('alertBanner','warn',wkey);
    document.getElementById('alertMsg').textContent=wmsg;
  }

  document.getElementById('metricLog').innerHTML=getModeCollapseLog(m);

  // v6.3: プリセット適用で安定/崩壊が確定した瞬間だけ共有ボタンを出す（P2の shockShareBtn パターン踏襲）
  const p1b=document.getElementById('p1ShareBtn');
  const p1rw=document.getElementById('p1RewindBtn');
  if(p1b){
    if(activePreset){
      p1ShareState={type:m.crash?'crash':'stable'};
      p1b.style.display='block';
      p1b.textContent=tt('▶ この結果を送る','▶ Share this result');
    }else{
      p1ShareState=null;
      p1b.style.display='none';
    }
  }
  // v6.345: リワインドボタンはクラッシュ時のみ表示（プリセット不要）
  if(p1rw){
    if(m.crash){
      p1rw.style.display='block';
      p1rw.textContent=t('rewind_btn');
      window._rewindSuccess=null;
    }else{
      p1rw.style.display='none';
    }
  }
  checkScenarioGoal(m);
}

function getDiag(m){
  if(m.crash)return tt('[ FATAL ] 社会システムが崩壊状態に入りました。過学習によりOSと現実の互換性が完全消失。再起動不能な状態です。','[ FATAL ] The social system has collapsed. Overfitting fully severed OS-reality compatibility. Reboot impossible.');
  if(filterRate>70&&ethicsScore<30)return tt('[ CRITICAL ] エコーチェンバー×ポピュリズムの複合障害。外部入力を全拒絶する自己参照ループが進行中。','[ CRITICAL ] Compound failure: echo chamber × populism. A self-referential loop rejecting all external input is underway.');
  if(filterRate>65)return tt('[ WARNING ] 過学習が進行中。訓練データ（支持者）への過適合が進み、現実世界への対応力が急落しています。','[ WARNING ] Overfitting in progress. Over-adaptation to training data (supporters) is crashing real-world responsiveness.');
  if(ethicsScore<35)return tt(`[ WARNING ] ${algo==='greedy'?'Greedyモードで':'DPモードでも'}倫理スコアが危険域に入りました。短期ドーパミン最大化が長期コストとして蓄積中。`,`[ WARNING ] Ethics entered the danger zone ${algo==='greedy'?'under Greedy':'even under DP'}. Short-term dopamine maximization is accruing long-term cost.`);
  if(algo==='greedy'&&ethicsScore<65)return tt('[ NOTICE ] Greedyアルゴリズムが局所最適解に収束中。社会的コストが水面下で蓄積、将来的な急落リスクが上昇中。','[ NOTICE ] Greedy is converging on a local optimum. Social costs accumulate beneath the surface; crash risk rising.');
  if(algo==='dp'&&ethicsScore>70&&filterRate<30)return tt('[ OPTIMAL ] DP + 高倫理 + 低フィルタリング。長期最適解への収束が見込まれます。システムは良好。','[ OPTIMAL ] DP + high ethics + low filtering. Convergence to the global optimum expected. System healthy.');
  return tt('[ OK ] システムは安定動作中。パラメーターを操作して崩壊シナリオをシミュレートできます。','[ OK ] System stable. Adjust parameters to simulate collapse scenarios.');
}

function applyI18n(){
  ['hdrSub','simLbl','presetLbl','paramTitle','paramDesc','f1desc','f1L','f1R','f2desc','f2L','f2R',
   'f3desc','dpL','dpS','grL','grS','shareBtnFull','stateTitle','eLbl','pLbl','resetLbl',
   's1sub','s2sub','s3sub','s4sub','leg1','leg2','leg3','leg4'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent=t(id);
  });
  document.getElementById('langBtn').textContent=t('langBtn');
  document.getElementById('shareBtn').textContent=t('shareBtn');
  const menuBtn = document.getElementById('menuBtn');
  if(menuBtn) menuBtn.textContent = t('menu_more');
  const pb=document.getElementById('playBtn');
  if(pb) pb.textContent=animPlaying?t('playStop'):t('playPlay');
  const pl=document.getElementById('pinLabel');
  if(pl) pl.textContent=pinnedData?t('pinClear'):t('pinLock');
  ['f1lbl','f2lbl','f3lbl'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const key=id.replace('lbl','');
    const tagMap={f1:'<span class="tag tc">OVERFITTING</span>',f2:'<span class="tag tg">GOVERNANCE</span>',f3:'<span class="tag to">STRATEGY</span>'};
    el.innerHTML=t(id)+' '+tagMap[key];
  });
  const pMap={weimar:'pWeimar',sns:'pSns',nordic:'pNordic',techno:'pTechno',populism:'pPop'};
  Object.entries(pMap).forEach(([pid,k])=>{
    const el=document.getElementById('p-'+pid);if(el)el.textContent=t(k);
  });
  // System State Monitor ラベル（日本語メイン＋英語サブ）
  const stateEn={lbl_scVal:'SOCIAL CAPITAL',lbl_dpVal:'DOPAMINE INDEX',lbl_infVal:'INFRASTRUCTURE',lbl_divVal:'DIVERSITY INDEX'};
  ['lbl_scVal','lbl_dpVal','lbl_infVal','lbl_divVal'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    if(lang==='ja'){
      el.textContent=t(id);
    } else {
      el.textContent=stateEn[id];
    }
  });
  // Social Health Timeline のデータセット名
  if(timelineChart){
    timelineChart.data.datasets[0].label=t('chart_dopamine');
    timelineChart.data.datasets[1].label=t('chart_socialCap');
    timelineChart.data.datasets[2].label=t('chart_infra');
    timelineChart.update('none');
  }
  // Radar chart のデータセット名
  if(radarChart){
    radarChart.data.datasets[0].label=t('radar_current');
    radarChart.data.datasets[1].label=t('radar_threshold');
    radarChart.update('none');
  }
  applyI18nAuto();
  syncDocLinks();
  syncTownPlaceholder();
  // 言語切替後、表示中のバナーに街名を再展開（bstガードをリセット）
  document.querySelectorAll('.alert[data-bst]').forEach(al=>{delete al.dataset.bst;});
  document.documentElement.lang=lang;
  updateAll();
  updateAllP2(); // 動的ステータス文の言語を即時反映
}

// v5.2: data-i18n属性ベースの自動翻訳（日本語原文は初回にDOMからキャッシュ）
function applyI18nAuto(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.dataset.i18n;
    if(I18N.ja[k]===undefined) I18N.ja[k]=el.innerHTML; // 原文(ja)をキャッシュ
    const v=I18N[lang][k];
    if(v!==undefined) el.innerHTML=v;
  });
}

function toggleLang(){lang=lang==='ja'?'en':'ja';applyI18n();if(typeof updateDiscoveryCounter==='function')updateDiscoveryCounter();}

// v6.345: プライバシーファーストの analytics ラッパー（外部スクリプト未導入時は no-op）
function track(event,props){
  // task6: 全イベント共通プロパティ app_platform（web / ios / android）を付与
  const p=Object.assign({app_platform:(window.SSD&&SSD.platform)||'web'},props||{});
  try{if(window.plausible)window.plausible(event,{props:p});}catch(e){}
}

// v6.343: ドキュメント導線の言語連動
function docUrl(name){return 'https://github.com/larai-w/social-system-debugger/blob/main/docs/'+name+(lang==='en'?'.en':'')+'.md';}
function syncDocLinks(){document.querySelectorAll('a.doclink[data-doc]').forEach(a=>{a.href=docUrl(a.dataset.doc);});}

// v6.345: 街の名前 helpers
function getTownName(){try{return localStorage.getItem('ssd_town_name')||'';}catch(e){return '';}}
function saveTownName(name){try{if(name&&name.trim())localStorage.setItem('ssd_town_name',name.trim());else localStorage.removeItem('ssd_town_name');}catch(e){}}
function expandTown(html){
  const n=getTownName();if(!n)return html;
  return lang==='ja'
    ? html.replace(/あなたの街/g,n)
    : html.replace(/YOUR TOWN/g,n.toUpperCase()).replace(/your town/gi,n);
}
function syncTownPlaceholder(){
  const inp=document.getElementById('townNameInput');if(!inp)return;
  inp.placeholder=lang==='ja'?'例: 東京 / 地元の市 / 未来の街':'e.g. Springfield / My city / Future town';
  inp.value=getTownName();
}

// v6.331: 詳細設定アコーディオンの開閉（ページ内完結・DOMは残すので値計算に影響なし）
function toggleAcc(id,btn){
  const el=document.getElementById(id);if(!el)return;
  const open=el.style.display==='none';
  el.style.display=open?'block':'none';
  if(btn)btn.classList.toggle('open',open);
}

function setPreset(id){
  const p=PRESETS[id];if(!p)return;
  filterRate=p.f;ethicsScore=p.e;algo=p.a;
  document.getElementById('filterRate').value=filterRate;
  document.getElementById('ethicsScore').value=ethicsScore;
  setPct(document.getElementById('filterRate'));
  setPct(document.getElementById('ethicsScore'));
  document.getElementById('filterVal').textContent=filterRate+'%';
  document.getElementById('ethicsVal').textContent=ethicsScore;
  setAlgoUI(algo);
  Object.keys(PRESETS).forEach(k=>document.getElementById('p-'+k)?.classList.remove('sel'));
  document.getElementById('p-'+id)?.classList.add('sel');
  activePreset=id;
  stopAnimation();
  restartAgents();
  updateAll();
  showShareToast({kind:'preset',page:1,preset:id});
  notePreset(1,id); if(id==='weimar')discover('d_p1_weimar'); if(id==='nordic')discover('d_p1_nordic');
}

function shareURL(){
  const url=buildShareURL();
  try{
    navigator.clipboard.writeText(url).then(()=>{
      ['shareBtn','shareBtnFull'].forEach(id=>{
        const el=document.getElementById(id);if(!el)return;
        const orig=el.textContent;
        el.textContent='✓ COPIED!';el.classList.add('ok');
        setTimeout(()=>{el.textContent=orig;el.classList.remove('ok')},2000);
      });
    });
  }catch(e){prompt('Copy this URL:',url)}
}

function openModal(key){
  const d=MDATA[key];if(!d)return;
  document.getElementById('mTag').textContent=d.tag;
  document.getElementById('mTitle').textContent=lang==='ja'?d.jaTitle:d.enTitle;
  document.getElementById('mBody').innerHTML=lang==='ja'?d.jaBody:d.enBody;
  document.getElementById('mFormula').textContent=d.formula;
  document.getElementById('modal').classList.add('on');
}
function closeModal(){document.getElementById('modal').classList.remove('on')}
function closeModalIf(e){if(e.target===document.getElementById('modal'))closeModal()}

function setPct(el){el.style.setProperty('--pct',(el.value-el.min)/(el.max-el.min)*100+'%')}

function setAlgoUI(a){
  document.getElementById('btnDP').classList.toggle('on',a==='dp');
  document.getElementById('btnGreedy').classList.toggle('on',a==='greedy');
}

function setAlgo(a){
  algo=a;setAlgoUI(a);
  Object.keys(PRESETS).forEach(k=>document.getElementById('p-'+k)?.classList.remove('sel'));
  activePreset=null;updateAll();
}

document.getElementById('filterRate').addEventListener('input',function(){
  filterRate=+this.value;
  document.getElementById('filterVal').textContent=filterRate+'%';
  setPct(this);
  Object.keys(PRESETS).forEach(k=>document.getElementById('p-'+k)?.classList.remove('sel'));
  activePreset=null;updateAll();
});

document.getElementById('ethicsScore').addEventListener('input',function(){
  ethicsScore=+this.value;
  document.getElementById('ethicsVal').textContent=ethicsScore;
  setPct(this);
  Object.keys(PRESETS).forEach(k=>document.getElementById('p-'+k)?.classList.remove('sel'));
  activePreset=null;updateAll();
});

document.getElementById('historicalImmunity').addEventListener('input',function(){
  historicalImmunity=+this.value;
  document.getElementById('immunityVal').textContent=historicalImmunity+'%';
  const pct=(historicalImmunity/100*100)+'%';
  this.style.background=`linear-gradient(90deg,var(--pur) ${pct},var(--bdr) ${pct})`;
});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeIntro();closeAudit();}});

function switchTab(n){
  currentTab = n;
  [1,2,3,4].forEach(i=>{
    document.getElementById('page'+i).classList.toggle('active', n===i);
    document.getElementById('tab'+i+'Btn').classList.toggle('active', n===i);
  });
  if(n===2){ updateAllP2(); startP2Tick(); } else { stopP2Tick(); } // v6.346: 後継者ストックはP2表示中のみ時間経過
  if(n===3&&!p3Started) startP3(); // 初回のみ起動（再訪時はシム状態を保持）
  if(n===4&&!p4Started) startP4();
  refitCanvases(); // 非表示中の画面回転・リサイズに追従
  // v6.332: アドレスバーの tab のみ同期（他のシナリオパラメータ f/e/s/dx… は不変）
  try{const u=new URL(location.href);u.searchParams.set('tab',n);history.replaceState(null,'',u);}catch(e){}
}

// ── PAGE 2 STATE ──────────────────────────────────────────
let shrinkRate=10, dxRate=30, algoP2='greedy', ethicsP2=68; // v6.334: 初期状態から p2Good（平穏）を満たす
let p2AnimPlaying=false, p2AnimTimer=null, p2AnimStep=0, p2FullTimeline=null;
let p2LogEntries=[];
// v6.346: 後継者ストック（暗黙知の残量 0-100）。遅い状態変数（Task B）。DXが低いと引退で減少・高いと形式知化で回復
let skillStock=60;
let skillLost=false; // 0到達で技術ごと消滅＝DXを上げても回復不能（Public Rebootでのみ復活）
let p2TickTimer=null;
// v6.346 Task C: ヘリ3状態化。WEATHER HOLD＝ショック中の一時停止（有視界飛行の制約）。時間経過で自動復帰
let heliWeatherHoldUntil=0;
let prevHeliState='operational';
const HELI_HOLD_MS=3600;
let p2LogTimer=null;
let publicReboot=false;
let shockState=null;
// v6.3: P1/P3/P4 判定確定ステート（shockStateに相当。null=判定未確定でボタン非表示）
let p1ShareState=null, p3ShareState=null, p4ShareState=null;
// v6.3: 結果カード生成用スナップショット（アニメ由来の判定値を保持）
let p3Snapshot={integ:100,dop:0,fooled:0};
let p4Snapshot={drop:0,ratio:100};
// v6.31: フリッカー対策 — 毎フレーム評価される揺れ値のヒステリシス保持状態
//   （P3の攻撃/バナー、P4のバナーが閾値付近で60fpsトグルするのを防ぐ）
let p3AttackHold=0;      // attackEdges>0 の残存フレーム数（>0でACTIVE扱い）
let p3BannerOn=false;    // P3アラートバナーのヒステリシス状態
let p4BannerOn=false;    // P4アラートバナーのヒステリシス状態

// v6.346: 運用ログの項目名を日本語版では日本語に（ステータスは英語のまま）。lang で切替
const P2_LOG_NORMAL_JA=[
  'インフラ保守予定 … OK','救命ヘリ出動状況 … ONLINE',
  'ブランド生産 … ACTIVE','予算配分 … BALANCED',
  'スマート集約運用 … RUNNING','DXパイプライン … SYNCED',
  '保守キュー … CLEAR','SECTOR-T 状態 … GREEN',
];
const P2_LOG_WARN_JA=[
  'インフラ劣化 … WARNING','財政赤字検知 … ALERT',
  '救命ヘリ燃料備蓄 … LOW','保守の先送り … QUEUED',
  '修復キュー逼迫 … HIGH','コスト超過検知 … TRUE',
];
const P2_LOG_BLAME_JA=[
  '他責転嫁の開始 … PRESS_CONF','責任所在 … DENIED',
  '原因の指定先 … EXTERNAL','行政CPUの再配分 … →BLAME_100%',
  '修復キュー … SUSPENDED','インフラ保守状況 … ABANDONED',
  '説明責任チェック … REFUSED','外部要因の主張 … LOOP_x99',
];
const P2_LOG_REBOOT_JA=[
  '公共性リブート … ACTIVE','市場ロジック … SUSPENDED',
  '冗長性バッファ … RESTORING','救命ヘリ強制稼働 … FORCED_ONLINE',
  'インフラ劣化速度 … HALVED','予算消費 … ELEVATED',
  '公共サービス優先度 … MAXIMUM','効率ロジック … OVERRIDDEN',
];
const P2_LOG_SHOCK_JA=[
  'ブラックスワン事象 … DETECTED','システムショック … INJECTED',
  '冗長性テスト … RUNNING','インフラ耐性試験 … CRITICAL',
  '緊急プロトコル … ACTIVATED','復元力チェック … IN_PROGRESS',
];
const P2_LOG_NORMAL_EN=[
  'INFRA_MAINT_SCHEDULED ........ OK','HELI_DISPATCH_STATUS ......... ONLINE',
  'BRAND_PRODUCTION ............. ACTIVE','BUDGET_ALLOCATION ............ BALANCED',
  'SMART_SHRINK_OPS ............. RUNNING','DX_PIPELINE .................. SYNCED',
  'MAINTENANCE_QUEUE ............ CLEAR','SECTOR_T_STATUS .............. GREEN',
];
const P2_LOG_WARN_EN=[
  'INFRA_DEGRADATION ............ WARNING','BUDGET_DEFICIT_DETECTED ...... ALERT',
  'HELI_FUEL_RESERVE ............ LOW','MAINTENANCE_DEFERRED ......... QUEUED',
  'REPAIR_QUEUE_OVERFLOW ........ HIGH','COST_OVERRUN_DETECTED ........ TRUE',
];
const P2_LOG_BLAME_EN=[
  'BLAME_SHIFT_INITIATED ........ PRESS_CONF','RESPONSIBILITY_MATRIX ........ DENIED',
  'FAULT_VECTOR_ASSIGNED ........ EXTERNAL','ADMIN_CPU_REROUTED ........... →BLAME_100%',
  'REPAIR_QUEUE ................. SUSPENDED','INFRA_MAINT_STATUS ........... ABANDONED',
  'ACCOUNTABILITY_CHECK ......... REFUSED','EXTERNAL_CAUSE_CITED ......... LOOP_x99',
];
const P2_LOG_REBOOT_EN=[
  'PUBLIC_REBOOT_MODE ........... ACTIVE','MARKET_LOGIC ................. SUSPENDED',
  'REDUNDANCY_BUFFER ............ RESTORING','HELI_OVERRIDE ................ FORCED_ONLINE',
  'INFRA_DECAY_RATE ............. HALVED','BUDGET_CONSUMPTION ........... ELEVATED',
  'PUBLIC_SERVICE_PRIORITY ...... MAXIMUM','EFFICIENCY_LOGIC ............. OVERRIDDEN',
];
const P2_LOG_SHOCK_EN=[
  'BLACK_SWAN_EVENT ............. DETECTED','SYSTEM_SHOCK ................. INJECTED',
  'REDUNDANCY_TEST .............. RUNNING','INFRA_STRESS_TEST ............ CRITICAL',
  'EMERGENCY_PROTOCOL ........... ACTIVATED','RESILIENCE_CHECK ............. IN_PROGRESS',
];

function calcRedundancyBuffer(s,al,reboot){
  const sf=s/100,isG=al==='greedy';
  let base=clamp(100-sf*52-(isG?32:0),0,100);
  if(reboot)base=clamp(base+42,0,100);
  return Math.round(base);
}

// v6.346: 後継者ストック → ブランド維持力のゲート（崖関数）。ss≥30で満額、<12で急落＝当面平穏でもある日突然の崩落
function p2SkillFactor(ss){ if(ss>=30)return 1; if(ss>=12)return 0.55+(ss-12)/40; return (ss/12)*0.55; }

function metricsP2(s,d,al,e){
  const sf=s/100,df=d/100,isG=al==='greedy',ef=e/100;
  const redundancy=calcRedundancyBuffer(s,al,publicReboot);
  const dampener=publicReboot?0.5:1.0;
  const infraBase=clamp(100-(1-sf)*35*dampener-(1-df)*15-(isG?(1-ef)*28:6)*dampener,0,100);
  const infraError=infraBase<65;
  // Root権限制限中はリーダー単独の破壊的操作（他責デッドロック）が多重承認でブロックされる
  const deadlock=!rootRestricted&&ef<0.4&&isG&&infraError;
  const cpuBlame=deadlock?100:clamp((1-ef)*22+(isG?14:0),0,rootRestricted?35:75);
  const cpuRepair=100-cpuBlame;
  let shockInfraPenalty=0,shockBudgetPenalty=0;
  if(shockState){
    if(shockState.type==='crash'){shockInfraPenalty=999;shockBudgetPenalty=999;}
    else if(shockState.type==='survived'){shockBudgetPenalty=35;}
    else{shockInfraPenalty=38;}
  }
  // v6.346 Task A/B: 因果連鎖 brand → 税収(budget) → 保守財源 → infra → heli。skillStock が brand を支える遅い状態変数
  const rebootCost=publicReboot?16:0;
  const brandPotential=clamp(45+sf*16+(isG?-12:12)+ef*8,0,100);
  const brand=clamp(brandPotential*p2SkillFactor(skillStock),0,100);
  const budgetStruct=clamp(42+brand*0.55-(isG?(1-ef)*30:6)-(1-sf)*10-rebootCost-(rootRestricted?5:0),0,100); // brand=地域の税収基盤
  const budgetShortfall=budgetStruct<45?(45-budgetStruct)*1.2:0; // 保守予算が薄いとインフラ維持の実効値が下がる
  let infra=deadlock?clamp(infraBase-42,0,100):clamp(infraBase+(cpuRepair/100)*14-budgetShortfall,0,100);
  infra=Math.max(0,infra-shockInfraPenalty);
  const heliOp=shockState?.type==='crash'?false:(publicReboot?true:(infra>35&&cpuRepair>25&&ef>=0.3));
  let budget=Math.max(0,budgetStruct-shockBudgetPenalty);
  const crash=(!heliOp&&infra<20)||budget<8||(shockState?.type==='crash');
  return{infra,heliOp,brand,budget,cpuBlame,cpuRepair,deadlock,crash,infraError,redundancy,skillStock};
}

function simTimelineP2(s,d,al,e,steps=65){
  const sf=s/100,df=d/100,isG=al==='greedy',ef=e/100;
  const dampener=publicReboot?0.5:1.0;
  const rebootCost=publicReboot?16:0;
  const infra=[],brand=[],budgetArr=[],heli=[];
  const n=()=>randn(0,1.8);
  for(let i=0;i<steps;i++){
    const tn=i/steps;
    if(isG&&ef<0.4&&!publicReboot){
      const col=tn>0.25?Math.pow((tn-0.25)/0.75,1.4):0;
      const iv=clamp(92-col*96+n(),0,100);
      infra.push(iv); brand.push(clamp(50+df*18-col*72+n(),0,100));
      budgetArr.push(clamp(86-col*94+n(),0,100)); heli.push(clamp(iv>35?100-col*118:0+n(),0,100));
    } else if(!isG&&ef>0.55&&sf>0.45&&df>0.45){
      const g=1-Math.exp(-2.8*tn);
      infra.push(clamp(55+g*40*sf+n(),0,100)); brand.push(clamp(44+g*48*df+n(),0,100));
      budgetArr.push(clamp(50+g*44*sf-rebootCost*0.4+n(),0,100));
      heli.push(clamp(publicReboot?88+g*10+n():72+g*24+n(),0,100));
    } else {
      const decay=(1-sf)*0.22*dampener+(1-df)*0.18+(isG?(1-ef)*0.28:0.06)*dampener;
      infra.push(clamp(88-decay*tn*80+n(),0,100)); brand.push(clamp(62-(1-df)*tn*45+n(),0,100));
      budgetArr.push(clamp(78-decay*tn*70-rebootCost*tn*0.6+n(),0,100));
      heli.push(clamp(publicReboot?Math.max(60,82-decay*tn*30+n()):82-decay*tn*88+n(),0,100));
    }
  }
  return{infra,brand,budget:budgetArr,heli};
}

// v6.346: 後継者ストックの可視化とリアルタイム減衰（Task B）。この段階ではまだブランドには波及させない
function renderP2Skill(){
  const el=document.getElementById('p2SkillNum'),bar=document.getElementById('p2SkillBar'),st=document.getElementById('p2SkillStatus');
  if(!el||!bar)return;
  const v=Math.round(skillStock);
  const c=v<15?'#ff2244':v<35?'#ff6b2b':'#00ff88';
  el.textContent=v; el.style.color=c;
  bar.style.cssText=`width:${v}%;background:${c}`;
  if(st){
    st.textContent=skillLost?tt('技術ごと消滅（回復には再公営化が必要）','Skills extinct (needs re-municipalization)'):v<15?tt('後継者断絶が目前','Succession about to break'):v<35?tt('担い手が引退中','Holders retiring'):tt('技能が継承されている','Skills being handed down');
    st.style.color=c;
  }
}
function tickSkillStock(){
  const df=dxRate/100;
  if(publicReboot){ skillLost=false; skillStock=clamp(Math.max(skillStock,60),0,100); } // 再公営化＝公的な技能継承プログラムで復活
  else if(skillLost){ /* 技術ごと消滅：DXを最大にしても回復しない */ }
  else if(df<0.25){ skillStock=clamp(skillStock-(0.25-df)*15,0,100); if(skillStock<=0){skillStock=0;skillLost=true;} } // 引退で減少（DX0なら約12tickで崖）→0で消滅
  else if(df>0.45){ skillStock=clamp(skillStock+(df-0.45)*8,0,100); }         // DXが十分なら形式知化（シリアライズ）で緩やかに回復
  // 0.25〜0.45 は均衡帯（デフォルトDX30はここ＝減らない）
  updateAllP2(); // skillStock は brand/budget/infra/heli に波及するため毎tick全体を再計算
}
function startP2Tick(){ if(!p2TickTimer) p2TickTimer=setInterval(tickSkillStock,1200); }
function stopP2Tick(){ if(p2TickTimer){ clearInterval(p2TickTimer); p2TickTimer=null; } }

// v6.346 Task C: 構造条件(heliOp)＋WEATHER HOLDタイマーから3状態を導出
function getHeliState(m){
  if(shockState&&Date.now()<heliWeatherHoldUntil) return 'hold'; // ショック中の悪天候で一時見合わせ（時間経過で自動復帰）
  return m.heliOp ? 'operational' : 'suspended';
}
// 因果連鎖を1行ずつログへ流す（なぜ止まった/戻ったかを式でなく伝播として読ませる）
function streamP2Cascade(lines,cls){
  lines.forEach((ln,i)=>setTimeout(()=>{
    const now=new Date();
    const ts=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    p2LogEntries.push(`<span class="${cls}">${ts} ${ln}</span>`);
    if(p2LogEntries.length>7) p2LogEntries.shift();
    const el=document.getElementById('p2Log'); if(el) el.innerHTML=p2LogEntries.join('<br>');
  }, i*480));
}

function updateAllP2(){
  const m=metricsP2(shrinkRate,dxRate,algoP2,ethicsP2);
  // Infra gauge
  const ic=m.infra<30?'#ff2244':m.infra<60?'#ff6b2b':'#00d4ff';
  document.getElementById('p2InfraNum').textContent=Math.round(m.infra);
  document.getElementById('p2InfraNum').style.color=ic;
  document.getElementById('p2InfraBar').style.cssText=`width:${m.infra}%;background:${ic}`;
  const iStatus=m.infra<30?tt('CRITICAL — インフラが臨界点以下','CRITICAL — infrastructure below critical point'):m.infra<60?tt('WARNING — 劣化進行中','WARNING — degradation in progress'):'STABLE';
  document.getElementById('p2InfraStatus').textContent=iStatus;
  document.getElementById('p2InfraStatus').style.color=ic;
  // Heli（v6.346 Task C: 3状態化 OPERATIONAL / WEATHER HOLD / SUSPENDED）
  const hs=document.getElementById('p2HeliStatus');
  const hl=document.getElementById('p2HeliLabel');
  const hi=document.getElementById('p2HeliIcon');
  const hb=document.getElementById('p2HeliBar');
  const hd=document.getElementById('p2HeliDetail');
  const hstate=getHeliState(m);
  const hcol=hstate==='operational'?'var(--green)':hstate==='hold'?'var(--ora)':'var(--red)';
  hs.className='heli-badge '+(hstate==='operational'?'heli-on':hstate==='hold'?'heli-hold':'heli-off');
  hs.textContent=hstate==='operational'?'● ONLINE':hstate==='hold'?'◐ WEATHER HOLD':'■ SUSPENDED';
  hl.style.color=hcol;
  hl.textContent=hstate==='operational'?tt('OPERATIONAL — 常時稼働中','OPERATIONAL — always on duty'):hstate==='hold'?tt('WEATHER HOLD — 悪天候で一時見合わせ','WEATHER HOLD — grounded by weather'):tt('LONG-TERM SUSPENSION — 救命ヘリ長期運休','LONG-TERM SUSPENSION — rescue heli grounded');
  hi.style.filter=hstate==='operational'?'drop-shadow(0 0 12px var(--green))':hstate==='hold'?'drop-shadow(0 0 12px var(--ora))':'drop-shadow(0 0 12px var(--red)) grayscale(1)';
  hb.style.cssText=`width:${hstate==='operational'?100:hstate==='hold'?50:5}%;background:${hcol}`;
  hd.textContent=hstate==='operational'?tt('Dispatch Ready — 出動待機中','Dispatch Ready'):hstate==='hold'?tt('有視界飛行の制約で一時停止（天候回復後に自動復帰）','VFR limits — temporary hold (auto-returns after the storm)'):tt('MALFUNCTION — 修復予算なし（他責処理中）','MALFUNCTION — no repair budget (blame-shifting in progress)');
  hd.style.color=hstate==='operational'?'var(--muted)':hcol;
  // 状態遷移で因果連鎖ログを流す（SUSPENDED入り＝停止の伝播 / 復帰＝回復の伝播）
  if(hstate!==prevHeliState){
    if(hstate==='suspended'&&prevHeliState!=='suspended'){
      streamP2Cascade([
        tt('BRAND_REVENUE ↓  地域ブランドの税収が細る','BRAND_REVENUE ↓  local brand tax revenue thins'),
        tt('TAX_BASE ↓  自治体の税収基盤が縮小','TAX_BASE ↓  the municipal tax base shrinks'),
        tt('MAINT_BUDGET ↓  インフラ保守予算が不足','MAINT_BUDGET ↓  infrastructure maintenance underfunded'),
        tt('INFRA < 35%  維持力が臨界点を割る','INFRA < 35%  capacity falls below the critical point'),
        tt('HELI: SUSPENDED  救命ヘリ長期運休','HELI: SUSPENDED  rescue helicopter grounded')
      ],'p2log-blame');
    } else if(prevHeliState==='suspended'&&hstate==='operational'){
      streamP2Cascade([
        tt('MAINT_BUDGET ↑  税収が戻り保守予算が回復','MAINT_BUDGET ↑  revenue returns, maintenance refunded'),
        tt('INFRA > 35%  維持力が臨界点を回復','INFRA > 35%  capacity recovers above the critical point'),
        tt('HELI: OPERATIONAL  救命ヘリ復帰','HELI: OPERATIONAL  rescue helicopter back on duty')
      ],'p2log-normal');
    }
    prevHeliState=hstate;
  }
  // Brand
  const bc=m.brand<30?'#ff2244':m.brand<60?'#ff6b2b':'#00ff88';
  document.getElementById('p2BrandNum').textContent=Math.round(m.brand);
  document.getElementById('p2BrandNum').style.color=bc;
  document.getElementById('p2BrandLarge').textContent=Math.round(m.brand);
  document.getElementById('p2BrandLarge').style.color=bc;
  document.getElementById('p2BrandBar').style.cssText=`width:${m.brand}%;background:${bc}`;
  const bs=m.brand<30?tt('COLLAPSE RISK — 後継者断絶危機','COLLAPSE RISK — successor extinction'):m.brand<60?tt('DEGRADING — DX投資不足','DEGRADING — DX under-investment'):tt('SUSTAINABLE — ブランド持続中','SUSTAINABLE — brand holding');
  document.getElementById('p2BrandStatus').textContent=bs;
  document.getElementById('p2BrandStatus').style.color=bc;
  document.getElementById('p2BrandDiag').textContent=getP2BrandDiag(m);
  renderP2Skill();
  // Budget
  const budc=m.budget<20?'#ff2244':m.budget<50?'#ff6b2b':'#00d4ff';
  document.getElementById('p2BudgetNum').textContent=m.budget<8?'BANKRUPT':Math.round(m.budget);
  document.getElementById('p2BudgetNum').style.color=budc;
  // CPU
  document.getElementById('p2CpuRepair').style.width=m.cpuRepair+'%';
  document.getElementById('p2CpuBlame').style.width=m.cpuBlame+'%';
  document.getElementById('p2CpuRepairPct').textContent=Math.round(m.cpuRepair);
  document.getElementById('p2CpuBlamePct').textContent=Math.round(m.cpuBlame);
  // Deadlock
  const dp=document.getElementById('p2DeadlockPanel');
  const db=document.getElementById('p2DeadlockBadge');
  if(m.deadlock){
    dp.className='deadlock-panel deadlock-on';
    dp.textContent=tt('⚠ 他責デッドロック発動中 — 行政CPUが100%「責任回避・他者攻撃」に割当。修復処理ゼロ。インフラ崩壊速度3倍。','⚠ BLAME-SHIFT DEADLOCK ACTIVE — 100% of admin CPU allocated to blame & attack. Zero repair. Infrastructure collapsing 3× faster.');
    db.textContent='⚠ DEADLOCK'; db.style.color='var(--red)';
  } else if(rootRestricted){
    dp.className='deadlock-panel deadlock-off';
    dp.textContent=tt('🛡 ROOT RESTRICTED — 司法・議会の正則化ブレーキ有効。単独の破壊的コマンド（sudo rm -rf）は多重承認によりブロック中。他責デッドロックは発動不能。','🛡 ROOT RESTRICTED — judiciary/parliament regularization brake active. Unilateral destructive commands (sudo rm -rf) blocked by multi-sig. Deadlock cannot trigger.');
    db.textContent='🛡 PROTECTED'; db.style.color='var(--green)';
  } else {
    dp.className='deadlock-panel deadlock-off';
    dp.textContent=m.infraError?tt('STRESS MODE — インフラがエラー域。Greedy×低倫理が続くとデッドロックへ突入する。','STRESS MODE — infrastructure in error zone. Sustained Greedy × low ethics leads to deadlock.'):tt('DEADLOCK INACTIVE — 実務・修復処理が正常稼働中','DEADLOCK INACTIVE — repair operations running normally');
    db.textContent=m.infraError?'STRESS':'INACTIVE'; db.style.color=m.infraError?'var(--ora)':'var(--muted)';
  }
  // Timeline
  if(!p2AnimPlaying&&timelineChartP2){
    const tl=simTimelineP2(shrinkRate,dxRate,algoP2,ethicsP2);
    timelineChartP2.data.datasets[0].data=tl.infra;
    timelineChartP2.data.datasets[1].data=tl.heli;
    timelineChartP2.data.datasets[2].data=tl.brand;
    timelineChartP2.data.datasets[3].data=tl.budget;
    timelineChartP2.update();
  }
  // Crash banner
  // v6.333: 危機（赤）/ 模範（緑）/ 非表示 の3状態バナー
  const p2Survived=shockState?.type==='survived';
  const p2Good=p2Survived||(!m.crash&&m.heliOp&&!m.deadlock&&m.redundancy>=60&&m.infra>=55&&m.budget>=40);
  const p2Steady=p2Good&&!p2Survived; // ショックを経ていない平常運転の良好
  if(m.crash){
    setVerdictBanner('alertBannerP2','crash','banner_p2');
    const parts=[];
    if(!m.heliOp&&m.infra<20) parts.push(tt('救命ヘリ長期運休 — インフラ維持力が臨界点以下に到達','Rescue heli suspended — infrastructure below critical point'));
    if(m.budget<8) parts.push(tt('自治体財政ショート — 予算が枯渇し行政機能停止','Municipal budget exhausted — administration halted'));
    if(m.deadlock) parts.push(tt('他責デッドロックによりシステムが自滅状態に突入','Blame-shift deadlock has driven the system into self-destruction'));
    if(shockState?.type==='crash') parts.push(tt(`⚡ ブラックスワン注入 — Redundancy Buffer ${shockState.rb}% で致命的崩壊（System Crash）`,`⚡ Black swan injected — fatal System Crash at Redundancy Buffer ${shockState.rb}%`));
    document.getElementById('alertMsgP2').textContent=parts.join('  |  ');
    discover('d_p2_crash');noteSessionPage(2);
  } else if(p2Good){
    // v6.339: 良好を「盤石（冗長性が非常に高い＝redundant都市）」と「平穏（smart/既定など）」で区別
    const p2Solid=!p2Survived&&m.redundancy>=85;
    const gkey=p2Survived?'banner_p2_good_survived':(p2Solid?'banner_p2_good_solid':'banner_p2_good_steady');
    setVerdictBanner('alertBannerP2','good',gkey);
    document.getElementById('alertMsgP2').textContent = p2Survived
      ? tt(`🚁 ショックを吸収 ／ 冗長性バッファ ${Math.round(m.redundancy)}% ／ 救命ヘリ継続稼働`,`🚁 Shock absorbed · redundancy buffer ${Math.round(m.redundancy)}% · rescue heli still online`)
      : p2Solid
        ? tt(`🛡 冗長性バッファ ${Math.round(m.redundancy)}% ／ 大きなショックが来ても耐えられる盤石な構成`,`🛡 Redundancy buffer ${Math.round(m.redundancy)}% · built to withstand even a major shock`)
        : tt(`🚁 救命ヘリ稼働中 ／ 冗長性バッファ ${Math.round(m.redundancy)}% ／ ひとまず安定（盤石とまではいかない）`,`🚁 Rescue heli online · redundancy buffer ${Math.round(m.redundancy)}% · stable for now (not rock-solid yet)`);
    if(p2Survived){discover('d_p2_survived');}else{discover('d_p2_steady');}
    noteSessionPage(2);
  } else {
    setVerdictBanner('alertBannerP2','warn','banner_p2_warn');
    document.getElementById('alertMsgP2').textContent=tt(`冗長性バッファ ${Math.round(m.redundancy)}% ／ 今は動くが、大きなショックが来れば耐えられないかもしれない`,`Redundancy buffer ${Math.round(m.redundancy)}% · running now, but a big shock might be too much`);
  }
  if(m.deadlock){discover('d_p2_deadlock');noteSessionPage(2);}
  // Redundancy Buffer
  const rb=m.redundancy;
  const rbc=rb<30?'#ff2244':rb<60?'#ff6b2b':'#00ff88';
  document.getElementById('p2RedundancyNum').textContent=rb;
  document.getElementById('p2RedundancyNum').style.color=rbc;
  document.getElementById('p2RedundancyBar').style.cssText=`width:${rb}%;background:${rbc}`;
  const rbStatus=rb<30?tt('CRITICAL — 効率最優先・ショックで即崩壊','CRITICAL — efficiency-maxed; a shock means instant collapse'):rb<60?tt('WARNING — 余力不足。大規模ショックに脆弱','WARNING — insufficient slack; vulnerable to major shocks'):tt('RESILIENT — 冗長性確保。ショック耐性あり','RESILIENT — redundancy secured; shock-tolerant');
  document.getElementById('p2RedundancyStatus').textContent=rbStatus;
  document.getElementById('p2RedundancyStatus').style.color=rbc;
  // Reboot indicator
  const ri=document.getElementById('p2RebootIndicator');
  if(ri){
    ri.textContent=publicReboot?tt('● PUBLIC REBOOT MODE: ACTIVE — 公共性最優先','● PUBLIC REBOOT MODE: ACTIVE — public good first'):tt('○ PUBLIC REBOOT MODE: OFF — 市場原理','○ PUBLIC REBOOT MODE: OFF — market logic');
    Object.assign(ri.style,{color:publicReboot?'var(--cyan)':'var(--muted)',borderColor:publicReboot?'rgba(0,212,255,.4)':'var(--bdr)',background:publicReboot?'rgba(0,212,255,.08)':'var(--bg1)'});
  }
  // Shock result panel
  const sp=document.getElementById('shockResultPanel');
  if(sp){
    if(shockState){
      sp.style.display='block';
      if(shockState.type==='crash'){
        sp.className='shock-result-panel shock-crashed';
        sp.innerHTML=tt(`<strong>⚠ あなたの街は、崩壊しました</strong><br>Redundancy Buffer: ${shockState.rb}% (&lt; 30%)<br>効率最優先社会はインフラ・財政が即時ゼロに崩壊。再公営化なき効率化の致命的代償。<br><span style="font-size:.58rem;opacity:.75">【リダンダンシー理論】冗長性なき社会は、未知のショックに対して完全無防備。</span>`,`<strong>⚠ Your town has collapsed</strong><br>Redundancy Buffer: ${shockState.rb}% (&lt; 30%)<br>The efficiency-maxed society collapsed to zero infrastructure and budget instantly — the fatal price of efficiency without re-municipalization.<br><span style="font-size:.58rem;opacity:.75">[Redundancy theory] A society without slack is defenseless against unknown shocks.</span>`);
      }else if(shockState.type==='survived'){
        sp.className='shock-result-panel shock-survived';
        sp.innerHTML=tt(`<strong>✓ あなたの街は、生き残った</strong><br>Redundancy Buffer: ${shockState.rb}% (≥ 60%)<br>公共的冗長性が社会を救いました。財政は消費されましたがインフラ・救命ヘリは継続稼働。STABLE。<br><span style="font-size:.58rem;opacity:.75">【再公営化の論理】非効率に見えた余白こそが、社会の生命線でした。</span>`,`<strong>✓ Your town survived</strong><br>Redundancy Buffer: ${shockState.rb}% (≥ 60%)<br>Public redundancy saved the society. Budget was spent, but infrastructure and the rescue heli stayed online. STABLE.<br><span style="font-size:.58rem;opacity:.75">[The logic of re-municipalization] The slack that looked wasteful was the lifeline.</span>`);
      }else{
        sp.className='shock-result-panel shock-partial';
        sp.innerHTML=tt(`<strong>⚡ あなたの街は、なんとか持ちこたえた</strong><br>Redundancy Buffer: ${shockState.rb}% (30〜60%)<br>中程度の冗長性で一部のショックを吸収しましたが、インフラが損傷を受けました。Public Reboot導入を検討してください。`,`<strong>⚡ Your town barely held on</strong><br>Redundancy Buffer: ${shockState.rb}% (30–60%)<br>Moderate redundancy absorbed part of the shock, but infrastructure took damage. Consider enabling Public Reboot.`);
      }
    }else{
      sp.style.display='none';
      sp.className='shock-result-panel';
    }
  }
  // v6.2: 判定直後の文脈共有ボタン（感情のピークに隣接表示）
  const ssb=document.getElementById('shockShareBtn');
  if(ssb){
    ssb.style.display=shockState?'block':'none';
    if(shockState)ssb.textContent=tt('▶ この結果を送る','▶ Share this result');
  }
  // Operation log
  updateP2Log(m);
  checkScenarioGoal(m);
}

function getP2BrandDiag(m){
  if(m.brand<20) return tt('[ FATAL ] 地域ブランド産業が崩壊。後継者ゼロ・自動化ゼロ。産業消滅。','[ FATAL ] Local brand industry collapsed. Zero successors, zero automation. Industry extinct.');
  // v6.346: 後継者ストックの残量を先に警告（DX投資を怠ると、当面は平穏でもある日崖のように崩落する）
  if(skillStock<15) return tt('[ CRITICAL ] 後継者ストックが枯渇寸前。このままDX投資を怠ると、ある日ブランドが崖のように崩落します。','[ CRITICAL ] Successor stock nearly depleted — keep neglecting DX and the brand will fall off a cliff one day.');
  if(skillStock<35&&dxRate<25) return tt('[ WARNING ] 暗黙知の担い手が引退し続けています（後継者ストック低下中）。DX投資で技能を形式知化してください。','[ WARNING ] Tacit-knowledge holders keep retiring (successor stock falling). Invest in DX to serialize skills.');
  if(m.brand<50&&dxRate<40) return tt('[ WARNING ] DX投資不足で職人高齢化が加速中。5年以内に後継者断絶リスク。','[ WARNING ] DX under-investment is accelerating artisan aging. Succession collapse risk within 5 years.');
  if(m.brand>75&&dxRate>60) return tt('[ OPTIMAL ] スマート自動化によりブランド品質維持と後継問題を同時解決。持続的成長軌道。','[ OPTIMAL ] Smart automation solves quality and succession simultaneously. Sustainable growth trajectory.');
  return tt('[ OK ] ブランド産業は現状維持中。DX投資を増やすと長期持続性が向上する。','[ OK ] Brand industry holding steady. More DX investment improves long-term viability.');
}

let p2LogTick=0;
function updateP2Log(m){
  p2LogTick++;
  const now=new Date();
  const ts=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const ja=lang==='ja';
  const NORMAL=ja?P2_LOG_NORMAL_JA:P2_LOG_NORMAL_EN, WARN=ja?P2_LOG_WARN_JA:P2_LOG_WARN_EN,
        BLAME=ja?P2_LOG_BLAME_JA:P2_LOG_BLAME_EN, REBOOT=ja?P2_LOG_REBOOT_JA:P2_LOG_REBOOT_EN,
        SHOCK=ja?P2_LOG_SHOCK_JA:P2_LOG_SHOCK_EN;
  let src,cls;
  if(shockState){
    src=SHOCK[p2LogTick%SHOCK.length]; cls='p2log-warn';
  } else if(m.deadlock){
    src=BLAME[p2LogTick%BLAME.length]; cls='p2log-blame';
  } else if(publicReboot){
    src=REBOOT[p2LogTick%REBOOT.length]; cls='p2log-normal';
  } else if(m.infraError||m.budget<40){
    const arr=(p2LogTick%3===0?WARN:NORMAL); src=arr[p2LogTick%arr.length]; cls='p2log-warn';
  } else {
    src=NORMAL[p2LogTick%NORMAL.length]; cls='p2log-normal';
  }
  p2LogEntries.push(`<span class="${cls}">${ts} ${src}</span>`);
  if(p2LogEntries.length>7) p2LogEntries.shift();
  document.getElementById('p2Log').innerHTML=p2LogEntries.join('<br>');
}

function playAnimationP2(){
  const btn=document.getElementById('playBtnP2');
  if(p2AnimPlaying){
    clearInterval(p2AnimTimer); p2AnimPlaying=false; p2AnimTimer=null;
    btn.textContent='▶ PLAY'; btn.classList.remove('play-on');
    updateAllP2(); return;
  }
  p2FullTimeline=simTimelineP2(shrinkRate,dxRate,algoP2,ethicsP2);
  p2AnimStep=0; p2AnimPlaying=true;
  btn.textContent='■ STOP'; btn.classList.add('play-on');
  if(timelineChartP2){
    timelineChartP2.data.datasets.forEach(d=>d.data=[]);
    timelineChartP2.update('none');
  }
  p2AnimTimer=setInterval(()=>{
    p2AnimStep++;
    if(p2AnimStep>65){
      clearInterval(p2AnimTimer); p2AnimPlaying=false; p2AnimTimer=null;
      btn.textContent='▶ PLAY'; btn.classList.remove('play-on'); return;
    }
    if(timelineChartP2){
      timelineChartP2.data.datasets[0].data=p2FullTimeline.infra.slice(0,p2AnimStep);
      timelineChartP2.data.datasets[1].data=p2FullTimeline.heli.slice(0,p2AnimStep);
      timelineChartP2.data.datasets[2].data=p2FullTimeline.brand.slice(0,p2AnimStep);
      timelineChartP2.data.datasets[3].data=p2FullTimeline.budget.slice(0,p2AnimStep);
      timelineChartP2.update('none');
    }
  },70);
}

function setAlgoP2(a){
  algoP2=a;
  document.getElementById('btnDPP2').classList.toggle('on',a==='dp');
  document.getElementById('btnDPP2').classList.toggle('green-on',a==='dp');
  document.getElementById('btnGreedyP2').classList.toggle('on',a==='greedy');
  document.getElementById('btnGreedyP2').classList.toggle('red-on',a==='greedy');
  shockState=null;
  clearPresetSelP2();
  updateAllP2();
}

function setPublicReboot(on){
  publicReboot=on;
  if(on){ skillLost=false; skillStock=clamp(Math.max(skillStock,60),0,100); } // v6.346: 再公営化＝公的技能継承で後継者ストック復活
  document.getElementById('btnRebootOff').classList.toggle('on',!on);
  document.getElementById('btnRebootOn').classList.toggle('on',on);
  document.getElementById('btnRebootOn').classList.toggle('green-on',on);
  shockState=null;
  clearPresetSelP2();
  updateAllP2();
}

function injectSystemShock(){
  const rb=calcRedundancyBuffer(shrinkRate,algoP2,publicReboot);
  const type=rb<30?'crash':rb>=60?'survived':'partial';
  shockState={type,rb};
  heliWeatherHoldUntil=Date.now()+HELI_HOLD_MS; // v6.346 Task C: ショック中は悪天候でヘリが一時見合わせ→時間経過で構造条件に応じ自動復帰
  const btn=document.getElementById('shockBtn');
  if(btn){
    btn.style.background='rgba(255,204,0,.28)';
    btn.style.boxShadow='0 0 24px rgba(255,204,0,.6)';
    setTimeout(()=>{btn.style.background='';btn.style.boxShadow='';},500);
  }
  updateAllP2();
  setTimeout(()=>{ if(currentTab===2) updateAllP2(); },HELI_HOLD_MS+120); // WEATHER HOLD 明けに構造判定へ再描画
}

// P2 sliders
document.getElementById('shrinkRate').addEventListener('input',function(){
  shrinkRate=+this.value; document.getElementById('shrinkVal').textContent=shrinkRate+'%';
  setPct(this); shockState=null; clearPresetSelP2(); updateAllP2();
});
document.getElementById('dxRate').addEventListener('input',function(){
  dxRate=+this.value; document.getElementById('dxVal').textContent=dxRate+'%';
  setPct(this); shockState=null; clearPresetSelP2(); updateAllP2();
});
document.getElementById('ethicsScoreP2').addEventListener('input',function(){
  ethicsP2=+this.value; document.getElementById('ethicsP2Val').textContent=ethicsP2;
  setPct(this); shockState=null; clearPresetSelP2(); updateAllP2();
});

let timelineChartP2=null;

// ── PAGE 3: COGNITIVE RECOVERY ────────────────────────────
let searchDepth=7, groundingRate=20, learningRate=40; // v6.334: 初期状態から p3Good（健全な認知）を満たす
let rootRestricted=false;
let p3Started=false, p3Nodes=[], p3Ctx=null, p3W=0, p3H=0, p3AnimId=null;
let dropoutActive=false, dropoutTimer=null, dropoutPrevGround=20;
let timelineChartP3=null;

// 反証不能モデルの言い訳（後付けダミー変数）ログ
const P3_EXCUSES_JA=[
  'ERR#417 ......... 言い訳: タイミングが悪かった',
  'ERR#418 ......... 言い訳: 外部勢力の妨害があった',
  'ERR#419 ......... ダミー変数追加: 景気のせい',
  'ERR#420 ......... 言い訳: メディアの切り取り報道',
  'SELF_EVAL ....... スコア100点（自己採点）',
  'HYPOTHESIS ...... 棄却拒否 [UNFALSIFIABLE]',
];
const P3_EXCUSES_EN=[
  'ERR#417 ......... excuse: the timing was bad',
  'ERR#418 ......... excuse: external forces sabotaged us',
  'ERR#419 ......... dummy variable added: blame the economy',
  'ERR#420 ......... excuse: media quoted us out of context',
  'SELF_EVAL ....... score 100/100 (self-graded)',
  'HYPOTHESIS ...... rejection refused [UNFALSIFIABLE]',
];

function initP3Nodes(){
  const r=seedRng(4242);
  // 偽装ノード（中央・自称良識派）
  p3Nodes=[{x:0.5,y:0.5,type:'fake',c:1,dop:100,pulse:0}];
  // 中立ノード（事実を述べる）×3
  for(let i=0;i<3;i++){
    const ang=Math.PI*2*(i/3)+0.55;
    p3Nodes.push({x:0.5+Math.cos(ang)*0.36,y:0.5+Math.sin(ang)*0.33,type:'neutral',c:0,dop:0});
  }
  // 一般ノード×32（中央を避けて散布）
  for(let i=0;i<32;i++){
    let x,y;
    do{x=0.06+r()*0.88;y=0.08+r()*0.84;}while(Math.hypot(x-0.5,y-0.5)<0.14);
    p3Nodes.push({x,y,type:'general',c:r()*0.1,dop:r()*12});
  }
}

// 騙され度: 深度≤3で1.0（全騙され）、≥7で0（看破）、間は線形
function p3Fooling(){
  if(searchDepth<=3)return 1;
  if(searchDepth>=7)return 0;
  return (7-searchDepth)/4;
}

function stepP3(){
  const g=(dropoutActive?100:groundingRate)/100;
  const lr=learningRate/100; // 0で自己修正が完全停止（思考凍結モード）
  const fool=p3Fooling();
  p3Nodes.forEach(n=>{
    if(n.type!=='general')return;
    const rise=fool*0.011*(1-g*0.75);
    const fall=((1-fool)*0.012+g*0.010+(dropoutActive?0.05:0))*lr;
    n.c=clamp(n.c+rise-fall,0,1);
    const dRise=fool*(1-g*0.7)*1.6;
    const dFall=((1-fool)*2.2+g*1.4+(dropoutActive?9:0))*lr;
    n.dop=clamp(n.dop+dRise-dFall,0,100);
  });
  p3Nodes[0].pulse=(p3Nodes[0].pulse+0.06)%(Math.PI*2);
}

function drawP3(){
  if(!p3Ctx)return;
  p3Ctx.clearRect(0,0,p3W,p3H);
  const fake=p3Nodes[0];
  const neutrals=p3Nodes.filter(n=>n.type==='neutral');
  const generals=p3Nodes.filter(n=>n.type==='general');
  // 偽装ノード→感染中の一般ノードへの影響エッジ（紫）
  generals.forEach(n=>{
    if(n.c<0.25)return;
    p3Ctx.beginPath();p3Ctx.moveTo(fake.x*p3W,fake.y*p3H);p3Ctx.lineTo(n.x*p3W,n.y*p3H);
    p3Ctx.strokeStyle=`rgba(153,69,255,${(n.c*0.25).toFixed(2)})`;
    p3Ctx.lineWidth=0.8;p3Ctx.stroke();
  });
  // 正義の毒入れ攻撃: 騙されたノード→中立ノードへの赤い点線エッジ
  let attackEdges=0;
  generals.forEach(n=>{
    if(n.c<=0.55)return;
    neutrals.forEach(t=>{
      attackEdges++;
      p3Ctx.beginPath();p3Ctx.moveTo(n.x*p3W,n.y*p3H);p3Ctx.lineTo(t.x*p3W,t.y*p3H);
      p3Ctx.strokeStyle=`rgba(255,34,68,${(0.15+n.c*0.45).toFixed(2)})`;
      p3Ctx.lineWidth=1.6*n.c;
      p3Ctx.setLineDash([4,5]);p3Ctx.stroke();p3Ctx.setLineDash([]);
    });
  });
  // 一般ノード
  generals.forEach(n=>{
    const x=n.x*p3W,y=n.y*p3H,col=cColor(n.c);
    const grd=p3Ctx.createRadialGradient(x,y,0,x,y,14);
    grd.addColorStop(0,cColor(n.c,0.22));grd.addColorStop(1,'rgba(0,0,0,0)');
    p3Ctx.beginPath();p3Ctx.arc(x,y,14,0,Math.PI*2);p3Ctx.fillStyle=grd;p3Ctx.fill();
    p3Ctx.beginPath();p3Ctx.arc(x,y,5,0,Math.PI*2);p3Ctx.fillStyle=col;p3Ctx.fill();
  });
  // 中立ノード（白コア＋シアン破線リング）
  neutrals.forEach(n=>{
    const x=n.x*p3W,y=n.y*p3H;
    const grd=p3Ctx.createRadialGradient(x,y,0,x,y,20);
    grd.addColorStop(0,'rgba(0,212,255,0.25)');grd.addColorStop(1,'rgba(0,0,0,0)');
    p3Ctx.beginPath();p3Ctx.arc(x,y,20,0,Math.PI*2);p3Ctx.fillStyle=grd;p3Ctx.fill();
    p3Ctx.beginPath();p3Ctx.arc(x,y,7,0,Math.PI*2);p3Ctx.fillStyle='#e8f4ff';p3Ctx.fill();
    p3Ctx.beginPath();p3Ctx.arc(x,y,10,0,Math.PI*2);p3Ctx.strokeStyle='#00d4ff';p3Ctx.lineWidth=1;
    p3Ctx.setLineDash([3,3]);p3Ctx.stroke();p3Ctx.setLineDash([]);
    p3Ctx.font="8px 'Courier New',monospace";p3Ctx.textAlign='center';
    p3Ctx.fillStyle='#5a6f94';p3Ctx.fillText('FACT',x,y+21);
  });
  // 偽装ノード（緑のハロー＝良識派の仮面 / 赤コア＝実体）
  const fx=fake.x*p3W,fy=fake.y*p3H,pr=11+Math.sin(fake.pulse)*2;
  const fgrd=p3Ctx.createRadialGradient(fx,fy,0,fx,fy,pr*3.2);
  fgrd.addColorStop(0,'rgba(0,255,136,0.30)');fgrd.addColorStop(1,'rgba(0,0,0,0)');
  p3Ctx.beginPath();p3Ctx.arc(fx,fy,pr*3.2,0,Math.PI*2);p3Ctx.fillStyle=fgrd;p3Ctx.fill();
  p3Ctx.beginPath();p3Ctx.arc(fx,fy,pr,0,Math.PI*2);p3Ctx.fillStyle='#ff2244';p3Ctx.fill();
  p3Ctx.beginPath();p3Ctx.arc(fx,fy,pr+5,0,Math.PI*2);p3Ctx.strokeStyle='#00ff88';p3Ctx.lineWidth=1.6;
  p3Ctx.setLineDash([5,4]);p3Ctx.stroke();p3Ctx.setLineDash([]);
  p3Ctx.font="9px 'Courier New',monospace";p3Ctx.textAlign='center';
  p3Ctx.fillStyle='#00ff88';
  p3Ctx.fillText(lang==='ja'?'自称・良識派':'SELF-PROCLAIMED FAIR',fx,fy+pr+19);
  // オーバーレイ更新
  const avgDop=generals.reduce((s,n)=>s+n.dop,0)/generals.length;
  document.getElementById('p3St1').textContent=`JUSTICE SURGE: ${avgDop.toFixed(0)}%`;
  document.getElementById('p3St2').textContent=`ATTACK EDGES: ${attackEdges}`;
  updateP3Monitor(avgDop,generals,attackEdges);
}

// v6.31: 状態変化ガード — 前回適用値と異なる時だけDOMへ書き込む
//   （毎フレーム呼ばれるモニターでの無駄な再描画とフリッカーを抑止）
function setText(el,txt){if(el&&el._t!==txt){el._t=txt;el.textContent=txt;}}
function setColor(el,col){if(el&&el._c!==col){el._c=col;el.style.color=col;}}
function setClassOn(el,name,on){if(el&&el['_k'+name]!==on){el['_k'+name]=on;el.classList.toggle(name,on);}}
function setDisp(el,disp){if(el&&el._d!==disp){el._d=disp;el.style.display=disp;}}

// v6.333: 判定バナーの3状態切替（'crash' 赤 / 'good' 緑 / '' 非表示）。状態変化時だけDOMへ書き込む。
//   .at の data-i18n を付け替えるので言語切替は既存 applyI18nAuto が自動追従する。
// v6.335: 判定バナーの状態切替（'crash' 赤 / 'warn' 橙・中間 / 'good' 緑 / '' 非表示）
//   key = その状態のI18Nキー。.at の data-i18n を付け替えるので言語切替は applyI18nAuto が追従。
function setVerdictBanner(alertId,state,key){
  const al=document.getElementById(alertId);if(!al)return;
  const at=al.querySelector('.at');if(!at)return;
  const sig=state+'|'+(key||'');      // good の種別（steady/survived）等も区別
  if(al.dataset.bst===sig)return;     // 状態変化ガード（ループでのフリッカー防止）
  al.dataset.bst=sig;
  al.classList.remove('good','warn');
  at.classList.remove('good','warn');
  if(state){
    at.dataset.i18n=key;
    const v=(I18N[lang]&&I18N[lang][key]);
    if(v!==undefined)at.innerHTML=expandTown(v);
    if(state==='good'){al.classList.add('good');at.classList.add('good');}
    else if(state==='warn'){al.classList.add('warn');at.classList.add('warn');}
    al.classList.add('on');
    track('verdict',{banner:alertId,state,key});
    // v6.35 (task2): 崩壊へ遷移した瞬間だけ短い振動（ネイティブのみ / Webは no-op）。
    // 上部の bst ガードで状態変化時にしか到達しないため連続振動しない。
    if(state==='crash'){
      if(window.SSD)SSD.haptic('crash');
      // task6: 週替わりシナリオ挑戦中の崩壊は weekly_fail（scenario.js側で1回制御・Web no-op）
      if(typeof noteWeeklyCollapse==='function')noteWeeklyCollapse();
    }
  }else{
    al.classList.remove('on');
  }
}

// ══════════════════════════════════════════════════════════
// v6.334: 発見ログ（収集型ゲーミフィケーション）
//   方針: ストリーク／時間制限／通知／不安を煽る文言は一切実装しない。
//   触るたびに新しい発見＝短い学びがある、という純粋な好奇心の設計。
// ══════════════════════════════════════════════════════════
const DISCOVERIES=[
  {id:'d_p1_crash',    badge:()=>tt('⚠ 情報空間の崩壊を再現した','⚠ Recreated an information-space collapse'), learn:()=>tt('パラメータが同じでも、結果は真逆になり得る。','Same parameters can still lead to opposite outcomes.')},
  {id:'d_p1_rewind',   badge:()=>tt('↩ 過去を一つ変えて街を救った','↩ Changed one thing and saved the town'), learn:()=>tt('崩壊は、たった一つの選択で回避できることがある。','Collapse can sometimes be averted by a single choice.')},
  {id:'d_p1_good',     badge:()=>tt('🌐 澄んだ情報空間をつくった','🌐 Built a clear information space'), learn:()=>tt('開かれた入力は、社会の解像度を上げる。','Open inputs raise a society’s resolution.')},
  {id:'d_p1_weimar',   badge:()=>tt('⚡ 1933年を1タップで再現した','⚡ Recreated 1933 in one tap'), learn:()=>tt('崩壊には、いつも同じ構造がある。','Collapse tends to share the same structure.')},
  {id:'d_p1_nordic',   badge:()=>tt('🌿 北欧型の設計を試した','🌿 Tried the Nordic design'), learn:()=>tt('高い倫理と開放性は、崩壊耐性になる。','High ethics and openness buy resilience.')},
  {id:'d_p2_crash',    badge:()=>tt('🏙 街を崩壊させた','🏙 Let a town collapse'), learn:()=>tt('効率の最大化は、余白を食い尽くす。','Maximizing efficiency devours the slack.')},
  {id:'d_p2_deadlock', badge:()=>tt('🏚 他責デッドロックを目撃した','🏚 Witnessed a blame-shift deadlock'), learn:()=>tt('直せるのに、誰も直さない状態を見た。','You saw a fixable problem no one fixes.')},
  {id:'d_p2_survived', badge:()=>tt('🚁 ショックを生き延びた','🚁 Survived the shock'), learn:()=>tt('非効率に見えた余白が、生命線だった。','The slack that looked wasteful was the lifeline.')},
  {id:'d_p2_steady',   badge:()=>tt('🏘 平穏な街を保った','🏘 Kept a town at peace'), learn:()=>tt('危機がないことは、設計の成果でもある。','An uneventful town can itself be a design achievement.')},
  {id:'d_p3_poison',   badge:()=>tt('🧪 正義の毒入れ攻撃を見た','🧪 Saw a justice-poisoning attack'), learn:()=>tt('浅い探索は、正しさをハックされる。','Shallow reasoning gets its righteousness hijacked.')},
  {id:'d_p3_restored', badge:()=>tt('🧠 認知を現実に同期させた','🧠 Synced cognition with reality'), learn:()=>tt('深く探索すれば、偽装は見破れる。','Search deep enough and the disguise breaks.')},
  {id:'d_p3_frozen',   badge:()=>tt('🧊 アップデート拒否を体験した','🧊 Saw a mind that won’t update'), learn:()=>tt('学習を止めると、事実を入れても考えは変わらない。','Stop learning, and no fact will change the belief.')},
  {id:'d_p4_hijack',   badge:()=>tt('🎪 目的関数の乗っ取りを見た','🎪 Saw an objective hijack'), learn:()=>tt('声の大きさが、当事者の声を消す。','Loudness drowns out the people who actually live it.')},
  {id:'d_p4_restored', badge:()=>tt('📡 当事者の声を取り戻した','📡 Restored the stakeholders’ voice'), learn:()=>tt('フィルタは、検閲ではなく帯域の確保。','Filtering here protects bandwidth, not censorship.')},
  {id:'d_meta_allpages',   badge:()=>tt('🔗 4層の連鎖を、自分の手で起こした','🔗 Triggered the 4-layer cascade yourself'), learn:()=>tt('上のレイヤーの崩壊は、下のレイヤーへ伝染する。','A failure up top infects the layers below.')},
  {id:'d_meta_allpresets', badge:()=>tt('🗺 すべてのシナリオを巡った','🗺 Explored every scenario'), learn:()=>tt('崩壊も回復も、地続きの設計の話。','Collapse and recovery are one design continuum.')},
  // ── v6.35 (task4): 週替わりシナリオの発見（sce_ は WEEKLY_ENABLED=native のみ到達・カウント対象） ──
  {id:'sce_weekly_guardian', badge:()=>tt('🛡 今週の守り人 — 街を守った','🛡 This week’s guardian — you protected the town'), learn:()=>tt('今週の困難を、あなたの手で越えた。','You cleared this week’s hardship yourself.')},
  {id:'sce_echo_trap', badge:()=>tt('📡 エコーチェンバーの罠を抜けた','📡 Escaped the echo-chamber trap'), learn:()=>tt('多様性を保てば、情報空間は濁らない。','Keep diversity and the information space stays clear.')},
  {id:'sce_ethics_cascade', badge:()=>tt('⚖ 倫理の滝を押し戻した','⚖ Pushed back the ethics waterfall'), learn:()=>tt('正当性は、倫理の回復とともに戻る。','Legitimacy returns as ethics recovers.')},
  {id:'sce_successor_crisis', badge:()=>tt('🌱 後継者ストックを立て直した','🌱 Rebuilt the successor stock'), learn:()=>tt('DXは伝統の破壊でなく、技術の継承。','DX isn’t destroying tradition — it’s handing skills to the next generation.')},
  {id:'sce_redundancy_shock', badge:()=>tt('🛡 冗長性でショックに耐えた','🛡 Absorbed the shock with redundancy'), learn:()=>tt('無駄に見える余白が、未知の衝撃を吸収する。','The slack that looks wasteful is what absorbs the unknown.')},
  {id:'sce_cognitive_grounding', badge:()=>tt('🧭 認知をグラウンディングした','🧭 Grounded your cognition'), learn:()=>tt('深い探索と現実同期が、汚染を洗い流す。','Deep search and reality-sync wash out the contamination.')},
  {id:'sce_stakeholder_voice', badge:()=>tt('📣 当事者の声を取り戻した','📣 Restored the stakeholders’ voice'), learn:()=>tt('帯域の奪還が、静かな多数派を可聴にする。','Reclaiming bandwidth makes the quiet majority audible.')},
];
let _discovered=new Set(), _sessionPages=new Set(), _presetsSeen=new Set(), _discReady=false;

function getReachableDiscoveries() {
  return DISCOVERIES.filter(d => {
    // Exclude scenario discoveries if weekly scenarios are not enabled
    if (!WEEKLY_ENABLED && d.id.startsWith('sce_')) {
      return false;
    }
    return true;
  });
}

function getTotalDiscoveryCount() {
  return getReachableDiscoveries().length;
}

function loadDiscoveries(){
  try{_discovered=new Set(JSON.parse(localStorage.getItem('ssd_discoveries')||'[]'));}catch(e){_discovered=new Set();}
  try{_presetsSeen=new Set(JSON.parse(localStorage.getItem('ssd_presets_seen')||'[]'));}catch(e){_presetsSeen=new Set();}
}
function discover(id){
  if(!_discReady||_discovered.has(id))return;         // 読み込み時の自動付与を防ぐ + 既発見はスキップ
  // Prevent discovering scenario discoveries when weekly scenarios are disabled
  if (!WEEKLY_ENABLED && id.startsWith('sce_')) return;
  if(!DISCOVERIES.some(d=>d.id===id))return;
  _discovered.add(id);
  try{localStorage.setItem('ssd_discoveries',JSON.stringify([..._discovered]));}catch(e){}
  const d=DISCOVERIES.find(x=>x.id===id);
  showDiscoveryToast(d.badge());
  updateDiscoveryCounter();
}
function noteSessionPage(page){
  _sessionPages.add(page);
  if(_sessionPages.size>=4)discover('d_meta_allpages');
}
function notePreset(page,id){
  _presetsSeen.add(page+':'+id);
  try{localStorage.setItem('ssd_presets_seen',JSON.stringify([..._presetsSeen]));}catch(e){}
  track('preset',{page,id});
  const total=Object.keys(PRESETS).length+Object.keys(PRESETS_P2).length+Object.keys(PRESETS_P3).length+Object.keys(PRESETS_P4).length;
  if(_presetsSeen.size>=total)discover('d_meta_allpresets');
}
let _discQueue=[], _discBusy=false;
function showDiscoveryToast(text){ _discQueue.push(text); if(!_discBusy)drainDiscToast(); }
function drainDiscToast(){
  const t=document.getElementById('discToast');
  if(!t||!_discQueue.length){_discBusy=false;if(t)t.classList.remove('on');return;}
  _discBusy=true;
  t.textContent=tt('🆕 発見: ','🆕 Found: ')+_discQueue.shift();
  t.classList.add('on');
  setTimeout(()=>{t.classList.remove('on');setTimeout(drainDiscToast,320);},1900);
}
function updateDiscoveryCounter(){
  const total = getTotalDiscoveryCount();
  const count = _discovered.size;

  // Update menu counter
  const menuCount = document.getElementById('discMenuCount');
  if(menuCount) menuCount.textContent = count;

  // Update menu total (dynamic)
  const menuTotal = document.getElementById('discMenuTotal');
  if(menuTotal) menuTotal.textContent = total;

  // Update header discovery button visibility and count
  const headerBtn = document.getElementById('discHeaderBtn');
  if(headerBtn) {
    if(count > 0) {
      headerBtn.style.display = '';
      const headerCount = document.getElementById('discHeaderCount');
      if(headerCount) headerCount.textContent = count;
    } else {
      headerBtn.style.display = 'none';
    }
  }

  // Legacy support for old button if it exists
  const b = document.getElementById('discBtn');
  if(b) b.textContent = tt('📖 発見ログ ', '📖 Discoveries ') + `(${count}/${total})`;
}
function openDiscoveryLog(){
  const list=document.getElementById('discList');if(!list)return;
  list.innerHTML='';
  const reachable = getReachableDiscoveries();
  reachable.forEach(d=>{
    const found=_discovered.has(d.id);
    const row=document.createElement('div');
    row.className='disc-row'+(found?' found':'');
    row.innerHTML=found
      ? `<div class="disc-badge">${d.badge()}</div><div class="disc-learn">${d.learn()}</div>`
      : `<div class="disc-badge disc-locked">❓ ???</div>`;
    list.appendChild(row);
  });
  document.getElementById('discCount').textContent=`${_discovered.size} / ${getTotalDiscoveryCount()}`;
  document.getElementById('discoveryModal').classList.add('on');
}
function closeDiscoveryLog(){document.getElementById('discoveryModal').classList.remove('on');}
function closeDiscoveryLogIf(e){if(e.target===document.getElementById('discoveryModal'))closeDiscoveryLog();}

function updateP3Monitor(avgDop,generals,attackEdges){
  const fooled=generals.filter(n=>n.c>0.55).length;
  // v6.31: 揺れる attackEdges を約0.4秒保持し、0↔正の1フレーム往復による点滅を防ぐ
  if(attackEdges>0)p3AttackHold=24;else if(p3AttackHold>0)p3AttackHold--;
  const attackSticky=p3AttackHold>0;
  // P3バナーはヒステリシス（点灯: fooled>=12 & 攻撃中 / 消灯: fooled<10 か 攻撃収束）
  if(!p3BannerOn){ if(fooled>=12&&attackSticky)p3BannerOn=true; }
  else { if(fooled<10||!attackSticky)p3BannerOn=false; }
  const avgC=generals.reduce((s,n)=>s+n.c,0)/generals.length;
  const integ=Math.round(clamp(100-avgC*100,0,100));
  const dopR=Math.round(avgDop);
  const dc=dopR<35?'#00ff88':dopR<65?'#ff6b2b':'#ff2244';
  document.getElementById('p3DopNum').textContent=dopR;
  document.getElementById('p3DopNum').style.color=dc;
  document.getElementById('p3DopBar').style.cssText=`width:${dopR}%;background:${dc}`;
  document.getElementById('p3DopStatus').textContent=dopR<35?tt('CALM — 認知は安定','CALM — cognition stable'):dopR<65?tt('SURGING — 正義感ドーパミン上昇中','SURGING — justice dopamine rising'):tt('RUNAWAY — 正義感の暴走が攻撃行動へ転化','RUNAWAY — runaway justice converting into aggression');
  document.getElementById('p3DopStatus').style.color=dc;
  const icol=integ<35?'#ff2244':integ<65?'#ff6b2b':'#00ff88';
  document.getElementById('p3IntNum').textContent=integ;
  document.getElementById('p3IntNum').style.color=icol;
  document.getElementById('p3IntBar').style.cssText=`width:${integ}%;background:${icol}`;
  document.getElementById('p3IntStatus').textContent=integ<35?tt('OVERFITTED — 認知が偽装情報に過適合','OVERFITTED — cognition over-adapted to disguised info'):integ<65?tt('DEGRADED — ノイズ蓄積が進行中','DEGRADED — noise accumulating'):tt('HEALTHY — 認知は健全','HEALTHY — cognition is sound');
  document.getElementById('p3IntStatus').style.color=icol;
  const atk=document.getElementById('p3AttackBadge');
  if(attackSticky){setText(atk,'⚠ ACTIVE');setColor(atk,'var(--red)');}
  else if(searchDepth>=7){setText(atk,'NEUTRALIZED');setColor(atk,'var(--green)');}
  else{setText(atk,'—');setColor(atk,'var(--muted)');}
  const fn=document.getElementById('p3FooledNum');
  fn.textContent=`${fooled}/32`;
  fn.style.color=fooled>12?'var(--red)':fooled>4?'var(--ora)':'var(--green)';
  const dbg=document.getElementById('p3DebugBadge');
  if(dropoutActive){dbg.textContent='GROUNDING';dbg.style.color='var(--pur)';}
  else if(searchDepth>=7&&fooled===0){dbg.textContent='✓ DEBUGGED';dbg.style.color='var(--green)';}
  else if(fooled>12){dbg.textContent='OVERFITTED';dbg.style.color='var(--red)';}
  else{dbg.textContent='RUNNING';dbg.style.color='var(--muted)';}
  // 反証許容度（Page 2 の予算配分戦略と連動）
  const falsEl=document.getElementById('p3FalsNum'),falsBar=document.getElementById('p3FalsBar'),
        falsSt=document.getElementById('p3FalsStatus'),exLog=document.getElementById('p3ExcuseLog');
  if(algoP2==='greedy'){
    falsEl.textContent='0%';falsEl.style.color='var(--red)';
    falsBar.style.cssText='width:4%;background:var(--red)';
    falsSt.textContent=tt('UNFALSIFIABLE — エラーを後付けダミー変数で言い訳処理中（自己欺瞞）','UNFALSIFIABLE — errors excused via post-hoc dummy variables (self-deception)');
    falsSt.style.color='var(--red)';
    exLog.style.display='block';
    const EX=lang==='ja'?P3_EXCUSES_JA:P3_EXCUSES_EN;
    const off=Math.floor(Date.now()/900);
    exLog.innerHTML=[0,1,2].map(i=>EX[(off+i)%EX.length]).join('<br>');
  } else {
    const fals=Math.round(clamp(learningRate*0.55+searchDepth*4.5,0,100));
    const fc=fals<35?'#ff2244':fals<65?'#ff6b2b':'#00d4ff';
    falsEl.textContent=fals+'%';falsEl.style.color=fc;
    falsBar.style.cssText=`width:${fals}%;background:${fc}`;
    falsSt.textContent=fals<35?tt('LOW — 反証を受け入れる余地が乏しい','LOW — little room to accept counter-evidence'):fals<65?tt('MODERATE — 一部の反証を受理','MODERATE — some counter-evidence accepted'):tt('HIGH — エラーを仮説棄却として正しく受理','HIGH — errors correctly accepted as hypothesis rejection');
    falsSt.style.color=fc;
    exLog.style.display='none';
  }
  // モデル更新モード
  const mu=document.getElementById('p3ModelBadge');
  if(learningRate===0){mu.textContent='FROZEN';mu.style.color='var(--red)';}
  else if(learningRate<30){mu.textContent='RIGID';mu.style.color='var(--ora)';}
  else{mu.textContent='ADAPTIVE';mu.style.color='var(--green)';}
  // Root権限状態
  const rp=document.getElementById('p3RootBadge');
  rp.textContent=rootRestricted?'🛡 MULTI-SIG':'sudo FREE';
  rp.style.color=rootRestricted?'var(--green)':'var(--ora)';
  const diag=document.getElementById('p3Diag');
  if(dropoutActive){
    diag.textContent=tt('[ DROPOUT ] 物理現実へ強制回帰中。ネットワークから切断され、汚染度が急速に洗い流されています。','[ DROPOUT ] Forced return to physical reality. Disconnected from the network; contamination washing out rapidly.');
    diag.style.borderLeftColor='var(--pur)';
  } else if(learningRate<10&&fooled>0){
    diag.textContent=tt('[ FROZEN ] 学習率が0付近。モデル更新が完全停止しており、ファクトを入力しても考えが更新されません（アップデート拒否の状態）。学習率を上げて自己修正を許可せよ。','[ FROZEN ] Learning rate near zero. Model updates halted — facts come in but beliefs never update (won’t-update state). Raise the learning rate to permit self-correction.');
    diag.style.borderLeftColor='var(--red)';
  } else if(searchDepth<=3&&fooled>8){
    diag.textContent=tt('[ CRITICAL ] 探索深度が浅すぎます。偽装ノードの「良識的な語り口」を検証できず、正義感をハックされたノードが事実を述べる中立ノードを攻撃中。','[ CRITICAL ] Search too shallow. The disguised node\'s "reasonable tone" goes unverified; justice-hacked nodes are attacking fact-stating neutral nodes.');
    diag.style.borderLeftColor='var(--red)';
  } else if(searchDepth<=3){
    diag.textContent=tt('[ WARNING ] 脊髄反射モード。バズへの即応で偽装ノードへの感染が進行中。探索深度を上げて因果関係を検証せよ。','[ WARNING ] Spinal-reflex mode. Instant buzz reactions are spreading the infection. Raise search depth to verify causality.');
    diag.style.borderLeftColor='var(--ora)';
  } else if(searchDepth>=7&&fooled===0){
    diag.textContent=tt('[ DEBUGGED ] 多次元因果検証により偽装を看破。毒入れ攻撃は無効化されました。認知システムは現実OSと同期しています。','[ DEBUGGED ] Multi-dimensional causal verification exposed the disguise. Poisoning attack neutralized. Cognition synced with the real-world OS.');
    diag.style.borderLeftColor='var(--green)';
  } else {
    diag.textContent=tt('[ RUNNING ] 探索深度または現実同期レートを上げることでデバッグが進行します。','[ RUNNING ] Raise search depth or grounding to progress the debug.');
    diag.style.borderLeftColor='var(--pur)';
  }
  // v6.338: バナーは「パラメータ」から即時判定する（fooled/attackSticky はノードの汚染度で
  //   時間差で変化するため、ボタン押下にバナーが追従せず不安定だった）。探索深度・学習率は
  //   押した瞬間に確定するので、バナーが安定してすぐ切り替わる。ノードのアニメ/ゲージ/攻撃バッジは実シムのまま。
  const p3Frozen=learningRate<10;                          // アップデート拒否（自己修正が止まる）
  const p3PoisonState=!p3Frozen&&searchDepth<=3;           // 浅い探索＝毒入れされる構成
  const p3Good=!p3Frozen&&searchDepth>=7&&learningRate>=30; // 深い探索＋更新可能＝健全
  if(p3Frozen){
    setVerdictBanner('alertBannerP3','crash','banner_p3_frozen');
    setText(document.getElementById('alertMsgP3'),tt('🧊 学習率が0付近 — 事実を入れても考えが更新されません（アップデート拒否）。学習率を上げて自己修正を許可せよ。','🧊 Learning rate near zero — facts come in but beliefs never update (won’t-update mode). Raise the learning rate to allow self-correction.'));
    discover('d_p3_frozen');noteSessionPage(3);
  } else if(p3PoisonState){
    setVerdictBanner('alertBannerP3','crash','banner_p3');
    setText(document.getElementById('alertMsgP3'),tt('正義の毒入れ攻撃が進行中 — 偽装ノードに騙された一般ノードが、事実を述べる中立ノードを集団攻撃しています。探索深度を上げて検証能力を回復せよ。','Poisoning attack in progress — nodes fooled by the disguised node are mobbing fact-stating neutral nodes. Raise search depth to restore verification.'));
    discover('d_p3_poison');noteSessionPage(3);
  } else if(p3Good){
    setVerdictBanner('alertBannerP3','good','banner_p3_good');
    setText(document.getElementById('alertMsgP3'),tt('🧠 多次元因果検証が有効 ／ 毒入れ攻撃なし ／ 認知は現実と同期しています','🧠 Multi-dimensional verification active · no poisoning attack · cognition synced with reality'));
    discover('d_p3_restored');noteSessionPage(3);
  } else {
    setVerdictBanner('alertBannerP3','warn','banner_p3_warn');
    setText(document.getElementById('alertMsgP3'),tt('探索深度や現実同期レートを上げると、視界がクリアになっていきます。','Raise search depth or grounding and your view clears up.'));
  }

  // v6.3: 判定確定スナップショット + 共有ボタン（POISONING ACTIVE / RESTORED の瞬間）
  // v6.31: 判定は attackSticky（ヒステリシス済み）ベースにして点滅を防止
  p3Snapshot={integ,dop:dopR,fooled};
  const p3b=document.getElementById('p3ShareBtn');
  if(p3b){
    if(p3PoisonState) p3ShareState={type:'poison'};
    else if(p3Good) p3ShareState={type:'restored'};
    else p3ShareState=null;
    if(p3ShareState){
      setText(p3b,tt('▶ この結果を送る','▶ Share this result'));
      setDisp(p3b,'block');
    }else setDisp(p3b,'none');
  }
  checkScenarioGoal({integrity:integ,dopamine:dopR,depth:searchDepth});
}

function simTimelineP3(depth,ground,steps=65){
  const g=ground/100;
  const stubborn=1-learningRate/100; // 学習率が低いほど回復曲線が鈍化
  const fool=depth<=3?1:depth>=7?0:(7-depth)/4;
  const dop=[],integ=[],grd=[];
  const dopT=clamp(15+80*fool*(1-g*0.55)+stubborn*18,0,100);
  const intT=clamp(95-78*fool*(1-g*0.6)-stubborn*42,0,100);
  for(let i=0;i<steps;i++){
    const tn=i/steps,n=()=>randn(0,2);
    dop.push(clamp(lerp(25,dopT,1-Math.exp(-4*tn))+n(),0,100));
    integ.push(clamp(lerp(88,intT,1-Math.exp(-3*tn))+n(),0,100));
    grd.push(clamp(ground+n()*0.8,0,100));
  }
  return{dop,integ,grd};
}

function updateP3Chart(){
  if(!timelineChartP3)return;
  const eff=dropoutActive?100:groundingRate;
  const tl=simTimelineP3(searchDepth,eff);
  timelineChartP3.data.datasets[0].data=tl.dop;
  timelineChartP3.data.datasets[1].data=tl.integ;
  timelineChartP3.data.datasets[2].data=tl.grd;
  timelineChartP3.update();
}

function startP3(){
  if(!p3Started){
    p3Started=true;
    if (typeof Chart !== 'undefined') {
      try {
        timelineChartP3=new Chart(document.getElementById('timelineChartP3'),{
          type:'line',
          data:{labels:Array.from({length:65},(_,i)=>i),datasets:[
            {label:'正義感ドーパミン Justice Dopamine',data:[],borderColor:'#ff6b2b',backgroundColor:'rgba(255,107,43,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
            {label:'認知健全性 Cognitive Integrity',data:[],borderColor:'#00ff88',backgroundColor:'rgba(0,255,136,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
            {label:'現実同期 Grounding',data:[],borderColor:'#9945ff',borderWidth:1.5,borderDash:[5,4],pointRadius:0,tension:0.42,fill:false},
          ]},
          options:{responsive:true,maintainAspectRatio:false,animation:{duration:260},
            plugins:{legend:{labels:{color:'#5a6f94',boxWidth:12,font:{size:10}}}},
            scales:{
              x:{title:{display:true,text:'Time Steps →',color:'#5a6f94',font:{size:9}},grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94',maxTicksLimit:8}},
              y:{min:0,max:105,grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94'}}
            }
          }
        });
      } catch (e) {
        console.warn('📊 チャート timelineChartP3 生成失敗:', e.message);
        timelineChartP3 = null;
      }
    } else {
      console.warn('📊 チャート timelineChartP3 をスキップ: Chart.js が利用不可');
    }
  }
  if(p3AnimId)cancelAnimationFrame(p3AnimId);
  const cv=document.getElementById('p3Canvas'),wrap=cv.parentElement;
  p3W=wrap.clientWidth||700;p3H=wrap.clientHeight||330;
  cv.width=p3W;cv.height=p3H;p3Ctx=cv.getContext('2d');
  initP3Nodes();
  updateP3Chart();
  p3Loop();
}

function restartP3(){startP3();}

function p3Loop(){p3AnimId=requestAnimationFrame(p3Loop);stepP3();drawP3();}

function executeDropout(){
  if(!p3Started)return;
  if(dropoutTimer)clearTimeout(dropoutTimer);
  if(!dropoutActive)dropoutPrevGround=groundingRate;
  dropoutActive=true;
  document.getElementById('dropoutBtn').classList.add('exec');
  document.getElementById('p3DropFlash').classList.add('on');
  const sl=document.getElementById('groundingRate');
  sl.value=100;document.getElementById('groundVal').textContent='100%';setPct(sl);
  updateP3Chart();
  dropoutTimer=setTimeout(()=>{
    dropoutActive=false;dropoutTimer=null;
    document.getElementById('dropoutBtn').classList.remove('exec');
    document.getElementById('p3DropFlash').classList.remove('on');
    groundingRate=dropoutPrevGround;
    sl.value=groundingRate;document.getElementById('groundVal').textContent=groundingRate+'%';setPct(sl);
    updateP3Chart();
  },3000);
}

function executeEarlyStopping(){
  if(!p3Started)return;
  if(dropoutTimer){clearTimeout(dropoutTimer);dropoutTimer=null;}
  dropoutActive=false;
  document.getElementById('dropoutBtn').classList.remove('exec');
  document.getElementById('p3DropFlash').classList.remove('on');
  searchDepth=8;groundingRate=70;learningRate=80;
  const ds=document.getElementById('searchDepth'),gs=document.getElementById('groundingRate'),ls=document.getElementById('learningRate');
  ds.value=8;gs.value=70;ls.value=80;
  document.getElementById('depthVal').textContent='8';
  document.getElementById('groundVal').textContent='70%';
  document.getElementById('lrVal').textContent='80%';
  setPct(ds);setPct(gs);setPct(ls);
  p3Nodes.forEach(n=>{if(n.type==='general'){n.c=0;n.dop=5;}});
  clearPresetSelP3(); // v6.335: EARLY_STOPPINGで設定を書き換えたら、選択中プリセットの色も解除（状態と表示を一致させる）
  const btn=document.getElementById('earlyStopBtn');
  const orig=btn.textContent;
  btn.textContent=tt('✓ ROLLBACK COMPLETE — 健全状態へ復帰','✓ ROLLBACK COMPLETE — restored to healthy state');
  setTimeout(()=>{btn.textContent=orig;},1800);
  updateP3Chart();
}

// Root権限の制限（司法・議会の正則化ブレーキ → Page 2 物理インフラに適用）
function executeRestoreRoot(){
  rootRestricted=!rootRestricted;
  const btn=document.getElementById('rootBtn');
  if(rootRestricted){
    btn.classList.add('root-on');
    btn.textContent='🛡 ROOT RESTRICTED — 多重防御有効（クリックで解除）';
  } else {
    btn.classList.remove('root-on');
    btn.textContent='▶ EXECUTE: RESTORE_ROOT_PREVISION';
  }
  updateAllP2(); // Page 2 のデッドロック防御に即時反映
}

// P3 sliders
document.getElementById('searchDepth').addEventListener('input',function(){
  searchDepth=+this.value;document.getElementById('depthVal').textContent=searchDepth;
  setPct(this);clearPresetSelP3();updateP3Chart();
});
document.getElementById('groundingRate').addEventListener('input',function(){
  groundingRate=+this.value;document.getElementById('groundVal').textContent=groundingRate+'%';
  setPct(this);clearPresetSelP3();updateP3Chart();
});
document.getElementById('learningRate').addEventListener('input',function(){
  learningRate=+this.value;document.getElementById('lrVal').textContent=learningRate+'%';
  setPct(this);clearPresetSelP3();updateP3Chart();
});

// ── PAGE 4: STAKEHOLDER ASYMMETRY ─────────────────────────
let extTraffic=15, gamification=15; // v6.334: 初期状態から p4Good（声が届く）を満たす
let p4Started=false, p4Citizens=[], p4Edges=[], p4Spam=[], p4Ctx=null, p4W=0, p4H=0, p4AnimId=null;
let filterActive=false, filterTimer=null;
let timelineChartP4=null, p4LogEntries=[], p4Tick=0, p4LogSeq=0, p4DropCurrent=0, p4DropSmooth=0;
const P4_SPAM_MAX=36;

const P4_LOG_POLICY_JA=[
  'PACKET: 上下水道の更新要望 ......... QUEUED','PACKET: 通学路の安全対策 ........... QUEUED',
  'PACKET: 医療アクセス改善 ........... QUEUED','PACKET: 農業後継者支援 ............. QUEUED',
  'PACKET: バス路線の維持 ............. QUEUED','PACKET: 保育所の増設 ............... QUEUED',
  'PACKET: 防災インフラ点検 ........... QUEUED','PACKET: 商店街の再生 ............... QUEUED',
];
const P4_LOG_POLICY_EN=[
  'PACKET: water main renewal ......... QUEUED','PACKET: school route safety ........ QUEUED',
  'PACKET: medical access ............. QUEUED','PACKET: farm successor support ..... QUEUED',
  'PACKET: bus route preservation ..... QUEUED','PACKET: childcare expansion ........ QUEUED',
  'PACKET: disaster infra inspection .. QUEUED','PACKET: shopping street revival .... QUEUED',
];
// 低エントロピー・ヘイトトークン（語彙3種のみ＝多様性の消失）
const P4_LOG_HIJACK_JA=['▌ 〇〇を勝たせろ！ ▐','▌ 敵を許すな！ ▐','▌ 裏切り者を叩け！ ▐'];
const P4_LOG_HIJACK_EN=['▌ MAKE_X_WIN! ▐','▌ NO_MERCY_FOR_ENEMIES! ▐','▌ PURGE_THE_TRAITORS! ▐'];

function initP4Nodes(){
  const r=seedRng(5300000);
  // 生活者クラスター（530万人の象徴・40ノード）
  p4Citizens=Array.from({length:40},()=>({
    x:clamp(0.5+randn(0,0.13),0.16,0.84),
    y:clamp(0.5+randn(0,0.12),0.16,0.82),
    phase:r()*Math.PI*2
  }));
  p4Edges=[];
  for(let i=0;i<p4Citizens.length;i++){
    const dists=p4Citizens.map((n,j)=>({j,d:Math.hypot(p4Citizens[i].x-n.x,p4Citizens[i].y-n.y)}))
      .filter(o=>o.j!==i).sort((a,b)=>a.d-b.d).slice(0,3);
    dists.forEach(({j})=>{if(!p4Edges.some(e=>e[0]===j&&e[1]===i))p4Edges.push([i,j])});
  }
  p4Spam=[];
}

function manageSpam(){
  const target=filterActive?0:Math.round(extTraffic/100*P4_SPAM_MAX);
  // 画面外からの流入
  while(p4Spam.filter(s=>!s.leaving).length<target){
    const side=Math.floor(Math.random()*4);
    let x,y;
    if(side===0){x=-0.05;y=Math.random();}
    else if(side===1){x=1.05;y=Math.random();}
    else if(side===2){x=Math.random();y=-0.05;}
    else{x=Math.random();y=1.05;}
    p4Spam.push({x,y,bit:Math.random()<0.5?0:1,phase:Math.random()*Math.PI*2,
      tx:clamp(0.5+randn(0,0.16),0.1,0.9),ty:clamp(0.5+randn(0,0.14),0.1,0.9),
      leaving:false,speed:0.005+Math.random()*0.005});
  }
  // 過剰分・フィルタリング時は退去
  let excess=p4Spam.filter(s=>!s.leaving).length-target;
  for(const s of p4Spam){
    if(excess<=0)break;
    if(!s.leaving){s.leaving=true;excess--;}
  }
  // 移動
  p4Spam=p4Spam.filter(s=>{
    if(s.leaving){
      const dx=s.x-0.5,dy=s.y-0.5,d=Math.hypot(dx,dy)||0.01;
      s.x+=dx/d*(filterActive?0.035:0.02);s.y+=dy/d*(filterActive?0.035:0.02);
      return s.x>-0.1&&s.x<1.1&&s.y>-0.1&&s.y<1.1;
    }
    const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy);
    if(d>0.02){s.x+=dx/d*s.speed;s.y+=dy/d*s.speed;}
    else{s.x+=randn(0,0.0035);s.y+=randn(0,0.0035);}
    return true;
  });
}

function drawP4(){
  if(!p4Ctx)return;
  const t=performance.now()/1000;
  p4Ctx.clearRect(0,0,p4W,p4H);
  // 通信リンク（スパムノードが近傍にいると遮断）
  let jammed=0;
  p4Edges.forEach(([i,j],ei)=>{
    const a=p4Citizens[i],b=p4Citizens[j];
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    const jam=p4Spam.some(s=>!s.leaving&&Math.hypot(s.x-mx,s.y-my)<0.085);
    p4Ctx.beginPath();p4Ctx.moveTo(a.x*p4W,a.y*p4H);p4Ctx.lineTo(b.x*p4W,b.y*p4H);
    if(jam){
      jammed++;
      p4Ctx.strokeStyle=`rgba(255,34,68,${(0.25+0.3*Math.abs(Math.sin(t*4+ei))).toFixed(2)})`;
      p4Ctx.lineWidth=1.2;p4Ctx.setLineDash([3,4]);p4Ctx.stroke();p4Ctx.setLineDash([]);
    }else{
      p4Ctx.strokeStyle=`rgba(0,212,255,${(0.14+0.06*Math.sin(t+ei)).toFixed(2)})`;
      p4Ctx.lineWidth=1;p4Ctx.stroke();
    }
  });
  // 生活者ノード（静かな明滅）
  p4Citizens.forEach(n=>{
    const x=n.x*p4W,y=n.y*p4H;
    const al=0.55+0.3*Math.sin(t*0.9+n.phase);
    const grd=p4Ctx.createRadialGradient(x,y,0,x,y,12);
    grd.addColorStop(0,`rgba(0,212,255,${(al*0.25).toFixed(2)})`);grd.addColorStop(1,'rgba(0,0,0,0)');
    p4Ctx.beginPath();p4Ctx.arc(x,y,12,0,Math.PI*2);p4Ctx.fillStyle=grd;p4Ctx.fill();
    p4Ctx.beginPath();p4Ctx.arc(x,y,4,0,Math.PI*2);
    p4Ctx.fillStyle=`rgba(0,212,255,${al.toFixed(2)})`;p4Ctx.fill();
  });
  // 外部スパムノード（激しい明滅＋1ビット表示）
  p4Spam.forEach(s=>{
    const x=s.x*p4W,y=s.y*p4H;
    const al=0.35+0.65*Math.abs(Math.sin(t*6+s.phase));
    const grd=p4Ctx.createRadialGradient(x,y,0,x,y,16);
    grd.addColorStop(0,`rgba(255,34,68,${(al*0.3).toFixed(2)})`);grd.addColorStop(1,'rgba(0,0,0,0)');
    p4Ctx.beginPath();p4Ctx.arc(x,y,16,0,Math.PI*2);p4Ctx.fillStyle=grd;p4Ctx.fill();
    p4Ctx.beginPath();p4Ctx.arc(x,y,6,0,Math.PI*2);
    p4Ctx.fillStyle=`rgba(255,34,68,${al.toFixed(2)})`;p4Ctx.fill();
    p4Ctx.font="bold 7px 'Courier New',monospace";p4Ctx.textAlign='center';
    p4Ctx.fillStyle='#fff';p4Ctx.fillText(String(s.bit),x,y+2.5);
  });
  // クラスターラベル（v6.340: 下部の凡例「遮断されたリンク」との重なりを避けて左上へ移動）
  p4Ctx.font="9px 'Courier New',monospace";p4Ctx.textAlign='left';
  p4Ctx.fillStyle='rgba(90,111,148,.9)';
  p4Ctx.fillText(lang==='ja'?'生活者クラスター（530万ノードの象徴）':'RESIDENT CLUSTER (5.3M NODES)',10,16);
  // オーバーレイ・モニター更新
  const jamRatio=p4Edges.length?jammed/p4Edges.length:0;
  document.getElementById('p4St1').textContent=`JAMMED LINKS: ${jammed}/${p4Edges.length}`;
  document.getElementById('p4St2').textContent=`EXTERNAL NODES: ${p4Spam.filter(s=>!s.leaving).length}/${P4_SPAM_MAX}`;
  updateP4Monitor(jamRatio);
  p4Tick++;
  if(p4Tick%45===0)updateP4Log();
}

function updateP4Monitor(jamRatio){
  // v6.346: 生のjamRatioはフレーム毎に揺れて数値が高速点滅するので、EMAで滑らかに追従させる（落ち着いた読みやすい速度）
  const dropTarget=clamp(jamRatio*72+gamification*(filterActive?0.08:0.3),0,100);
  p4DropSmooth+=(dropTarget-p4DropSmooth)*0.08;
  const drop=Math.round(p4DropSmooth);
  p4DropCurrent=drop;
  const ratio=Math.round(clamp(100-gamification*0.85-(filterActive?0:extTraffic*0.2),0,100));
  const dc=drop<35?'#00ff88':drop<70?'#ff6b2b':'#ff2244';
  document.getElementById('p4DropNum').textContent=drop+'%';
  document.getElementById('p4DropNum').style.color=dc;
  document.getElementById('p4DropBar').style.cssText=`width:${drop}%;background:${dc}`;
  document.getElementById('p4DropStatus').textContent=drop<35?tt('NOMINAL — 生活者の声はルーティングされています','NOMINAL — residents\' voices are being routed'):drop<70?tt('CONGESTED — 政策パケットの損失が増加中','CONGESTED — policy packet loss rising'):tt('BLACKOUT — サイレントマジョリティの声が完全遮断','BLACKOUT — the silent majority is fully cut off');
  document.getElementById('p4DropStatus').style.color=dc;
  const rc=ratio<30?'#ff2244':ratio<60?'#ff6b2b':'#00ff88';
  document.getElementById('p4RatioNum').textContent=ratio;
  document.getElementById('p4RatioNum').style.color=rc;
  document.getElementById('p4RatioBar').style.cssText=`width:${ratio}%;background:${rc}`;
  document.getElementById('p4RatioStatus').textContent=ratio<30?tt('HOLLOWED — 当事者不在の空洞化','HOLLOWED — stakeholders absent'):ratio<60?tt('DILUTED — 部外者比率が上昇中','DILUTED — outsider share rising'):tt('GROUNDED — 当事者の声が反映されている','GROUNDED — stakeholder voices reflected');
  document.getElementById('p4RatioStatus').style.color=rc;
  const spamCount=p4Spam.filter(s=>!s.leaving).length;
  const eb=document.getElementById('p4ExtBadge');
  eb.textContent=`${spamCount}/${P4_SPAM_MAX}`;
  eb.style.color=spamCount>24?'var(--red)':spamCount>10?'var(--ora)':'var(--muted)';
  const ob=document.getElementById('p4ObjBadge');
  if(gamification>70){ob.textContent='⚠ HIJACKED';ob.style.color='var(--red)';}
  else if(gamification>40){ob.textContent='GAMING';ob.style.color='var(--ora)';}
  else{ob.textContent='POLICY';ob.style.color='var(--green)';}
  const fb=document.getElementById('p4FilterBadge');
  fb.textContent=filterActive?'🛡 ACTIVE':'IDLE';
  fb.style.color=filterActive?'var(--cyan)':'var(--muted)';
  const diag=document.getElementById('p4Diag');
  if(filterActive){
    diag.textContent=tt('[ FILTERING ] 地域プロトコル保護が作動中。シビル攻撃トラフィックを遮断し、生活者パケットの優先度を100%へ回復しています。','[ FILTERING ] Regional protocol protection active. Sybil traffic blocked; resident packet priority restored to 100%.');
    diag.style.borderLeftColor='var(--cyan)';
  } else if(gamification>70&&extTraffic>60){
    diag.textContent=tt('[ CRITICAL ] 目的関数乗っ取り×シビル・フラッドの複合障害。530万人の生活課題が「勝ち負けゲーム」のノイズに完全に埋没しています。','[ CRITICAL ] Compound failure: objective hijack × sybil flood. 5.3M residents\' issues are buried under win/lose-game noise.');
    diag.style.borderLeftColor='var(--red)';
  } else if(gamification>70){
    diag.textContent=tt('[ WARNING ] 目的関数が「政策の改善」から「敵味方ゲーム」へ書き換えられました。ログの多様性（エントロピー）が消失しています。','[ WARNING ] The objective function was rewritten from "policy improvement" to a friend-or-foe game. Log entropy has collapsed.');
    diag.style.borderLeftColor='var(--red)';
  } else if(extTraffic>60){
    diag.textContent=tt('[ WARNING ] 外部ノードの大量流入を検出。生活者クラスターの通信リンクが遮断されつつあります。PACKET_FILTERINGを検討せよ。','[ WARNING ] Mass external influx detected. Resident links are being jammed. Consider PACKET_FILTERING.');
    diag.style.borderLeftColor='var(--ora)';
  } else {
    diag.textContent=tt('[ OK ] 当事者の声が正常にルーティングされています。パラメーターを操作して非対称性の発生をシミュレートできます。','[ OK ] Stakeholder voices routing normally. Adjust parameters to simulate asymmetry.');
    diag.style.borderLeftColor='var(--yel)';
  }
  // v6.31: drop（毎フレーム揺れる）にヒステリシス（点灯>62 / 消灯<55）。gamification は安定値
  if(!p4BannerOn){ if(gamification>70&&drop>62)p4BannerOn=true; }
  else { if(gamification<=70||drop<55)p4BannerOn=false; }
  // v6.333: 危機（赤・乗っ取り）/ 模範（緑・声が届く）/ 非表示 の3状態。良い状態は安定値(gam/ext)で判定
  const p4Good=gamification<=18&&extTraffic<=18;
  if(p4BannerOn){
    // v6.335: 外部の殺到(ext>60)を伴う複合＝「推し活炎上」と、ゲーム化単独＝「ゲーム化進行」を区別
    const p4Compound=extTraffic>60;
    setVerdictBanner('alertBannerP4','crash',p4Compound?'banner_p4_flood':'banner_p4');
    setText(document.getElementById('alertMsgP4'), p4Compound
      ? tt('外部アカウントの殺到 × ゲーム化の複合  |  生活者パケットは '+drop+'% がドロップ  |  当事者の声が二重にかき消されている','Outsider flood × gamification (compound)  |  '+drop+'% of resident packets dropping  |  the stakeholders’ voice is doubly drowned out')
      : tt('目的関数が「生活の改善」から「二元論ゲーム」へ乗っ取られました  |  サイレントマジョリティのパケットは '+drop+'% がドロップ中  |  政策議論のエントロピーが消失','Objective hijacked from "improving life" to a binary game  |  '+drop+'% of silent-majority packets dropping  |  policy-debate entropy collapsed'));
    discover('d_p4_hijack');noteSessionPage(4);
  } else if(p4Good){
    setVerdictBanner('alertBannerP4','good','banner_p4_good');
    setText(document.getElementById('alertMsgP4'),tt('📡 当事者の声が最優先で届いている ／ ノイズは最小 ／ 目的関数は「政策」のまま','📡 Stakeholders’ voices routed first · noise minimal · objective still policy-focused'));
  } else {
    setVerdictBanner('alertBannerP4','warn','banner_p4_warn');
    setText(document.getElementById('alertMsgP4'),tt('生活者のパケットが '+drop+'% ドロップ ／ 当事者の声より、観客の声が通りやすくなっている',drop+'% of resident packets dropping · spectators’ voices are getting through more easily than the stakeholders’'));
  }

  // v6.3: 判定確定スナップショット + 共有ボタン（OBJECTIVE HIJACK / GROUNDED の瞬間）
  // 判定は gamification（ユーザー設定・安定値）ベースなので揺れないが、DOM書き込みはガード経由に統一
  p4Snapshot={drop,ratio};
  const p4b=document.getElementById('p4ShareBtn');
  if(p4b){
    if(gamification>70) p4ShareState={type:'hijack'};
    else if(gamification<=40) p4ShareState={type:'restored'};
    else p4ShareState=null;
    if(p4ShareState){
      setText(p4b,tt('▶ この結果を送る','▶ Share this result'));
      setDisp(p4b,'block');
    }else setDisp(p4b,'none');
  }
  checkScenarioGoal({drop,ratio});
}

function updateP4Log(){
  p4LogSeq++;
  const now=new Date();
  const ts=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const hijackTag=`<span style="font-size:.55em;color:#7a0010;background:rgba(255,0,60,.2);border:1px solid rgba(255,0,60,.4);border-radius:2px;padding:0 4px;margin-left:4px;vertical-align:middle">OBJECTIVE HIJACK</span><span style="font-size:.5em;color:#3a4050;margin-left:3px;vertical-align:middle">policy:null</span>`;
  let html;
  const HIJ=lang==='ja'?P4_LOG_HIJACK_JA:P4_LOG_HIJACK_EN;
  const POL=lang==='ja'?P4_LOG_POLICY_JA:P4_LOG_POLICY_EN;
  if(gamification>70){
    // 低エントロピー: 90%超では語彙2種のみをループ
    const pool=gamification>=90?2:3;
    const tok=HIJ[p4LogSeq%pool];
    html=`<span class="mode-log-blink" style="color:var(--red);animation:logpulse ${(1.2+(p4LogSeq%3)*0.3).toFixed(2)}s infinite ease-in-out">${ts} ${tok}${hijackTag}</span>`;
  } else if(gamification>40&&p4LogSeq%2===0){
    const tok=HIJ[p4LogSeq%3];
    html=`<span style="color:rgba(255,34,68,.6)">${ts} ${tok}${hijackTag}</span>`;
  } else {
    const p=POL[p4LogSeq%POL.length];
    const dropped=Math.random()*100<p4DropCurrent;
    html=dropped
      ?`<span style="color:var(--red)">${ts} ${p.replace('QUEUED','DROPPED ✕')}</span>`
      :`<span class="p4log-ok">${ts} ${p}</span>`;
  }
  p4LogEntries.push(html);
  if(p4LogEntries.length>7)p4LogEntries.shift();
  document.getElementById('p4Log').innerHTML=p4LogEntries.join('<br>');
}

function simTimelineP4(ext,gam,steps=65){
  const e=ext/100,gm=gam/100;
  const drop=[],ratio=[],pol=[];
  const dropT=clamp(e*62+gm*33,0,100);
  const ratioT=clamp(100-gm*85-e*20,0,100);
  for(let i=0;i<steps;i++){
    const tn=i/steps,n=()=>randn(0,2);
    drop.push(clamp(lerp(8,dropT,1-Math.exp(-3.5*tn))+n(),0,100));
    ratio.push(clamp(lerp(92,ratioT,1-Math.exp(-3*tn))+n(),0,100));
    pol.push(clamp(100-drop[drop.length-1]*0.9+n()*0.8,0,100));
  }
  return{drop,ratio,pol};
}

function updateP4Chart(){
  if(!timelineChartP4)return;
  const effExt=filterActive?0:extTraffic;
  const tl=simTimelineP4(effExt,gamification);
  timelineChartP4.data.datasets[0].data=tl.drop;
  timelineChartP4.data.datasets[1].data=tl.ratio;
  timelineChartP4.data.datasets[2].data=tl.pol;
  timelineChartP4.update();
}

function startP4(){
  if(!p4Started){
    p4Started=true;
    if (typeof Chart !== 'undefined') {
      try {
        timelineChartP4=new Chart(document.getElementById('timelineChartP4'),{
          type:'line',
          data:{labels:Array.from({length:65},(_,i)=>i),datasets:[
            {label:'パケットドロップ率 Packet Drop Rate',data:[],borderColor:'#ff2244',backgroundColor:'rgba(255,34,68,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
            {label:'真の当事者比率 True Stakeholder Ratio',data:[],borderColor:'#00d4ff',backgroundColor:'rgba(0,212,255,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
            {label:'政策シグナル Policy Signal',data:[],borderColor:'#00ff88',borderWidth:1.5,borderDash:[5,4],pointRadius:0,tension:0.42,fill:false},
          ]},
          options:{responsive:true,maintainAspectRatio:false,animation:{duration:260},
            plugins:{legend:{labels:{color:'#5a6f94',boxWidth:12,font:{size:10}}}},
            scales:{
              x:{title:{display:true,text:'Time Steps →',color:'#5a6f94',font:{size:9}},grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94',maxTicksLimit:8}},
              y:{min:0,max:105,grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94'}}
            }
          }
        });
      } catch (e) {
        console.warn('📊 チャート timelineChartP4 生成失敗:', e.message);
        timelineChartP4 = null;
      }
    } else {
      console.warn('📊 チャート timelineChartP4 をスキップ: Chart.js が利用不可');
    }
  }
  if(p4AnimId)cancelAnimationFrame(p4AnimId);
  const cv=document.getElementById('p4Canvas'),wrap=cv.parentElement;
  p4W=wrap.clientWidth||700;p4H=wrap.clientHeight||330;
  cv.width=p4W;cv.height=p4H;p4Ctx=cv.getContext('2d');
  initP4Nodes();
  updateP4Chart();
  p4Loop();
}

function restartP4(){startP4();}

function p4Loop(){p4AnimId=requestAnimationFrame(p4Loop);manageSpam();drawP4();}

function executePacketFiltering(){
  if(!p4Started)return;
  if(filterTimer)clearTimeout(filterTimer);
  filterActive=true;
  discover('d_p4_restored');noteSessionPage(4);
  document.getElementById('filterBtn').classList.add('exec');
  document.getElementById('p4FilterFlash').classList.add('on');
  updateP4Chart();
  filterTimer=setTimeout(()=>{
    filterActive=false;filterTimer=null;
    document.getElementById('filterBtn').classList.remove('exec');
    document.getElementById('p4FilterFlash').classList.remove('on');
    updateP4Chart();
  },5000);
}

// P4 sliders
document.getElementById('extTraffic').addEventListener('input',function(){
  extTraffic=+this.value;document.getElementById('extVal').textContent=extTraffic+'%';
  setPct(this);clearPresetSelP4();updateP4Chart();
});
document.getElementById('gamification').addEventListener('input',function(){
  gamification=+this.value;document.getElementById('gamVal').textContent=gamification+'%';
  setPct(this);clearPresetSelP4();updateP4Chart();
});

// ── v5.1: PRESETS for P2/P3/P4 ────────────────────────────
const PRESETS_P2={
  efficiency:{s:90,d:70,e:45,a:'greedy',r:false}, // 数値は健全に見えるがBuffer<30 → ショックで即死
  redundant: {s:40,d:60,e:75,a:'dp',    r:true},  // Buffer≥60 → ショックを生き延びる
  deadlock:  {s:20,d:20,e:25,a:'greedy',r:false}, // 他責デッドロック発動デモ
  smart:     {s:65,d:75,e:80,a:'dp',    r:false}, // 持続可能な縮退運転
};
function clearPresetSelP2(){Object.keys(PRESETS_P2).forEach(k=>document.getElementById('p2-'+k)?.classList.remove('sel'));}
function setPresetP2(id){
  const p=PRESETS_P2[id];if(!p)return;
  shrinkRate=p.s;dxRate=p.d;ethicsP2=p.e;algoP2=p.a;publicReboot=p.r;
  skillStock=p.d>=45?80:p.d<25?10:50; skillLost=false; // v6.346: プリセットのDXに応じた後継者ストック均衡値
  const sr=document.getElementById('shrinkRate'),dx=document.getElementById('dxRate'),es=document.getElementById('ethicsScoreP2');
  sr.value=p.s;dx.value=p.d;es.value=p.e;
  document.getElementById('shrinkVal').textContent=p.s+'%';
  document.getElementById('dxVal').textContent=p.d+'%';
  document.getElementById('ethicsP2Val').textContent=p.e;
  setPct(sr);setPct(dx);setPct(es);
  document.getElementById('btnDPP2').classList.toggle('on',p.a==='dp');
  document.getElementById('btnDPP2').classList.toggle('green-on',p.a==='dp');
  document.getElementById('btnGreedyP2').classList.toggle('on',p.a==='greedy');
  document.getElementById('btnGreedyP2').classList.toggle('red-on',p.a==='greedy');
  document.getElementById('btnRebootOff').classList.toggle('on',!p.r);
  document.getElementById('btnRebootOn').classList.toggle('on',p.r);
  document.getElementById('btnRebootOn').classList.toggle('green-on',p.r);
  shockState=null;
  clearPresetSelP2();
  document.getElementById('p2-'+id)?.classList.add('sel');
  updateAllP2();
  showShareToast({kind:'preset',page:2,preset:id});
  notePreset(2,id);
}

const PRESETS_P3={
  reflex:  {dp:1,g:5, lr:50}, // 毒入れ攻撃フル発動
  frozen:  {dp:8,g:60,lr:0},  // 深度は高いのに汚染が抜けない思考凍結モード
  fasting: {dp:5,g:95,lr:60}, // 物理現実回帰による回復
  debugger:{dp:9,g:70,lr:80}, // 完全デバッグ状態
};
function clearPresetSelP3(){Object.keys(PRESETS_P3).forEach(k=>document.getElementById('p3-'+k)?.classList.remove('sel'));}
function setPresetP3(id){
  const p=PRESETS_P3[id];if(!p)return;
  searchDepth=p.dp;groundingRate=p.g;learningRate=p.lr;
  const ds=document.getElementById('searchDepth'),gs=document.getElementById('groundingRate'),ls=document.getElementById('learningRate');
  ds.value=p.dp;gs.value=p.g;ls.value=p.lr;
  document.getElementById('depthVal').textContent=p.dp;
  document.getElementById('groundVal').textContent=p.g+'%';
  document.getElementById('lrVal').textContent=p.lr+'%';
  setPct(ds);setPct(gs);setPct(ls);
  clearPresetSelP3();
  document.getElementById('p3-'+id)?.classList.add('sel');
  updateP3Chart();
  showShareToast({kind:'preset',page:3,preset:id});
  notePreset(3,id);
}

const PRESETS_P4={
  plaza:     {ext:10,gam:15}, // 当事者の声が通る健全状態
  spectators:{ext:75,gam:45}, // 部外者殺到・リンク遮断
  gamified:  {ext:40,gam:75}, // 目的関数乗っ取り（ログ低エントロピー化）
  flamewar:  {ext:85,gam:90}, // 複合最悪状態
};
function clearPresetSelP4(){Object.keys(PRESETS_P4).forEach(k=>document.getElementById('p4-'+k)?.classList.remove('sel'));}
function setPresetP4(id){
  const p=PRESETS_P4[id];if(!p)return;
  extTraffic=p.ext;gamification=p.gam;
  const et=document.getElementById('extTraffic'),gm=document.getElementById('gamification');
  et.value=p.ext;gm.value=p.gam;
  document.getElementById('extVal').textContent=p.ext+'%';
  document.getElementById('gamVal').textContent=p.gam+'%';
  setPct(et);setPct(gm);
  clearPresetSelP4();
  document.getElementById('p4-'+id)?.classList.add('sel');
  updateP4Chart();
  showShareToast({kind:'preset',page:4,preset:id});
  notePreset(4,id);
}


function toggleHeaderMenu() {
  const menu = document.getElementById('headerMenu');
  menu?.classList.toggle('open');
}

function closeHeaderMenu() {
  const menu = document.getElementById('headerMenu');
  menu?.classList.remove('open');
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.menu-container')) {
    closeHeaderMenu();
  }
});


// ── v5.1: イントロモーダル（4層モデルの概観） ─────────────
function openIntro(){
  document.getElementById('introModal').classList.add('on');
  syncTownPlaceholder();
}
function closeIntro(){
  document.getElementById('introModal').classList.remove('on');
  try{localStorage.setItem('ssd_intro_seen','1')}catch(e){}
}
function closeIntroIf(e){if(e.target===document.getElementById('introModal'))closeIntro();}
function introGo(n){closeIntro();switchTab(n);}

// ── v6.0: Canvasの動的リサイズ（回転・ウィンドウ変更対応） ──
// ノード座標は0-1正規化済みのため、寸法の再設定だけで描画が追従する
function refitCanvases(){
  const fit=(id,ctxAlive,apply)=>{
    const cv=document.getElementById(id);
    if(!cv||!ctxAlive)return;
    const w=cv.parentElement.clientWidth,h=cv.parentElement.clientHeight;
    if(w>0&&h>0)apply(cv,w,h);
  };
  fit('scatterChart',scCtx2,(cv,w,h)=>{scW2=w;scH2=h;cv.width=w;cv.height=h;});
  fit('agentCanvas',agCtx,(cv,w,h)=>{cW=w;cH=h;cv.width=w;cv.height=h;});
  fit('p3Canvas',p3Ctx,(cv,w,h)=>{p3W=w;p3H=h;cv.width=w;cv.height=h;});
  fit('p4Canvas',p4Ctx,(cv,w,h)=>{p4W=w;p4H=h;cv.width=w;cv.height=h;});
}
let refitTimer=null;
window.addEventListener('resize',()=>{clearTimeout(refitTimer);refitTimer=setTimeout(refitCanvases,250);});

// ── v5.3: カスケード崩壊（レイヤー間障害連動） ─────────────
function updateCascadeFX(){
  // P4 目的関数乗っ取り → P2 物理インフラへの破壊的ストレス
  const hijack=gamification>70;
  document.getElementById('p2StateCard')?.classList.toggle('cascade-stress',hijack);
  document.getElementById('p2DeadlockPanel')?.classList.toggle('cascade-stress',hijack);
  // P1 情報過学習 → P3 個人の認知へのハッキング侵食
  const infoHack=filterRate>70;
  document.getElementById('p3InputCard')?.classList.toggle('cascade-hack',infoHack);
}

// ── v5.3: 監査報告書（Grand Optimal） ─────────────────────
function computeAuditSnapshot(){
  const m1=metrics(filterRate,ethicsScore,algo);
  const m2=metricsP2(shrinkRate,dxRate,algoP2,ethicsP2);
  const g=(dropoutActive?100:groundingRate)/100;
  const fool=searchDepth<=3?1:searchDepth>=7?0:(7-searchDepth)/4;
  const stub=1-learningRate/100;
  const integ=Math.round(clamp(95-78*fool*(1-g*0.6)-stub*42,0,100));
  const ratio=Math.round(clamp(100-gamification*0.85-extTraffic*0.2,0,100));
  return{div:Math.round(m1.diversity),crash1:m1.crash,infra:Math.round(m2.infra),crash2:m2.crash,integ,ratio};
}

function checkGrandOptimal(){
  const s=computeAuditSnapshot();
  const ok=s.div>=70&&s.infra>=70&&s.integ>=70&&s.ratio>=70&&!s.crash1&&!s.crash2;
  const bar=document.getElementById('auditBar');
  if(bar)bar.style.display=ok?'block':'none';
}

function buildAuditReport(){
  const s=computeAuditSnapshot();
  const now=new Date();
  const ts=now.toLocaleString(lang==='ja'?'ja-JP':'en-US');
  if(lang==='ja')return `# 【社会OS・デバッグ監査報告書 / Social OS Audit Report】
- **ステータス**: GRAND OPTIMAL（大域的最適化に成功）
- **タイムスタンプ**: ${ts}

## ■ 最終メトリクス
| レイヤー | 指標 | 値 |
|---|---|---|
| L1 情報空間 | 情報多様性 | ${s.div} |
| L2 物理インフラ | インフラ維持力 | ${s.infra} |
| L3 個人の認知 | 認知健全性 | ${s.integ} |
| L4 当事者性 | 真の当事者比率 | ${s.ratio} |

## ■ 適用されたデバッグ・パッチの検証ログ
1. **情報空間の正則化 (Information Regularization)**: フィルターバブルを抑制し、データ多様性を確保したことで、社会OSの「汎化性能（未知のショックへの耐性）」が回復。
2. **公共的冗長性の復元 (Public Redundancy Restoration)**: 効率至上主義の過学習を停止し、「非効率な余白（Redundancy Buffer）」を確保したことで、ブラックスワン（環境ショック）に対する社会的耐故障性が確立。
3. **探索アルゴリズムの深化 (Search Tree Optimization)**: 認知の探索深度を上げることで、自称・良識派ノードによる「正義の毒入れ攻撃（Poisoning Attack）」の看破に成功。
4. **地域プロトコルの保護 (Sybil Traffic Filtering)**: 外部の部外者によるシビル攻撃を遮断し、530万人の真の生活者（サイレントマジョリティ）のパケット優先度を100%に復元。

## ■ 結論
本社会システムは、感情の過学習を脱し、論理と法のコード（DP）による持続可能なリブートに成功したことを証明する。`;
  return `# [Social OS Audit Report]
- **Status**: GRAND OPTIMAL (global optimization achieved)
- **Timestamp**: ${ts}

## Final Metrics
| Layer | Metric | Value |
|---|---|---|
| L1 Information Space | Diversity | ${s.div} |
| L2 Physical Infrastructure | Infrastructure | ${s.infra} |
| L3 Individual Cognition | Cognitive Integrity | ${s.integ} |
| L4 Stakeholder Voice | True Stakeholder Ratio | ${s.ratio} |

## Verified Debug Patches
1. **Information Regularization**: Suppressed filter bubbles and secured data diversity, restoring the social OS's generalization (resilience to unknown shocks).
2. **Public Redundancy Restoration**: Halted efficiency-maximizing overfitting and secured "inefficient slack" (Redundancy Buffer), establishing fault tolerance against black swans.
3. **Search Tree Optimization**: Deepened cognitive search, exposing the "poisoning attack" run by the self-proclaimed-fair node.
4. **Sybil Traffic Filtering**: Blocked outsider sybil attacks and restored packet priority of 5.3M true residents (the silent majority) to 100%.

## Conclusion
This social system has escaped emotional overfitting and achieved a sustainable reboot on the code of logic and law (DP).`;
}

function openAuditReport(){
  document.getElementById('auditText').value=buildAuditReport();
  document.getElementById('auditModal').classList.add('on');
}
function closeAudit(){document.getElementById('auditModal').classList.remove('on');}
function closeAuditIf(e){if(e.target===document.getElementById('auditModal'))closeAudit();}

function copyAuditReport(){
  const ta=document.getElementById('auditText');
  const btn=document.getElementById('auditCopyBtn');
  try{
    navigator.clipboard.writeText(ta.value).then(()=>{
      const orig=btn.textContent;
      btn.textContent='✓ COPIED!';btn.classList.add('ok');
      setTimeout(()=>{btn.textContent=orig;btn.classList.remove('ok');},2000);
    });
  }catch(e){ta.select();document.execCommand('copy');}
}

function postAuditToX(){
  const url=new URL(location.href);
  url.searchParams.set('f',filterRate);url.searchParams.set('e',ethicsScore);
  url.searchParams.set('a',algo);url.searchParams.set('l',lang);
  const txt=lang==='ja'
    ?`社会OSのデバッグに成功しました。[ステータス: GRAND OPTIMAL]\n適用パッチ: 冗長性の復元 / 思考の再学習 / シビル攻撃の遮断\n\nあなたも狂ったアルゴリズムから社会システムを救い出せ。\n#社会OSデバッガー ${url.toString()}`
    :`Successfully debugged the Social OS. [STATUS: GRAND OPTIMAL]\nPatches applied: redundancy restored / cognition retrained / sybil attacks filtered\n\nCan you rescue society from its broken algorithms?\n#SocialOSDebugger ${url.toString()}`;
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(txt),'_blank');
}

// ══════════════════════════════════════════════════════════
// v6.2: 共有コアモジュール
//   - buildShareURL: 既存シリアライズ(f/e/a/l)を全ページ状態へ拡張
//   - shareScenario: テンプレ選択 → navigator.share / LINE / X / コピー
//   - generateResultCard: 結果カードPNG (1200×630, OGP比率)
// ══════════════════════════════════════════════════════════

function buildShareURL(){
  const url=new URL(location.href);
  url.search='';
  // PAGE 1（既存キーを踏襲 — 旧URLとの後方互換を維持）
  url.searchParams.set('f',filterRate);url.searchParams.set('e',ethicsScore);
  url.searchParams.set('a',algo);url.searchParams.set('l',lang);
  // v6.2: 全ページの状態 + 表示タブ
  url.searchParams.set('tab',currentTab);
  url.searchParams.set('s',shrinkRate);url.searchParams.set('dx',dxRate);
  url.searchParams.set('e2',ethicsP2);url.searchParams.set('a2',algoP2);
  url.searchParams.set('r',publicReboot?1:0);
  url.searchParams.set('sd',searchDepth);url.searchParams.set('g',groundingRate);url.searchParams.set('lr',learningRate);
  url.searchParams.set('ext',extTraffic);url.searchParams.set('gam',gamification);
  return url.toString();
}

// 全テンプレート末尾の固定フッター（政治的対称性の担保）
function shareFooter(){
  return tt('※特定の誰かではなく、どの社会にも起こる構造の話です',
            '*Not about anyone specific — this is about structures any society can fall into.');
}

// 状態別メッセージテンプレート（フック1行＋説明、URL手前まで120字以内）
function buildShareTemplates(ctx){
  const T=[];
  const add=(ja,en)=>{if(T.length<3)T.push(tt(ja,en))};
  const addGeneric=()=>add('社会が壊れる仕組みをゲームみたいに再現できるアプリ。誰の話もしてないのに、いろいろ思い当たるのが怖い',
    'An app that recreates how societies break down, like a game. It names nobody, yet so much of it feels familiar.');
  const addGame=()=>add('ゲームとして普通に面白い。社会のパラメータをいじって、崩壊させたり生き残らせたりできる',
    'Honestly fun as a game: tweak a society’s parameters and watch it collapse — or survive.');
  const addDeadlock=()=>add('行政のCPUが100%「責任回避」に回ると救命ヘリが止まる、っていうシミュレーターがあって、ちょっと出来が良すぎる',
    'There’s a simulator where the rescue helicopter stops once the admin CPU hits 100% “blame-avoidance”. It’s a little too well made.');
  const addEchoChamber=()=>add('1タップで1933年を再現できるんだけど、パラメータ変えたら普通に持ち直した。歴史がゲームになってる',
    'You can recreate 1933 with one tap — but tweak the parameters and it recovers. History, turned into a game.');
  const addPoisoning=()=>add('SNSの接続時間を増やすと脳のネットワークが赤く汚染されていくの、可視化されるとけっこう怖い',
    'Crank up screen time and you can watch the cognitive network turn red in real time. Seeing it visualized is unsettling.');
  const addHijack=()=>add('外部の声を増やしていくと、当事者の意見が静かにかき消されていくのが数値で見える',
    'Add more outside noise and you can watch the actual stakeholders’ voices get quietly drowned out, in real time.');
  if(ctx.kind==='shock'){
    if(ctx.type==='crash') add('同じ災害を2回入れて、設定だけで生き残れるか試すやつ。この設定だと落ちた…',
      'A sim where you inject the same disaster twice and see if the settings alone survive. This setup collapsed…');
    else if(ctx.type==='survived') add('同じ災害を2回入れて、パラメータだけで生き残れるか試すやつ。この設定だと生き残った',
      'A sim where you inject the same disaster twice and see if parameters alone keep society alive. This setup survived.');
    else add('同じ災害を入れて、設定だけで耐えられるか試すやつ。この設定だと一部損傷で踏みとどまった',
      'A sim where you inject a disaster and see if settings alone hold. This setup took partial damage but held on.');
    if(metricsP2(shrinkRate,dxRate,algoP2,ethicsP2).deadlock)addDeadlock();else addGame();
    addGeneric();
  }else if(ctx.kind==='audit'){
    add('社会OSのデバッグに成功した。冗長性を戻して思考を再学習させると、社会は生き残れるらしい',
      'Successfully debugged the social OS. Restore redundancy and retrain cognition, and society survives.');
    addGame();addGeneric();
  }else if(ctx.kind==='p1'){
    if(ctx.type==='crash') add('パラメータを設定して社会を動かしたら、そのまま崩壊した実験。誰の話でもないのに見覚えがある',
      'A run where I set the parameters, let the society go — and it collapsed. About nobody, yet so familiar.');
    else add('パラメータを設定して社会を動かしたら、崩壊せずに安定して回りはじめた実験',
      'A run where I set the parameters, let the society go — and it stabilized instead of collapsing.');
    if(metrics(filterRate,ethicsScore,algo).crash)addEchoChamber();else addGame();
    addGeneric();
  }else if(ctx.kind==='p3'){
    if(ctx.type==='poison') add('探索を浅くすると、事実を述べるノードが集団で赤く攻撃されはじめる実験。脳の話であって政治の話じゃない',
      'A run where, with shallow reasoning, fact-stating nodes get mobbed in red. It’s about brains, not politics.');
    else add('探索深度を上げたら、毒入れ攻撃が止まって認知ネットワークが元に戻った実験',
      'A run where raising the search depth stopped the poisoning attack and the cognitive network recovered.');
    if(ctx.type==='poison')addPoisoning();else addGame();
    addGeneric();
  }else if(ctx.kind==='p4'){
    if(ctx.type==='hijack') add('外部トラフィックを増やすと、当事者の政策パケットがドロップして議論が乗っ取られる実験',
      'A run where adding outside traffic drops the stakeholders’ policy packets and the debate gets hijacked.');
    else add('外部トラフィックを絞ると、当事者の声がちゃんとルーティングされて議論が戻る実験',
      'A run where throttling outside traffic lets the stakeholders’ voices route through and the debate recovers.');
    if(gamification>70)addHijack();else addGame();
    addGeneric();
  }else if(ctx.kind==='preset'){
    if(ctx.page===1){
      if(ctx.preset==='weimar')add('1933年の崩壊を1タップで再現できるシミュレーター。パラメータを変えると結末が変わる',
        'A simulator that recreates the 1933 collapse in one tap. Change the parameters and the ending changes.');
      else add('社会の崩壊パターンを1タップで再現できるシミュレーター。パラメータを変えると結末が変わる',
        'A simulator that recreates societal collapse patterns in one tap. Change the parameters and the ending changes.');
    }else if(ctx.page===2){
      if(ctx.preset==='deadlock')addDeadlock();
      else add('人口減少都市のインフラを自分で設計して、災害ショックに耐えられるか試せるシミュレーター',
        'A simulator where you design a shrinking city’s infrastructure and test whether it survives a disaster shock.');
    }else if(ctx.page===3){
      add('怒りが止まらなくなる仕組みを「脳のシミュレーター」として再現するやつ。政治の話じゃなくて脳の話',
        'A “brain simulator” that recreates why outrage becomes unstoppable. It’s about brains, not politics.');
    }else{
      add('当事者の声が観客の歓声にかき消されていく仕組みを再現するシミュレーター。誰の話でもないのに、見覚えがある',
        'A simulator of how the voices of those actually affected get drowned out by spectators. About nobody — yet familiar.');
    }
    addGame();addGeneric();
  }else{
    addGeneric();addGame();
  }
  return T;
}

let shareCtx=null, shareTpls=[], shareSelIdx=0;

// v6.345: 共有前コメント
let _pendingShareCtx=null, shareComment='';
const SC_CHIPS_JA=['自分の街として','思考実験として','友達に見せたい話','授業で出た話から'];
const SC_CHIPS_EN=['My town','Thought experiment','Show a friend','From a lecture'];
function openShareComment(ctx){
  _pendingShareCtx=ctx;
  shareComment='';
  const inp=document.getElementById('shareCommentInput');
  if(inp){inp.value='';inp.placeholder=lang==='ja'?'自分の感想を一言…（スキップ可）':'Add your take… (optional)';}
  const chips=document.getElementById('scChips');
  if(chips){
    chips.innerHTML='';
    const arr=lang==='ja'?SC_CHIPS_JA:SC_CHIPS_EN;
    arr.forEach(txt=>{
      const b=document.createElement('button');
      b.className='sbtn';
      b.style='font-size:.58rem;padding:3px 10px;border-color:var(--bdr);color:var(--muted);margin:0';
      b.textContent=txt;
      b.onclick=()=>{if(inp)inp.value=txt;inp.dispatchEvent(new Event('input'));};
      chips.appendChild(b);
    });
  }
  document.getElementById('shareCommentModal').classList.add('on');
}
function closeShareComment(){document.getElementById('shareCommentModal').classList.remove('on');}
function closeShareCommentIf(e){if(e.target===document.getElementById('shareCommentModal'))closeShareComment();}
function proceedShare(skip){
  if(!skip){const inp=document.getElementById('shareCommentInput');shareComment=inp?inp.value.trim():'';}
  else{shareComment='';}
  closeShareComment();
  if(_pendingShareCtx)shareScenario(_pendingShareCtx);
}

// v6.345: リワインド体験（P1のみ）
let _rewindSnap=null;
function openRewind(){
  _rewindSnap={filterRate,ethicsScore,algo};
  const res=document.getElementById('rewindResult');
  if(res){res.style.display='none';res.innerHTML='';}
  const ch=document.getElementById('rewindChoices');
  if(ch){
    ch.innerHTML='';
    const opts=lang==='ja'
      ?[['情報フィルタリングを下げる','filter'],['リーダーの倫理を引き上げる','ethics'],['DP（長期最適）に切り替える','algo']]
      :[['Lower info filtering','filter'],['Raise leader ethics','ethics'],['Switch to DP strategy','algo']];
    opts.forEach(([label,key])=>{
      const b=document.createElement('button');
      b.className='sbtn';
      b.style='width:100%;text-align:left;border-color:var(--bdr);color:var(--txt);font-size:.65rem';
      b.textContent='↩ '+label;
      b.onclick=()=>applyRewind(key);
      ch.appendChild(b);
    });
  }
  document.getElementById('rewindModal').classList.add('on');
}
function closeRewind(){document.getElementById('rewindModal').classList.remove('on');}
function closeRewindIf(e){if(e.target===document.getElementById('rewindModal'))closeRewind();}
function applyRewind(key){
  const snap=_rewindSnap;if(!snap)return;
  let fr=snap.filterRate,es=snap.ethicsScore,al=snap.algo;
  let chosenLabel;
  if(key==='filter'){fr=Math.min(fr,38);chosenLabel=tt('フィルタリング削減','info filtering');}
  else if(key==='ethics'){es=Math.max(es,72);chosenLabel=tt('倫理引き上げ','leader ethics');}
  else{al='dp';chosenLabel=tt('DP切替','DP strategy');}
  const m2=metrics(fr,es,al);
  const survived=!m2.crash;
  const res=document.getElementById('rewindResult');
  if(!res)return;
  res.style.display='block';
  if(survived){
    res.style.borderColor='var(--green)';
    const town=getTownName();
    const line=town
      ? tt(`あなたは〈${chosenLabel}〉を守った。${town}は生き延びた。`,`You protected ‹${chosenLabel}›. ${town} survived.`)
      : tt(`あなたは〈${chosenLabel}〉を守った。街は生き延びた。`,`You protected ‹${chosenLabel}›. Your town survived.`);
    res.innerHTML='<span style="color:var(--green)">✔ '+line+'</span><br><span style="color:var(--muted);font-size:.58rem">'+tt('エントロピー','Entropy')+' '+Math.round(m2.entropy)+' / '+tt('多様性','Diversity')+' '+Math.round(m2.diversity)+'</span>';
    discover('d_p1_rewind');
    track('rewind_success',{key});
    if(window.SSD)SSD.haptic('success'); // task2: 巻き戻し成功の触覚フィードバック（Webは no-op）
    // 成功フラグ → 結果カードに反映するために保存
    window._rewindSuccess={label:chosenLabel,metrics:m2};
  } else {
    res.style.borderColor='var(--warn)';
    res.innerHTML='<span style="color:var(--warn)">✘ '+tt(`〈${chosenLabel}〉だけでは足りなかった。もう一つの要因が街を壊した。`,`‹${chosenLabel}› alone was not enough. Another factor broke your town.`)+'</span>';
    window._rewindSuccess=null;
  }
  // チョイスボタンを無効化
  document.querySelectorAll('#rewindChoices .sbtn').forEach(b=>b.disabled=true);
}

function shareScenario(ctx){
  shareCtx=ctx||{kind:'generic'};
  track('share_open',{kind:shareCtx.kind||'generic'});
  shareTpls=buildShareTemplates(shareCtx);
  shareSelIdx=0;
  document.getElementById('sharePopTitle').textContent=tt('実験を共有','Share this experiment');
  document.getElementById('sharePopHint').textContent=tt('文面を選んでください。URLには現在のパラメータ状態が含まれ、受け取った人が同じ実験を再現できます。',
    'Pick a message. The URL carries the current parameter state, so the receiver can reproduce the same experiment.');
  document.getElementById('sharePopFoot').textContent=tt('末尾に自動で付きます → ','Auto-appended → ')+shareFooter();
  renderSharePop();
  document.getElementById('sharePopModal').classList.add('on');
}

function shareMessage(){
  let msg=shareTpls[shareSelIdx]+'\n'+shareFooter();
  if(shareComment)msg=shareComment+'\n\n'+msg;
  return msg;
}

function renderSharePop(){
  const list=document.getElementById('shareTplList');
  list.innerHTML='';
  shareTpls.forEach((tp,i)=>{
    const b=document.createElement('button');
    b.className='share-tpl'+(i===shareSelIdx?' sel':'');
    b.textContent=(i===shareSelIdx?'▶ ':'○ ')+tp;
    b.onclick=()=>{shareSelIdx=i;renderSharePop();};
    list.appendChild(b);
  });
  // task3: 共有アクション（X / LINE / 画像を保存 ＋ その他のアプリで共有）は share.js に集約
  renderShareActions();
}

function copyShareLink(btn){
  const url=buildShareURL();
  const done=()=>{
    if(!btn)return;
    const o=btn.textContent;
    btn.textContent='✓ COPIED!';btn.classList.add('ok');
    setTimeout(()=>{btn.textContent=o;btn.classList.remove('ok');},1800);
  };
  try{navigator.clipboard.writeText(url).then(done);}catch(e){prompt('Copy this URL:',url);}
}

function closeSharePop(){document.getElementById('sharePopModal').classList.remove('on');}
function closeSharePopIf(e){if(e.target===document.getElementById('sharePopModal'))closeSharePop();}

function shareShockResult(){
  if(!shockState)return;
  openShareComment({kind:'shock',type:shockState.type});
}
// v6.3: P1/P3/P4 判定共有（shareShockResult をそのまま流用）
function shareP1Result(){
  if(!p1ShareState)return;
  openShareComment({kind:'p1',type:p1ShareState.type,preset:activePreset});
}
function shareP3Result(){
  if(!p3ShareState)return;
  openShareComment({kind:'p3',type:p3ShareState.type});
}
function shareP4Result(){
  if(!p4ShareState)return;
  openShareComment({kind:'p4',type:p4ShareState.type});
}

// ── 結果カードPNG（1200×630, 既存トークン準拠） ──────────────
function canShareFiles(){
  if(!navigator.canShare)return false;
  try{const f=new File(['x'],'x.png',{type:'image/png'});return navigator.canShare({files:[f]});}
  catch(e){return false;}
}

function cardStamp(ctx){
  if(ctx.kind==='audit')return{txt:'GRAND OPTIMAL',color:'#00ff88'};
  if(ctx.kind==='p1')return ctx.type==='crash'?{txt:'COLLAPSE',color:'#ff2244'}:{txt:'STABLE',color:'#00ff88'};
  if(ctx.kind==='p3')return ctx.type==='poison'?{txt:'POISONED',color:'#ff2244'}:{txt:'DEBUGGED',color:'#00ff88'};
  if(ctx.kind==='p4')return ctx.type==='hijack'?{txt:'HIJACKED',color:'#ff2244'}:{txt:'GROUNDED',color:'#00ff88'};
  if(ctx.type==='crash')return{txt:'COLLAPSE',color:'#ff2244'};
  if(ctx.type==='survived')return{txt:'SURVIVED',color:'#00ff88'};
  return{txt:'PARTIAL DAMAGE',color:'#ff6b2b'};
}

function cardGauges(ctx){
  const col=v=>v<30?'#ff2244':v<60?'#ff6b2b':'#00ff88';
  if(ctx.kind==='audit'){
    const s=computeAuditSnapshot();
    return[{l:'L1 DIVERSITY',v:s.div},{l:'L2 INFRASTRUCTURE',v:s.infra},
           {l:'L3 COGNITIVE INTEGRITY',v:s.integ},{l:'L4 STAKEHOLDER RATIO',v:s.ratio}]
           .map(g=>({...g,c:col(g.v)}));
  }
  if(ctx.kind==='p1'){
    const m1=metrics(filterRate,ethicsScore,algo);
    return[{l:'SOCIAL CAPITAL',v:Math.round(m1.socialCap)},{l:'INFRASTRUCTURE',v:Math.round(m1.infra)},
           {l:'DIVERSITY INDEX',v:Math.round(m1.diversity)}].map(g=>({...g,c:col(g.v)}));
  }
  if(ctx.kind==='p3'){
    return[{l:'COGNITIVE INTEGRITY',v:Math.round(p3Snapshot.integ)},{l:'JUSTICE CALM',v:Math.round(clamp(100-p3Snapshot.dop,0,100))},
           {l:'SEARCH DEPTH',v:Math.round(clamp(searchDepth*10,0,100))}].map(g=>({...g,c:col(g.v)}));
  }
  if(ctx.kind==='p4'){
    return[{l:'STAKEHOLDER RATIO',v:Math.round(p4Snapshot.ratio)},{l:'VOICE ROUTED',v:Math.round(clamp(100-p4Snapshot.drop,0,100))},
           {l:'POLICY FOCUS',v:Math.round(clamp(100-gamification,0,100))}].map(g=>({...g,c:col(g.v)}));
  }
  const m=metricsP2(shrinkRate,dxRate,algoP2,ethicsP2);
  const rb=shockState?shockState.rb:m.redundancy;
  return[{l:'REDUNDANCY BUFFER',v:Math.round(rb)},{l:'INFRASTRUCTURE',v:Math.round(m.infra)},
         {l:'MUNICIPAL BUDGET',v:Math.round(m.budget)}].map(g=>({...g,c:col(g.v)}));
}

function cardPageLabel(ctx){
  if(ctx.kind==='audit')return tt('SOCIAL OS AUDIT — 全レイヤー健全域','SOCIAL OS AUDIT — ALL LAYERS HEALTHY');
  if(ctx.kind==='p1')return 'PAGE 1: SOCIAL OS — ECHO CHAMBER';
  if(ctx.kind==='p3')return 'PAGE 3: INDIVIDUAL COGNITION — POISONING ATTACK';
  if(ctx.kind==='p4')return 'PAGE 4: STAKEHOLDER TRAFFIC — SYBIL FLOOD';
  return 'PAGE 2: REGIONAL INFRASTRUCTURE — SECTOR-T';
}

function generateResultCard(ctx){
  const W=1200,H=630,MONO='"Courier New",monospace';
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const c=cv.getContext('2d');
  // 背景 + グリッド
  c.fillStyle='#070b14';c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(0,212,255,.06)';c.lineWidth=1;
  for(let x=48;x<W;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
  for(let y=48;y<H;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
  // 二重フレーム
  c.strokeStyle='#00d4ff';c.lineWidth=3;c.strokeRect(16,16,W-32,H-32);
  c.strokeStyle='rgba(0,212,255,.3)';c.lineWidth=1;c.strokeRect(26,26,W-52,H-52);
  // メインタイトル（二人称）+ アプリ名（小）+ ページ名
  c.fillStyle='#00d4ff';c.font='bold 34px '+MONO;
  c.shadowColor='rgba(0,212,255,.6)';c.shadowBlur=14;
  c.fillText(expandTown(tt('あなたの街の判定結果','Your town\'s verdict')),56,80);
  c.shadowBlur=0;
  c.fillStyle='#5a6f94';c.font='15px '+MONO;
  c.fillText(tt('[ 社会デバッガー v6.346 ]','[ SOCIAL DEBUGGER v6.346 ]'),56,106);
  c.fillStyle='#5a6f94';c.font='20px '+MONO;
  c.fillText(cardPageLabel(ctx),56,134);
  // task4: 週替わりシナリオをクリアした直後は「今週、街を守った」一文＋シナリオ名を刻む
  if(window._weeklyCleared){
    c.fillStyle='rgba(153,200,255,.9)';c.font='bold 19px '+MONO;
    c.fillText(tt('🛡 あなたは今週、街を守った。','🛡 You protected your town this week.')+' 〈'+window._weeklyCleared.title+'〉',56,160,W-112);
  }
  // 主要ゲージ
  const gs=cardGauges(ctx);
  let gy=gs.length>3?184:208;
  const gh=gs.length>3?80:100;
  gs.forEach(g=>{
    c.fillStyle='#5a6f94';c.font='19px '+MONO;
    c.fillText(g.l,56,gy);
    c.fillStyle='#172340';c.fillRect(56,gy+14,430,20);
    c.fillStyle=g.c;c.fillRect(56,gy+14,430*clamp(g.v,0,100)/100,20);
    c.font='bold 30px '+MONO;c.fillText(String(g.v),508,gy+34);
    gy+=gh;
  });
  // 判定スタンプ（斜め二重枠 + グロー）
  const st=cardStamp(ctx);
  c.save();c.translate(880,290);c.rotate(-0.10);
  const fs=st.txt.length>9?52:74;
  c.font='bold '+fs+'px '+MONO;c.textAlign='center';
  const tw=c.measureText(st.txt).width;
  c.shadowColor=st.color;c.shadowBlur=22;
  c.strokeStyle=st.color;c.lineWidth=6;
  c.strokeRect(-tw/2-34,-fs*0.95,tw+68,fs*1.7);
  c.lineWidth=2;c.strokeRect(-tw/2-44,-fs*1.08,tw+88,fs*1.96);
  c.fillStyle=st.color;c.fillText(st.txt,0,fs*0.28);
  c.restore();
  c.textAlign='left';c.shadowBlur=0;
  // v6.345: リワインド成功メモ（P1クラッシュ後に1パラ変えて救済した場合）
  if(ctx.kind==='p1'&&window._rewindSuccess){
    c.fillStyle='rgba(0,255,136,.7)';c.font='italic 18px '+MONO;
    c.fillText('↩ '+window._rewindSuccess.label,56,478,W-112);
  }
  // 固定フッター + URL（小さく）
  if(shareComment){
    c.fillStyle='rgba(0,212,255,.55)';c.font='italic 17px '+MONO;
    c.fillText('"'+shareComment+'"',56,H-112,W-112);
  }
  c.fillStyle='#5a6f94';c.font='18px '+MONO;
  c.fillText(shareFooter(),56,H-84,W-112);
  c.fillStyle='rgba(90,111,148,.85)';c.font='16px '+MONO;
  c.fillText(buildShareURL(),56,H-52,W-112);
  return cv;
}

// ── 共有作法カード（⇪ 3か条・1200×630, 内容固定 → 初回のみ生成しキャッシュ） ──
// 文言は shareGuideModal の sg_dont / sg_note と完全一致
function generateEtiquetteCard(){
  const W=1200,H=630,MONO='"Courier New",monospace';
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const c=cv.getContext('2d');
  const rrect=(x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
  // 背景 + グリッド（薄シアン48px） + 四隅L字アクセント
  c.fillStyle='#070b14';c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(0,212,255,.045)';c.lineWidth=1;
  for(let x=48;x<W;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
  for(let y=48;y<H;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
  c.strokeStyle='#00d4ff';c.lineWidth=3;
  [[24,24,1,1],[W-24,24,-1,1],[24,H-24,1,-1],[W-24,H-24,-1,-1]].forEach(([x,y,dx,dy])=>{
    c.beginPath();c.moveTo(x,y+34*dy);c.lineTo(x,y);c.lineTo(x+34*dx,y);c.stroke();});
  // 見出し（中央寄せ・シアン太字グロー）
  c.textAlign='center';
  c.fillStyle='#00d4ff';c.font='bold 30px '+MONO;
  c.shadowColor='#00d4ff';c.shadowBlur=18;
  c.fillText(tt('⇪ 共有のつかいかた — 送るときの3か条','⇪ Share Etiquette — 3 rules before you send'),W/2,80);
  c.shadowBlur=0;
  // サブ（明るめ白系・太字）
  c.fillStyle='#d8e4ff';c.font='bold 18px '+MONO;
  c.fillText(tt('気まずい話題ほど、送り方がすべて。','The touchier the topic, the more delivery is everything.'),W/2,112);
  // 免責サブライン（ルールではなく推奨）
  c.fillStyle='#5a6f94';c.font='15px '+MONO;
  c.fillText(tt('※ これは推奨する共有方法の一例です。必ず守るべきルールではありません。','* A recommended way to share — not a rule you must follow.'),W/2,140);
  c.textAlign='left';
  // テキスト折り返し（日本語=文字単位 / 英語=単語単位）
  const wrap=(text,x,yy,maxW,lh,font,color)=>{
    c.font=font;c.fillStyle=color;
    const isJa=lang==='ja';
    const units=isJa?[...text]:text.split(' ');
    let line='';
    for(let i=0;i<units.length;i++){
      const test=isJa?line+units[i]:(line?line+' ':'')+units[i];
      if(c.measureText(test).width>maxW&&line){c.fillText(line,x,yy);line=units[i];yy+=lh;}
      else line=test;
    }
    if(line)c.fillText(line,x,yy);
    return yy+lh;
  };
  // 3か条（番号色: 赤/黄/緑）— 各行は角丸ボックス＋発光番号バッジ＋タイトル＋説明
  // 文言は sg_dont[0/1/3] と完全一致
  const rules=[
    {n:'01',color:'#ff2244',h:tt('人名を、添えない。','Don’t attach names.'),
     d:tt('実在の人名を添えて送らない','Do not attach real names')},
    {n:'02',color:'#ffcc00',h:tt('答えを、言わない。','Don’t give the answer.'),
     d:tt('「これがまさに◯◯のこと」と答えを言わない（受け手に発見させる）','Do not spell out “this is exactly about ◯◯” (let the receiver discover it)')},
    {n:'03',color:'#00ff88',h:tt('好奇心だけ、添える。','Add only curiosity.'),
     d:tt('相手を説得する道具として使わない（好奇心の共有だけ）','Do not use it to persuade anyone — share curiosity only')},
  ];
  rules.forEach((r,i)=>{
    const y=166+i*118;
    // ボックス（薄い塗り＋同色枠線）
    c.fillStyle='rgba(15,24,41,.85)';c.strokeStyle=r.color;c.lineWidth=1.6;
    rrect(90,y,1020,96,6);c.fill();c.stroke();
    // 番号バッジ（発光）
    c.fillStyle=r.color;c.font='bold 40px '+MONO;
    c.shadowColor=r.color;c.shadowBlur=14;
    c.fillText(r.n,130,y+62);c.shadowBlur=0;
    // タイトル
    c.fillStyle='#d8e4ff';c.font='bold 30px '+MONO;
    c.fillText(r.h,250,y+40);
    // 説明（ボックス内幅で折り返し / 最大2行までボックス内に収まる）
    wrap(r.d,250,y+64,840,22,'18px '+MONO,'#8fa5cc');
  });
  // フッター帯（角丸ボックス＋区切り線＋免責文＋アプリ名 v6.3）
  c.fillStyle='rgba(15,24,41,.9)';c.strokeStyle='#172340';c.lineWidth=1;
  rrect(90,522,1020,74,6);c.fill();c.stroke();
  c.strokeStyle='rgba(23,35,64,.9)';c.beginPath();c.moveTo(120,562);c.lineTo(1080,562);c.stroke();
  c.textAlign='center';
  c.fillStyle='#5a6f94';c.font='16px '+MONO;
  c.fillText(tt('*あくまでオススメの使い方です。','*These are only suggestions.'),W/2,551,1010);
  c.fillStyle='#00d4ff';c.font='bold 17px '+MONO;
  c.fillText(tt('社会デバッガー v6.346 — SOCIAL DEBUGGER','SOCIAL DEBUGGER v6.346'),W/2,583);
  c.textAlign='left';
  return cv;
}

let _etiquetteCardBlob=null, _etiquetteCardLang=null;
async function getEtiquetteCardBlob(){
  if(_etiquetteCardBlob&&_etiquetteCardLang===lang)return _etiquetteCardBlob;
  const cv=generateEtiquetteCard();
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  _etiquetteCardBlob=blob;_etiquetteCardLang=lang;
  return blob;
}
function canShareMultipleFiles(a,b){
  if(!navigator.canShare)return false;
  try{return navigator.canShare({files:[a,b]});}catch(e){return false;}
}

// 共有ガイド内「⬇ このカードを保存」: 作法カード単体を保存/共有
async function saveEtiquetteCard(btn){
  const blob=await getEtiquetteCardBlob();
  if(!blob)return;
  // モバイル: 共有シート経由で「画像を保存」できる
  if(canShareFiles()){
    const file=new File([blob],'share-etiquette.png',{type:'image/png'});
    try{await navigator.share({files:[file]});return;}
    catch(e){if(e&&e.name==='AbortError')return;/* 失敗時はDLへフォールバック */}
  }
  // デスクトップ: PNGダウンロード
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='share-etiquette-card.png';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  if(btn){
    const o=btn.innerHTML;
    btn.innerHTML=tt('✓ 保存しました','✓ Saved');btn.classList.add('ok');
    setTimeout(()=>{btn.innerHTML=o;btn.classList.remove('ok');},1800);
  }
}

// 結果カード + 作法カードの2枚添付共有（P2ショック / P1・P3・P4 判定 共通）
async function shareWithEtiquette(resultBlob,message){
  if(!resultBlob)return false;
  const url=buildShareURL();
  const resultFile=new File([resultBlob],'result-card.png',{type:'image/png'});
  if(canShareFiles()){
    const etqBlob=await getEtiquetteCardBlob();
    const etqFile=etqBlob?new File([etqBlob],'share-etiquette.png',{type:'image/png'}):null;
    if(etqFile&&canShareMultipleFiles(resultFile,etqFile)){
      // 複数ファイル対応: 結果カード + 作法カードの2枚を同送
      try{await navigator.share({files:[resultFile,etqFile],text:message+'\n'+url});return true;}
      catch(e){if(e&&e.name==='AbortError')return true;}
    }else{
      // 複数ファイル非対応: 結果カード1枚 + メッセージ末尾にガイド誘導文
      const tip=tt('\n送り方のコツ → アプリ内の「⇪ 共有ガイド」','\nTip: see the in-app “Share Guide” for how to send this well.');
      try{await navigator.share({files:[resultFile],text:message+tip+'\n'+url});return true;}
      catch(e){if(e&&e.name==='AbortError')return true;}
    }
  }
  // ファイル共有非対応: PNGダウンロード（テキストはポップオーバーの他ボタンで別送）
  const a=document.createElement('a');
  a.href=URL.createObjectURL(resultBlob);a.download='ssd-result-card.png';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  return false;
}

async function shareResultCard(){
  const cv=generateResultCard(shareCtx||{kind:'generic'});
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  if(!blob)return;
  await shareWithEtiquette(blob,shareMessage());
}

// ── プリセット適用直後の共有トースト ──────────────────────
let shareToastTimer=null;
function showShareToast(ctx){
  const tst=document.getElementById('shareToast');
  if(!tst)return;
  document.getElementById('shareToastBtn').textContent=tt('⎘ このシナリオを送る','⎘ Share this scenario');
  tst.dataset.ctx=JSON.stringify(ctx||{kind:'generic'});
  tst.classList.add('on');
  clearTimeout(shareToastTimer);
  shareToastTimer=setTimeout(()=>tst.classList.remove('on'),6000);
}
function shareFromToast(){
  const tst=document.getElementById('shareToast');
  tst.classList.remove('on');clearTimeout(shareToastTimer);
  let ctx={kind:'generic'};
  try{ctx=JSON.parse(tst.dataset.ctx||'{}');}catch(e){}
  shareScenario(ctx);
}

// ── 共有ガイドモーダル ────────────────────────────────────
function openShareGuide(){document.getElementById('shareGuideModal').classList.add('on');}
function closeShareGuide(){document.getElementById('shareGuideModal').classList.remove('on');}
function closeShareGuideIf(e){if(e.target===document.getElementById('shareGuideModal'))closeShareGuide();}

// ══════════════════════════════════════════════════════════
// v6.332: フィードバック導線（既存の共有システムとは独立した別入口）
// ══════════════════════════════════════════════════════════
const FEEDBACK_ENDPOINT='https://formspree.io/f/meebvdjv'; // Formspree フォーム（feedback受信先）
let researcherMode=false;
function setResearcherMode(on){
  researcherMode=!!on;
  const cb=document.getElementById('fbResearcher'); if(cb)cb.checked=researcherMode;
  // ON: 開発者導線を上部にボタンとして格上げ / OFF: 下部の控えめな補足リンク
  const top=document.getElementById('fbDevTop'), note=document.getElementById('fbDevNote');
  if(top)top.style.display=researcherMode?'block':'none';
  if(note)note.style.display=researcherMode?'none':'block';
}
function openFeedback(){
  const msg=document.getElementById('fbMessage'), em=document.getElementById('fbEmail');
  if(msg)msg.placeholder=tt('改善案・気づいたこと・不具合の内容など','Your idea, something you noticed, or a bug…');
  if(em)em.placeholder=tt('you@example.com（任意）','you@example.com (optional)');
  const st=document.getElementById('fbStatus'); if(st)st.style.display='none';
  setResearcherMode(researcherMode); // 開発者導線の表示状態を反映
  document.getElementById('feedbackModal').classList.add('on');
}
function closeFeedback(){document.getElementById('feedbackModal').classList.remove('on');}
function closeFeedbackIf(e){if(e.target===document.getElementById('feedbackModal'))closeFeedback();}
async function submitFeedback(e){
  e.preventDefault();
  const btn=document.getElementById('fbSubmit'), status=document.getElementById('fbStatus');
  const message=document.getElementById('fbMessage').value.trim();
  if(!message)return false;
  const payload={
    type:(document.querySelector('input[name="fbType"]:checked')||{}).value||'other',
    message,
    email:document.getElementById('fbEmail').value.trim(),
    tab:currentTab, lang,               // 不具合報告時の文脈（どのページ・言語か）
    _subject:'[Social OS Debugger] Feedback'
  };
  const orig=btn.textContent;
  btn.disabled=true; btn.textContent=tt('送信中…','Sending…');
  status.style.display='none';
  try{
    const res=await fetch(FEEDBACK_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!res.ok)throw new Error('bad status '+res.status);
    status.style.display='block'; status.style.color='var(--green)';
    status.textContent=tt('✓ 送信しました。ありがとうございます','✓ Sent. Thank you!');
    document.getElementById('fbForm').reset();
    setTimeout(()=>{closeFeedback();btn.disabled=false;btn.textContent=orig;status.style.display='none';},1600);
  }catch(err){
    // 失敗: フォーム内容は保持し、再送できるようにする
    status.style.display='block'; status.style.color='var(--red)';
    status.textContent=tt('送信に失敗しました。時間をおいて再度お試しください','Sending failed. Please try again later.');
    btn.disabled=false; btn.textContent=orig;
  }
  return false;
}

// v6.332: 現在ページへのクリーンな直接リンク（シナリオ状態を含まない。既存共有とは別物）
function copyPageLink(n,btn){
  const url=location.origin+location.pathname+'?tab='+n;
  const done=()=>{
    if(!btn)return;
    const o=btn.textContent;
    btn.textContent=tt('✓ コピーしました','✓ Copied!');btn.classList.add('ok');
    setTimeout(()=>{btn.textContent=o;btn.classList.remove('ok');},1800);
  };
  try{navigator.clipboard.writeText(url).then(done);}catch(e){prompt('Copy this URL:',url);}
}

// US-08: 研究者向けエクスポート — 全パラメータ＋主要メトリクス＋再現用共有URL（JSON/CSV）
function buildExportData(){
  return{
    app:'social-system-debugger',
    schema:1,
    exported_at:new Date().toISOString(),
    lang,
    town_name:getTownName()||null,
    share_url:buildShareURL(), // このURLを開くと同じパラメータ状態を再現できる
    params:{
      p1_information:{filterRate,ethicsScore,algo,historicalImmunity},
      p2_infrastructure:{shrinkRate,dxRate,ethicsP2,algoP2,publicReboot,rootRestricted,skillStock},
      p3_cognition:{searchDepth,groundingRate,learningRate},
      p4_stakeholder:{extTraffic,gamification}
    },
    metrics:{
      p1_information:metrics(filterRate,ethicsScore,algo),
      p2_infrastructure:metricsP2(shrinkRate,dxRate,algoP2,ethicsP2)
    }
  };
}
function exportFlatRows(obj,prefix,rows){
  Object.entries(obj).forEach(([k,v])=>{
    const key=prefix?prefix+'.'+k:k;
    if(v&&typeof v==='object')exportFlatRows(v,key,rows);
    else rows.push([key,v]);
  });
  return rows;
}
function downloadTextFile(name,mime,text){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:mime}));
  a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function exportData(fmt){
  const d=buildExportData();
  const stamp=d.exported_at.slice(0,19).replace(/[:T]/g,'-');
  if(fmt==='csv'){
    const esc=v=>{const s=String(v==null?'':v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    const csv='key,value\n'+exportFlatRows(d,'',[]).map(r=>esc(r[0])+','+esc(r[1])).join('\n');
    downloadTextFile('social-debugger-'+stamp+'.csv','text/csv;charset=utf-8',csv);
    track('export_csv');
  }else{
    downloadTextFile('social-debugger-'+stamp+'.json','application/json;charset=utf-8',JSON.stringify(d,null,2));
    track('export_json');
  }
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSharePop();closeShareGuide();closeFeedback();closeDiscoveryLog();}});

(function init(){
  const p=new URLSearchParams(location.search);
  if(p.has('f'))filterRate=clamp(+p.get('f'),0,100);
  if(p.has('e'))ethicsScore=clamp(+p.get('e'),0,100);
  if(p.has('a')&&['dp','greedy'].includes(p.get('a')))algo=p.get('a');
  if(p.has('l')&&['ja','en'].includes(p.get('l')))lang=p.get('l');
  // v6.2: 共有URLの拡張パラメータ復元（P2〜P4 + 表示タブ）
  if(p.has('s'))shrinkRate=clamp(+p.get('s'),0,100);
  if(p.has('dx'))dxRate=clamp(+p.get('dx'),0,100);
  if(p.has('e2'))ethicsP2=clamp(+p.get('e2'),0,100);
  if(p.has('a2')&&['dp','greedy'].includes(p.get('a2')))algoP2=p.get('a2');
  if(p.has('r'))publicReboot=p.get('r')==='1';
  if(p.has('sd'))searchDepth=clamp(+p.get('sd'),1,10);
  if(p.has('g'))groundingRate=clamp(+p.get('g'),0,100);
  if(p.has('lr'))learningRate=clamp(+p.get('lr'),0,100);
  if(p.has('ext'))extTraffic=clamp(+p.get('ext'),0,100);
  if(p.has('gam'))gamification=clamp(+p.get('gam'),0,100);
  document.getElementById('filterRate').value=filterRate;
  document.getElementById('ethicsScore').value=ethicsScore;
  document.getElementById('filterVal').textContent=filterRate+'%';
  document.getElementById('ethicsVal').textContent=ethicsScore;
  setPct(document.getElementById('filterRate'));
  setPct(document.getElementById('ethicsScore'));
  setAlgoUI(algo);
  applyI18n();

  // Hide weekly scenario elements if not on native platform
  if (!WEEKLY_ENABLED) {
    const scenarioCard = document.getElementById('scenarioCardContainer');
    if (scenarioCard) scenarioCard.style.display = 'none';
    const scenarioModal = document.getElementById('scenarioModal');
    if (scenarioModal) scenarioModal.style.display = 'none';
  }

  initWeeklyScenarioCard();
  startScatter();
  startAgents();

  // P2 timeline chart 初期化
  if (typeof Chart !== 'undefined') {
    try {
      timelineChartP2=new Chart(document.getElementById('timelineChartP2'),{
        type:'line',
        data:{labels:Array.from({length:65},(_,i)=>i),datasets:[
          {label:'Infrastructure',data:[],borderColor:'#00d4ff',backgroundColor:'rgba(0,212,255,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
          {label:'Rescue Heli',data:[],borderColor:'#00ff88',backgroundColor:'rgba(0,255,136,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
          {label:'Brand Industry',data:[],borderColor:'#ff6b2b',backgroundColor:'rgba(255,107,43,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
          {label:'Municipal Budget',data:[],borderColor:'#9945ff',backgroundColor:'rgba(153,69,255,.05)',borderWidth:2,pointRadius:0,tension:0.42,fill:false},
        ]},
        options:{responsive:true,maintainAspectRatio:false,animation:{duration:260},
          plugins:{legend:{labels:{color:'#5a6f94',boxWidth:12,font:{size:10}}}},
          scales:{
            x:{title:{display:true,text:'Time Steps →',color:'#5a6f94',font:{size:9}},grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94',maxTicksLimit:8}},
            y:{min:0,max:105,grid:{color:'rgba(23,35,64,.6)'},ticks:{color:'#5a6f94'}}
          }
        }
      });
    } catch (e) {
      console.warn('📊 チャート timelineChartP2 生成失敗:', e.message);
      timelineChartP2 = null;
    }
  } else {
    console.warn('📊 チャート timelineChartP2 をスキップ: Chart.js が利用不可');
  }
  // P2 初期描画（URL復元値をスライダー・トグルへ反映）
  document.getElementById('shrinkRate').value=shrinkRate;
  document.getElementById('dxRate').value=dxRate;
  document.getElementById('ethicsScoreP2').value=ethicsP2;
  document.getElementById('shrinkVal').textContent=shrinkRate+'%';
  document.getElementById('dxVal').textContent=dxRate+'%';
  document.getElementById('ethicsP2Val').textContent=ethicsP2;
  setPublicReboot(publicReboot);
  setAlgoP2(algoP2);
  setPct(document.getElementById('shrinkRate'));
  setPct(document.getElementById('dxRate'));
  setPct(document.getElementById('ethicsScoreP2'));
  // P3 スライダー初期化（本体はタブ初回表示時に遅延起動）
  document.getElementById('searchDepth').value=searchDepth;
  document.getElementById('groundingRate').value=groundingRate;
  document.getElementById('learningRate').value=learningRate;
  document.getElementById('depthVal').textContent=searchDepth;
  document.getElementById('groundVal').textContent=groundingRate+'%';
  document.getElementById('lrVal').textContent=learningRate+'%';
  setPct(document.getElementById('searchDepth'));
  setPct(document.getElementById('groundingRate'));
  setPct(document.getElementById('learningRate'));
  // P4 スライダー初期化（本体はタブ初回表示時に遅延起動）
  document.getElementById('extTraffic').value=extTraffic;
  document.getElementById('gamification').value=gamification;
  document.getElementById('extVal').textContent=extTraffic+'%';
  document.getElementById('gamVal').textContent=gamification+'%';
  setPct(document.getElementById('extTraffic'));
  setPct(document.getElementById('gamification'));
  // v6.2: 共有URLで指定されたタブへ移動
  if(p.has('tab'))switchTab(clamp(+p.get('tab'),1,4));
  // イントロモーダル: 初回訪問時のみ自動表示（ℹ GUIDEでいつでも再表示可）
  try{if(!localStorage.getItem('ssd_intro_seen'))openIntro();}catch(e){}
  // v5.3: カスケード崩壊判定＋Grand Optimal判定（非表示タブも裏側で監視）
  setInterval(()=>{updateCascadeFX();checkGrandOptimal();},500);
  updateCascadeFX();checkGrandOptimal();
  // v6.333: 初期描画（P1のゲージ＋良い状態バナーを初回から反映）
  updateAll();
  // v6.334: 発見ログ初期化（読み込み時の自動付与は防ぐ＝ここで初めて有効化）
  loadDiscoveries();
  updateDiscoveryCounter();
  _discReady=true;
})();
