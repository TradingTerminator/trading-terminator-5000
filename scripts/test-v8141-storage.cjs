// Isolated local Supabase only. Two sessions of the same account and a separate owner.
const assert=require('node:assert/strict');
const base='http://127.0.0.1:54321',key=process.env.ANON_KEY;
async function call(path,{token,method='GET',body,headers={}}={}){
 const res=await fetch(base+path,{method,headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json',...headers},body:body==null?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body)});
 const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data=raw}return {ok:res.ok,data,status:res.status};
}
async function checked(path,options){const r=await call(path,options);assert.ok(r.ok,path+' '+r.status+' '+JSON.stringify(r.data));return r.data;}
async function main(){
 const password='local-TT-8141-example-only',email='phone@example.test';
 const signup=email=>checked('/auth/v1/signup',{method:'POST',body:{email,password}});
 const login=email=>checked('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
 await signup(email);await signup('second@example.test');
 const phone=await login(email),pc=await login(email),other=await login('second@example.test');
 const rpc=(name,token,body={})=>checked('/rest/v1/rpc/tt_'+name+'_v8141',{token,method:'POST',body});
 const bucket='trading-chart-screenshots',files='/storage/v1/object/'+bucket;
 const chart=(u)=>u.user.id+'/trade/'+crypto.randomUUID()+'/chart.png';
 const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jHo0AAAAASUVORK5CYII=','base64');
 const upload=(token,path)=>call(files+'/'+path,{token,method:'POST',body:image,headers:{'Content-Type':'image/png'}});
 const a=chart(phone),b=chart(other);
 assert.ok((await upload(phone.access_token,a)).ok);assert.ok((await upload(other.access_token,b)).ok);
 const setup=(token,owner,name,headers={})=>call('/rest/v1/trading_setup_catalog',{token,method:'POST',body:{owner_id:owner,name},headers});
 assert.ok((await setup(phone.access_token,phone.user.id,'old')).ok);
 const ticket=await rpc('prepare_reset',phone.access_token);
 const state=await rpc('begin_reset',phone.access_token,{ticket,phrase:'ALLES ENDGÜLTIG LÖSCHEN'});
 assert.equal((await rpc('data_state',pc.access_token)).generation,state.generation);
 assert.equal((await rpc('reset_files',pc.access_token,{ticket}))[0].path,a);
 assert.equal((await call('/rest/v1/rpc/tt_finish_reset_v8141',{method:'POST',token:pc.access_token,body:{ticket}})).ok,false);
 await checked(files,{token:pc.access_token,method:'DELETE',body:{prefixes:[a]}});
 assert.equal((await rpc('finish_reset',pc.access_token,{ticket})).phase,'ready');
 assert.equal((await setup(phone.access_token,phone.user.id,'stale')).ok,false);
 assert.equal((await upload(phone.access_token,a)).ok,false);
 assert.deepEqual(await checked('/rest/v1/trading_setup_catalog?select=name',{token:(await login(email)).access_token}),[]);
 assert.ok((await setup(pc.access_token,pc.user.id,'fresh',{'x-tt-generation':state.generation})).ok);
 assert.ok((await upload(pc.access_token,a.replace('/chart.png','/'+state.generation+'/new.png'))).ok);
 const foreign=await call('/storage/v1/object/authenticated/'+bucket+'/'+b,{token:other.access_token});assert.ok(foreign.ok);
 console.log('PASS two authenticated sessions, storage deletion, stale upload and REST refusal, fresh generation, login and account isolation');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
