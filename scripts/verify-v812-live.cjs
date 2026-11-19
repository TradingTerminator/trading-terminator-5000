'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const origin='https://app.tradingterminator.com/';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const expected=fs.readFileSync('v8.html','utf8');
 const paths=[...expected.matchAll(/(?:src|href)="((?:assets|vendor)\/[^"]+)"/g)].map(m=>m[1]);
 assert.ok(paths.length>5);
 let last;
 for(let attempt=0;attempt<30;attempt++){
  try{
   const response=await fetch(origin+'v8.html?release='+process.env.GITHUB_SHA,{signal:AbortSignal.timeout(20000),cache:'no-store'});
   assert.equal(response.status,200);
   const html=await response.text();
   assert.ok(html.includes('8.12'),'Live page must show V8.12');
   for(const path of paths)assert.ok(html.includes(path),'Live asset reference missing: '+path);
   for(const path of paths){
    const res=await fetch(origin+path,{signal:AbortSignal.timeout(20000)});
    assert.equal(res.status,200,path);
    assert.equal(digest(Buffer.from(await res.arrayBuffer())),digest(fs.readFileSync(path)),'Live checksum: '+path);
   }
   console.log('PASS live V8.12 HTML and '+paths.length+' script/style checksums at '+origin);
   return;
  }catch(error){last=error;console.log('Waiting for published V8.12: '+error.message);if(attempt<29)await new Promise(r=>setTimeout(r,10000));}
 }
 throw last;
})().catch(e=>{console.error(e);process.exit(1)});
