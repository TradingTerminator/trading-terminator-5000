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
 await routeBuild(context);await context.route('**/vendor/supabase-*.js',r=>r.fulfill({contentType:'application/javascript',body:stub}));
 await context.route('https://*.supabase.co/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/v8.html');await page.evaluate(fixture);
 await page.evaluate(()=>{$('loginView').classList.add('hidden');$('tabs').classList.remove('hidden');showView('session');v8ShowPrepStep(4,false);selectChapter814(0);});
 for(const title of ['Sentiment','Technik','Makro']){
  await page.getByRole('button',{name:new RegExp('^'+title+' ·')}).tap();
  assert.equal(await page.locator('.tt-chapters [aria-current=step]').textContent().then(v=>v.startsWith(title)),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 }
 assert.deepEqual(errors,[]);await context.close();console.log('PASS WebKit HTF navigation '+viewport.width+'x'+viewport.height);
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
