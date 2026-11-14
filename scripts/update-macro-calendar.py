"""Fetch public BLS/BEA schedules; retain and mark each failed source separately."""
import concurrent.futures, hashlib, json, re, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

SOURCES={
 'BLS':{'url':'https://www.bls.gov/schedule/news_release/bls.ics','page':'https://www.bls.gov/schedule/'},
 'BEA':{'url':'https://apps.bea.gov/API/signup/release_dates.json','page':'https://www.bea.gov/news/schedule'},
}

def event(source,title,start):
 if not isinstance(title,str) or not title.strip() or len(title)>300 or start.tzinfo is None:raise ValueError('Invalid event')
 stamp=start.astimezone(timezone.utc).isoformat().replace('+00:00','Z')
 return {'id':hashlib.sha256((source+'|'+title+'|'+stamp).encode()).hexdigest()[:24],'source':source,'title':title.strip(),'at':stamp,'url':SOURCES[source]['page']}

def parse_bls(text):
 if 'BEGIN:VCALENDAR' not in text or len(text)>2000000:raise ValueError('Not a BLS calendar')
 text=re.sub(r'\r?\n[ \t]','',text);rows=[]
 for block in text.split('BEGIN:VEVENT')[1:]:
  block=block.split('END:VEVENT')[0]
  if 'STATUS:CANCELLED' in block:continue
  if re.search(r'^RRULE:',block,re.M):raise ValueError('Unsupported recurring release')
  fields={}
  for line in block.splitlines():
   if ':' in line:
    key,value=line.split(':',1);fields[key]=value
  dates=[(key,value) for key,value in fields.items() if key.split(';')[0]=='DTSTART']
  if not dates or 'SUMMARY' not in fields:raise ValueError('Incomplete BLS event')
  key,value=dates[0]
  if 'VALUE=DATE' in key:continue # no invented time for all-day events
  if value.endswith('Z'):start=datetime.strptime(value,'%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc)
  else:
   zone=re.search(r'TZID=([^;]+)',key)
   if not zone or zone.group(1) not in ('US-Eastern','America/New_York'):raise ValueError('Unknown release timezone')
   start=datetime.strptime(value,'%Y%m%dT%H%M%S').replace(tzinfo=ZoneInfo('America/New_York'))
  title=fields['SUMMARY'].replace('\\n',' ').replace('\\,',',').replace('\\;',';').replace('\\\\','\\')
  rows.append(event('BLS',title,start))
 if not rows:raise ValueError('Empty BLS calendar')
 return rows

def parse_bea(text):
 payload=json.loads(text);rows=[]
 if not isinstance(payload,dict):raise ValueError('Invalid BEA format')
 for title,item in payload.items():
  if title=='file_last_updated':continue
  if not isinstance(item,dict) or not isinstance(item.get('release_dates'),list):raise ValueError('Invalid BEA dates')
  for date in item['release_dates']:rows.append(event('BEA',title,datetime.fromisoformat(date.replace('Z','+00:00'))))
 if not rows:raise ValueError('Empty BEA calendar')
 return rows

def fetch_source(source):
 request=urllib.request.Request(SOURCES[source]['url'],headers={'User-Agent':'TradingTerminator-calendar/8.05 (+https://app.tradingterminator.com)'})
 with urllib.request.urlopen(request,timeout=20) as response:
  raw=response.read(2000001)
 if len(raw)>2000000:raise ValueError('Calendar too large')
 return (parse_bls if source=='BLS' else parse_bea)(raw.decode('utf-8-sig'))

def update(previous,fetch=fetch_source,now=None):
 now=now or datetime.now(timezone.utc);stamp=now.isoformat().replace('+00:00','Z');out={'version':1,'checked_at':stamp,'coverage':'BLS and BEA scheduled releases only. No Fed, ISM, earnings, forecasts or actual values.','sources':{},'events':[]}
 def one(source):
  try:
   rows=fetch(source)
   if not any(datetime.fromisoformat(row['at'].replace('Z','+00:00'))>now for row in rows):raise ValueError('No future dates')
   return source,rows,{'url':SOURCES[source]['page'],'fetched_at':stamp,'ok':True}
  except Exception:
   rows=[row for row in previous.get('events',[]) if row.get('source')==source]
   return source,rows,{'url':SOURCES[source]['page'],'fetched_at':previous.get('sources',{}).get(source,{}).get('fetched_at'),'ok':False,'error':'Source could not be refreshed'}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  for source,rows,state in pool.map(one,SOURCES):
   out['sources'][source]=state
   out['events'].extend(row for row in rows if now-timedelta(days=7)<=datetime.fromisoformat(row['at'].replace('Z','+00:00'))<=now+timedelta(days=370))
 out['events']=sorted({row['id']:row for row in out['events']}.values(),key=lambda row:(row['at'],row['source'],row['title']))
 return out

if __name__=='__main__':
 target=Path(__file__).resolve().parent.parent/'data/macro-calendar.json'
 try:previous=json.loads(target.read_text())
 except (FileNotFoundError,json.JSONDecodeError):previous={}
 data=update(previous);target.parent.mkdir(exist_ok=True);temp=target.with_suffix('.tmp');temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');temp.replace(target)
 print(json.dumps({'events':len(data['events']),'sources':data['sources']}))
 if not any(state['ok'] for state in data['sources'].values()):raise SystemExit('No calendar source refreshed; retained data marked stale')
