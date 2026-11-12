
'use strict';
// Auth-Persistenz: lokal bei „Angemeldet bleiben“, sonst nur für den aktuellen Browser-/PWA-Kontext.
const TT_REMEMBER_KEY='tt7_remember_login_v716'; // Präferenz bleibt bei Updates erhalten
const TT_AUTH_KEY='sb-hogrdcqblpcrqgdtsvjv-auth-token';
function ttRememberPref(){try{return localStorage.getItem(TT_REMEMBER_KEY)!=='false';}catch(_){return true;}}
let ttRemember=ttRememberPref();
const ttAuthStorage={
 getItem(key){try{return (ttRemember?localStorage:sessionStorage).getItem(key)}catch(_){return null}},
 setItem(key,value){try{(ttRemember?localStorage:sessionStorage).setItem(key,value);(ttRemember?sessionStorage:localStorage).removeItem(key)}catch(_){try{sessionStorage.setItem(key,value)}catch(__){}}},
 removeItem(key){try{localStorage.removeItem(key)}catch(_){}try{sessionStorage.removeItem(key)}catch(_){}}
};
if(!window.supabase?.createClient){document.body.innerHTML='<main style="max-width:640px;margin:15vh auto;padding:24px;color:#fff;background:#48242c;border-radius:12px;font-family:system-ui"><h1>Trading Terminator – Verbindungsfehler</h1><p>Die Anmeldebibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen und die App neu öffnen.</p></main>';throw new Error('Supabase SDK unavailable');}
const client=window.supabase.createClient('https://hogrdcqblpcrqgdtsvjv.supabase.co','sb_publishable_i5m3fyK3cNWRPGV41l9ymw_UPBeyGan',{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:ttAuthStorage,storageKey:TT_AUTH_KEY}
});
function ttSetRemember(remember){
 const previous=ttRemember;
 if(previous===remember)return;
 let current=null;
 try{current=(previous?localStorage:sessionStorage).getItem(TT_AUTH_KEY)}catch(_){}
 ttRemember=remember;
 try{localStorage.setItem(TT_REMEMBER_KEY,String(remember))}catch(_){}
 if(current!==null)ttAuthStorage.setItem(TT_AUTH_KEY,current);
 else{try{(remember?sessionStorage:localStorage).removeItem(TT_AUTH_KEY)}catch(_){}}
 if(currentUser?.id)draftMoveUser(currentUser.id,remember);
}

const TT_VERSION='7.36';
const $=id=>document.getElementById(id);
let currentUser=null,currentSession=null,accounts=[],allAccounts=[],tradeCount=0,busy=false,sessionDraftMode="start",editingAccountId=null;
const SCALE_DEFS={session:[['focus','Fokus','unkonzentriert','klar / konzentriert'],['pressure','Innere Anspannung','ruhig','stark angespannt'],['fatigue','Müdigkeit','wach','sehr müde'],['urge','Handelsdrang','kein Drang','sehr starker Drang']],entryEmotion:[['focus','Fokus','unkonzentriert','klar / konzentriert'],['pressure','Anspannung','ruhig','stark angespannt'],['fomo','FOMO','kein Drang','sehr stark'],['revenge','Verluste zurückholen','kein Drang','sehr stark']],duringTradeEmotion:[['fear','Angst','keine','sehr stark'],['greed','Gier / Gewinnzwang','keine','sehr stark'],['uncertain','Unsicherheit','keine','sehr stark']],exitCommitEmotion:[['fear','Angst','keine','sehr stark'],['stress','Anspannung','ruhig','sehr stark'],['greed','Gier','keine','sehr stark'],['frustration','Frust','keiner','sehr stark'],['relief','Erleichterung','keine','sehr stark']]};
function readScales(group){return Object.fromEntries([...(group?.querySelectorAll('[data-scale]')||[])].filter(el=>el.dataset.rated==='true').map(el=>[el.dataset.scale,Number(el.value)]));}
function updateScaleLabels(root=document){root.querySelectorAll('[data-scale]').forEach(el=>{const output=el.closest('.rating-row')?.querySelector('output');if(output)output.textContent=el.dataset.rated==='true'?el.value+' / 10':'nicht bewertet';});}
function buildScaleGroup(group,kind,values){if(!group)return;const prior=values||readScales(group);group.dataset.scaleGroup=kind;group.innerHTML=(SCALE_DEFS[kind]||[]).map(([key,label,low,high],i)=>`${i===2?'<details><summary>Weitere Empfindungen (optional)</summary>':''}<div class="rating-row"><label><span>${escapeHtml(label)}</span><output></output><input type="range" min="1" max="10" step="1" value="${Number.isInteger(prior[key])&&prior[key]>=1&&prior[key]<=10?prior[key]:5}" data-scale="${key}" data-rated="${Number.isInteger(prior[key])&&prior[key]>=1&&prior[key]<=10}" aria-label="${escapeHtml(label)}"></label><div class="rating-ends"><span>1 · ${escapeHtml(low)}</span><span>10 · ${escapeHtml(high)}</span></div></div>`).join('')+((SCALE_DEFS[kind]||[]).length>2?'</details>':'');updateScaleLabels(group);}
function clearScales(group){group?.querySelectorAll('[data-scale]').forEach(el=>{el.dataset.rated='false';el.value='5';});updateScaleLabels(group);}
function enhanceEmotionScales(root=document){root.querySelectorAll('[data-emotion-group]').forEach(group=>{const kind=group.dataset.emotionGroup;if(SCALE_DEFS[kind]&&!group.dataset.scaleGroup)buildScaleGroup(group,kind);});}
function sessionContextText(){const notes=[...document.querySelectorAll('.htf-note')].filter(el=>el.value.trim()).map(el=>el.closest('.context-row').querySelector('label').textContent.trim()+': '+el.value.trim());if($('htf').value.trim())notes.push($('htf').value.trim());return notes.join('\n');}
document.addEventListener('input',e=>{if(!e.target.matches('[data-scale]'))return;e.target.dataset.rated='true';updateScaleLabels(e.target.closest('[data-scale-group]'));if(e.target.closest('#entryEmotionOptions'))updateEntryEmotionWarning();saveWorkspace();});

function selectedEmotion(group){return group?.querySelector('button[aria-pressed="true"]')?.dataset.value||'';}
function setEmotion(group,value){if(!group)return;group.querySelectorAll('button[data-value]').forEach(b=>{const selected=b.dataset.value===value;b.setAttribute('aria-pressed',selected?'true':'false');b.classList.toggle('emotion-selected',selected);});}
function updateEntryEmotionWarning(){const rated=readScales($('entryEmotionOptions'));const value=rated.fomo>=7?'fomo':rated.revenge>=7?'revenge':selectedEmotion($('entryEmotionOptions'));const warn=$('entryEmotionWarning');const text={fomo:'FOMO erkannt: Verpasst du gerade einen Move? Setup und Risiko nochmals prüfen.',revenge:'Revenge-Trading erkannt: Handelst du, um Verluste zurückzuholen?',impulsive:'Impulsiver Entry: Prüfe Marktstruktur, Setup und Risiko.'}[value];warn.textContent=text||'';warn.classList.toggle('hidden',!text);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-emotion-group] button[data-value]');if(!b)return;const emotionGroup=b.closest('[data-emotion-group]');if(emotionGroup.dataset.emotionGroup==='exitCommitEmotion'){const on=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!on));b.classList.toggle('emotion-selected',!on);}else setEmotion(emotionGroup,b.dataset.value);if(b.closest('[data-emotion-group]').id==='entryEmotionOptions')updateEntryEmotionWarning();if(b.closest('[data-emotion-group]').id==='sessionMoodOptions'&&currentSession&&!busy)$('saveHtf').click();});
let ttToastTimer;
function ttToast(s,err=false){const el=$('ttToast');if(!el)return;el.textContent=s;el.classList.toggle('toast-error',err);el.classList.add('toast-visible');clearTimeout(ttToastTimer);ttToastTimer=setTimeout(()=>el.classList.remove('toast-visible'),3200);}
const message=(s,err=false)=>{$('message').textContent=s;$('message').className=err?'error':'ok';if(err||/gespeichert|erstellt|dokumentiert|abgeschlossen|gestartet|hinzugefügt|aktualisiert|geändert|hochgeladen|entfernt|deaktiviert|Kontext:/i.test(s))ttToast((err?'⚠ ':'✓ ')+s,err)};
const localDate=()=>{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=type=>parts.find(p=>p.type===type)?.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
};
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showView(view){
 if(['live','decision','journal','accounts','analytics','training','playbook','settings'].includes(view))try{localStorage.setItem('tt7_active_view',view);sessionStorage.setItem('tt7_active_view',view)}catch(_){};for(const v of ['live','decision','journal','accounts','analytics','training','playbook','settings'])$(v+'View').classList.toggle('hidden',v!==view);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelector('#homeBar .home-button')?.setAttribute('aria-current',view==='live'?'page':'false');
const group=view==='journal'?'decision':(['training','accounts','playbook'].includes(view)?'analytics':view);
if(group!==view){$(view+'View').classList.remove('hidden');$(group+'View').classList.remove('hidden');}
for(const v of ['live','decision','journal','accounts','analytics','training','playbook','settings'])if(v!==view&&v!==group)$(v+'View').classList.add('hidden');
document.querySelectorAll('#tabs [data-view]').forEach(b=>{const active=b.dataset.view===group;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
if(view==='journal'){$('decisionView').classList.add('hidden');$('journalView').classList.remove('hidden');}
if(view==='training'||view==='accounts'||view==='playbook'){$('analyticsView').classList.add('hidden');$(view+'View').classList.remove('hidden');}
}
// iOS/Safari: Ansicht und Scrollposition bei App-Wechsel wiederherstellen.
let ttScrollSaveTimer;
window.addEventListener('scroll',()=>{clearTimeout(ttScrollSaveTimer);ttScrollSaveTimer=setTimeout(()=>{try{sessionStorage.setItem('tt7_scroll_y',String(window.scrollY))}catch(_){}},120)},{passive:true});
window.addEventListener('pagehide',()=>{try{sessionStorage.setItem('tt7_scroll_y',String(window.scrollY))}catch(_){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)try{sessionStorage.setItem('tt7_scroll_y',String(window.scrollY))}catch(_){};});
window.addEventListener('pageshow',e=>{if(e.persisted){try{const y=Number(sessionStorage.getItem('tt7_scroll_y'));if(Number.isFinite(y))requestAnimationFrame(()=>window.scrollTo(0,y));}catch(_){}}});
document.addEventListener('click',e=>{const btn=e.target.closest('.direction-choice');if(!btn)return;const select=$('direction');select.value=btn.dataset.direction;document.querySelectorAll('.direction-choice').forEach(b=>{const active=b===btn;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});});
function syncDirectionButtons(){document.querySelectorAll('.direction-choice').forEach(b=>{const active=b.dataset.direction===$('direction').value;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{showView(b.dataset.view);if(b.dataset.view==='decision'){entrySessionExpanded=false;syncEntrySession();}if(b.dataset.view==='settings'){renderSetupManager();renderEmotionManager();}if(b.dataset.view==='training')loadTraining();if(b.dataset.view==='analytics')loadAnalytics();window.scrollTo({top:0,behavior:'smooth'});});
document.addEventListener('click',e=>{if(e.target?.id==='goAccounts')showView('accounts');});
function goToTradeEntry(){if(currentSession&&currentSession.session_date!==localDate()){showSessionHub();message('Alte Session zuerst abschließen. Neue Trades sind hier gesperrt.',true);return;}renderDecision();ttLoadIdeas();syncDirectionButtons();showView('decision');entrySessionExpanded=false;syncEntrySession();$('decisionView').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('setupCards').querySelector('button')?.focus({preventScroll:true}),150);}
$('tradeOpenTab').addEventListener('click',()=>{showView('journal');$('sessionTrades').scrollIntoView({behavior:'smooth',block:'start'});});
$('journalEntryTab').addEventListener('click',goToTradeEntry);
$('tradeNewTab').addEventListener('click',goToTradeEntry);
[['analysisTrainingTab','training'],['analysisAccountsTab','accounts'],['trainingAnalysisTab','analytics'],['trainingAccountsTab','accounts'],['accountsAnalysisTab','analytics'],['accountsTrainingTab','training']].forEach(([id,v])=>$(id).addEventListener('click',()=>{showView(v);if(v==='training')loadTraining();if(v==='analytics')loadAnalytics();window.scrollTo({top:0,behavior:'smooth'});}));
[['analysisPlaybookTab','playbook'],['trainingPlaybookTab','playbook'],['playbookAnalysisTab','analytics'],['playbookTrainingTab','training'],['playbookAccountsTab','accounts']].forEach(([id,v])=>$(id).addEventListener('click',()=>{showView(v);if(v==='analytics')loadAnalytics();if(v==='training')loadTraining();if(v==='playbook')loadProgressAndPlaybook();window.scrollTo({top:0,behavior:'smooth'});}));
$('goToTradeEntry').addEventListener('click',goToTradeEntry);
// Ein einziger Trade-Arbeitsbereich, unabhängig vom gewählten Reiter.
$('journalWorkspace').appendChild($('sessionTrades'));
['sessionSummary'].forEach(id=>{const el=$(id);if(el)$('analyticsView').appendChild(el)});const top5=$('topFiveDashboard');if(top5){const anchor=$('analyticsView').querySelector('.subnav');anchor.after(top5)}const progress=$('progressPanel');if(progress)$('trainingView').appendChild(progress);const playbook=$('playbookPanel');if(playbook){$('playbookView').appendChild(playbook)}
const qc=$('qualityChecklist');if(qc)$('settingsView').appendChild(qc);

// Session is a first-class workspace, not hidden below the dashboard analytics.
['noSession','sessionSetup','activeSession','htfScreenshot','tradeStartAfterHtf'].forEach(id=>{const el=$(id);if(el)$('sessionHub').appendChild(el)});$('sessionHub').appendChild($('sessionFinishPanel'));
$('entrySessionMount').appendChild($('sessionHub'));
const focusBanner=document.createElement('div');focusBanner.id='sessionTrainingFocus';focusBanner.className='card';focusBanner.setAttribute('role','status');$('entrySessionMount').prepend(focusBanner);
const entryForm=$('entryForm'),entryEmotionCard=$('entryEmotionOptions').closest('.card');
$('entryAccounts').after(entryEmotionCard);const directionField=$('direction').closest('.direction-field');$('ttIdeaPanel').before(directionField);directionField.after($('instrument').closest('label'));
$('tradeNewTab').textContent='Neuer Trade';$('toggleEntrySession').textContent='Session bearbeiten';$('goToTradeEntry').textContent='Weiter zum Trade';
let entrySessionExpanded=false;
function sessionReady(){return !!(currentSession && currentSession.session_date===localDate() && (String(currentSession.htf_context?.notes||'').trim() && Object.values(currentSession.htf_context?.preflight_checks||{}).every(Boolean) && Object.keys(currentSession.htf_context?.preflight_checks||{}).length>=4));}
function syncEntrySession(){const ready=sessionReady();$('entrySessionTitle').textContent=currentSession?'Session '+currentSession.session_date:'1 · Session starten';$('entrySessionSub').textContent=currentSession&&currentSession.session_date!==localDate()?'⚠ ALTE SESSION – zuerst abschließen':ready?'HTF bereit · '+currentSession.session_date:currentSession?'HTF noch offen':'Vor dem ersten Trade konfigurieren';const today=localDate();const stale=!!currentSession&&currentSession.session_date!==today;const open=!ready||entrySessionExpanded||stale;$('entrySessionBar').classList.toggle('tt-old-session-banner',stale);$('sessionHub').classList.toggle('hidden',!open);$('toggleEntrySession').textContent=stale?'Alte Session öffnen →':open?'Zur Session ↓':'Session / HTF öffnen';$('toggleEntrySession').disabled=false;$('entryForm').classList.toggle('hidden',!ready||open);$('tradeStartAfterHtf').classList.toggle('hidden',!ready||!open);$('sessionTrainingFocus').classList.toggle('hidden',!trainingFocusActive);}
$('toggleEntrySession').addEventListener('click',()=>{entrySessionExpanded=true;syncEntrySession();requestAnimationFrame(()=>$('sessionHub').scrollIntoView({behavior:'smooth',block:'start'}));});

function showSessionHub(){showView('decision');entrySessionExpanded=true;syncEntrySession();requestAnimationFrame(()=>$('entrySessionMount').scrollIntoView({behavior:'smooth',block:'start'}));}
$('navSession')?.addEventListener('click',showSessionHub);
$('quickEntry').addEventListener('click',()=>{if(currentSession)goToTradeEntry();else{showSessionHub();message('Starte zuerst eine Session, dann kannst du einen Trade erfassen.',true);}});
$('quickTrades').addEventListener('click',()=>{showView('journal');requestAnimationFrame(()=>{const target=$('sessionTradeList').querySelector('.trade-open')||$('sessionTrades');target.scrollIntoView({behavior:'smooth',block:'start'});});});
$('journalNewEntry').addEventListener('click',goToTradeEntry);

let authEpoch=0,authStatusSeq=0;
function resetPrivateState(){
 authEpoch++;trainingFocusPending=null;detailTrade=null;journalOpenSeq++;sessionLoadSeq++;summarySeq++; trainingFocusSeq++;trainingFocusActive=null;trainingFocusGoals=[];trainingFocusReady=false;$('trainingGoal').value='';$('trainingPracticeSummary').textContent='';drawTrainingFocus(); clearTimeout(draftTimer);draftDirty=false;draftOwnerId=null;
 clearTimeout(ltfAutosaveTimer);ltfAutosavePending=false;detailRequestSeq++;htfRenderSequence++;trainingLoadVersion++;finishRequestSeq++;
 entryRequestId=null;clearScales($('entryEmotionOptions'));currentSession=null;accounts=[];allAccounts=[];sessionTrades=[];trainingRows=[];analyticsRows=[];analyticsAccountRows=[];analyticsResults=[];trainingMeasures=[];setupCatalog=[];setupCatalogReady=false;ttIdeas=[];ttAttempts=[];editingAccountId=null;tradeCount=0;busy=false;
 const hosts=['accountList','sessionTradeList','tradeDetails','morningBody','trainingList','trainingDetail','analyticsSummary','analyticsDetail','openReviewsBody','progressBody','playbookBody','topFiveBody','setupCards','setupManagerList','htfImagePreview','sessionAccountList','allocationList','sessionSummaryBody','trainingFocusBody','playbookLexicon'];
 for(const id of hosts){const el=$(id);if(el){el.replaceChildren();if(id==='tradeDetails'){el.dataset.tradeId='';el.classList.add('hidden');}}}
 for(const el of document.querySelectorAll('#app input,#app textarea,#app select')){if(el.type==='file')el.value='';else if(el.type==='checkbox')el.checked=el.defaultChecked;else if(el.tagName==='SELECT')el.selectedIndex=0;else el.value=el.defaultValue||'';}
 for(const id of ['accountEditor','otpPanel'])$(id)?.classList.add('hidden');
 $('password').value='';$('otpCode').value='';ttOtpEmail='';
 for(const id of ['app','tabs','homeBar','logout'])$(id).classList.add('hidden');
 for(const key of ['tt7_active_trade_id','tt7_active_view','tt7_scroll_y'])try{sessionStorage.removeItem(key)}catch(_){}
}
async function authStatus(){
 const seq=++authStatusSeq;const {data,error}=await client.auth.getUser();if(seq!==authStatusSeq)return;
 const next=error?null:data?.user;const authError=error?.name==='AuthSessionMissingError'?null:error;
 if(authError){for(const id of ['app','tabs','homeBar'])$(id).classList.add('hidden');$('loginView').classList.remove('hidden');message('Anmeldestatus momentan nicht prüfbar. Lokale Entwürfe bleiben erhalten.',true);return;}
 if(next?.id!==currentUser?.id){const old=currentUser?.id;resetPrivateState();if(old){draftPurgeUser(old);purgeWorkspace(old);}currentUser=next||null;}
 if(next?.id===currentUser?.id&&currentUser&&!$('app').classList.contains('hidden'))return;
 const signed=!!currentUser;$('loginView').classList.toggle('hidden',signed);
 if(!signed){for(const id of ['app','tabs','homeBar','logout'])$(id).classList.add('hidden');message(authError?'Anmeldung erneut prüfen: '+authError.message:'Bitte anmelden.',!!authError);return;}
 const epoch=authEpoch;message('Daten werden geladen …');
 try{applyEmotionLabels();await refresh();if(seq!==authStatusSeq||epoch!==authEpoch)return;for(const id of ['app','tabs','homeBar','logout'])$(id).classList.remove('hidden');message('Angemeldet: '+currentUser.email);}
 catch(e){if(epoch!==authEpoch)return;for(const id of ['app','tabs','homeBar'])$(id).classList.add('hidden');$('logout').classList.remove('hidden');$('loginView').classList.remove('hidden');message('Daten nicht vollständig geladen. Bitte erneut anmelden oder aktualisieren: '+e.message,true);}
}
$('rememberLogin').checked=ttRemember;
$('ttCopyOtpSubject')?.addEventListener('click',()=>navigator.clipboard?.writeText($('ttOtpSubject').value).then(()=>message('Betreff kopiert.')).catch(()=>message('Bitte Betreff manuell kopieren.',true)));
$('ttCopyOtpBody')?.addEventListener('click',()=>navigator.clipboard?.writeText($('ttOtpBody').value).then(()=>message('Nachrichtentext kopiert.')).catch(()=>message('Bitte Nachrichtentext manuell kopieren.',true)));
$('rememberLogin').addEventListener('change',e=>{
 draftFlush();
 ttSetRemember(e.target.checked);
 $('rememberHint').textContent=ttRemember?'Anmeldung auf diesem Gerät speichern. Auf gemeinsam genutzten Geräten deaktivieren.':'Nur in diesem App-Fenster angemeldet bleiben. Nach dem vollständigen Beenden kann eine erneute Anmeldung nötig sein.';
});
let ttOtpSubmitting=false;let ttOtpEmail='';
$('otpCode').addEventListener('input',()=>{
 const input=$('otpCode');input.value=input.value.replace(/\D/g,'').slice(0,10);
 // Keine automatische Bestätigung: Die OTP-Länge kann in Supabase konfiguriert sein.
 // Ein 8-stelliger Code darf niemals nach sechs Ziffern abgeschnitten oder abgeschickt werden.
});
$('login').onclick=async()=>{
 const btn=$('login');if(btn.disabled)return;
 if(!$('email').checkValidity()||!$('email').value.trim()||!$('password').value){message('E-Mail und Passwort eingeben.',true);return;}
 btn.disabled=true;
 try{const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await authStatus();}
 catch(e){message('Anmeldung fehlgeschlagen: '+(e?.message||'Netzwerkfehler'),true)}
 finally{btn.disabled=false}
};
$('magic').onclick=async()=>{
 const email=$('email').value.trim(),btn=$('magic'),notice=$('emailNotice');
 if(!email||!$('email').checkValidity()){notice.classList.remove('hidden');notice.textContent='Bitte zuerst eine gültige E-Mail-Adresse eingeben.';return;}
 btn.disabled=true;ttOtpEmail='';notice.classList.add('hidden');$('otpCode').value='';$('otpPanel').classList.add('hidden');
 try{
  const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false}});
  if(error)throw error;
  ttOtpEmail=email;
  $('otpPanel').classList.remove('hidden');
  $('otpCode').focus();
  notice.textContent='E-Mail angefordert. Wenn iOS den Code erkennt, erscheint er über der Tastatur. Sonst bitte manuell eingeben. Die Supabase-E-Mail-Vorlage muss {{ .Token }} enthalten.';
  notice.classList.remove('hidden');
 }catch(error){notice.textContent='Anforderung fehlgeschlagen: '+(error?.message||'Netzwerkfehler');notice.classList.remove('hidden');message(notice.textContent,true)}
 finally{btn.disabled=false}
};
$('verifyOtp').onclick=async()=>{
 if(ttOtpSubmitting)return;
 const email=$('email').value.trim(),token=$('otpCode').value.trim(),btn=$('verifyOtp'),notice=$('emailNotice');
 if(!email||email!==ttOtpEmail||!$('email').checkValidity()||!/^[0-9]{6,10}$/.test(token)){notice.textContent='Bitte den vollständigen 6- bis 10-stelligen Code für die angeforderte E-Mail-Adresse eingeben. Bei geänderter Adresse neuen Code anfordern.';notice.classList.remove('hidden');return;}
 ttOtpSubmitting=true;btn.disabled=true;
 try{
  const {error}=await client.auth.verifyOtp({email,token,type:'email'});
  if(error)throw error;
  $('otpCode').value='';ttOtpEmail='';$('otpPanel').classList.add('hidden');notice.classList.add('hidden');
  await authStatus();
 }catch(error){notice.textContent='Code-Anmeldung fehlgeschlagen: '+(error?.message||'Netzwerkfehler');notice.classList.remove('hidden');message(notice.textContent,true)}
 finally{btn.disabled=false;ttOtpSubmitting=false}
};
$('logout').onclick=async()=>{
 const old=currentUser?.id;draftFlush();if(old)purgeWorkspace(old);resetPrivateState();currentUser=null;authStatusSeq++;if(old)draftPurgeUser(old);
 $('loginView').classList.remove('hidden');
 const {error}=await client.auth.signOut();
 if(error){ttAuthStorage.removeItem(TT_AUTH_KEY);message('Lokal abgemeldet. Server-Abmeldung nicht bestätigt: '+error.message,true);}else message('Abgemeldet.');
};
let workspaceRestoring=false;
function workspaceKey(owner=currentUser?.id){return owner?'tt7_workspace_v736:'+owner:null;}
function purgeWorkspace(owner){for(const storage of [localStorage,sessionStorage])try{storage.removeItem(workspaceKey(owner))}catch(_){}}
function captureFields(root){return [...root.querySelectorAll('input:not([type=file]),select,textarea')].filter(el=>el.id||el.dataset.id||el.dataset.check||el.dataset.note||el.dataset.scale).map(el=>({id:el.id,cls:el.className,account:el.dataset.id,check:el.dataset.check,note:el.dataset.note,scale:el.dataset.scale,group:el.closest('[data-scale-group]')?.dataset.scaleGroup,type:el.type,value:el.value,checked:el.checked,rated:el.dataset.rated}));}
function applyFields(root,rows){for(const row of rows||[]){const el=row.id?$(row.id):[...root.querySelectorAll('input,select,textarea')].find(el=>row.account?el.dataset.id===row.account&&el.className===row.cls:row.check?el.dataset.check===row.check:row.note?el.dataset.note===row.note:row.scale?el.dataset.scale===row.scale&&el.closest('[data-scale-group]')?.dataset.scaleGroup===row.group:false);if(!el||!root.contains(el))continue;if(el.type==='checkbox'||el.type==='radio')el.checked=!!row.checked;else el.value=row.value;if(row.rated)el.dataset.rated=row.rated;}updateScaleLabels(root);}
function saveWorkspace(){if(!currentUser||workspaceRestoring||$('app').classList.contains('hidden'))return;try{const item={version:1,owner:currentUser.id,session:currentSession?.id||null,at:Date.now(),view:[...document.querySelectorAll('#app>section[id$="View"]')].find(el=>!el.classList.contains('hidden'))?.id.replace('View','')||'live',scroll:window.scrollY,expanded:entrySessionExpanded,setup:$('setup').value,request:entryRequestId,fields:captureFields($('decisionView')),sessionFields:captureFields($('sessionHub')),details:[...document.querySelectorAll('#decisionView details')].map((el,i)=>({id:el.id,index:i,open:el.open})),setupOpen:!$('sessionSetup').classList.contains('hidden'),sessionDraftMode};const storage=ttRemember?localStorage:sessionStorage;storage.setItem(workspaceKey(),JSON.stringify(item));(ttRemember?sessionStorage:localStorage).removeItem(workspaceKey());}catch(_){}}
function readWorkspace(){try{const raw=[localStorage,sessionStorage].map(st=>{try{return JSON.parse(st.getItem(workspaceKey())||'null')}catch(_){return null}}).filter(x=>x?.owner===currentUser?.id&&Date.now()-x.at<86400000).sort((a,b)=>b.at-a.at);return raw[0]||null;}catch(_){return null;}}
function restoreWorkspace(item){if(!item||item.owner!==currentUser?.id||item.session!==(currentSession?.id||null))return;workspaceRestoring=true;try{entrySessionExpanded=!!item.expanded;if(item.setupOpen){sessionDraftMode=item.sessionDraftMode||'start';renderSessionAccounts();$('sessionSetup').classList.remove('hidden');$('noSession').classList.add('hidden');}applyFields($('decisionView'),item.fields);applyFields($('sessionHub'),item.sessionFields);$('setup').value=item.setup||'';entryRequestId=item.request||null;renderSetupCards();syncDirectionButtons();ttRefreshIdeaMode();updateEntryAccountMode();updateEntryRiskPreview();for(const d of item.details||[]){const el=d.id?$(d.id):$('decisionView').querySelectorAll('details')[d.index];if(el)el.open=d.open;}syncEntrySession();}finally{workspaceRestoring=false;}}
document.addEventListener('input',e=>{if(e.target.closest('#decisionView'))saveWorkspace();});document.addEventListener('change',e=>{if(e.target.closest('#decisionView'))saveWorkspace();});
window.addEventListener('pagehide',saveWorkspace);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveWorkspace();});
window.addEventListener('scroll',()=>{if(!document.hidden)saveWorkspace();},{passive:true});

async function refresh(){
  let savedView='live',savedTrade='',savedScroll=0;
  try{savedView=sessionStorage.getItem('tt7_active_view')||localStorage.getItem('tt7_active_view')||'live';savedTrade=sessionStorage.getItem('tt7_active_trade_id')||'';savedScroll=Number(sessionStorage.getItem('tt7_scroll_y')||0)}catch(_){}
  const workspace=readWorkspace();
  await loadSetupCatalog();await loadAccounts();await loadSession();renderDecision();
  restoreWorkspace(workspace);
  if(workspace&&workspace.session===(currentSession?.id||null)){savedView=workspace.view||savedView;savedScroll=workspace.scroll||0;}
  await Promise.all([loadMorningDashboard(),loadProgressAndPlaybook(),loadTraining(),loadAnalytics(),loadOpenReviews()]);
  showView(['live','decision','journal','accounts','analytics','training','playbook','settings'].includes(savedView)?savedView:'live');
  if(savedTrade&&savedView==='journal'){
    const found=sessionTrades.find(t=>t.id===savedTrade);
    if(found)try{await openTradeDetails(found)}catch(e){console.warn('Trade-Wiederherstellung:',e)}
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,savedScroll),behavior:'instant'})));
}
async function loadSession(){const {data,error}=await client.from('trading_sessions').select('id,session_date,status,htf_context,created_at').eq('status','open').order('created_at',{ascending:false}).limit(1);if(error)throw new Error('Session laden: '+error.message);currentSession=data?.[0]??null;renderSession();await loadCount();await loadSessionTrades();await ttLoadIdeas();await renderHtfImage();}
function renderSession(){syncEntrySession();$('sessionHubState').classList.toggle('stale-session',!!currentSession&&currentSession.session_date!==localDate());$('sessionHubState').textContent=currentSession?(currentSession.session_date!==localDate()?'⚠ ALTE SESSION '+currentSession.session_date+' – vor neuer Session abschließen':'● Aktive Session: '+currentSession.session_date+' · HTF gilt für alle zugehörigen Trades'):'○ Keine offene Session · Neue Session starten und HTF vorbereiten';$('noSession').classList.toggle('hidden',!!currentSession);$('sessionSetup').classList.add('hidden');$('activeSession').classList.toggle('hidden',!currentSession);$('sessionFinishPanel').classList.toggle('hidden',!currentSession);if(currentSession)refreshSessionFinishChecklist();else{$('sessionFinishChecklist').textContent='Keine aktive Session.';$('closeSession').disabled=true;}$('sessionState').textContent=currentSession?(currentSession.session_date===localDate()?'Heute · offen':'Alt · '+currentSession.session_date):'Keine';$('sessionInfo').textContent=currentSession?'Datum: '+currentSession.session_date:'';$('htf').value=currentSession?.htf_context?.free_notes??(currentSession?.htf_context?.structured_notes?'':currentSession?.htf_context?.notes??'');buildScaleGroup($('sessionMoodOptions'),'session',currentSession?.htf_context?.mental_check?.scales);document.querySelectorAll('.htf-note').forEach(el=>el.value=currentSession?.htf_context?.structured_notes?.[el.dataset.note]||'');$('sessionUrge').value=currentSession?.htf_context?.mental_check?.urge||'';$('decisionSession').textContent=currentSession?'Aktive Session: '+currentSession.session_date:'Bitte zuerst eine Session starten.';const checks=currentSession?.htf_context?.preflight_checks||{};
document.querySelectorAll('.htf-check').forEach(el=>{el.checked=!!checks[el.dataset.check]});
updateSessionCheckStatus();
const selection=currentSession?.htf_context?.selected_accounts||[];$('sessionAccountsSummary').textContent=selection.length?'Verfügbar in dieser Session: '+selection.map(x=>{const a=accounts.find(a=>a.id===x.account_id);return (a?.account_name||'Konto')+' · verfügbar'}).join(' | '):'Noch keine Session-Kontenauswahl gespeichert.';}
function updateSessionCheckStatus(){
 const items=[...document.querySelectorAll('.htf-check')],done=items.filter(el=>el.checked).length;
 $('sessionCheckStatus').textContent=`${done}/${items.length} Checks erledigt${done===items.length?(sessionContextText()?' · Kontext speichern':' · mindestens eine Kontextnotiz ergänzen'):' · offene Punkte vor Entry beachten'}`;
}
document.querySelectorAll('.htf-check').forEach(el=>el.addEventListener('change',updateSessionCheckStatus));document.querySelectorAll('.htf-note,#htf').forEach(el=>el.addEventListener('input',updateSessionCheckStatus));
const berlinTime=iso=>iso?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(iso)):'–';
let sessionTrades=[],detailTrade=null,journalOpenSeq=0,sessionLoadSeq=0,summarySeq=0;
function detailTradeById(id){return detailTrade?.id===id?detailTrade:(sessionTrades.find(t=>t.id===id)||null);}
function applyTradePatch(trade,patch){Object.assign(trade,patch);for(const row of sessionTrades)if(row.id===trade.id&&row!==trade)Object.assign(row,patch);if(detailTrade?.id===trade.id&&detailTrade!==trade)Object.assign(detailTrade,patch);}
async function openJournalTradeById(id){
 const seq=++journalOpenSeq;const {data,error}=await client.from('trades').select('id,session_id,setup_type,direction,instrument,entry_at,exit_at,entry_emotion,exit_emotion,execution_grade,rule_deviation,observations,realized_pnl_usd,initial_risk_usd,exit_reason,deviation_reason').eq('id',id).maybeSingle();
 if(seq!==journalOpenSeq)return;if(error)throw error;if(!data)throw new Error('Trade nicht gefunden oder nicht zugänglich.');
 showView('journal');$('sessionTrades').classList.remove('hidden');await openTradeDetails(data);$('tradeDetails').scrollIntoView({behavior:'smooth',block:'start'});
}
function reviewIsComplete(t){
 if(!t.exit_at||!t.observations?.compliance_reviewed||!t.execution_grade||t.execution_grade==='unrated')return false;
 const errors=reviewErrors(t);if(errors.some(e=>!e.type||!e.countermeasure?.trim()))return false;
 if(t.rule_deviation&&!errors.some(e=>e.confirmed_breach))return false;
 if(!t.rule_deviation&&errors.some(e=>e.confirmed_breach))return false;
 if(t.observations?.limit_exception?.exceeded&&!['accepted','breach'].includes(t.observations?.exception_reviews?.['daily-limit']))return false;
 if(Object.values(t.observations?.exception_reviews||{}).some(x=>x==='pending'))return false;
 const focus=t.observations?.training_focus,practice=t.observations?.training_practice;
 return !focus?.goal_id||(practice?.goal_id===focus.goal_id&&['no_opportunity','followed','partial','missed'].includes(practice.result));
}
function documentedErrorRate(part){const reviewed=part.filter(t=>t.observations?.compliance_reviewed);const open=part.length-reviewed.length;return reviewed.length?Math.round(100*reviewed.filter(t=>reviewErrors(t).length).length/reviewed.length)+' % ('+reviewed.length+' geprüft, '+open+' ungeprüft)':'nicht berechenbar ('+open+' ungeprüft)';}
function finiteValue(v){return (typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));}
function allocationSummary(allocations,results){
 const finals=results.filter(r=>r.result_status==='final'&&finiteValue(r.realized_pnl_usd));
 const byId=new Map(finals.map(r=>[r.allocation_id,r]));
 const completeResults=allocations.length>0&&allocations.every(a=>byId.has(a.id));
 const completeRisk=allocations.length>0&&allocations.every(a=>finiteValue(a.initial_risk_usd)&&Number(a.initial_risk_usd)>0);
 const pnl=allocations.reduce((n,a)=>n+Number(byId.get(a.id)?.realized_pnl_usd||0),0),fees=allocations.reduce((n,a)=>n+Number(byId.get(a.id)?.fees_usd||0),0),risk=allocations.reduce((n,a)=>n+Number(a.initial_risk_usd||0),0);
 return {pnl,fees,risk,completeResults,completeRisk,rMultiple:completeResults&&completeRisk?pnl/risk:null};
}

async function loadSessionTrades(){
  const seq=++sessionLoadSeq;const sessionId=currentSession?.id;journalOpenSeq++;
  const wrap=$('sessionTrades'), list=$('sessionTradeList'), details=$('tradeDetails');
  wrap.classList.toggle('hidden',!currentSession);
  draftFlush();detailRequestSeq++;
  details.classList.add('hidden');details.innerHTML='';details.dataset.tradeId='';
  sessionTrades=[];detailTrade=null;
  if(!currentSession){$('sessionSummary').classList.add('hidden');return;}
  $('sessionSummary').classList.remove('hidden');
  list.textContent='Lade Trades …';
  const {data,error}=await client.from('trades')
    .select('id,setup_type,instrument,direction,entry_at,exit_at,entry_emotion,exit_emotion,realized_pnl_usd,exit_reason,initial_risk_usd,rule_deviation,execution_grade,observations,deviation_reason')
    .eq('session_id',sessionId).order('entry_at',{ascending:false}).limit(100);
  if(seq!==sessionLoadSeq||currentSession?.id!==sessionId)return;
  if(error){list.textContent='Trades konnten nicht geladen werden: '+error.message;$('sessionSummaryBody').textContent='Auswertung nicht verfügbar – Trades konnten nicht geladen werden.';return}
  sessionTrades=data||[];
  refreshSessionFinishChecklist();
  await renderSessionSummary(sessionTrades);
  if(seq!==sessionLoadSeq||currentSession?.id!==sessionId)return;
  if(sessionTrades.length===100){$('sessionSummaryBody').insertAdjacentHTML('beforeend','<p class="notice">Achtung: Maximal 100 Trades geladen. Die Auswertung kann unvollständig sein.</p>');}
  list.innerHTML=sessionTrades.length?sessionTrades.map(t=>
    `<div class="account ${t.exit_at?'trade-closed':'trade-open'}"><div class="row"><div><strong>${escapeHtml(t.setup_type)} · ${escapeHtml(t.direction.toUpperCase())} ${escapeHtml(t.instrument)}</strong><div class="muted">${escapeHtml(berlinTime(t.entry_at))} · ${t.exit_at?'Abgeschlossen':'Offen'}</div></div><button type="button" class="secondary open-trade" data-id="${t.id}">Öffnen</button></div></div>`
  ).join(''):'<p class="muted">Noch keine Entries in dieser Session.</p>';
}
async function renderSessionSummary(trades){
 const target=$('sessionSummaryBody'),seq=++summarySeq;
 const closed=trades.filter(t=>t.exit_at),open=trades.length-closed.length;
 const total=closed.reduce((n,t)=>n+Number(t.realized_pnl_usd||0),0);
 let risk=closed.reduce((n,t)=>n+Number(t.initial_risk_usd||0),0);
 let riskComplete=closed.length>0&&closed.every(t=>t.initial_risk_usd!=null&&Number(t.initial_risk_usd)>0);
 const reviewedTrades=trades.filter(t=>t.observations?.compliance_reviewed);
 const withoutMarkedDeviation=reviewedTrades.filter(t=>!t.rule_deviation).length;
 const graded=trades.filter(t=>t.execution_grade&&t.execution_grade!=='unrated');
 const aPlus=graded.filter(t=>t.execution_grade==='A+').length;
 let resultsComplete=closed.length>0;const accountRows=[];
 if(closed.length){
   const ids=closed.map(t=>t.id);
   const {data:alloc,error:allocError}=await client.from('trade_account_allocations').select('id,trade_id,account_id,initial_risk_usd').in('trade_id',ids);
   if(seq!==summarySeq)return;if(allocError){target.textContent='Konten-Auswertung nicht verfügbar: '+allocError.message;return;}
   const allocations=alloc||[];resultsComplete=closed.every(t=>allocations.some(a=>a.trade_id===t.id));if(!allocations.length)riskComplete=false;
   if(allocations.length){
     const {data:results,error:resultsError}=await client.from('account_trade_results').select('allocation_id,realized_pnl_usd,result_status').in('allocation_id',allocations.map(a=>a.id));
     if(seq!==summarySeq)return;if(resultsError){target.textContent='Kontoergebnisse nicht verfügbar: '+resultsError.message;return;}
     const totals=allocationSummary(allocations,results||[]);risk=totals.risk;riskComplete=totals.completeRisk;resultsComplete=resultsComplete&&totals.completeResults;
     const byAccount=new Map();
     for(const a of allocations){const rows=byAccount.get(a.account_id)||[];rows.push(a);byAccount.set(a.account_id,rows);}
     for(const [id,rows] of byAccount){
       const v=allocationSummary(rows,results||[]),name=allAccounts.find(a=>a.id===id)?.account_name||'Konto';
       accountRows.push(`<div class="row"><span>${escapeHtml(name)} · ${rows.length} Trades</span><strong>${usd(v.pnl)} USD${v.completeResults?'':' (Ergebnisse unvollständig)'} · ${v.rMultiple===null?'R offen':v.rMultiple.toFixed(2)+' R'}</strong></div>`);
     }
   }
 }
 target.innerHTML=`<div class="grid"><div class="stat"><small>Entscheidungen</small><strong>${trades.length}</strong></div><div class="stat"><small>Offen / abgeschlossen</small><strong>${open} / ${closed.length}</strong></div><div class="stat"><small>Realisiert (USD)</small><strong>${usd(total)}</strong></div><div class="stat"><small>Realisiertes R</small><strong>${closed.length&&resultsComplete&&riskComplete&&risk>0?(total/risk).toFixed(2):'–'}</strong></div></div><p class="muted">Geprüft ohne Regelbruch: ${withoutMarkedDeviation} / ${reviewedTrades.length} geprüfte Trades (${trades.length-reviewedTrades.length} ungeprüft). A+: ${aPlus} / ${graded.length} bewerteten Trades. Nicht bewertete Trades zählen nicht zur A+-Quote.</p>${accountRows.length?'<h3>Ergebnisse je Konto</h3>'+accountRows.join(''):''}<p class="muted">Nur abgeschlossene Trades zählen zum P&L und R. Session-R = Summe der eingegebenen P&L / Summe ursprünglicher Risiken; kein Durchschnitt einzelner R-Werte. Gebühren werden separat gespeichert und nicht zusätzlich abgezogen. P&L-Eingabe ist brutto vor Gebühren; Netto = Brutto minus Gebühren. Keine Broker-Synchronisation.</p>`;
}
$('reloadTrades').onclick=loadSessionTrades;
const tickValues={NQ:5,MNQ:0.5,ES:12.5,MES:1.25};
const stopReasonLabels={market_structure:'Marktstruktur',momentum_loss:'Momentumverlust',absorption:'Absorption',profit_protection:'Gewinnsicherung',fear_of_giving_back:'Angst vor Gewinnabgabe',poor_entry:'Schlechter Entry',other:'Sonstiges'};
const ticksToPoints=ticks=>ticks*0.25;
const pointsToTicks=points=>Number(points)*4;
const usd=n=>Number(n).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const riskRound=n=>Math.round((n+Number.EPSILON)*100)/100;
function riskCard(a,names,closed,history=[]){
  const recorded=a.initial_risk_usd!=null;
  const ticks=a.initial_sl_points==null?'':escapeHtml(pointsToTicks(a.initial_sl_points));
  const override=!!a.risk_manually_overridden;
  return `<div class="account risk-card" data-recorded="${recorded}" data-id="${a.id}" data-instrument="${escapeHtml(a.instrument)}" data-qty="${escapeHtml(a.planned_quantity)}">
    <strong>${escapeHtml(names.get(a.account_id)||'Unbekanntes Konto')}</strong>
    <div class="muted">${escapeHtml(a.role)} · ${escapeHtml(a.instrument)} × ${escapeHtml(a.planned_quantity)} · ${recorded?'Initialrisiko: '+usd(a.initial_risk_usd)+' USD':'Initialrisiko: nicht erfasst'}</div>
    <label>Ursprünglicher SL-Abstand (Ticks)
      <input class="risk-ticks" type="number" inputmode="numeric" min="1" step="1" placeholder="z. B. 40" value="${ticks}" ${(closed||recorded)?'disabled':''}>
    </label>
    <div class="muted">Berechnetes Risiko: <strong class="risk-calc">${a.calculated_risk_usd==null?'–':usd(a.calculated_risk_usd)+' USD'}</strong></div>
    <label style="margin-top:12px"><input class="risk-override" type="checkbox" style="display:inline;width:auto;margin-right:8px" ${override?'checked':''} ${(closed||recorded)?'disabled':''}>Risiko manuell korrigieren</label>
    <label>Maßgebliches Initialrisiko (USD)
      <input class="risk-usd" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="Wird berechnet" value="${recorded?escapeHtml(a.initial_risk_usd):''}" ${(!override||closed||recorded)?'disabled':''}>
    </label>
    ${closed||recorded?'<p class="muted">Ursprüngliches Risiko gespeichert und für die R-Auswertung gesperrt.</p>':`<button type="button" class="secondary wide save-risk" data-id="${a.id}" hidden>Fehlendes Alt-Risiko einmalig speichern</button>`}
    <small class="risk-note muted">${recorded?'Initialrisiko bleibt unverändert. SL-Anpassungen separat dokumentieren.':'Noch nicht gespeichert.'}</small>
    <div class="stop-panel" style="border-top:1px solid var(--line);margin-top:12px;padding-top:10px" data-allocation-id="${a.id}">
      <label class="stop-toggle-label"><input type="checkbox" class="stop-toggle" style="display:inline;width:auto;margin-right:10px"  ${closed?'disabled':''}>SL-Verschiebung erfassen <span class="stop-toggle-hint">Antippen, um neuen SL und Grund einzugeben</span></label>
      <div class="stop-fields" hidden>
      <h3>SL-Verschiebungen</h3>
      <p class="muted">Aktueller SL: <strong>${recorded?(history.length?history[0].new_stop_ticks:-pointsToTicks(a.initial_sl_points))+' Ticks':'Erst Initialrisiko speichern'}</strong> · relativ zum Entry (− Verlustseite, 0 BE, + Gewinnseite)</p>
      ${recorded&&!closed?`<label for="stop-${a.id}">Neuer SL relativ zum Entry (Ticks)</label>
      <div class="stop-stepper"><button type="button" class="secondary stop-minus" aria-label="SL um einen Tick verringern">−</button><input id="stop-${a.id}" class="stop-new" type="text" inputmode="numeric" pattern="-?[0-9]+" autocomplete="off" placeholder="z. B. -20"><button type="button" class="secondary stop-plus" aria-label="SL um einen Tick erhöhen">+</button></div>
      <div class="stop-presets">${[-40,-20,-10,0,10,20].map(v=>`<button type="button" class="secondary stop-preset" data-ticks="${v}">${v===0?'BE':v>0?'+'+v:v}</button>`).join('')}</div>
      <label>Grund auswählen</label><input class="stop-reason" type="hidden" value="">
      <div class="stop-reason-buttons">${[['market_structure','Marktstruktur'],['momentum_loss','Momentumverlust'],['absorption','Absorption'],['profit_protection','Gewinnsicherung'],['fear_of_giving_back','Angst vor Gewinnabgabe'],['poor_entry','Schlechter Entry'],['other','Sonstiges']].map(([value,label])=>`<button type="button" class="secondary stop-reason-choice" data-reason="${value}" aria-pressed="false">${label}</button>`).join('')}</div>
      <label>Ausnahmebegründung bei Risikoerhöhung (optional)<textarea class="stop-notes" rows="2" placeholder="Warum wurde der SL verschoben?"></textarea></label>
      <button type="button" class="secondary wide save-stop" data-id="${a.id}" data-previous="${history.length?history[0].new_stop_ticks:-pointsToTicks(a.initial_sl_points)}">SL-Verschiebung speichern</button>`:''}
      <h3 style="margin-top:14px">SL-Verlauf</h3>
      ${history.length?history.map(h=>`<div class="account"><strong>${escapeHtml(h.previous_stop_ticks)} → ${escapeHtml(h.new_stop_ticks)} Ticks</strong><div class="muted">${escapeHtml(berlinTime(h.changed_at))} · ${escapeHtml(stopReasonLabels[h.reason]||h.reason)}</div>${h.notes?`<small>${escapeHtml(h.notes)}</small>`:''}</div>`).join(''):'<p class="muted">Noch keine SL-Verschiebungen dokumentiert.</p>'}
      </div>
    </div>
  </div>`;
}
function updateRiskCard(card){
  const p=card.querySelector('.risk-ticks');
  const manual=card.querySelector('.risk-override');
  const field=card.querySelector('.risk-usd');
  const calc=card.querySelector('.risk-calc');
  const ticks=Number(p.value),qty=Number(card.dataset.qty),value=tickValues[card.dataset.instrument];
  const valid=p.value.trim()!==''&&Number.isSafeInteger(ticks)&&ticks>0&&Number.isFinite(qty)&&qty>0&&!!value;
  const amount=valid?riskRound(ticks*qty*value):null;
  calc.textContent=amount===null?'–':usd(amount)+' USD';
  field.disabled=card.dataset.recorded==='true'||!manual.checked;
  if(!manual.checked)field.value=amount===null?'':amount.toFixed(2);
  return amount;
}

const DRAFT_PREFIX='tt7_draft_v3';
const draftKey=id=>currentUser&&id?`${DRAFT_PREFIX}:${currentUser.id}:${id}`:null;
const draftStorage=()=>ttRemember?localStorage:sessionStorage;
// Legacy-Entwürfe beim ersten Lesen sicher in den aktuell gewählten Speicher übernehmen.
function draftStoredRaw(key){
 try{
   const primary=draftStorage(),alternate=ttRemember?sessionStorage:localStorage;
   const raw=primary.getItem(key),legacy=alternate.getItem(key);
   const valid=text=>{try{const d=JSON.parse(text);return d?.version===1&&d.tradeId&&Number.isFinite(d.savedAt)?d:null;}catch(_){return null;}};
   const current=valid(raw),other=valid(legacy);
   if(other&&(!current||other.savedAt>current.savedAt)){
     // Recover the newest valid draft even if both stores contain the same key.
     primary.setItem(key,legacy);alternate.removeItem(key);return legacy;
   }
   return current?raw:null;
 }catch(_){return null;}
}
function draftPurgeUser(userId){
 if(!userId)return;
 const prefix=`${DRAFT_PREFIX}:${userId}:`;
 for(const store of [localStorage,sessionStorage]){
   try{for(let i=store.length-1;i>=0;i--){const key=store.key(i);if(key?.startsWith(prefix))store.removeItem(key)}}catch(_){}
 }
}
function draftMoveUser(userId,remember){
 if(!userId)return;
 const prefix=`${DRAFT_PREFIX}:${userId}:`;
 const from=remember?sessionStorage:localStorage,to=remember?localStorage:sessionStorage;
 try{for(let i=from.length-1;i>=0;i--){
   const key=from.key(i);if(!key?.startsWith(prefix))continue;
   const value=from.getItem(key);
   if(value!==null){
     // Vorhandene neuere Entwürfe niemals durch ältere Entwürfe überschreiben.
     const target=to.getItem(key);
     let shouldCopy=target===null;
     if(target!==null){
       try{shouldCopy=(JSON.parse(value)?.savedAt||0)>(JSON.parse(target)?.savedAt||0)}
       catch(_){shouldCopy=false}
     }
     if(shouldCopy)to.setItem(key,value);
     if(to.getItem(key)!==null)from.removeItem(key);
   }
 }}catch(_){}
}
let draftTimer=null;let draftOwnerId=null;
function draftRead(id){
 const key=draftKey(id);if(!key)return null;
 try{const raw=draftStoredRaw(key);if(!raw)return null;
 const item=JSON.parse(raw);
 return item?.version===1&&item.tradeId===id&&Date.now()-item.savedAt<30*86400000?item:null;
 }catch(_){return null;}
}
function draftCapture(){
 const panel=$('tradeDetails'),id=panel.dataset.tradeId;
 if(!id||panel.classList.contains('hidden'))return null;
 const analysis=panel.querySelector('.ltf-analysis'),review=panel.querySelector('.review-editor');
 return {version:1,tradeId:id,savedAt:Date.now(),exit:snapshotExitDraft(),
 analysis:analysis?{checks:Object.fromEntries([...analysis.querySelectorAll('[data-analysis]')].map(el=>[el.dataset.analysis,el.checked])),note:analysis.querySelector('.analysis-note').value}:null,
 review:review?{grade:review.querySelector('.review-grade').value,compliance:review.querySelector('.review-compliance').value,
 error:review.querySelector('.review-error').value,exitEmotion:selectedEmotion(review.querySelector('[data-emotion-group="exitEmotion"]')),action:review.querySelector('.review-action').value,
 practice:collectTrainingPractice(review,{observations:{training_focus:{goal_id:review.querySelector('.training-practice-review')?.dataset.goalId}}}),errors:collectReviewErrors(review),exceptions:collectExceptionDecisions(review),note:review.querySelector('.review-note').value,playbook:review.querySelector('.review-playbook').checked}:null};
}
function draftSave(){
 const item=draftCapture(),key=item&&draftKey(item.tradeId);
 if(!key)return;
 try{draftStorage().setItem(key,JSON.stringify(item));
 const status=$('tradeDetails').querySelector('.draft-status');
 if(status)status.textContent='Lokaler Entwurf gesichert · nicht synchronisiert';
 }catch(err){const status=$('tradeDetails').querySelector('.draft-status');if(status)status.textContent='Lokale Sicherung nicht möglich: '+err.message;}
}
let draftDirty=false;
function draftSchedule(){draftOwnerId=currentUser?.id||null;draftDirty=true;clearTimeout(draftTimer);draftTimer=setTimeout(()=>{if(draftOwnerId===currentUser?.id)draftSave();draftDirty=false;draftOwnerId=null;},350);}
function draftFlush(){if(draftDirty){clearTimeout(draftTimer);if(draftOwnerId===currentUser?.id)draftSave();draftDirty=false;draftOwnerId=null;}}
function draftMarkSaved(id,section){
 draftFlush();
 const key=draftKey(id);if(!key)return;
 try{const item=draftRead(id);if(!item)return;
 item[section]=null;
 if(!item.exit&&!item.analysis&&!item.review){localStorage.removeItem(key);sessionStorage.removeItem(key);}
 else draftStorage().setItem(key,JSON.stringify(item));
 }catch(_){}
}

function draftRestore(item){
 if(!item)return;
 const panel=$('tradeDetails');
 if(item.exit&&panel.querySelector('.exit-editor'))restoreExitDraft(item.exit);
 const analysis=panel.querySelector('.ltf-analysis');
 if(analysis&&item.analysis){
 analysis.querySelectorAll('[data-analysis]').forEach(el=>el.checked=!!item.analysis.checks?.[el.dataset.analysis]);
 analysis.querySelector('.analysis-note').value=item.analysis.note||'';
 }
 const review=panel.querySelector('.review-editor');
 if(review&&item.review){
 const v=item.review;
 review.querySelector('.review-grade').value=v.grade||'';
 review.querySelector('.review-compliance').value=v.compliance||'unknown';
 review.querySelector('.review-error').value=v.error||'';
 review.querySelector('.review-action').value=v.action||'';
 review.querySelector('.review-note').value=v.note||'';
 review.querySelector('.review-playbook').checked=!!v.playbook;setEmotion(review.querySelector('[data-emotion-group="exitEmotion"]'),v.exitEmotion||'');
 }
 const status=panel.querySelector('.draft-status');
 if(status)status.textContent='Lokalen Entwurf wiederhergestellt · bitte Eingaben prüfen';
}
$('tradeDetails').addEventListener('input',e=>{if(e.target.closest('.exit-editor,.ltf-analysis,.review-editor'))draftSchedule();});
$('tradeDetails').addEventListener('change',e=>{if(e.target.closest('.exit-editor,.ltf-analysis,.review-editor'))draftSchedule();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){draftFlush();}});window.addEventListener('pagehide',()=>{draftFlush();});

function snapshotExitDraft(){
  const editor=document.querySelector('#tradeDetails .exit-editor');
  if(!editor)return null;
  return {scales:readScales(editor.querySelector('[data-emotion-group="exitCommitEmotion"]')),reason:editor.querySelector('.exit-reason')?.value||'',emotion:selectedEmotion(editor.querySelector('[data-emotion-group="exitCommitEmotion"]')),emotions:[...editor.querySelectorAll('[data-emotion-group="exitCommitEmotion"] button[aria-pressed="true"]')].map(b=>b.dataset.value),
    accounts:[...editor.querySelectorAll('.exit-account')].map(c=>({
      id:c.dataset.id,unit:c.querySelector('.exit-unit')?.value||'ticks',
      amount:c.querySelector('.exit-amount')?.value||'',fees:c.querySelector('.exit-fees')?.value||''
    }))};
}
function restoreExitDraft(draft){
  if(!draft)return;
  const editor=document.querySelector('#tradeDetails .exit-editor');
  if(!editor)return;
  editor.querySelector('.exit-reason').value=draft.reason||'';
  const exitGroup=editor.querySelector('[data-emotion-group="exitCommitEmotion"]');if(draft.scales)buildScaleGroup(exitGroup,'exitCommitEmotion',draft.scales);
  const restored=(Array.isArray(draft.emotions)?draft.emotions:(draft.emotion?[draft.emotion]:[])).filter(v=>typeof v==='string');
  exitGroup?.querySelectorAll('button[data-value]').forEach(b=>{const on=restored.includes(b.dataset.value);b.setAttribute('aria-pressed',String(on));b.classList.toggle('emotion-selected',on);});
  for(const item of (Array.isArray(draft.accounts)?draft.accounts:[])){
    const c=[...editor.querySelectorAll('.exit-account')].find(el=>el.dataset.id===item.id);
    if(!c)continue;
    c.querySelector('.exit-unit').value=item.unit;
    c.querySelector('.exit-amount').value=item.amount;
    c.querySelector('.exit-fees').value=item.fees;
  }
  updateExitPreview(editor);
}
function rememberAccountPosition(node){const card=node?.closest('.risk-card');return {id:card?.dataset.id||null,top:card?.getBoundingClientRect().top??0,scrollY:window.scrollY};}
function restoreAccountPosition(pos){requestAnimationFrame(()=>{const card=[...document.querySelectorAll('#tradeDetails .risk-card')].find(c=>c.dataset.id===pos.id);if(card)window.scrollBy({top:card.getBoundingClientRect().top-pos.top,behavior:'instant'});else window.scrollTo({top:pos.scrollY,behavior:'instant'});});}
function jumpToAccount(id){const card=[...document.querySelectorAll('#tradeDetails .risk-card')].find(c=>c.dataset.id===id);if(card)card.scrollIntoView({behavior:'smooth',block:'start'});}
let detailRequestSeq=0;
async function openTradeDetails(trade){
 if(ltfAutosaveTimer){clearTimeout(ltfAutosaveTimer);ltfAutosaveTimer=null;await flushLtfAutosave();}
  draftFlush();detailTrade=trade;
  const requestSeq=++detailRequestSeq;
  const panel=$('tradeDetails');const previousOpen=panel.dataset.tradeId===trade.id?[...panel.querySelectorAll('details[open]')].map((d,i)=>d.className||'detail-'+i):[];try{sessionStorage.setItem('tt7_active_trade_id',trade.id)}catch(_){};panel.dataset.tradeId=trade.id;panel.classList.remove('hidden');panel.textContent='Kontozuordnungen werden geladen …';
  try{
    const {data,error}=await client.from('trade_account_allocations')
      .select('id,account_id,role,instrument,planned_quantity,initial_sl_points,calculated_risk_usd,initial_risk_usd,risk_manually_overridden')
      .eq('trade_id',trade.id);
    if(error)throw error;
    const ids=(data||[]).map(a=>a.id);
    let stopHistory=[];
    if(ids.length){
      const {data:stopData,error:stopError}=await client.from('stop_adjustments')
        .select('id,allocation_id,previous_stop_ticks,new_stop_ticks,changed_at,reason,notes')
        .in('allocation_id',ids).order('changed_at',{ascending:false}).order('id',{ascending:false});
      if(stopError)throw stopError;
      stopHistory=stopData||[];
    }
    const histories=new Map(ids.map(id=>[id,stopHistory.filter(h=>h.allocation_id===id)]));
    trade._stopExceptions=stopHistory.filter(h=>{const a=(data||[]).find(a=>a.id===h.allocation_id);return a?.initial_sl_points!=null&&h.new_stop_ticks < -pointsToTicks(a.initial_sl_points);}).map(h=>({id:'stop-'+h.id,type:'stop_management',label:'Risiko über Initialrisiko erhöht',reason:h.notes||''}));
    const names=new Map(allAccounts.map(a=>[a.id,a.account_name]));
    let existingResults=[];
    if(trade.exit_at && ids.length){
      const {data:results,error:resultsError}=await client.from('account_trade_results')
        .select('allocation_id,realized_pnl_usd,fees_usd,tp_ticks,result_status').in('allocation_id',ids);
      if(resultsError)throw resultsError;
      existingResults=results||[];
    }
    if(requestSeq!==detailRequestSeq||panel.dataset.tradeId!==trade.id)return;
    const resultByAllocation=new Map(existingResults.filter(r=>r.result_status==='final'&&finiteValue(r.realized_pnl_usd)).map(r=>[r.allocation_id,r]));
    const totals=allocationSummary(data||[],existingResults);
    const initialRisk=totals.risk,pnlTotal=totals.pnl,feesTotal=totals.fees;
    const exitSection=trade.exit_at?
      `<div class="account"><h3>Abgeschlossen · ${escapeHtml(trade.exit_reason||'Exit')}</h3><p>Exit: ${escapeHtml(berlinTime(trade.exit_at))}<br>Haltedauer: ${escapeHtml(durationLabel(trade.entry_at,trade.exit_at))}</p>${(data||[]).map(a=>{const r=resultByAllocation.get(a.id);return `<div class="row"><span>${escapeHtml(names.get(a.account_id)||'Konto')}</span><strong>${r?usd(r.realized_pnl_usd)+' USD · '+(a.initial_risk_usd?(Number(r.realized_pnl_usd)/Number(a.initial_risk_usd)).toFixed(2)+' R':'R offen'):'Ergebnis fehlt'}</strong><small>${r&&r.tp_ticks!=null?' · TP '+r.tp_ticks+' Ticks ('+(r.tp_ticks*.25).toFixed(2)+' Punkte)':''}</small></div>`}).join('')}<p><strong>Summe brutto${totals.completeResults?'':' (Ergebnisse unvollständig)'}: ${usd(pnlTotal)} USD · ${totals.rMultiple!==null?totals.rMultiple.toFixed(2)+' R':'R offen – Initialrisiken oder Ergebnisse unvollständig'}</strong><br><small>Brutto: ${usd(pnlTotal)} USD · Gebühren: ${usd(feesTotal)} USD · Netto: ${usd(pnlTotal-feesTotal)} USD. Brutto-R vor Gebühren.</small></p></div>`:
      `<div class="account exit-editor"><h3>Trade abschließen · alle Konten gemeinsam</h3><p class="muted">Für jedes Konto das tatsächlich realisierte Ergebnis in Ticks oder USD erfassen. Die zuletzt gewählte Einheit wird gemerkt. Ergebnis = Brutto-P&L vor Gebühren; Gebühren separat. Keine Brokerorder.</p><label>Exit-Grund<select class="exit-reason"><option value="">Bitte auswählen</option><option value="TP">Take Profit</option><option value="SL">Stop-Loss</option><option value="BE">Break-even</option><option value="extended_tp">Erweitertes TP</option><option value="daily_target">Tagesziel</option><option value="manual">Manuell</option><option value="other">Sonstiges</option></select></label>${(data||[]).map(a=>`<div class="account exit-account" data-instrument="${escapeHtml(a.instrument)}" data-quantity="${escapeHtml(a.planned_quantity)}" data-id="${escapeHtml(a.id)}" data-risk="${a.initial_risk_usd==null?'':escapeHtml(a.initial_risk_usd)}"><strong>${escapeHtml(names.get(a.account_id)||'Konto')} · ${escapeHtml(a.instrument)} × ${escapeHtml(a.planned_quantity)}</strong><label>Realisierter P&L · Einheit<select class="exit-unit"><option value="ticks">Ticks</option><option value="usd">USD</option></select></label><label>Ergebnis<input class="exit-amount" type="text" inputmode="decimal" placeholder="z. B. 100 oder -40" autocomplete="off"></label><button type="button" class="ghost exit-negate" aria-label="Vorzeichen wechseln">+/−</button><div class="muted exit-equivalent">Entspricht: –</div><label>Gebühren (USD, optional)<input class="exit-fees" type="text" inputmode="decimal" placeholder="0" autocomplete="off"></label><div class="muted exit-r">R: –</div></div>`).join('')}<h4>Empfindungen beim Exit · 1–10</h4><div class="emotion-options" data-emotion-group="exitCommitEmotion"><button type="button" data-value="disciplined">Nach Plan</button><button type="button" data-value="fear">Angst</button><button type="button" data-value="greed">Gier</button><button type="button" data-value="frustration">Frust</button><button type="button" data-value="relief">Erleichterung</button><button type="button" data-value="uncertainty">Unsicherheit</button><button type="button" data-value="stress">Stress</button></div><p class="muted exit-preview">Gesamtergebnis: –</p><div class="exit-feedback" role="status" aria-live="polite"></div><button type="button" class="wide close-trade-action">Trade endgültig abschließen</button></div>`;
    panel.innerHTML=`<div class="account"><h3>Trade-Details</h3><div class="draft-status muted" role="status">Lokaler Entwurf aktiv (nur dieses Gerät)</div><p><strong>${escapeHtml(trade.setup_type)} · ${escapeHtml(trade.direction.toUpperCase())} ${escapeHtml(trade.instrument)}</strong></p><p class="muted">${trade.observations?.entry_context_v736?'Ausführung: '+(trade.observations.entry_context_v736.execution_mode==='copy'?'Copy-Modus':'Einzelkonto')+'<br>'+Object.entries(trade.observations.entry_context_v736.emotion_scales||{}).map(([k,v])=>escapeHtml(SCALE_DEFS.entryEmotion.find(d=>d[0]===k)?.[1]||k)+': '+escapeHtml(v)+'/10').join(' · ')+'<br>':''}Entry (Berlin): ${escapeHtml(berlinTime(trade.entry_at))}<br>Status: ${trade.exit_at?'Abgeschlossen':'Offen'}<br>Trade-ID: <small>${escapeHtml(trade.id)}</small></p><div class="account ltf-analysis"><h3>LTF-Beobachtungen (optional, nach dem Trade)</h3><p class="muted">Optional: Markiere nur die tatsächlich beobachteten Signale. Ergänze unten die konkrete Entry-These: Was wurde wo bestätigt, was hätte sie widerlegt? Haken werden sofort gespeichert.</p>
<div class="analysis-grid">
<label><input type="checkbox" data-analysis="structure"> Struktur / Bruch</label>
<label><input type="checkbox" data-analysis="volume"> Volumen Preis/Zeit</label>
<label><input type="checkbox" data-analysis="cvd"> CVD</label>
<label><input type="checkbox" data-analysis="delta"> Delta</label>
<label><input type="checkbox" data-analysis="tape"> Tape / DOM</label>
<label><input type="checkbox" data-analysis="liquidity"> Liquidität / Absorption</label>
</div><label>Entry-These / Beobachtung<textarea class="analysis-note" rows="2" placeholder="Warum ist der Trade valide?"></textarea></label><button type="button" class="analysis-save secondary wide" hidden>Analyse speichern</button><div class="analysis-feedback muted" role="status"></div></div><div class="account trade-images"><h3>LTF-Screenshots</h3><p class="muted">Mehrere Bilder pro Trade. Privat gespeichert und auf PC/iPhone verfügbar.</p><div class="image-dropzone" tabindex="0" role="group" aria-label="LTF-Bilder ablegen oder mit Strg+V einfügen"><strong>Bilder hier ablegen oder Strg+V drücken</strong><span class="muted">Alternativ Bilder auswählen · max. 10 gleichzeitig</span><input type="file" class="ltf-file" aria-label="LTF-Bilder auswählen" accept="image/png,image/jpeg,image/webp" multiple><span class="image-pick-status" role="status">Noch keine neuen Bilder ausgewählt.</span></div><button type="button" class="ltf-upload secondary wide">Bilder hinzufügen</button><div class="ltf-feedback muted"></div><div class="ltf-gallery">Bilder werden geladen …</div></div><div class="account intratrade-emotion"><h3>Emotion während des Trades · freiwillig</h3><div class="emotion-options" data-emotion-group="duringTradeEmotion"><button type="button" data-value="calm">Ruhig</button><button type="button" data-value="fear">Angst</button><button type="button" data-value="greed">Gier</button><button type="button" data-value="uncertain">Unsicherheit</button></div><div class="during-feedback muted" role="status"></div></div><h3>Initialrisiko & SL-Verlauf</h3><p class="muted">Bei neuen Trades bereits beim Entry gespeichert. Hier nur SL-Verschiebungen; alte Trades ohne Risiko einmalig ergänzen.</p>${(data||[]).length>1?`<label>Direkt zum Konto springen<select id="jumpAccount"><option value="">Konto auswählen</option>${(data||[]).map(a=>`<option value="${escapeHtml(a.id)}">${escapeHtml(names.get(a.account_id)||'Konto')}</option>`).join('')}</select></label>`:''}${(data||[]).map(a=>riskCard(a,names,!!trade.exit_at,histories.get(a.id)||[])).join('')||'<p>Keine Kontozuordnungen gefunden.</p>'}${exitSection}<details class="account review-editor" data-trade-id="${escapeHtml(trade.id)}">
<summary><strong>Review nach dem Trade · optional öffnen</strong></summary><h3>Trade-Review · unabhängig vom P&L</h3>
<p class="muted">Auch nach dem Exit ergänzbar. A+ bedeutet gute Ausführung, nicht zwingend Gewinn.</p>
<details class="saved-exit-emotion"><summary>Gespeicherte Exit-Emotion anzeigen</summary><div class="emotion-options" data-emotion-group="exitEmotion"><button type="button" data-value="disciplined">Diszipliniert</button><button type="button" data-value="fear">Angst / zu früh</button><button type="button" data-value="greed">Gier / zu lange</button><button type="button" data-value="stress">Stress / Druck</button><button type="button" data-value="frustration">Frust</button><button type="button" data-value="relief">Erleichterung</button><button type="button" data-value="uncertainty">Unsicherheit</button></div></details><label>Ausführungsqualität<select class="review-grade"><option value="">Noch nicht bewertet</option><option>A+</option><option>A</option><option>B</option><option>C</option><option>unrated</option></select></label>
<label>Regelprüfung<select class="review-compliance"><option value="unknown">Noch nicht geprüft</option><option value="clean">Geprüft · kein Regelbruch</option><option value="breach">Regelbruch dokumentieren</option></select></label>
<div class="legacy-review-fields hidden"><label>Fehlerart<select class="review-error"><option value="">Kein Fehler ausgewählt</option><option value="fomo">FOMO</option><option value="overtrading">Overtrading</option><option value="poor_entry">Schlechter Entry</option><option value="stop_management">SL-Verhalten</option><option value="early_exit">Zu früher Exit</option><option value="plan_violation">Planabweichung</option><option value="other">Sonstiges</option></select></label>
<label>Gegenmaßnahme (Wenn–Dann-Regel)<select class="review-reuse"><option value="">Neue Maßnahme schreiben</option></select><textarea class="review-action" rows="2" placeholder="Wenn …, dann …"></textarea></label>
</div><div class="review-errors"></div><button type="button" class="review-add-error secondary">＋ Fehler hinzufügen</button><div class="review-exceptions"></div><label>Wichtigste Erkenntnis<textarea class="review-note" rows="2" placeholder="Was wiederholen oder ändern?"></textarea></label>
<label><input class="review-playbook" type="checkbox" style="display:inline;width:auto"> Ins Playbook übernehmen</label>
<button type="button" class="review-save wide secondary">Review speichern</button><div class="review-feedback muted" role="status"></div>
</details><p class="muted">Eingabe in ganzen Ticks (1 Tick = 0,25 Punkte). In der Datenbank wird der SL-Abstand weiterhin in Punkten gespeichert. Berechnung ohne Gebühren und Slippage. Exit-Ergebnisse werden je Konto separat erfasst.</p><button type="button" class="ghost wide" id="closeTradeDetails">Details schließen</button></div>`;
    // Live-Scalping: wichtige Aktion oben; alle optionalen Felder bleiben erreichbar,
    // aber niemals Voraussetzung für einen schnellen Exit.
    const root=panel.firstElementChild;
    const power=document.createElement('div');power.className='power-banner';
    power.innerHTML=`${trade.session_id&&trade.session_id!==currentSession?.id?'<p class="notice">Historischer Trade · Die aktive Session bleibt unverändert.</p>':''}<strong>${trade.exit_at?'✓ Trade abgeschlossen':'● Trade läuft · Fokus auf ATAS'}</strong><p>${trade.exit_at?'Exit gespeichert. Review und Stop-Historie kannst du später ergänzen.':'Während des Trades keine Eingabe erforderlich. Sobald der Trade beendet ist, nur Exit-Grund, Kontoergebnisse und Exit-Emotion erfassen.'}</p><div class="power-actions">${trade.exit_at?'<button type="button" class="power-next">＋ Nächster Trade</button><button type="button" class="power-review">Review öffnen</button>':'<button type="button" class="power-exit">✓ Exit erfassen</button><button type="button" class="power-next">＋ Nächster Trade</button>'}</div>`;
    root.insertBefore(power,root.querySelector('.draft-status'));
    power.querySelector('.power-exit')?.addEventListener('click',()=>{const el=panel.querySelector('.exit-editor');el?.scrollIntoView({behavior:'smooth',block:'start'});el?.querySelector('.exit-reason')?.focus({preventScroll:true});});
    power.querySelector('.power-next')?.addEventListener('click',()=>{if(!confirm('Neuen Trade dokumentieren? Der bisherige Trade bleibt unverändert und kann später bearbeitet werden.'))return;goToTradeEntry();});
    power.querySelector('.power-review')?.addEventListener('click',()=>{const r=panel.querySelector('.review-editor');if(r){r.open=true;r.scrollIntoView({behavior:'smooth',block:'start'});}});
    const optionalParts=[['.ltf-analysis','LTF-Analyse nachtragen'],['.intratrade-emotion','Emotion während des Trades (optional)']];
    for(const [selector,label] of optionalParts){const el=root.querySelector(selector);if(!el)continue;const wrap=document.createElement('details');wrap.className='power-collapsible';const summary=document.createElement('summary');summary.textContent=label;el.before(wrap);wrap.append(summary,el);}
    const firstRisk=root.querySelector('.risk-card');
    if(firstRisk){const riskTitle=firstRisk.previousElementSibling;const riskStart=riskTitle?.tagName==='H3'?riskTitle:firstRisk;const riskWrap=document.createElement('details');riskWrap.className='power-collapsible';const summary=document.createElement('summary');summary.textContent='Initialrisiko & SL-Verschiebungen je Konto';riskStart.before(riskWrap);riskWrap.append(summary);riskWrap.open=!trade.exit_at;let node=riskStart;const stopAt=root.querySelector('.exit-editor')||root.querySelector('.review-editor');while(node&&node!==stopAt){const next=node.nextElementSibling;riskWrap.append(node);node=next;}}
    if(!trade.exit_at){const exit=root.querySelector('.exit-editor');if(exit)exit.setAttribute('aria-label','Schneller Trade-Abschluss');}
    panel.querySelectorAll('details').forEach((d,i)=>{if(previousOpen.includes(d.className||'detail-'+i))d.open=true;});panel.querySelectorAll('.stop-toggle').forEach(toggle=>{
      const label=toggle.closest('.stop-toggle-label');
      const fields=toggle.closest('.stop-panel').querySelector('.stop-fields');
      const sync=()=>{fields.hidden=!toggle.checked;label.classList.toggle('is-open',toggle.checked);label.setAttribute('aria-expanded',String(toggle.checked));};
      toggle.addEventListener('change',sync);
      
      sync();
    });
    panel.querySelectorAll('.risk-card').forEach(card=>{
      const field=card.querySelector('.risk-usd');
      const original=field.value;
      updateRiskCard(card);
      if(card.querySelector('.risk-override').checked)field.value=original;
      card.querySelector('.risk-ticks').addEventListener('input',()=>updateRiskCard(card));
      card.querySelector('.risk-override').addEventListener('change',()=>updateRiskCard(card));
    });
    panel.querySelectorAll('.exit-unit').forEach(sel=>{sel.value=preferredExitUnit();});
    const exitEditor=panel.querySelector('.exit-editor');if(exitEditor)updateExitPreview(exitEditor);
    try{await renderTradeImages(trade.id);}catch(imageError){const g=panel.querySelector('.ltf-gallery');if(g)g.textContent='Bildanzeige fehlgeschlagen: '+imageError.message;}
    const analysis=panel.querySelector('.ltf-analysis');
    if(analysis){
      const a=trade.observations?.ltf_analysis||{};
      analysis.querySelectorAll('[data-analysis]').forEach(el=>el.checked=!!a[el.dataset.analysis]);
      analysis.querySelector('.analysis-note').value=trade.observations?.entry_thesis||'';
    }
    // Screenshots gehören zur Nachbereitung: auf dem Handy kein Upload-Zwang.
    const imageSection=panel.querySelector('.trade-images');
    const reviewHost=panel.querySelector('.review-editor');
    if(imageSection&&reviewHost){
      imageSection.querySelector('h3').textContent='LTF-Screenshots · optional am Handy oder PC';
      imageSection.querySelector('p.muted').textContent='Optional: nach dem Trade im Review ergänzen. Screenshots sind für den Entry und Exit nicht erforderlich.';
      reviewHost.appendChild(imageSection);
      const uploadControls=imageSection.querySelector('.image-dropzone');
      const uploadButton=imageSection.querySelector('.ltf-upload');
      if(uploadControls)uploadControls.classList.remove('desktop-screenshot-control');
      if(uploadButton)uploadButton.classList.remove('desktop-screenshot-control');
      const mobileHint=document.createElement('p');mobileHint.className='mobile-screenshot-hint muted';
      mobileHint.textContent='Am Handy: später am PC ergänzen. Vorhandene Bilder bleiben sichtbar.';
      imageSection.insertBefore(mobileHint,imageSection.querySelector('.ltf-gallery'));
    }
    applyEmotionLabels(panel);if(trade.observations?.exit_emotion_scales){const saved=panel.querySelector('.saved-exit-emotion');if(saved){const out=document.createElement('p');out.textContent=Object.entries(trade.observations.exit_emotion_scales).map(([k,v])=>(SCALE_DEFS.exitCommitEmotion.find(d=>d[0]===k)?.[1]||k)+': '+v+'/10').join(' · ');saved.append(out);}}
    const review=panel.querySelector('.review-editor');
    if(review){
      const obs=trade.observations||{};
      review.querySelector('.review-grade').value=trade.execution_grade||'';
      review.querySelector('.review-compliance').value=obs.compliance_reviewed?(trade.rule_deviation?'breach':'clean'):'unknown';
      review.querySelector('.review-error').value=obs.review_error||'';
      review.querySelector('.review-action').value=obs.countermeasure||'';
      review.querySelector('.review-note').value=obs.review_note||'';
      review.querySelector('.review-playbook').checked=!!obs.playbook;setEmotion(review.querySelector('[data-emotion-group="exitEmotion"]'),trade.exit_emotion||obs.exit_emotion||'');review.querySelectorAll('[data-emotion-group="exitEmotion"] button').forEach(b=>b.disabled=true);
      const measures=[...new Set([...trainingMeasures.map(m=>m.rule_text),...sessionTrades.flatMap(t=>reviewErrors(t).map(e=>e.countermeasure))].filter(Boolean))].slice(0,30);
      renderReviewErrors(review,trade);
      const reuse=review.querySelector('.review-reuse');
      for(const measure of measures){const option=document.createElement('option');option.value=measure;option.textContent=measure.length>65?measure.slice(0,65)+'…':measure;reuse.appendChild(option);}
      reuse.addEventListener('change',()=>{if(reuse.value)review.querySelector('.review-action').value=reuse.value;});
    }
    buildScaleGroup(panel.querySelector('[data-emotion-group="duringTradeEmotion"]'),'duringTradeEmotion',trade.observations?.during_emotion_scales||{});
    const recoverable=draftRead(trade.id);
    if(recoverable&&trade.exit_at)recoverable.exit=null;
    if(recoverable&&(recoverable.exit||recoverable.analysis||recoverable.review)){
      const status=panel.querySelector('.draft-status');
      status.textContent='Lokaler Entwurf vorhanden. Nicht automatisch über Supabase-Daten gelegt.';
      const restore=document.createElement('button');restore.type='button';restore.className='secondary';
      restore.textContent='Lokalen Entwurf anzeigen / wiederherstellen';
      restore.addEventListener('click',()=>{
        if(!confirm('Lokale Eingaben über die aktuell angezeigten Felder legen? Bereits gespeicherte Werte könnten älter sein.'))return;
        draftRestore(recoverable);if(recoverable.review?.errors)renderReviewErrors(review,{...trade,observations:{...trade.observations,review_errors:recoverable.review.errors,training_practice:recoverable.review.practice||trade.observations?.training_practice}},recoverable.review.exceptions);draftSchedule();
      });
      status.appendChild(restore);
    }
    const jump=panel.querySelector('#jumpAccount');if(jump)jump.addEventListener('change',()=>{if(jump.value)jumpToAccount(jump.value);});
    $('closeTradeDetails').onclick=()=>{draftFlush();detailTrade=null;journalOpenSeq++;detailRequestSeq++;panel.classList.add('hidden');panel.innerHTML='';panel.dataset.tradeId='';try{sessionStorage.removeItem('tt7_active_trade_id')}catch(_){}};
  }catch(err){if(requestSeq===detailRequestSeq)panel.textContent='Trade-Details konnten nicht geladen werden: '+err.message}
}
// Optimistic concurrency: reject writes if another device changed observations after load.
// This is a compare-and-swap at the PostgREST UPDATE statement, not a pre-read.
function conditionalTradeUpdate(id,patch,previousObservations,columns){
 let q=client.from('trades').update(patch).eq('id',id);
 q=previousObservations==null?q.is('observations',null):q.filter('observations','eq',JSON.stringify(previousObservations));
 return q.select(columns).maybeSingle();
}
function tradeConflictFeedback(feedback){
 feedback.textContent='Speicherkonflikt: Dieser Trade wurde auf einem anderen Gerät geändert. Deine Eingaben bleiben hier erhalten. Bitte erst den Trade neu laden und die Änderungen abgleichen.';
}
// LTF Autosave: each checkbox immediately, text after typing pause; serialized with retries.
let ltfAutosaveTimer=null,ltfAutosaveInFlight=false,ltfAutosavePending=false;
function scheduleLtfAutosave(delay=0){
 clearTimeout(ltfAutosaveTimer);
 ltfAutosaveTimer=setTimeout(()=>{ltfAutosaveTimer=null;void flushLtfAutosave();},delay);
}
async function flushLtfAutosave(){
 const panel=$('tradeDetails'),editor=panel.querySelector('.ltf-analysis');
 const trade=detailTradeById(panel.dataset.tradeId);
 if(!editor||!trade)return;
 if(ltfAutosaveInFlight){ltfAutosavePending=true;return;}
 const note=editor.querySelector('.analysis-note').value.trim();
 const feedback=editor.querySelector('.analysis-feedback');
 if(note.length>2000){feedback.textContent='Maximal 2000 Zeichen – nicht gespeichert.';return;}
 const checks=Object.fromEntries([...editor.querySelectorAll('[data-analysis]')].map(el=>[el.dataset.analysis,el.checked]));
 const next={...(trade.observations||{}),ltf_analysis:checks,entry_thesis:note};
 if(JSON.stringify(next)===JSON.stringify(trade.observations||{}))return;
 ltfAutosaveInFlight=true;feedback.textContent='Speichert …';
 try{
  const {data,error}=await conditionalTradeUpdate(trade.id,{observations:next},trade.observations,'observations');
  if(error)throw error;
  if(!data){feedback.textContent='Konflikt mit anderer Änderung. Eingaben bleiben erhalten. Bitte Trade neu öffnen.';return;}
  applyTradePatch(trade,{observations:data.observations});
  feedback.textContent='✓ Automatisch gespeichert';
  draftMarkSaved(trade.id,'analysis');
 }catch(err){feedback.textContent='Nicht gespeichert: '+err.message;}
 finally{
  ltfAutosaveInFlight=false;
  if(ltfAutosavePending){ltfAutosavePending=false;scheduleLtfAutosave(50);}
 }
}
$('tradeDetails').addEventListener('change',e=>{
 if(e.target.matches('.ltf-analysis [data-analysis]'))scheduleLtfAutosave(0);
});
$('tradeDetails').addEventListener('input',e=>{
 if(e.target.matches('.ltf-analysis .analysis-note'))scheduleLtfAutosave(650);
});
$('tradeDetails').addEventListener('click',async e=>{
 const btn=e.target.closest('.analysis-save');if(!btn||busy)return;
 const panel=$('tradeDetails'),trade=detailTradeById(panel.dataset.tradeId);
 if(!trade)return;
 const editor=btn.closest('.ltf-analysis'),feedback=editor.querySelector('.analysis-feedback');
 const entryThesis=editor.querySelector('.analysis-note').value.trim();
 if(entryThesis.length>2000){feedback.textContent='Maximal 2000 Zeichen.';return;}
 const checks=Object.fromEntries([...editor.querySelectorAll('[data-analysis]')].map(el=>[el.dataset.analysis,el.checked]));
 const observations={...(trade.observations||{}),ltf_analysis:checks,entry_thesis:entryThesis};
 busy=true;btn.disabled=true;feedback.textContent='Analyse wird gespeichert …';
 try{
  const {data,error}=await conditionalTradeUpdate(trade.id,{observations},trade.observations,'observations');
  if(error)throw error;
  if(!data){draftFlush();tradeConflictFeedback(feedback);return;}
  applyTradePatch(trade,{observations:data.observations});feedback.textContent='Analyse gespeichert.';
  draftMarkSaved(trade.id,'analysis');
 }catch(err){feedback.textContent='Nicht gespeichert: '+err.message;}
 finally{busy=false;btn.disabled=false;}
});
$('tradeDetails').addEventListener('change',async e=>{
 const btn=e.target.closest('[data-emotion-group="duringTradeEmotion"] [data-scale]');if(!btn||busy)return;
 const panel=$('tradeDetails'),trade=detailTradeById(panel.dataset.tradeId);if(!trade)return;
 const emotion=selectedEmotion(panel.querySelector('[data-emotion-group="duringTradeEmotion"]'));
 const feedback=panel.querySelector('.during-feedback');
 if(!Object.keys(readScales(btn.closest('[data-scale-group]'))).length)return;
 busy=true;btn.disabled=true;feedback.textContent='Speichert …';
 try{
  const observations={...(trade.observations||{}),during_trade_emotion:emotion||null,during_emotion_scales:readScales(btn.closest('[data-scale-group]')),during_trade_emotion_at:new Date().toISOString()};
  const {data,error}=await conditionalTradeUpdate(trade.id,{observations},trade.observations,'observations');
  if(error)throw error;if(!data){tradeConflictFeedback(feedback);return;}
  applyTradePatch(trade,{observations:data.observations});feedback.textContent='Emotion mit Zeitstempel gespeichert.';
 }catch(err){feedback.textContent='Nicht gespeichert: '+err.message;}
 finally{busy=false;btn.disabled=false;}
});
$('tradeDetails').addEventListener('click',async e=>{
 const btn=e.target.closest('.review-save');if(!btn||busy)return;
 const form=btn.closest('.review-editor');
 const trade=detailTradeById(form.dataset.tradeId);if(!trade)return;
 const compliance=form.querySelector('.review-compliance').value;
 const errors=collectReviewErrors(form),decisions=collectExceptionDecisions(form);
 const note=form.querySelector('.review-note').value.trim(),feedback=form.querySelector('.review-feedback');
 if(errors.some(e=>!e.type||!e.countermeasure.trim())){feedback.textContent='Für jeden Fehler sind Fehlerart und konkrete Gegenmaßnahme erforderlich.';return;}
 if(errors.length>30||errors.some(e=>e.countermeasure.length>1000)||note.length>1500){feedback.textContent='Text oder Fehlerliste zu lang.';return;}
 const pending=exceptionItems(trade).filter(x=>!decisions[x.id]||decisions[x.id]==='pending');
 if(compliance!=='unknown'&&pending.length){feedback.textContent='Bitte jede Ausnahme im Review bewerten.';return;}
 const forced=exceptionItems(trade).filter(x=>!x.reason||decisions[x.id]==='breach');
 for(const x of forced){if(!errors.some(e=>e.source_id===x.id&&e.confirmed_breach)){feedback.textContent='Bestätigten Regelbruch als Fehler mit Gegenmaßnahme erfassen: '+x.label;return;}}
 const confirmed=errors.some(e=>e.confirmed_breach);
 if(compliance==='clean'&&confirmed){feedback.textContent='Bestätigte Regelbrüche und „kein Regelbruch“ widersprechen sich.';return;}
 if(compliance==='breach'&&!confirmed){feedback.textContent='Mindestens einen Fehler als bestätigten Regelbruch markieren.';return;}
 const practice=collectTrainingPractice(form,trade);
 if(practice&&(!Object.hasOwn(PRACTICE_LABELS,practice.result)||practice.note.length>500)){feedback.textContent='Trainingsbewertung ungültig oder Erklärung zu lang.';return;}
 const observations={...(trade.observations||{}),...(practice?{training_practice:practice}:{}),compliance_reviewed:compliance!=='unknown',review_errors:errors,exception_reviews:decisions,
 review_error:errors[0]?.type||'',countermeasure:errors[0]?.countermeasure||'',review_note:note,playbook:form.querySelector('.review-playbook').checked};
 const patch={execution_grade:form.querySelector('.review-grade').value||null,rule_deviation:compliance==='breach'||confirmed||forced.length>0,
 deviation_reason:confirmed?errors.filter(e=>e.confirmed_breach).map(e=>e.type).join(', '):null,observations};
 busy=true;btn.disabled=true;feedback.textContent='Review wird gespeichert …';
 try{
   const {data,error}=await conditionalTradeUpdate(trade.id,patch,trade.observations,'id,execution_grade,rule_deviation,deviation_reason,observations');
   if(error)throw error;
   if(!data){draftFlush();tradeConflictFeedback(feedback);return;}
   applyTradePatch(trade,data);
   feedback.textContent='Review in Supabase gespeichert.';
   draftMarkSaved(trade.id,'review');
   try{await renderSessionSummary(sessionTrades);await loadProgressAndPlaybook();await loadTraining();await loadAnalytics();await loadOpenReviews();}
   catch(refreshError){feedback.textContent='Review gespeichert. Anzeigeaktualisierung fehlgeschlagen: '+refreshError.message;}
 }catch(err){feedback.textContent='Review nicht gespeichert: '+err.message;}
 finally{busy=false;btn.disabled=false;}
});
const REVIEW_LABELS={fomo:'FOMO',overtrading:'Overtrading',poor_entry:'Schlechter Entry',stop_management:'SL-Verhalten',early_exit:'Zu früher Exit',plan_violation:'Planabweichung',other:'Sonstiges',revenge:'Revenge-Entry',impulsive:'Impulsiver Entry',fear_exit:'Exit aus Angst',greed_exit:'Exit aus Gier',frustration_exit:'Exit aus Frust'};
async function loadMorningDashboard(){
 const target=$('morningBody');target.textContent='Rückblick wird geladen …';
 try{
 const {data:sessions,error:sErr}=await client.from('trading_sessions')
  .select('id,session_date,status,htf_context').order('session_date',{ascending:false}).limit(20);
 if(sErr)throw sErr;
 const latest=(sessions||[]).find(x=>x.status==='closed')||(sessions||[])[0];
 if(!latest){target.textContent='Noch keine Session vorhanden.';return;}
 const {data:trades,error:tErr}=await client.from('trades')
 .select('id,exit_at,entry_at,realized_pnl_usd,initial_risk_usd,execution_grade,rule_deviation,observations')
 .eq('session_id',latest.id).order('entry_at',{ascending:false}).limit(100);
 if(tErr)throw tErr;
 const all=trades||[],closed=all.filter(t=>t.exit_at);
 const pnl=closed.reduce((n,t)=>n+Number(t.realized_pnl_usd||0),0);
 const risk=closed.reduce((n,t)=>n+Number(t.initial_risk_usd||0),0);
 const riskComplete=closed.length>0&&closed.every(t=>t.initial_risk_usd!=null&&Number(t.initial_risk_usd)>0);
 const checked=all.filter(t=>t.observations?.compliance_reviewed);
 const clean=checked.filter(t=>!t.rule_deviation).length;
 const aplus=all.filter(t=>t.execution_grade==='A+').length;
 const errors=all.filter(t=>reviewErrors(t).length);
 const best=all.find(t=>t.observations?.review_note)?.observations?.review_note||'Noch keine Erkenntnis dokumentiert.';
 const limit=all.length===100?'<p class="notice">100-Trades-Limit: möglicherweise unvollständig.</p>':'';
 target.innerHTML=`<p><strong>${escapeHtml(latest.session_date)}</strong> · ${latest.status==='closed'?'Abgeschlossen':'Noch offen'}</p>
 <div class="grid"><div class="stat"><small>Brutto-P&L</small><strong>${usd(pnl)} USD</strong></div>
 <div class="stat"><small>R (Brutto)</small><strong>${closed.length&&riskComplete&&risk>0?(pnl/risk).toFixed(2):'–'}</strong></div>
 <div class="stat"><small>Trades</small><strong>${all.length}</strong></div>
 <div class="stat"><small>A+ bewertet</small><strong>${aplus}</strong></div></div>
 <p>Regelkonform: ${clean}/${checked.length} geprüfte Trades · ${all.length-checked.length} ungeprüft</p>
 <p>Fehler dokumentiert: ${errors.length}</p>
 <p><strong>Erkenntnis:</strong> ${escapeHtml(best)}</p>${limit}`;
 }catch(err){target.textContent='Rückblick nicht verfügbar: '+err.message;}
}
$('reloadMorning').addEventListener('click',loadMorningDashboard);
const TEST_ITEMS=[
'Anmelden und abmelden','Session starten und Konten auswählen','HTF-Checks speichern und nach Reload prüfen',
'HTF-Bild hochladen, ansehen, ersetzen','Trade eröffnen mit Leader/Follower',
'Initialrisiko je Konto speichern','SL verschieben und Verlauf prüfen',
'LTF-Checks speichern und Bilder hochladen','Exit-Einheit Ticks/USD umstellen',
'P&L und Gebühren plausibilisieren','Trade abschließen und erneut öffnen',
'Review/Playbook/50-Trade-Auswertung prüfen'];
function renderTestChecklist(){
 const target=$('testChecklist');target.replaceChildren();
 let saved={};try{saved=JSON.parse(localStorage.getItem('tt7_test_checklist')||'{}');}catch(_){}
 TEST_ITEMS.forEach((label,i)=>{
  const row=document.createElement('label');row.style.cssText='display:flex;gap:10px;align-items:center;padding:7px 0';
  const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!saved[i];cb.style.cssText='width:22px;height:22px;flex-shrink:0';
  cb.addEventListener('change',()=>{saved[i]=cb.checked;try{localStorage.setItem('tt7_test_checklist',JSON.stringify(saved));}catch(_){}});
  const span=document.createElement('span');span.textContent=(i+1)+'. '+label;row.append(cb,span);target.appendChild(row);
 });
}
$('resetTestChecklist').addEventListener('click',()=>{localStorage.removeItem('tt7_test_checklist');renderTestChecklist();});
renderTestChecklist();
const CHART_BUCKET='trading-chart-screenshots';
function chartPath(type,id,filename){return `${currentUser.id}/${type}/${id}/${filename}`;}
function safeImage(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Nur PNG, JPEG oder WebP erlaubt.');
 if(file.size===0)throw Error('Leere Bilddatei.');
 if(file.size>10*1024*1024)throw Error('Maximal 10 MB pro Bild.');
}
async function uploadChart(file,path){
 safeImage(file);
 const {error}=await client.storage.from(CHART_BUCKET).upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;
}
async function signedChart(path){
 const {data,error}=await client.storage.from(CHART_BUCKET).createSignedUrl(path,1800);
 if(error)throw error;
 return data.signedUrl;
}
function makeChartPreview(parent,path,url,onDelete){
 const wrap=document.createElement('div');wrap.className='chart-thumb';
 const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
 const img=document.createElement('img');img.src=url;img.alt='Trading-Chart';img.loading='lazy';
 img.style.cssText='display:block;max-width:100%;max-height:260px;object-fit:contain;border-radius:8px';
 link.appendChild(img);wrap.appendChild(link);
 if(onDelete){
 const btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent='Bild löschen';
 btn.addEventListener('click',()=>onDelete(path,wrap));wrap.appendChild(btn);
 }
 parent.appendChild(wrap);
}
let htfRenderSequence=0;
async function deleteHtfImage(){
 if(busy||!currentSession)return;
 const sessionId=currentSession.id;
 const old=currentSession.htf_context?.htf_image_path;
 if(!old)return;
 if(!confirm('HTF-Bild wirklich aus dieser Session entfernen? Dies kann nicht rückgängig gemacht werden.'))return;
 busy=true;
 const button=$('htfDelete');if(button)button.disabled=true;
 try{
   // First remove the reference. The image must never remain referenced if storage deletion succeeds.
   const ctx={...(currentSession.htf_context||{})};
   delete ctx.htf_image_path;
   const {data,error}=await client.from('trading_sessions').update({htf_context:ctx}).eq('id',sessionId).filter('htf_context','eq',JSON.stringify(currentSession.htf_context||{})).select('htf_context').single();
   if(error)throw error;
   if(currentSession?.id===sessionId)currentSession.htf_context=data.htf_context;
   await renderHtfImage();
   const {error:storageError}=await client.storage.from(CHART_BUCKET).remove([old]);
   message(storageError?'Bild aus Session entfernt, aber Speicherbereinigung fehlgeschlagen: '+storageError.message:'HTF-Bild gelöscht.',!!storageError);
 }catch(err){message('HTF-Bild konnte nicht gelöscht werden: '+err.message,true);}
 finally{busy=false;if(button)button.disabled=false;}
}
async function renderHtfImage(){
 const sequence=++htfRenderSequence;
 const box=$('htfScreenshot');box.classList.toggle('hidden',!currentSession);
 const target=$('htfImagePreview');target.replaceChildren();
 if(!currentSession)return;
 const sessionId=currentSession.id;
 const path=currentSession.htf_context?.htf_image_path;
 if(!path){target.textContent='Noch kein HTF-Bild gespeichert.';return;}
 try{
   const url=await signedChart(path);
   // A second render may have started while the signed URL was loading.
   if(sequence!==htfRenderSequence||currentSession?.id!==sessionId||currentSession?.htf_context?.htf_image_path!==path)return;
   target.replaceChildren();
   makeChartPreview(target,path,url);
   const btn=document.createElement('button');
   btn.type='button';btn.id='htfDelete';btn.className='secondary';
   btn.textContent='HTF-Bild löschen';
   btn.addEventListener('click',deleteHtfImage);
   target.appendChild(btn);
 }catch(err){
   if(sequence===htfRenderSequence)target.textContent='Bild konnte nicht geladen werden: '+err.message;
 }
}

// Shared clipboard/drop selection; actual uploads happen ONLY on explicit save.
const pendingImages=new WeakMap();
function chosenImages(zone){
 const input=zone.querySelector('input[type=file]');
 return pendingImages.get(zone)||[...input?.files||[]];
}
function setChosenImages(zone,files,append=false){
 if(!zone)return;
 const input=zone.querySelector('input[type=file]');
 const valid=files.filter(f=>f&&['image/png','image/jpeg','image/webp'].includes(f.type)&&f.size>0&&f.size<=10*1024*1024);
 const invalid=files.length-valid.length;
 const merged=append?[...chosenImages(zone),...valid]:valid;
 const limit=input?.multiple?10:1;
 const selected=merged.slice(0,limit);
 pendingImages.set(zone,selected);
 const status=zone.querySelector('.image-pick-status');
 if(status)status.textContent=selected.length?selected.length+' Bild(er) bereit zum Speichern'+(invalid?' · '+invalid+' ungültig/zu groß':'')+(merged.length>limit?' · Limit '+limit:''):'Kein gültiges Bild (PNG/JPG/WebP bis 10 MB).';
}
document.addEventListener('change',e=>{
 if(e.target.matches('.image-dropzone input[type=file]')){
  const zone=e.target.closest('.image-dropzone');
  setChosenImages(zone,[...e.target.files]);
 }
});
document.addEventListener('dragover',e=>{
 const zone=e.target.closest?.('.image-dropzone');
 if(!zone)return;
 e.preventDefault();e.dataTransfer.dropEffect='copy';zone.classList.add('drag-over');
});
document.addEventListener('dragleave',e=>{
 const zone=e.target.closest?.('.image-dropzone');
 if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('drag-over');
});
document.addEventListener('drop',e=>{
 const zone=e.target.closest?.('.image-dropzone');if(!zone)return;
 e.preventDefault();zone.classList.remove('drag-over');
 setChosenImages(zone,[...e.dataTransfer.files],!!zone.querySelector('input[multiple]'));
 zone.focus();
});
document.addEventListener('paste',e=>{
 const target=e.target;
 if(target.closest?.('input,textarea,[contenteditable=true]'))return;
 const zone=target.closest?.('.image-dropzone')||
  (!$('tradeDetails').classList.contains('hidden')?$('tradeDetails').querySelector('.trade-images .image-dropzone'):null)||
  (!$('htfScreenshot').classList.contains('hidden')?$('htfDropzone'):null);
 if(!zone)return;
 const images=[...e.clipboardData?.items||[]].filter(item=>item.kind==='file'&&item.type.startsWith('image/')).map(item=>item.getAsFile()).filter(Boolean);
 if(!images.length)return;
 e.preventDefault();setChosenImages(zone,images,!!zone.querySelector('input[multiple]'));
});

$('htfUpload').addEventListener('click',async()=>{
 if(busy||!currentSession)return;
 const file=chosenImages($('htfDropzone'))[0];if(!file){message('Bitte zuerst ein HTF-Bild auswählen.',true);return;}
 busy=true;$('htfUpload').disabled=true;
 let path;
 try{
   path=chartPath('session',currentSession.id,crypto.randomUUID()+'.'+(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'));
   await uploadChart(file,path);
   const old=currentSession.htf_context?.htf_image_path;
   const ctx={...(currentSession.htf_context||{}),htf_image_path:path};
   const {data,error}=await client.from('trading_sessions').update({htf_context:ctx}).eq('id',currentSession.id).filter('htf_context','eq',JSON.stringify(currentSession.htf_context||{})).select('htf_context').single();
   if(error)throw error;
   currentSession.htf_context=data.htf_context;
   $('htfFile').value='';pendingImages.delete($('htfDropzone'));$('htfDropzone').querySelector('.image-pick-status').textContent='Bild gespeichert.';
   try{await renderHtfImage();}catch(e){message('Bild gespeichert, Vorschaufehler: '+e.message,true);}
   message('HTF-Bild gespeichert.'); 
   if(old&&old!==path){
     const {error:cleanupError}=await client.storage.from(CHART_BUCKET).remove([old]);
     if(cleanupError)message('Neues Bild gespeichert. Altes Bild konnte nicht bereinigt werden.',true);
   }
 }catch(err){
   if(path&&currentSession?.htf_context?.htf_image_path!==path)await client.storage.from(CHART_BUCKET).remove([path]);
   message('HTF-Bild nicht gespeichert: '+err.message,true);
 }finally{busy=false;$('htfUpload').disabled=false;}
});
async function renderTradeImages(tradeId){
 const panel=$('tradeDetails');if(panel.dataset.tradeId!==tradeId)return;
 const gallery=panel.querySelector('.ltf-gallery');if(!gallery)return;
 gallery.replaceChildren();
 const prefix=chartPath('trade',tradeId,'');
 const {data,error}=await client.storage.from(CHART_BUCKET).list(prefix,{limit:100,sortBy:{column:'created_at',order:'desc'}});
 if(error){gallery.textContent='Bilder konnten nicht geladen werden: '+error.message;return;}
 if(!data?.length){gallery.textContent='Noch keine LTF-Bilder.';return;}
 for(const f of data){
  if(panel.dataset.tradeId!==tradeId)return;
  if(!f.name||!f.id)continue;
  const path=prefix+f.name;
  try{const url=await signedChart(path);
   makeChartPreview(gallery,path,url,async(p,wrap)=>{
    if(!confirm('Dieses Screenshot endgültig löschen?'))return;
    const {error}=await client.storage.from(CHART_BUCKET).remove([p]);
    if(error)message('Löschen fehlgeschlagen: '+error.message,true);
    else{wrap.remove();message('Bild gelöscht.');}
   });
  }catch(err){const p=document.createElement('p');p.textContent='Bild nicht verfügbar: '+err.message;gallery.appendChild(p);}
 }
}
$('tradeDetails').addEventListener('change',e=>{
 if(!e.target.matches('.ltf-file'))return;
 const button=e.target.closest('.trade-images').querySelector('.ltf-upload');
 if(button)button.click();
});
$('tradeDetails').addEventListener('click',async e=>{
 const btn=e.target.closest('.ltf-upload');if(!btn||busy)return;
 const tradeId=$('tradeDetails').dataset.tradeId;
 const input=btn.closest('.trade-images').querySelector('.ltf-file');
 const feedback=btn.closest('.trade-images').querySelector('.ltf-feedback');
 const zone=input.closest('.image-dropzone');const files=chosenImages(zone);if(!files.length){feedback.textContent='Bitte Bilder auswählen.';return;}
 if(files.length>10){feedback.textContent='Bitte höchstens 10 Bilder auf einmal auswählen.';return;}
 busy=true;btn.disabled=true;
 let uploaded=0;
 try{
 for(const file of files){
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  await uploadChart(file,chartPath('trade',tradeId,crypto.randomUUID()+'.'+ext));uploaded++;
 }
 feedback.textContent=uploaded+' Bild(er) gespeichert.';
 input.value='';pendingImages.delete(zone);zone.querySelector('.image-pick-status').textContent='Bilder gespeichert.';await renderTradeImages(tradeId);
 }catch(err){feedback.textContent=uploaded+' Bild(er) gespeichert, danach Fehler: '+err.message;}
 finally{busy=false;btn.disabled=false;}
});

let trainingRows=[],trainingLoadVersion=0;
const trainingKey=t=>reviewErrors(t)[0]?.type||'';
function trainingBar(count,denom){
 const bar=document.createElement('div');bar.className='training-bar';
 const fill=document.createElement('div');fill.className='training-bar-fill';fill.style.width=(denom?Math.min(100,100*count/denom):0)+'%';bar.append(fill);return bar;
}
async function loadTraining(){
 if(!currentUser)return;
 await loadTrainingFocus();
 const seq=++trainingLoadVersion;
 $('trainingList').textContent='Training wird geladen …';
 const {data,error}=await client.from('trades').select('id,session_id,setup_type,direction,instrument,entry_at,exit_at,entry_emotion,exit_emotion,execution_grade,rule_deviation,observations,realized_pnl_usd,initial_risk_usd').not('exit_at','is',null).order('exit_at',{ascending:false}).limit(50);
 if(seq!==trainingLoadVersion)return;
 if(error){$('trainingList').textContent='Ladefehler: '+error.message;return;}
 trainingRows=data||[];
 const {data:rules,error:ruleError}=await client.from('training_countermeasures').select('id,owner_id,error_key,rule_text,activated_at');
 trainingMeasures=ruleError?[]:(rules||[]);
 const counts=new Map();
 for(const t of trainingRows){for(const m of METRICS.filter(m=>!m.good)){if(m.has(t))counts.set(m.key,(counts.get(m.key)||0)+1);}}
 const sorted=[...counts].sort((a,b)=>b[1]-a[1]);
 const focus=$('trainingFocusBody');
 if(focus){
  const reviewed=trainingRows.filter(t=>t.observations?.compliance_reviewed).length;
  const total=trainingRows.length;
  const key=sorted[0]?.[0];const count=sorted[0]?.[1]||0;
  const label=METRICS.find(m=>m.key===key)?.label||key||'';
  const measuresForKey=trainingMeasures.filter(m=>m.error_key===key&&m.rule_text);
  const explicit=measuresForKey[0]?.rule_text||trainingRows.flatMap(t=>reviewErrors(t)).find(e=>e.type===key&&e.countermeasure)?.countermeasure||'';
  const task=explicit||'Noch keine eigene Gegenmaßnahme gespeichert. Lege sie im Review fest.';
  focus.replaceChildren();
  const p=document.createElement('p');p.className='focus-caveat';p.textContent=`Datenbasis: ${total} abgeschlossene Entscheidungen · ${reviewed} mit expliziter Regelprüfung. Nur dokumentierte Muster; keine automatische Verhaltensdiagnose.`;focus.append(p);
  if(!key){const none=document.createElement('p');none.textContent=total?'Noch kein wiederkehrender dokumentierter Fehler. Fehlende Reviews nicht als fehlerfrei werten.':'Noch keine abgeschlossenen Trades vorhanden.';focus.append(none)}
  else{const title=document.createElement('strong');title.textContent=`Häufigster dokumentierter Fehler: ${label} (${count} dokumentierte Treffer)`;focus.append(title);const p2=document.createElement('p');p2.className='focus-task';p2.textContent=task;focus.append(p2);const note=document.createElement('p');note.className='focus-caveat';note.textContent=explicit?'Vorhandene Gegenmaßnahme aus deinem Journal.':'Der aktive Schwerpunkt wird ausschließlich von dir gewählt.';focus.append(note)}
 }
 const list=$('trainingList');list.replaceChildren();
 if(!sorted.length){list.textContent=trainingRows.length?'Noch keine Fehler in den letzten '+trainingRows.length+' abgeschlossenen Trades dokumentiert.':'Noch keine abgeschlossenen Trades vorhanden.';return;}
 const info=document.createElement('p');info.className='muted';info.textContent='Letzte '+trainingRows.length+' abgeschlossene Entscheidungen · Fehler je Trade gezählt · kein Leader/Follower-Doppelzählen';list.append(info);
 for(const [key,count] of sorted){
  const btn=document.createElement('button');btn.type='button';btn.className='training-priority';
  const top=document.createElement('div');top.className='row';
  const label=document.createElement('strong');label.textContent=METRICS.find(m=>m.key===key)?.label||REVIEW_LABELS[key]||key;
  const num=document.createElement('span');num.textContent=count+' / '+trainingRows.length;
  top.append(label,num);btn.append(top,trainingBar(count,trainingRows.length));
  btn.addEventListener('click',()=>openTrainingDetail(key));
  list.append(btn);
 }
}
function openTrainingDetail(key){
 const metric=METRICS.find(m=>m.key===key);const rows=trainingRows.filter(t=>metric?metric.has(t):hasReviewError(t,key));
 const detail=$('trainingDetail');detail.replaceChildren();detail.classList.remove('hidden');
 const h=document.createElement('h3');h.textContent='Training: '+(metric?.label||REVIEW_LABELS[key]||key);detail.append(h);
 const now=trainingRows.slice(0,25),old=trainingRows.slice(25,50);
 const count=arr=>arr.filter(t=>metric?metric.has(t):hasReviewError(t,key)).length;
 const comparison=document.createElement('p');comparison.className='muted';
 comparison.textContent='Neueste '+now.length+': '+count(now)+' Fehler · vorherige '+old.length+': '+count(old)+' Fehler. Nur dokumentierte Fälle; kein Wirksamkeitsnachweis.';
 detail.append(comparison);
 const measures=[...new Set(rows.flatMap(t=>reviewErrors(t).filter(e=>e.type===key).map(e=>e.countermeasure)).filter(Boolean))];
 const mh=document.createElement('h4');mh.textContent='Hinterlegte Gegenmaßnahmen';detail.append(mh);
 if(!measures.length){const p=document.createElement('p');p.className='muted';p.textContent='Noch keine Gegenmaßnahme hinterlegt. Öffne einen Trade und ergänze sie im Review.';detail.append(p);}
 for(const m of measures){const p=document.createElement('p');p.className='training-measure';p.textContent=m;detail.append(p);}
 const saved=trainingMeasures.find(m=>m.error_key===key);
 const editTitle=document.createElement('h4');editTitle.textContent='Aktive Wenn-Dann-Gegenmaßnahme';detail.append(editTitle);
 const input=document.createElement('textarea');input.rows=3;input.maxLength=1000;input.value=saved?.rule_text||measures[0]||'';input.placeholder='Wenn …, dann …';input.setAttribute('aria-label','Gegenmaßnahme bearbeiten');detail.append(input);
 const save=document.createElement('button');save.type='button';save.textContent='Gegenmaßnahme speichern';detail.append(save);
 const feedback=document.createElement('p');feedback.className='muted';detail.append(feedback);
 save.addEventListener('click',async()=>{
  const value=input.value.trim();if(value.length<5){feedback.textContent='Bitte eine konkrete Wenn-Dann-Regel mit mindestens 5 Zeichen eintragen.';return;}
  save.disabled=true;feedback.textContent='Speichert …';
  try{
   const {data,error}=await client.from('training_countermeasures').upsert({owner_id:currentUser.id,error_key:key,rule_text:value,activated_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'owner_id,error_key'}).select('id,owner_id,error_key,rule_text,activated_at').single();
   if(error)throw error;
   trainingMeasures=trainingMeasures.filter(x=>x.error_key!==key).concat(data);
   feedback.textContent='Gespeichert. Ab diesem Zeitpunkt wird die weitere Fehlerentwicklung beobachtet.';
  }catch(e){feedback.textContent='Speichern fehlgeschlagen: '+e.message;}
  finally{save.disabled=false;}
 });
 if(saved){
  const activated=new Date(saved.activated_at);
  const before=trainingRows.filter(t=>new Date(t.exit_at)<activated);
  const after=trainingRows.filter(t=>new Date(t.exit_at)>=activated);
  const countError=arr=>arr.filter(t=>metric?metric.has(t):hasReviewError(t,key)).length;
  const progress=document.createElement('p');progress.className='muted';
  progress.textContent='Seit Aktivierung: '+countError(after)+' / '+after.length+' Trades · davor: '+countError(before)+' / '+before.length+' Trades. Vergleich nur bei ausreichend Daten sinnvoll; kein Kausalitätsnachweis.';
  detail.append(progress);
 }
 const th=document.createElement('h4');th.textContent='Betroffene Trades ('+rows.length+')';detail.append(th);
 for(const t of rows){
  const btn=document.createElement('button');btn.type='button';btn.className='training-trade';
  btn.textContent=berlinTime(t.entry_at)+' · '+t.setup_type+' · '+t.direction+' '+t.instrument+' · '+(t.execution_grade||'unbewertet');
  btn.addEventListener('click',()=>openTrainingTrade(t));detail.append(btn);
 }
 detail.scrollIntoView({behavior:'smooth',block:'start'});
}
async function openTrainingTrade(t){
 const detail=$('trainingDetail');let panel=$('trainingTradeDetail');
 if(!panel){panel=document.createElement('div');panel.id='trainingTradeDetail';detail.append(panel);}
 panel.replaceChildren();
 const title=document.createElement('h4');title.textContent='Trade · '+t.setup_type;panel.append(title);
 const obs=t.observations||{};
 const p=document.createElement('p');
 p.textContent=berlinTime(t.entry_at)+' · '+t.direction+' '+t.instrument+' · P&L: '+(finiteValue(t.realized_pnl_usd)?usd(t.realized_pnl_usd)+' USD':'nicht erfasst')+' · Entry: '+(t.entry_emotion||obs.entry_emotion||'nicht erfasst')+' · Exit: '+(t.exit_emotion||obs.exit_emotion||'nicht erfasst');
 panel.append(p);
 const note=document.createElement('p');note.textContent='Review: '+(obs.review_note||'Keine Notiz');panel.append(note);
 const action=document.createElement('p');action.textContent='Fehler / Gegenmaßnahmen: '+(reviewErrors(t).map(e=>(REVIEW_LABELS[e.type]||e.type)+': '+e.countermeasure).join(' · ')||'Nicht hinterlegt');panel.append(action);
 const open=document.createElement('button');open.type='button';open.textContent='Trade vollständig öffnen / Review bearbeiten';
 open.addEventListener('click',async()=>{
  open.disabled=true;try{await openJournalTradeById(t.id);}catch(err){message('Trade nicht geöffnet: '+err.message,true);}finally{open.disabled=false;}
 });
 panel.append(open);
 const shots=document.createElement('div');shots.className='training-shots';panel.append(shots);
 try{
  const prefix=chartPath('trade',t.id,'');
  const {data,error}=await client.storage.from(CHART_BUCKET).list(prefix,{limit:30});
  if(error)throw error;
  for(const file of data||[]){
   if(!file.name||file.name.endsWith('/'))continue;
   const path=prefix+file.name;
   const {data:signed,error:signError}=await client.storage.from(CHART_BUCKET).createSignedUrl(path,120);
   if(signError||!signed?.signedUrl)continue;
   const link=document.createElement('a');link.href=signed.signedUrl;link.target='_blank';link.rel='noopener noreferrer';
   const img=document.createElement('img');img.src=signed.signedUrl;img.alt='Trade-Screenshot';img.loading='lazy';link.append(img);shots.append(link);
  }
 }catch(e){const warn=document.createElement('p');warn.className='muted';warn.textContent='Screenshots konnten nicht geladen werden: '+e.message;panel.append(warn);}
 panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('reloadTraining').addEventListener('click',loadTraining);


let analyticsRows=[],analyticsAccountRows=[],analyticsResults=[],trainingMeasures=[];
const METRICS=[
 {key:'clean_entry',label:'Entry: selbst als „nach Plan“ angegeben',good:true,has:t=>t.entry_emotion==='plan'||t.observations?.entry_emotion==='plan'},
 {key:'disciplined_exit',label:'Exit: selbst als „nach Plan“ angegeben',good:true,has:t=>t.exit_emotion==='disciplined'||t.observations?.exit_emotion==='disciplined'},
 {key:'clean_rules',label:'Regeln eingehalten',good:true,has:t=>t.observations?.compliance_reviewed&&!t.rule_deviation},
 {key:'a_plus',label:'A+ Ausführung',good:true,has:t=>t.execution_grade==='A+'},
 {key:'other',label:'Sonstiger dokumentierter Fehler',good:false,has:t=>hasReviewError(t,'other')},
 {key:'fomo',label:'FOMO',good:false,has:t=>hasReviewError(t,'fomo')},
 {key:'revenge',label:'Revenge-Entry',good:false,has:t=>hasReviewError(t,'revenge')},
 {key:'impulsive',label:'Impulsiver Entry',good:false,has:t=>hasReviewError(t,'impulsive')},
 {key:'overtrading',label:'Overtrading',good:false,has:t=>hasReviewError(t,'overtrading')},
 {key:'poor_entry',label:'Schlechter Entry',good:false,has:t=>hasReviewError(t,'poor_entry')},
 {key:'stop_management',label:'SL-Fehler',good:false,has:t=>hasReviewError(t,'stop_management')},
 {key:'early_exit',label:'Zu früher Exit',good:false,has:t=>hasReviewError(t,'early_exit')},
 {key:'plan_violation',label:'Planabweichung',good:false,has:t=>hasReviewError(t,'plan_violation')},
 {key:'fear_exit',label:'Exit aus Angst',good:false,has:t=>hasReviewError(t,'fear_exit')},
 {key:'greed_exit',label:'Exit aus Gier',good:false,has:t=>hasReviewError(t,'greed_exit')},
 {key:'frustration_exit',label:'Exit aus Frust',good:false,has:t=>hasReviewError(t,'frustration_exit')}
];
function metricRows(rows){return METRICS.map(m=>({...m,rows:rows.filter(m.has)})).filter(m=>m.rows.length).sort((a,b)=>b.rows.length-a.rows.length||a.label.localeCompare(b.label));}
function renderMetricList(target,metrics,total,callback){
 target.replaceChildren();
 if(!metrics.length){target.textContent='Noch keine entsprechend dokumentierten Trades.';return;}
 for(const metric of metrics){
  const btn=document.createElement('button');btn.type='button';btn.className='training-priority';
  const head=document.createElement('div');head.className='row';
  const name=document.createElement('strong');name.textContent=metric.label;
  const count=document.createElement('span');count.textContent=metric.rows.length+' / '+total;
  head.append(name,count);btn.append(head);
  const bar=trainingBar(metric.rows.length,total);bar.firstElementChild.style.background=metric.good?'#16a34a':'#dc2626';btn.append(bar);
  btn.addEventListener('click',()=>callback(metric));target.append(btn);
 }
}
async function loadAnalytics(){
 if(!currentUser)return;
 const {data,error}=await client.from('trades').select('id,session_id,setup_type,direction,instrument,entry_at,exit_at,entry_emotion,exit_emotion,execution_grade,rule_deviation,observations,realized_pnl_usd,initial_risk_usd').not('exit_at','is',null).order('exit_at',{ascending:false}).limit(50);
 if(error){$('analyticsSummary').textContent='Analyse nicht geladen: '+error.message;return;}
 analyticsRows=data||[];
 const ids=analyticsRows.map(t=>t.id);
 analyticsAccountRows=[];analyticsResults=[];
 if(ids.length){
  const {data:allocs,error:allocError}=await client.from('trade_account_allocations').select('id,trade_id,account_id,initial_risk_usd').in('trade_id',ids);
  if(allocError){$('analyticsSummary').textContent='Kontozuordnungen nicht geladen: '+allocError.message;return;}
  analyticsAccountRows=allocs||[];
  if(analyticsAccountRows.length){
   const {data:results,error:resultsError}=await client.from('account_trade_results').select('allocation_id,realized_pnl_usd,fees_usd,result_status').in('allocation_id',analyticsAccountRows.map(a=>a.id));
   if(resultsError){$('analyticsSummary').textContent='Kontoergebnisse nicht geladen: '+resultsError.message;return;}
   analyticsResults=results||[];
  }
 }
 const filter=$('analyticsAccount'),prior=filter.value;filter.replaceChildren();
 const all=document.createElement('option');all.value='all';all.textContent='Alle Konten · Entscheidungen';filter.append(all);
 for(const a of allAccounts){const o=document.createElement('option');o.value=a.id;o.textContent=a.account_name;filter.append(o);}
 for(const id of new Set(analyticsAccountRows.map(a=>a.account_id))){if(![...filter.options].some(o=>o.value===id)){const o=document.createElement('option');o.value=id;o.textContent='Historisches Konto · '+id.slice(0,8);filter.append(o);}}
 filter.value=[...filter.options].some(o=>o.value===prior)?prior:'all';
 renderAnalytics();renderTopFive();
}
function filteredAnalytics(){
 const id=$('analyticsAccount').value;
 if(id==='all')return analyticsRows;
 const tradeIds=new Set(analyticsAccountRows.filter(x=>x.account_id===id).map(x=>x.trade_id));
 return analyticsRows.filter(t=>tradeIds.has(t.id));
}
function renderAnalytics(){
 const rows=filteredAnalytics(),total=rows.length;
 const filter=$('analyticsAccount').value;
 const sum=$('analyticsSummary');sum.replaceChildren();
 const p=document.createElement('p');p.textContent=total+' Entscheidungen im aktuellen Fenster der letzten 50 abgeschlossenen Trades. Kopierte Ausführungen zählen nur einmal als Entscheidung.';sum.append(p);
 if(filter==='all'){
  const valid=rows.map(t=>allocationSummary(analyticsAccountRows.filter(a=>a.trade_id===t.id),analyticsResults)).filter(t=>t.rMultiple!==null);
  const average=valid.length?valid.reduce((n,t)=>n+t.rMultiple,0)/valid.length:null;
  const r=document.createElement('p');r.textContent='Ø Brutto-R je Entscheidung: '+(average===null?'nicht berechenbar':average.toFixed(2)+' R')+' ('+valid.length+' gültige Risiken).';sum.append(r);
 }else{
  const allocations=analyticsAccountRows.filter(x=>x.account_id===filter&&rows.some(t=>t.id===x.trade_id));
  const byAllocation=new Map(analyticsResults.map(x=>[x.allocation_id,x]));
  const valid=allocations.filter(x=>{const r=byAllocation.get(x.id);return finiteValue(x.initial_risk_usd)&&Number(x.initial_risk_usd)>0&&r?.result_status==='final'&&finiteValue(r.realized_pnl_usd)&&(r.fees_usd==null||finiteValue(r.fees_usd));});
  const avg=valid.length?valid.reduce((n,a)=>n+(Number(byAllocation.get(a.id).realized_pnl_usd)-Number(byAllocation.get(a.id).fees_usd||0))/Number(a.initial_risk_usd),0)/valid.length:null;
  const p=document.createElement('p');p.textContent='Ø Netto-R je Kontoausführung: '+(avg===null?'nicht berechenbar':avg.toFixed(2)+' R')+' ('+valid.length+' Ausführungen).';sum.append(p);
 }
 const metrics=metricRows(rows);
 renderMetricList($('analyticsGood'),metrics.filter(x=>x.good),total,openAnalyticsMetric);
 renderMetricList($('analyticsBad'),metrics.filter(x=>!x.good),total,openAnalyticsMetric);
}
function openAnalyticsMetric(metric){
 const panel=$('analyticsDrilldown');panel.replaceChildren();panel.classList.remove('hidden');
 const title=document.createElement('h3');title.textContent=metric.label+' · '+metric.rows.length+' Trades';panel.append(title);
 for(const trade of metric.rows){
  const b=document.createElement('button');b.type='button';b.className='training-trade';
  b.textContent=berlinTime(trade.entry_at)+' · '+trade.setup_type+' · '+trade.direction+' · '+(trade.execution_grade||'unbewertet');
  b.addEventListener('click',()=>openAnalyticsTrade(trade));panel.append(b);
 }
 panel.scrollIntoView({behavior:'smooth',block:'start'});
}
async function openAnalyticsTrade(trade){
 showView('training');
 const detail=$('trainingDetail');detail.classList.remove('hidden');detail.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='Trade-Details · '+trade.setup_type;detail.append(heading);
 await openTrainingTrade(trade);
}
function renderTopFive(){
 const target=$('topFiveBody');
 renderMetricList(target,metricRows(analyticsRows).slice(0,5),analyticsRows.length,openAnalyticsTradeMetric);
}
function openAnalyticsTradeMetric(metric){showView('analytics');openAnalyticsMetric(metric);}
$('reloadTopFive').addEventListener('click',loadAnalytics);
$('analyticsAccount').addEventListener('change',renderAnalytics);
$('reloadAnalytics').addEventListener('click',loadAnalytics);


async function loadOpenReviews(){
 if(!currentUser)return;
 const el=$('openReviewsBody');el.textContent='Wird geladen …';
 const {data,error}=await client.from('trades').select('id,session_id,setup_type,direction,instrument,entry_at,exit_at,entry_emotion,exit_emotion,execution_grade,rule_deviation,observations,realized_pnl_usd,initial_risk_usd').not('exit_at','is',null).order('exit_at',{ascending:false}).limit(200);
 if(error){el.textContent='Ladefehler: '+error.message;return;}
 const open=(data||[]).filter(t=>!reviewIsComplete(t));
 el.replaceChildren();
 if(!open.length){el.textContent='Keine offenen Reviews unter den letzten '+(data||[]).length+' abgeschlossenen Trades.';return;}
 const label=document.createElement('p');label.className='muted';label.textContent=open.length+' offene Reviews · letzte '+(data||[]).length+' abgeschlossene Trades';el.append(label);
 for(const trade of open.slice(0,20)){
  const btn=document.createElement('button');btn.type='button';btn.className='training-trade';
  btn.textContent=berlinTime(trade.entry_at)+' · '+trade.setup_type+' · '+trade.direction;
  btn.addEventListener('click',()=>openAnalyticsTrade(trade));el.append(btn);
 }
 if(open.length>20){const p=document.createElement('p');p.textContent='Es werden die ersten 20 angezeigt.';el.append(p);}
}
$('reloadOpenReviews').addEventListener('click',loadOpenReviews);

async function loadProgressAndPlaybook(){
 const progress=$('progressPanel'),playbook=$('playbookPanel');
 progress.classList.remove('hidden');playbook.classList.remove('hidden');
 const {data:closed,error}=await client.from('trades')
 .select('id,setup_type,direction,instrument,entry_at,exit_at,entry_emotion,exit_emotion,execution_grade,rule_deviation,observations,realized_pnl_usd,initial_risk_usd')
 .not('exit_at','is',null).order('exit_at',{ascending:false}).limit(50);
 if(error){$('progressBody').textContent='Ladefehler: '+error.message;$('playbookBody').textContent='Ladefehler: '+error.message;return;}
 const {data:all,error:bookError}=await client.from('trades')
 .select('id,setup_type,direction,instrument,entry_at,exit_at,execution_grade,rule_deviation,observations')
 .order('entry_at',{ascending:false}).limit(1000);
 if(bookError){$('playbookBody').textContent='Playbook-Ladefehler: '+bookError.message;}
 const recent=closed||[];
 const reviewed=recent.filter(t=>t.observations?.compliance_reviewed);
 const clean=reviewed.filter(t=>!t.rule_deviation).length;
 const graded=recent.filter(t=>t.execution_grade&&t.execution_grade!=='unrated');
 const aplus=graded.filter(t=>t.execution_grade==='A+').length;
 const pnl=recent.reduce((n,t)=>n+Number(t.realized_pnl_usd||0),0);
 const risk=recent.reduce((n,t)=>n+Number(t.initial_risk_usd||0),0);
 const riskComplete=recent.length>0&&recent.every(t=>t.initial_risk_usd!=null&&Number(t.initial_risk_usd)>0);
 const counts={};for(const t of recent)for(const key of new Set(reviewErrors(t).map(e=>e.type)))counts[key]=(counts[key]||0)+1;
 const halves=[recent.slice(0,25),recent.slice(25,50)];
 const errorRate=documentedErrorRate;
 const measures=[...new Set(recent.flatMap(t=>reviewErrors(t).map(e=>e.countermeasure)).filter(Boolean))];
 const measureHtml=measures.slice(0,8).map(m=>{
  const relevant=recent.filter(t=>reviewErrors(t).some(e=>e.countermeasure===m));
  const hits=relevant.filter(t=>reviewErrors(t).length).length;
  return `<div class="measure"><strong>${escapeHtml(m)}</strong><div class="muted">${relevant.length} dokumentierte Zuordnungen · ${hits} mit Fehlerkennzeichnung. Keine Aussage über Wirksamkeit ohne Folgetrade-Verknüpfung.</div></div>`;
 }).join('');
 const errors=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>escapeHtml(REVIEW_LABELS[k]||k)+': '+v).join(' · ');
 $('progressBody').innerHTML=`<p><strong>${recent.length}/50</strong> abgeschlossene Trades · <strong>${usd(pnl)} USD</strong> Brutto · <strong>${riskComplete&&risk>0?(pnl/risk).toFixed(2):'–'} R</strong></p>
 <p>Regelprüfung: ${reviewed.length}/${recent.length} dokumentiert · ${reviewed.length?Math.round(clean/reviewed.length*100)+' % ohne Regelbruch':'noch keine Quote'}</p>
 <p>A+: ${aplus}/${graded.length} bewertete Trades${graded.length?' ('+Math.round(aplus/graded.length*100)+' %)':''}</p>
 <p>Fehler: ${errors||'keine dokumentiert'}</p>
 <p>Fehlerquote unter geprüften Trades · neueste 25: ${errorRate(halves[0])} · vorherige 25: ${errorRate(halves[1])}. Nur dokumentierte Fehler; keine Kausalitätsaussage.</p>
 `;
 if(bookError)return;
 const saved=(all||[]).filter(t=>t.observations?.playbook);
 $('playbookBody').innerHTML=saved.length?saved.map(t=>`<div class="account"><strong>${escapeHtml(t.setup_type)} · ${escapeHtml(t.direction)} ${escapeHtml(t.instrument)}</strong><div class="muted">${escapeHtml(berlinTime(t.entry_at))} · ${escapeHtml(t.execution_grade||'unbewertet')}</div><p>${escapeHtml(t.observations?.review_note||'Keine Notiz')}</p><button type="button" class="secondary playbook-open" data-trade-id="${t.id}">Trade öffnen</button></div>`).join(''):'Noch keine Setups übernommen.';
 if((all||[]).length===1000)$('playbookBody').insertAdjacentHTML('beforeend','<p class="notice">Playbook: maximal 1000 neueste Trades geprüft.</p>');
}
$('reloadProgress').addEventListener('click',loadProgressAndPlaybook);
$('playbookBody').addEventListener('click',async e=>{
 const btn=e.target.closest('.playbook-open');if(!btn)return;
 btn.disabled=true;try{await openJournalTradeById(btn.dataset.tradeId);}catch(err){message('Playbook-Trade nicht geöffnet: '+err.message,true);}finally{btn.disabled=false;}
});

$('sessionTradeList').addEventListener('click',async e=>{
  const btn=e.target.closest('.open-trade');if(!btn)return;
  const trade=sessionTrades.find(t=>t.id===btn.dataset.id);if(!trade)return;
  btn.disabled=true;
  try{showView('journal');await openTradeDetails(trade);requestAnimationFrame(()=>setTimeout(()=>{$('tradeDetails').scrollIntoView({behavior:'smooth',block:'start'});},70));}finally{btn.disabled=false}
});
const durationLabel=(start,end)=>{const seconds=Math.max(0,Math.round((new Date(end)-new Date(start))/1000));const mins=Math.floor(seconds/60);return Math.floor(mins/60)+' h '+String(mins%60).padStart(2,'0')+' min'+(mins===0?' '+seconds+' s':'');};
function parseMoney(raw){const s=raw.trim().replace(',','.');return /^-?\d+(?:\.\d{1,2})?$/.test(s)?Number(s):null;}
const EXIT_UNIT_KEY='tt5000_exit_unit_v7';
function preferredExitUnit(){try{return localStorage.getItem(EXIT_UNIT_KEY)==='usd'?'usd':'ticks';}catch(_){return 'ticks';}}
function tickDollarValue(card){return ({NQ:5,MNQ:.5,ES:12.5,MES:1.25}[card.dataset.instrument]||0)*Number(card.dataset.quantity);}
function exitResult(card){
  const unit=card.querySelector('.exit-unit').value;
  const raw=card.querySelector('.exit-amount').value.trim().replace(',','.');
  const amount=/^-?\d+(?:\.\d{1,2})?$/.test(raw)?Number(raw):null;
  const tickValue=tickDollarValue(card);
  if(amount===null||!Number.isFinite(amount)||!(tickValue>0))return null;
  if(unit==='ticks'&&!Number.isInteger(amount))return null;
  const dollars=unit==='ticks'?amount*tickValue:amount;
  if(!Number.isFinite(dollars))return null;
  return {dollars:Math.round(dollars*100)/100,ticks:unit==='ticks'?amount:null,unit};
}
function updateExitPreview(editor){
  let total=0,risk=0,totalFees=0,complete=true;
  editor.querySelectorAll('.exit-account').forEach(card=>{
    const result=exitResult(card),initial=Number(card.dataset.risk),tickValue=tickDollarValue(card);
    if(!result||!card.dataset.risk||initial<=0)complete=false;
    else {total+=result.dollars;risk+=initial;}
    const feesInput=card.querySelector('.exit-fees').value;
    const fee=feesInput.trim()===''?0:parseMoney(feesInput);
    const net=result&&fee!==null&&fee>=0?result.dollars-fee:null;
    if(fee===null||fee<0)complete=false;else totalFees+=fee;
    card.querySelector('.exit-r').textContent=result&&initial>0
      ?'Brutto-R: '+(result.dollars/initial).toFixed(2)+(net!==null?' · Netto nach Gebühren: '+usd(net)+' USD':' · Gebühren prüfen')
      :'R: –';
    const unit=card.querySelector('.exit-unit').value;
    card.querySelector('.exit-equivalent').textContent=!result?'Entspricht: –':unit==='ticks'
      ?'Entspricht '+usd(result.dollars)+' USD brutto · '+(result.ticks*.25).toFixed(2)+' Punkte'
      :'Entspricht '+(result.dollars/tickValue).toLocaleString('de-DE',{maximumFractionDigits:2})+' Ticks (rechnerisch)';
  });
  editor.querySelector('.exit-preview').textContent=complete
    ?'Gesamt brutto: '+usd(total)+' USD · Gebühren: '+usd(totalFees)+' USD · Netto: '+usd(total-totalFees)+' USD · Brutto-R: '+(total/risk).toFixed(2)
    :'Gesamtergebnis: bitte alle Konten vollständig ausfüllen';
}
$('tradeDetails').addEventListener('change',e=>{
  if(e.target.matches('.exit-unit')){
    const card=e.target.closest('.exit-account');
    // The entered number remains untouched when switching units; no silent reinterpretation of stored data.
    try{localStorage.setItem(EXIT_UNIT_KEY,e.target.value);}catch(_){}
    card.querySelector('.exit-amount').value='';
    card.querySelector('.exit-amount').placeholder=e.target.value==='ticks'?'z. B. 100 oder -40':'z. B. 500 oder -75';
    const editor=e.target.closest('.exit-editor');updateExitPreview(editor);
  }
  if(e.target.matches('.exit-reason')){
    const editor=e.target.closest('.exit-editor');
    const feedback=editor?.querySelector('.exit-feedback');
    if(feedback)feedback.textContent='';
    e.target.style.outline='';
  }
});
$('tradeDetails').addEventListener('input',e=>{
  const editor=e.target.closest('.exit-editor');
  if(editor){e.target.style.outline='';const feedback=editor.querySelector('.exit-feedback');if(feedback)feedback.textContent='';updateExitPreview(editor);}
});
$('tradeDetails').addEventListener('click',e=>{
  const b=e.target.closest('.exit-negate');if(!b)return;
  const field=b.closest('.exit-account').querySelector('.exit-amount');
  const raw=field.value.trim();
  field.value=raw===''?'-1':raw.startsWith('-')?raw.slice(1):'-'+raw;
  field.dispatchEvent(new Event('input',{bubbles:true}));
});
$('tradeDetails').addEventListener('click',async e=>{
  const btn=e.target.closest('.close-trade-action');if(!btn||busy)return;
  const editor=btn.closest('.exit-editor'),reason=editor.querySelector('.exit-reason').value;
  const feedback=editor.querySelector('.exit-feedback');
  const fail=(msg,field)=>{
    feedback.textContent=msg;feedback.style.color='#ffb4ad';
    if(field){field.style.outline='2px solid #ffb4ad';field.scrollIntoView({behavior:'smooth',block:'center'});field.focus({preventScroll:true});}
    else feedback.scrollIntoView({behavior:'smooth',block:'center'});
    message(msg,true);
  };
  feedback.textContent='';
  editor.querySelectorAll('input,select').forEach(el=>el.style.outline='');
  if(!reason){fail('Bitte Exit-Grund auswählen.',editor.querySelector('.exit-reason'));return;}
  const exitEmotion=selectedEmotion(editor.querySelector('[data-emotion-group="exitCommitEmotion"]'));const exitEmotions=[...editor.querySelectorAll('[data-emotion-group="exitCommitEmotion"] button[aria-pressed="true"]')].map(b=>b.dataset.value);
  const exitScales=readScales(editor.querySelector('[data-emotion-group="exitCommitEmotion"]'));if(!Object.keys(exitScales).length){fail('Bitte mindestens eine Empfindung auf der Skala bewerten.');return;}
  const results=[];
  for(const card of editor.querySelectorAll('.exit-account')){
    const result=exitResult(card);
    const feesRaw=card.querySelector('.exit-fees').value;
    const fees=feesRaw.trim()===''?0:parseMoney(feesRaw);
    if(!result){fail('Bitte gültiges Ergebnis eingeben: Ticks als ganze Zahl oder USD mit maximal zwei Nachkommastellen.',card.querySelector('.exit-amount'));return;}
    if(fees===null||fees<0){fail('Gebühren dürfen nicht negativ oder ungültig sein.',card.querySelector('.exit-fees'));return;}
    if(!card.dataset.risk||Number(card.dataset.risk)<=0){
      const riskCard=$('tradeDetails').querySelector('.risk-card[data-id="'+card.dataset.id+'"]');
      const riskInput=riskCard?.querySelector('.risk-ticks');
      fail('Ursprüngliches Risiko fehlt. Trage oben den ursprünglichen SL-Abstand in Ticks ein. Die Eingabe wird automatisch gespeichert.',riskInput||card);
      if(riskCard){riskCard.classList.add('risk-attention');riskCard.querySelector('.risk-note').textContent='Hier fehlt das ursprüngliche Risiko. Ursprünglichen SL-Abstand eingeben und das Feld verlassen.';}
      return;
    }
    results.push({allocation_id:card.dataset.id,realized_pnl_usd:result.dollars,fees_usd:fees,tp_ticks:(['TP','extended_tp'].includes(reason)&&result.unit==='ticks'&&result.ticks>0)?result.ticks:null});
  }
  const total=results.reduce((s,r)=>s+r.realized_pnl_usd,0);
  const totalFees=results.reduce((s,r)=>s+r.fees_usd,0);
  if(!confirm('Trade mit '+results.length+' Kontoergebnissen abschließen? Brutto '+usd(total)+' USD, Gebühren '+usd(totalFees)+' USD, Netto '+usd(total-totalFees)+' USD. Keine Brokerorder.'))return;
  busy=true;btn.disabled=true;btn.textContent='Wird abgeschlossen …';feedback.textContent='Abschluss wird gespeichert …';feedback.style.color='';
  try{
    const tradeId=$('tradeDetails').dataset.tradeId;
    const {data,error}=await client.rpc('close_trade_with_scales_v736',{p_trade_id:tradeId,p_exit_reason:reason,p_results:results,p_scales:exitScales});
    if(error)throw error;
    if(!data||data.trade_id!==tradeId)throw new Error('Abschluss nicht eindeutig bestätigt. Bitte zuerst Trade-Liste aktualisieren.');
    message('Trade in Supabase abgeschlossen: '+usd(data.total_pnl_usd)+' USD · '+Number(data.r_multiple).toFixed(2)+' R.');
    draftMarkSaved(tradeId,'exit');
    editor.remove(); // The committed exit form must not be saved again.
    draftDirty=false;clearTimeout(draftTimer);
    try{
      await loadSessionTrades();
      const closed=sessionTrades.find(t=>t.id===tradeId);
      if(closed)await openTradeDetails(closed);else await openJournalTradeById(tradeId);
    }catch(refreshError){
      message('Trade gespeichert, aber Ansicht nicht vollständig aktualisiert: '+refreshError.message,true);
    }
  }catch(err){fail('Trade-Abschluss nicht bestätigt: '+err.message+' — vor einem erneuten Versuch die Trade-Liste aktualisieren.');}
  finally{busy=false;btn.disabled=false;btn.textContent='Trade endgültig abschließen';}
});
$('tradeDetails').addEventListener('click',e=>{
  const btn=e.target.closest('.stop-minus,.stop-plus,.stop-preset,.stop-reason-choice');
  if(!btn)return;
  const panel=btn.closest('.stop-panel');if(!panel)return;
  if(btn.classList.contains('stop-reason-choice')){
    panel.querySelector('.stop-reason').value=btn.dataset.reason;
    panel.querySelectorAll('.stop-reason-choice').forEach(b=>{const selected=b===btn;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
    return;
  }
  const field=panel.querySelector('.stop-new');
  if(btn.classList.contains('stop-preset'))field.value=btn.dataset.ticks;
  else{
    const raw=field.value.trim();const current=/^-?\d+$/.test(raw)?Number(raw):Number(panel.querySelector('.save-stop').dataset.previous);
    field.value=String(current+(btn.classList.contains('stop-plus')?1:-1));
  }
});
$('tradeDetails').addEventListener('click',async e=>{
  const btn=e.target.closest('.save-stop');if(!btn||busy)return;
  const panel=btn.closest('.stop-panel');
  const field=panel.querySelector('.stop-new');
  const next=Number(field.value),previous=Number(btn.dataset.previous);
  const reason=panel.querySelector('.stop-reason').value;
  if(!/^-?\d+$/.test(field.value.trim())||!Number.isSafeInteger(next)||!Number.isSafeInteger(previous)){
    message('Bitte den neuen SL als ganze, vorzeichenbehaftete Tickzahl eingeben.',true);return;
  }
  if(next===previous){message('Der neue SL entspricht dem aktuellen SL.',true);return;}
  if(!reason){message('Bitte einen Grund für die SL-Verschiebung auswählen.',true);return;}
  if(!confirm('SL von '+previous+' auf '+next+' Ticks verschieben und dauerhaft dokumentieren? Keine Brokerorder.'))return;
  busy=true;btn.disabled=true;
  try{
    const {data,error}=await client.rpc('record_stop_adjustment',{
      p_allocation_id:btn.dataset.id,
      p_expected_previous_ticks:previous,
      p_new_stop_ticks:next,
      p_reason:reason,
      p_notes:panel.querySelector('.stop-notes').value.trim()||null
    });
    if(error)throw error;
    if(!data)throw new Error('Keine Bestätigung der Datenbank. Vor einem erneuten Versuch den Verlauf aktualisieren.');
    const draft=snapshotExitDraft();
    const position=rememberAccountPosition(btn);
    const activeTrade=detailTradeById($('tradeDetails').dataset.tradeId);
    if(activeTrade){await openTradeDetails(activeTrade);restoreExitDraft(draft);restoreAccountPosition(position);}
    message('SL-Verschiebung gespeichert: '+previous+' → '+next+' Ticks. Initialrisiko unverändert.');
  }catch(err){message('SL-Verschiebung nicht bestätigt: '+err.message+'\nVor erneutem Versuch den Verlauf kontrollieren.',true);}
  finally{busy=false;btn.disabled=false;}
});
$('tradeDetails').addEventListener('change',e=>{
 const input=e.target.closest('.risk-ticks,.risk-usd,.risk-override');if(!input)return;
 const card=input.closest('.risk-card');if(!card)return;
 const ticks=card.querySelector('.risk-ticks');
 if(!/^\d+$/.test(ticks.value.trim())||Number(ticks.value)<=0)return;
 const override=card.querySelector('.risk-override');
 const dollars=card.querySelector('.risk-usd');
 if(override.checked&&(!dollars.value.trim()||Number(dollars.value)<=0))return;
 if(busy){setTimeout(()=>{if(card.isConnected)card.querySelector('.save-risk')?.click();},400);return;}
 card.querySelector('.save-risk')?.click();
});
$('tradeDetails').addEventListener('click',async e=>{
  const btn=e.target.closest('.save-risk');if(!btn||busy)return;
  const card=btn.closest('.risk-card');
  const ticksInput=card.querySelector('.risk-ticks');
  const ticks=Number(ticksInput.value);
  const calc=updateRiskCard(card);
  if(ticksInput.value.trim()===''||!Number.isSafeInteger(ticks)||ticks<=0||calc===null||calc<=0){message('Bitte eine positive ganze Tickzahl eingeben.',true);return}
  const override=card.querySelector('.risk-override').checked;
  const usdInput=card.querySelector('.risk-usd');
  const actual=override?Number(usdInput.value):calc;
  if(override&&(usdInput.value.trim()===''||!Number.isFinite(actual)||actual<=0)){message('Bitte ein gültiges manuelles USD-Risiko eingeben.',true);return}

  busy=true;btn.disabled=true;
  try{
    const payload={initial_sl_points:ticksToPoints(ticks),calculated_risk_usd:calc,initial_risk_usd:riskRound(actual),risk_manually_overridden:override};
    const {data,error}=await client.from('trade_account_allocations').update(payload).eq('id',btn.dataset.id).select('id').single();
    if(error)throw error;
    if(!data)throw new Error('Keine Änderung bestätigt.');
    // Erfolg lokal an der Karte anzeigen; kein globaler Statusblock mit Layoutsprung.
    // Kein komplettes Neurendern: sonst springt die mobile Ansicht beim Kontowechsel.
    // Nur die betroffene Karte und den Exit-Risikowert aktualisieren.
    card.querySelector('.risk-note').textContent='Gespeichert · '+usd(payload.initial_risk_usd)+' USD Initialrisiko';
    card.classList.remove('risk-attention');
    const summary=card.querySelector('.muted');
    if(summary)summary.textContent=summary.textContent.replace(/Initialrisiko: (?:nicht erfasst|[^·]+)/,'Initialrisiko: '+usd(payload.initial_risk_usd)+' USD');
    const exitAccount=$('tradeDetails').querySelector('.exit-account[data-id="'+btn.dataset.id+'"]');
    if(exitAccount){exitAccount.dataset.risk=String(payload.initial_risk_usd);const riskLine=exitAccount.querySelector('.muted');if(riskLine)riskLine.textContent='Initialrisiko: '+usd(payload.initial_risk_usd)+' USD';updateExitPreview(exitAccount.closest('.exit-editor'));}
    // Falls der SL-Dialog noch keinen gültigen Initial-SL hatte, aktualisiere die Anzeige.
    const stopPanel=card.querySelector('.stop-panel');
    if(stopPanel){const current=stopPanel.querySelector('p.muted strong');if(current&&current.textContent.includes('Erst'))current.textContent='-'+ticks+' Ticks';if(!stopPanel.querySelector('.stop-new')){const trade=detailTradeById($('tradeDetails').dataset.tradeId);if(trade){const savedExit=snapshotExitDraft();await openTradeDetails(trade);restoreExitDraft(savedExit);message('SL gespeichert. Optionale SL-Verschiebung ist jetzt verfügbar.');}}}

  }catch(err){message('Risiko konnte nicht gespeichert werden: '+err.message,true)}
  finally{busy=false;btn.disabled=false}
});
async function loadCount(){
 const {data,error}=await client.rpc('trading_day_count_v735');
 if(error){tradeCount=0;$('tradeCount').textContent='Tageszähler nicht verfügbar';return;}
 tradeCount=Number(data?.count||0);$('tradeCount').textContent=tradeCount+' / 5 heute (Berlin)';
}

function openSessionSetup(mode){sessionDraftMode=mode;renderSessionAccounts();$('sessionSetup').classList.remove('hidden');$('noSession').classList.add('hidden');$('activeSession').classList.toggle('hidden',mode==='start');}
function renderSessionAccounts(){const selected=sessionDraftMode==='change'?(currentSession?.htf_context?.selected_accounts||[]):[];$('sessionAccountList').innerHTML=accounts.length?accounts.map(a=>`<label class="account-pick"><input class="sess-check" data-id="${escapeHtml(a.id)}" type="checkbox" ${selected.some(x=>x.account_id===a.id)?'checked':''}> ${escapeHtml(a.account_name)} <small>· ${escapeHtml(a.default_instrument)}</small></label>`).join(''):'<p>Lege zuerst unter Konten ein Konto an.</p><button type="button" id="goAccounts">Konten öffnen</button>';}
function sessionFeedback(text){$('sessionSetupFeedback').textContent=text;message(text,true)}
function getSessionSelection(){return [...document.querySelectorAll('.sess-check:checked')].map(c=>{const a=accounts.find(a=>a.id===c.dataset.id);return{account_id:a.id,instrument:a.default_instrument,planned_quantity:Number(a.default_quantity)};});}
$('startSession').onclick=()=>{if(currentSession){message('Es ist bereits eine Session offen. Schließe sie zuerst ab; offene Trades müssen zuvor dokumentiert werden.',true);return;}openSessionSetup('start');};
$('changeSessionAccounts').onclick=()=>openSessionSetup('change');
$('cancelSession').onclick=()=>{renderSession();};
$('confirmSession').onclick=async()=>{if(busy)return;const selection=getSessionSelection();if(!selection.length){sessionFeedback('Bitte mindestens ein Konto links mit dem Häkchen auswählen.');$('sessionAccountList').scrollIntoView({behavior:'smooth',block:'center'});return}if(selection.some(x=>!Number.isFinite(x.planned_quantity)||x.planned_quantity<=0)){sessionFeedback('Kontraktzahl muss für jedes ausgewählte Konto größer als null sein.');return}busy=true;$('confirmSession').disabled=true;try{if(sessionDraftMode==='start'){if(currentSession)throw new Error('Es ist bereits eine Session offen. Bitte zuerst abschließen.');const {data,error}=await client.from('trading_sessions').insert({session_date:localDate(),status:'open',htf_context:{selected_accounts:selection}}).select('id,session_date,status,htf_context,created_at').single();if(error)throw error;currentSession=data;await loadCount();message('Session mit '+selection.length+' Konto/Konten gestartet.');}else{const ctx={...(currentSession.htf_context||{}),selected_accounts:selection};const {data,error}=await client.from('trading_sessions').update({htf_context:ctx}).eq('id',currentSession.id).filter('htf_context','eq',JSON.stringify(currentSession.htf_context||{})).select('htf_context').single();if(error)throw error;currentSession.htf_context=data.htf_context;message('Kontenauswahl für kommende Trades gespeichert.');}renderSession();renderDecision();await loadSessionTrades();await renderHtfImage();if(sessionDraftMode==='start'){message('Session gestartet. Bitte jetzt HTF-Kontext und Checks speichern.');showSessionHub();}}catch(e){sessionFeedback('Session konnte nicht gespeichert werden: '+e.message)}finally{busy=false;$('confirmSession').disabled=false}};
$('sessionUrge').addEventListener('change',()=>{if(currentSession&&!busy)$('saveHtf').click();});
$('saveHtf').onclick=async()=>{if(!currentSession)return;const ctx={...(currentSession.htf_context??{}),notes:sessionContextText(),structured_notes:Object.fromEntries([...document.querySelectorAll('.htf-note')].map(el=>[el.dataset.note,el.value.trim()])),free_notes:$('htf').value,preflight_checks:Object.fromEntries([...document.querySelectorAll('.htf-check')].map(el=>[el.dataset.check,el.checked])),mental_check:{...(currentSession.htf_context?.mental_check||{}),scales:readScales($('sessionMoodOptions')),urge:$('sessionUrge').value}};const {data,error}=await client.from('trading_sessions').update({htf_context:ctx}).eq('id',currentSession.id).filter('htf_context','eq',JSON.stringify(currentSession.htf_context||{})).select('htf_context').single();if(error)message('Kontext: '+error.message,true);else{currentSession.htf_context=data.htf_context;saveWorkspace();syncEntrySession();message('HTF-Kontext und mentaler Session-Check gespeichert.');$('sessionEmotionStatus').textContent=sessionReady()?'Vorbereitung gespeichert. Weiter zum Trade.':'Gespeichert. Für den Entry alle vier Punkte prüfen und mindestens eine Kontextnotiz ergänzen.'}};
$('refreshFinishChecklist').addEventListener('click',()=>refreshSessionFinishChecklist());
let finishRequestSeq=0;
async function refreshSessionFinishChecklist(){
 const el=$('sessionFinishChecklist'), btn=$('closeSession');
 const sessionId=currentSession?.id, seq=++finishRequestSeq;
 if(!sessionId){el.textContent='Keine aktive Session.';btn.disabled=true;return;}
 el.textContent='Offene Trades werden geprüft …';btn.disabled=true;
 const {data,error}=await client.from('trades')
   .select('id,setup_type,instrument,direction,entry_at')
   .eq('session_id',sessionId).is('exit_at',null).order('entry_at',{ascending:true}).limit(101);
 if(seq!==finishRequestSeq||currentSession?.id!==sessionId)return;
 if(error){el.textContent='Prüfung fehlgeschlagen: '+error.message+' · Session-Abschluss gesperrt.';return;}
 const open=data||[];
 el.replaceChildren();
 const headline=document.createElement('p');
 headline.className=open.length?'session-finish-warning':'session-finish-ready';
 headline.textContent=open.length?`${open.length}${open.length===101?'+':''} offene Trades – zuerst abschließen`:'✓ Keine offenen Trades · Session kann abgeschlossen werden';
 el.appendChild(headline);
 for(const trade of open.slice(0,100)){
  const row=document.createElement('div');row.className='session-finish-trade';
  const title=document.createElement('span');
  title.textContent=`${trade.instrument||'Future'} · ${(trade.direction||'').toUpperCase()} · ${trade.setup_type||'Trade'} · ${berlinTime(trade.entry_at)}`;
  const go=document.createElement('button');go.type='button';go.className='secondary';go.textContent='Trade öffnen →';
  go.addEventListener('click',async()=>{
   showView('journal');
   let target=sessionTrades.find(t=>t.id===trade.id);
   if(!target){await loadSessionTrades();target=sessionTrades.find(t=>t.id===trade.id);}
   if(target){await openTradeDetails(target);$('tradeDetails').scrollIntoView({behavior:'smooth',block:'start'});}
   else message('Trade konnte nicht geladen werden. Bitte Liste aktualisieren.',true);
  });
  row.append(title,go);el.appendChild(row);
 }
 if(open.length===101){const more=document.createElement('p');more.textContent='Mehr als 100 offene Trades. Abschluss gesperrt, bis alle geprüft sind.';el.appendChild(more);}
 btn.disabled=open.length>0;
}
$('closeSession').onclick=async()=>{
 if(!currentSession||busy)return;
 const status=$('closeSessionFeedback');
 const report=(text,isError=false)=>{status.textContent=text;status.style.color=isError?'#ffb4ad':'#9ff0d2';message(text,isError);};
 busy=true;$('closeSession').disabled=true;
 try{
  const sessionId=currentSession.id;
  const {count,error:openError}=await client.from('trades').select('id',{count:'exact',head:true}).eq('session_id',sessionId).is('exit_at',null);
  if(openError)throw openError;
  if(count>0){report(`${count} offene Trades. Bitte zuerst abschließen.`,true);await refreshSessionFinishChecklist();return;}
  if(!confirm('Session '+currentSession.session_date+' endgültig abschließen?'))return;
  const {data,error}=await client.rpc('close_session_safely_v718',{p_session_id:sessionId});
  if(error)throw error;
  if(data?.status!=='closed'||String(data?.session_id)!==String(sessionId))throw new Error('Server hat den Abschluss nicht bestätigt.');
  currentSession=null;renderSession();report('Session erfolgreich abgeschlossen. Du kannst jetzt eine neue Session starten.');showSessionHub();
  await Promise.allSettled([loadCount(),loadSessionTrades(),renderHtfImage()]);
 }catch(err){
  const id=currentSession?.id;
  if(id){
   try{
    const {data:serverSession,error:verifyError}=await client.from('trading_sessions')
      .select('id,status').eq('id',id).maybeSingle();
    if(!verifyError&&serverSession?.status==='closed'){
     currentSession=null;renderSession();showSessionHub();
     report('Session ist laut Server abgeschlossen. Die Abschlussbestätigung war unterbrochen.');
     await Promise.allSettled([loadCount(),loadSessionTrades(),renderHtfImage()]);
     return;
    }
    if(!verifyError&&serverSession?.status==='open'){
     report('Session ist laut Server noch offen: '+(err?.message||'Verbindungsfehler')+' · Bitte erneut prüfen.',true);
     return;
    }
   }catch(_){/* Status bleibt ungeklärt */}
  }
  report('Session-Status nicht bestätigt: '+(err?.message||'Verbindungsfehler')+'. Bitte Verbindung prüfen und Session aktualisieren, bevor du erneut abschließt.',true);
 }
 finally{busy=false;if(currentSession)await refreshSessionFinishChecklist();}
};
async function loadAccounts(){
  const {data,error}=await client.from('trading_accounts').select('id,account_name,account_type,broker,default_instrument,default_quantity,active').order('created_at',{ascending:true});
  if(error)throw new Error('Konten laden: '+error.message);
  allAccounts=data??[];
  accounts=allAccounts.filter(a=>a.active);
  renderSession();
  $('accountList').innerHTML=allAccounts.length?allAccounts.map(a=>`<div class="account"><div class="row"><div><strong>${escapeHtml(a.account_name)}</strong><div class="muted">${escapeHtml(a.account_type)} · ${escapeHtml(a.broker||'Kein Broker')} · ${escapeHtml(a.default_instrument)} × ${escapeHtml(a.default_quantity)}${a.active?'':' · DEAKTIVIERT'}</div></div><button type="button" class="secondary edit-account" data-id="${a.id}">Bearbeiten</button></div></div>`).join(''):'<p class="muted">Noch keine Konten angelegt.</p>';
  renderDecision();
}
$('accountList').addEventListener('click',e=>{
  const btn=e.target.closest('.edit-account');
  if(!btn)return;
  const a=allAccounts.find(x=>x.id===btn.dataset.id);
  if(!a)return;
  editingAccountId=a.id;
  $('editAccountName').value=a.account_name;
  $('editAccountType').value=a.account_type;
  $('editBroker').value=a.broker||'';
  $('editInstrument').value=a.default_instrument;
  $('editQty').value=a.default_quantity;
  $('deactivateAccount').textContent=a.active?'Konto deaktivieren':'Konto wieder aktivieren';
  $('accountEditor').classList.remove('hidden');
  $('accountEditor').scrollIntoView({behavior:'smooth',block:'nearest'});
});
function closeAccountEditor(){editingAccountId=null;$('accountEditor').classList.add('hidden')}
$('cancelAccountEdit').onclick=closeAccountEditor;
$('saveAccountEdit').onclick=async()=>{
  if(busy||!editingAccountId)return;
  const name=$('editAccountName').value.trim(),qty=Number($('editQty').value);
  if(!name||!Number.isFinite(qty)||qty<=0){message('Bitte Kontoname und gültige Kontraktzahl eingeben.',true);return}
  busy=true;$('saveAccountEdit').disabled=true;
  try{
    const {data,error}=await client.from('trading_accounts').update({
      account_name:name,account_type:$('editAccountType').value,
      broker:$('editBroker').value.trim()||null,
      default_instrument:$('editInstrument').value,
      default_quantity:qty,updated_at:new Date().toISOString()
    }).eq('id',editingAccountId).select('id').single();
    if(error)throw error;
    if(!data)throw new Error('Keine Kontoänderung bestätigt.');
    closeAccountEditor();await loadAccounts();message('Kontoänderungen gespeichert.');
  }catch(e){message('Konto bearbeiten: '+e.message,true)}
  finally{busy=false;$('saveAccountEdit').disabled=false}
};
$('deactivateAccount').onclick=async()=>{
  if(busy||!editingAccountId)return;
  const a=allAccounts.find(x=>x.id===editingAccountId);
  if(!a)return;
  const next=!a.active;
  if(!confirm(next?'Konto wieder aktivieren?':'Konto deaktivieren? Bestehende Trades bleiben erhalten.'))return;
  busy=true;$('deactivateAccount').disabled=true;
  try{
    const {data,error}=await client.from('trading_accounts').update({active:next,updated_at:new Date().toISOString()}).eq('id',editingAccountId).select('id').single();
    if(error)throw error;
    if(!data)throw new Error('Keine Änderung bestätigt.');
    closeAccountEditor();await loadAccounts();message(next?'Konto wieder aktiviert.':'Konto deaktiviert. Bestehende Trades bleiben erhalten.');
  }catch(e){message('Kontostatus ändern: '+e.message,true)}
  finally{busy=false;$('deactivateAccount').disabled=false}
};
$('addAccount').onclick=async()=>{const name=$('accountName').value.trim(),qty=Number($('defaultQty').value);if(!name||!Number.isFinite(qty)||qty<=0){message('Bitte Kontoname und gültige Kontraktzahl eingeben.',true);return}const {error}=await client.from('trading_accounts').insert({account_name:name,account_type:$('accountType').value,broker:$('broker').value.trim()||null,default_instrument:$('defaultInstrument').value,default_quantity:qty});if(error){message('Konto speichern: '+error.message,true);return}$('accountName').value='';message('Konto gespeichert.');await loadAccounts();};

const EMOTION_DEFAULTS={
 entryEmotion:{plan:'Nach Plan',fomo:'FOMO',revenge:'Revenge',impulsive:'Impulsiv'},
 duringTradeEmotion:{calm:'Ruhig',fear:'Angst',greed:'Gier',uncertain:'Unsicherheit'},
 exitCommitEmotion:{disciplined:'Nach Plan',fear:'Angst',greed:'Gier',frustration:'Frust',relief:'Erleichterung',uncertainty:'Unsicherheit',stress:'Stress'}
};
const EMOTION_TITLES={entryEmotion:'Vor dem Trade',duringTradeEmotion:'Während des Trades',exitCommitEmotion:'Nach dem Trade'};
function emotionLabels(){return currentUser?.user_metadata?.tt7_emotion_labels||{};}
function applyEmotionLabels(root=document){
 enhanceEmotionScales(root);
 const labels=emotionLabels();
 for(const [group,defaults] of Object.entries(EMOTION_DEFAULTS)){
  root.querySelectorAll('[data-emotion-group="'+group+'"] button[data-value]').forEach(button=>{
   const val=button.dataset.value;if(defaults[val])button.textContent=labels[group]?.[val]||defaults[val];
  });
 }
 // Im Review die gespeicherte Exit-Emotion ebenfalls lesbar anzeigen.
 root.querySelectorAll('[data-emotion-group="exitEmotion"] button[data-value]').forEach(button=>{
  const val=button.dataset.value;if(EMOTION_DEFAULTS.exitCommitEmotion[val])button.textContent=labels.exitCommitEmotion?.[val]||EMOTION_DEFAULTS.exitCommitEmotion[val];
 });
}
function renderEmotionManager(){
 const target=$('emotionManagerFields');if(!target)return;target.replaceChildren();
 const labels=emotionLabels();
 for(const [group,defaults] of Object.entries(EMOTION_DEFAULTS)){
  const heading=document.createElement('h4');heading.textContent=EMOTION_TITLES[group];target.append(heading);
  for(const [key,defaultLabel] of Object.entries(defaults)){
   const label=document.createElement('label');label.textContent=defaultLabel+' · Bezeichnung';
   const input=document.createElement('input');input.type='text';input.maxLength=35;input.value=labels[group]?.[key]||defaultLabel;input.dataset.group=group;input.dataset.emotionKey=key;
   label.append(input);target.append(label);
  }
 }
}
$('saveEmotionLabels').addEventListener('click',async()=>{
 const status=$('emotionManagerStatus'),button=$('saveEmotionLabels');if(!currentUser)return;
 const values={};for(const [group,defaults] of Object.entries(EMOTION_DEFAULTS))values[group]={};
 for(const input of $('emotionManagerFields').querySelectorAll('input[data-emotion-key]')){
  const v=input.value.trim();if(!v){status.textContent='Alle Emotionen benötigen eine Bezeichnung.';input.focus();return;}
  values[input.dataset.group][input.dataset.emotionKey]=v;
 }
 button.disabled=true;status.textContent='Speichere …';
 try{
  const {data,error}=await client.auth.updateUser({data:{tt7_emotion_labels:values}});
  if(error)throw error;
  currentUser=data.user||currentUser;applyEmotionLabels();status.textContent='Gespeichert · auf PC und Handy nach Anmeldung verfügbar.';
 }catch(error){status.textContent='Nicht gespeichert: '+error.message;}
 finally{button.disabled=false;}
});
const DEFAULT_SETUP_NAMES=['Liquidity Play','Trendbruch','Momentum','Kampagne Long','Kampagne Short','Countertrade'];
let setupCatalog=[],setupCatalogReady=false,setupCatalogBusy=false;
const setupNotice=(msg,error=false)=>{const el=$('setupManagerStatus');el.textContent=msg;el.className=error?'error':'ok';};
async function loadSetupCatalog(){
 if(!currentUser)return;
 const {data,error}=await client.from('trading_setup_catalog').select('id,name,description,active,sort_order,image_path').order('sort_order',{ascending:true}).order('created_at',{ascending:true});
 if(error){setupCatalogReady=false;$('setupCards').textContent='Setups konnten nicht geladen werden: '+error.message;return;}
 setupCatalog=data||[];setupCatalogReady=true;
 // Seed default setups once, only if this account has never had a catalog.
 if(!setupCatalog.length){
  const rows=DEFAULT_SETUP_NAMES.map((name,i)=>({owner_id:currentUser.id,name,sort_order:i}));
  const {error:seedError}=await client.from('trading_setup_catalog').insert(rows);
  if(seedError){setupNotice('Standard-Setups konnten nicht angelegt werden: '+seedError.message,true);}
  else{
   const {data:seeded,error:reloadError}=await client.from('trading_setup_catalog').select('id,name,description,active,sort_order,image_path').order('sort_order',{ascending:true}).order('created_at',{ascending:true});
   if(!reloadError)setupCatalog=seeded||[];
  }
 }
 renderSetupCards();renderSetupManager();applyEmotionLabels();
}
function renderSetupCards(){
 const target=$('setupCards'),selected=$('setup').value;
 target.replaceChildren();
 const active=setupCatalog.filter(x=>x.active);
 if(!active.length){target.textContent='Keine aktiven Setups. Über „Setups bearbeiten“ hinzufügen.';$('setup').value='';return;}
 if(!active.some(x=>x.name===selected)){$('setup').value='';$('setupSelectionStatus').textContent='Bitte ein Setup auswählen.';}
 for(const item of active){
  const button=document.createElement('button');button.type='button';
  button.className='setup-card'+(item.name===$('setup').value?' selected':'');
  const title=document.createElement('strong');title.textContent=item.name;button.appendChild(title);
  if(item.image_path){const image=document.createElement('img');image.className='setup-card-image';image.alt='Setup-Beispiel: '+item.name;button.prepend(image);signedChart(item.image_path).then(url=>{if(image.isConnected)image.src=url}).catch(()=>{if(image.isConnected)image.remove()});}
  const desc=document.createElement('small');desc.textContent=item.description||'Setup auswählen';button.appendChild(desc);
  button.addEventListener('click',()=>{
   $('setup').value=item.name;
   $('setupSelectionStatus').textContent='Ausgewählt: '+item.name;
   renderSetupCards();saveWorkspace();
  });
  target.appendChild(button);
 }
}
function renderSetupManager(){
 const target=$('setupManagerList');target.replaceChildren();
 for(const item of setupCatalog){
  const box=document.createElement('div');box.className='setup-manager-row';
  const name=document.createElement('input');name.value=item.name;name.maxLength=80;name.setAttribute('aria-label','Setup-Name');
  const description=document.createElement('textarea');description.value=item.description||'';description.maxLength=1000;description.rows=2;description.setAttribute('aria-label','Setup-Beschreibung');
  const imageRow=document.createElement('div');imageRow.className='setup-image-editor';
  const imageInput=document.createElement('input');imageInput.type='file';imageInput.accept='image/png,image/jpeg,image/webp';imageInput.setAttribute('aria-label','Setup-Bild auswählen');
  const imageSave=document.createElement('button');imageSave.type='button';imageSave.className='secondary';imageSave.textContent='Bild speichern / ersetzen';
  const imageRemove=document.createElement('button');imageRemove.type='button';imageRemove.className='ghost';imageRemove.textContent='Bild entfernen';imageRemove.disabled=!item.image_path;
  imageRow.append(imageInput,imageSave,imageRemove);
  const row=document.createElement('div');row.className='row';
  const save=document.createElement('button');save.type='button';save.className='secondary';save.textContent='Änderungen speichern';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='ghost';toggle.textContent=item.active?'Aus Auswahl entfernen':'Wieder aktivieren';
  const label=document.createElement('span');label.className='muted';label.textContent=item.active?'Aktiv':'Ausgeblendet';
  row.append(save,toggle,label);box.append(name,description,imageRow,row);target.appendChild(box);
  imageSave.addEventListener('click',async()=>{
   const file=imageInput.files?.[0];
   if(!file){setupNotice('Bitte zuerst ein Setup-Bild auswählen.',true);return;}
   if(setupCatalogBusy)return;setupCatalogBusy=true;imageSave.disabled=true;
   let uploaded=null;
   try{
    uploaded=chartPath('setup',item.id,crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_'));await uploadChart(file,uploaded);
    const {error}=await client.from('trading_setup_catalog').update({image_path:uploaded,updated_at:new Date().toISOString()}).eq('id',item.id);
    if(error)throw error;
    const old=item.image_path;await loadSetupCatalog();
    setupNotice('Setup-Bild gespeichert.');
    if(old&&old!==uploaded){const {error:cleanupError}=await client.storage.from(CHART_BUCKET).remove([old]);if(cleanupError)setupNotice('Neues Bild gespeichert, altes Bild konnte nicht bereinigt werden: '+cleanupError.message,true);}
   }catch(e){
    if(uploaded){await client.storage.from(CHART_BUCKET).remove([uploaded]).catch(()=>{});}
    setupNotice('Bild konnte nicht gespeichert werden: '+e.message,true);
   }finally{setupCatalogBusy=false;imageSave.disabled=false;}
  });
  imageRemove.addEventListener('click',async()=>{
   if(!item.image_path||setupCatalogBusy)return;
   if(!confirm('Bild von Setup „'+item.name+'“ entfernen?'))return;
   setupCatalogBusy=true;imageRemove.disabled=true;
   try{
    const {error}=await client.from('trading_setup_catalog').update({image_path:null,updated_at:new Date().toISOString()}).eq('id',item.id);
    if(error)throw error;
    const old=item.image_path;await loadSetupCatalog();
    const {error:storageError}=await client.storage.from(CHART_BUCKET).remove([old]);
    setupNotice(storageError?'Bildzuordnung entfernt; Dateibereinigung fehlgeschlagen: '+storageError.message:'Setup-Bild entfernt.',!!storageError);
   }catch(e){setupNotice('Bild entfernen fehlgeschlagen: '+e.message,true);}
   finally{setupCatalogBusy=false;imageRemove.disabled=false;}
  });
  save.addEventListener('click',async()=>{
   const next=name.value.trim();
   if(!next){setupNotice('Setup-Name darf nicht leer sein.',true);return;}
   if(setupCatalogBusy)return;setupCatalogBusy=true;save.disabled=true;
   try{
    const {error}=await client.from('trading_setup_catalog').update({name:next,description:description.value.trim(),updated_at:new Date().toISOString()}).eq('id',item.id);
    if(error)throw error;
    const prior=item.name;await loadSetupCatalog();
    if($('setup').value===prior){$('setup').value=next;renderSetupCards();}
    setupNotice('Setup gespeichert. Alte Trades behalten ihre bisherige Setup-Bezeichnung.');
   }catch(e){setupNotice('Speichern fehlgeschlagen: '+e.message,true);}
   finally{setupCatalogBusy=false;save.disabled=false;}
  });
  toggle.addEventListener('click',async()=>{
   if(setupCatalogBusy)return;
   if(item.active&&!confirm('Setup „'+item.name+'“ für neue Trades ausblenden? Alte Trades bleiben erhalten.'))return;
   setupCatalogBusy=true;toggle.disabled=true;
   try{
    const {error}=await client.from('trading_setup_catalog').update({active:!item.active,updated_at:new Date().toISOString()}).eq('id',item.id);
    if(error)throw error;
    if(item.active&&$('setup').value===item.name)$('setup').value='';
    await loadSetupCatalog();setupNotice(item.active?'Setup ausgeblendet.':'Setup wieder aktiviert.');
   }catch(e){setupNotice('Statusänderung fehlgeschlagen: '+e.message,true);}
   finally{setupCatalogBusy=false;toggle.disabled=false;}
  });
 }
}


$('createSetup').addEventListener('click',async()=>{
 const name=$('newSetupName').value.trim(),description=$('newSetupDescription').value.trim();
 if(!name){setupNotice('Bitte einen Namen eingeben.',true);return;}
 if(setupCatalogBusy)return;setupCatalogBusy=true;$('createSetup').disabled=true;
 try{
  const {error}=await client.from('trading_setup_catalog').insert({owner_id:currentUser.id,name,description,sort_order:setupCatalog.length});
  if(error)throw error;
  $('newSetupName').value='';$('newSetupDescription').value='';
  await loadSetupCatalog();setupNotice('Neues Setup hinzugefügt.');
 }catch(e){setupNotice('Hinzufügen fehlgeschlagen: '+e.message,true);}
 finally{setupCatalogBusy=false;$('createSetup').disabled=false;}
});

let ttIdeas=[],ttAttempts=[];
async function ttLoadIdeas(){
 if(!currentSession){ttIdeas=[];ttAttempts=[];ttRenderIdeaSelect();return;}
 const [ideas,attempts]=await Promise.all([
  client.from('trade_ideas_v733').select('id,session_id,setup_type,instrument,direction,thesis,trigger_condition,invalidation,created_at,status').eq('session_id',currentSession.id).order('created_at',{ascending:false}),
  client.from('trade_attempts_v733').select('id,idea_id,attempt_number,classification,trade_id,created_at').order('created_at',{ascending:false}).limit(500)
 ]);
 if(ideas.error||attempts.error){message('Handelsideen konnten nicht geladen werden: '+(ideas.error||attempts.error).message,true);return;}
 ttIdeas=ideas.data||[];ttAttempts=attempts.data||[];ttRenderIdeaSelect();
}
function ttRenderIdeaSelect(){
 const select=$('ttIdeaSelect');if(!select)return;
 const previous=select.value;
 select.innerHTML='<option value="">Neue Idee erstellen</option>'+ttIdeas.filter(x=>x.status==='active').map(x=>{
 const count=ttAttempts.filter(a=>a.idea_id===x.id).length;
 return '<option value="'+escapeHtml(x.id)+'">'+escapeHtml(x.direction.toUpperCase()+' '+x.instrument+' · '+x.setup_type+' · '+x.thesis.slice(0,45)+' · '+count+' Versuch(e)')+'</option>';
 }).join('');
 if(ttIdeas.some(x=>x.id===previous&&x.status==='active'))select.value=previous;
 ttRefreshIdeaMode();
}
function ttRefreshIdeaMode(resetChecks=false){
 if(!$('ttIdeaMode'))return;
 const spontaneous=$('ttIdeaMode').value==='spontaneous';
 $('ttIdeaPlanned').classList.toggle('hidden',spontaneous);
 $('ttSpontaneousInfo').classList.toggle('hidden',!spontaneous);
 const id=$('ttIdeaSelect').value,idea=$('ttIdeaMode').value==='existing'?ttIdeas.find(x=>x.id===id):null;
 $('ttNewIdeaFields').classList.toggle('hidden',$('ttIdeaMode').value!=='planned');$('ttIdeaSelect').closest('label').classList.toggle('hidden',$('ttIdeaMode').value!=='existing');
 const attemptNo=idea?ttAttempts.filter(a=>a.idea_id===id).length+1:1;
 $('ttAttemptWarning').classList.toggle('hidden',!idea||attemptNo<4);
 $('ttIdeaStatus').textContent=idea?'Geplant · Versuch '+attemptNo+' · ursprünglicher Plan: '+idea.thesis+' · Trigger: '+idea.trigger_condition+' · Invalidation: '+idea.invalidation:'Wird zusammen mit dem Entry gespeichert. Vormerken ist nur nötig, wenn du die Idee vorher festhalten möchtest.';
 if(resetChecks===true)for(const id of ['ttCheckThesis','ttCheckTrigger','ttCheckRisk','ttCheckMotivation'])$(id).value='';
}
$('ttIdeaMode').addEventListener('change',()=>ttRefreshIdeaMode(true));
$('ttIdeaSelect').addEventListener('change',()=>{const idea=ttIdeas.find(x=>x.id===$('ttIdeaSelect').value);if(idea){$('setup').value=idea.setup_type;$('instrument').value=idea.instrument;$('direction').value=idea.direction;renderSetupCards();syncDirectionButtons();}ttRefreshIdeaMode(true);});
$('ttSaveIdea').onclick=async()=>{
 if(!currentSession||!sessionReady()){message('Zuerst heutige Session vorbereiten.',true);return;}
 const thesis=$('ttIdeaThesis').value.trim(),trigger=$('ttIdeaTrigger').value.trim(),invalidation=$('ttIdeaInvalidation').value.trim();
 if(!$('setup').value){entryFeedback('Wähle zuerst oben dein Setup.',$('setupCards').querySelector('button'));return;}if(!thesis||!trigger||!invalidation){entryFeedback('Bitte These, Trigger und Invalidation ergänzen.',!thesis?$('ttIdeaThesis'):!trigger?$('ttIdeaTrigger'):$('ttIdeaInvalidation'));return;}
 const btn=$('ttSaveIdea');btn.disabled=true;
 try{
  const {data,error}=await client.from('trade_ideas_v733').insert({session_id:currentSession.id,setup_type:$('setup').value,instrument:$('instrument').value,direction:$('direction').value,thesis,trigger_condition:trigger,invalidation}).select('id').single();
  if(error)throw error;
  await ttLoadIdeas();$('ttIdeaSelect').value=data.id;$('ttIdeaMode').value='existing';ttRefreshIdeaMode();saveWorkspace();
  message('Handelsidee gespeichert. Bitte erst danach im ATAS einsteigen; ein tatsächlicher Broker-Entry wird hier nicht automatisch überprüft.');
 }catch(e){message('Handelsidee nicht gespeichert: '+e.message,true);}finally{btn.disabled=false;}
};
function renderDecision(){
 const before=captureFields($('allocationList'));const chosen=currentSession?.htf_context?.selected_accounts||[];
 $('allocationList').innerHTML=chosen.map((v,i)=>{const a=accounts.find(x=>x.id===v.account_id);if(!a)return '';return `<div class="account"><label class="account-pick"><input type="checkbox" class="acct-check" data-id="${escapeHtml(a.id)}" ${i===0?'checked':''}>${escapeHtml(a.account_name)}</label><label class="acct-copy-role hidden"><input type="radio" name="copyLeader" class="acct-leader" data-id="${escapeHtml(a.id)}" ${i===0?'checked':''}>Quellkonto (Leader)</label><input type="hidden" class="acct-role" data-id="${escapeHtml(a.id)}" value="${i===0?'leader':'follower'}"><div class="account-fields"><div class="grid"><label>Instrument<select class="acct-instrument" data-id="${escapeHtml(a.id)}">${['NQ','MNQ','ES','MES'].map(x=>`<option ${x===(v.instrument||a.default_instrument)?'selected':''}>${x}</option>`).join('')}</select></label><label>Kontrakte<input class="acct-qty" data-id="${escapeHtml(a.id)}" type="number" min="0.01" step="0.01" value="${Number(v.planned_quantity||a.default_quantity)}"></label></div><label>Ursprünglicher SL (Ticks)<input class="acct-sl-ticks" data-id="${escapeHtml(a.id)}" type="number" inputmode="numeric" min="1" max="100000" step="1" placeholder="z. B. 40" required></label><p class="muted acct-risk-preview" data-id="${escapeHtml(a.id)}"></p></div></div>`;}).join('')||'<p>Wähle zuerst verfügbare Session-Konten.</p>';
 applyFields($('allocationList'),before);updateEntryAccountMode();updateEntryRiskPreview();$('entryLimitField').classList.toggle('hidden',tradeCount<5);
}
function updateEntryAccountMode(changed){const copy=$('entryCopy').checked,checks=[...$('allocationList').querySelectorAll('.acct-check')];if(!copy){const winner=changed?.checked?changed:checks.find(c=>c.checked);checks.forEach(c=>c.checked=c===winner);}const selected=checks.filter(c=>c.checked);let leader=$('allocationList').querySelector('.acct-leader:checked');if(!leader||!selected.some(c=>c.dataset.id===leader.dataset.id)){leader=$('allocationList').querySelector('.acct-leader[data-id="'+selected[0]?.dataset.id+'"]');if(leader)leader.checked=true;}
 for(const c of checks){const panel=c.closest('.account');panel.querySelector('.account-fields').classList.toggle('hidden',!c.checked);panel.querySelector('.acct-copy-role').classList.toggle('hidden',!copy||!c.checked);panel.querySelector('.acct-role').value=c.checked&&(!copy||leader?.dataset.id===c.dataset.id)?'leader':'follower';}
 $('entryCopyHint').textContent=copy?'Beteiligte Konten anhaken und ein Quellkonto wählen. Ein Copy-Trade zählt als eine Entscheidung.':'Einzeltrade: ein Konto wählen. Unabhängiger Trade auf dem anderen Konto = neuer Trade in derselben Session.';
}
$('entryCopy').addEventListener('change',()=>{updateEntryAccountMode();updateEntryRiskPreview();saveWorkspace();});
$('allocationList').addEventListener('change',e=>{updateEntryAccountMode(e.target.matches('.acct-check')?e.target:null);updateEntryRiskPreview();saveWorkspace();});
function updateEntryRiskPreview(){
 document.querySelectorAll('#allocationList .acct-check').forEach(c=>{
  const panel=c.closest('.account');
  const t=panel.querySelector('.acct-sl-ticks'),qty=panel.querySelector('.acct-qty'),instrument=panel.querySelector('.acct-instrument'),out=panel.querySelector('.acct-risk-preview');
  const ticks=Number(t.value),quantity=Number(qty.value),tickValue=tickValues[instrument.value];
  out.textContent=!c.checked?'Konto nicht ausgewählt':(t.value.trim()&&Number.isSafeInteger(ticks)&&ticks>0&&ticks<=100000&&Number.isFinite(quantity)&&quantity>0)?'Initialrisiko: '+usd(riskRound(ticks*quantity*tickValue))+' USD · '+ticks+' Ticks × '+quantity+' '+instrument.value:'Initialrisiko: gültigen SL in ganzen Ticks eingeben';
 });
}
$('allocationList').addEventListener('input',updateEntryRiskPreview);
$('allocationList').addEventListener('change',updateEntryRiskPreview);
function entryFeedback(text,target){
 const feedback=$('entryFeedback');feedback.textContent=text;message(text,true);
 if(target){let parent=target.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});}
}
let entryRequestId=null;
$('recordEntry').onclick=async()=>{
  if(busy)return;
  $('entryFeedback').textContent='';
  if(!currentSession){message('Bitte zuerst eine Session starten.',true);return}if(currentSession.session_date!==localDate()){message('Die offene Session stammt vom '+currentSession.session_date+'. Bitte zuerst abschließen und eine aktuelle Session erstellen.',true);showSessionHub();return}
  if(!(currentSession.htf_context?.selected_accounts||[]).length){message('Bitte zuerst die Konten für diese Session auswählen.',true);return}
  const setup=$('setup').value;
  if(!setupCatalogReady){message('Setup-Katalog noch nicht geladen. Bitte aktualisieren.',true);return;}
  if(!setupCatalog.some(x=>x.active&&x.name===setup)){message('Bitte ein aktives Setup auswählen.',true);return;}
  if(!setup){message('Bitte ein Setup auswählen.',true);return}
  const selected=[...document.querySelectorAll('.acct-check:checked')].map(c=>{
    const id=c.dataset.id;
    return {
      account_id:id,
      role:document.querySelector(`.acct-role[data-id="${id}"]`).value,
      instrument:document.querySelector(`.acct-instrument[data-id="${id}"]`).value,
      planned_quantity:Number(document.querySelector(`.acct-qty[data-id="${id}"]`).value),
      initial_sl_ticks:Number(document.querySelector(`.acct-sl-ticks[data-id="${id}"]`).value),
      sl_input_raw:document.querySelector(`.acct-sl-ticks[data-id="${id}"]`).value.trim()
    };
  });
  if(!selected.length){entryFeedback('Mindestens ein Konto auswählen.',$('allocationList').querySelector('.acct-check'));return}
  if(selected.some(a=>!Number.isFinite(a.planned_quantity)||a.planned_quantity<=0)){message('Kontraktzahl muss größer als 0 sein.',true);return}
  const missingRisk=selected.find(a=>!/^\d+$/.test(a.sl_input_raw)||!Number.isSafeInteger(a.initial_sl_ticks)||a.initial_sl_ticks<1||a.initial_sl_ticks>100000);
  if(missingRisk){entryFeedback('Bitte für jedes ausgewählte Konto den ursprünglichen SL in ganzen Ticks erfassen. Der Kontenbereich ist jetzt geöffnet.',document.querySelector('.acct-sl-ticks[data-id="'+missingRisk.account_id+'"]'));return}
  if(!$('entryCopy').checked&&selected.length!==1){entryFeedback('Ohne Copy-Modus genau ein Konto wählen.',$('entryCopy'));return;}if($('entryCopy').checked&&(selected.length<2||selected.filter(a=>a.role==='leader').length!==1)){entryFeedback('Im Copy-Modus mindestens zwei Konten und ein Quellkonto wählen.',$('entryCopy'));return;}
  if(tradeCount>=5&&!confirm('Tageslimit überschritten. Ohne Begründung wird der zusätzliche Trade als Regelbruch erfasst. Trotzdem dokumentieren?'))return;
  const spontaneous=$('ttIdeaMode').value==='spontaneous';
  const entryIdeaId=$('ttIdeaMode').value==='existing'?$('ttIdeaSelect').value:null;
  let newIdea=null;if(!spontaneous&&!entryIdeaId){if($('ttIdeaMode').value==='existing'){entryFeedback('Bitte eine vorhandene Idee auswählen.',$('ttIdeaSelect'));return;}newIdea={thesis:$('ttIdeaThesis').value.trim(),trigger_condition:$('ttIdeaTrigger').value.trim(),invalidation:$('ttIdeaInvalidation').value.trim()};const missing=!newIdea.thesis?$('ttIdeaThesis'):!newIdea.trigger_condition?$('ttIdeaTrigger'):!newIdea.invalidation?$('ttIdeaInvalidation'):null;if(missing){entryFeedback('Bitte die neue Idee mit These, Trigger und Invalidation ergänzen.',missing);return;}}
  const idea=entryIdeaId?ttIdeas.find(x=>x.id===entryIdeaId):null;
  if(idea&&(idea.setup_type!==setup||idea.instrument!==$('instrument').value||idea.direction!==$('direction').value)){
    message('Setup, Instrument und Richtung müssen mit der gespeicherten Handelsidee übereinstimmen.',true);return;
  }
  const attemptNo=idea?1+ttAttempts.filter(a=>a.idea_id===idea.id).length:null;
  let entryWarningAnswers=null;
  if(attemptNo>=4){
    if(['ttCheckThesis','ttCheckTrigger','ttCheckRisk','ttCheckMotivation'].some(id=>!$(id).value)){message('Bitte alle vier Prüfentscheidungen mit Ja oder Nein beantworten.',true);return;}
    entryWarningAnswers={thesis:$('ttCheckThesis').value==='yes',trigger:$('ttCheckTrigger').value==='yes',risk:$('ttCheckRisk').value==='yes',motivation:$('ttCheckMotivation').value==='yes'};
    if(!confirm('WARNUNG: Einstiegsversuch '+attemptNo+' derselben Idee.\nThese: '+(entryWarningAnswers.thesis?'Ja':'Nein')+' | Trigger: '+(entryWarningAnswers.trigger?'Ja':'Nein')+' | Risiko: '+(entryWarningAnswers.risk?'Ja':'Nein')+' | Motivation: '+(entryWarningAnswers.motivation?'Ja':'Nein')+'\nTrotzdem als weiteren Versuch dokumentieren?'))return;
  }
  const entryEmotion=selectedEmotion($('entryEmotionOptions'));
   // Emotionale Warnung bleibt sichtbar im Formular; keine zusätzlichen Bestätigungsdialoge.
  busy=true;
  $('recordEntry').disabled=true;
  try{
    if(!currentSession || currentSession.session_date!==localDate() || !sessionReady())throw new Error('Nur die heutige vorbereitete Session darf Trades eröffnen.');
    entryRequestId=entryRequestId||crypto.randomUUID();saveWorkspace();
    const {data,error}=await client.rpc('record_trade_attempt_v736',{
      p_client_request_id:entryRequestId||(entryRequestId=crypto.randomUUID()),
      p_limit_reason:$('ttLimitReason').value.trim()||null,
      p_idea_id:entryIdeaId,
      p_warning_answers:entryWarningAnswers,
      p_new_idea:newIdea,
      p_entry_context:{execution_mode:$('entryCopy').checked?'copy':'independent',idea_recording:newIdea?'with_entry':entryIdeaId?'previously_saved':'none',emotion_scales:readScales($('entryEmotionOptions'))},
      p_session_id:currentSession.id,
      p_setup_type:setup,
      p_instrument:$('instrument').value,
      p_direction:$('direction').value,
      p_allocations:selected.map(({sl_input_raw,...a})=>a),
      p_entry_emotion:entryEmotion||'unreported'
    });
    if(error)throw error;
    if(!data)throw new Error('Keine Trade-ID von der Datenbank zurückgegeben. Bitte vor erneutem Speichern die Trade-Liste prüfen.');
    entryRequestId=null;$('ttLimitReason').value='';purgeWorkspace(currentUser.id);$('allocationList').replaceChildren();$('ttIdeaMode').value='planned';$('ttIdeaSelect').value='';for(const id of ['ttIdeaThesis','ttIdeaTrigger','ttIdeaInvalidation'])$(id).value='';clearScales($('entryEmotionOptions'));
    await loadCount();
    await loadSessionTrades();
    await ttLoadIdeas();
    message('Entry einschließlich Initial-SL und USD-Risiko atomar gespeichert: '+selected.length+' Konto/Konten.');
    setEmotion($('entryEmotionOptions'),'');updateEntryEmotionWarning();showView('journal');const createdId=typeof data==='string'?data:(data?.trade_id||data?.id||data?.trade?.id||'');const newTrade=sessionTrades.find(t=>t.id===createdId)||(createdId?null:sessionTrades.find(t=>!t.exit_at));if(newTrade){await openTradeDetails(newTrade);$('tradeDetails').scrollIntoView({behavior:'smooth',block:'start'});}else message('Entry gespeichert. Öffne ihn unter Trades.',false);
  }catch(e){
    message('Speichern nicht bestätigt: '+e.message+'\nBei Netzwerkfehlern vor einem erneuten Versuch bitte die Trades prüfen, um doppelte Entries zu vermeiden.',true);
  }finally{
    busy=false;
    $('recordEntry').disabled=false;
  }
};
function ttAppearance(){
 let theme='original',layout='comfortable';
 try{theme=localStorage.getItem('tt7_theme')||'original';layout=localStorage.getItem('tt7_layout')||'comfortable';}catch(_){}
 if(!['original','graphite','contrast'].includes(theme))theme='original';
 if(!['comfortable','compact'].includes(layout))layout='comfortable';
 document.body.dataset.ttTheme=theme;document.body.dataset.ttLayout=layout;
 $('ttThemeSelect').value=theme;$('ttLayoutSelect').value=layout;
}
$('ttThemeSelect').addEventListener('change',e=>{try{localStorage.setItem('tt7_theme',e.target.value);}catch(_){}ttAppearance();ttToast('✓ Farbschema gespeichert');});
$('ttLayoutSelect').addEventListener('change',e=>{try{localStorage.setItem('tt7_layout',e.target.value);}catch(_){}ttAppearance();ttToast('✓ Layout gespeichert');});
ttAppearance();
let ttAuthRefreshPending=false;
client.auth.onAuthStateChange((event)=>{
 if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)||ttAuthRefreshPending)return;
 ttAuthRefreshPending=true;
 setTimeout(async()=>{try{await authStatus()}finally{ttAuthRefreshPending=false}},0);
});
setTimeout(authStatus,0);

// Every query is bound to the initiating login epoch, including Storage and RPC.
function guardRequest(query,epoch){return new Proxy(query,{get(target,key){if(key==='then')return (ok,bad)=>Promise.resolve(target).then(result=>{if(epoch!==authEpoch){const e=new Error('Benutzer gewechselt');e.name='SessionChangedError';throw e;}return result;}).then(ok,bad);const v=Reflect.get(target,key);return typeof v==='function'?(...args)=>{const r=v.apply(target,args);return r&&typeof r==='object'&&typeof r.then==='function'?guardRequest(r,epoch):r;}:v;}});}
const originalFrom=client.from.bind(client),originalRpc=client.rpc.bind(client),originalStorageFrom=client.storage.from.bind(client.storage);
client.from=(...args)=>guardRequest(originalFrom(...args),authEpoch);
client.rpc=(...args)=>guardRequest(originalRpc(...args),authEpoch);
client.storage.from=(...args)=>{const bucket=originalStorageFrom(...args);return new Proxy(bucket,{get(t,k){const v=t[k];return typeof v==='function'?(...a)=>{const epoch=authEpoch;const r=v.apply(t,a);return r&&typeof r.then==='function'?guardRequest(r,epoch):r;}:v;}});};
window.addEventListener('unhandledrejection',e=>{if(e.reason?.name==='SessionChangedError')e.preventDefault();});
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

// One manually chosen focus; immutable per-entry rule snapshots are captured by SQL.
let trainingFocusActive=null,trainingFocusGoals=[],trainingFocusSeq=0,trainingFocusBusy=false,trainingFocusReady=false,trainingFocusPending=null;
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
 const owner=currentUser.id,signature=JSON.stringify([currentUser.id,rule.trim(),source.tradeId||null,source.errorId||null]);
 const previous=trainingFocusPending?.signature===signature?trainingFocusPending:null,expected=previous?previous.expected:(trainingFocusActive?.id||null);
 if(expected&&!confirm('Aktuellen Schwerpunkt bewusst durch diese Regel ersetzen? Der bisherige Schwerpunkt bleibt in der Historie.'))return;
 const requestId=previous?.requestId||crypto.randomUUID();trainingFocusPending={signature,requestId,expected};trainingFocusBusy=true;drawTrainingFocus();
 try{
  const {data,error}=await client.rpc('set_training_focus_v735',{p_request_id:requestId,p_goal:rule.trim(),p_expected_id:expected,p_source_trade_id:source.tradeId||null,p_source_error_id:source.errorId||null});
  if(currentUser?.id!==owner)return;if(error)throw error;if(!data?.id)throw new Error('Keine Speicherbestätigung erhalten.');
  if(trainingFocusPending?.requestId===requestId)trainingFocusPending=null;
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
 client.auth.onAuthStateChange((event,session)=>{if(event==='TOKEN_REFRESHED'||(event==='SIGNED_IN'&&session?.user?.id===currentUser?.id))return;trainingFocusSeq++;trainingFocusActive=null;trainingFocusGoals=[];trainingFocusReady=false;$('trainingGoal').value='';$('trainingPracticeSummary').textContent='';drawTrainingFocus();setTimeout(()=>{void loadTrainingFocus();},100);});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&currentUser)void loadTrainingFocus();});
 drawTrainingFocus();void loadTrainingFocus();
}

$('trainingView').insertBefore($('trainingPractice'),$('trainingFocus'));
initTrainingFocus();
(function(){
 const $e=id=>document.getElementById(id);const safe=escapeHtml;
 $e('refreshPlaybookLexicon')?.addEventListener('click',()=>{const box=$e('playbookLexicon');if(!box)return;let list=[];try{list=Array.isArray(window.setupCatalog)?window.setupCatalog:[]}catch(_){};if(!list.length){const cards=[...document.querySelectorAll('#setupCards button')];list=cards.map(b=>({name:b.textContent.trim(),description:b.getAttribute('title')||''}));}box.innerHTML=list.length?list.map(x=>'<div class="account"><strong>'+safe(x.name||x.setup_name||x.title||'Setup')+'</strong><p>'+safe(x.description||'Beschreibung in Settings ergänzen')+'</p></div>').join(''):'Noch keine Setups geladen. Öffne zuerst Trade oder Settings → Setups.';});
 const refreshOpen=()=>{const n=[...document.querySelectorAll('#sessionTradeList .trade-open')].length;const el=$e('openTradeBadge');if(el)el.textContent=n?'('+n+')':'';};
 new MutationObserver(refreshOpen).observe($e('sessionTrades')||document.body,{subtree:true,childList:true});refreshOpen();
})();
