// Real browser UI, isolated synthetic backend. All production network requests aborted.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const {routeBuild,browserOptions}=require('./browser-test-server.cjs');
const old=fs.readFileSync('scripts/test-v809-browser.cjs','utf8');
const stub=old.match(/const stub=`([\s\S]*?)`;/)[1].replace("createSignedUrl:async()=>({data:{signedUrl:''},error:null})","createSignedUrl:async()=>({data:{signedUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1sAAAAASUVORK5CYII='},error:null})").replace('upload:async(path)=>({data:{path},error:null})',"upload:async(path,file)=>{(window.__uploads??=[]).push({path,size:file.size});return {data:{path},error:null}}");
const fixture=fs.readFileSync('tests/v8-08.test.cjs','utf8').match(/b\.w\.eval\(`([\s\S]*?)`\);return b;/)[1];
fs.mkdirSync('evidence',{recursive:true});
(async()=>{
 for(const width of [1440,390,320]){
 const browser=await chromium.launch(browserOptions());
 const context=await browser.newContext({viewport:{width,height:1000}});await routeBuild(context);
 await context.route('**/vendor/supabase-*.js',r=>r.fulfill({contentType:'application/javascript',body:stub}));
 await context.route('https://*.supabase.co/**',r=>r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/v8.html');await page.evaluate(fixture);
 await page.evaluate(()=>{
  $('loginView').classList.add('hidden');$('tabs').classList.remove('hidden');
  accounts=[{id:'a',account_name:'NQ 40',default_instrument:'NQ',default_quantity:1,default_sl_ticks:40},{id:'b',account_name:'MNQ 80',default_instrument:'MNQ',default_quantity:5,default_sl_ticks:80},{id:'c',account_name:'NQ 100',default_instrument:'NQ',default_quantity:1,default_sl_ticks:100}];allAccounts=accounts;
  currentSession.htf_context.selected_accounts=accounts.map(a=>({account_id:a.id,instrument:a.default_instrument,planned_quantity:a.default_quantity,initial_sl_ticks:a.default_sl_ticks}));
  currentSession.htf_context.htf_v8={id:'confirmed',plan:v8HtfPlan()};renderSession();renderDecision();v810OpenEntry();
 });
 assert.equal(await page.locator('#v811CaptureMode input:checked').count(),0);await page.locator('#entryStageNext').click();assert.equal(await page.evaluate(()=>entryStage),1);
 await page.locator('#v811CaptureMode input[value=planned]').check();for(const key of ['focus','pressure','fomo','revenge','fear','greed']){const f=page.locator('#entryEmotionOptions [data-scale="'+key+'"]');await f.focus();await f.press('Enter');}
 assert.equal(await page.evaluate(()=>readScales($('entryEmotionOptions')).focus),5);await page.locator('#entryStageNext').click();await page.locator('#instrument').selectOption('NQ');await page.locator('#setupCards button').first().click();await page.locator('.direction-choice[data-direction=long]').click();await page.locator('#v813IdeaNote').fill('Kurzer optionaler Test');await page.locator('#entryStageNext').click();
 await page.locator('[data-choice=reviewed]').click();await page.locator('#v811Timeframe').selectOption('m1');
 const observations={volume:'neutral',stopping:'none',cvd:'flat',delta:'neutral',vpoc:'at',vwap:'at',zone:'middle',zone_direction:'neutral',aggression:'balanced',absorption:'none',liquidity:'both'};
 for(const [key,value] of Object.entries(observations)){await page.locator('#v813LtfCheck_'+key).check();await page.locator('#v811Ltf_'+key).selectOption(value);}
 // Browser-native paste dispatch containing an actual PNG file.
 await page.locator('#v811LtfImages').evaluate(el=>{const canvas=document.createElement('canvas');canvas.width=4;canvas.height=4;canvas.getContext('2d').fillRect(0,0,4,4);canvas.toBlob(blob=>{const d=new DataTransfer();d.items.add(new File([blob],'chart.png',{type:'image/png'}));el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d,bubbles:true}));},'image/png');});
 await page.getByRole('button',{name:'Originale speichern',exact:true}).click();await page.waitForFunction(()=>V811.ltf.images.length===1);assert.equal(await page.locator('#v811ImageAbsence').isVisible(),false);await page.waitForFunction(()=>document.querySelector('.tt-saved-screenshots img')?.complete);assert.equal(await page.evaluate(()=>__uploads.length),1);assert.ok(await page.locator('#v811LtfUploadStatus').textContent());
 assert.equal(await page.evaluate(()=>TT811.validLtf(ltfSnapshot811())),true);assert.equal(await page.evaluate(()=>contextPanel.open),false,'HTF remains compact after refresh');
 for(const theme of ['original','graphite','contrast','ocean','forest','light']){await page.evaluate(t=>{$('ttThemeSelect').value=t;$('ttThemeSelect').dispatchEvent(new Event('change',{bubbles:true}));},theme);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,theme+' overflow '+width);const contrast=await page.locator('#v811Timeframe').evaluate(el=>{const s=getComputedStyle(el),lum=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722},a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});assert.ok(contrast>=4.5,theme+' input contrast '+contrast);}
 await page.screenshot({path:'evidence/v813-ltf-'+width+'.png',fullPage:false});
 await page.locator('#entryStageNext').click();await page.locator('#entryCopy').check();for(const c of await page.locator('.acct-check').all())await c.check();
 assert.equal(await page.locator('.acct-qty').first().isEnabled(),true);assert.equal(await page.locator('.acct-sl-ticks').first().inputValue(),'40');
 const center=await page.evaluate(()=>{const r=document.querySelector('main').getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2);});assert.ok(center<3,'Content centered: '+center);
 await page.evaluate(()=>{
  const state={trade:null,allocs:[],stops:[]};window.__811=state;
  window.__ttQuery=(name,{single})=>({data:name==='trades'?(single?state.trade:state.trade?[state.trade]:[]):name==='trade_account_allocations'?state.allocs:name==='stop_adjustments'?state.stops:[],error:null,count:0});
  window.__ttRpc=async(name,args)=>{
   if(name==='record_trade_attempt_v814'){
    state.allocs=args.p_allocations.map((a,i)=>({...a,id:'allocation-'+i,trade_id:'trade-811',initial_sl_points:a.initial_sl_ticks/4,initial_risk_usd:tickValues[a.instrument]*a.initial_sl_ticks*a.planned_quantity}));
    state.trade={id:'trade-811',session_id:currentSession.id,session_trade_no:1,direction:args.p_direction,instrument:args.p_instrument,setup_type:args.p_setup_type,entry_at:new Date().toISOString(),initial_risk_usd:state.allocs.reduce((n,a)=>n+a.initial_risk_usd,0),observations:{entry_context_v736:args.p_entry_context}};
    return {data:state.trade.id,error:null};
   }
   if(name==='close_trade_v813'){state.trade.exit_at=args.p_exit_at;state.trade.exit_reason='other';Object.assign(state.trade.observations,{exit_capture_v813:{reason_pending:true},exit_emotion_scales:args.p_scales,results_pending_v808:true});return {data:{trade_id:state.trade.id,exit_at:state.trade.exit_at},error:null};}
   if(name==='complete_trade_v813'){state.trade.exit_reason=args.p_reason;state.trade.observations.results_pending_v808=false;state.trade.realized_pnl_usd=args.p_results.reduce((sum,r)=>sum+r.realized_pnl_usd,0);return {data:{trade_id:state.trade.id},error:null};}
   if(name==='record_stop_batch_v811'){state.stops.push(...args.p_items);return {data:{saved:true,results:args.p_items.map(i=>({...i,changed_at:new Date().toISOString()}))},error:null};}
   return {data:{count:0},error:null};
  };
 });
 await page.locator('#recordEntry').click();await page.waitForFunction(()=>$('tradeDetails').dataset.tradeId==='trade-811');
 assert.equal(await page.evaluate(()=>__811.trade.initial_risk_usd),900);assert.deepEqual(await page.evaluate(()=>__811.allocs.map(a=>a.initial_risk_usd)),[200,200,500]);
 assert.equal(await page.locator('.trade-panes button:visible').count(),2);await page.locator('[data-pane-button=stop]').focus();await page.locator('[data-pane-button=stop]').press('ArrowRight');assert.equal(await page.locator('[data-pane-button=exit]').getAttribute('aria-selected'),'true');assert.equal(await page.locator('.trade-identity h3').textContent(),'Trade 1 · LONG NQ · Momentum');
 await page.locator('[data-pane-button=exit]').click();assert.equal(await page.locator('.exit-amount').first().isVisible(),false);await page.locator('[data-pane-button=stop]').click();
 const stop=page.locator('.stop-panel').first();await stop.locator('.stop-reason').selectOption('profit_protection');await stop.locator('.save-stop').click();assert.equal(await page.evaluate(()=>__811.stops.length),0,'Empty is not BE');
 await stop.locator('.stop-new').fill('0');await stop.locator('.save-stop').click();await page.waitForFunction(()=>__811.stops.length===1);assert.equal(await stop.locator('.save-stop').getAttribute('data-previous'),'0');
 await page.locator('[data-pane-button=exit]').click();assert.equal(await page.locator('.exit-amount').first().isVisible(),false);
 await page.locator('.tt-close-trade').click();assert.equal(await page.locator('.exit-editor [aria-invalid=true]').count(),1);
 for(const rating of await page.locator('.exit-editor input[data-scale]').all()){await rating.focus();await rating.press('Home');}
 await page.locator('.tt-close-trade').click();await page.waitForFunction(()=>__811.trade.exit_at&&document.querySelector('.tt-exit-completion'));
 await page.locator('#ttExitReason').selectOption('manual');
 for(const card of await page.locator('.tt-exit-completion fieldset').all()){await card.locator('input').nth(0).fill('15');await card.locator('input').nth(1).fill('0');}
 await page.getByRole('button',{name:'Nachdokumentation abschließen'}).click();await page.waitForFunction(()=>!__811.trade.observations.results_pending_v808);assert.equal(await page.evaluate(()=>__811.trade.initial_risk_usd),900);
 await page.screenshot({path:'evidence/v813-exit-'+width+'.png',fullPage:false});
 // Existing persisted session on a second client has the same data, no server-state rewrite.
 const second=await context.newPage();await second.goto('http://127.0.0.1:4173/v8.html');await second.evaluate(fixture);assert.equal(await second.evaluate(()=>document.querySelectorAll('#v811CaptureMode input:checked').length),0);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS V813 Chromium '+width+': explicit capture, midpoint, structured LTF/paste, themes/centering, 900 USD, compact live, safe BE, standalone exit and separate completion');
 }
})().catch(e=>{console.error(e);process.exit(1)});
