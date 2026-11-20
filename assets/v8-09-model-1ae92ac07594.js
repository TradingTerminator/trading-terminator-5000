/* V8.09 evidence model. Missing data never becomes zero; accounts and decisions stay separate. */
(function(root){
const num=v=>v!==null&&v!==undefined&&v!==''&&typeof v!=='boolean'&&Number.isFinite(Number(v))?Number(v):null;
const unique=rows=>[...new Map(rows.filter(r=>r?.id).map(r=>[r.id,r])).values()];
const context=t=>t.observations?.entry_context_v736||{};
const errors=t=>t.observations?.review_errors||(t.observations?.review_error?[{id:'legacy-'+t.id,type:t.observations.review_error,countermeasure:t.observations.countermeasure,confirmed_breach:!!t.rule_deviation}]:[]);
function money(trades,allocs,results,account='all'){
const ids=new Set(unique(trades).filter(t=>t.exit_at).map(t=>t.id)),values=unique(allocs).filter(a=>ids.has(a.trade_id)&&(account==='all'||a.account_id===account)).map(a=>{
const matches=results.filter(r=>r.allocation_id===a.id),r=matches.length===1?matches[0]:null,p=num(r?.realized_pnl_usd),f=num(r?.fees_usd),risk=num(a.initial_risk_usd);
return {id:a.id,trade:a.trade_id,net:r?.result_status==='final'&&p!==null&&f!==null&&f>=0?p-f:null,risk};});
const known=values.filter(v=>v.net!==null),decisions=[];
for(const id of ids){const rows=values.filter(v=>v.trade===id);if(rows.length&&rows.every(v=>v.net!==null&&v.risk>0))decisions.push({id,net:rows.reduce((s,v)=>s+v.net,0),r:rows.reduce((s,v)=>s+v.net,0)/rows.reduce((s,v)=>s+v.risk,0)});}
return {values,net:known.length?known.reduce((s,v)=>s+v.net,0):null,known:known.length,missing:values.length-known.length,unallocated:[...ids].filter(id=>!values.some(v=>v.trade===id)).length,decisions,meanR:decisions.length?decisions.reduce((s,v)=>s+v.r,0)/decisions.length:null};}
function warnings(s){return Object.entries({stress:['Stress','Kurz Abstand gewinnen.'],calm:['Ruhe niedrig','Ruhig atmen.'],clarity:['Mentale Klarheit niedrig','Plan und Risiko erneut prüfen.'],patience:['Geduld niedrig','Bestätigung abwarten.'],confidence:['Vertrauen niedrig','Handelsplan überprüfen.'],uncertainty:['Unsicherheit','Auslöser und Risiko prüfen.'],focus:['Fokus niedrig','These, Trigger und Risiko klar benennen.'],pressure:['Anspannung','Tempo herausnehmen und pausieren.'],fatigue:['Müdigkeit','Aufmerksamkeit prüfen.'],urge:['Handelsdrang','Gültige Kriterien abwarten.'],fomo:['FOMO','Bewegung nicht verfolgen; nächsten bestätigten Trigger abwarten.'],revenge:['Verluste zurückholen','Vorigen Trade abschließen, Risiko unverändert lassen, Pause erwägen.'],fear:['Verlustangst','Akzeptierbares Risiko und Invalidation prüfen.'],greed:['Gewinnzwang','Ein Geldziel darf keinen Entry erzwingen.'],frustration:['Frust','Abstand vom letzten Ergebnis gewinnen.']}).filter(([k])=>num(s?.[k])!==null&&(['focus','calm','clarity','patience','confidence'].includes(k)?s[k]<=3:s[k]>=7)).map(([key,[title,action]])=>({key,title,action,value:s[key],severe:['focus','calm','clarity','patience','confidence'].includes(key)?s[key]<=2:s[key]>=9}));}
function prior(rows,allocs,results){const m=new Map(money(rows,allocs,results).decisions.map(r=>[r.id,r.net])),out=new Map();for(const t of unique(rows)){const p=rows.filter(p=>p.session_id===t.session_id&&p.exit_at&&Date.parse(p.exit_at)<Date.parse(t.entry_at)).sort((a,b)=>Date.parse(b.exit_at)-Date.parse(a.exit_at))[0];out.set(t.id,p&&m.has(p.id)?m.get(p.id)>0?'win':m.get(p.id)<0?'loss':'be':'unknown');}return out;}
function scales(t,phase){const c=context(t),o=t.observations||{};return (phase==='session'?c.htf_snapshot?.plan?.mental_check?.scales:phase==='entry'?c.emotion_scales:phase==='during'?o.during_emotion_scales:o.exit_emotion_scales)||{};}
function emotion(rows,key,phase){const groups={high:[],middle:[],low:[],missing:[]};for(const t of unique(rows)){const v=num(scales(t,phase)[key]);groups[v===null?'missing':v>=7?'high':v<=3?'low':'middle'].push(t);}return groups;}
function priorities(rows){const map=new Map();for(const t of unique(rows)){for(const type of new Set(errors(t).map(e=>e.type))){const es=errors(t).filter(e=>e.type===type),x=map.get(type)||{type,rows:[],breaches:0,severity:0,rules:new Map()};x.rows.push(t);x.breaches+=es.some(e=>e.confirmed_breach)?1:0;x.severity+=Math.max(0,...es.map(e=>({low:1,medium:2,high:3})[e.severity]||0));for(const e of es)if(e.countermeasure?.trim().length>=10&&e.countermeasure.trim().length<=500)x.rules.set(e.countermeasure.trim(),{rule:e.countermeasure.trim(),tradeId:t.id,errorId:e.id});map.set(type,x);}}return [...map.values()].map(x=>({...x,total:unique(rows).length,score:x.rows.length*3+x.breaches*4+x.severity,rules:[...x.rules.values()]})).sort((a,b)=>b.score-a.score||String(a.type).localeCompare(String(b.type)));}
function practice(rows,id){const n={followed:0,partial:0,missed:0,no_opportunity:0,unclear:0,pending:0,rows:[]};for(const t of unique(rows)){const o=t.observations||{},p=o.training_practice;if(!t.exit_at||o.training_focus?.goal_id!==id)continue;const k=p?.goal_id!==id?'pending':p.assessment==='unclear'?'unclear':['followed','partial','missed','no_opportunity'].includes(p.result)?p.result:'pending';n[k]++;n.rows.push(t);}n.opportunities=n.followed+n.partial+n.missed;return n;}
function crop(c){return {scale:Math.min(3,Math.max(1,num(c?.scale)||1)),x:Math.min(100,Math.max(0,num(c?.x)??50)),y:Math.min(100,Math.max(0,num(c?.y)??50))};}
function sentiment(rows){const groups=new Map();for(const r of rows||[]){if(!r.direction||r.direction==='not_used'||!['risk_on','risk_off','neutral','mixed'].includes(r.implication))continue;const k=['yields','bonds'].includes(r.key)?'rates':r.key,p=groups.get(k);groups.set(k,p&&p!==r.implication?'mixed':r.implication);}const v=[...groups.values()];return {groups:groups.size,state:!v.length?'unclear':v.includes('mixed')||v.includes('risk_on')&&v.includes('risk_off')?'mixed':v.includes('risk_on')?'risk_on':v.includes('risk_off')?'risk_off':'neutral'};}
function marketContext(rows){
 const observed=(rows||[]).filter(r=>r.key!=='options'&&['long','short','neutral','unclear'].includes(r.direction));
 const groups=new Map();
 for(const row of observed){
  const key=['yields','bonds'].includes(row.key)?'rates':['index','es','nq'].includes(row.key)?'indices':row.key;
  const group=groups.get(key)||{key,observations:[],interpretations:[]};
  group.observations.push(row);
  if(['risk_on','risk_off','neutral','mixed'].includes(row.implication))group.interpretations.push(row.implication);
  groups.set(key,group);
 }
 const explicit=[...groups.values()].flatMap(g=>g.interpretations);
 const divergent=[...groups.values()].some(g=>new Set(g.observations.filter(r=>['long','short'].includes(r.direction)).map(r=>r.key==='bonds'?(r.direction==='long'?'short':'long'):r.direction)).size>1);
 const equities=groups.get('indices')?.observations||[];
 const vols=groups.get('vix')?.observations||[];
 const mixed=divergent||equities.some(e=>['long','short'].includes(e.direction)&&vols.some(v=>v.direction===e.direction))||explicit.includes('mixed')||(explicit.includes('risk_on')&&explicit.includes('risk_off'));
 return {groups:[...groups.values()],state:mixed?'mixed':explicit.includes('risk_on')?'risk_on':explicit.includes('risk_off')?'risk_off':explicit.includes('neutral')||observed.length>0&&observed.every(r=>r.direction==='neutral')?'neutral':observed.length?'observed':'unclear'};
}
const api={marketContext,num,unique,context,errors,money,warnings,prior,scales,emotion,priorities,practice,crop,sentiment};root.TT809Model=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
