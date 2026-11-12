-- Additive hardening; no journal rows deleted. Apply before publishing V7.35.
ALTER FUNCTION public.guard_trade_idea_plan_v733() SET search_path = '';
REVOKE ALL ON FUNCTION public.guard_trade_idea_plan_v733() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.guard_trade_attempt_v734() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.guard_initial_risk_immutable_v732() FROM PUBLIC,anon,authenticated;
REVOKE TRUNCATE,TRIGGER,REFERENCES ON ALL TABLES IN SCHEMA public FROM anon,authenticated;
ALTER TABLE public.trade_account_allocations ADD CONSTRAINT taa_supported_instrument_v735 CHECK(instrument IN ('NQ','MNQ','ES','MES'));
ALTER TABLE public.trade_account_allocations ADD CONSTRAINT taa_finite_risk_v735 CHECK(planned_quantity::text NOT IN ('NaN','Infinity','-Infinity') AND coalesce(initial_risk_usd::text,'') NOT IN ('NaN','Infinity','-Infinity') AND coalesce(calculated_risk_usd::text,'') NOT IN ('NaN','Infinity','-Infinity'));
CREATE OR REPLACE FUNCTION public.guard_trade_risk_v735() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v_count int;v_complete int;v_sum numeric;
BEGIN
 IF NEW.initial_risk_usd IS NOT NULL AND NEW.initial_risk_usd::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid initial risk';END IF;
 IF TG_OP='UPDATE' AND NEW.initial_risk_usd IS DISTINCT FROM OLD.initial_risk_usd THEN
 SELECT count(*),count(initial_risk_usd),sum(initial_risk_usd) INTO v_count,v_complete,v_sum FROM public.trade_account_allocations WHERE trade_id=NEW.id AND owner_id=NEW.owner_id;
 IF v_count=0 OR v_count<>v_complete OR NEW.initial_risk_usd IS DISTINCT FROM v_sum THEN RAISE EXCEPTION 'Trade risk must equal complete original account risks';END IF;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_trade_risk_v735() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_trade_risk_v735 BEFORE UPDATE OF initial_risk_usd ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_trade_risk_v735();

-- One owner lock serializes day counting and network retries.
CREATE TABLE public.trade_entry_requests_v735(
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,trade_id uuid NOT NULL,payload_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(owner_id,request_id),FOREIGN KEY(trade_id,owner_id) REFERENCES public.trades(id,owner_id) ON DELETE CASCADE
);
ALTER TABLE public.trade_entry_requests_v735 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trade_entry_requests_v735 FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.trade_entry_requests_v735 TO authenticated;
CREATE POLICY entry_requests_owner_v735 ON public.trade_entry_requests_v735 TO authenticated USING(owner_id=(select auth.uid())) WITH CHECK(owner_id=(select auth.uid()));
CREATE OR REPLACE FUNCTION public.trading_day_count_v735() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('date',(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Berlin')::date,'count',count(*)) FROM public.trades WHERE owner_id=auth.uid() AND (entry_at AT TIME ZONE 'Europe/Berlin')::date=(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Berlin')::date
$$;
REVOKE ALL ON FUNCTION public.trading_day_count_v735() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.trading_day_count_v735() TO authenticated;
CREATE OR REPLACE FUNCTION public.record_trade_attempt_v735(p_session_id uuid,p_setup_type text,p_instrument text,p_direction text,p_allocations jsonb,p_entry_emotion text,p_client_request_id uuid,p_limit_reason text DEFAULT NULL,p_idea_id uuid DEFAULT NULL,p_warning_answers jsonb DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_trade uuid;v_n int;v_reason text:=nullif(btrim(p_limit_reason),'');v_obs jsonb;v_hash text;v_saved_hash text;
BEGIN
 IF v_uid IS NULL OR p_client_request_id IS NULL THEN RAISE EXCEPTION 'Authentication and request ID required';END IF;
 IF length(coalesce(v_reason,''))>1000 THEN RAISE EXCEPTION 'Reason too long';END IF;
 v_hash:=md5(jsonb_build_array(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion,p_limit_reason,p_idea_id,p_warning_answers)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text,735));
 SELECT trade_id,payload_hash INTO v_trade,v_saved_hash FROM public.trade_entry_requests_v735 WHERE owner_id=v_uid AND request_id=p_client_request_id;
 IF FOUND THEN IF v_saved_hash<>v_hash THEN RAISE EXCEPTION 'Entry already saved with different inputs. Check trade list before creating another entry';END IF;RETURN v_trade;END IF;
 SELECT count(*) INTO v_n FROM public.trades WHERE owner_id=v_uid AND (entry_at AT TIME ZONE 'Europe/Berlin')::date=(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Berlin')::date;
 v_trade:=public.record_trade_attempt_v733(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion,p_idea_id,p_warning_answers);
 v_obs:=jsonb_build_object('client_request_id',p_client_request_id,'limit_exception',jsonb_build_object('exceeded',v_n>=5,'day_trade_number',v_n+1,'reason',v_reason,'review_required',v_n>=5));
 UPDATE public.trades SET observations=observations||v_obs,rule_deviation=rule_deviation OR(v_n>=5 AND v_reason IS NULL) WHERE id=v_trade AND owner_id=v_uid;
 INSERT INTO public.trade_entry_requests_v735(owner_id,request_id,trade_id,payload_hash) VALUES(v_uid,p_client_request_id,v_trade,v_hash);
 RETURN v_trade;
END $$;
REVOKE ALL ON FUNCTION public.record_trade_attempt_v735(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v735(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_review_v735() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e jsonb;v_reviewed boolean;v_confirmed boolean:=false;v_id text;v_decision text;s record;v_reason text;
BEGIN
 IF TG_OP='UPDATE' AND OLD.observations ? 'limit_exception' AND NEW.observations->'limit_exception' IS DISTINCT FROM OLD.observations->'limit_exception' THEN RAISE EXCEPTION 'Entry exception record is immutable';END IF;
 v_reviewed:=coalesce(NEW.observations->>'compliance_reviewed','false')='true';
 IF v_reviewed AND NOT(NEW.observations ? 'review_errors') THEN NEW.observations:=NEW.observations||jsonb_build_object('review_errors',CASE WHEN coalesce(NEW.observations->>'review_error','')<>'' THEN jsonb_build_array(jsonb_build_object('id','legacy-'||NEW.id::text,'type',NEW.observations->>'review_error','countermeasure',NEW.observations->>'countermeasure','confirmed_breach',NEW.rule_deviation)) ELSE '[]'::jsonb END);END IF;
 IF NEW.observations ? 'review_errors' THEN
 IF jsonb_typeof(NEW.observations->'review_errors') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.observations->'review_errors')>30 THEN RAISE EXCEPTION 'Invalid error list';END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(NEW.observations->'review_errors') LOOP
 IF jsonb_typeof(e) IS DISTINCT FROM 'object' OR coalesce(e->>'type','') NOT IN ('fomo','overtrading','poor_entry','stop_management','early_exit','plan_violation','other','revenge','impulsive','fear_exit','greed_exit','frustration_exit') OR length(coalesce(e->>'countermeasure',''))>1000 OR (v_reviewed AND btrim(coalesce(e->>'countermeasure',''))='') THEN RAISE EXCEPTION 'Each reviewed error requires a type and countermeasure';END IF;
 v_confirmed:=v_confirmed OR coalesce(e->>'confirmed_breach','false')='true';
 END LOOP;
 IF v_reviewed AND NEW.rule_deviation AND NOT v_confirmed THEN RAISE EXCEPTION 'Confirmed breach must be recorded as a separate error';END IF;
 IF v_reviewed AND v_confirmed AND NOT NEW.rule_deviation THEN RAISE EXCEPTION 'Confirmed error contradicts compliance result';END IF;
 END IF;
 IF coalesce(NEW.observations->'limit_exception'->>'exceeded','false')='true' THEN
 v_reason:=nullif(btrim(NEW.observations->'limit_exception'->>'reason'),'');
 IF v_reason IS NULL THEN NEW.rule_deviation:=true;END IF;
 IF v_reviewed THEN
 v_decision:=NEW.observations->'exception_reviews'->>'daily-limit';
 IF v_decision IS NULL OR v_decision NOT IN ('accepted','breach') OR(v_reason IS NULL AND v_decision<>'breach') THEN RAISE EXCEPTION 'Daily limit exception needs explicit review';END IF;
 IF v_decision='breach' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.observations->'review_errors','[]')) AS error_item(val) WHERE val->>'source_id'='daily-limit' AND val->>'confirmed_breach'='true' AND btrim(coalesce(val->>'countermeasure',''))<>'') THEN RAISE EXCEPTION 'Daily limit breach needs an error and countermeasure';END IF;
 END IF;
 END IF;
 IF v_reviewed THEN
 FOR s IN SELECT sa.id,sa.notes FROM public.stop_adjustments sa JOIN public.trade_account_allocations a ON a.id=sa.allocation_id AND a.owner_id=sa.owner_id WHERE sa.trade_id=NEW.id AND sa.owner_id=NEW.owner_id AND sa.new_stop_ticks < -(a.initial_sl_points*4) LOOP
 v_id:='stop-'||s.id::text;v_reason:=nullif(btrim(s.notes),'');v_decision:=NEW.observations->'exception_reviews'->>v_id;
 IF v_decision IS NULL OR v_decision NOT IN('accepted','breach') OR(v_reason IS NULL AND v_decision<>'breach') THEN RAISE EXCEPTION 'Risk increase needs explicit exception review';END IF;
 IF v_decision='breach' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.observations->'review_errors','[]')) AS error_item(val) WHERE val->>'source_id'=v_id AND val->>'confirmed_breach'='true' AND btrim(coalesce(val->>'countermeasure',''))<>'') THEN RAISE EXCEPTION 'Risk increase breach needs an error and countermeasure';END IF;
 END LOOP;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_review_v735() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_review_v735 BEFORE INSERT OR UPDATE OF observations,rule_deviation ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_review_v735();

-- Stable function: one statement snapshot; own rows only, every table explicitly listed.
CREATE OR REPLACE FUNCTION public.export_journal_snapshot_v735() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_name text;v_rows jsonb;v_tables jsonb:='{}';v_images jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required';END IF;
 FOREACH v_name IN ARRAY ARRAY['trading_sessions','trade_ideas','trades','stop_adjustments','trade_events','screenshots','corrective_actions','trade_errors','trade_reviews','playbook_entries','trading_accounts','account_groups','account_group_members','trade_account_allocations','account_fills','account_trade_results','allocation_change_log','trading_setup_catalog','training_countermeasures','training_goals_v7','trade_ideas_v733','trade_attempts_v733','trade_entry_requests_v735'] LOOP
 EXECUTE format('select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),''[]''::jsonb) from public.%I t where owner_id=$1',v_name) INTO v_rows USING v_uid;
 IF jsonb_array_length(v_rows)>50000 THEN RAISE EXCEPTION 'Table too large for browser backup: %',v_name;END IF;
 v_tables:=v_tables||jsonb_build_object(v_name,v_rows);
 END LOOP;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',name,'metadata',metadata) ORDER BY name),'[]'::jsonb) INTO v_images FROM storage.objects WHERE bucket_id='trading-chart-screenshots' AND split_part(name,'/',1)=v_uid::text;
 RETURN jsonb_build_object('owner_id',v_uid,'tables',v_tables,'images',v_images);
END $$;
REVOKE ALL ON FUNCTION public.export_journal_snapshot_v735() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.export_journal_snapshot_v735() TO authenticated;

-- No direct client rewriting of stop history. The audited RPC retains its owner checks.
REVOKE INSERT,UPDATE,DELETE ON public.stop_adjustments FROM authenticated;
CREATE OR REPLACE FUNCTION public.mark_stop_exception_v735() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_initial int;
BEGIN
 SELECT (initial_sl_points*4)::int INTO v_initial FROM public.trade_account_allocations WHERE id=NEW.allocation_id AND owner_id=NEW.owner_id;
 IF v_initial IS NOT NULL AND NEW.new_stop_ticks < -v_initial THEN
 UPDATE public.trades SET rule_deviation=rule_deviation OR nullif(btrim(NEW.notes),'') IS NULL,
 observations=observations||jsonb_build_object('compliance_reviewed',false) WHERE id=NEW.trade_id AND owner_id=NEW.owner_id;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.mark_stop_exception_v735() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER mark_stop_exception_v735 AFTER INSERT ON public.stop_adjustments FOR EACH ROW EXECUTE FUNCTION public.mark_stop_exception_v735();
-- These two functions already check ownership; RLS now also applies in their body.
ALTER FUNCTION public.close_trade_with_account_results(uuid,text,jsonb) SECURITY INVOKER;
ALTER FUNCTION public.close_trade_with_account_results_v7(uuid,text,jsonb,text) SECURITY INVOKER;

-- Repair only fully documented aggregate risks, preserving the old value in trade_events.
WITH risks AS(SELECT trade_id,owner_id,sum(initial_risk_usd) risk FROM public.trade_account_allocations GROUP BY trade_id,owner_id HAVING count(*)=count(initial_risk_usd)),
 repairs AS(SELECT t.id,t.owner_id,t.initial_risk_usd old_risk,r.risk FROM public.trades t JOIN risks r ON r.trade_id=t.id AND r.owner_id=t.owner_id WHERE t.initial_risk_usd IS DISTINCT FROM r.risk),
 logged AS(INSERT INTO public.trade_events(owner_id,trade_id,event_type,details) SELECT owner_id,id,'risk_aggregate_repaired_v735',jsonb_build_object('previous_risk',old_risk,'account_risk_sum',risk) FROM repairs RETURNING trade_id)
UPDATE public.trades t SET initial_risk_usd=r.risk FROM repairs r WHERE t.id=r.id AND EXISTS(SELECT 1 FROM logged WHERE trade_id=t.id);

REVOKE DELETE ON public.trade_account_allocations FROM authenticated;
CREATE OR REPLACE FUNCTION public.guard_allocation_identity_v735() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v_risk numeric;
BEGIN
 IF TG_OP='UPDATE' AND OLD.initial_risk_usd IS NOT NULL AND (NEW.trade_id,NEW.account_id,NEW.role,NEW.instrument,NEW.planned_quantity) IS DISTINCT FROM (OLD.trade_id,OLD.account_id,OLD.role,OLD.instrument,OLD.planned_quantity) THEN RAISE EXCEPTION 'Original account allocation is immutable';END IF;
 IF TG_OP='INSERT' THEN
 SELECT initial_risk_usd INTO v_risk FROM public.trades WHERE id=NEW.trade_id AND owner_id=NEW.owner_id;
 IF v_risk IS NOT NULL THEN RAISE EXCEPTION 'Cannot add accounts after initial risk was recorded';END IF;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_allocation_identity_v735() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_allocation_identity_v735 BEFORE INSERT OR UPDATE ON public.trade_account_allocations FOR EACH ROW EXECUTE FUNCTION public.guard_allocation_identity_v735();
