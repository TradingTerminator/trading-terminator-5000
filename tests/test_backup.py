import hashlib, importlib.util, json, pathlib, tempfile, unittest, zipfile
spec=importlib.util.spec_from_file_location('restore',pathlib.Path(__file__).parents[1]/'scripts'/'restore-backup.py');restore=importlib.util.module_from_spec(spec);spec.loader.exec_module(restore)
OWNER='00000000-0000-4000-8000-000000000001'
class BackupTests(unittest.TestCase):
 def archive(self,alter=None,extra=None):
  d={'format':'trading-terminator-backup','format_version':2,'owner_id':OWNER,'tables':{name:[] for name in restore.TABLES},'images':[]}
  if alter:alter(d)
  f=tempfile.NamedTemporaryFile(suffix='.zip',delete=False);f.close();self.addCleanup(pathlib.Path(f.name).unlink)
  with zipfile.ZipFile(f.name,'w') as z:
   z.writestr('journal.json',json.dumps(d));z.writestr('README.txt','test')
   for k,v in (extra or {}).items():z.writestr(k,v)
  return f.name
 def test_complete_backup(self):
  d,images=restore.validate(self.archive());self.assertEqual(len(d['tables']),23);self.assertEqual(images,[])
 def test_missing_table_rejected(self):
  with self.assertRaises(ValueError):restore.validate(self.archive(lambda d:d['tables'].pop('trade_ideas_v733')))
 def test_foreign_rows_rejected(self):
  with self.assertRaises(ValueError):restore.validate(self.archive(lambda d:d['tables']['trades'].append({'owner_id':'foreign'})))
 def test_zip_traversal_rejected(self):
  with self.assertRaises(ValueError):restore.validate(self.archive(extra={'../bad':'bad'}))
 def test_corrupt_image_rejected(self):
  path=OWNER+'/trade/t/chart.png'
  def change(d):d['images']=[{'storage_path':path,'path':'images/'+path,'size':3,'sha256':hashlib.sha256(b'abc').hexdigest()}]
  with self.assertRaises(ValueError):restore.validate(self.archive(change,{'images/'+path:b'bad'}))
 def test_verified_image(self):
  path=OWNER+'/trade/t/chart.png'
  def change(d):d['images']=[{'storage_path':path,'path':'images/'+path,'size':3,'sha256':hashlib.sha256(b'abc').hexdigest()}]
  _,images=restore.validate(self.archive(change,{'images/'+path:b'abc'}));self.assertEqual(images,[(path,b'abc')])
if __name__=='__main__':unittest.main()
