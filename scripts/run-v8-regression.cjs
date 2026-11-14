// Exercise shared business behavior against V8. V7-specific UI contracts are covered by V8's own workflow tests.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),target=path.join(root,'tests/_v8-regression.generated.cjs');
let source=fs.readFileSync(path.join(root,'tests/app.test.cjs'),'utf8').replaceAll('tt7_','tt8_').replace('/7.42/','/8.03/').replace(/\bSession\b/g,'Handelssession');
for(const title of ['navigation identifies the active main area when training or journal is open','setup and idea precede account risk and emotion in the actual entry DOM','V739 session management stays in journal and shortcut does not promise open trades','guided entry has three stages and cannot advance without identifying a setup and idea']){
 const marker="test('"+title+"'";if(!source.includes(marker))throw new Error('Review V8 regression mapping: '+title);source=source.replace(marker,"test.skip('"+title+"'");
}
try{fs.writeFileSync(target,source);const result=cp.spawnSync(process.execPath,['--test','--test-force-exit',target],{cwd:root,env:{...process.env,TT_TEST_PAGE:'v8.html'},stdio:'inherit',timeout:60000});if(result.error)throw result.error;process.exitCode=result.status??1;}finally{fs.rmSync(target,{force:true});}
