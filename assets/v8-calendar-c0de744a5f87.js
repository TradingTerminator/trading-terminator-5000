/* Limited public-source calendar. Never infer “no news” from an empty or stale feed. */
V8H.calendarSelected=[];
const V8C={data:null,loaded:0,loading:null,owner:null,seq:0};
const calendarBox=document.createElement('details');calendarBox.id='v8MacroCalendar';calendarBox.open=true;calendarBox.className='v8-macro-calendar';calendarBox.innerHTML='<summary>Wirtschaftskalender · Heute / 7 Tage</summary><p class="compact-help">Offizielle Veröffentlichungstermine · deutsche Ortszeit. BLS/BEA automatisch; FOMC und ISM-PMI aus manuell geprüftem Terminstand. Fed-Reden, weitere Quellen und Änderungen separat prüfen. Keine Vollständigkeit, keine Istwerte.</p><p id="v8CalendarStatus" role="status">Kalender wird beim Öffnen der Vorbereitung geladen.</p><button id="v8CalendarToggle" type="button" class="secondary">Zeitraum: Heute ⇄ 7 Tage</button><label hidden>Zeitraum<select id="v8CalendarWindow"><option value="today">Heute</option><option value="week">Nächste 7 Tage</option></select></label><div id="v8CalendarSources"></div><div id="v8CalendarRows"></div><label class="account-pick"><input id="v8CalendarReviewed" type="checkbox">Wirtschaftskalender geprüft</label><p class="compact-help">Quellen: <a href="https://www.bls.gov/schedule/" target="_blank" rel="noopener noreferrer">U.S. Bureau of Labor Statistics</a> · <a href="https://www.bea.gov/news/schedule" target="_blank" rel="noopener noreferrer">U.S. Bureau of Economic Analysis</a>. Automatischer Abruf etwa alle sechs Stunden; Termine können sich ändern.</p>';
$('v8NewsHeading').after(calendarBox);
const selectedCalendar=document.createElement('div');selectedCalendar.id='v8SelectedCalendar';$('v8NewsDetails').after(selectedCalendar);
function v8ValidCalendarEvent(row){return row&&/^[a-f0-9]{24}$/.test(row.id)&&['BLS','BEA','FED','ISM'].includes(row.source)&&typeof row.title==='string'&&row.title.length>0&&row.title.length<=300&&Number.isFinite(Date.parse(row.at))&&row.url===({BLS:'https://www.bls.gov/schedule/',BEA:'https://www.bea.gov/news/schedule',FED:'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',ISM:'https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/'})[row.source];}
function v8CalendarDay(iso){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));}
function v8CalendarFresh(data){
 return data?.version===1&&['BLS','BEA'].every(key=>data.sources?.[key]?.ok===true)
  &&['FED','ISM'].every(key=>!!data.sources?.[key]?.fetched_at);
}
function v8RenderSelectedCalendar(){const host=$('v8SelectedCalendar');host.replaceChildren();$('v8HtfNews').closest('label').firstChild.textContent=V8H.calendarSelected.length?'Zusätzlicher eigener Termin (optional)':'Termin';for(const row of V8H.calendarSelected){const line=document.createElement('div');line.className='v8-calendar-selection';const text=document.createElement('span');text.textContent=v8DateTime(row.at)+' · '+row.title+' · '+row.source;line.append(text,v8Button('Entfernen',()=>{V8H.calendarSelected=V8H.calendarSelected.filter(e=>e.id!==row.id);V8H.request=null;v8RenderSelectedCalendar();v8DrawMacroCalendar();v8UpdatePreparation();saveWorkspace();},'ghost'));host.append(line);}}
function v8PickCalendar(row){if(!v8ValidCalendarEvent(row)||V8H.calendarSelected.some(e=>e.id===row.id))return;if(V8H.calendarSelected.length>=100){message('Maximal 100 Termine für die Vorbereitung auswählen.',true);return;}V8H.calendarSelected.push({...row,selected_at:new Date().toISOString(),source_fetched_at:V8C.data?.sources?.[row.source]?.fetched_at||null});if($('v8HtfNews').value==='Keine relevanten News')$('v8HtfNews').value='';$('v8NewsState').value='yes';v8SyncNews();V8H.request=null;v8RenderSelectedCalendar();v8DrawMacroCalendar();v8UpdatePreparation();saveWorkspace();}
function v8DrawMacroCalendar(){
 const host=$('v8CalendarRows'),status=$('v8CalendarStatus'),data=V8C.data;
 host.replaceChildren();
 if(!data){status.textContent='Terminübersicht nicht verfügbar. Forex Factory separat prüfen.';return;}
 const fresh=v8CalendarFresh(data);
 status.textContent=fresh?'US-Veröffentlichungen · Abruf '+v8DateTime(data.checked_at):'Quellenabruf unvollständig · '+v8DateTime(data.checked_at);
 status.classList.toggle('notice',!fresh);
 const sources=$('v8CalendarSources');sources.replaceChildren();
 for(const key of ['BLS','BEA','FED','ISM']){
  const info=data.sources?.[key],line=document.createElement('p');
  line.textContent=key+' · '+(info?.mode==='manual'?'manuell geprüft':info?.ok?'Abruf erfolgreich':'Abruf fehlt oder ausgefallen')+(info?.fetched_at?' · '+v8DateTime(info.fetched_at):'');
  sources.append(line);
 }
 const now=Date.now(),today=v8CalendarDay(new Date(now)),week=$('v8CalendarWindow').value==='week',last=v8CalendarDay(new Date(now+6*86400000));
 const rows=data.events.filter(row=>{const day=v8CalendarDay(row.at);return week?day>=today&&day<=last:day===today;}).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 if(!rows.length){host.textContent='Keine Termine in der Übersicht. Extern auf weitere Termine prüfen.';return;}
 const list=document.createElement('div');
 for(const item of rows){
  const row=document.createElement('label'),pick=document.createElement('input');
  row.className='tt-calendar-event';
  pick.type='checkbox';pick.checked=V8H.calendarSelected.some(e=>e.id===item.id);
  pick.setAttribute('aria-label',item.title+' · relevant für meine Handelszeit');
  pick.onchange=()=>{
   if(pick.checked)v8PickCalendar(item);
   else{V8H.calendarSelected=V8H.calendarSelected.filter(e=>e.id!==item.id);V8H.request=null;v8RenderSelectedCalendar();v8UpdatePreparation();saveWorkspace();}
  };
  const summary=document.createElement('span'),time=document.createElement('small'),title=document.createElement('strong');
  const options={timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'};
  if(week)Object.assign(options,{weekday:'short',day:'2-digit',month:'2-digit'});
  time.textContent=new Intl.DateTimeFormat('de-DE',options).format(new Date(item.at))+' Uhr · USD';
  title.textContent=item.title;
  summary.append(time,title);row.append(pick,summary);list.append(row);
 }
 host.append(list);
}
async function v8LoadMacroCalendar(){if(!currentUser||!currentSession)return;if(V8C.loading)return V8C.loading;if(V8C.data&&Date.now()-V8C.loaded<15*60000){v8DrawMacroCalendar();return;}const owner=currentUser.id,seq=++V8C.seq;V8C.loading=(async()=>{try{if(typeof fetch!=='function')throw Error('offline');const response=await fetch('./data/macro-calendar.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('not available');const data=await response.json();if(data.version!==1||!Array.isArray(data.events)||data.events.length>10000||!data.events.every(v8ValidCalendarEvent)||!Number.isFinite(Date.parse(data.checked_at)))throw Error('invalid calendar');if(owner!==currentUser?.id||seq!==V8C.seq)return;V8C.data=data;V8C.loaded=Date.now();v8DrawMacroCalendar();}catch(_){if(owner===currentUser?.id&&seq===V8C.seq){v8DrawMacroCalendar();$('v8CalendarStatus').textContent='Kalender konnte nicht aktualisiert werden. Termine manuell prüfen.';}}finally{if(seq===V8C.seq)V8C.loading=null;}})();return V8C.loading;}
$('v8CalendarWindow').onchange=v8DrawMacroCalendar;$('v8CalendarToggle').onclick=()=>{$('v8CalendarWindow').value=$('v8CalendarWindow').value==='today'?'week':'today';$('v8CalendarToggle').textContent='Zeitraum: '+($('v8CalendarWindow').value==='today'?'Heute':'Nächste 7 Tage')+' ⇄';v8DrawMacroCalendar();};$('v8CalendarReviewed').onchange=()=>{V8H.calendarReviewed=$('v8CalendarReviewed').checked?localDate():null;V8H.request=null;v8UpdatePreparation();saveWorkspace();};calendarBox.addEventListener('toggle',()=>{if(calendarBox.open)void v8LoadMacroCalendar();});
const calendarPlan=v8HtfPlan;v8HtfPlan=function(){const plan=calendarPlan(),chosen=$('v8NewsState').value==='yes'?V8H.calendarSelected:[],manual=$('v8HtfNews').value.trim();return {...plan,calendar_reviewed_day:$('v8CalendarReviewed').checked?V8H.calendarReviewed:null,manual_news:manual,calendar_events:chosen.map(e=>({...e})),news:chosen.length?[...(manual?[manual]:[]),...chosen.map(e=>e.title+' · '+v8DateTime(e.at)+' · '+e.source)].join(' | ').slice(0,1500):plan.news};};
const calendarRestore=v8RestoreHtf;v8RestoreHtf=function(...args){const plan=currentSession?.htf_context?.htf_v8?.plan;V8H.calendarSelected=(plan?.calendar_events||[]).filter(v8ValidCalendarEvent);calendarRestore(...args);V8H.calendarReviewed=plan?.calendar_reviewed_day||null;$('v8CalendarReviewed').checked=V8H.calendarReviewed===localDate();if(plan&&typeof plan.manual_news==='string')$('v8HtfNews').value=plan.manual_news;v8SyncNews();v8RenderSelectedCalendar();v8UpdatePreparation();};
workspaceWriters.push(item=>{item.htfCalendarSelected=V8H.calendarSelected;item.htfCalendarReviewed=V8H.calendarReviewed;});
const calendarDraftRestore=restoreWorkspace;restoreWorkspace=function(item){if(item?.owner===currentUser?.id&&item.session===(currentSession?.id||null))V8H.calendarSelected=(item.htfCalendarSelected||[]).filter(v8ValidCalendarEvent);calendarDraftRestore(item);if(item?.owner===currentUser?.id&&item.session===(currentSession?.id||null)){V8H.calendarReviewed=item.htfCalendarReviewed||null;$('v8CalendarReviewed').checked=V8H.calendarReviewed===localDate();}v8RenderSelectedCalendar();v8UpdatePreparation();};
const calendarShow=showView;showView=function(view){calendarShow(view);if(view==='session')void v8LoadMacroCalendar();};
const calendarReset=resetPrivateState;resetPrivateState=function(...args){V8H.calendarSelected=[];V8C.data=null;V8C.loaded=0;V8C.seq++;V8C.loading=null;calendarReset(...args);v8RenderSelectedCalendar();};

const calendarMissing=v8PreparationMissing;v8PreparationMissing=function(){const missing=calendarMissing();if(!$('v8CalendarReviewed').checked||V8H.calendarReviewed!==localDate())missing.push(['Heutigen Wirtschaftskalender und Quellenlücken prüfen','v8CalendarReviewed']);return missing;};
