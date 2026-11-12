
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const status=byId('ttDataToolsStatus');
let running=false;
const tables=[
 'trading_sessions','trade_ideas','trades','stop_adjustments','trade_events',
 'screenshots','corrective_actions','trade_errors','trade_reviews','playbook_entries',
 'trading_accounts','account_groups','account_group_members','trade_account_allocations',
 'account_fills','account_trade_results','allocation_change_log','trading_setup_catalog',
 'training_countermeasures','training_goals_v7','trade_ideas_v733','trade_attempts_v733'
];
function inform(text,bad=false){status.textContent=text;status.style.color=bad?'#ffb4ad':'';}
function download(name,blob){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);
 try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
}
function csvCell(value){
 let s=value==null?'':typeof value==='object'?JSON.stringify(value):String(value);
 // CSV-Formelinjektion verhindern, auch wenn nach Leerzeichen oder Tabs eine Formel beginnt.
 if(typeof value==='string'&&/^[\s]*[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function fileStamp(){
 const d=new Date(),p=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).formatToParts(d);
 const v=k=>p.find(x=>x.type===k)?.value||'00';
 return `${v('year')}-${v('month')}-${v('day')}_${v('hour')}${v('minute')}`;
}
async function ensureUser(){
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user)throw new Error('Nicht angemeldet. Bitte erneut anmelden.');
 return data.user;
}
async function allRows(table){
 const size=500,limit=50000,all=[];
 for(let offset=0;offset<limit;offset+=size){
  const {data,error}=await client.from(table).select('*').order(table==='trade_reviews'?'trade_id':'id',{ascending:true}).range(offset,offset+size-1);
  if(error)throw new Error(`${table}: ${error.message}`);
  if(!Array.isArray(data))throw new Error(`${table}: ungültige Serverantwort`);
  all.push(...data);
  if(data.length<size)return all;
 }
 // Bei exakt 50.000 Zeilen muss zusätzlich geprüft werden, ob weitere existieren.
 const {data,error}=await client.from(table).select('id').range(limit,limit);
 if(error)throw new Error(`${table}: Vollständigkeit nicht prüfbar: ${error.message}`);
 if(data?.length)throw new Error(`${table}: mehr als ${limit} Datensätze. Kein unvollständiger Export erstellt.`);
 return all;
}
function collectLocalDrafts(ownerId){
 const prefix=`tt7_draft_v3:${ownerId}:`,latest=new Map();
 for(const storage of [localStorage,sessionStorage]){
  try{
   for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(!key?.startsWith(prefix))continue;
    try{
     const draft=JSON.parse(storage.getItem(key));
     if(draft?.version!==1||!draft.tradeId)continue;
     const old=latest.get(key);
     if(!old||(Number(draft.savedAt)||0)>(Number(old.savedAt)||0))latest.set(key,draft);
    }catch(_){}
   }
  }catch(_){}
 }
 return [...latest.values()];
}
async function run(label,callback){
 if(running)return;
 running=true;
 const buttons=[byId('ttBackupJson'),byId('ttExportCsv'),byId('ttServerHealth'),byId('ttVersionCheck')];
 buttons.forEach(b=>b.disabled=true);
 try{await callback()}
 catch(e){inform(`${label} fehlgeschlagen: ${e?.message||'Unbekannter Fehler'}. Es wurde nichts an Supabase geändert.`,true)}
 finally{running=false;buttons.forEach(b=>b.disabled=false)}
}
byId('ttVersionCheck')?.addEventListener('click',()=>run('Versionsprüfung',async()=>{
 if(location.protocol!=='https:'&&location.hostname!=='localhost')throw new Error('Nur auf der veröffentlichten HTTPS-Seite verfügbar');
 inform('Prüfe die veröffentlichte GitHub-Datei …');
 const response=await fetch(location.pathname+'?tt_version_check='+Date.now(),{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw new Error('HTTP '+response.status);
 const html=await response.text();
 const match=html.match(/Version\s+(7\.\d+)\s*·\s*Trading\s*&\s*Training/);
 if(!match)throw new Error('Versionsangabe in der veröffentlichten Datei nicht gefunden');
 inform(match[1]===TT_VERSION?'Veröffentlicht: '+TT_VERSION+' · gleicher Stand.':
  'GitHub liefert Version '+match[1]+'. Diese App-Datei ist Version 7.38. Vor einem Neuladen bitte Trade-Entwürfe speichern.');
}));
byId('ttBackupJson')?.addEventListener('click',()=>run('Datensicherung',async()=>{
 const user=await ensureUser();inform('Erstelle konsistenten Datenbank-Snapshot …');
 const {data:snapshot,error}=await client.rpc('export_journal_snapshot_v735');if(error)throw error;
 if(!snapshot||snapshot.owner_id!==user.id)throw new Error('Ungültiger Snapshot');
 const zip=new JSZip(),images=[];let total=0;
 for(const image of snapshot.images){
  inform('Sichere Bild '+(images.length+1)+'/'+snapshot.images.length+' …');
  const {data:blob,error:imageError}=await client.storage.from('trading-chart-screenshots').download(image.name);if(imageError)throw imageError;
  total+=blob.size;if(total>150*1024*1024)throw new Error('Bildsicherung über 150 MiB. Administrativen Export verwenden; es wird keine Teilsicherung erstellt');
  const bytes=await blob.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  const path='images/'+image.name;zip.file(path,bytes,{createFolders:false});images.push({path,storage_path:image.name,size:blob.size,sha256:hash});
 }
 const {data:verify,error:verifyError}=await client.rpc('export_journal_snapshot_v735');if(verifyError)throw verifyError;
 if(JSON.stringify(verify)!==JSON.stringify(snapshot))throw new Error('Daten wurden während der Sicherung geändert. Bitte erneut sichern');
 if((await ensureUser()).id!==user.id)throw new Error('Benutzer gewechselt');
 draftFlush();zip.file('journal.json',JSON.stringify({format:'trading-terminator-backup',format_version:2,app_version:TT_VERSION,created_at:new Date().toISOString(),...snapshot,images,local_drafts:collectLocalDrafts(user.id)},null,2));
 zip.file('README.txt','Persönliche Journal-Sicherung mit Bilddateien und SHA-256-Prüfsummen. Enthält keine Auth-Konten, Passwörter oder Serverkonfiguration. Wiederherstellung erfolgt administrativ in einer leeren Testumgebung. Dateien vertraulich aufbewahren.');
 const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
 if((await ensureUser()).id!==user.id)throw new Error('Benutzer während der Archiv-Erstellung gewechselt');
 download('trading-terminator-backup_'+fileStamp()+'.zip',blob);
 inform('Vollständige Journal-Sicherung vorbereitet: '+Object.keys(snapshot.tables).length+' Tabellen und '+images.length+' Bilder. Datei vertraulich aufbewahren.');
}));

byId('ttExportCsv')?.addEventListener('click',()=>run('CSV-Export',async()=>{
 const user=await ensureUser();inform('Lade sämtliche Trades …');
 const rows=await allRows('trades');
 if((await ensureUser()).id!==user.id)throw new Error('Benutzer während des Exports gewechselt');
 const columns=['id','session_id','setup_type','instrument','direction','entry_at','exit_at',
 'entry_emotion','exit_emotion','exit_reason','realized_pnl_usd','initial_risk_usd',
 'execution_grade','rule_deviation','deviation_reason'];
 const csv='\ufeff'+[columns.map(csvCell).join(';'),...rows.map(row=>columns.map(c=>csvCell(row[c])).join(';'))].join('\r\n');
 download(`trading-terminator-trades_${fileStamp()}.csv`,new Blob([csv],{type:'text/csv;charset=utf-8'}));
 inform(`CSV-Datei vorbereitet: ${rows.length} Trades. Kontoergebnisse und Bilder sind nicht Teil dieser Übersicht.`);
}));
byId('ttServerHealth')?.addEventListener('click',()=>run('Live-Systemprüfung',async()=>{
 const user=await ensureUser(),counts={};
 for(const name of ['trading_sessions','trades','trading_accounts','trade_account_allocations','account_trade_results']){
  inform(`Prüfe ${name} …`);
  const {count,error}=await client.from(name).select('*',{count:'exact',head:true});
  if(error)throw new Error(`${name}: ${error.message}`);
  counts[name]=count;
 }
 const {data:open,error}=await client.from('trading_sessions').select('id,session_date').eq('status','open').limit(10);
 if(error)throw error;
 const same=(await client.auth.getUser()).data?.user?.id===user.id;
 if(!same)throw new Error('Benutzer während der Prüfung gewechselt');
 inform('Supabase erreichbar · '+Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join(' · ')+
  ` · Offene Sessions: ${open.length}${open.length>1?' (Achtung: mehr als eine!)':''}. Read-only; kein Beweis für vollständige RLS-Sicherheit.`);
}));
})();
