// Draft revisions are scoped separately from confirmed sessions and recorded trades.
const draftStatus814=document.createElement('div');
draftStatus814.setAttribute('role','status');
$('app').prepend(draftStatus814);
let activeSync814=false;
let applyRemote814=false;
let delay814;
function draftScope814(){
 if(!currentUser||$('app').classList.contains('hidden'))return null;
 if(!currentSession?.id)return null;
 const documentKey='preparation:'+currentSession.id;
 return {owner:currentUser.id,documentKey,key:'tt814:'+currentUser.id+':'+documentKey};
}
function readQueue814(scope){
 return JSON.parse(localStorage.getItem(scope.key)||'{"revision":0}');
}
function storeQueue814(scope,state){
 localStorage.setItem(scope.key,JSON.stringify(state));
}
function captureChange814(){
 const scope=draftScope814();
 if(!scope||applyRemote814||workspaceRestoring)return;
 try{
  saveWorkspace();
  const item=readWorkspace();
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
 const scope=draftScope814();
 if(!scope||activeSync814||document.hidden||busy)return;
 activeSync814=true;
 try{
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
      if(mine)localStorage.setItem(scope.key+':conflict:'+crypto.randomUUID(),JSON.stringify(mine));
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
 }catch(e){if(draftScope814()?.key===scope.key)draftStatus814.textContent='Synchronisation ausstehend: '+e.message;}
 finally{activeSync814=false;}
}
for(const event of ['input','change'])document.addEventListener(event,e=>{
 if(e.target.closest('#decisionView,#sessionHub'))captureChange814();
});
window.addEventListener('online',syncDraft814);
window.addEventListener('focus',syncDraft814);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncDraft814();});
setInterval(syncDraft814,8000);
