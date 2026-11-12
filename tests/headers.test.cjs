const {test}=require('node:test'),assert=require('node:assert/strict');
test('header gateway restricts files, blocks framing and strips incoming credentials',async()=>{
 const worker=(await import('../ops/headers-worker.mjs')).default;const original=global.fetch;let upstream;
 global.fetch=async (url,options)=>{upstream={url,options};return new Response('app',{status:200});};
 try{
 const result=await worker.fetch(new Request('https://app.tradingterminator.com/v7-test.html?token=secret',{headers:{Authorization:'Bearer secret',Cookie:'private'}}));
 assert.equal(result.status,200);assert.equal(result.headers.get('X-Frame-Options'),'DENY');assert.match(result.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.ok(!upstream.url.includes('secret'));assert.equal(upstream.options.headers,undefined);
 assert.equal((await worker.fetch(new Request('https://app.tradingterminator.com/src/v7.html'))).status,404);
 assert.equal((await worker.fetch(new Request('https://app.tradingterminator.com/v7-test.html',{method:'POST'}))).status,405);
 }finally{global.fetch=original;}
});
