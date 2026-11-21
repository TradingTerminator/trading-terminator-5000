/* V8.14.1 account data controls. Storage removes the binary before SQL may complete the reset. */
const panel8141=el811('section');panel8141.className='card tt-data-panel';
panel8141.innerHTML='<h3>Datenverwaltung</h3><h4>Test-Playbook</h4><p data-count></p><button type="button" class="secondary" data-remove>Testdaten entfernen</button><section class="tt-danger-zone"><h4>Gefahrenbereich</h4><p>Persönliche Trading-Daten, Bilder und Einstellungen zurücksetzen. Dein Benutzerkonto bleibt erhalten.</p><button type="button" class="secondary" data-reset>Alle Daten löschen</button></section><p role="status" data-status></p>';
$('settingsView').append(panel8141);
const resetDialog8141=el811('dialog'),progress8141=panel8141.querySelector('[data-status]');
document.body.append(resetDialog8141);
let deleting8141=false,checking8141=false,reloading8141=false;
async function dataRpc8141(name,args={}){
 const {data,error}=await client.rpc(name,args);if(error)throw Error(error.message);return data;
}
function reportData8141(text){progress8141.textContent=text;message(text,true);}
function clearGeneration8141(storage,owner){
 const shared=['tt8_active_trade_id','tt8_active_view','tt8_scroll_y','tt8_v8_route','tt8_theme','tt8_layout','tt8_ttCorners','tt8_ttText','tt8_ttMotion','tt8_test_checklist'];
 for(const k of Object.keys(storage))if(k.startsWith('tt-generation:'+owner+':')||(/^tt[78]/.test(k)&&k.includes(owner))||shared.includes(k))storage.removeItem(k);
}
function adoptGeneration8141(owner,s){
 const key='tt-reset-generation:'+owner,g=s.generation||'initial';
 let reload=generationOwner===owner&&activeGeneration!==s.generation;
 for(const storage of [window.localStorage,window.sessionStorage]){
  if(storage.getItem(key)===g)continue;
  if(s.generation){clearGeneration8141(storage,owner);reload=true;}storage.setItem(key,g);
 }
 if(reload){reloading8141=true;currentUser=null;resetPrivateState();location.reload();return false;}
 generationOwner=owner;activeGeneration=s.generation;return true;
}
async function finishDeletion8141(owner,state){
 if(deleting8141)return;deleting8141=true;
 try{
  message('Löschung läuft · Dateien werden entfernt.');progress8141.textContent='Bilddateien werden entfernt …';
  for(;;){
   const rows=await dataRpc8141('tt_reset_files_v8141',{ticket:state.request});if(!rows.length)break;
   const paths=rows.map(r=>r.path);
   if(paths.some(p=>!p.startsWith(owner+'/')))throw Error('Bildzuordnung nicht bestätigt.');
   const {error}=await client.storage.from(CHART_BUCKET).remove(paths);if(error)throw Error(error.message);
   const next=await dataRpc8141('tt_reset_files_v8141',{ticket:state.request});
   if(next.some(r=>r.path===paths[0]))throw Error('Bildlöschung noch nicht bestätigt.');
  }
  const done=await dataRpc8141('tt_finish_reset_v8141',{ticket:state.request});
  if(done.phase!=='ready'||done.generation!==state.generation)throw Error('Serverabschluss ausstehend.');
  adoptGeneration8141(owner,done);
 }finally{deleting8141=false;}
}
async function initializeDataOwner(owner){
 const s=await dataRpc8141('tt_data_state_v8141');
 if(!s||!Object.hasOwn(s,'generation'))throw Error('Datenstand nicht bestätigt.');
 if(s.phase==='files'){await finishDeletion8141(owner,s);return false;}
 return adoptGeneration8141(owner,s);
}
function dataDialog8141(title,body){
 if(resetDialog8141.open)resetDialog8141.close();resetDialog8141.replaceChildren();
 const h=el811('h2',title);h.id='ttDataDialogTitle';resetDialog8141.setAttribute('aria-labelledby',h.id);
 const cancel=v8Button('Abbrechen',()=>resetDialog8141.close(),'secondary');
 resetDialog8141.append(h,el811('p',body),cancel);resetDialog8141.showModal();cancel.focus();
}
panel8141.querySelector('[data-reset]').onclick=()=>{
 const owner=currentUser?.id;if(!owner||deleting8141)return;
 dataDialog8141('Achtung – vollständige Datenlöschung','Du bist dabei, sämtliche Trading-Daten, Bilder, Setups, Auswertungen und Einstellungen dauerhaft zu löschen. Diese Aktion kann nicht rückgängig gemacht werden.');
 const next=v8Button('Weiter zur endgültigen Bestätigung',async()=>{
  next.disabled=true;
  try{
   const ticket=await dataRpc8141('tt_prepare_reset_v8141');if(!next.isConnected||!resetDialog8141.open||currentUser?.id!==owner)return;
   dataDialog8141('Letzte Bestätigung – wirklich ALLES löschen?','Nach dieser Bestätigung werden alle persönlichen Trading-Daten dauerhaft entfernt. Auch synchronisierte Daten auf dem Server sind betroffen. Eine Wiederherstellung über die App ist anschließend nicht möglich.');
   const phrase='ALLES ENDGÜLTIG LÖSCHEN',field=el811('input'),label=el811('label','Zur Bestätigung eingeben: '+phrase);
   field.autocomplete='off';field.spellcheck=false;label.append(field);
   const finish=v8Button('Jetzt endgültig löschen',async()=>{
    if(!resetDialog8141.open||field.value!==phrase||currentUser?.id!==owner||deleting8141)return;
    finish.disabled=true;resetDialog8141.close();
    try{const s=await dataRpc8141('tt_begin_reset_v8141',{ticket,phrase:field.value});await finishDeletion8141(owner,s);}catch(e){reportData8141('Löschstatus ausstehend: '+e.message);}
   },'tt-destructive');
   finish.disabled=true;field.oninput=()=>finish.disabled=field.value!==phrase;
   resetDialog8141.append(el811('p','Externe Sicherungskopien unterliegen den Aufbewahrungsfristen des Betreibers.'),label,finish);
  }catch(e){resetDialog8141.close();reportData8141(e.message);}
 });resetDialog8141.append(next);
};
async function testRows8141(){
 const {data,error}=await client.from('test_setups_v8141').select('id,name,is_test_data,source_data').order('name');if(error)throw Error(error.message);return data||[];
}
async function countTests8141(){
 const owner=currentUser?.id;if(!owner)return;
 try{const rows=await testRows8141();if(currentUser?.id!==owner)return;panel8141.querySelector('[data-count]').textContent=rows.length+' gekennzeichnete Test-Setups';panel8141.querySelector('[data-remove]').disabled=!rows.length;}catch(e){reportData8141(e.message);}
}
panel8141.querySelector('[data-remove]').onclick=async()=>{
 const owner=currentUser?.id;
 try{const rows=await testRows8141();if(!owner||currentUser?.id!==owner)return;
 dataDialog8141('Testdaten entfernen',rows.length+' gekennzeichnete Test-Setups entfernen? Persönliche Setups und dokumentierte Trades bleiben erhalten.');
 const remove=v8Button('Testdaten entfernen',async()=>{
  if(currentUser?.id!==owner)return;remove.disabled=true;
  try{const n=await dataRpc8141('tt_remove_tests_v8141',{expected:rows.map(r=>r.id)});resetDialog8141.close();progress8141.textContent=n+' Test-Setups entfernt.';await countTests8141();await loadSetupCatalog();}
  catch(e){resetDialog8141.close();reportData8141(e.message);}
 });resetDialog8141.append(remove);}catch(e){reportData8141(e.message);}
};
async function pollData8141(){
 const owner=currentUser?.id;if(!owner||reloading8141||checking8141||deleting8141||document.hidden)return;
 checking8141=true;try{const s=await dataRpc8141('tt_data_state_v8141');if(owner!==currentUser?.id)return;
 if(s.phase==='files')await finishDeletion8141(owner,s);else adoptGeneration8141(owner,s);}catch(e){progress8141.textContent=e.message;}finally{checking8141=false;}
}
window.addEventListener('focus',pollData8141);window.addEventListener('online',pollData8141);document.addEventListener('visibilitychange',pollData8141);setInterval(pollData8141,12000);
const settingsView8141=showView;showView=function(route,...args){const value=settingsView8141(route,...args);if(route==='settings')void countTests8141();return value;};
function fixtureEntry8141(row){
 let name=row.name+' · Test';while(setupCatalog.some(s=>s.name===name))name+=' · Test';
 return {id:row.id,name,active:true,is_test_data:true,description:'Testdaten · Nicht freigegeben'};
}
const personalBook8141=renderBook;
let bookEpoch8141=0;
renderBook=async function(selected){
 const owner=currentUser?.id,epoch=++bookEpoch8141,host=$('playbookLexicon');
 await personalBook8141(selected);if(!owner||owner!==currentUser?.id||epoch!==bookEpoch8141)return;
 try{const rows=await testRows8141();if(owner!==currentUser?.id||epoch!==bookEpoch8141)return;
 for(const old of host.querySelectorAll('[data-mada-card]'))old.remove();
 for(const row of rows){
  const d=row.source_data,card=el811('details'),summary=el811('summary');card.className='book-entry tt-mada';card.dataset.madaCard=row.id;card.dataset.search=row.name.toLowerCase();
  summary.append(el811('div','Musterbild fehlt'),el811('strong',row.name),el811('small','Testdaten · '+(d.approved?'In Notion freigegeben':'Nicht freigegeben')));
  const cases=T9.rows.filter(t=>t.observations?.entry_context_v736?.setup_snapshot?.id===row.id);
  card.append(summary,el811('p','Richtung: '+(d.direction||'nicht dokumentiert')+' · Kategorie: '+(d.category||'nicht dokumentiert')),el811('p',d.criteria||'Setup-spezifische Kriterien fehlen.'),el811('p','Invalidierung: '+(d.invalidation||'nicht dokumentiert')),el811('p','Typischer Fehler: '+(d.error||'nicht dokumentiert')));
  const list=el811('ul');for(const line of d.checklist||[])list.append(el811('li',line));card.append(el811('h4','MADA-Check vor dem Entry'),list);
  card.append(el811('p',cases.length+' Beispieltrades · '+cases.filter(reviewIsComplete).length+' vollständig geprüft'),v8Button('Mit diesem Setup fortfahren',()=>useSetup9(fixtureEntry8141(row))));
  host.append(card);tradeCards9(card,cases);
 }
 }catch(e){if(owner===currentUser?.id)host.append(el811('p','Test-Playbook nicht geladen: '+e.message));}
};
