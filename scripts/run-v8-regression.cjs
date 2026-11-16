// Exercise shared business behavior against V8. V7-specific UI contracts are covered by V8's own workflow tests.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),target=path.join(root,'tests/_v8-regression.generated.cjs');
let source=fs.readFileSync(path.join(root,'tests/app.test.cjs'),'utf8').replaceAll('tt7_','tt8_').replace('/7.42/','/8.09/').replace(/\bSession\b/g,'Handelssession');
for(const title of ['navigation identifies the active main area when training or journal is open','setup and idea precede account risk and emotion in the actual entry DOM','V739 session management stays in journal and shortcut does not promise open trades','guided entry has three stages and cannot advance without identifying a setup and idea']){
 const marker="test('"+title+"'";if(!source.includes(marker))throw new Error('Review V8 regression mapping: '+title);source=source.replace(marker,"test.skip('"+title+"'");
}
source=source.replaceAll('#playbookView #setupManager','#settingsView #setupManager');
const f=source.indexOf("test('analytics excludes provisional or missing account results from decision R averages'"),e=source.indexOf("\ntest(",f+1);
if(f<0)throw Error('Financial regression title changed');
const replacement="test('analytics excludes provisional or missing account results from decision R averages',async()=>{const b=boot();try{await tick();b.w.eval(\"currentUser={id:'owner'};T9.owner='owner';T9.rows=[{id:'t',entry_at:'2026-11-16T17:00Z',exit_at:'2026-11-16T17:01Z',observations:{}}];T9.allocs=[{id:'a',trade_id:'t',initial_risk_usd:20}];T9.results=[{allocation_id:'a',realized_pnl_usd:20,result_status:'pending'}];renderAnalytics()\");assert.match(b.w.document.getElementById('tt9Evidence').textContent,/nicht berechenbar/);b.w.eval(\"T9.results[0].result_status='final';renderAnalytics()\");assert.match(b.w.document.getElementById('tt9Evidence').textContent,/nicht berechenbar/);b.w.eval(\"T9.results[0].fees_usd=0;renderAnalytics()\");assert.match(b.w.document.getElementById('tt9Evidence').textContent,/1.00 R/);}finally{b.close()}});";
source=source.slice(0,f)+replacement+source.slice(e);
try{fs.writeFileSync(target,source);const result=cp.spawnSync(process.execPath,['--test','--test-force-exit',target],{cwd:root,env:{...process.env,TT_TEST_PAGE:'v8.html'},stdio:'inherit',timeout:120000});if(result.error)throw result.error;process.exitCode=result.status??1;}finally{fs.rmSync(target,{force:true});}
