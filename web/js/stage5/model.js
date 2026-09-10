'use strict';
const Stage5 = (() => {
  const version = 'astra-stage5-story-1';
  const defaults = { aGround:20, aAudit:80, bGround:80, bAudit:20, alpha:70, beta:70 };
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid input');
    const out={};
    for(const key of Object.keys(defaults)) {
      const value=input[key];
      if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100) throw Error('Invalid '+key);
      out[key]=value;
    }
    return out;
  }
  function evaluate(input, choices={a:'none',b:'none'}) {
    const initial=validate(input), changed={...initial}, cost={};
    for(const sector of ['a','b']) {
      const choice=choices[sector];
      if(!['none','ground','audit'].includes(choice)) throw Error('Invalid intervention');
      cost[sector]=choice==='none'?0:25;
      if(choice!=='none') { const key=sector+(choice==='ground'?'Ground':'Audit'); changed[key]=Math.min(100,changed[key]+25); }
    }
    const cell=(s,sector,operator)=>({sector,operator,spread:s[operator]*(1-s[sector+'Ground']/100),hidden:s[operator]*(1-s[sector+'Audit']/100)});
    const original=[cell(initial,'a','alpha'),cell(initial,'b','beta')];
    const swapped=[cell(initial,'a','beta'),cell(initial,'b','alpha')];
    const repaired=[cell(changed,'a','alpha'),cell(changed,'b','beta')];
    const factorial=['a','b'].flatMap(sector=>['alpha','beta'].map(operator=>cell(initial,sector,operator)));
    return {initial,changed,cost,original,swapped,repaired,factorial};
  }
  function decode(raw) {
    if(new TextEncoder().encode(raw).length>100000)throw Error('Too large');
    const d=JSON.parse(raw);
    if(!d||d.version!==version||!Number.isInteger(d.scene)||d.scene<0||d.scene>7)throw Error('Invalid version/scene');
    const input=validate(d.input);
    if(!d.choices || typeof d.choices!=='object')throw Error('Invalid choices');
    const choices={a:d.choices.a,b:d.choices.b};
    const result=evaluate(input,choices);
    if(!['a','b','equal','unsure'].includes(d.prediction))throw Error('Invalid prediction');
    if(typeof d.confidence!=='number'||!Number.isInteger(d.confidence)||d.confidence<0||d.confidence>100)throw Error('Invalid confidence');
    const answers={};
    for(const key of ['reason','explanation','revision','transfer']){
      if(typeof d.answers?.[key]!=='string'||d.answers[key].length>5000)throw Error('Invalid answer');
      answers[key]=d.answers[key];
    }
    return {version,scene:d.scene,input,choices,prediction:d.prediction,confidence:d.confidence,answers,result};
  }
  return {version,defaults,validate,evaluate,decode};
})();
if(typeof module!=='undefined')module.exports=Stage5;
