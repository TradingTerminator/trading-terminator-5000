-- Superseded proposal: existing privileges already enforce this protection.
-- Verified 2026-11-13. No migration applied. Read-only checks only.
SELECT r.rolname,
 has_table_privilege(r.rolname,'public.stop_adjustments','SELECT') AS can_read,
 has_table_privilege(r.rolname,'public.stop_adjustments','INSERT') AS can_insert,
 has_table_privilege(r.rolname,'public.stop_adjustments','UPDATE') AS can_update,
 has_table_privilege(r.rolname,'public.stop_adjustments','DELETE') AS can_delete,
 has_function_privilege(r.rolname,
 'public.record_stop_adjustment(uuid,integer,integer,text,text)','EXECUTE') AS can_rpc
FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role');
-- Behavioral checks: tests/sql/verify_stop_history.sql (all fixtures rolled back).
