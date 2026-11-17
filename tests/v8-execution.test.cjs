const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/v8-execution-model.js');
const {boot,tick}=require('./browser-fixture.cjs');
test('V811 mixed instrument standards yield 200 + 200 + 500, no implicit conversion',()=>{
 assert.equal(M.risk([{instrument:'NQ',quantity:1,ticks:40},{instrument:'MNQ',quantity:5,ticks:80},{instrument:'NQ',quantity:1,ticks:100}]),900);
 assert.deepEqual(M.changes({instrument:'NQ',quantity:1,ticks:40},{instrument:'NQ',quantity:1,ticks:40}),[]);
 assert.deepEqual(M.changes({instrument:'NQ',quantity:1,ticks:null},{instrument:'MNQ',quantity:1,ticks:80}).map(c=>c.field),['instrument']);
});
test('V811 neutral, unassessed, absent and unavailable are distinct observations',()=>{
 const p={status:'reviewed',timeframe:'m1',reference:'US cash; delta signal candle',images:[],image_absence:'not_captured',values:Object.fromEntries(Object.entries(M.fields).map(([k,[,v]])=>[k,Object.keys(v)[0]]))};
 assert.equal(M.validLtf(p),true);delete p.values.cvd;assert.equal(M.validLtf(p),false);
 p.values.cvd='not_reviewed';assert.equal(M.validLtf(p),true);p.values.cvd='unavailable';assert.equal(M.validLtf(p),true);
 assert.equal(M.validLtf({status:'reviewed',timeframe:'m1',reference:'Session',images:[],image_absence:'not_captured'}),false);
 assert.equal(M.validLtf({status:'not_reviewed',images:[],image_absence:'not_captured'}),true);
 assert.equal(M.validLtf({status:'not_reviewed',images:[]}),false);
});
test('V811 news uses only the explicitly chosen interval, including exact boundaries',()=>{
 const row={id:'e',rule:'avoid',from:'2026-11-17T13:25Z',to:'2026-11-17T13:40Z'};
 for(const at of ['13:25','13:30','13:40'])assert.equal(M.activeNews([row],Date.parse('2026-11-17T'+at+'Z')).length,1);
 assert.equal(M.activeNews([row],Date.parse('2026-11-17T13:41Z')).length,0);
 assert.equal(M.activeNews([{...row,from:null}],Date.parse('2026-11-17T13:30Z')).length,0);
 assert.notEqual(M.newsKey(row),M.newsKey({...row,to:'2026-11-17T14:00Z'}));assert.notEqual(M.newsKey(row),M.newsKey({...row,title:'Neuer Termin'}));
});
test('V811 fresh session clears subjective choices and consciously confirms midpoint',async()=>{
 const b=boot('v8.html');try{await tick();const d=b.w.document;b.w.eval("currentUser={id:'owner'};currentSession=null;renderSession()");
 for(const id of ['v8MacroDirection','v8HtfSentiment','v8HtfDirection','v8NewsBehaviour','v811ScenarioDecision'])assert.equal(d.getElementById(id).value,'',id);
 assert.equal(d.getElementById('v811LimitsEnabled').checked,false);d.getElementById('v8TradingMinutes').value='90';assert.equal(b.w.v8GoalMissing().length,0,'No inaccessible scope requirement while money limits are disabled');
 const slider=d.querySelector('#sessionMoodOptions input[data-scale]');assert.equal(slider.value,'5');assert.equal(slider.dataset.rated,'false');slider.dispatchEvent(new b.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(slider.dataset.rated,'true');
 b.w.eval("currentSession={id:'old',status:'closed',htf_context:{}};renderSession();currentSession=null;renderSession()");assert.equal(d.querySelector('#sessionMoodOptions input[data-scale]').dataset.rated,'false');assert.deepEqual(b.issues,[]);
 }finally{b.close();}
});
test('V811 capture choices are exclusive; same-session draft keeps explicit mode and LTF',async()=>{
 const b=boot('v8.html');try{await tick();const d=b.w.document;b.w.eval("currentUser={id:'owner'};$('app').classList.remove('hidden');currentSession={id:'s',status:'open',session_date:localDate(),htf_context:{}};");
 assert.equal(d.querySelectorAll('#v811CaptureMode input:checked').length,0);
 d.querySelector('#v811CaptureMode input[value=retrospective]').click();d.querySelector('#v811CaptureMode input[value=planned]').click();assert.equal(d.querySelectorAll('#v811CaptureMode input:checked').length,1);
 d.getElementById('v811LtfStatus').value='unavailable';d.getElementById('v811ImageAbsence').value='not_available';b.w.saveWorkspace();const draft=b.w.readWorkspace();assert.equal(draft.v811.mode,'planned');
 b.w.eval('V811.mode=null');b.w.restoreWorkspace(draft);assert.equal(b.w.eval('V811.mode'),'planned');assert.equal(d.getElementById('v811LtfStatus').value,'unavailable');
 b.w.eval("currentUser={id:'other'}");assert.equal(b.w.readWorkspace(),null);assert.deepEqual(b.issues,[]);
 }finally{b.close();}
});
test('V811 re-entry labels count the complete paginated attempt history',async()=>{
 const b=boot('v8.html');try{await tick();b.w.eval("currentUser={id:'owner'};currentSession={id:'s',status:'open',htf_context:{}}");
 const attempts=Array.from({length:1501},(_,n)=>({id:'attempt-'+n,idea_id:'idea',attempt_number:n+1}));let pages=0;
 b.setTableHandler((name,ops)=>{if(name==='trade_ideas_v733')return {data:[{id:'idea',thesis:'Eigene These',direction:'long',instrument:'NQ',setup_type:'Momentum',status:'active',created_at:'2026-11-17T17:00Z'}],error:null};if(name==='trade_attempts_v733'){pages++;const range=ops.find(o=>o.method==='range').args;return {data:attempts.slice(range[0],range[1]+1),error:null};}return {data:[],error:null};});
 await b.w.ttLoadIdeas();assert.equal(pages,4);assert.match(b.w.document.getElementById('ttIdeaSelect').textContent,/Eigene These.*Versuch 1502/);assert.deepEqual(b.issues,[]);
 }finally{b.close();}
});
