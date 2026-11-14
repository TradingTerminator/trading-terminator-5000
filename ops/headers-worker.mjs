// Deployment requires control of the Cloudflare route app.tradingterminator.com/*.
// GitHub Pages ignores custom _headers files; this is a separate header gateway.
const ALLOWED=new Set(["/","/index.html","/v8.html","/v7-test.html","/v7-Test.html","/v6.html","/assets/client-1-5f610ddce1f7.js","/assets/client-2-55d37b0fa911.js","/assets/client-3-ddebcbcd6909.js","/assets/client-4-f28b9b1466ed.js","/assets/client-5-cc2a85f0d741.js","/assets/v8-core1-7a2cce5873b5.js","/assets/v8-core2-99f2ccf77b22.js","/assets/v8-core3-513f0c96e108.js","/assets/v8-core4-f7a79974bb16.js","/assets/v8-core5-dabd08119397.js","/assets/v8-htf-a18a790676bc.js","/assets/v8-ui-4904812cfc4b.css","/assets/v8-workflow-29d8299d3374.js","/vendor/LICENSE-jszip.txt","/vendor/LICENSE-supabase.txt","/vendor/jszip-3.10.1.min.js","/vendor/supabase-2.119.0.js"]);
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
