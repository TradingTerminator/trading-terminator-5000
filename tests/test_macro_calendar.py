import importlib.util,unittest,json
from datetime import datetime, timezone
from pathlib import Path
spec=importlib.util.spec_from_file_location('macro',Path(__file__).resolve().parents[1]/'scripts/update-macro-calendar.py');macro=importlib.util.module_from_spec(spec);spec.loader.exec_module(macro)
class CalendarTests(unittest.TestCase):
 def test_us_dst_and_folded_title(self):
  text='BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:a\nDTSTART;TZID=US-Eastern:20260313T083000\nSUMMARY:Consumer Price\n Index\nEND:VEVENT\nEND:VCALENDAR'
  rows=macro.parse_bls(text);self.assertEqual(rows[0]['at'],'2026-03-13T12:30:00Z');self.assertEqual(rows[0]['title'],'Consumer PriceIndex')
 def test_all_day_and_cancelled_are_not_invented_timed_releases(self):
  text='BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261114\nSUMMARY:All day\nEND:VEVENT\nBEGIN:VEVENT\nDTSTART:20261116T133000Z\nSUMMARY:Cancelled\nSTATUS:CANCELLED\nEND:VEVENT\nBEGIN:VEVENT\nDTSTART;TZID=US-Eastern:20261117T083000\nSUMMARY:Kept\nEND:VEVENT\nEND:VCALENDAR'
  rows=macro.parse_bls(text);self.assertEqual(len(rows),1);self.assertEqual(rows[0]['at'],'2026-11-17T13:30:00Z')
 def test_unsupported_timezone_is_rejected(self):
  with self.assertRaises(ValueError):macro.parse_bls('BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;TZID=Unrecognized:20261117T083000\nSUMMARY:X\nEND:VEVENT\nEND:VCALENDAR')
 def test_bea_metadata_and_duplicate_dates(self):
  raw=json.dumps({'GDP':{'release_dates':['2026-11-25T13:30:00+00:00']*2},'file_last_updated':'2026-10-22T12:48:27'})
  rows=macro.parse_bea(raw);out=macro.update({},lambda source:rows if source=='BEA' else [macro.event('BLS','Employment',datetime(2026,12,1,tzinfo=timezone.utc))],datetime(2026,11,14,tzinfo=timezone.utc));self.assertEqual(len(out['events']),2);self.assertTrue(out['sources']['BEA']['ok'])
 def test_failed_source_retains_its_data_and_original_timestamp(self):
  row=macro.event('BLS','CPI',datetime(2026,12,1,tzinfo=timezone.utc));previous={'events':[row],'sources':{'BLS':{'fetched_at':'2026-11-13T00:00:00Z'}}}
  def failed(source):raise OSError('offline')
  out=macro.update(previous,failed,datetime(2026,11,14,tzinfo=timezone.utc));self.assertEqual(out['events'],[row]);self.assertFalse(out['sources']['BLS']['ok']);self.assertEqual(out['sources']['BLS']['fetched_at'],'2026-11-13T00:00:00Z');self.assertIsNone(out['sources']['BEA']['fetched_at'])
 def test_expired_source_is_not_marked_fresh(self):
  row=macro.event('BLS','Old',datetime(2025,12,1,tzinfo=timezone.utc));out=macro.update({},lambda source:[row],datetime(2026,11,14,tzinfo=timezone.utc));self.assertFalse(out['sources']['BLS']['ok']);self.assertEqual(out['events'],[])
if __name__=='__main__':unittest.main()
