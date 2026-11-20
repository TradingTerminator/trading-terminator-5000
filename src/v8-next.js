/* V8.13 test workflow. Reuse the existing session, journal and chart entry points. */
const fieldErrors813=new WeakMap();
function clearField813(field){
 const error=fieldErrors813.get(field);
 if(!error)return;
 error.node.remove();
 field.removeAttribute('aria-invalid');
 if(error.description)field.setAttribute('aria-describedby',error.description);else field.removeAttribute('aria-describedby');
 fieldErrors813.delete(field);
}
function markField813(target,text){
 if(!target)return;
 if(target.id==='direction')target=target.closest('.direction-field').querySelector('.direction-choice');
 for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
 const field=target.matches('input:not([type=hidden]),select,textarea,button')?target:
  target.querySelector('[data-rated=false],input:not([type=hidden]):not([disabled]),select,textarea,button')||target;
 clearField813(field);
 const note=el811('small',text),description=field.getAttribute('aria-describedby');
 note.className='tt-field-error';note.id='tt-error-'+crypto.randomUUID();note.setAttribute('role','alert');
 (field.closest('.rating-row,label')||field).after(note);
 fieldErrors813.set(field,{node:note,description});
 field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',[description,note.id].filter(Boolean).join(' '));
 field.scrollIntoView({block:'center'});field.focus({preventScroll:true});
}
for(const event of ['input','change'])document.addEventListener(event,e=>clearField813(e.target));
entryFeedback=function(text,target){
 if(!target){$('entryFeedback').textContent=text;return;}
 $('entryFeedback').textContent='';
 const stage=target.closest('[data-entry-stage]');
 if(stage)showEntryStage(Number(stage.dataset.entryStage),false);
 markField813(target,text);
};
const preparationFocus813=v8FocusPreparation;
v8FocusPreparation=function(id){
 preparationFocus813(id);
 const issue=v8PreparationMissing().find(([,field])=>field===id)||v8StepMissing(V8Prep.step).find(([,field])=>field===id);
 if(issue)markField813($(id),issue[0]);
};

function chartPicker813(host,input,status,limit){
 host.classList.add('image-dropzone');
 host.setAttribute('role','group');
 host.setAttribute('aria-label','Screenshots auswählen, ablegen oder einfügen');
 host.tabIndex=0;
 input.multiple=limit>1;
 status.classList.add('image-pick-status');
 status.textContent='Bilder auswählen oder einfügen';
 const pasteTarget=el811('div');
 pasteTarget.contentEditable='true';pasteTarget.className='image-paste-field';
 pasteTarget.setAttribute('role','textbox');pasteTarget.setAttribute('aria-label','Screenshot hier einfügen');
 if(!host.querySelector('.image-paste-field'))host.prepend(pasteTarget);
}
chartPicker813(ltfImages811,file811,uploadState811,4);
chartPicker813($('htfDropzone'),$('htfFile'),$('htfDropzone').querySelector('.image-pick-status'),10);
const savedLtf813=el811('div');
savedLtf813.className='tt-saved-screenshots';
const saveLtf813=v8Button('Originale speichern',async()=>{
 await uploadLtf811(chosenImages(ltfImages811));
},'secondary');
saveLtf813.hidden=true;
ltfImages811.append(saveLtf813,savedLtf813);
file811.onchange=null;
function redrawLtf813(){
 const paths=[...V811.ltf.images];
 $('v811ImageAbsence').closest('label').hidden=!!paths.length;
 $('v811ImageAbsence').closest('label').classList.toggle('hidden',!!paths.length);
 if(paths.length)$('v811ImageAbsence').value='';
 savedLtf813.replaceChildren();
 for(const path of paths){
  const item=el811('div','Vorschau wird geladen …');
  savedLtf813.append(item);
  void signedChart(path).then(url=>{
   if(!item.isConnected)return;
   item.replaceChildren();
   makeChartPreview(item,path,url,async()=>{
    const previous=V811.ltf.images;
    V811.ltf.images=previous.filter(p=>p!==path);
    redrawLtf813();saveWorkspace();
   });
  }).catch(e=>{if(item.isConnected)item.textContent='Vorschau nicht geladen: '+e.message;});
 }
}
const chooseShared813=setChosenImages;
function drawPending813(zone){
 zone.querySelector('.pending-image-preview')?.remove();
 const files=chosenImages(zone);
 if(!files.length)return;
 const row=el811('div');row.className='pending-image-preview';
 for(const file of files){
  const wrap=el811('div'),img=el811('img'),url=URL.createObjectURL(file);
  img.alt=file.name;img.onload=img.onerror=()=>URL.revokeObjectURL(url);img.src=url;
  const remove=v8Button('Auswahl entfernen',()=>{
   URL.revokeObjectURL(url);
   zone.querySelector('input[type=file]').value='';
   const remaining=chosenImages(zone).filter(f=>f!==file);
   setChosenImages(zone,remaining);
  },'ghost');
  remove.setAttribute('aria-label',file.name+' entfernen');
  wrap.append(img,remove);row.append(wrap);
 }
 zone.append(row);
}
async function originalPath813(type,id,file,folder=''){
 safeImage(file);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
 const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
 return chartPath(type,id,folder+hash+'.'+ext[file.type]);
}
async function saveOriginal813(file,path){
 try{await uploadChart(file,path);}
 catch(e){if(!/already exists|duplicate/i.test(e.message))throw e;await signedChart(path);}
}

setChosenImages=function(zone,files,append=false){
 const unique=new Map((append?[...chosenImages(zone),...files]:files).map(f=>[[f.name,f.size,f.type,f.lastModified].join(':'),f]));
 chooseShared813(zone,[...unique.values()].slice(0,zone===ltfImages811?4:10),false);
 drawPending813(zone);
 if(zone===ltfImages811)saveLtf813.hidden=!chosenImages(zone).length;
};
uploadLtf811=async function(files){
 if(V811.uploading||!files.length)return;
 const before=new Set(V811.ltf.images);
 const owner=currentUser?.id,session=currentSession?.id;
 if(before.size+files.length>4){uploadState811.textContent='Insgesamt höchstens vier LTF-Bilder.';return;}
 // Keep a stable key per original on retry. A confirmed object can be reused after a lost response.
 entryRequestId=entryRequestId||crypto.randomUUID();
 let failed=0;V811.uploading=true;saveLtf813.disabled=true;saveWorkspace();
 try{
  for(const file of files){
   if(owner!==currentUser?.id||session!==currentSession?.id)return;
   try{
    const path=await originalPath813('entry',entryRequestId,file);
    if(owner!==currentUser?.id||session!==currentSession?.id)return;
    if(!V811.ltf.images.includes(path)){
     await saveOriginal813(file,path);
     if(owner!==currentUser?.id||session!==currentSession?.id)return;
     V811.ltf.images.push(path);saveWorkspace();
    }
    pendingImages.set(ltfImages811,chosenImages(ltfImages811).filter(f=>f!==file));
   }catch(_){failed++;}
  }
  file811.value='';const remaining=chosenImages(ltfImages811);
  setChosenImages(ltfImages811,remaining);
  uploadState811.textContent=V811.ltf.images.length+' Originale gespeichert'+(failed?' · '+failed+' Uploads offen. Erneut speichern.':'');
  saveLtf813.hidden=!remaining.length;redrawLtf813();saveWorkspace();
 }finally{V811.uploading=false;saveLtf813.disabled=false;}
};
// Pickers share the same file/drop/clipboard handlers. An Exit or Management upload belongs to its trade.
function tradePicker813(pane,trade,kind){
 if(!pane)return;
 const host=el811('details'),zone=el811('div'),input=el811('input'),status=el811('span'),gallery=el811('div');
 host.className='tt-trade-screenshots';host.append(el811('summary','Screenshots'),zone,gallery);
 input.type='file';input.accept='image/png,image/jpeg,image/webp';input.setAttribute('aria-label','Screenshot auswählen');
 zone.append(input,status);
 chartPicker813(zone,input,status,10);
 const owner=currentUser?.id;
 async function refresh(){
  gallery.replaceChildren();
  try{
   const prefix=chartPath('trade',trade.id,kind);
   const {data,error}=await client.storage.from(CHART_BUCKET).list(prefix,{limit:100});
   if(error)throw error;
   for(const row of data||[]){
    if(!row.id)continue;
    const path=prefix+'/'+row.name,url=await signedChart(path);
    if(!host.isConnected||owner!==currentUser?.id)return;
    makeChartPreview(gallery,path,url,async()=>{
     const {error:removeError}=await client.storage.from(CHART_BUCKET).remove([path]);
     if(removeError)status.textContent='Entfernen nicht bestätigt: '+removeError.message;else await refresh();
    });
   }
  }catch(e){if(host.isConnected)status.textContent='Bilder nicht geladen: '+e.message;}
 }
 host.addEventListener('toggle',()=>{if(host.open)void refresh();});
 const save=v8Button('Originale speichern',async()=>{
  save.disabled=true;status.textContent='Speichert …';
  try{
   for(const file of chosenImages(zone)){
    if(owner!==currentUser?.id||!host.isConnected)return;
    const path=await originalPath813('trade',trade.id,file,kind+'/');
    if(owner!==currentUser?.id||!host.isConnected)return;
    await saveOriginal813(file,path);
    pendingImages.set(zone,chosenImages(zone).filter(f=>f!==file));
   }
   input.value='';setChosenImages(zone,[]);status.textContent='Originale gespeichert';await refresh();
  }catch(e){status.textContent='Upload nicht bestätigt: '+e.message;}
  finally{save.disabled=false;}
 },'secondary');
 zone.after(save);
 pane.append(host);
}

const ltfGroups813=[
 ['Marktposition und Zonen',['zone','zone_direction','vwap','vpoc']],
 ['Volumen und Orderflow',['volume','stopping','cvd','cvd_divergence','delta','delta_divergence','aggression','absorption']],
 ['Liquidität',['liquidity','liquidity_target']],
 ['Gesamteinschätzung',['assessment']]
];
const ltfChecks813=new Map();
for(const [heading,keys] of ltfGroups813){
 const section=el811('fieldset');section.append(el811('legend',heading));
 for(const key of keys){
  const [name,values]=TT811.fields[key];
  const field=$('v811Ltf_'+key)||select811('v811Ltf_'+key,name,values,grid811);
  const wrapper=field.closest('label'),group=el811('div'),label=el811('label'),checkbox=el811('input');
  field.replaceChildren(new Option('Beobachtung wählen',''),...Object.entries(values).map(([v,t])=>new Option(t,v)),new Option('Nicht relevant','not_relevant'));
  field.setAttribute('aria-label',name+' · Beobachtung');
  checkbox.type='checkbox';checkbox.id='v813LtfCheck_'+key;
  label.append(checkbox,el811('span',name));label.className='account-pick';
  wrapper.firstChild.textContent='';
  group.append(label,wrapper);section.append(group);ltfChecks813.set(key,{checkbox,wrapper,field});
 }
 grid811.append(section);
}
grid811.classList.add('tt-ltf-groups');
const ltfNote813=el811('textarea');ltfNote813.id='v813LtfNote';ltfNote813.rows=2;ltfNote813.maxLength=500;ltfNote813.placeholder='Notiz · optional';ltfNote813.setAttribute('aria-label','LTF-Notiz');
zone811.after(ltfNote813);
function ltfDefaults813(){
 if(!currentUser)return;
 try{
  const defaults=JSON.parse(localStorage.getItem('tt8_ltf_defaults_'+currentUser.id)||'{}');
  if(!$('v811Timeframe').value)$('v811Timeframe').value=defaults.timeframe||'';

 }catch(_){}
}
function syncLtf813(legacy=false){
 for(const {checkbox,wrapper,field} of ltfChecks813.values()){
  if(legacy&&field.value)checkbox.checked=true;
  wrapper.hidden=!checkbox.checked;
 }
 redrawLtf813();
}
ltf811.addEventListener('change',()=>syncLtf813());
ltfSnapshot811=function(){
 const status=$('v811LtfStatus').value||(V811.mode==='retrospective'?'not_reviewed':'');
 if(status==='not_reviewed'||!status)return {schema:813,status:'not_reviewed',values:{},images:[],timing:'pending',observed_at:null};
 const values={};
 if(status==='reviewed')for(const [key,{checkbox,field}] of ltfChecks813)if(checkbox.checked&&field.value)values[key]=field.value;
 return {schema:813,status,values,timeframe:$('v811Timeframe').value||null,
  zone:status==='reviewed'?$('v811Zone').value.trim()||null:null,note:ltfNote813.value.trim()||null,
  images:[...V811.ltf.images],image_absence:V811.ltf.images.length?null:$('v811ImageAbsence').value||null,
  observed_at:V811.ltf.observed_at||null,timing:V811.mode==='retrospective'?'retrospective':'before_documented_entry'};
};
function validEntryLtf813(){
 const snapshot=ltfSnapshot811();
 if(V811.uploading||chosenImages(ltfImages811).length){
  entryFeedback('Ausgewählte Originale speichern oder einzeln entfernen.',saveLtf813);return false;
 }
 if(snapshot.status==='reviewed')for(const {checkbox,field} of ltfChecks813.values())if(checkbox.checked&&!field.value){
  entryFeedback('Beobachtung oder „Nicht relevant“ wählen.',field);return false;
 }
 return TT811.validLtf(snapshot);
}
const renderStage813=showEntryStage;
showEntryStage=function(n,scroll=true){
 renderStage813(n,scroll);
 if(n===4&&V811.mode==='planned')$('entryStageTitle').textContent='Trade vorbereitet · Entry & Risiko';
 if(n===3){if(!$('v811LtfStatus').value)$('v811LtfStatus').value='not_reviewed';ltfDefaults813();syncLtf813();$('v811LtfStatus').onchange();}
 if(n===2)redrawReentry813();
 if(n===4)drawAccountDeviations813();
};
const ideaPanel813=$('ttIdeaPanel');
[...ideaPanel813.children].forEach(el=>el.hidden=true);
const ideaNotiz813=el811('textarea'),tp813=el811('input'),reentry813=el811('select');
ideaNotiz813.id='v813IdeaNote';ideaNotiz813.maxLength=500;ideaNotiz813.rows=2;
tp813.id='v813TargetTicks';tp813.type='number';tp813.min='1';tp813.max='999999';tp813.step=1;
reentry813.id='v813Reentry';
function label813(text,field){const label=el811('label',text);label.append(field);return label;}
ideaPanel813.append(label813('Notiz zur Idee · optional',ideaNotiz813),label813('Geplanter TP · Ticks · optional',tp813),label813('Re-Entry · optional',reentry813));
function redrawReentry813(){
 const selected=reentry813.value;
 reentry813.replaceChildren(new Option('Kein vorheriger Trade',''));
 for(const t of sessionTrades.filter(t=>t.exit_at&&t.setup_type===$('setup').value&&t.direction===$('direction').value))
  reentry813.append(new Option(tradeLabel(t)+' · '+v8DateTime(t.entry_at),t.id));
 if([...reentry813.options].some(o=>o.value===selected))reentry813.value=selected;
 reentry813.closest('label').hidden=reentry813.options.length===1;
}
$('setupCards').addEventListener('click',redrawReentry813);
$('direction').addEventListener('change',redrawReentry813);
document.addEventListener('click',e=>{
 if(!e.target.closest('.direction-choice'))return;
 for(const button of document.querySelectorAll('.direction-choice'))clearField813(button);
 redrawReentry813();saveWorkspace();
});
const retrospectiveAt813=el811('input');retrospectiveAt813.type='datetime-local';retrospectiveAt813.id='ttActualEntry';retrospectiveAt813.step='1';
const retrospectiveLabel813=label813('Tatsächlicher Entry · Deutschland · optional',retrospectiveAt813);
capture811.after(retrospectiveLabel813);
function actualTime813(field){
 if(!field.value)return null;
 const [day,clock]=field.value.split('T'),parsed=v8BerlinInstant(day,clock.slice(0,5));
 return parsed?new Date(Date.parse(parsed)+1000*Number(clock.slice(6,8)||0)).toISOString():null;
}
function showActualEntry813(){retrospectiveLabel813.hidden=V811.mode!=='retrospective';}
capture811.addEventListener('change',showActualEntry813);showActualEntry813();

for(const field of [ideaNotiz813,tp813,reentry813])field.addEventListener('input',saveWorkspace);
const openEntry813=v810OpenEntry;
v810OpenEntry=function(...args){
 const resume=V811.draftSession===currentSession?.id&&V811.mode;
 openEntry813(...args);showActualEntry813();
 if(!resume){
  for(const field of [ideaNotiz813,tp813,reentry813,ltfNote813,retrospectiveAt813])field.value='';
  for(const {checkbox} of ltfChecks813.values())checkbox.checked=false;
  setChosenImages(ltfImages811,[]);file811.value='';syncLtf813();
 }
};
const restore813=restoreWorkspace;
restoreWorkspace=function(item){
 restore813(item);
 if(!currentUser||item?.owner!==currentUser.id||item.session!==(currentSession?.id||null))return;
 const value=item.v813?.reentry||'';
 redrawReentry813();
 if([...reentry813.options].some(o=>o.value===value))reentry813.value=value;
 syncLtf813(!item.v813);showActualEntry813();
};
const sessionValidation813=sessionFeedback;
sessionFeedback=function(text){
 sessionValidation813(text);
 if(!text)return;
 const selected=[...$('sessionAccountList').querySelectorAll('.sess-check:checked')];
 if(!selected.length&&/Konto/.test(text))markField813($('sessionAccountList').querySelector('.sess-check'),text);
 else if(/Kontrakt|SL/.test(text))for(const item of selected){
  const row=item.closest('.account'),quantity=row.querySelector('.sess-qty'),sl=row.querySelector('.sess-sl');
  const invalid=quantity&&(+quantity.value<1||!Number.isSafeInteger(+quantity.value))?quantity:
   sl&&(+sl.value<1||+sl.value>100000||!Number.isSafeInteger(+sl.value))?sl:null;
  if(invalid){markField813(invalid,text);break;}
 }
};
workspaceWriters.push(item=>{item.v813={reentry:reentry813.value};});
const entryContext813=v811EntryContext;
v811EntryContext=function(){
 return {...entryContext813(),idea_note:ideaNotiz813.value.trim()||null,planned_tp_ticks:tp813.value?Number(tp813.value):null,reentry_trade_id:reentry813.value||null,actual_entry_at:V811.mode==='retrospective'?actualTime813(retrospectiveAt813):null};
};

const copySession813=el811('input');copySession813.id='v813SessionCopy';copySession813.type='checkbox';
const copyLabel813=label813('Konten gemeinsam handeln – Copy-Modus',copySession813);copyLabel813.className='account-pick';
copyLabel813.append(document.createTextNode(' · Ausgewählte Konten werden beim Entry gemeinsam vorgeschlagen.'));
$('sessionAccountList').after(copyLabel813);
copySession813.addEventListener('change',saveWorkspace);
const plan813=v8HtfPlan;
v8HtfPlan=function(){return {...plan813(),entry_copy_v813:copySession813.checked};};
const restorePlan813=v8RestoreHtf;
v8RestoreHtf=function(...args){restorePlan813(...args);copySession813.checked=currentSession?.htf_context?.selected_accounts?.[0]?.copy_mode??!!currentSession?.htf_context?.htf_v8?.plan?.entry_copy_v813;};
function drawAccountDeviations813(){
 const ids=currentSession?.htf_context?.selected_accounts||[];
 for(const row of $('allocationList').querySelectorAll('.account')){
  const check=row.querySelector('.acct-check');
  const account=allAccounts.find(a=>a.id===check.dataset.id),session=ids.find(a=>a.account_id===check.dataset.id);
  if(!account)continue;
  const actual={instrument:row.querySelector('.acct-instrument').value,quantity:Number(row.querySelector('.acct-qty').value),ticks:Number(row.querySelector('.acct-sl-ticks').value)};
  const standards={instrument:account.default_instrument,quantity:account.default_quantity,ticks:account.default_sl_ticks};
  const configured={instrument:session?.instrument,quantity:session?.planned_quantity,ticks:session?.initial_sl_ticks};
  const out=row.querySelector('.v811-standard');
  if(out){
   const labels={instrument:'Instrument',quantity:'Kontrakte',ticks:'SL'};
   const changes=[['Konto',standards],['Session',configured]].flatMap(([scope,values])=>TT811.changes(values,actual).map(x=>scope+' '+labels[x.field]+': '+x.expected+' → '+x.actual));
   out.textContent=check.checked?changes.join(' · '):'';out.hidden=!out.textContent;
  }
 }
}
$('allocationList').addEventListener('input',drawAccountDeviations813);
$('allocationList').addEventListener('change',drawAccountDeviations813);
const renderDecision813=renderDecision;
renderDecision=function(...args){renderDecision813(...args);drawAccountDeviations813();};
const sessionRender813=renderSession;
renderSession=function(...args){
 const prior=sessionScope812;
 sessionRender813(...args);
 if(prior!==sessionScope812){
  clearField813($('v811LtfStatus'));setChosenImages(ltfImages811,[]);file811.value='';syncLtf813();
 }
};

const feeCurrencies813=['USD','EUR','GBP','CHF','CAD','AUD'];
function feeFields813(parent,id){
 const group=el811('details');group.className='tt-fee-settings';group.append(el811('summary','Gebühren je Instrument'));
 for(const instrument of Object.keys(TT811.ticks)){
  const row=el811('fieldset');row.dataset.instrument=instrument;row.append(el811('legend',instrument));
  const amount=el811('input');amount.inputMode='decimal';amount.placeholder='Offen';amount.className='tt-fee-amount';
  const basis=el811('select');basis.className='tt-fee-basis';basis.append(new Option('Pro Seite','side'),new Option('Round-Turn','round_turn'));
  const currency=el811('select');currency.className='tt-fee-currency';for(const code of feeCurrencies813)currency.append(new Option(code,code));
  const since=el811('input');since.type='date';since.className='tt-fee-since';
  row.append(label813('Je Kontrakt',amount),label813('Basis',basis),label813('Währung',currency),label813('Gültig ab · optional',since));
  group.append(row);
 }
 group.id=id;parent.before(group);return group;
}
const addFees813=feeFields813($('addAccount'),'ttAccountFees'),editFees813=feeFields813($('saveAccountEdit'),'ttEditFees');
function fillFeeFields813(group,rates={}){
 for(const row of group.querySelectorAll('fieldset')){
  const rate=rates[row.dataset.instrument]||{};
  row.querySelector('.tt-fee-amount').value=rate.amount??'';
  row.querySelector('.tt-fee-basis').value=rate.basis||'side';
  row.querySelector('.tt-fee-currency').value=rate.currency||'USD';
  row.querySelector('.tt-fee-since').value=rate.valid_from||'';
 }
}
function feeSchedule813(group){
 const schedule={};
 for(const row of group.querySelectorAll('fieldset')){
  const field=row.querySelector('.tt-fee-amount'),raw=field.value.trim().replace(',','.');
  if(!raw)continue;
  if(!/^\d{1,6}(?:\.\d{1,6})?$/.test(raw)){
   markField813(field,'Gebühr ab 0 mit bis zu sechs Nachkommastellen eingeben.');return null;
  }
  schedule[row.dataset.instrument]={amount:Number(raw),basis:row.querySelector('.tt-fee-basis').value,
   currency:row.querySelector('.tt-fee-currency').value,valid_from:row.querySelector('.tt-fee-since').value||null};
 }
 return schedule;
}
$('accountList').addEventListener('click',e=>{
 const id=e.target.closest('.edit-account')?.dataset.id;
 if(id)fillFeeFields813(editFees813,allAccounts.find(a=>a.id===id)?.fee_schedule_v813||{});
});
SCALE_DEFS.exitCommitEmotion.push(
 ['satisfaction','Zufriedenheit','keine','sehr stark'],['calm','Gelassenheit','keine','sehr stark'],
 ['confidence','Selbstvertrauen','keines','sehr stark'],['euphoria','Euphorie','keine','sehr stark']
);
const logout813=$('logout').onclick;
$('logout').onclick=async function(...args){
 const owner=currentUser?.id;
 if(owner)for(const storage of [localStorage,sessionStorage])for(const key of Object.keys(storage))if(key.startsWith('tt8_draft_exit_completion_'+owner+':'))storage.removeItem(key);
 return logout813.apply(this,args);
};
const exitSnapshot813=snapshotExitDraft;
snapshotExitDraft=function(){
 const snapshot=exitSnapshot813(),field=$('ttExitAt');
 return snapshot&&{...snapshot,actual:field?.value||'',requestTime:field?.dataset.requestTime||null};
};
const exitRestore813=restoreExitDraft;
restoreExitDraft=function(draft){
 exitRestore813(draft);
 const field=$('ttExitAt');
 if(field&&draft){
  field.value=draft.actual||'';
  if(draft.requestTime)field.dataset.requestTime=draft.requestTime;
 }
};
function exitCapture813(editor,trade){
 const reason=editor.querySelector('.exit-reason');
 reason.closest('label').hidden=true;
 editor.querySelector('.v8-defer-results').closest('label').hidden=true;
 editor.querySelector('.v8-defer-results').onchange=()=>{};
 editor.querySelector('.exit-preview').hidden=true;
 editor.querySelector(':scope > p').hidden=true;
 for(const card of editor.querySelectorAll('.exit-account'))card.hidden=true;
 editor.querySelector('h3').textContent='Trade beendet';
 const field=el811('input');field.type='datetime-local';field.id='ttExitAt';field.step='1';
 field.oninput=()=>delete field.dataset.requestTime;
 const anytime=el811('details');anytime.append(el811('summary','Exit-Zeit ändern · Deutschland'),label813('Tatsächlicher Exit',field));
 const button=editor.querySelector('.close-trade-action');button.textContent='Trade beendet';
 button.classList.remove('close-trade-action');button.classList.add('tt-close-trade');
 button.before(anytime);
 button.onclick=async()=>{
  if(busy)return;
  const group=editor.querySelector('[data-emotion-group=exitCommitEmotion]');
  const missing=missingScales(group,'exitCommitEmotion');
  if(missing.length){markField813(group.querySelector('[data-scale="'+missing[0]+'"]'),'Empfindung beim Exit bewerten.');return;}
  if(field.value&&!field.dataset.requestTime){
   const [day,time]=field.value.split('T');
   const stamp=v8BerlinInstant(day,time.slice(0,5));
   const seconds=Number(time.slice(6,8)||0);
   if(!stamp){markField813(field,'Gültigen Exit-Zeitpunkt in deutscher Ortszeit eingeben.');return;}
   field.dataset.requestTime=new Date(Date.parse(stamp)+seconds*1000).toISOString();
  }
  const actual=field.dataset.requestTime||(field.dataset.requestTime=new Date().toISOString());
  if(Date.parse(actual)<Date.parse(trade.entry_at)||Date.parse(actual)>Date.now()){
   markField813(field,'Exit-Zeit muss zwischen Entry und jetzt liegen.');return;
  }
  draftSchedule();draftFlush();
  const owner=currentUser?.id,feedback=editor.querySelector('.exit-feedback');
  busy=true;button.disabled=true;
  try{
   const {data,error}=await client.rpc('close_trade_v813',{p_trade_id:trade.id,p_exit_at:actual,p_scales:readScales(group)});
   if(error)throw error;
   if(data?.trade_id!==trade.id||!data.exit_at)throw Error('Keine Speicherbestätigung.');
   if(owner!==currentUser?.id)return;
   draftMarkSaved(trade.id,'exit');draftDirty=false;clearTimeout(draftTimer);
   editor.remove();await loadSessionTrades();await openJournalTradeById(trade.id);
   selectTradePane('exit');
   message('Trade beendet · Nachdokumentation offen.');
  }catch(e){if(owner===currentUser?.id)feedback.textContent='Abschluss nicht bestätigt: '+e.message;}
  finally{busy=false;button.disabled=false;}
 };
}
function feeEstimate813(rate,quantity,sides){
 if(rate?.currency!=='USD'||rate.amount==null||!(quantity>0))return null;
 const count=sides??quantity*2;
 return Math.round((Number(rate.amount)*count/(rate.basis==='round_turn'?2:1)+Number.EPSILON)*100)/100;
}
function finishExit813(root,trade,allocations){
 const summary=root.querySelector('.exit-summary');
 if(!summary)return;
 const observations=trade.observations||{};
 const snapshot=observations.fee_snapshot_v813||{};
 const note=observations.exit_completion_v813?.note;
 if(!observations.results_pending_v808){
  if(note)summary.append(el811('p',note));
  const fees=observations.fee_result_v813;
  if(fees&&allocations.every(a=>fees[a.id]?.fee_usd!=null)){
   const costs=allocations.reduce((sum,a)=>sum+Number(fees[a.id].fee_usd),0),net=Number(trade.realized_pnl_usd)-costs;
   summary.append(el811('p','Netto '+usd(net)+' USD'+(trade.initial_risk_usd>0?' · Netto-R '+(net/trade.initial_risk_usd).toFixed(2):'')));
  }
  return;
 }
 const form=el811('div');form.className='tt-exit-completion';
 summary.querySelector('h3').textContent='Trade beendet · Dokumentation offen';
 for(const el of [...summary.children].slice(2))el.remove();
 const reasons={TP:'Take Profit',SL:'Stop-Loss',BE:'Break-even',manual:'Manuell',extended_tp:'Erweitertes TP',daily_target:'Tagesziel',other:'Sonstiges'};
 const reason=select811('ttExitReason','Exit-Grund',reasons,form);
 if(!observations.exit_capture_v813?.reason_pending)reason.value=trade.exit_reason||'';
 const planned=observations.entry_context_v736?.planned_tp_ticks;
 const actualTp=el811('input'),tpReason=el811('input'),noteField=el811('textarea');
 actualTp.type='number';actualTp.min='1';actualTp.max='999999';actualTp.step=1;
 actualTp.name='actual-tp';tpReason.name='tp-reason';tpReason.maxLength=500;noteField.name='exit-note';noteField.rows=2;noteField.maxLength=1000;
 const changeTp=el811('details');changeTp.append(el811('summary',planned?'Geplanter TP '+planned+' Ticks · Abweichung dokumentieren':'Tatsächlicher TP · optional'),label813('Tatsächlicher TP · Ticks',actualTp),label813('Grund der TP-Abweichung',tpReason));
 const readDraft=()=>{
  try{const s=ttRemember?localStorage:sessionStorage;return JSON.parse(s.getItem('tt8_draft_exit_completion_'+currentUser.id+':'+trade.id)||'{}');}catch(_){return {};}
 };
 const owner=currentUser?.id,initial=readDraft(),fields=new Map([['reason',reason],['actualTp',actualTp],['tpReason',tpReason],['note',noteField]]);
 form.append(changeTp,label813('Notiz · optional',noteField));
 const rows=[];
 for(const a of allocations){
  const card=el811('fieldset'),name=allAccounts.find(x=>x.id===a.account_id)?.account_name||a.instrument;
  card.append(el811('legend',name+' · '+a.instrument+' × '+a.planned_quantity));
  const pnl=el811('input'),fee=el811('input'),sides=el811('input'),totals=el811('p');
  pnl.inputMode='decimal';fee.inputMode='decimal';sides.type='number';sides.min='1';sides.step=1;
  card.append(label813('Brutto-P&L · USD',pnl),label813('Gebühren korrigieren · USD',fee));
  const other=el811('details');other.append(el811('summary','Teilverkauf / Aufstockung'),label813('Tatsächliche Kontraktseiten',sides));card.append(other,totals);form.append(card);
  for(const [key,input] of Object.entries({pnl,fee,sides}))fields.set(a.id+':'+key,input);
  rows.push({a,pnl,fee,sides,totals,rate:snapshot[a.id]});
 }
 for(const [key,field] of fields)if(typeof initial[key]==='string')field.value=initial[key];
 const overall=el811('p');overall.setAttribute('role','status');form.append(overall);
 function values(row){
  const count=row.sides.value===''?null:Number(row.sides.value);
  const valid=count===null||Number.isSafeInteger(count)&&count>=1&&count<=99999999;
  const estimated=valid?feeEstimate813(row.rate,Number(row.a.planned_quantity),count):null;
  const manual=row.fee.value.trim()===''?null:parseMoney(row.fee.value);
  const fee=row.fee.value.trim()===''?estimated:manual;
  return {count,valid,estimated,manual,fee,pnl:parseMoney(row.pnl.value)};
 }
 function refresh(){
  let gross=0,net=0,risk=0,complete=rows.length>0,riskKnown=complete;
  for(const row of rows){
   const result=values(row),r=Number(row.a.initial_risk_usd);
   row.fee.placeholder=result.estimated===null?'USD-Gebühr offen':usd(result.estimated)+' automatisch';
   const known=result.pnl!==null&&result.fee!==null&&result.fee>=0;
   row.totals.textContent=known?'Netto '+usd(result.pnl-result.fee)+' USD'+(r>0?' · Netto-R '+((result.pnl-result.fee)/r).toFixed(2):''):
    row.rate?.currency&&row.rate.currency!=='USD'?'Tarif in '+row.rate.currency+' · abgerechneten USD-Betrag erfassen.':'Netto offen';
   if(r>0)risk+=r;else riskKnown=false;
   if(known){gross+=result.pnl;net+=result.pnl-result.fee;}else complete=false;
  }
  overall.textContent=complete?'Gesamt brutto '+usd(gross)+' USD · netto '+usd(net)+' USD'+(riskKnown?' · Brutto-R '+(gross/risk).toFixed(2)+' · Netto-R '+(net/risk).toFixed(2):''):'Gesamtergebnis offen';
 }
 form.addEventListener('input',()=>{
  refresh();
  if(owner!==currentUser?.id)return;
  try{(ttRemember?localStorage:sessionStorage).setItem('tt8_draft_exit_completion_'+owner+':'+trade.id,JSON.stringify(Object.fromEntries([...fields].map(([key,field])=>[key,field.value]))));}catch(_){}
 });
 const feedback=el811('p');feedback.setAttribute('role','status');
 const save=v8Button('Nachdokumentation abschließen',async()=>{
  if(!reason.value){markField813(reason,'Exit-Grund wählen.');return;}
  const tp=actualTp.value?Number(actualTp.value):null;
  if(tp!==null&&(!Number.isSafeInteger(tp)||tp<1||tp>999999)){markField813(actualTp,'TP in ganzen positiven Ticks eingeben.');return;}
  if(planned&&(reason.value==='extended_tp'||tp!==null&&tp!==planned)&&!tpReason.value.trim()){
   markField813(tpReason,'Technischen oder emotionalen Grund für die TP-Abweichung ergänzen.');return;
  }
  const results=[];
  for(const row of rows){
   const value=values(row);
   if(!value.valid){markField813(row.sides,'Gültige ganze Kontraktseiten erfassen.');return;}
   if(value.pnl===null){markField813(row.pnl,'Gültigen realisierten Brutto-P&L eingeben.');return;}
   if(value.fee===null||value.fee<0){markField813(row.fee,'Abgerechnete USD-Gebühr angeben.');return;}
   results.push({allocation_id:row.a.id,realized_pnl_usd:value.pnl,manual_fee_usd:value.manual,contract_sides:value.count});
  }
  save.disabled=true;
  try{
   const {data,error}=await client.rpc('complete_trade_v813',{p_trade_id:trade.id,p_reason:reason.value,p_exit_tp:tp,p_tp_reason:tpReason.value.trim()||null,p_note:noteField.value.trim()||null,p_results:results});
   if(error)throw error;
   if(data?.trade_id!==trade.id)throw Error('Keine Speicherbestätigung.');
   if(owner!==currentUser?.id||!form.isConnected)return;
   for(const s of [sessionStorage,localStorage])s.removeItem('tt8_draft_exit_completion_'+owner+':'+trade.id);
   await loadSessionTrades();await openJournalTradeById(trade.id);selectTradePane('review');void v8PollSessionLimits();
  }catch(e){feedback.textContent='Nachdokumentation nicht bestätigt: '+e.message;}
  finally{save.disabled=false;}
 },'secondary');
 form.append(save,feedback);summary.append(form);refresh();
}
const mount813=mountTradePanes;
mountTradePanes=function(trade,names,allocations){
 mount813(trade,names,allocations);
 const root=$('tradeDetails'),editor=root.querySelector('.exit-editor'),stop=root.querySelector('[data-trade-pane=stop]'),exit=root.querySelector('[data-trade-pane=exit]');
 if(editor)exitCapture813(editor,trade);
 else finishExit813(root,trade,allocations||[]);
 tradePicker813(stop,trade,'management');
 tradePicker813(exit,trade,'exit');
 const reviewZone=root.querySelector('.review-editor .image-dropzone');
 if(reviewZone)chartPicker813(reviewZone,reviewZone.querySelector('input[type=file]'),reviewZone.querySelector('.image-pick-status'),10);
 const identity=root.querySelector('.trade-identity');
 if(trade.exit_at&&identity)identity.querySelector('h3').after(el811('p',trade.observations?.results_pending_v808?'Trade beendet · Dokumentation offen':reviewIsComplete(trade)?'Dokumentation vollständig · Review abgeschlossen':'Dokumentation vollständig · Review offen'));

};

const analytics813=renderAnalytics;
renderAnalytics=function(...args){
 analytics813(...args);
 $('ttExitLearning')?.remove();$('ttLtfPatterns')?.remove();
 const section=el811('details');section.id='ttExitLearning';section.className='card';
 section.append(el811('summary','Exit-Emotionen und Ausführung'));
 const rows=filtered9().filter(t=>t.exit_at);
 const stopsByTrade=new Set(),nextByTrade=new Map();
 const bySession=new Map();
 for(const t of [...T9.rows].sort((a,b)=>Date.parse(a.entry_at)-Date.parse(b.entry_at))){
  if(!bySession.has(t.session_id))bySession.set(t.session_id,[]);
  bySession.get(t.session_id).push(t);
 }
 for(const t of rows){
  const next=bySession.get(t.session_id)?.find(n=>Date.parse(n.entry_at)>Date.parse(t.exit_at));
  if(next)nextByTrade.set(t.id,next);
 }
 for(const [key,label] of SCALE_DEFS.exitCommitEmotion){
  const assessed=rows.filter(t=>Number.isInteger(M9.scales(t,'exit')[key]));
  if(!assessed.length)continue;
  const comparable={stress:'pressure',fear:'fear',greed:'greed'}[key];
  const paired=assessed.filter(t=>comparable&&Number.isInteger(M9.scales(t,'entry')[comparable]));
  const delta=paired.length?paired.reduce((n,t)=>n+M9.scales(t,'exit')[key]-M9.scales(t,'entry')[comparable],0)/paired.length:null;
  const details=el811('details');
  details.append(el811('summary',label+' · '+assessed.length+'/'+rows.length+' bewertet'+(delta===null?'':' · Ø Veränderung '+delta.toFixed(1)+' (n='+paired.length+')')));
  for(const [level,cases] of Object.entries(M9.emotion(assessed,key,'exit'))){
   if(!cases.length)continue;
   const reviewed=cases.filter(t=>t.observations?.compliance_reviewed);
   const compliant=reviewed.filter(t=>!t.rule_deviation).length;
   const adjusted=cases.filter(t=>t.observations?.exit_completion_v813?.tp_reason).length;
   const labels={high:'7–10',middle:'4–6',low:'1–3'};
   const later=cases.map(t=>nextByTrade.get(t.id)).filter(t=>t?.observations?.compliance_reviewed);
   const button=v8Button('',()=>cases9(label+' · '+labels[level],cases),'secondary');
   const describe=known=>{button.textContent=labels[level]+' · n='+cases.length+' · '+compliant+'/'+reviewed.length+' regelkonform · '+adjusted+' TP-Abweichungen'+(known?' · '+cases.filter(t=>stopsByTrade.has(t.id)).length+' mit SL-Verschiebung':'')+(later.length?' · Folge-Trade '+later.filter(t=>t.rule_deviation).length+'/'+later.length+' Regelabweichungen':'');};
   describe(false);section.addEventListener('tt-stops-loaded',()=>describe(true),{once:true});
   details.append(button);
  }
  section.append(details);
 }
 if(rows.length){
  section.addEventListener('toggle',async()=>{
   if(!section.open||section.dataset.stops)return;
   section.dataset.stops='loading';
   try{
    for(let start=0;start<rows.length;start+=100){
     const ids=rows.slice(start,start+100).map(t=>t.id);
     const stops=await readAllRows('stop_adjustments','id,trade_id',q=>q.in('trade_id',ids).order('id'));
     for(const stop of stops)stopsByTrade.add(stop.trade_id);
    }
    if(section.isConnected){section.dataset.stops='loaded';section.dispatchEvent(new Event('tt-stops-loaded'));}
   }catch(e){
    delete section.dataset.stops;
    if(section.isConnected)section.append(el811('p','SL-Verlauf vorübergehend nicht verfügbar.'));
   }
  });
 }
 $('analyticsView').append(section);
 const patterns=new Map();
 for(const t of rows){
  const values=M9.context(t).ltf_v811?.values||{};
  const pairs=Object.entries(values).filter(([key,value])=>TT811.fields[key]&&Object.hasOwn(TT811.fields[key][1],value)).sort(([a],[b])=>a.localeCompare(b));
  if(pairs.length<2)continue;
  const key=t.setup_type+' · '+pairs.map(([field,value])=>TT811.fields[field][0]+' '+TT811.fields[field][1][value]).join(' / ');
  if(!patterns.has(key))patterns.set(key,[]);
  patterns.get(key).push(t);
 }
 if(patterns.size){
  const result=el811('details');result.className='card';result.append(el811('summary','Wiederkehrende LTF-Kombinationen je Setup'));
  const repeated=[...patterns].filter(([,cases])=>cases.length>=2).sort((a,b)=>b[1].length-a[1].length);
  if(repeated.length)for(const [label,cases] of repeated.slice(0,20)){
   const reviewed=cases.filter(reviewIsComplete),good=reviewed.filter(t=>['A','A+'].includes(t.execution_grade));
   result.append(v8Button(label+' · n='+cases.length+' · '+good.length+'/'+reviewed.length+' A/A+ · '+reviewed.filter(t=>t.rule_deviation).length+' Regelabweichungen',()=>cases9(label,cases),'secondary'));
  }else result.append(el811('p','Für wiederkehrende Kombinationen fehlen weitere vergleichbare Fälle.'));
  $('analyticsView').append(result);
  result.id='ttLtfPatterns';
 }
};

async function removeHtf813(path){
 const owner=currentUser?.id,id=currentSession?.id,expected=currentSession?.htf_context;
 if(!owner||!id||busy||!v8HtfPaths(expected).includes(path))return;
 busy=true;
 try{
  const ctx={...expected,htf_images_v8:v8HtfPaths(expected).filter(p=>p!==path)};
  if(ctx.htf_image_path===path)delete ctx.htf_image_path;
  const {data,error}=await client.from('trading_sessions').update({htf_context:ctx}).eq('id',id).filter('htf_context','eq',JSON.stringify(expected)).select('htf_context').single();
  if(error||!data?.htf_context)throw Error(error?.message||'Keine Speicherbestätigung');
  if(owner!==currentUser?.id||id!==currentSession?.id)return;
  currentSession.htf_context=data.htf_context;
  V8H.request=null;await renderHtfImage();v8UpdatePreparation();
  // Earlier assessments and entry snapshots can still reference this original.
 }catch(e){message('Screenshot nicht entfernt: '+e.message,true);}
 finally{busy=false;}
}

const additionalNews813=el811('div');
additionalNews813.id='ttAdditionalNews';
let manualEvents813=[];
const addEvent813=v8Button('Weiteren eigenen Termin hinzufügen',()=>{
 if(manualEvents813.length>=12)return;
 manualEvents813.push({id:'manual-'+crypto.randomUUID(),title:'',when:'',rule:'',from:'',to:''});
 renderManualEvents813();saveWorkspace();
},'ghost');
$('v8NewsDetails').append(addEvent813,additionalNews813);
function renderManualEvents813(){
 additionalNews813.replaceChildren();
 for(const event of manualEvents813){
  const row=el811('details');row.open=true;row.append(el811('summary',event.title||'Eigener Termin'));
  const title=el811('input');title.maxLength=200;title.id=event.id+'-title';
  const when=el811('input');when.type='datetime-local';when.id=event.id+'-when';
  const unknown=el811('input');unknown.type='checkbox';unknown.checked=!!event.unknown;when.disabled=unknown.checked;
  unknown.onchange=()=>{event.unknown=unknown.checked;when.disabled=event.unknown;if(event.unknown){event.when='';when.value='';}v8UpdatePreparation();saveWorkspace();};
  const rule=select811(event.id+'-rule','Handelsregel',{avoid:'Nicht handeln',wait:'Reaktion abwarten',observe:'Beobachten'},row);
  rule.options[0].text='Allgemeine Handelsregel';
  rule.closest('label').before(label813('Termin',title),label813('Uhrzeit · Deutschland',when),label813('Uhrzeit noch offen',unknown));
  const from=el811('input'),to=el811('input');from.type=to.type='datetime-local';from.id=event.id+'-from';to.id=event.id+'-to';
  row.append(label813('Warnfenster ab · Deutschland',from),label813('Warnfenster bis · Deutschland',to));
  for(const [key,field] of Object.entries({title,when,rule,from,to})){
   field.value=event[key]||'';
   field.addEventListener('input',()=>{
    event[key]=field.value;row.querySelector('summary').textContent=event.title||'Eigener Termin';
    v8UpdatePreparation();saveWorkspace();
   });
  }
  row.append(v8Button('Termin entfernen',()=>{
   manualEvents813=manualEvents813.filter(x=>x!==event);renderManualEvents813();v8UpdatePreparation();saveWorkspace();
  },'ghost'));
  additionalNews813.append(row);
 }
}
function selectedManual813(){
 if($('v8NewsState').value!=='yes')return [];
 const parse=value=>{if(!value)return null;const [day,time]=value.split('T');return v8BerlinInstant(day,time);};
 return manualEvents813.filter(x=>x.title.trim()).map(x=>({id:x.id,title:x.title.trim(),at:parse(x.when),rule:x.rule||$('v8NewsBehaviour').value,from:parse(x.from),to:parse(x.to)}));
}
const eventWindows813=newsWindows811;
newsWindows811=function(){return [...eventWindows813(),...selectedManual813()];};
const eventPlan813=v8HtfPlan;
v8HtfPlan=function(){
 const plan=eventPlan813(),manual=selectedManual813();
 return {...plan,manual_events_v813:$('v8NewsState').value==='yes'?manualEvents813.filter(e=>e.title.trim()):[],
  news:[plan.news,...manual.map(e=>e.title+(e.at?' · '+v8DateTime(e.at):''))].filter(Boolean).join(' | ').slice(0,1500)};
};
const eventMissing813=v8PreparationMissing;
v8PreparationMissing=function(){
 const prior=eventMissing813();
 if($('v8NewsState').value!=='yes')return prior;
 const manual=selectedManual813(),issues=prior.filter(([text,id])=>!(
  manual.length&&!$('v8HtfNews').value.trim()&&id==='v8NewsTime'||
  manual.some(e=>id==='v813Window_'+e.id+'_from')
 ));
 for(const event of manualEvents813){
  if(!event.title.trim()){issues.push(['Terminbezeichnung eingeben oder Zeile entfernen',event.id+'-title']);continue;}
  if(!event.when&&!event.unknown)issues.push(['Uhrzeit für '+event.title+' ergänzen',event.id+'-when']);
 }
 for(const event of manual)if(event.rule==='avoid'&&(!event.from||!event.to||Date.parse(event.to)<=Date.parse(event.from)))
  issues.push(['Gültiges Warnfenster für '+event.title+' angeben',event.id+'-from']);
 return issues;
};
workspaceWriters.push(item=>{item.v813.manualEvents=manualEvents813;});
const eventRestore813=restoreWorkspace;
restoreWorkspace=function(item){
 eventRestore813(item);
 if(item?.owner===currentUser?.id&&item.session===(currentSession?.id||null)&&Array.isArray(item.v813?.manualEvents)){
  manualEvents813=item.v813.manualEvents;renderManualEvents813();v8UpdatePreparation();
 }
};
const eventHtfRestore813=v8RestoreHtf;
v8RestoreHtf=function(...args){
 eventHtfRestore813(...args);
 manualEvents813=(currentSession?.htf_context?.htf_v8?.plan?.manual_events_v813||[]).map(e=>({...e}));renderManualEvents813();
};
const eventReset813=clearSession811;
clearSession811=function(...args){eventReset813(...args);manualEvents813=[];renderManualEvents813();};
