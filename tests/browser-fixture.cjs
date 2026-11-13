const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM,VirtualConsole}=require('jsdom');const {webcrypto}=require('node:crypto');
function boot(page='v7-test.html'){
 let tableHandler=null;let user=null,pending=null,rpcResult={data:{count:0},error:null};const issues=[];const callbacks=[];const downloads=[];
 const client={auth:{getUser:async()=>({data:{user},error:null}),onAuthStateChange:fn=>{callbacks.push(fn);return{}},signOut:async()=>{user=null;return{error:null}}},from(name){const ops=[];const response=()=>tableHandler?Promise.resolve(tableHandler(name,ops)):pending?pending:Promise.resolve({data:[],error:null,count:0});let q;q=new Proxy({},{get(t,k){if(k==='then')return (a,b)=>response().then(a,b);return (...args)=>{ops.push({method:k,args});return q;};}});return q;},rpc:async(...args)=>typeof rpcResult==='function'?rpcResult(...args):rpcResult,storage:{from(){return{list:async()=>({data:[],error:null}),download:async()=>({data:new Blob(['test-image']),error:null}),createSignedUrl:async()=>({data:{signedUrl:'https://test.invalid/image'},error:null})}}}};
 let html=fs.readFileSync(page,'utf8').replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/g,(tag)=>{const m=tag.match(/src="([^"]+)"/);if(m[1].startsWith('vendor/'))return '';return '<script>'+fs.readFileSync(m[1],'utf8')+'</script>';});
 const vc=new VirtualConsole();vc.on('jsdomError',e=>issues.push(e.message));
 const dom=new JSDOM(html,{url:'https://app.tradingterminator.com/v7-test.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.supabase={createClient:()=>client};w.JSZip=require('jszip');w.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.scrollBy=()=>{};Object.defineProperty(w.crypto,'randomUUID',{value:()=>webcrypto.randomUUID()});Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});}});
 return{w:dom.window,issues,downloads,setTableHandler(v){tableHandler=v},setRpc(v){rpcResult=v},setUser(v){user=v},setPending(v){pending=v},close(){dom.window.close()}};
}
const tick=()=>new Promise(r=>setTimeout(r,20));

module.exports={boot,tick};
