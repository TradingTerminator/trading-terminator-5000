// Run from the root of either built version with identical accounts and a synthetic backend.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {routeBuild,browserOptions}=require('./browser-test-server.cjs');
const fixture=fs.readFileSync('tests/v8-08.test.cjs','utf8').match(/b\.w\.eval\(`([\s\S]*?)`\);return b;/)[1];
const stub=fs.readFileSync('scripts/test-v809-browser.cjs','utf8').match(/const stub=`([\s\S]*?)`;/)[1];
(async()=>{
 for(let sample=0;sample<5;sample++){
 const browser=await chromium.launch(browserOptions());
 try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});await routeBuild(ctx);
 await ctx.route('**/vendor/supabase-*.js',r=>r.fulfill({contentType:'application/javascript',body:stub}));await ctx.route('https://*.supabase.co/**',r=>r.abort());
 const p=await ctx.newPage();p.setDefaultTimeout(5000);await p.goto('http://127.0.0.1:4173/v8.html');await p.evaluate(fixture);
 await p.evaluate(()=>{
 $('loginView').classList.add('hidden');$('tabs').classList.remove('hidden');
 accounts=[{id:'a',account_name:'MNQ',default_instrument:'MNQ',default_quantity:1,default_sl_ticks:40,active:true}];allAccounts=accounts;
 currentSession.htf_context.selected_accounts=[{account_id:'a',instrument:'MNQ',planned_quantity:1,initial_sl_ticks:40}];
 currentSession.htf_context.htf_v8={id:'confirmed',plan:v8HtfPlan()};renderSession();renderDecision();v810OpenEntry();
 window.__ttRpc=async(name,args)=>{if(name.startsWith('record_trade_attempt_'))window.benchmarkReceipt={name,args};return {data:null,error:null};};
 });
 const latest=await p.locator('[data-choice=not_reviewed]').count()>0;
 let clicks=0,inputs=0;const stages=[];const click=async sel=>{await p.locator(sel).first().click();clicks++};
 const next=async()=>{await click('#entryStageNext');stages.push(await p.evaluate(()=>entryStage));};
 const start=performance.now();
 await click('#v811CaptureMode input[value=planned]');
 for(const key of ['focus','pressure','fomo','revenge','fear','greed']){const field=p.locator('#entryEmotionOptions [data-scale="'+key+'"]');await field.focus();await field.press('Enter');inputs++;}
 await next();await click('#setupCards button');await click('.direction-choice[data-direction=long]');
 if(latest){await click('#fastEntry814');stages.push(await p.evaluate(()=>entryStage));}else await next();
 if(!latest){await p.locator('#v811LtfStatus').selectOption('reviewed');inputs++;}
 if(!latest)await next();assert.deepEqual(stages,latest?[2,4]:[2,3,4]);
 if(!await p.locator('.acct-check').first().isChecked())await click('.acct-check');
 await click('#recordEntry');await p.waitForFunction(()=>!!window.benchmarkReceipt,{},{timeout:3000});const ms=Math.round(performance.now()-start);
 assert.equal(await p.evaluate(()=>benchmarkReceipt.args.p_allocations.length),1);
 console.log(JSON.stringify({version:latest?'8.14':'8.13',sample:sample+1,clicks,inputs,screenChanges:stages.length,ms}));
 await ctx.close();
 }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
