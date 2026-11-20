const test = require('node:test');
const assert = require('node:assert/strict');
const {boot,tick} = require('./browser-fixture.cjs');

test('two preparation drafts exchange edits, survive an offline edit and require explicit conflict resolution', async () => {
 const devices = [boot('v8.html'),boot('v8.html')];
 let remote = null;
 let offline = false;
 try {
  await tick();
  for (const device of devices) {
   device.setTableHandler(name => ({data:name==='workspace_revisions_v814'?remote:[],error:null}));
   device.setRpc((name,args) => {
    assert.equal(name,'save_workspace_revision_v814');
    if(offline)return {error:{message:'offline'}};
    if(args.p_base!==(remote?.revision||0))return {error:{code:'40001'}};
    remote={revision:args.p_base+1,payload:JSON.parse(JSON.stringify(args.p_payload))};
    return {data:remote.revision,error:null};
   });
   device.w.eval("currentUser={id:'owner'};currentSession={id:'s',htf_context:{},status:'open',session_date:localDate()};$('app').classList.remove('hidden');renderSession();");
  }
  const [phone,pc]=devices;
  const write=(d,v)=>{const field=d.w.document.getElementById('v8TradingMinutes');field.value=v;field.dispatchEvent(new d.w.Event('input',{bubbles:true}));};
  const read=d=>d.w.document.getElementById('v8TradingMinutes').value;
  write(phone,'45');await phone.w.syncDraft814();await pc.w.syncDraft814();
  assert.equal(read(pc),'45');
  offline=true;write(pc,'60');await pc.w.syncDraft814();assert.equal(remote.revision,1);
  offline=false;write(phone,'90');await phone.w.syncDraft814();await pc.w.syncDraft814();
  assert.equal(read(pc),'60');assert.equal(remote.revision,2);
  pc.w.eval("draftStatus814.querySelector('button').click()");
  await tick();await phone.w.syncDraft814();assert.equal(read(phone),'60');assert.equal(remote.revision,3);
 }finally{devices.forEach(device=>device.close());}
});
