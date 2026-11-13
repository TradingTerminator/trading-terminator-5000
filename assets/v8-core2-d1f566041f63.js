
(function(){
 'use strict';
 const TT_VERSION='8.01';
const $=id=>document.getElementById(id);
 const connection=$('ttConnection');
 const updateConnectivity=()=>{
   if(!connection)return;
   const offline=navigator.onLine===false;
   connection.hidden=!offline;
   connection.textContent=offline?'Keine Internetverbindung. Supabase-Speicherungen können fehlschlagen. Vor erneutem Speichern Datenbestand prüfen.':'';
 };
 window.addEventListener('online',updateConnectivity);
 window.addEventListener('offline',updateConnectivity);
 updateConnectivity();
 $('ttRunDiagnostics')?.addEventListener('click',()=>{
   const lines=[];
   const check=(label,ok)=>lines.push((ok?'✓ ':'✗ ')+label);
   const required=['app','tabs','decisionView','journalView','tradeDetails','settingsView','ttThemeSelect','ttLayoutSelect','logout','recordEntry','trainingGoal','ttConnection','sessionFinishPanel','sessionFinishChecklist','otpCode','rememberLogin'];
   check('Kernoberfläche vorhanden',required.every(id=>!!$(id)));
   check('Eindeutige HTML-IDs',(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.length===new Set(ids).size})());
   check('Farbschema aktiv', ['original','graphite','contrast','ocean','forest','light'].includes(document.body.dataset.ttTheme));
   check('Layout aktiv', ['comfortable','compact'].includes(document.body.dataset.ttLayout));
   check('Farben werden angewandt',getComputedStyle(document.body).backgroundColor!=='rgba(0, 0, 0, 0)');
   check('Supabase SDK geladen',!!window.supabase&&typeof window.supabase.createClient==='function');
   check('Browser unterstützt lokale Speicherung',(()=>{try{const k='tt8_diagnostic_probe';localStorage.setItem(k,'1');const ok=localStorage.getItem(k)==='1';localStorage.removeItem(k);return ok}catch(_){return false}})());
   check('Sicherer Kontext für Bild-APIs',window.isSecureContext===true);
   const fail=lines.filter(x=>x.startsWith('✗')).length;
   $('ttDiagnosticsResult').textContent=lines.join('\n')+'\n'+(fail?fail+' lokale Prüfpunkte fehlgeschlagen.':'Alle lokalen Prüfpunkte bestanden. Keine Aussage zur Serververbindung oder Anmeldung.');
 });
})();
