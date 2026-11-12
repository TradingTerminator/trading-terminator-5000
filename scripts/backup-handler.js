byId('ttBackupJson')?.addEventListener('click',()=>run('Datensicherung',async()=>{
 const user=await ensureUser();inform('Erstelle konsistenten Datenbank-Snapshot …');
 const {data:snapshot,error}=await client.rpc('export_journal_snapshot_v735');if(error)throw error;
 if(!snapshot||snapshot.owner_id!==user.id)throw new Error('Ungültiger Snapshot');
 const zip=new JSZip(),images=[];let total=0;
 for(const image of snapshot.images){
  inform('Sichere Bild '+(images.length+1)+'/'+snapshot.images.length+' …');
  const {data:blob,error:imageError}=await client.storage.from('trading-chart-screenshots').download(image.name);if(imageError)throw imageError;
  total+=blob.size;if(total>150*1024*1024)throw new Error('Bildsicherung über 150 MiB. Administrativen Export verwenden; es wird keine Teilsicherung erstellt');
  const bytes=await blob.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  const path='images/'+image.name;zip.file(path,bytes);images.push({path,storage_path:image.name,size:blob.size,sha256:hash});
 }
 const {data:verify,error:verifyError}=await client.rpc('export_journal_snapshot_v735');if(verifyError)throw verifyError;
 if(JSON.stringify(verify)!==JSON.stringify(snapshot))throw new Error('Daten wurden während der Sicherung geändert. Bitte erneut sichern');
 if((await ensureUser()).id!==user.id)throw new Error('Benutzer gewechselt');
 draftFlush();zip.file('journal.json',JSON.stringify({format:'trading-terminator-backup',format_version:2,app_version:TT_VERSION,created_at:new Date().toISOString(),...snapshot,images,local_drafts:collectLocalDrafts(user.id)},null,2));
 zip.file('README.txt','Persönliche Journal-Sicherung mit Bilddateien und SHA-256-Prüfsummen. Enthält keine Auth-Konten, Passwörter oder Serverkonfiguration. Wiederherstellung erfolgt administrativ in einer leeren Testumgebung. Dateien vertraulich aufbewahren.');
 const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
 if((await ensureUser()).id!==user.id)throw new Error('Benutzer während der Archiv-Erstellung gewechselt');
 download('trading-terminator-backup_'+fileStamp()+'.zip',blob);
 inform('Vollständige Journal-Sicherung vorbereitet: '+Object.keys(snapshot.tables).length+' Tabellen und '+images.length+' Bilder. Datei vertraulich aufbewahren.');
}));
