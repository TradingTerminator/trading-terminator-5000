/* V8.12: session boundaries and footer geometry share one source of truth. */
let sessionScope812=null;
const renderSession812=renderSession;
renderSession=function(...args){
 const scope=JSON.stringify([currentUser?.id||null,currentSession?.id||null]);
 if(scope!==sessionScope812){
  clearSession811();
  V811.mode=null;V811.draftSession=null;V811.ltf={images:[]};V811.newsAcks.clear();entryRequestId=null;
  for(const r of document.querySelectorAll('#v811CaptureMode input'))r.checked=false;
  sessionScope812=scope;
 }
 renderSession812(...args);
 v8UpdatePreparation();
};
const saveWorkspace812=saveWorkspace;
saveWorkspace=function(){
 if(!currentUser||workspaceRestoring||$('app').classList.contains('hidden'))return;saveWorkspace812();
 try{const storage=ttRemember?localStorage:sessionStorage,item=JSON.parse(storage.getItem(workspaceKey())||'null');
  if(item?.owner===currentUser.id&&item.session===(currentSession?.id||null)){
   item.preparation_v812={owner:currentUser.id,session:currentSession?.id||null};storage.setItem(workspaceKey(),JSON.stringify(item));
  }
 }catch(_){/* The existing draft-save failure handling remains authoritative. */}
};
const restoreWorkspace812=restoreWorkspace;
restoreWorkspace=function(item){
 if(!currentUser||item?.owner!==currentUser.id||item.session!==(currentSession?.id||null))return;
 // Older unbound drafts have no session provenance. Existing identified sessions remain compatible.
 if(!currentSession&&!item.preparation_v812)return;
 if(item.preparation_v812&&(item.preparation_v812.owner!==currentUser.id||item.preparation_v812.session!==(currentSession?.id||null)))return;
 restoreWorkspace812(item);v8UpdatePreparation();
};
const privateReset812=resetPrivateState;
resetPrivateState=function(...args){privateReset812(...args);sessionScope812=null;V8Prep.overviewReview=null;};

// Reserve the measured footer height, including wrap, zoom, text preferences and safe area.
function measureFooter812(){
 const height=v8BackBar.hidden||getComputedStyle(v8BackBar).display==='none'?0:Math.ceil(v8BackBar.offsetHeight);
 const value=height+'px';if(document.documentElement.style.getPropertyValue('--tt-footer-height')!==value)document.documentElement.style.setProperty('--tt-footer-height',value);
}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(measureFooter812).observe(v8BackBar);
new MutationObserver(measureFooter812).observe(v8BackBar,{attributes:true,childList:true,subtree:true,characterData:true});
window.addEventListener('resize',measureFooter812);window.visualViewport?.addEventListener('resize',measureFooter812);
document.fonts?.ready.then(measureFooter812);measureFooter812();
v8UpdatePreparation();

function beginSession812(){
 if(currentSession)return;
 clearSession811();V810.startId=null;V810.confirmRequest=null;V811.draftSession=null;V811.mode=null;
 if(currentUser)purgeWorkspace(currentUser.id);
}
const startHome812=$('v8Next').onclick;$('v8Next').onclick=function(...args){if(!currentSession)beginSession812();return startHome812?.apply(this,args);};
const startLocal812=$('startSession').onclick;$('startSession').onclick=function(...args){if(!currentSession)beginSession812();return startLocal812?.apply(this,args);};
