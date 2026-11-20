// Local single-file preview. All data and screenshots are synthetic or session-local.
const fs=require('node:fs');
const path=require('node:path');
const demoClient=String.raw`
(() => {
 const owner='demo-owner';
 const accounts=[
  {id:'demo-nq',account_name:'NQ · Testkonto',account_type:'demo',default_instrument:'NQ',default_quantity:1,default_sl_ticks:40,active:true,fee_schedule_v813:{NQ:{amount:2,basis:'side',currency:'USD'}}},
  {id:'demo-mnq',account_name:'MNQ · Copy-Testkonto',account_type:'demo',default_instrument:'MNQ',default_quantity:3,default_sl_ticks:40,active:true,fee_schedule_v813:{MNQ:{amount:1.5,basis:'round_turn',currency:'USD'}}}
 ];
 const setups=[{id:'demo-setup',name:'Momentum',active:true,description:'Beispielsetup im lokalen Praxistest.',rules:{trigger:'Bestätigter Ausbruch'}}];
 const selected=accounts.map(a=>({account_id:a.id,instrument:a.default_instrument,planned_quantity:a.default_quantity,initial_sl_ticks:a.default_sl_ticks}));
 const session={id:'demo-session',status:'open',created_at:new Date().toISOString(),session_date:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin'}).format(new Date()),htf_context:{selected_accounts:selected,htf_v8:{id:'demo-review',plan:{entry_copy_v813:true,personal_plan:{scope:'total',end_at:new Date(Date.now()+3600000).toISOString()},news_windows:[]}}}};
 const trades=[],allocations=[],stops=[],results=[],images=new Map();
 const relations={trading_accounts:accounts,trading_setup_catalog:setups,trading_sessions:[session],trades,trade_account_allocations:allocations,stop_adjustments:stops,account_trade_results:results};
 const response=data=>({data,error:null});
 const client={
  auth:{getUser:async()=>response({user:{id:owner,email:'Praxistest · lokale Beispieldaten'}}),getSession:async()=>response({session:null}),signOut:async()=>response(null),onAuthStateChange:()=>({})},
  from(table){
   const base=relations[table]||[];const filters=[];let update=null,single=false,start=0,end=Infinity;
   const q={
    select(){return q;},order(){return q;},limit(n){end=n;return q;},range(low,high){start=low;end=high+1;return q;},
    eq(k,v){filters.push(r=>r[k]===v);return q;},is(k,v){filters.push(r=>(r[k]??null)===v);return q;},in(k,vs){filters.push(r=>vs.includes(r[k]));return q;},
    filter(k,_op,v){filters.push(r=>JSON.stringify(r[k])===v);return q;},not(){return q;},gte(){return q;},
    single(){single=true;return q;},maybeSingle(){single=true;return q;},update(v){update=v;return q;},
    insert(v){base.push({id:crypto.randomUUID(),active:true,...v});return q;},
    then(resolve,reject){const rows=base.filter(r=>filters.every(f=>f(r)));if(update)for(const r of rows)Object.assign(r,update);return Promise.resolve({data:single?rows[start]||null:rows.slice(start,end),count:rows.length,error:null}).then(resolve,reject);}
   };
   return q;
  },
  async rpc(name,args={}){
   if(name==='record_trade_attempt_v813'){
    const found=trades.find(t=>t.id===args.p_client_request_id);if(found)return response(found.id);
    const id=args.p_client_request_id,values={NQ:5,MNQ:.5,ES:12.5,MES:1.25};
    const rows=args.p_allocations.map(a=>({...a,id:crypto.randomUUID(),trade_id:id,initial_sl_points:a.initial_sl_ticks/4,initial_risk_usd:a.initial_sl_ticks*a.planned_quantity*values[a.instrument]}));
    allocations.push(...rows);
    const rates=Object.fromEntries(rows.map(a=>[a.id,accounts.find(c=>c.id===a.account_id)?.fee_schedule_v813?.[a.instrument]||null]));
    trades.unshift({id,session_id:session.id,session_trade_no:trades.length+1,entry_at:args.p_entry_context.actual_entry_at||new Date().toISOString(),exit_at:null,direction:args.p_direction,instrument:args.p_instrument,setup_type:args.p_setup_type,observations:{entry_context_v736:args.p_entry_context,fee_snapshot_v813:rates},initial_risk_usd:rows.reduce((sum,a)=>sum+a.initial_risk_usd,0)});
    return response(id);
   }
   const trade=trades.find(t=>t.id===args.p_trade_id);
   if(trade&&name==='close_trade_v813'){
    trade.exit_at=args.p_exit_at;trade.exit_reason='other';
    Object.assign(trade.observations,{exit_emotion_scales:args.p_scales,results_pending_v808:true,exit_capture_v813:{reason_pending:true}});
    return response({trade_id:trade.id,exit_at:trade.exit_at});
   }
   if(trade&&name==='complete_trade_v813'){
    for(const row of args.p_results){
     const a=allocations.find(a=>a.id===row.allocation_id),rate=trade.observations.fee_snapshot_v813[row.allocation_id];
     const fee=row.manual_fee_usd??feeEstimate813(rate,a.planned_quantity,row.contract_sides);
     results.push({...row,id:crypto.randomUUID(),result_status:'final',fees_usd:fee});
    }
    trade.exit_reason=args.p_reason;trade.realized_pnl_usd=args.p_results.reduce((sum,x)=>sum+x.realized_pnl_usd,0);
    Object.assign(trade.observations,{results_pending_v808:false,exit_completion_v813:{note:args.p_note},fee_result_v813:Object.fromEntries(results.map(r=>[r.allocation_id,{fee_usd:r.fees_usd}]))});
    return response({trade_id:trade.id,total_pnl_usd:trade.realized_pnl_usd});
   }
   if(name==='record_stop_batch_v811'){
    const rows=args.p_items.map(r=>({...r,id:crypto.randomUUID(),trade_id:allocations.find(a=>a.id===r.allocation_id)?.trade_id,changed_at:new Date().toISOString(),prior_stop_ticks:r.previous_ticks,new_stop_ticks:r.new_ticks}));
    stops.push(...rows);return response({saved:true,results:rows});
   }
   if(name==='session_action_v810'){
    if(args.p_action==='confirm')session.htf_context.htf_v8={id:'demo-review',plan:args.p_payload.plan};
    if(args.p_action==='close'){session.status='closed';session.closed_at=new Date().toISOString();}
    return response({session,open_trades:trades.filter(t=>!t.exit_at).length,missing:[],rule_breaches:0});
   }
   return response({count:trades.length});
  },
  storage:{from:()=>({
   upload:async(name,file)=>{if(!images.has(name))images.set(name,URL.createObjectURL(file));return response({path:name});},
   createSignedUrl:async(name)=>images.has(name)?response({signedUrl:images.get(name)}):{data:null,error:{message:'Bild ist in dieser Demo-Registerkarte nicht vorhanden'}},
   list:async(prefix)=>response([...images.keys()].filter(k=>k.startsWith(prefix+'/')).map(name=>({id:name,name:name.slice(prefix.length+1)}))),
   remove:async(names)=>{for(const name of names){if(images.has(name))URL.revokeObjectURL(images.get(name));images.delete(name);}return response([]);}
  })}
 };
 window.supabase={createClient:()=>client};
})();
`;
let html=fs.readFileSync('v8.html','utf8');
html=html.replace(/<meta http-equiv="Content-Security-Policy" [^>]+>/,`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src blob: data:; connect-src 'none'; base-uri 'none'; form-action 'none'">`);
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/,(_,file)=>'<style>'+fs.readFileSync(file,'utf8')+'</style>');
html=html.replace(/<script src="([^"]+)"[^>]*><\/script>/g,(_,file)=>{
 const code=file.startsWith('vendor/supabase-')?demoClient:fs.readFileSync(file,'utf8');
 return '<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>';
});
html=html.replace('</body>',`<script>
 const banner=document.createElement('p');banner.className='notice';banner.textContent='Praxistest mit Beispieldaten. Eingaben gelten nur in dieser Demo-Registerkarte.';
 document.querySelector('header').after(banner);
</script></body>`);
const target=path.resolve(process.argv[2]||'dist/TradingTerminator-V8.13-Praxistest.html');
fs.writeFileSync(target,html);
console.log('Lokale Demo erstellt.');
