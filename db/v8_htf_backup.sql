-- V8 export extends the V7 snapshot without changing the V7 RPC.
CREATE FUNCTION public.export_journal_snapshot_v803()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_snapshot jsonb; v_name text; v_rows jsonb; v_tables jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 v_snapshot:=public.export_journal_snapshot_v735();v_tables:=v_snapshot->'tables';
 FOREACH v_name IN ARRAY ARRAY['v8_htf_assessments','v8_htf_preferences'] LOOP
  EXECUTE format('select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),''[]''::jsonb) from public.%I t where owner_id=$1',v_name) INTO v_rows USING v_uid;
  IF jsonb_array_length(v_rows)>50000 THEN RAISE EXCEPTION 'Table too large for browser backup: %',v_name; END IF;
  v_tables:=v_tables||jsonb_build_object(v_name,v_rows);
 END LOOP;
 RETURN jsonb_set(v_snapshot,'{tables}',v_tables);
END $$;
REVOKE ALL ON FUNCTION public.export_journal_snapshot_v803() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.export_journal_snapshot_v803() TO authenticated;
