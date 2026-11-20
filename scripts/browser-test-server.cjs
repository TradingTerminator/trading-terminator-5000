// Serve built files directly to Chromium so tests work without a listening TCP port.
const fs=require('node:fs'),path=require('node:path');
async function routeBuild(context){
 const root=path.resolve('dist'),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
 await context.route('http://127.0.0.1:4173/**',async route=>{
  const relative=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/,'');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404});
  const contentType=types[path.extname(file)]||'application/octet-stream';
  const body=contentType==='text/html'?fs.readFileSync(file,'utf8').replace(/ integrity="[^"]+"/g,''):fs.readFileSync(file);
  await route.fulfill({body,contentType});
 });
}
function browserOptions(){
 return {executablePath:process.env.TT_CHROMIUM_PATH||undefined,headless:true,
  args:['--no-sandbox',...(process.env.TT_CHROMIUM_ISOLATED==='1'?['--no-zygote','--disable-dev-shm-usage','--disable-setuid-sandbox','--single-process','--disable-gpu']:[])]};
}
module.exports={routeBuild,browserOptions};
