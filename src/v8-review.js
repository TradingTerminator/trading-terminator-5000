// Keep the observation recorded at entry separate from a later assessment.
const ltfChoice814=el811('div');
ltfChoice814.className='tt-ltf-choices';
const ltfSelect814=$('v811LtfStatus');
ltfSelect814.closest('label').hidden=true;
ltfSelect814.closest('label').after(ltfChoice814);
for(const [value,title,description] of [
 ['not_reviewed','Analyse später','Direkt zum Entry. Analyse in der Nachbereitung ergänzen.'],
 ['reviewed','Analyse jetzt','Beobachtungen vor dem Entry dokumentieren.']
]){
 const button=v8Button(title,()=>{
  if(value==='not_reviewed'&&(V811.uploading||chosenImages(ltfImages811).length||V811.ltf.images.length)){
   entryFeedback('Vorhandene Screenshots gehören zur aktuellen Analyse.',ltfImages811);return;
  }
  ltfSelect814.value=value;ltfSelect814.dispatchEvent(new Event('change',{bubbles:true}));
  if(value==='not_reviewed')showEntryStage(4);
 },'secondary');
 button.dataset.choice=value;button.append(el811('small',description));ltfChoice814.append(button);
}
const selectLtf814=ltfSelect814.onchange;
ltfSelect814.onchange=()=>{
 selectLtf814();
 const now=ltfSelect814.value==='reviewed';
 for(const child of ltf811.children){
  if(child===ltfChoice814||child.tagName==='H3'||child.contains(ltfSelect814))continue;
  child.hidden=!now||(child.contains($('v811ImageAbsence'))&&V811.ltf.images.length>0);
 }
 for(const button of ltfChoice814.children)button.setAttribute('aria-pressed',String(button.dataset.choice===(now?'reviewed':'not_reviewed')));
};
const nextEntry814=$('entryStageNext').onclick;
$('entryStageNext').onclick=function(){
 const stage=entryStage;nextEntry814();
 if(stage===3&&entryStage===4&&ltfSelect814.value==='reviewed'&&$('v811Timeframe').value&&currentUser)
  try{localStorage.setItem('tt8_ltf_defaults_'+currentUser.id,JSON.stringify({timeframe:$('v811Timeframe').value}));rememberPreference814('timeframe',$('v811Timeframe').value);}catch(e){message(e.message,true);}
};
const mountLtf814=mountTradePanes;
mountTradePanes=function(trade,...args){
 mountLtf814(trade,...args);
 if(trade.observations?.entry_context_v736?.ltf_v811?.timing!=='pending')return;
 const root=$('tradeDetails'),panel=root.querySelector('[data-trade-pane="review"]');
 if(!panel)return;
 const receipt=trade.observations?.ltf_after_entry_v814;
 const form=el811('details');form.className='card';
 form.append(el811('summary',receipt?'LTF · '+(receipt.status==='unavailable'?'Daten nicht verfügbar':'nach dem Entry dokumentiert'):'Nachbereitung offen · LTF ergänzen'));
 panel.prepend(form);
 if(receipt){
  form.append(el811('p',v8DateTime(receipt.recorded_at)));
  for(const [k,v] of Object.entries(receipt.values||{}))if(TT811.fields[k])form.append(el811('p',TT811.fields[k][0]+' · '+(TT811.fields[k][1][v]||v)));
  return;
 }
 const fields=new Map();
 for(const [name,keys] of ltfGroups813){
  const section=el811('details');section.append(el811('summary',name));form.append(section);
  for(const k of keys){const [title,values]=TT811.fields[k];fields.set(k,select811('afterLtf_'+k,title,values,section));}
 }
 const feedback=el811('p');feedback.setAttribute('role','status');
 async function finish(status){
  const values=Object.fromEntries([...fields].filter(([,f])=>f.value).map(([k,f])=>[k,f.value]));
  if(status==='reviewed'&&!Object.keys(values).length){markField813(fields.values().next().value,'Mindestens eine Beobachtung wählen.');return;}
  const buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
  try{
   const {error}=await client.rpc('finish_ltf_v814',{p_trade:trade.id,p_status:status,p_values:status==='unavailable'?{}:values});
   if(error)throw error;
   if(form.isConnected){await openJournalTradeById(trade.id);selectTradePane('review');}
  }catch(e){feedback.textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);}
 }
 form.append(v8Button('Analyse speichern',()=>finish('reviewed')),v8Button('Daten nicht verfügbar',()=>finish('unavailable'),'secondary'),feedback);
};

// The last confirmed session supplies defaults on every device, even before HTF completion.
const leaderField814=el811('label','Quellkonto für Copy-Dokumentation'),leaderChoice814=el811('select');
leaderChoice814.id='sessionLeader814';leaderField814.append(leaderChoice814);copyLabel813.after(leaderField814);
function syncLeader814(preferred){
 const selected=getSessionSelection(),previous=preferred||leaderChoice814.value;
 leaderField814.hidden=!copySession813.checked||selected.length<2;
 leaderChoice814.replaceChildren(...selected.map(row=>new Option(allAccounts.find(a=>a.id===row.account_id)?.account_name||row.account_id,row.account_id)));
 if(selected.some(a=>a.account_id===previous))leaderChoice814.value=previous;
}
copySession813.addEventListener('change',()=>syncLeader814());
$('sessionAccountList').addEventListener('change',()=>syncLeader814());
const accountDefaults814=renderSessionAccounts;
let accountInput814=0;
$('sessionAccountList').addEventListener('input',()=>accountInput814++);
copySession813.addEventListener('change',()=>accountInput814++);
renderSessionAccounts=function(...args){
 accountDefaults814(...args);syncLeader814(currentSession?.htf_context?.selected_accounts?.find(a=>a.copy_leader)?.account_id);
 if(!currentUser||currentSession||workspaceRestoring||sessionDraftMode!=='start')return;
 const owner=currentUser.id,stamp=++accountInput814;
 const original=JSON.stringify(captureFields($('sessionAccountList')));
 void (async()=>{
  const {data,error}=await client.from('trading_sessions').select('id,htf_context').eq('owner_id',owner).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error||stamp!==accountInput814||owner!==currentUser?.id||currentSession||JSON.stringify(captureFields($('sessionAccountList')))!==original)return;
  const selected=data?.htf_context?.selected_accounts;
  if(!Array.isArray(selected)||!selected.length)return;
  for(const card of $('sessionAccountList').querySelectorAll('.account')){
   const check=card.querySelector('.sess-check');if(!check)continue;
   const row=selected.find(r=>r.account_id===check.dataset.id);check.checked=!!row;
   if(row){card.querySelector('.sess-qty').value=row.planned_quantity;card.querySelector('.sess-sl').value=row.initial_sl_ticks;card.querySelector('.sess-instrument').value=row.instrument;}
  }
  copySession813.checked=selected[0]?.copy_mode??data.htf_context.htf_v8?.plan?.entry_copy_v813??false;
  syncLeader814(selected.find(a=>a.copy_leader)?.account_id);updateSessionCheckStatus();
 })().catch(e=>sessionFeedback('Kontovorgaben konnten nicht geladen werden: '+e.message));
};
$('v8RememberStandards').closest('label').hidden=true;

// A single daily choice controls whether event details participate in validation.
$('v8NewsBehaviour').closest('label').hidden=true;
$('v8NewsBehaviourNote').closest('label').hidden=true;
const previousMissing814=v8PreparationMissing;
v8PreparationMissing=function(){
 const result=previousMissing814().filter(([,id])=>!['v8NewsBehaviour','v8NewsBehaviourNote'].includes(id));
 return Array.from(new Map(result.map(issue=>[issue[1],issue])).values());
};
const customEvent814=el811('details');customEvent814.append(el811('summary','+ Eigenen Termin hinzufügen'));
const newsFields814=$('v8NewsDetails');
newsFields814.prepend(customEvent814);
customEvent814.append($('v8HtfNews').closest('.v8-news-fields'),$('v8NewsTimeUnknown').closest('label'),addEvent813);
const resetNews814=v8SyncNews;
v8SyncNews=function(){resetNews814();if($('v8HtfNews').value.trim())customEvent814.open=true;};
const oldNewsState814=$('v8NewsState').onchange;
$('v8NewsState').onchange=function(...args){
 if(this.value==='no'){V8H.calendarSelected=[];v8RenderSelectedCalendar();v8DrawMacroCalendar();}
 oldNewsState814.apply(this,args);
};

// Three chapter views reuse the actual inputs and historical plan representation.
const chapters814=htfGroups.slice(0,3).map((group,i)=>({...group,label:['Makro','Sentiment','Technik'][i]}));
const chapterNav814=el811('nav');chapterNav814.className='tt-chapters';chapterNav814.setAttribute('aria-label','HTF-Kapitel');
chapters814[0].details.before(chapterNav814);
const confirmations814=new Set();
let chapter814=0;
const editedChapters814=new Set();
const scenario814=htfGroups[3].details;
chapters814[2].details.append(scenario814);
for(const [i,id] of ['v8MacroDirection','v8HtfSentiment','v8HtfDirection'].entries()){
 const chapter=chapters814[i],direction=$(id).closest('label');direction.classList.add('tt-chapter-direction');chapter.details.append(direction);
 chapter.summary.hidden=true;
 chapter.button=v8Button(chapter.label,()=>selectChapter814(i),'secondary');
 chapterNav814.append(chapter.button);
 chapter.details.addEventListener('input',()=>{confirmations814.delete(i);editedChapters814.add(i);paintChapters814();});
}
function selectChapter814(i){chapter814=i;paintChapters814();}
function paintChapters814(){
 for(const [i,c] of chapters814.entries()){
  c.details.hidden=i!==chapter814;c.details.open=i===chapter814;
  const touched=editedChapters814.has(i);
  c.button.textContent=c.label+' · '+(confirmations814.has(i)?'Abgeschlossen':touched?'In Bearbeitung':'Offen');
  c.button.setAttribute('aria-current',i===chapter814?'step':'false');
 }
}
const focusPrep814=v8FocusPreparation;
v8FocusPreparation=function(id){const i=chapters814.findIndex(c=>c.details.contains($(id)));if(i>=0)selectChapter814(i);focusPrep814(id);};
const controls814=v8SyncPrepControls;
v8SyncPrepControls=function(){
 controls814();if(V8.route!=='session'||V8Prep.step!==4)return;
 paintChapters814();
 if(chapter814<2){nextPrep.hidden=false;nextPrep.textContent='Weiter · '+chapters814[chapter814+1].label;$('saveHtf').hidden=true;$('saveHtf').classList.add('hidden');}
};
const nextPrep814=v8NextPrep;
v8NextPrep=function(){
 if(V8Prep.step!==4)return nextPrep814();
 const issues=v8PreparationMissing();
 const missing=issues.find(([,id])=>v8PrepStageFor(id)<4)||issues.find(([,id])=>chapters814[chapter814].details.contains($(id)));
 if(missing){v8FocusPreparation(missing[1]);return;}
 confirmations814.add(chapter814);captureChange814();
 if(chapter814<2){selectChapter814(chapter814+1);v8SyncPrepControls();return;}
 nextPrep814();
};
const saveChapter814=$('saveHtf').onclick;
$('saveHtf').onclick=function(...args){
 for(let i=0;i<2;i++)if(!confirmations814.has(i)){selectChapter814(i);v8SyncPrepControls();return;}
 const issue=v8PreparationMissing()[0];if(issue){confirmations814.delete(2);v8FocusPreparation(issue[1]);return;}
 confirmations814.add(2);return saveChapter814.apply(this,args);
};
let pauseDecision814=null;
const clearChapter814=clearSession811;
clearSession811=function(...args){clearChapter814(...args);pauseDecision814=null;confirmations814.clear();editedChapters814.clear();selectChapter814(0);};
const planChapter814=v8HtfPlan;
v8HtfPlan=function(){return {...planChapter814(),chapter_confirmations:[...confirmations814]};};
selectChapter814(0);

// Chapter acknowledgements and the active chapter belong to the same draft as the fields.
workspaceWriters.push(item=>{
 item.pauseDecision814=pauseDecision814;
 item.chapters814={active:chapter814,confirmed:[...confirmations814],edited:[...editedChapters814]};
});
const restoreReview814=restoreWorkspace;
restoreWorkspace=function(item){
 restoreReview814(item);
 if(item?.owner!==currentUser?.id||item.session!==(currentSession?.id||null))return;
 pauseDecision814=item.pauseDecision814||null;
 const state=item.chapters814;if(!state)return;
 confirmations814.clear();editedChapters814.clear();
 for(const i of state.confirmed||[])if(Number.isInteger(i)&&i>=0&&i<3)confirmations814.add(i);
 for(const i of state.edited||[])if(Number.isInteger(i)&&i>=0&&i<3)editedChapters814.add(i);
 selectChapter814([0,1,2].includes(state.active)?state.active:0);
};

// Optional observations add context without extending the six required entry ratings.
const extraScales814=[
 ['fatigue','Müdigkeit','wach','sehr müde'],['stress','Stress','entspannt','sehr gestresst'],
 ['frustration','Frust','kein Frust','starker Frust'],['uncertain','Unsicherheit','sicher','sehr unsicher'],
 ['calm','Ruhe','unruhig','sehr ruhig'],['clarity','Mentale Klarheit','unklar','sehr klar'],
 ['patience','Geduld','ungeduldig','sehr geduldig'],['confidence','Vertrauen in den Plan','gering','sehr hoch'],
 ['fomo','FOMO','kein Drang','sehr stark']
];
const required814=Object.fromEntries(['session','entryEmotion'].map(k=>[k,new Set(SCALE_DEFS[k].map(([id])=>id))]));
for(const phase of Object.keys(required814))SCALE_DEFS[phase].push(...extraScales814.filter(([id])=>!required814[phase].has(id)));
const missingScales814=missingScales;
missingScales=function(group,phase){return missingScales814(group,phase).filter(k=>!required814[phase]||required814[phase].has(k));};
const buildScales814=buildScaleGroup;
buildScaleGroup=function(group,phase,values){
 buildScales814(group,phase,values);if(!group||!required814[phase])return;
 const optional=el811('details');optional.append(el811('summary','Weitere Emotionen · optional'));
 for(const field of group.querySelectorAll('[data-scale]'))if(!required814[phase].has(field.dataset.scale))optional.append(field.closest('.rating-row'));
 group.append(optional);
};
buildScaleGroup($('sessionMoodOptions'),'session');buildScaleGroup($('entryEmotionOptions'),'entryEmotion');

const decidePause814=el811('dialog');
$('app').append(decidePause814);
function askPause814(items,phase,advance){
 if(!(items.some(x=>x.severe)||phase==='session'&&items.length>=3)||V811.mode==='retrospective'&&phase==='entry')return advance();
 decidePause814.replaceChildren(el811('h3','Trotz dieser Warnsignale fortfahren?'));
 for(const w of items)decidePause814.append(el811('p',w.title+' · '+w.value+'/10'));
 decidePause814.append(v8Button('Pause starten',()=>{decidePause814.close();v8ChoosePause();}),
  v8Button('Bewusst trotzdem fortfahren',()=>{
   decidePause814.close();pauseDecision814={phase,decision:'continue',at:new Date().toISOString(),values:Object.fromEntries(items.map(w=>[w.key,w.value]))};
   captureChange814();advance();
  },'secondary'));
 decidePause814.showModal();
}
const nextSessionMood814=v8GoPrepStep;
v8GoPrepStep=function(step){
 if(V8Prep.step===1&&step>1&&!v8StepMissing(1).length)return askPause814(v8MentalAdvice(readScales($('sessionMoodOptions'))).items,'session',()=>nextSessionMood814(step));
 return nextSessionMood814(step);
};
const nextMood814=$('entryStageNext').onclick;
$('entryStageNext').onclick=function(){
 if(entryStage===1&&V811.mode==='planned'&&!missingScales($('entryEmotionOptions'),'entryEmotion').length&&M9.warnings(readScales($('entryEmotionOptions'))).every(w=>T9.acks[w.key]===w.key+':'+w.value))return askPause814(M9.warnings(readScales($('entryEmotionOptions'))),'entry',nextMood814);
 nextMood814();
};
const endPause814=v8EndPause;
v8EndPause=function(){
 const start=V8P.started,end=Date.now(),phase=V8P.origin?.route==='decision'?'entry':'session',running=!!V8P.until;
 endPause814();
 if(running&&start){
  pauseDecision814={phase,decision:'paused',started_at:new Date(start).toISOString(),ended_at:new Date(end).toISOString(),duration_seconds:Math.max(0,Math.floor((end-start)/1000))};
  const group=phase==='entry'?$('entryEmotionOptions'):$('sessionMoodOptions');
  clearScales(group);if(phase==='entry'){T9.acks={};warn9();}else{V8Prep.acks={};V8H.ack='';v8UpdateMental();}
  captureChange814();message('Pause beendet. Bitte die aktuelle Verfassung neu bewerten.');
 }
};
$('v8PauseExit').onclick=v8EndPause;
const contextMood814=v811EntryContext;
v811EntryContext=function(){return {...contextMood814(),pause_decision:pauseDecision814?.phase==='entry'?pauseDecision814:null};};
const planMood814=v8HtfPlan;
v8HtfPlan=function(){return {...planMood814(),pause_decision:pauseDecision814?.phase==='session'?pauseDecision814:null};};
const beginEntryMood814=v810OpenEntry;
v810OpenEntry=function(...args){if(!V811.mode||V811.draftSession!==currentSession?.id)pauseDecision814=null;return beginEntryMood814(...args);};
const bookFilters814=el811('div');bookFilters814.className='tt-book-filters';
const bookDir814=select811('bookDir814','Richtung',{long:'Long',short:'Short'},bookFilters814);
const bookGrade814=select811('bookGrade814','Ausführung',{'A+':'A+',A:'A',B:'B',C:'C',open:'Review offen'},bookFilters814);
const bookError814=select811('bookError814','Fehler',REVIEW_LABELS,bookFilters814);
$('playbookLexicon').before(bookFilters814);
function filterCards814(){
 for(const card of $('playbookLexicon').querySelectorAll('.tt9-trade'))card.hidden=!!(
  bookDir814.value&&card.dataset.direction!==bookDir814.value||
  bookGrade814.value&&card.dataset.grade!==bookGrade814.value||
  bookError814.value&&!card.dataset.errors.split(' ').includes(bookError814.value));
}
bookFilters814.addEventListener('change',filterCards814);
$('playbookLexicon').addEventListener('toggle',()=>queueMicrotask(filterCards814),true);

// The scalping path validates the same setup before taking the trader straight to risk.
let deferFromSetup814=false;
const fastEntry814=v8Button('Direkt zu Konto & Risiko · Analyse später',()=>{
 if(entryStage!==2)return;
 deferFromSetup814=true;
 try{$('entryStageNext').click();}finally{deferFromSetup814=false;}
});
fastEntry814.id='fastEntry814';
document.querySelector('[data-entry-stage="2"]').append(fastEntry814);
const stageLabel814=showEntryStage;
showEntryStage=function(stage,...args){
 stageLabel814(stage,...args);
 if(stage===2)$('entryStageNext').textContent='LTF-Analyse öffnen';
};

const sessionAdvice814=v8MentalAdvice;
v8MentalAdvice=function(values){
 const advice=sessionAdvice814(values);
 const keys=new Set(advice.items.map(w=>w.key));
 for(const w of M9.warnings(values))if(!keys.has(w.key))advice.items.push(w);
 return advice;
};
const noticeMinutes814=select811('newsLead814','Erinnerung vor markierten Terminen',{0:'Aus',5:'5 Minuten',15:'15 Minuten',30:'30 Minuten'},$('settingsView'));
noticeMinutes814.options[0].remove();noticeMinutes814.value='15';
personalControls814.push('newsLead814');
const newsNotice814=el811('div');newsNotice814.setAttribute('role','status');
newsWarning811.before(newsNotice814);
const drawNotice814=drawNewsWarning811;
drawNewsWarning811=function(){
 drawNotice814();
 const minutes=Number(noticeMinutes814.value),now=Date.now();
 const upcoming=(currentSession?.htf_context?.htf_v8?.plan?.news_windows||[]).filter(e=>Date.parse(e.at)>=now&&Date.parse(e.at)<=now+minutes*60000);
 newsNotice814.replaceChildren();newsNotice814.hidden=!minutes||!upcoming.length;
 for(const event of upcoming)newsNotice814.append(el811('p',v8DateTime(event.at)+' · '+event.title));
};
document.addEventListener('click',e=>{
 if(e.target.closest('#setupCards,.direction-choice,#entryStageNext,#fastEntry814,#v8PreparationNext,#v8CalendarRows,#v811Ltf .tt-ltf-choices'))queueMicrotask(captureChange814);
});
setInterval(()=>{if(V8.route==='decision'&&!document.hidden)drawNewsWarning811();},30000);

function referenceButton814(trade){
 const button=v8Button('',async()=>{
  const owner=currentUser?.id,old=!!trade.playbook_reference_v814;
  button.disabled=true;
  try{
   const {data,error}=await client.from('trades').update({playbook_reference_v814:!old})
    .eq('id',trade.id).eq('owner_id',owner).eq('playbook_reference_v814',old).select('id').maybeSingle();
   if(error)throw error;if(!data)throw Error('Referenzstatus auf einem anderen Gerät geändert. Playbook erneut öffnen.');
   if(owner!==currentUser?.id)return;
   trade.playbook_reference_v814=!old;
   for(const b of $('playbookLexicon').querySelectorAll('[data-reference-id]'))if(b.dataset.referenceId===trade.id)paint(b);
  }catch(e){if(owner===currentUser?.id)message(e.message,true);}finally{button.disabled=false;}
 },'secondary');
 function paint(b){b.textContent=trade.playbook_reference_v814?'★ Referenztrade':'Als Referenztrade markieren';b.setAttribute('aria-pressed',String(!!trade.playbook_reference_v814));}
 button.dataset.referenceId=trade.id;paint(button);return button;
}
