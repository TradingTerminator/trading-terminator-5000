"""Validate a V8 ZIP (or legacy V7 ZIP), or restore into an EMPTY, separate Supabase test project.
Secrets: TT_RESTORE_DATABASE_URL, TT_RESTORE_PROJECT_URL, TT_RESTORE_SERVICE_KEY.
Requires psycopg[binary] only for --restore. Never accepts a production target.
"""
import argparse, hashlib, json, os, pathlib, uuid, zipfile, urllib.request, urllib.parse
SOURCE_PROJECT='hogrdcqblpcrqgdtsvjv'
TABLES={'trading_sessions','trade_ideas','trades','stop_adjustments','trade_events','screenshots','corrective_actions','trade_errors','trade_reviews','playbook_entries','trading_accounts','account_groups','account_group_members','trade_account_allocations','account_fills','account_trade_results','allocation_change_log','trading_setup_catalog','training_countermeasures','training_goals_v7','trade_ideas_v733','trade_attempts_v733','trade_entry_requests_v735'}
V8_TABLES=TABLES|{'v8_htf_assessments','v8_htf_preferences'}
def normalize_restore_rows(table,rows):
 # Older backups predate the additive V7.40 fields. Explicit recordset inserts
 # bypass column defaults, so supply only absent defaults, never overwrite history.
 defaults={'trade_ideas_v733':{'learning_review':{},'learning_revision':0},'trading_setup_catalog':{'rules':{}}}.get(table,{})
 return [{**defaults,**row} for row in rows]
def validate(path):
 with zipfile.ZipFile(path) as z:
  names=z.namelist()
  if len(names)!=len(set(names)):raise ValueError('Duplicate archive entries')
  if sum(i.file_size for i in z.infolist())>220*1024*1024:raise ValueError('Archive too large')
  for name in names:
   p=pathlib.PurePosixPath(name)
   if p.is_absolute() or '..' in p.parts or '\\' in name:raise ValueError('Unsafe archive path')
  doc=json.loads(z.read('journal.json'));owner=str(uuid.UUID(doc['owner_id']))
  if doc.get('format')!='trading-terminator-backup' or doc.get('format_version')!=2:raise ValueError('Unsupported backup format')
  if set(doc['tables']) not in (TABLES,V8_TABLES):raise ValueError('Backup does not contain the expected complete table set')
  for table,rows in doc['tables'].items():
   if not isinstance(rows,list) or len(rows)>50000:raise ValueError('Invalid table payload')
   if any(r.get('owner_id')!=owner for r in rows):raise ValueError('Mixed ownership in backup')
  images=[]
  for item in doc['images']:
   if not item['storage_path'].startswith(owner+'/') or item['path']!='images/'+item['storage_path']:raise ValueError('Image ownership/path mismatch')
   b=z.read(item['path'])
   if len(b)!=item['size'] or hashlib.sha256(b).hexdigest()!=item['sha256']:raise ValueError('Image checksum mismatch')
   images.append((item['storage_path'],b))
  expected={'journal.json','README.txt'}|{item['path'] for item in doc['images']}
  if set(names)-expected:raise ValueError('Unexpected archive content')
 return doc,images

def restore(doc,images,target_owner):
 import psycopg
 from psycopg import sql
 db=os.environ['TT_RESTORE_DATABASE_URL'];project=os.environ['TT_RESTORE_PROJECT_URL'].rstrip('/');key=os.environ['TT_RESTORE_SERVICE_KEY']
 if SOURCE_PROJECT in db or SOURCE_PROJECT in project:raise ValueError('Refusing production/source project')
 if not project.startswith('https://') or urllib.parse.urlparse(project).hostname is None:raise ValueError('HTTPS Supabase project URL required')
 owner=str(uuid.UUID(target_owner));old=doc['owner_id'];uploaded=[]
 # Replace only known owner-qualified image paths recursively; IDs remain unchanged.
 def transform(v):
  if isinstance(v,dict):return {k:(owner if k=='owner_id' else transform(x)) for k,x in v.items()}
  if isinstance(v,list):return [transform(x) for x in v]
  if isinstance(v,str) and v.startswith(old+'/'):return owner+v[len(old):]
  return v
 def storage(method,path,data=None):
  url=project+'/storage/v1/object/trading-chart-screenshots/'+urllib.parse.quote(path,safe='/')
  mime='image/png' if path.endswith('.png') else 'image/webp' if path.endswith('.webp') else 'image/jpeg'
  req=urllib.request.Request(url,data=data,method=method,headers={'Authorization':'Bearer '+key,'apikey':key,'Content-Type':mime,'x-upsert':'false'})
  with urllib.request.urlopen(req,timeout=30) as r:return r.read()
 try:
  with psycopg.connect(db) as conn:
   with conn.transaction():
    # Restore is restricted to an empty schema and an explicitly selected test user.
    if not conn.execute('select exists(select 1 from auth.users where id=%s)',(owner,)).fetchone()[0]:raise ValueError('Create the target test Auth user first')
    for name in doc['tables']:
     if conn.execute(sql.SQL('select count(*) from public.{}').format(sql.Identifier(name))).fetchone()[0]:raise ValueError('Target journal is not empty; nothing restored')
    edges=conn.execute("select c.conrelid::regclass::text,p.confrelid::regclass::text from pg_constraint c join pg_constraint p on p.oid=c.oid where c.contype='f' and c.connamespace='public'::regnamespace").fetchall()
    deps={t:set() for t in doc['tables']}
    for child,parent in edges:
     child=child.split('.')[-1];parent=parent.split('.')[-1]
     if child in deps and parent in doc['tables'] and child!=parent:deps[child].add(parent)
    order=[]
    while deps:
     ready=sorted(t for t,d in deps.items() if not d)
     if not ready:raise ValueError('Cyclic restore dependencies')
     order+=ready
     for t in ready:del deps[t]
     for d in deps.values():d.difference_update(ready)
    try:
     for path,b in images:
      new_path=owner+path[len(old):];storage('POST',new_path,b);uploaded.append(new_path)
     for name in order:conn.execute(sql.SQL('alter table public.{} disable trigger user').format(sql.Identifier(name)))
     for name in order:
      rows=normalize_restore_rows(name,transform(doc['tables'][name]))
      if not rows:continue
      columns=conn.execute("select column_name from information_schema.columns where table_schema='public' and table_name=%s order by ordinal_position",(name,)).fetchall();columns=[c[0] for c in columns]
      conn.execute(sql.SQL('insert into public.{} ({}) overriding system value select {} from jsonb_populate_recordset(null::public.{},%s::jsonb)').format(sql.Identifier(name),sql.SQL(',').join(map(sql.Identifier,columns)),sql.SQL(',').join(map(sql.Identifier,columns)),sql.Identifier(name)),(json.dumps(rows),))
     for name in order:
      conn.execute(sql.SQL('alter table public.{} enable trigger user').format(sql.Identifier(name)))
      if conn.execute(sql.SQL('select count(*) from public.{}').format(sql.Identifier(name))).fetchone()[0]!=len(doc['tables'][name]):raise ValueError('Restore row-count mismatch')
     # Sequence values must continue above restored generated values.
     conn.execute("select setval(pg_get_serial_sequence('public.allocation_change_log','event_seq'),greatest(coalesce((select max(event_seq) from public.allocation_change_log),1),1))")
    except BaseException:
     for path in uploaded:
      try:storage('DELETE',path)
      except Exception:pass
     raise
 except BaseException:
  for path in uploaded:
   try:storage('DELETE',path)
   except Exception:print('Warning: an uploaded test image could not be cleaned; check test storage.')
  raise
 print('Restored to separate empty test project. Verify Auth, images and application flows before use.')

def main():
 p=argparse.ArgumentParser();p.add_argument('backup');p.add_argument('--restore',action='store_true');p.add_argument('--target-owner');a=p.parse_args()
 doc,images=validate(a.backup)
 if a.restore:
  if not a.target_owner:p.error('--target-owner required for an isolated restore')
  restore(doc,images,a.target_owner)
 else:print(json.dumps({'valid':True,'tables':len(doc['tables']),'rows':sum(map(len,doc['tables'].values())),'verified_images':len(images)}))
if __name__=='__main__':main()
