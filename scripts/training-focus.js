// One manually chosen focus; immutable per-entry rule snapshots are captured by SQL.
let trainingFocusActive=null,trainingFocusGoals=[],trainingFocusSeq=0,trainingFocusBusy=false,trainingFocusReady=false;
const PRACTICE_LABELS={pending:'Noch nicht bewertet',no_opportunity:'Keine passende Gelegenheit',followed:'Eingehalten',partial:'Teilweise eingehalten',missed:'Nicht eingehalten'};
function practiceSummary(rows,goalId){
 const counts={pending:0,no_opportunity:0,followed:0,partial:0,missed:0};
 for(const t of rows){const f=t.observations?.training_focus;if(!t.exit_at||f?.goal_id!==goalId)continue;const p=t.observations?.training_practice;const result=p?.goal_id===goalId&&Object.hasOwn(counts,p.result)?p.result:'pending';counts[result]++;}
 return {...counts,opportunities:counts.followed+counts.partial+counts.missed};
}
function trainingFocusMessage(text,bad=false){const el=$('trainingGoalStatus');el.textContent=text;el.style.color=bad?'#ffb4ad':'';}
function drawTrainingFocus(){
 const banner=$('sessionTrainingFocus');banner.textContent=trainingFocusActive?'Dein Trainingsschwerpunkt: '+trainingFocusActive.goal:trainingFocusReady?'Kein Trainingsschwerpunkt gewählt.':'Trainingsschwerpunkt noch nicht geladen.';
 const host=$('trainingGoalHistory');host.replaceChildren();
 for(const g of trainingFocusGoals){const p=document.createElement('p');p.textContent=({active:'Aktiv',practiced:'Bewusst beendet',replaced:'Ersetzt'})[g.status]+' · '+g.goal;host.append(p);}
 $('completeTrainingGoal').disabled=trainingFocusBusy||!trainingFocusActive;
 $('saveTrainingGoal').disabled=trainingFocusBusy||!trainingFocusReady;
 if(trainingFocusActive&&!$('trainingGoal').value)$('trainingGoal').value=trainingFocusActive.goal;
}
async function loadTrainingFocus(){
 const seq=++trainingFocusSeq,owner=currentUser?.id;
 if(!owner){trainingFocusActive=null;trainingFocusGoals=[];trainingFocusReady=false;drawTrainingFocus();return;}
 try{
  const {data,error}=await client.from('training_goals_v7').select('id,goal,status,created_at,updated_at,practiced_at,source_trade_id,source_error_id,error_type').order('created_at',{ascending:false}).limit(100);
  if(seq!==trainingFocusSeq||currentUser?.id!==owner)return;if(error)throw error;
  trainingFocusGoals=data||[];
  // Active query is separate so an older active goal cannot disappear behind history limits.
  const {data:active,error:activeError}=await client.from('training_goals_v7').select('id,goal,status,updated_at,source_trade_id,source_error_id,error_type').eq('status','active').maybeSingle();
  if(seq!==trainingFocusSeq||currentUser?.id!==owner)return;if(activeError)throw activeError;
  trainingFocusActive=active;trainingFocusReady=true;drawTrainingFocus();await loadPracticeSummary();
 }catch(err){if(seq!==trainingFocusSeq||currentUser?.id!==owner)return;trainingFocusActive=null;trainingFocusReady=false;drawTrainingFocus();trainingFocusMessage('Trainingsschwerpunkt nicht geladen: '+err.message,true);}
}
async function loadPracticeSummary(){
 const target=$('trainingPracticeSummary'),goal=trainingFocusActive,owner=currentUser?.id,seq=trainingFocusSeq;
 if(!goal){target.textContent='Wähle zuerst einen Trainingsschwerpunkt.';return;}
 const {data,error}=await client.from('trades').select('id,exit_at,observations').not('exit_at','is',null).filter('observations->training_focus->>goal_id','eq',goal.id).order('exit_at',{ascending:false}).limit(50);
 if(seq!==trainingFocusSeq||currentUser?.id!==owner||trainingFocusActive?.id!==goal.id)return;
 if(error){target.textContent='Umsetzung konnte nicht geladen werden: '+error.message;return;}
 const n=practiceSummary(data||[],goal.id);
 target.textContent='Letzte bis zu 50 abgeschlossene Trades mit diesem Schwerpunkt: '+n.opportunities+' passende Gelegenheiten · '+n.followed+' eingehalten · '+n.partial+' teilweise · '+n.missed+' nicht eingehalten · '+n.no_opportunity+' ohne Gelegenheit · '+n.pending+' offen. Zeigt Umsetzung, keinen Wirksamkeitsnachweis.';
}
async function chooseTrainingFocus(rule,source={}){
 if(trainingFocusBusy)return;
 if(!currentUser||!trainingFocusReady)throw new Error('Trainingsschwerpunkt zuerst laden.');
 if(rule.trim().length<10||rule.trim().length>500)throw new Error('Trainingsregel benötigt 10–500 Zeichen. Maßnahme gegebenenfalls im Review kürzen und speichern.');
 const owner=currentUser.id,expected=trainingFocusActive?.id||null;
 if(expected&&!confirm('Aktuellen Schwerpunkt bewusst durch diese Regel ersetzen? Der bisherige Schwerpunkt bleibt in der Historie.'))return;
 const requestId=crypto.randomUUID();trainingFocusBusy=true;drawTrainingFocus();
 try{
  const {data,error}=await client.rpc('set_training_focus_v735',{p_request_id:requestId,p_goal:rule.trim(),p_expected_id:expected,p_source_trade_id:source.tradeId||null,p_source_error_id:source.errorId||null});
  if(currentUser?.id!==owner)return;if(error)throw error;if(!data?.id)throw new Error('Keine Speicherbestätigung erhalten.');
  $('trainingGoal').value='';trainingFocusMessage('Trainingsschwerpunkt gespeichert. Gilt für kommende Trades.');await loadTrainingFocus();return true;
 }finally{trainingFocusBusy=false;drawTrainingFocus();}
}
function renderTrainingPractice(form,trade){
 let host=form.querySelector('.training-practice-review');if(!host){host=document.createElement('div');host.className='account training-practice-review';form.querySelector('.review-exceptions')?.after(host);}
 host.replaceChildren();const focus=trade.observations?.training_focus;host.dataset.goalId=focus?.goal_id||'';
 if(!focus?.goal_id){host.textContent='Für diesen Trade wurde beim Entry kein Trainingsschwerpunkt erfasst.';return;}
 const title=document.createElement('p');title.textContent='Beim Entry gültige Trainingsregel: '+focus.rule;host.append(title);
 if(!trade.exit_at){const p=document.createElement('p');p.textContent='Bewertung nach dem Exit.';host.append(p);return;}
 const label=document.createElement('label');label.textContent='Gab es eine passende Gelegenheit und wie hast du die Regel umgesetzt?';const select=document.createElement('select');select.className='practice-result';
 for(const [value,text] of Object.entries(PRACTICE_LABELS)){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}const saved=trade.observations.training_practice;select.value=saved?.goal_id===focus.goal_id?saved.result:'pending';label.append(select);host.append(label);
 const noteLabel=document.createElement('label');noteLabel.textContent='Kurze Erklärung (optional)';const note=document.createElement('textarea');note.className='practice-note';note.rows=2;note.maxLength=500;note.value=saved?.goal_id===focus.goal_id?saved.note||'':'';noteLabel.append(note);host.append(noteLabel);
}
function collectTrainingPractice(form,trade){const select=form.querySelector('.practice-result');if(!select)return null;return {goal_id:trade.observations.training_focus.goal_id,result:select.value,note:form.querySelector('.practice-note').value.trim()};}
function initTrainingFocus(){
 $('saveTrainingGoal').addEventListener('click',async()=>{try{await chooseTrainingFocus($('trainingGoal').value);}catch(err){trainingFocusMessage('Nicht gespeichert: '+err.message,true);}});
 $('completeTrainingGoal').textContent='Schwerpunkt bewusst beenden';
 $('completeTrainingGoal').addEventListener('click',async()=>{
  if(trainingFocusBusy||!trainingFocusActive||!currentUser)return;
  const goal=trainingFocusActive,owner=currentUser.id;if(!confirm('Schwerpunkt beenden? Dies bestätigt keine Wirksamkeit.'))return;
  trainingFocusBusy=true;drawTrainingFocus();
  try{const {data,error}=await client.from('training_goals_v7').update({status:'practiced',practiced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',goal.id).eq('status','active').eq('updated_at',goal.updated_at).select('id').maybeSingle();if(currentUser?.id!==owner)return;if(error)throw error;if(!data)throw new Error('Schwerpunkt wurde zwischenzeitlich geändert. Bitte neu laden.');$('trainingGoal').value='';await loadTrainingFocus();trainingFocusMessage('Schwerpunkt bewusst beendet. Bewertungen bleiben erhalten.');}catch(err){if(currentUser?.id===owner)trainingFocusMessage('Nicht gespeichert: '+err.message,true);}finally{trainingFocusBusy=false;drawTrainingFocus();}
 });
 client.auth.onAuthStateChange(()=>{trainingFocusSeq++;trainingFocusActive=null;trainingFocusGoals=[];trainingFocusReady=false;$('trainingGoal').value='';$('trainingPracticeSummary').textContent='';drawTrainingFocus();setTimeout(()=>{void loadTrainingFocus();},100);});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&currentUser)void loadTrainingFocus();});
 drawTrainingFocus();void loadTrainingFocus();
}

