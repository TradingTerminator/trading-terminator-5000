// Real Chromium. Synthetic backend; production Supabase requests are always blocked.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const fixture=fs.readFileSync('tests/v8-08.test.cjs','utf8').match(/b\.w\.eval\(`([\s\S]*?)`\);return b;/)[1];
const stub=fs.readFileSync('scripts/test-v809-browser.cjs','utf8').match(/const stub=`([\s\S]*?)`;/)[1];
fs.mkdirSync('evidence',{recursive:true});
let activePage;const failures=[];
async function client(browser,width=1440,baseline=false){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('**/v8.html',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace(/ integrity="[^"]+"/g,'')});});
 await context.route('**/vendor/supabase-*.js',r=>r.fulfill({contentType:'application/javascript',body:stub}));
 await context.route('https://*.supabase.co/**',r=>r.abort());
 if(baseline)await context.route('**/assets/v8-ui-*.css',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync('/tmp/tt812-baseline.css','utf8')}));
 const page=await context.newPage(),errors=[];activePage=page;page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/v8.html');await page.evaluate(fixture);await page.evaluate(()=>{$('loginView').classList.add('hidden');$('tabs').classList.remove('hidden');$('logout').classList.remove('hidden');});
 return {context,page,errors};
}
async function geometry(page,label){
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const g=await page.evaluate(()=>{
  const footer=$('v8BackBar'),r=footer.getBoundingClientRect(),main=document.querySelector('main').getBoundingClientRect();
  const visible=e=>!e.hidden&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;
  const ink=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()&&ink.length<8){const n=walker.currentNode;if(!n.textContent.trim()||['SCRIPT','STYLE','OPTION'].includes(n.parentElement?.tagName))continue;const range=document.createRange();range.selectNodeContents(n);const rect=range.getBoundingClientRect();if(rect.width&&rect.height&&rect.right>innerWidth+2)ink.push({text:n.textContent.slice(0,90),tag:n.parentElement.tagName,id:n.parentElement.id,cls:n.parentElement.className,right:rect.right,wrap:getComputedStyle(n.parentElement).overflowWrap});}const offenders=[...document.querySelectorAll('body *')].filter(e=>{const a=e.getBoundingClientRect();return a.width>0&&a.height>0&&a.right>innerWidth+2&&getComputedStyle(e).display!=='none'}).slice(0,12).map(e=>({id:e.id,cls:e.className,tag:e.tagName,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,60)}));return {ink,offenders,hidden:!visible(footer),viewport:innerWidth,scroll:document.documentElement.scrollWidth,footer:{x:r.x,right:r.right,height:r.height,top:r.top},center:Math.abs((r.left+r.right-main.left-main.right)/2),reserve:parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom),cssHeight:footer.offsetHeight,buttons:[...footer.querySelectorAll('button')].filter(visible).map(b=>{const rect=b.getBoundingClientRect(),s=getComputedStyle(b),canvas=document.createElement('canvas'),c=canvas.getContext('2d');c.font=s.font;const word=Math.max(...b.textContent.trim().split(/\s+/).map(w=>c.measureText(w).width));return {text:b.textContent,w:rect.width,h:rect.height,client:b.clientWidth,needed:word+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),clip:b.scrollWidth>b.clientWidth+1};})};
 });
 try{assert.ok(g.scroll<=g.viewport+1,label+' horizontal overflow '+JSON.stringify(g));if(g.hidden)return;
 assert.ok(g.center<3,label+' footer centering '+g.center);assert.ok(g.reserve>=g.cssHeight,label+' reserved content space');
 for(const b of g.buttons){assert.ok(b.w>=Math.min(120,g.viewport-40),label+' narrow '+JSON.stringify(b));assert.ok(b.h>=43,label+' touch height');assert.ok(!b.clip,label+' text clipped '+JSON.stringify(b));assert.ok(b.needed<=b.client+2,label+' unbreakable word '+JSON.stringify(b));}
 return g;}catch(e){failures.push({label,message:e.message,metrics:g});if(failures.length<=3)console.error(e.message);return g;}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 // Same DOM against the actual prior stylesheet proves the shared CSS regression.
 if(fs.existsSync('/tmp/tt812-baseline.css')){const c=await client(browser,3840,true);await c.page.evaluate(()=>showView('settings'));const broken=await c.page.evaluate(()=>{const f=$('v8BackBar'),s=getComputedStyle(f);return {width:f.clientWidth,padding:parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),button:$('v8BackButton').getBoundingClientRect().width};});assert.ok(broken.padding>1000||broken.button<120,JSON.stringify(broken));await c.page.screenshot({path:'evidence/v812-baseline-3840.png'});console.log('REPRODUCED V811 viewport-padding defect',JSON.stringify(broken));await c.context.close();}
 let combinations=0;
 for(const width of [320,390,768,1280,1920,2560,3840]){
  const c=await client(browser,width);const {page}=c;
  for(const theme of ['original','graphite','contrast','ocean','forest','light'])for(const text of ['normal','large'])for(const layout of ['comfortable','compact']){
   await page.evaluate(({theme,text,layout})=>{document.body.dataset.ttTheme=theme;document.body.dataset.ttText=text;document.body.dataset.ttLayout=layout;document.body.dataset.ttCorners=layout==='compact'?'square':'round';document.body.dataset.ttMotion=layout==='compact'?'reduce':'normal';showView('settings');},{theme,text,layout});
   await geometry(page,[width,theme,text,layout,'settings'].join('/'));
   await page.evaluate(()=>{showView('session');v8ShowPrepStep(1,false);});await geometry(page,[width,theme,text,layout,'preparation'].join('/'));combinations+=2;
  }
  for(const zoom of [1,1.25,2])for(const route of ['accounts','after','reviews','playbook','training','analytics','htflearning','session','decision','journal','settings']){
   await page.evaluate(({zoom,route})=>{document.documentElement.style.zoom=zoom;showView(route);if(route==='decision')showEntryStage(1,false);},{zoom,route});await geometry(page,[width,zoom,route].join('/'));combinations++;if(route==='decision')for(const stage of [2,3,4]){await page.evaluate(stage=>showEntryStage(stage,false),stage);await geometry(page,[width,zoom,'entry-step',stage].join('/'));combinations++;}
  }
  await page.evaluate(()=>{document.documentElement.style.zoom=1;showView('settings');const button=document.createElement('button');button.id='sentinel812';button.textContent='Last setting';$('settingsView').append(button);});
  // A simulated 34 px safe-area inset must increase the reserved space as well.
  await page.addStyleTag({content:'#v8BackBar{padding-bottom:44px}'});await geometry(page,width+'/safe-area');await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.evaluate(()=>new Promise(requestAnimationFrame));if(!await page.evaluate(()=>$('sentinel812').getBoundingClientRect().bottom<=$('v8BackBar').getBoundingClientRect().top+1))failures.push({label:width+'/sentinel',message:'Last content below footer'});
  if([320,390,1920,3840].includes(width))await page.screenshot({path:'evidence/v812-footer-'+width+'.png'});
  assert.deepEqual(c.errors,[]);await c.context.close();
 }
 // Every fresh lifecycle scope starts neutral, independent of previous completion.
 const c=await client(browser,390),{page}=c;
 for(const previous of ['none','fully-completed','early-closed','second-same-day']){
  await page.evaluate(previous=>{if(previous!=='none'){$('v8MacroDirection').value='long';$('htf').value='Old note';V8H.ack='old';V8Prep.acks={fear:'old'};V8Prep.overviewReview={owner:'owner',session:currentSession.id};}currentSession=null;renderSession();showView('session');v8ShowPrepStep(1,false);},previous);
  assert.equal(await page.locator('[data-prep-step="3"]').textContent().then(s=>s.includes('✓')),false);
  assert.deepEqual(await page.evaluate(()=>({scales:readScales($('sessionMoodOptions')),macro:$('v8MacroDirection').value,notes:$('htf').value,calendar:$('v8CalendarReviewed').checked,acks:V8Prep.acks,images:chosenImages($('htfDropzone')).length})),{scales:{},macro:'',notes:'',calendar:false,acks:{},images:0});
  await page.evaluate(()=>{currentSession={id:crypto.randomUUID(),status:'open',session_date:localDate(),htf_context:{}};renderSession();});
 }
 await page.evaluate(fixture);await page.evaluate(()=>{showView('session');v8ShowPrepStep(3,false);});assert.equal(await page.evaluate(()=>v8OverviewReviewed()),false);
 await page.locator('#v8PreparationNext').click();assert.equal(await page.evaluate(()=>V8Prep.step),4);assert.equal(await page.evaluate(()=>v8OverviewReviewed()),true);
 await page.evaluate(()=>{window.__ttRpc=async(name,args)=>name==='session_action_v810'&&args.p_action==='confirm'?{data:{session:{...currentSession,htf_context:{...currentSession.htf_context,...args.p_payload.context,htf_v8:{id:'saved812',plan:args.p_payload.plan}}}},error:null}:{data:{count:0},error:null};});
 await page.locator('#saveHtf').click();await page.waitForFunction(()=>V8.route==='decision');const saved=await page.evaluate(()=>({session:currentSession,workspace:readWorkspace()}));
 assert.equal(saved.session.htf_context.htf_v8.plan.preparation_v812.overview_reviewed,true);
 await page.reload();await page.evaluate(fixture);await page.evaluate(({session,workspace})=>{currentSession=session;renderSession();restoreWorkspace(workspace);showView('session');},saved);assert.equal(await page.evaluate(()=>v8OverviewReviewed()),true);
 const second=await client(browser,768);await second.page.evaluate(session=>{currentSession=session;renderSession();showView('session');},saved.session);assert.equal(await second.page.evaluate(()=>v8OverviewReviewed()),true);assert.deepEqual(await second.page.evaluate(()=>currentSession),saved.session);
 assert.deepEqual(c.errors,[]);assert.deepEqual(second.errors,[]);await second.context.close();await c.context.close();await browser.close();
 fs.writeFileSync('evidence/v812-geometry.json',JSON.stringify(failures,null,2));assert.equal(failures.length,0,'Geometry failures: '+JSON.stringify(failures.slice(0,8)));console.log('PASS V812 '+combinations+' footer/theme/text/layout/zoom/view combinations; baseline reproduced, safe-area reservation, neutral lifecycles, explicit optional completion, reload and independent client restore');
})().catch(async e=>{if(activePage&&!activePage.isClosed())await activePage.screenshot({path:'evidence/v812-failure.png'}).catch(()=>{});console.error(e);process.exit(1)});
