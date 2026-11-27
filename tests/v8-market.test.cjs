const test=require('node:test');
const assert=require('node:assert/strict');
const {boot,tick}=require('./browser-fixture.cjs');

test('Weiter marks only the unassessed mandatory emotion in displayed order',async()=>{
 const b=boot('v8.html');try{
  await tick();const d=b.w.document;
  b.w.buildScaleGroup(d.getElementById('sessionMoodOptions'),'session',{focus:1,pressure:4,fatigue:7,urge:7,fear:7,revenge:7,frustration:7});
  const issue=b.w.v8StepMissing(1)[0];
  assert.equal(issue[1],'session-scale-greed');
  b.w.v8FocusPreparation(issue[1]);
  assert.equal(d.activeElement.dataset.scale,'greed');
  assert.equal(d.querySelector('#session-scale-focus').hasAttribute('aria-invalid'),false);
 }finally{b.close();}
});
test('family switch restores chart levels and retains shared macro and yields separately from bonds',async()=>{
 const b=boot('v8.html');try{
  await tick();b.w.eval("loadFamily('nasdaq');$('htfNote_zones').value='NQ Testzone';$('v8Cross_yields').value='long';$('v8Cross_bonds').value='short';macroReason.value='Makrotest';$('v8HtfSentiment').value='bullish';loadFamily('sp')");
  assert.equal(b.w.document.getElementById('htfNote_zones').value,'');
  assert.equal(b.w.document.getElementById('v8HtfSentiment').value,'');
  b.w.eval("$('htfNote_zones').value='ES Testzone';loadFamily('nasdaq')");
  const plan=b.w.v8HtfPlan();assert.equal(plan.macro_reason,'Makrotest');
  for(const [symbol,label] of Object.entries({MNQ:'NQ Testzone',NQ:'NQ Testzone',MES:'ES Testzone',ES:'ES Testzone'})){
   assert.equal(b.w.snapshotForInstrument({plan},symbol).plan.technical.find(x=>x.key==='zones').note,label);
  }
  assert.deepEqual(plan.cross_markets.filter(x=>['yields','bonds'].includes(x.key)).map(x=>x.direction).join(','),'long,short');
 }finally{b.close();}
});
test('historical entry advances with missing emotions and preserves deliberately recalled values',async()=>{
 const b=boot('v8.html');try{
  await tick();b.w.eval("V811.mode='retrospective';$('tt9Executed').checked=true;entryStage=1;buildScaleGroup($('entryEmotionOptions'),'entryEmotion',{fear:9});warn9();$('entryStageNext').click()");
  assert.equal(b.w.eval('entryStage'),2);assert.equal(b.w.document.getElementById('tt9EntryRisks').hidden,true);
  assert.equal(b.w.eval("readScales($('entryEmotionOptions')).fear"),9);
 }finally{b.close();}
});
test('multiple instrument-specific position changes use actual sides and reject an oversized sale',async()=>{
 const b=boot('v8.html');try{
  await tick();
  const result=b.w.eval(`(()=>{
   const detail=document.createElement('details'),rows=[{type:'add',quantity:2,price:'16000,25',at:'2026-11-23T10:10'},{type:'reduce',quantity:1,price:'16001',at:'2026-11-23T10:11'}];
   const history=positionChanges(detail,{planned_quantity:1},rows,{entry_at:'2026-11-23T09:00Z',exit_at:'2026-11-23T10:00Z'});
   const sides=history.evaluate().sides;detail.querySelectorAll('input[type=number]')[1].value=4;
   return [sides,!!history.evaluate().issue,feeEstimate813({currency:'USD',amount:1.25,basis:'round_turn'},1,sides)];
  })()`);assert.deepEqual([...result],[6,true,3.75]);
 }finally{b.close();}
});
