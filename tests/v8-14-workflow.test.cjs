const test=require('node:test'),assert=require('node:assert/strict');
const {boot,tick}=require('./browser-fixture.cjs');
const model=require('../src/v8-09-model.js');
test('only assessed emotions contribute and supporting scales warn at their low end',()=>{
 assert.deepEqual(model.warnings({}),[]);
 assert.deepEqual(model.warnings({stress:9,calm:9,clarity:2,patience:10}).map(w=>w.key).sort(),['clarity','stress']);
});
test('all pairs of explicit rates interpretations preserve missing and contradictory observations',()=>{
 const choices=[undefined,'risk_on','risk_off','neutral','mixed'];
 for(const a of choices)for(const b of choices){
 const result=model.sentiment([{key:'yields',direction:'long',implication:a},{key:'bonds',direction:'short',implication:b}]);
 assert.equal(result.groups,a||b?1:0);assert.equal(result.state,a&&b&&a!==b?'mixed':a||b||'unclear');
 }
});
test('a deferred LTF stays on the review checklist until a separate receipt exists',async()=>{
 const b=boot('v8.html');try{await tick();const trade={observations:{entry_context_v736:{ltf_v811:{timing:'pending'}}}};
 const item=()=>b.w.reviewChecklist(trade).find(i=>i.label==='LTF nachbereiten');
 assert.equal(item().done,false);trade.observations.ltf_after_entry_v814={status:'unavailable'};assert.equal(item().done,true);
 }finally{b.close();}
});
