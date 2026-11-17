/* A voluntary break: always dismissible, never a trading lock. */
const V8P={owner:null,session:null,until:null,started:null,returnFocus:null,origin:null};
const v8PauseScreen=document.createElement('div');
v8PauseScreen.id='v8PauseScreen';v8PauseScreen.hidden=true;v8PauseScreen.setAttribute('role','dialog');v8PauseScreen.setAttribute('aria-modal','true');v8PauseScreen.setAttribute('aria-labelledby','v8PauseTitle');
v8PauseScreen.innerHTML='<div class="v8-pause-card"><h2 id="v8PauseTitle">Wie lange möchtest du pausieren?</h2><div id="v8PauseChoice"><div class="v8-pause-presets" role="group" aria-label="Pausendauer"><button type="button" data-pause-minutes="5">5 Minuten</button><button type="button" data-pause-minutes="10">10 Minuten</button><button type="button" data-pause-minutes="15">15 Minuten</button></div><label>Eigene Dauer in Minuten<input id="v8PauseMinutes" type="number" min="1" max="180" step="1" value="5" inputmode="numeric"></label><p id="v8PauseError" role="status"></p><button id="v8PauseStart" type="button">Pause starten</button></div><div id="v8PauseRunning" hidden><p id="v8PauseTimer" role="timer" aria-label="Verbleibende Pausenzeit">05:00</p><p id="v8PauseEndTime"></p><p id="v8PauseExercise"></p><p class="compact-help">Atme sanft, ohne Luft anzuhalten. Bei Unwohlsein abbrechen.</p><p id="v8PauseState" role="status"></p></div><button type="button" id="v8PauseExit" class="secondary">Zurück ohne Pause</button></div>';
$('app').append(v8PauseScreen);
function v8PauseKey(){return currentUser?.id?'tt8_voluntary_pause_'+currentUser.id:null;}
function v8PauseStorage(){return ttRemember?localStorage:sessionStorage;}
function v8PersistPause(){const key=v8PauseKey();if(!key)return;try{v8PauseStorage().setItem(key,JSON.stringify({owner:V8P.owner,session:V8P.session,until:V8P.until,started:V8P.started,origin:V8P.origin}));(ttRemember?sessionStorage:localStorage).removeItem(key);}catch(_){}}
function v8PauseVisible(){return !v8PauseScreen.hidden;}
function v8SetPauseOpen(open){v8PauseScreen.hidden=!open;document.body.classList.toggle('v8-voluntary-pause',open);$('tabs').inert=open;document.querySelector('header').inert=open;for(const node of $('app').children)if(node!==v8PauseScreen)node.inert=open;}
function v8ChoosePause(){
 if(!currentUser)return;if(V8P.until){v8ShowRunningPause();return;}V8P.origin={owner:currentUser.id,session:currentSession?.id||null,route:V8.route,step:V8Prep.step,stage:entryStage,y:scrollY,workspace:readWorkspace(),focus:document.activeElement?.id};saveWorkspace();V8P.origin.workspace=readWorkspace();V8P.returnFocus=document.activeElement;V8P.owner=currentUser.id;V8P.session=currentSession?.id||null;V8P.until=null;
 $('v8PauseTitle').textContent='Wie lange möchtest du pausieren?';$('v8PauseChoice').hidden=false;$('v8PauseRunning').hidden=true;$('v8PauseExit').textContent='Zurück ohne Pause';$('v8PauseError').textContent='';v8SetPauseOpen(true);$('v8PauseMinutes').focus();
}
function v8PauseRemaining(until=V8P.until,now=Date.now()){return Number.isFinite(until)?Math.max(0,Math.ceil((until-now)/1000)):0;}
function v8TickPause(){
 if(!v8PauseVisible()||!V8P.until)return;const left=v8PauseRemaining();$('v8PauseTimer').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
 $('v8PauseExercise').textContent=left?v8PauseExercise(V8P.started):'Spüre kurz nach: Wie sind Anspannung und Fokus jetzt?';
 const state='';if($('v8PauseState').textContent!==state)$('v8PauseState').textContent=state;
 $('v8PauseExit').textContent='Pause vorzeitig beenden';if(!left)v8EndPause();
}
function v8ShowRunningPause(){
 $('v8PauseTitle').textContent='Pause';$('v8PauseChoice').hidden=true;$('v8PauseRunning').hidden=false;$('v8PauseEndTime').textContent='';v8SetPauseOpen(true);v8TickPause();$('v8PauseExit').focus();
}
function v8StartPause(){
 const minutes=Number($('v8PauseMinutes').value);if(!Number.isInteger(minutes)||minutes<1||minutes>180){$('v8PauseError').textContent='Bitte 1 bis 180 ganze Minuten wählen.';return;}
 if(V8P.owner!==currentUser?.id||V8P.session!==(currentSession?.id||null)){v8EndPause();return;}
 V8P.started=Date.now();V8P.until=V8P.started+minutes*60000;saveWorkspace();v8PersistPause();v8ShowRunningPause();
}
function v8EndPause(){
 const wasRunning=!!V8P.until,key=v8PauseKey();if(key)try{localStorage.removeItem(key);sessionStorage.removeItem(key);}catch(_){}
 const origin=V8P.origin;V8P.until=null;V8P.started=null;V8P.origin=null;v8SetPauseOpen(false);if(wasRunning){const target=TTSession810.pauseTarget(origin,currentUser?.id,currentSession);if(target!=='live'&&origin?.workspace)restoreWorkspace(origin.workspace);showView(target);if(target==='session')v8ShowPrepStep(origin.step||1,false);if(target==='decision')showEntryStage(origin.stage||1);window.scrollTo({top:target==='live'?0:origin.y||0,behavior:'instant'});if(origin?.focus)$(origin.focus)?.focus({preventScroll:true});}else if(V8P.returnFocus?.isConnected)V8P.returnFocus.focus();saveWorkspace();
}
function v8RestorePause(){
 if(!currentUser)return;const key=v8PauseKey();let item;try{item=JSON.parse(v8PauseStorage().getItem(key)||'null');}catch(_){return;}
 if(v8PauseVisible()&&V8P.until&&V8P.started)return;if(!item||item.owner!==currentUser.id||item.session!==(currentSession?.id||null)||!Number.isFinite(item.until)||item.until<Date.now()-86400000||item.until>Date.now()+10800000)return;
 V8P.owner=item.owner;V8P.session=item.session;V8P.origin=item.origin||{owner:item.owner,session:item.session,route:sessionReady()?'decision':'session',step:1,stage:1};V8P.until=item.until;V8P.started=Number.isFinite(item.started)&&item.started<=item.until?item.started:item.until-5*60000;v8ShowRunningPause();
}
$('v8PauseStart').onclick=v8StartPause;$('v8PauseExit').onclick=v8EndPause;
for(const button of v8PauseScreen.querySelectorAll('[data-pause-minutes]'))button.onclick=()=>{$('v8PauseMinutes').value=button.dataset.pauseMinutes;for(const pick of v8PauseScreen.querySelectorAll('[data-pause-minutes]'))pick.setAttribute('aria-pressed',String(pick===button));};
v8PauseScreen.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();v8EndPause();}if(e.key==='Tab'){const controls=[...v8PauseScreen.querySelectorAll('button,input')].filter(el=>!el.disabled&&!el.closest('[hidden]'));const index=controls.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&index===controls.length-1){e.preventDefault();controls[0]?.focus();}}});
setInterval(v8TickPause,1000);document.addEventListener('visibilitychange',v8TickPause);
const pauseSessionRender=renderSession;renderSession=function(...args){pauseSessionRender(...args);v8RestorePause();};
const pauseRestoreWorkspace=restoreWorkspace;restoreWorkspace=function(...args){pauseRestoreWorkspace(...args);v8RestorePause();};
const pauseReset=resetPrivateState;resetPrivateState=function(...args){v8SetPauseOpen(false);V8P.owner=null;V8P.session=null;V8P.until=null;V8P.returnFocus=null;pauseReset(...args);};

const V8_PAUSE_EXERCISES=['Atmung: Atme ruhig ein und etwas länger aus. Lass den Rhythmus angenehm bleiben.','Schultern: Hebe sie sanft an und lass sie locker sinken. Entspanne den Kiefer.','Orientierung: Benenne fünf Dinge, die du siehst. Spüre deine Füße am Boden.','Abstand: Schau in die Ferne. Lass die Augen weich werden und blinzle entspannt.','Gedanken: Benenne einen belastenden Gedanken und lass ihn für diesen Moment stehen.','Körper: Lockere die Hände. Spüre die Auflage von Rücken und Füßen.','Fokus: Sage dir: Ich muss keinen Trade erzwingen. Ich warte auf meinen Trigger.','Bewegung: Strecke dich sanft oder gehe ein paar ruhige Schritte.'];
function v8PauseExercise(start,now=Date.now()){return V8_PAUSE_EXERCISES[Math.max(0,Math.floor((now-start)/60000))%V8_PAUSE_EXERCISES.length];}
