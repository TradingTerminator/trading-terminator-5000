-- Private reset receipts retain only the identifiers needed to reject stale clients.
CREATE SCHEMA IF NOT EXISTS tt_private;
REVOKE ALL ON SCHEMA tt_private FROM PUBLIC,anon,authenticated;
CREATE TABLE tt_private.reset_state(owner_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
 generation uuid, phase text NOT NULL DEFAULT 'ready' CHECK(phase IN ('ready','files','purging')),
 challenge uuid,expires_at timestamptz,request_id uuid);
CREATE FUNCTION tt_private.tables_v8141() RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT ARRAY['trade_attempts_v733','trade_entry_requests_v735','stop_requests_v811','stop_adjustments','account_fills','account_trade_results','trade_reviews','trade_errors','trade_events','playbook_entries','screenshots','training_goals_v7','session_events_v810','v8_htf_assessments','trade_account_allocations','allocation_change_log','trades','trade_ideas_v733','trade_ideas','trading_sessions','account_group_members','account_groups','trading_accounts','corrective_actions','training_countermeasures','trading_setup_catalog','v8_htf_preferences','workspace_revisions_v814','test_setups_v8141']::text[]
$$;
CREATE FUNCTION tt_private.lock_owner(u uuid,exclusive boolean) RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'Anmeldung erforderlich';END IF;
 IF exclusive THEN PERFORM pg_advisory_xact_lock(hashtextextended(u::text,8141));ELSE PERFORM pg_advisory_xact_lock_shared(hashtextextended(u::text,8141));END IF;
END $$;
CREATE FUNCTION tt_private.header_generation() RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT nullif(current_setting('request.headers',true),'')::jsonb->>'x-tt-generation'
$$;
CREATE FUNCTION tt_private.guard_write() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid;s tt_private.reset_state;
BEGIN
 IF TG_OP='DELETE' THEN u:=OLD.owner_id;ELSE u:=NEW.owner_id;END IF;
 IF TG_OP='UPDATE' AND OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN RAISE EXCEPTION 'Eigentümerwechsel gesperrt';END IF;
 IF auth.uid() IS NOT NULL AND u IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Fremde Daten';END IF;
 PERFORM tt_private.lock_owner(u,false);SELECT * INTO s FROM tt_private.reset_state WHERE owner_id=u FOR SHARE;
 IF s.phase='purging' AND u=auth.uid() THEN NULL;
 ELSIF s.phase='files' OR (s.generation IS NOT NULL AND tt_private.header_generation() IS DISTINCT FROM s.generation::text) THEN
 RAISE EXCEPTION 'Datenstand zurückgesetzt. App erneut öffnen.' USING ERRCODE='40001';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY tt_private.tables_v8141() LOOP
 EXECUTE format('CREATE TRIGGER tt_generation BEFORE INSERT OR DELETE OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION tt_private.guard_write()',t);
END LOOP;END $$;
CREATE FUNCTION public.tt_purging_self_v8141(u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT u=auth.uid() AND EXISTS(SELECT FROM tt_private.reset_state WHERE owner_id=u AND phase='purging')
$$;
DROP TRIGGER trg_guard_trade_attempt_v734 ON public.trade_attempts_v733;
CREATE TRIGGER trg_guard_trade_attempt_v734 BEFORE INSERT OR UPDATE ON public.trade_attempts_v733 FOR EACH ROW EXECUTE FUNCTION public.guard_trade_attempt_v734();
CREATE TRIGGER trg_guard_attempt_delete BEFORE DELETE ON public.trade_attempts_v733 FOR EACH ROW WHEN(NOT public.tt_purging_self_v8141(OLD.owner_id)) EXECUTE FUNCTION public.guard_trade_attempt_v734();
CREATE FUNCTION tt_private.guard_chart_file() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid;s tt_private.reset_state;
BEGIN
 IF NEW.bucket_id<>'trading-chart-screenshots' THEN RETURN NEW;END IF;
 u:=split_part(NEW.name,'/',1)::uuid;PERFORM tt_private.lock_owner(u,false);
 SELECT * INTO s FROM tt_private.reset_state WHERE owner_id=u FOR SHARE;
 IF s.phase IN ('files','purging') OR (s.generation IS NOT NULL AND split_part(NEW.name,'/',4)<>s.generation::text) THEN
 RAISE EXCEPTION 'Bild gehört zu einem früheren Datenstand' USING ERRCODE='40001';END IF;RETURN NEW;
END $$;
CREATE TRIGGER tt_chart_generation BEFORE INSERT OR UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION tt_private.guard_chart_file();
CREATE FUNCTION public.tt_data_state_v8141() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('generation',s.generation,'phase',coalesce(s.phase,'ready'),'request',s.request_id)
 FROM (SELECT auth.uid() u) a LEFT JOIN tt_private.reset_state s ON s.owner_id=a.u WHERE a.u IS NOT NULL
$$;
CREATE FUNCTION public.tt_prepare_reset_v8141() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid();c uuid:=gen_random_uuid();BEGIN
 PERFORM tt_private.lock_owner(u,true);
 INSERT INTO tt_private.reset_state AS s(owner_id,challenge,expires_at) VALUES(u,c,now()+interval '10 minutes')
 ON CONFLICT(owner_id) DO UPDATE SET challenge=c,expires_at=excluded.expires_at WHERE s.phase='ready' AND (s.generation IS NULL OR s.generation::text=tt_private.header_generation());
 IF NOT FOUND THEN RAISE EXCEPTION 'Aktuellen Datenstand laden';END IF;RETURN c;
END $$;
CREATE FUNCTION public.tt_begin_reset_v8141(ticket uuid,phrase text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid();s tt_private.reset_state;BEGIN
 PERFORM tt_private.lock_owner(u,true);
 IF phrase IS DISTINCT FROM 'ALLES ENDGÜLTIG LÖSCHEN' OR ticket IS NULL THEN RAISE EXCEPTION 'Bestätigung unvollständig';END IF;
 SELECT * INTO s FROM tt_private.reset_state WHERE owner_id=u FOR UPDATE;
 IF s.request_id=ticket THEN RETURN public.tt_data_state_v8141();END IF;
 IF s.challenge IS DISTINCT FROM ticket OR s.expires_at<=now() OR s.phase IS DISTINCT FROM 'ready' THEN RAISE EXCEPTION 'Bestätigung abgelaufen';END IF;
 UPDATE tt_private.reset_state SET phase='files',request_id=ticket,generation=gen_random_uuid(),challenge=NULL,expires_at=NULL WHERE owner_id=u;
 RETURN public.tt_data_state_v8141();
END $$;
CREATE FUNCTION public.tt_reset_files_v8141(ticket uuid) RETURNS TABLE(path text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT o.name FROM storage.objects o JOIN tt_private.reset_state s ON s.owner_id=auth.uid() AND s.phase='files' AND s.request_id=ticket
 WHERE o.bucket_id='trading-chart-screenshots' AND split_part(o.name,'/',1)=s.owner_id::text ORDER BY o.name LIMIT 100
$$;
CREATE FUNCTION public.tt_finish_reset_v8141(ticket uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid();s tt_private.reset_state;t text;remaining boolean;
BEGIN
 PERFORM tt_private.lock_owner(u,true);SELECT * INTO s FROM tt_private.reset_state WHERE owner_id=u FOR UPDATE;
 IF ticket IS NULL OR s.request_id IS DISTINCT FROM ticket THEN RAISE EXCEPTION 'Löschauftrag fehlt';END IF;
 IF s.phase='ready' THEN RETURN public.tt_data_state_v8141();END IF;
 IF EXISTS(SELECT FROM public.tt_reset_files_v8141(ticket)) THEN RAISE EXCEPTION 'Bilddateien ausstehend';END IF;
 UPDATE tt_private.reset_state SET phase='purging' WHERE owner_id=u;
 DELETE FROM public.trade_attempts_v733 WHERE owner_id=u;
 DELETE FROM public.trade_entry_requests_v735 WHERE owner_id=u;
 DELETE FROM public.stop_requests_v811 WHERE owner_id=u;
 DELETE FROM public.stop_adjustments WHERE owner_id=u;
 DELETE FROM public.account_fills WHERE owner_id=u;
 DELETE FROM public.account_trade_results WHERE owner_id=u;
 DELETE FROM public.trade_reviews WHERE owner_id=u;
 DELETE FROM public.trade_errors WHERE owner_id=u;
 DELETE FROM public.trade_events WHERE owner_id=u;
 DELETE FROM public.playbook_entries WHERE owner_id=u;
 DELETE FROM public.screenshots WHERE owner_id=u;
 DELETE FROM public.training_goals_v7 WHERE owner_id=u;
 DELETE FROM public.session_events_v810 WHERE owner_id=u;
 DELETE FROM public.v8_htf_assessments WHERE owner_id=u;
 DELETE FROM public.trade_account_allocations WHERE owner_id=u;
 DELETE FROM public.allocation_change_log WHERE owner_id=u;
 DELETE FROM public.trades WHERE owner_id=u;
 DELETE FROM public.trade_ideas_v733 WHERE owner_id=u;
 DELETE FROM public.trade_ideas WHERE owner_id=u;
 DELETE FROM public.trading_sessions WHERE owner_id=u;
 DELETE FROM public.account_group_members WHERE owner_id=u;
 DELETE FROM public.account_groups WHERE owner_id=u;
 DELETE FROM public.trading_accounts WHERE owner_id=u;
 DELETE FROM public.corrective_actions WHERE owner_id=u;
 DELETE FROM public.training_countermeasures WHERE owner_id=u;
 DELETE FROM public.trading_setup_catalog WHERE owner_id=u;
 DELETE FROM public.v8_htf_preferences WHERE owner_id=u;
 DELETE FROM public.workspace_revisions_v814 WHERE owner_id=u;
 DELETE FROM public.test_setups_v8141 WHERE owner_id=u;
 FOREACH t IN ARRAY tt_private.tables_v8141() LOOP EXECUTE format('SELECT EXISTS(SELECT FROM public.%I WHERE owner_id=$1)',t) INTO remaining USING u;
 IF remaining THEN RAISE EXCEPTION 'Bereinigung unvollständig';END IF;END LOOP;
 UPDATE auth.users SET raw_user_meta_data=raw_user_meta_data-'tt8_emotion_labels' WHERE id=u AND raw_user_meta_data?'tt8_emotion_labels';
 UPDATE tt_private.reset_state SET phase='ready' WHERE owner_id=u;
 RETURN public.tt_data_state_v8141();
END $$;
CREATE FUNCTION public.tt_remove_tests_v8141(expected uuid[]) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid();ids uuid[];n integer;
BEGIN
 PERFORM tt_private.lock_owner(u,true);
 SELECT coalesce(array_agg(id ORDER BY id),'{}') INTO ids FROM public.test_setups_v8141 WHERE owner_id=u AND is_test_data;
 IF ids IS DISTINCT FROM ARRAY(SELECT unnest(expected) ORDER BY 1) THEN RAISE EXCEPTION 'Vorschau inzwischen geändert';END IF;
 DELETE FROM public.test_setups_v8141 WHERE owner_id=u AND is_test_data;GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $$;
DO $$DECLARE f regprocedure;BEGIN FOR f IN SELECT p.oid::regprocedure FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname LIKE 'tt_%_v8141' LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f);END LOOP;END $$;
