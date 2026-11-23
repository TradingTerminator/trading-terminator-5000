// Run against the disposable local Supabase stack created by the release workflow.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {chromium,webkit,devices}=require('playwright');
const {browserOptions}=require('./browser-test-server.cjs');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const backend='http://127.0.0.1:54321',key=process.env.ANON_KEY;
async function serveBuild(){
 const dist=path.resolve('dist'),core=fs.readdirSync(path.join(dist,'assets')).find(f=>/^v8-core1-.*\.js$/.test(f));
 const config=fs.readFileSync(path.join(dist,'assets',core),'utf8').match(/window\.supabase\.createClient\('([^']+)','([^']+)'/);
 assert.ok(config,'Built client configuration found');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(dist,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(file)];
  res.setHeader('Content-Type',type||'application/octet-stream');
  if(file.endsWith('v8.html')||path.basename(file)===core){
   const fixture=fs.readFileSync(file,'utf8').replaceAll(config[1],backend).replaceAll(config[2],key).replace('; upgrade-insecure-requests','').replace(/ integrity="[^"]+"/g,'');
   return res.end(fixture);
  }
  fs.createReadStream(file).pipe(res);
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 return {server,origin:'http://127.0.0.1:'+server.address().port};
}
async function main(){
 assert.ok(key,'Local Supabase ANON_KEY required');
 const email='sync-'+randomUUID()+'@example.test',password=randomUUID()+'-Aa1!';
 const signup=await fetch(backend+'/auth/v1/signup',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 assert.equal(signup.ok,true,'Disposable test user created');
 const desktop=await chromium.launch(browserOptions());
 const {server,origin}=await serveBuild();
 let mobile;
 try{
  mobile=await webkit.launch();
  async function open(browser,options){
   const context=await browser.newContext(options);
   await context.route('https://**/*',route=>route.abort());
   const page=await context.newPage();await page.goto(origin+'/v8.html');
   const ok=await page.evaluate(async credentials=>!(await client.auth.signInWithPassword(credentials)).error,{email,password});
   assert.equal(ok,true);await page.waitForFunction(()=>currentUser&&!$('app').classList.contains('hidden'));
   await page.evaluate(()=>showSessionHub());
   async function sync(){await page.evaluate(async()=>{while(activeSync814)await new Promise(r=>setTimeout(r,30));await syncDraft814();});}
   async function set(value){
    await page.evaluate(v=>{const field=$('session-scale-focus');field.value=v;field.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
   }
   const read=()=>page.evaluate(()=>readScales($('sessionMoodOptions')).focus);
   return {page,sync,set,read,offline:value=>context.setOffline(value)};
  }
  const pc=await open(desktop,{viewport:{width:1280,height:800}});
  const phone=await open(mobile,devices['iPhone 13']);
  await pc.sync();await phone.sync();await phone.set(7);await phone.sync();await pc.sync();assert.equal(await pc.read(),7);
  console.log('PASS phone to desktop');
  await pc.set(8);await pc.sync();await phone.sync();assert.equal(await phone.read(),8);
  console.log('PASS desktop to phone');
  await phone.offline(true);await phone.set(3);await phone.sync();await pc.set(9);await pc.sync();
  await phone.offline(false);await phone.sync();
  const status=await phone.page.evaluate(()=>draftStatus814.textContent);assert.match(status,/Beide Geräte/);
  await phone.page.evaluate(()=>draftStatus814.querySelector('button').click());await phone.sync();await pc.sync();
  assert.equal(await pc.read(),3);
  await pc.page.reload();await pc.page.waitForFunction(()=>currentUser&&!$('app').classList.contains('hidden'));await pc.sync();assert.equal(await pc.read(),3);
  console.log('PASS authenticated Chromium and iPhone WebKit, bidirectional edit, offline queue, conflict resolution and reload');
 }finally{server.close();await mobile?.close();await desktop.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
