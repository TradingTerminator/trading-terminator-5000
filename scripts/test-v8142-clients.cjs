// Run against the disposable local Supabase stack created by the release workflow.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {chromium,webkit,devices}=require('playwright');
const {routeBuild,browserOptions}=require('./browser-test-server.cjs');
const backend='http://127.0.0.1:54321',key=process.env.ANON_KEY;
const origin='https://tt-clients.test';
async function main(){
 assert.ok(key,'Local Supabase ANON_KEY required');
 const email='sync-'+randomUUID()+'@example.test',password=randomUUID()+'-Aa1!';
 const signup=await fetch(backend+'/auth/v1/signup',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 assert.equal(signup.ok,true,'Disposable test user created');
 const desktop=await chromium.launch(browserOptions());
 let mobile;
 try{
  mobile=await webkit.launch();
  async function open(browser,options){
   const context=await browser.newContext(options);
   await routeBuild(context,origin);
   let offline=false;
   await context.route('https://hogrdcqblpcrqgdtsvjv.supabase.co/**',async route=>{
    if(offline)return route.abort('internetdisconnected');
    const request=route.request(),url=new URL(request.url());
    const headers={...request.headers(),apikey:key};delete headers.host;
    if(headers.authorization?.includes('sb_publishable_'))headers.authorization='Bearer '+key;
    const response=await context.request.fetch(backend+url.pathname+url.search,{method:request.method(),headers,data:request.postDataBuffer()||undefined});
    await route.fulfill({response});
   });
   const page=await context.newPage();await page.goto(origin+'/v8.html');
   const ok=await page.evaluate(async credentials=>!(await client.auth.signInWithPassword(credentials)).error,{email,password});
   assert.equal(ok,true);await page.waitForFunction(()=>currentUser&&!$('app').classList.contains('hidden'));
   await page.evaluate(()=>showSessionHub());
   async function sync(){await page.evaluate(async()=>{while(activeSync814)await new Promise(r=>setTimeout(r,30));await syncDraft814();});}
   async function set(value){
    await page.evaluate(v=>{const field=$('session-scale-focus');field.value=v;field.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
   }
   const read=()=>page.evaluate(()=>readScales($('sessionMoodOptions')).focus);
   return {page,sync,set,read,offline:value=>{offline=value;}};
  }
  const pc=await open(desktop,{viewport:{width:1280,height:800}});
  const phone=await open(mobile,devices['iPhone 13']);
  await pc.sync();await phone.sync();await phone.set(7);await phone.sync();await pc.sync();assert.equal(await pc.read(),7);
  await pc.set(8);await pc.sync();await phone.sync();assert.equal(await phone.read(),8);
  phone.offline(true);await phone.set(3);await phone.sync();await pc.set(9);await pc.sync();
  phone.offline(false);await phone.sync();
  const status=await phone.page.evaluate(()=>draftStatus814.textContent);assert.match(status,/Beide Geräte/);
  await phone.page.evaluate(()=>draftStatus814.querySelector('button').click());await phone.sync();await pc.sync();
  assert.equal(await pc.read(),3);
  await pc.page.reload();await pc.page.waitForFunction(()=>!!currentUser);await pc.sync();assert.equal(await pc.read(),3);
  console.log('PASS authenticated Chromium and iPhone WebKit, bidirectional edit, offline queue, conflict resolution and reload');
 }finally{await mobile?.close();await desktop.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
