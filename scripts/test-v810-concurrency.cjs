/* Two independent PostgreSQL connections in an explicitly isolated CI database. */
'use strict';
const {execFileSync,spawn}=require('node:child_process'),assert=require('node:assert/strict');
if(process.env.TT810_ISOLATED_DATABASE!=='1')throw Error('This test may run only in the disposable V810 CI database');
const uid='81000000-0000-4000-8000-000000000001',aid='81000000-0000-4000-8000-000000000002',sid='81000000-0000-4000-8000-000000000003',request='81000000-0000-4000-8000-000000000004';
const psql=sql=>execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-At','-c',sql],{encoding:'utf8'}).trim();
const auth=`BEGIN;SELECT set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',true);SET LOCAL ROLE authenticated;`;
const selection=JSON.stringify({selected_accounts:[{account_id:aid,instrument:'MNQ',planned_quantity:1,initial_sl_ticks:40}]});
function parallel(sql){return Promise.all([1,2].map(()=>new Promise((resolve,reject)=>{const child=spawn('psql',['-X','-v','ON_ERROR_STOP=1','-At','-c',auth+sql+'COMMIT;']);let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('exit',code=>code===0?resolve(out):reject(Error(err)));})));}
(async()=>{
psql(`INSERT INTO auth.users(id) VALUES('${uid}');INSERT INTO public.trading_accounts(id,owner_id,account_name,account_type) VALUES('${aid}','${uid}','V810 concurrent fixture','demo');`);
await parallel(`SELECT public.session_action_v810('${sid}','${request}','start','${selection}',NULL);`);
assert.equal(psql(`SELECT count(*) FROM public.trading_sessions WHERE owner_id='${uid}' AND status='open';`),'1');
const context=psql(`SELECT htf_context FROM public.trading_sessions WHERE id='${sid}';`);
const plan={schema_version:808,news:'Keine relevanten News',sentiment:'neutral',direction:'long',setup_state:'no',technical:['extremes','zones','options'].map(key=>({key,label:key,checked:true,assessment:'marked',note:''})),images:[],warning_acknowledgements:{},personal_plan:{duration_minutes:90,scope:'total',loss_limit:null,profit_goal:null}};
const payload=JSON.stringify({plan,context:{mental_check:{scales:{focus:8,pressure:1,fatigue:1,urge:1,fear:1,greed:1,revenge:1,frustration:1},conscious_continue:false}}});
await parallel(`SELECT public.session_action_v810('${sid}','${request}','confirm','${payload}','${context}');`);
assert.equal(psql(`SELECT count(*) FROM public.v8_htf_assessments WHERE session_id='${sid}';`),'1');
const anchor=psql(`SELECT htf_context#>>'{htf_v8,plan,personal_plan,started_at}' FROM public.trading_sessions WHERE id='${sid}';`);
await parallel(`SELECT public.session_action_v810('${sid}','${request}','close','{}',NULL);`);
assert.equal(psql(`SELECT count(*) FROM public.session_events_v810 WHERE session_id='${sid}' AND kind='closed';`),'1');
assert.equal(psql(`SELECT htf_context#>>'{htf_v8,plan,personal_plan,started_at}' FROM public.trading_sessions WHERE id='${sid}';`),anchor);
assert.equal(psql(`SELECT status FROM public.trading_sessions WHERE id='${sid}';`),'closed');
console.log('PASS T15: two independent PostgreSQL connections; one session, one confirmation, immutable time anchor, one closure');
})().catch(e=>{console.error(e.message);process.exit(1)});
