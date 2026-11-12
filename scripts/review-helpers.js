function reviewErrors(trade){
 const o=trade?.observations||{};
 if(Array.isArray(o.review_errors))return o.review_errors;
 return o.review_error?[{id:'legacy-'+trade.id,type:o.review_error,countermeasure:o.countermeasure||'',confirmed_breach:!!trade.rule_deviation}]:[];
}
function hasReviewError(t,key){return reviewErrors(t).some(e=>e.type===key);}
function exceptionItems(t){
 const list=[];const limit=t.observations?.limit_exception;
 if(limit?.exceeded)list.push({id:'daily-limit',type:'overtrading',label:'Tageslimit überschritten',reason:limit.reason||''});
 for(const x of t._stopExceptions||[])list.push(x);
 return list;
}
function collectReviewErrors(form){return [...form.querySelectorAll('.review-error-row')].map(row=>({id:row.dataset.id,type:row.querySelector('.error-type').value,countermeasure:row.querySelector('.error-action').value.trim(),confirmed_breach:row.querySelector('.error-breach').checked,...(row.dataset.sourceId?{source_id:row.dataset.sourceId}:{})}));}
function collectExceptionDecisions(form){return Object.fromEntries([...form.querySelectorAll('[data-exception-id]')].map(el=>[el.dataset.exceptionId,el.value]));}
function addReviewError(form,item={}){
 const row=document.createElement('div');row.className='account review-error-row';row.dataset.id=item.id||crypto.randomUUID();if(item.source_id)row.dataset.sourceId=item.source_id;
 const label=document.createElement('label');label.textContent='Fehlerart';const select=document.createElement('select');select.className='error-type';
 for(const [key,name] of Object.entries(REVIEW_LABELS)){const o=document.createElement('option');o.value=key;o.textContent=name;select.append(o);}select.value=item.type||'other';label.append(select);row.append(label);
 const actionLabel=document.createElement('label');actionLabel.textContent='Konkrete Gegenmaßnahme (Wenn …, dann …)';const action=document.createElement('textarea');action.className='error-action';action.rows=2;action.maxLength=1000;action.value=item.countermeasure||'';
 const reuse=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent='Vorhandene Maßnahme übernehmen';reuse.append(blank);
 function refreshMeasures(){
  reuse.replaceChildren(blank);reuse.value='';
  const choices=new Set([...trainingMeasures.filter(m=>m.error_key===select.value).map(m=>m.rule_text),...sessionTrades.flatMap(t=>reviewErrors(t).filter(e=>e.type===select.value).map(e=>e.countermeasure))].filter(Boolean));
  for(const text of choices){const o=document.createElement('option');o.value=text;o.textContent=text;reuse.append(o);}
 }
 refreshMeasures();select.addEventListener('change',refreshMeasures);
 reuse.setAttribute('aria-label','Vorhandene Gegenmaßnahme übernehmen');
 reuse.addEventListener('change',()=>{if(reuse.value){action.value=reuse.value;draftSchedule();}});actionLabel.append(reuse,action);row.append(actionLabel);
 const checkLabel=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.className='error-breach';check.style.width='auto';check.checked=!!item.confirmed_breach;checkLabel.append(check,document.createTextNode(' Im Review bestätigter Regelbruch'));row.append(checkLabel);
 const remove=document.createElement('button');remove.type='button';remove.className='ghost';remove.textContent='Fehler entfernen';remove.addEventListener('click',()=>{row.remove();draftSchedule();});row.append(remove);form.querySelector('.review-errors').append(row);
 const promote=document.createElement('button');promote.type='button';promote.className='secondary';promote.textContent='Als Trainingsschwerpunkt übernehmen';
 promote.addEventListener('click',async()=>{
  const trade=detailTradeById(form.dataset.tradeId),feedback=form.querySelector('.review-feedback');
  if(!trade||!trade.exit_at||!trade.observations?.compliance_reviewed){if(feedback)feedback.textContent='Zuerst den abgeschlossenen Trade vollständig prüfen und Review speichern.';return;}
  const saved=reviewErrors(trade).find(e=>e.id===row.dataset.id);
  if(!saved||saved.countermeasure!==action.value.trim()||saved.type!==select.value){if(feedback)feedback.textContent='Die geänderte Gegenmaßnahme zuerst im Review speichern.';return;}
  promote.disabled=true;try{const selected=await chooseTrainingFocus(saved.countermeasure,{tradeId:trade.id,errorId:saved.id});if(selected&&feedback)feedback.textContent='Trainingsschwerpunkt ausgewählt. Status unter Training prüfen.';}catch(err){if(feedback)feedback.textContent='Schwerpunkt nicht gespeichert: '+err.message;}finally{promote.disabled=false;}
 });row.append(promote);
}
function renderReviewErrors(form,trade,draftDecisions){
 renderTrainingPractice(form,trade);
 form.querySelector('.review-errors').replaceChildren();for(const e of reviewErrors(trade))addReviewError(form,e);
 form.querySelector('.review-add-error').onclick=()=>{addReviewError(form);draftSchedule();};
 const host=form.querySelector('.review-exceptions');host.replaceChildren();
 const decisions=draftDecisions||trade.observations?.exception_reviews||{};
 for(const x of exceptionItems(trade)){
  const p=document.createElement('p');p.textContent=x.label+' · Begründung: '+(x.reason||'Fehlt → Regelbruch');host.append(p);
  const select=document.createElement('select');select.dataset.exceptionId=x.id;select.setAttribute('aria-label',x.label+' bewerten');
  for(const [value,label] of [['pending','Noch zu bewerten'],['accepted','Begründete Ausnahme akzeptiert'],['breach','Regelbruch bestätigt']]){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}
  select.value=x.reason?(decisions[x.id]||'pending'):'breach';if(!x.reason)select.disabled=true;
  select.addEventListener('change',()=>{if(select.value==='breach'&&!collectReviewErrors(form).some(e=>e.source_id===x.id))addReviewError(form,{type:x.type,source_id:x.id,confirmed_breach:true});draftSchedule();});host.append(select);
  if(select.value==='breach'&&!collectReviewErrors(form).some(e=>e.source_id===x.id))addReviewError(form,{type:x.type,source_id:x.id,confirmed_breach:true});
 }
}
