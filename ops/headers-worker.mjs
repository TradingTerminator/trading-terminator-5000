// Deployment requires control of the Cloudflare route app.tradingterminator.com/*.
// GitHub Pages ignores custom _headers files; this is a separate header gateway.
const ALLOWED=new Set(["/","/index.html","/v7-test.html","/v7-Test.html","/v6.html","/assets/client-1-1f08eed521fd.js","/assets/client-2-4c31a91b9dbe.js","/assets/client-3-538471d56053.js","/vendor/LICENSE-jszip.txt","/vendor/LICENSE-supabase.txt","/vendor/jszip-3.10.1.min.js","/vendor/supabase-2.119.0.js"]);
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://hogrdcqblpcrqgdtsvjv.supabase.co; connect-src 'self' https://hogrdcqblpcrqgdtsvjv.supabase.co wss://hogrdcqblpcrqgdtsvjv.supabase.co; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests; frame-ancestors 'none'";
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.protocol!=='https:'){url.protocol='https:';return Response.redirect(url.href,301);}
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 if(!ALLOWED.has(url.pathname))return new Response('Not found',{status:404});
 const headers=new Headers({'Content-Security-Policy':CSP,'Strict-Transport-Security':'max-age=31536000','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});
 if(['/','/index.html','/v7-Test.html','/v6.html'].includes(url.pathname)){headers.set('Location','/v7-test.html');return new Response(null,{status:302,headers});}
 // Never forward browser cookies, authorization headers, or query parameters upstream.
 const upstream=await fetch('https://raw.githubusercontent.com/TradingTerminator/trading-terminator-5000/main'+url.pathname,{method:request.method});
 if(!upstream.ok)return new Response('Release currently unavailable',{status:503,headers});
 headers.set('Content-Type',url.pathname.endsWith('.js')?'application/javascript; charset=utf-8':url.pathname.endsWith('.html')?'text/html; charset=utf-8':'text/plain; charset=utf-8');
 headers.set('Cache-Control',url.pathname.endsWith('.html')?'no-store':'public, max-age=3600');
 return new Response(request.method==='HEAD'?null:upstream.body,{status:200,headers});
}};
