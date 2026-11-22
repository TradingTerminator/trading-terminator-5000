// iOS layout and interaction emulation through Playwright WebKit.
const fs=require('node:fs'),assert=require('node:assert/strict'),{webkit,devices}=require('playwright');
const {routeBuild}=require('./browser-test-server.cjs');
const fixture=fs.readFileSync('tests/v8-08.test.cjs','utf8').match(/b\.w\.eval\(`([\s\S]*?)`\);return b;/)[1];
const stub=fs.readFileSync('scripts/test-v809-browser.cjs','utf8').match(/const stub=`([\s\S]*?)`;/)[1];
(async()=>{
 const browser=await webkit.launch();
 try{
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:390,height:410}]){
 const context=await browser.newContext({...devices['iPhone 13'],viewport});
 const origin='https://tt814.test';await routeBuild(context,origin);await context.route('**/vendor/supabase-*.js',r=>r.fulfill({contentType:'application/javascript',body:stub}));
 await context.route('https://*.supabase.co/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
 await page.goto(origin+'/v8.html');assert.deepEqual(errors,[]);await page.evaluate(fixture);
 await page.evaluate(()=>{$('loginView').classList.add('hidden');$('tabs').classList.remove('hidden');showView('session');v8ShowPrepStep(4,false);selectChapter814(0);});
 for(const title of ['Sentiment','Technik','Makro']){
  await page.getByRole('button',{name:new RegExp('^'+title+' ·')}).tap();
  assert.equal(await page.locator('.tt-chapters [aria-current=step]').textContent().then(v=>v.startsWith(title)),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 }
 const cards=await page.evaluate(async()=>{
  const names=['Momentum','Liquidity Play','Absorption','Trendbruch','VWAP/VPOC','Countertrade','Manipulation + Ungleichgewicht','Rücklauf nach Ungleichgewicht','Kampagne Long','Kampagne Short'];
  const rows=names.map((name,i)=>({id:String(i),name,is_test_data:true,source_data:{approved:false,checklist:[]}}));
  window.__ttQuery=table=>({data:table==='test_setups_v8141'?rows:[],error:null});
  await loadSetupCatalog();await renderBook();
  const cards=[...document.querySelectorAll('[data-mada-card]')];
  return [cards.length,cards.every(card=>card.textContent.includes('Musterbild fehlt')&&card.textContent.includes('Nicht freigegeben')),entrySetups8141().filter(row=>row.is_test_data).length];
 });
 assert.deepEqual(cards,[10,true,10]);
 await page.evaluate(()=>{showView('settings');window.__ttRpc=(name)=>({data:name==='tt_prepare_reset_v8141'?'test-ticket':null,error:null});});
 await page.getByRole('button',{name:'Alle Daten löschen',exact:true}).tap();
 await page.getByRole('button',{name:'Abbrechen',exact:true}).tap();
 assert.equal(await page.locator('dialog[open]').count(),0);
 await page.getByRole('button',{name:'Alle Daten löschen',exact:true}).tap();
 await page.getByRole('button',{name:'Weiter zur endgültigen Bestätigung'}).tap();
 const finalButton=page.getByRole('button',{name:'Jetzt endgültig löschen'});
 assert.equal(await finalButton.isDisabled(),true);
 await page.locator('dialog[open] input').fill('ALLES ENDGÜLTIG LÖSCHEN ');
 assert.equal(await finalButton.isDisabled(),true);
 await page.locator('dialog[open] input').fill('ALLES ENDGÜLTIG LÖSCHEN');
 assert.equal(await finalButton.isEnabled(),true);
 await page.getByRole('button',{name:'Abbrechen',exact:true}).tap();
 assert.equal(await page.locator('dialog[open]').count(),0);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS WebKit HTF navigation '+viewport.width+'x'+viewport.height);
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
