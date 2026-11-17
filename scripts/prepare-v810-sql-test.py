"""Prepare the historical schema-only export for an isolated PostgreSQL test.
The exported baseline omitted statement terminators after function definitions;
normalization affects the disposable test input only, never V7 source or production.
"""
from pathlib import Path
import re
source=Path('sql/schema_baseline_before_v735.sql').read_text()
source=re.sub(r'^(\s*(?:end )?\$function\$)\s*$',r'\1;',source,flags=re.I|re.M)
Path('/tmp/tt810-baseline.sql').write_text(source)
