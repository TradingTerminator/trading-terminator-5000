// Session-wide macro observations and separate market conclusions share the revisioned draft.
const marketFamilies={NQ:'nasdaq',MNQ:'nasdaq',ES:'sp',MES:'sp'};
const marketLabels={nasdaq:'Nasdaq 100',sp:'S&P 500'};
const marketScope=select811('analysisFamily','Analysemarkt',marketLabels,chapterNav814.parentElement);
chapterNav814.before(marketScope.closest('label'));
let familyStates={},activeFamily='';
const factors=el811('fieldset');factors.id='macroFactors';factors.append(el811('legend','Warum diese Einschätzung?'));
for(const [key,label] of Object.entries({fed:'Fed / Zinserwartungen',data:'Wirtschaftsdaten',news:'Aktuelle Nachrichten',risk:'Risikoumfeld',other:'Sonstiges'})){
 const input=el811('input');input.type='checkbox';input.id='macroFactor-'+key;input.value=key;
 factors.append(label813(label,input));
}
function chapterReason(id,label,parent){
 const field=el811('input');field.id=id;field.maxLength=500;parent.append(label813(label,field));return field;
}
chapters814[0].details.append(factors);
const macroReason=chapterReason('macroReason','Meine Makro-These',chapters814[0].details);
chapters814[1].details.append($('v8SentimentReason').closest('label'));
const techReason=chapterReason('techReason','Begründung aus Struktur oder Preislevel',chapters814[2].details);
function currentFamilyState(){
 return {images:familyImages(currentSession?.htf_context,activeFamily),technical:v8ReadTechnical(),direction:$('v8HtfDirection').value,technical_reason:techReason.value,
 sentiment:$('v8HtfSentiment').value,sentiment_reason:$('v8SentimentReason').value,scenario:scenarioDecision811.value,
 when:scenarioFields9.when.value,then:scenarioFields9.then.value,confirmed:[...confirmations814].filter(i=>i>0)};
}
function showFamily(){
 for(const key of ['nq','es'])$('v8Cross_'+key).closest('.card').hidden=(key==='nq'&&activeFamily==='nasdaq')||(key==='es'&&activeFamily==='sp');
 marketScope.value=activeFamily;
}
function loadFamily(next){
 if(activeFamily)familyStates[activeFamily]=currentFamilyState();
 if(!activeFamily&&!Object.keys(familyStates).length&&next&&!currentSession?.htf_context?.htf_v8?.plan){activeFamily=next;showFamily();v8UpdatePreparation();captureChange814();return;}
 activeFamily=next;
 const state=familyStates[next]||{};
 v8RenderTechnical(state.technical||V8H.points.map(({key,label})=>({key,label})));
 $('v8HtfDirection').value=state.direction||'';techReason.value=state.technical_reason||'';
 $('v8HtfSentiment').value=state.sentiment||'';$('v8SentimentReason').value=state.sentiment_reason||'';
 scenarioDecision811.value=state.scenario||'';scenarioFields9.when.value=state.when||'';scenarioFields9.then.value=state.then||'';
 scenarioDecision811.onchange();for(const i of [1,2]){confirmations814.delete(i);if(state.confirmed?.includes(i))confirmations814.add(i);}
 showFamily();marketImagePreview.open=false;paintChapters814();v8UpdatePreparation();captureChange814();
}
marketScope.onchange=()=>loadFamily(marketScope.value);
const sharedMarketPlan=v8HtfPlan;
v8HtfPlan=function(){
 const plan=sharedMarketPlan();
 return {...plan,news:plan.news||'Keine Termine ausgewählt',analysis_family:activeFamily||null,
 family_analyses:{...familyStates,...(activeFamily?{[activeFamily]:currentFamilyState()}:{})},
 macro_factors:[...factors.querySelectorAll(':checked')].map(x=>x.value),macro_reason:macroReason.value.trim(),technical_reason:techReason.value.trim()};
};
const sharedMarketRestore=v8RestoreHtf;
v8RestoreHtf=function(...args){
 sharedMarketRestore(...args);const plan=currentSession?.htf_context?.htf_v8?.plan||{};
 familyStates={...plan.family_analyses};activeFamily=plan.analysis_family||'';
 macroReason.value=plan.macro_reason||'';techReason.value=plan.technical_reason||'';
 for(const field of factors.querySelectorAll('input'))field.checked=plan.macro_factors?.includes(field.value)||false;
 showFamily();
};
workspaceWriters.push(item=>{item.marketAnalyses={active:activeFamily,families:{...familyStates,...(activeFamily?{[activeFamily]:currentFamilyState()}:{})}};});
const restoreMarketDraft=restoreWorkspace;
restoreWorkspace=function(item){
 restoreMarketDraft(item);if(item?.owner!==currentUser?.id||item.session!==(currentSession?.id||null))return;
 if(item.marketAnalyses){activeFamily=item.marketAnalyses.active||'';familyStates={...item.marketAnalyses.families};showFamily();}
};
const clearMarketSession=clearSession811;
clearSession811=function(...args){clearMarketSession(...args);familyStates={};activeFamily='';showFamily();};
const marketMissing=v8PreparationMissing;
v8PreparationMissing=function(){
 const issues=marketMissing();
 if(!activeFamily)issues.unshift(['Analysemarkt auswählen',marketScope.id]);
 if(!factors.querySelector(':checked'))issues.push(['Grund für Makro-Einschätzung wählen',factors.id]);
 if(!macroReason.value.trim())issues.push(['Makro-These kurz begründen',macroReason.id]);
 if(!techReason.value.trim())issues.push(['Technische Einschätzung kurz begründen',techReason.id]);
 return issues;
};
// Keep one instrument control for execution. The setup screen only reflects that decision.
const instrumentField=$('instrument'),instrumentLabel=instrumentField.closest('label');
const marketCaption=el811('p');instrumentLabel.before(marketCaption);
instrumentLabel.firstChild.textContent='Instrument für diesen Trade';$('entryStageTitle').after(instrumentLabel);
function paintTradeMarket(){marketCaption.textContent='Aktueller Markt · '+(instrumentField.value||'offen');}
instrumentField.addEventListener('change',paintTradeMarket);
const marketStage=showEntryStage;
showEntryStage=function(...args){marketStage(...args);paintTradeMarket();};
const marketEntryContext=v811EntryContext;
v811EntryContext=function(){
 const prior=marketEntryContext(),family=marketFamilies[instrumentField.value],snapshot=entryAssessment(currentSession?.htf_context?.htf_v8);
 const analysis=snapshot?.plan?.family_analyses?.[family];
 return {...prior,market_context:{instrument:instrumentField.value,family:family||null,assessment_id:snapshot?.id||null,
 captured_at:snapshot?.captured_at||null,macro_direction:snapshot?.plan?.macro_direction||null,macro_reason:snapshot?.plan?.macro_reason||null,
 analysis:analysis||null,recording_mode:V811.mode}};
};
sources811.hidden=true;links811.hidden=true;
$('v8CalendarReviewed').closest('label').hidden=true;$('v8NewsState').closest('label').hidden=true;
calendarBox.append(customEvent814);
customEvent814.append(additionalNews813,manualWindow811);
customEvent814.addEventListener('toggle',()=>{if(customEvent814.open){$('v8NewsState').value='yes';v8SyncNews();}});
for(const opt of $('v8HtfSentiment').options){if(opt.value==='bullish')opt.text='Long';if(opt.value==='bearish')opt.text='Short';if(opt.value==='mixed')opt.hidden=true;}
for(const [key] of CROSS_MARKETS){
 const select=$('v8Cross_'+key),card=select.closest('.card');card.classList.add('tt-market-observation');
 if(select.options[0].value==='')select.options[0].text='Nicht bewertet';
 for(const o of select.options){if(o.value==='long')o.text='Steigend';if(o.value==='short')o.text='Fallend';if(o.value==='neutral')o.text='Seitwärts';}
}
function entryAssessment(snapshot){
 if(V811.mode!=='retrospective'||!snapshot)return snapshot;
 const entry=Date.parse(actualTime813(retrospectiveAt813)),assessment=Date.parse(snapshot.captured_at);
 return Number.isFinite(entry)&&assessment<=entry?snapshot:null;
}
function snapshotForInstrument(snapshot,instrument){
 if(!snapshot)return null;
 if(!snapshot.plan?.family_analyses)return {...snapshot,direction:null,plan:{
  macro_direction:snapshot.plan?.macro_direction||null,macro_reason:snapshot.plan?.macro_reason||null,
  personal_plan:snapshot.plan?.personal_plan,news:snapshot.plan?.news,news_behaviour:snapshot.plan?.news_behaviour,
  news_behaviour_note:snapshot.plan?.news_behaviour_note,calendar_events:snapshot.plan?.calendar_events,cross_markets:snapshot.plan?.cross_markets,
  technical:[],images:[],analysis_family:null,analysis_available:false,legacy_assessment_id:snapshot.id||null
 }};
 const p=snapshot.plan,family=marketFamilies[instrument],state=p.family_analyses[family];
 return {...snapshot,direction:state?.direction||null,plan:{...p,analysis_family:family||null,
 technical:state?.technical||[],direction:state?.direction||'',sentiment:state?.sentiment||'',
 sentiment_reason:state?.sentiment_reason||'',technical_reason:state?.technical_reason||'',scenario_note:state?.when||state?.then?[state.when,state.then].filter(Boolean).join(' → '):'',
 images:state?.images||[],analysis_available:!!(state?.direction&&state?.sentiment)}};
}
instrumentField.addEventListener('change',()=>{
 for(const card of $('allocationList').querySelectorAll('.account')){
  const selector=card.querySelector('.acct-instrument'),id=card.querySelector('.acct-check')?.dataset.id;
  if(!selector||selector.value===instrumentField.value)continue;
  const accountStandard=currentSession?.htf_context?.selected_accounts?.find(a=>a.account_id===id);
  if(accountStandard&&selector.value===accountStandard.instrument&&marketFamilies[accountStandard.instrument]===marketFamilies[instrumentField.value]&&$('entryCopy').checked)continue;
  if(accountStandard&&selector.value===accountStandard.instrument&&marketFamilies[accountStandard.instrument]===marketFamilies[instrumentField.value]&&$('allocationList').querySelectorAll('.acct-instrument').length>1)continue;
  selector.value=instrumentField.value;
  const cfg=currentSession?.htf_context?.selected_accounts?.find(a=>a.account_id===id&&a.instrument===selector.value);
  const profile=profileFor(id,selector.value),a=allAccounts.find(a=>a.id===id&&a.default_instrument===selector.value);
  card.querySelector('.acct-qty').value=cfg?.planned_quantity??profile?.quantity??a?.default_quantity??'';
  card.querySelector('.acct-sl-ticks').value=cfg?.initial_sl_ticks??profile?.ticks??a?.default_sl_ticks??'';
 }
 updateEntryRiskPreview();drawAccountDeviations813();v8DrawTradeOverview();captureChange814();
});
const phaseMount=mountTradePanes;
mountTradePanes=function(trade,...args){
 phaseMount(trade,...args);const root=$('tradeDetails'),identity=root.querySelector('.trade-identity');
 if(!identity)return;
 for(const tab of root.querySelectorAll('[data-pane-button]')){
  const phase=tab.dataset.paneButton;
  tab.hidden=false;tab.textContent=({overview:'Trade',stop:'SL-Verlauf',exit:'Exit',review:'Review'})[phase]||tab.textContent;
 }
 const market=M9.context(trade).market_context;
 if(market){
  const state=market.analysis;
  const ctx=el811('details');ctx.append(el811('summary','Analyse beim Entry · '+(marketLabels[market.family]||'Markt offen')),
   el811('p','Makro · '+(market.macro_reason||'Begründung offen')),
   el811('p',state?'Sentiment · '+(state.sentiment_reason||'offen')+' · Technik · '+(state.technical_reason||'offen'):'Marktanalyse vor Entry nicht dokumentiert'));
  identity.append(ctx);
 }
 const review=root.querySelector('.review-editor');
 if(review){const heading=review.querySelector('.review-step-heading');if(heading)review.querySelector('.review-steps')?.before(heading);}
 mountTradeGallery(root,trade);
};
function mountTradeGallery(root,trade){
 const box=el811('details'),content=el811('div');box.className='tt-gallery';
 box.append(el811('summary','Trade-Bilder ansehen'),content);root.querySelector('.trade-identity').append(box);
 let load=0;const owner=currentUser?.id;
 box.ontoggle=async()=>{
  const seq=++load;if(!box.open)return;
  const entries=new Map(),context=M9.context(trade);
  function add(path,phase,at){if(path?.startsWith(owner+'/')&&!entries.has(path))entries.set(path,{phase,at});}
  for(const path of context.ltf_v811?.images||[])add(path,'LTF / Entry',context.ltf_v811.observed_at);
  for(const path of context.htf_snapshot?.plan?.images||[])add(path,'HTF · Referenz',context.htf_snapshot.captured_at);
  content.textContent='Bilder werden geladen …';
  try{
   for(const [folder,phase] of [['','Zuordnung offen'],['management','Management'],['exit','Exit']]){
    const prefix=chartPath('trade',trade.id,folder).replace(/\/$/,'');
    for(let offset=0;;offset+=100){
     const {data,error}=await client.storage.from(CHART_BUCKET).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
     if(owner!==currentUser?.id||seq!==load||!box.isConnected)return;
     if(error)throw error;
     for(const row of data||[])if(row.id)add(prefix+'/'+row.name,phase,row.created_at);
     if(!data||data.length<100)break;
    }
   }
   content.replaceChildren();for(const [path,{phase,at}] of [...entries].sort((a,b)=>(a[1].at||'').localeCompare(b[1].at||''))){
    const figure=el811('figure');figure.append(image9(path,phase),el811('figcaption',phase+(at?' · '+v8DateTime(at):'')));content.append(figure);
   }
   if(!entries.size)content.textContent='Keine Bilder dokumentiert.';
  }catch(e){if(box.isConnected&&seq===load)content.textContent='Bilder nicht geladen · '+e.message;}
 };
}
function familyImages(context,family){
 const scope=context?.htf_image_families||{};
 return v8HtfPaths(context).filter(path=>scope[path]===family&&family);
}
const sharedOverviewPlan=v8OverviewPlan;
v8OverviewPlan=function(){
 if(V8.route==='decision')return snapshotForInstrument(currentSession?.htf_context?.htf_v8,instrumentField.value)?.plan;
 return sharedOverviewPlan();
};
const marketImagePreview=el811('details');marketImagePreview.append(el811('summary','HTF-Chart zur technischen Einschätzung'));
chapters814[2].details.insertBefore(marketImagePreview,$('v8HtfDirection').closest('label'));
marketImagePreview.ontoggle=()=>{
 if(!marketImagePreview.open)return;
 marketImagePreview.querySelectorAll('figure,p').forEach(el=>el.remove());
 const paths=familyImages(currentSession?.htf_context,activeFamily);
 for(const path of paths){const figure=el811('figure');figure.append(image9(path,'HTF · '+marketLabels[activeFamily]));marketImagePreview.append(figure);}
 if(!paths.length)marketImagePreview.append(el811('p','Kein Chart für diesen Analysemarkt hinterlegt.'));
};
const marketView=showView;
showView=function(...args){marketView(...args);if(V8.route==='decision')paintTradeMarket();};
const stopStepTicks=select811('stopStepTicks','SL-Schrittweite in Ticks',{1:'1',5:'5',10:'10',20:'20'},$('settingsView'));
stopStepTicks.options[0].remove();stopStepTicks.value='10';personalControls814.push(stopStepTicks.id);
const mountStopControls=mountTradePanes;
mountTradePanes=function(trade,...args){
 mountStopControls(trade,...args);
 for(const panel of $('tradeDetails').querySelectorAll('.stop-panel')){
  const stepper=panel.querySelector('.stop-stepper');if(!stepper)continue;
  const step=stopStepTicks.value||'1';
  for(const [key,sign] of [['plus','+'],['minus','−']]){
   const b=stepper.querySelector('.stop-'+key);b.textContent=sign+step;b.setAttribute('aria-label','Stop um '+sign+step+' Ticks ändern');
  }
  const confirm=v8Button('✓',()=>{
   const field=stepper.querySelector('.stop-new');if(!/^-?\d+$/.test(field.value)){markField813(field,'Neuen SL in ganzen Ticks eingeben.');return;}
   const dialog=el811('dialog');dialog.append(el811('h3','SL auf '+field.value+' Ticks · Grund wählen'));
   const reason=panel.querySelector('.stop-reason'),notes=panel.querySelector('.stop-notes'),note=el811('textarea');note.value=notes.value;note.maxLength=notes.maxLength>0?notes.maxLength:500;
   dialog.append(label813('Begründung · optional',note));
   for(const opt of reason.options)if(opt.value)dialog.append(v8Button(opt.text,()=>{
    reason.value=opt.value;notes.value=note.value;dialog.close();panel.querySelector('.save-stop').click();
   },'secondary'));
   dialog.append(v8Button('Abbrechen',()=>dialog.close(),'ghost'));dialog.onclose=()=>dialog.remove();panel.append(dialog);dialog.showModal();
  });confirm.setAttribute('aria-label','Neuen SL bestätigen und Grund wählen');stepper.append(confirm);
 }
};
// Account/instrument defaults use the existing owner-scoped preference revision.
function profileFor(accountId,instrument){
 if(!currentUser||!accountId||!marketFamilies[instrument])return null;
 const key='execution:'+accountId+':'+instrument;
 const state=JSON.parse(ttLocalStore.getItem(preferenceKey814(currentUser.id))||'{}');
 return {...state.values,...state.pending?.values,...state.edits}[key]||null;
}
const executionDefaults=el811('details');executionDefaults.append(el811('summary','Kontrakte und Standard-SL je Instrument'));
const defaultMarket=select811('defaultProfileMarket','Instrument',Object.fromEntries(Object.keys(marketFamilies).map(i=>[i,i])),executionDefaults);
const defaultSize=el811('input'),defaultTicks=el811('input');
for(const field of [defaultSize,defaultTicks]){field.type='number';field.min='1';field.step='1';}
executionDefaults.append(label813('Kontrakte',defaultSize),label813('Standard-SL · Ticks',defaultTicks));
function drawProfile(){
 const profile=profileFor(editingAccountId,defaultMarket.value);
 defaultSize.value=profile?.quantity??'';defaultTicks.value=profile?.ticks??'';
}
defaultMarket.onchange=drawProfile;
executionDefaults.addEventListener('toggle',()=>{if(executionDefaults.open)drawProfile();});
$('accountList').addEventListener('click',()=>queueMicrotask(()=>{defaultMarket.value='';drawProfile();executionDefaults.open=false;}));
executionDefaults.append(v8Button('Instrumentvorgaben übernehmen',()=>{
 if(!editingAccountId||!marketFamilies[defaultMarket.value])return markField813(defaultMarket,'Instrument wählen.');
 const quantity=Number(defaultSize.value),ticks=Number(defaultTicks.value);
 for(const [field,value,max] of [[defaultSize,quantity,99999],[defaultTicks,ticks,100000]])
  if(!Number.isSafeInteger(value)||value<1||value>max)return markField813(field,'Ganze Zahl zwischen 1 und '+max+' eingeben.');
 rememberPreference814('execution:'+editingAccountId+':'+defaultMarket.value,{quantity,ticks});
 preferenceStatus814.textContent='Instrumentvorgaben warten auf Synchronisation.';
}));
$('saveAccountEdit').before(executionDefaults);
$('sessionAccountList').addEventListener('change',event=>{
 if(!event.target.matches('.sess-instrument'))return;
 const row=event.target.closest('.account'),profile=profileFor(row.querySelector('.sess-check').dataset.id,event.target.value);
 if(profile){row.querySelector('.sess-qty').value=profile.quantity;row.querySelector('.sess-sl').value=profile.ticks;updateSessionCheckStatus();}
});
$('allocationList').addEventListener('change',event=>{
 if(!event.target.matches('.acct-instrument'))return;
 const row=event.target.closest('.account'),profile=profileFor(row.querySelector('.acct-check').dataset.id,event.target.value);
 if(profile){row.querySelector('.acct-qty').value=profile.quantity;row.querySelector('.acct-sl-ticks').value=profile.ticks;updateEntryRiskPreview();drawAccountDeviations813();}
});
// A pending LTF observation belongs to one contract until its entry is recorded.
let ltfInstrument='',instrumentDrafts={};
const enterInstrumentDraft=v810OpenEntry;
v810OpenEntry=function(...args){
 if(!V811.mode||V811.draftSession!==currentSession?.id){instrumentDrafts={};ltfInstrument='';}
 const result=enterInstrumentDraft(...args);ltfInstrument=instrumentField.value;return result;
};
instrumentField.addEventListener('focus',()=>{ltfInstrument=instrumentField.value;});
instrumentField.addEventListener('change',event=>{
 const next=instrumentField.value;if(!ltfInstrument||next===ltfInstrument){ltfInstrument=next;return;}
 if(V811.uploading||chosenImages(ltfImages811).length){
  instrumentField.value=ltfInstrument;event.stopImmediatePropagation();
  entryFeedback('Ausgewähltes LTF-Bild zuerst speichern oder entfernen.',saveLtf813);return;
 }
 instrumentDrafts[ltfInstrument]={fields:captureFields(ltf811),ltf:{...V811.ltf,images:[...V811.ltf.images]}};
 ltfInstrument=next;const cached=instrumentDrafts[next];
 for(const field of ltf811.querySelectorAll('input:not([type=file]),select,textarea')){
  if(field.type==='checkbox')field.checked=false;else field.value='';
 }
 V811.ltf=cached?.ltf||{images:[]};if(cached)applyFields(ltf811,cached.fields);
 syncLtf813();$('v811LtfStatus').onchange();
},true);
workspaceWriters.push(item=>{item.instrumentDrafts={instrument:ltfInstrument,drafts:instrumentDrafts};});
const restoreInstrumentDraft=restoreWorkspace;
restoreWorkspace=function(item){
 restoreInstrumentDraft(item);
 if(item?.owner!==currentUser?.id||item.session!==(currentSession?.id||null))return;
 instrumentDrafts=item.instrumentDrafts?.drafts||{};ltfInstrument=item.instrumentDrafts?.instrument||instrumentField.value;
};
const clearInstruments=clearSession811;
clearSession811=function(...args){ltfInstrument='';instrumentDrafts={};return clearInstruments(...args);};
const rateGroup=el811('fieldset');rateGroup.className='tt-rate-group';rateGroup.append(el811('legend','Anleihen und Renditen'));
const yieldsCard=$('v8Cross_yields').closest('.card'),bondCard=$('v8Cross_bonds').closest('.card');
yieldsCard.before(rateGroup);rateGroup.append(yieldsCard,bondCard);
for(const [key,title] of [['yields','Rendite'],['bonds','Anleihepreis']]){
 const s=$('v8Cross_'+key);s.closest('label').firstChild.textContent=title;
}
