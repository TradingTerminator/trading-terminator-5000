import importlib.util, pathlib, unittest

spec = importlib.util.spec_from_file_location('restore811', pathlib.Path(__file__).parents[1] / 'scripts' / 'restore-backup-v8.py')
restore = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restore)

class Backup811Tests(unittest.TestCase):
 def test_legacy_idea_gets_only_missing_defaults(self):
  old = {'id': 'idea', 'thesis': 'Original', 'learning_revision': 5}
  row = restore.normalize_restore_rows('trade_ideas_v733', [old])[0]
  self.assertEqual(row['revision_v811'], 0)
  self.assertEqual(row['learning_revision'], 5)
  self.assertNotIn('current_plan_v811', row)
  self.assertEqual(row['thesis'], 'Original')

 def test_modern_revision_and_plan_survive(self):
  row = {'revision_v811': 4, 'current_plan_v811': {'thesis': 'Current'}, 'learning_review': {}, 'learning_revision': 2}
  self.assertEqual(restore.normalize_restore_rows('trade_ideas_v733', [row]), [row])

 def test_export_restores_both_append_only_ledgers(self):
  self.assertEqual(len(restore.V811_TABLES), 27)
  self.assertTrue({'session_events_v810', 'stop_requests_v811'} <= restore.V811_TABLES)
