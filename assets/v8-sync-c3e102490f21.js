// Draft revisions are scoped separately from confirmed sessions and recorded trades.
const draftStatus814=document.createElement('div');
draftStatus814.setAttribute('role','status');
draftStatus814.className='tt-sync-status';
$('settingsView').prepend(draftStatus814);
const syncLiveStatus=document.createElement('output');syncLiveStatus.className='tt-sync-indicator';
$('v8Navigation').after(syncLiveStatus);
new MutationObserver(()=>{const status=draftStatus814.textContent;syncLiveStatus.hidden=!status;syncLiveStatus.textContent=status.includes('Beide Geräte')?'Sync-Konflikt · Einstellungen öffnen':status;}).observe(draftStatus814,{subtree:true,childList:true,characterData:true});
let activeSync814=false;
let applyRemote814=false;
let delay814;
let preSession814=null;
let provisional814=null;
async function resolvePreSession814(){
 const owner=currentUser?.id;if(!owner||currentSession)return;
 const {data,error}=await client.from('trading_sessions').select('id,status').eq('owner_id',owner)
  .order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(error)throw error;
 if(currentUser?.id!==owner||currentSession)return;
 if(data?.status==='open'){await v810Sync();return;}
 const epoch=data?.id||'first';
 preSession814={owner,epoch};
 ttLocalStore.setItem('tt814-epoch:'+owner,epoch);
 provisional814=provisional814?.owner===owner?provisional814:JSON.parse(ttLocalStore.getItem('tt814-provisional:'+owner)||'null');
 if(provisional814?.owner===owner){
  const scope=draftScope814(),state=readQueue814(scope);
  state.next=provisional814;storeQueue814(scope,state);provisional814=null;ttLocalStore.removeItem('tt814-provisional:'+owner);
 }
}
function draftScope814(){
 if(!currentUser||$('app').classList.contains('hidden'))return null;
 const owner=currentUser.id;
 const epoch=preSession814?.owner===owner?preSession814.epoch:ttLocalStore.getItem('tt814-epoch:'+owner);
 if(!currentSession&&!epoch)return null;
 const documentKey=currentSession?'preparation:'+currentSession.id:'before-session:'+epoch;
 return {owner:currentUser.id,documentKey,key:'tt814:'+currentUser.id+':'+documentKey};
}
function readQueue814(scope){
 return JSON.parse(ttLocalStore.getItem(scope.key)||'{"revision":0}');
}
function storeQueue814(scope,state){
 ttLocalStore.setItem(scope.key,JSON.stringify(state));
}
function captureChange814(){
 const scope=draftScope814();
 if(!currentUser||applyRemote814||workspaceRestoring)return;
 try{
  const item=saveWorkspace();
  if(!scope){if(item?.owner===currentUser.id){provisional814=item;ttLocalStore.setItem('tt814-provisional:'+currentUser.id,JSON.stringify(item));void syncDraft814();}return;}
  if(item?.owner!==scope.owner||item.session!==(currentSession?.id||null))return;
  const state=readQueue814(scope);
  state.next=item;
  storeQueue814(scope,state);
  draftStatus814.textContent='Entwurf wartet auf Synchronisation';
  clearTimeout(delay814);
  delay814=setTimeout(syncDraft814,650);
 }catch(e){draftStatus814.textContent='Entwurf lokal nicht gesichert: '+e.message;}
}
function applyDraft814(scope,doc){
 if(draftScope814()?.key!==scope.key||doc.owner!==scope.owner||doc.session!==(currentSession?.id||null))return;
 applyRemote814=true;
 try {
  restoreWorkspace({...doc,view:readWorkspace()?.view,scroll:window.scrollY});
  saveWorkspace();
 }finally{applyRemote814=false;}
}
async function syncDraft814(){
 if(activeSync814||document.hidden||busy||!currentUser)return;
 activeSync814=true;
 let scope;
 try{
  if(!currentSession)await resolvePreSession814();
  scope=draftScope814();
  if(!scope)return;
  let state=readQueue814(scope);
  if(!state.pending&&state.next){
   state.pending={id:crypto.randomUUID(),base:state.revision,payload:state.next};
   delete state.next;
   storeQueue814(scope,state);
  }
  if(state.pending){
   const attempt=state.pending;
   const {data,error}=await client.rpc('save_workspace_revision_v814',{p_document:scope.documentKey,p_base:attempt.base,p_request:attempt.id,p_payload:attempt.payload});
   if(draftScope814()?.key!==scope.key)return;
   if(error&&error.code!=='40001')throw error;
   state=readQueue814(scope);
   if(!error&&state.pending?.id===attempt.id){
    delete state.pending;state.revision=data;storeQueue814(scope,state);
   }
  }
  const {data,error}=await client.from('workspace_revisions_v814').select('revision,payload').eq('owner_id',scope.owner).eq('document_key',scope.documentKey).order('revision',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(draftScope814()?.key!==scope.key)return;
  state=readQueue814(scope);
  if(data&&data.revision>state.revision){
   if(state.next||state.pending){
    draftStatus814.textContent='Beide Geräte haben diesen Entwurf geändert. ';
    for(const [label,useLocal] of [['Eigene Fassung übernehmen',true],['Fassung vom anderen Gerät übernehmen',false]]){
     const button=document.createElement('button');button.type='button';button.textContent=label;
     button.onclick=()=>{
      if(draftScope814()?.key!==scope.key)return;
      const fresh=readQueue814(scope);
      if(fresh.revision!==state.revision)return;
      const mine=fresh.next||fresh.pending?.payload;
      if(mine)ttLocalStore.setItem(scope.key+':conflict:'+crypto.randomUUID(),JSON.stringify(mine));
      if(!useLocal)applyDraft814(scope,data.payload);
      storeQueue814(scope,useLocal?{revision:data.revision,next:mine}:{revision:data.revision});
      draftStatus814.replaceChildren();void syncDraft814();
     };
     draftStatus814.append(button);
    }
    return;
   }
   applyDraft814(scope,data.payload);state.revision=data.revision;storeQueue814(scope,state);
  }
  draftStatus814.textContent=state.next||state.pending?'Entwurf wartet auf Synchronisation':'';
 }catch(e){if(!scope||draftScope814()?.key===scope.key)draftStatus814.textContent='Synchronisation ausstehend: '+e.message;}
 finally{activeSync814=false;}
}
for(const event of ['input','change'])document.addEventListener(event,e=>{
 if(e.target.closest('#decisionView,#sessionHub'))captureChange814();
});
window.addEventListener('online',syncDraft814);
window.addEventListener('focus',syncDraft814);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncDraft814();});
setInterval(syncDraft814,8000);

// Appearance and chart defaults share a revision across a user's devices.
const personalControls814=['ttThemeSelect','ttLayoutSelect','ttCorners','ttText','ttMotion'];
const preferenceStatus814=document.createElement('p');
preferenceStatus814.setAttribute('role','status');$('settingsView').prepend(preferenceStatus814);
let preferenceWrite814=false;
let preferenceOwner814=null, preferenceRevision814=-1;
function preferenceKey814(owner){return 'tt814:preferences:'+owner;}
function applyPreferences814(values){
 if(activeGeneration&&values.emotionLabels){ttLocalStore.setItem('tt8_emotions_'+currentUser.id,JSON.stringify(values.emotionLabels));applyEmotionLabels();}
 for(const id of personalControls814){
  const field=$(id),v=values[id];if(!field||!Array.from(field.options).some(o=>o.value===v))continue;
  field.value=v;
  if(id==='ttThemeSelect'||id==='ttLayoutSelect')ttLocalStore.setItem(id==='ttThemeSelect'?'tt8_theme':'tt8_layout',v);
  else field.onchange?.();
 }
 ttAppearance();
 if(values.timeframe)ttLocalStore.setItem('tt8_ltf_defaults_'+currentUser.id,JSON.stringify({timeframe:values.timeframe}));
}
function rememberPreference814(id,value){
 if(!currentUser)return;
 const key=preferenceKey814(currentUser.id),state=JSON.parse(ttLocalStore.getItem(key)||'{"revision":0}');
 state.edits={...state.edits,[id]:value};ttLocalStore.setItem(key,JSON.stringify(state));
 void syncPreferences814();
}
async function syncPreferences814(){
 if(preferenceWrite814||!currentUser||document.hidden)return;
 preferenceWrite814=true;
 const owner=currentUser.id,key=preferenceKey814(owner);
 try{
  const get=()=>JSON.parse(ttLocalStore.getItem(key)||'{"revision":0}');
  let state=get();
  const {data,error}=await client.from('workspace_revisions_v814').select('revision,payload').eq('owner_id',owner).eq('document_key','preferences').order('revision',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;if(owner!==currentUser?.id)return;
  state=get();const remote=data?.payload||{},version=data?.revision||0;
  if(state.pending){
   const attempt=state.pending;
   const response=await client.rpc('save_workspace_revision_v814',{p_document:'preferences',p_base:attempt.base,p_request:attempt.id,p_payload:attempt.values});
   if(owner!==currentUser?.id)return;
   state=get();
   if(response.error?.code==='40001'){
    preferenceStatus814.textContent='Einstellungen wurden auf beiden Geräten geändert. ';
    for(const [name,mine] of [['Eigene Änderungen übernehmen',true],['Serverstand übernehmen',false]]){
     const button=document.createElement('button');button.type='button';button.textContent=name;
     button.onclick=()=>{if(owner!==currentUser?.id)return;const fresh=get();if(fresh.pending?.id!==attempt.id)return;
      fresh.edits=mine?{...attempt.edits,...fresh.edits}:fresh.edits;delete fresh.pending;fresh.revision=version;fresh.values=remote;
      ttLocalStore.setItem(key,JSON.stringify(fresh));preferenceStatus814.replaceChildren();void syncPreferences814();};
     preferenceStatus814.append(button);
    }return;
   }
   if(response.error)throw response.error;
   delete state.pending;state.values=attempt.values;state.revision=response.data;
  }else if(Object.keys(state.edits||{}).length){
   const edits=state.edits;
   state.pending={id:crypto.randomUUID(),base:state.revision,values:{...state.values,...edits},edits};delete state.edits;
  }else{
   state.revision=version;state.values=remote;
  }
  ttLocalStore.setItem(key,JSON.stringify(state));
  if(!state.pending&&!Object.keys(state.edits||{}).length&&(preferenceOwner814!==owner||preferenceRevision814!==state.revision)){applyPreferences814(state.values);preferenceRevision814=state.revision;}
  preferenceOwner814=owner;preferenceStatus814.textContent='';
  if(state.pending||Object.keys(state.edits||{}).length)setTimeout(syncPreferences814,0);
 }catch(e){if(owner===currentUser?.id)preferenceStatus814.textContent='Einstellungen noch nicht abgeglichen: '+e.message;}
 finally{preferenceWrite814=false;}
}
document.addEventListener('change',e=>{if(personalControls814.includes(e.target.id))rememberPreference814(e.target.id,e.target.value);});
window.addEventListener('online',syncPreferences814);
window.addEventListener('focus',syncPreferences814);
setInterval(syncPreferences814,15000);
