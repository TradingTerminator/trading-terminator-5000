-- Additive audit store; no historical rows rewritten. Event writes are only possible via the owner-checked dispatcher.
CREATE TABLE public.session_events_v810(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES auth.users(id),
 session_id uuid NOT NULL REFERENCES public.trading_sessions(id),kind text NOT NULL,
 event_key text NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(session_id,kind,event_key),CHECK(pg_column_size(payload)<=65536)
);
ALTER TABLE public.session_events_v810 ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_session_events_v810 ON public.session_events_v810 FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
REVOKE ALL ON public.session_events_v810 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.session_events_v810 TO authenticated;
CREATE INDEX session_events_owner_v810 ON public.session_events_v810(owner_id,session_id,created_at);
CREATE FUNCTION public.session_missing_v810(c jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE missing jsonb:='[]';k text;
BEGIN
 IF coalesce(jsonb_array_length(c->'selected_accounts'),0)=0 THEN missing:=missing||'"Kontovorgaben fehlen"'::jsonb;END IF;
 IF c#>>'{htf_v8,id}' IS NOT NULL OR (length(btrim(coalesce(c->>'notes','')))>0 AND (SELECT count(*) FROM jsonb_each(CASE WHEN jsonb_typeof(c->'preflight_checks')='object' THEN c->'preflight_checks' ELSE '{}'::jsonb END))>=4 AND NOT EXISTS(SELECT 1 FROM jsonb_each(CASE WHEN jsonb_typeof(c->'preflight_checks')='object' THEN c->'preflight_checks' ELSE '{}'::jsonb END) x WHERE x.value IS DISTINCT FROM 'true'::jsonb)) THEN RETURN missing;END IF;
 missing:=missing||'"Vorbereitung nicht bestätigt"'::jsonb;
 FOREACH k IN ARRAY ARRAY['focus','pressure','fatigue','urge','fear','greed','revenge','frustration'] LOOP
 IF c#>ARRAY['mental_check','scales',k] IS NULL THEN missing:=missing||'"Mentale Vorbereitung nicht vollständig dokumentiert"'::jsonb;EXIT;END IF;END LOOP;
 RETURN missing;
END $$;
REVOKE ALL ON FUNCTION public.session_missing_v810(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.session_missing_v810(jsonb) TO authenticated;
-- Legacy endpoints retain their open-trade protection. Only an atomic V8.10 closure event authorizes separation.
CREATE OR REPLACE FUNCTION public.guard_session_close_v718() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.status='open' AND NEW.status='closed' AND NOT EXISTS(SELECT 1 FROM public.session_events_v810 WHERE session_id=NEW.id AND owner_id=NEW.owner_id AND kind='closed') AND EXISTS(SELECT 1 FROM public.trades WHERE session_id=NEW.id AND owner_id=NEW.owner_id AND exit_at IS NULL) THEN RAISE EXCEPTION 'Session contains open trades';END IF;
 IF OLD.status='closed' AND NEW.status='open' THEN RAISE EXCEPTION 'Closed sessions cannot be reopened';END IF;RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.guard_session_lifecycle_v720() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN RAISE EXCEPTION 'Session ownership cannot change';END IF;
 IF OLD.status='closed' AND NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'Closed sessions cannot be reopened';END IF;
 IF OLD.status='closed' AND NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN RAISE EXCEPTION 'Closed session timestamp cannot be modified';END IF;
 IF OLD.status='open' AND NEW.status='closed' THEN
 IF NOT EXISTS(SELECT 1 FROM public.session_events_v810 WHERE session_id=NEW.id AND owner_id=NEW.owner_id AND kind='closed') AND EXISTS(SELECT 1 FROM public.trades WHERE session_id=OLD.id AND owner_id=OLD.owner_id AND exit_at IS NULL) THEN RAISE EXCEPTION 'Cannot close session with open trades';END IF;
 IF NEW.closed_at IS NULL THEN NEW.closed_at:=clock_timestamp();END IF;END IF;RETURN NEW;
END $$;
CREATE FUNCTION public.session_action_v810(p_session_id uuid,p_request_id uuid,p_action text,p_payload jsonb DEFAULT '{}',p_expected_context jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();s public.trading_sessions;e public.session_events_v810;v_kind text;v_key text;missing jsonb;n integer;breaches integer;row jsonb;a public.trading_accounts;result jsonb;plan jsonb;goal jsonb;stamp timestamptz;duration integer;legacy_start text;
BEGIN
 IF uid IS NULL OR p_session_id IS NULL OR p_request_id IS NULL OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' OR pg_column_size(p_payload)>60000 THEN RAISE EXCEPTION 'Authentication and valid request required';END IF;
 IF p_action NOT IN('preview','start','accounts','confirm','close','ack','supplement') OR p_action IS NULL THEN RAISE EXCEPTION 'Unknown session action';END IF;
 -- Serializes starts on different devices; the session row serializes all further transitions.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,810));
 IF p_action='start' THEN
  SELECT * INTO s FROM public.trading_sessions WHERE id=p_session_id AND owner_id=uid FOR UPDATE;
  IF FOUND THEN RETURN jsonb_build_object('session',to_jsonb(s),'reused',true);END IF;
  SELECT * INTO s FROM public.trading_sessions WHERE owner_id=uid AND status='open' ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN RETURN jsonb_build_object('session',to_jsonb(s),'reused',true);END IF;
 ELSE
  SELECT * INTO s FROM public.trading_sessions WHERE id=p_session_id AND owner_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session unavailable';END IF;
 END IF;
 IF p_action IN('start','accounts') THEN
  IF jsonb_typeof(p_payload->'selected_accounts') IS DISTINCT FROM 'array' OR jsonb_array_length(p_payload->'selected_accounts') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Select accounts';END IF;
  FOR row IN SELECT value FROM jsonb_array_elements(p_payload->'selected_accounts') LOOP
   SELECT * INTO a FROM public.trading_accounts WHERE id=(row->>'account_id')::uuid AND owner_id=uid;
   IF NOT FOUND OR NOT a.active OR coalesce(row->>'instrument','') NOT IN('NQ','MNQ','ES','MES') OR coalesce(row->>'planned_quantity','') !~ '^[1-9][0-9]*$' OR (row->>'planned_quantity')::numeric>100000 OR coalesce(row->>'initial_sl_ticks','') !~ '^[1-9][0-9]*$' OR (row->>'initial_sl_ticks')::numeric>100000 THEN RAISE EXCEPTION 'Invalid own account standards';END IF;
  END LOOP;
  IF (SELECT count(DISTINCT value->>'account_id') FROM jsonb_array_elements(p_payload->'selected_accounts'))<>jsonb_array_length(p_payload->'selected_accounts') THEN RAISE EXCEPTION 'Duplicate account';END IF;
  IF p_action='start' THEN
   INSERT INTO public.trading_sessions(id,owner_id,session_date,status,htf_context) VALUES(p_session_id,uid,(clock_timestamp() AT TIME ZONE 'Europe/Berlin')::date,'open',jsonb_build_object('selected_accounts',p_payload->'selected_accounts')) RETURNING * INTO s;
  ELSE
   IF s.status<>'open' THEN RAISE EXCEPTION 'Session closed';END IF;
   IF s.htf_context->'selected_accounts'=p_payload->'selected_accounts' THEN RETURN jsonb_build_object('session',to_jsonb(s));END IF;
   IF s.htf_context IS DISTINCT FROM p_expected_context THEN RAISE EXCEPTION 'Session changed on another device; reload';END IF;
   UPDATE public.trading_sessions SET htf_context=htf_context||jsonb_build_object('selected_accounts',p_payload->'selected_accounts') WHERE id=s.id RETURNING * INTO s;
  END IF;RETURN jsonb_build_object('session',to_jsonb(s));
 END IF;
 missing:=public.session_missing_v810(s.htf_context);
 SELECT count(*) INTO n FROM public.trades WHERE session_id=s.id AND owner_id=uid AND exit_at IS NULL;
 SELECT count(*) INTO breaches FROM public.trades WHERE session_id=s.id AND owner_id=uid AND rule_deviation;
 IF p_action='preview' THEN RETURN jsonb_build_object('session',to_jsonb(s),'missing',missing,'open_trades',n,'rule_breaches',breaches);END IF;
 IF p_action='confirm' THEN
  IF s.status<>'open' THEN RAISE EXCEPTION 'Session closed';END IF;
  SELECT * INTO e FROM public.session_events_v810 WHERE session_id=s.id AND kind='confirmed' AND event_key=p_request_id::text;
  IF FOUND THEN
   IF e.payload->'request' IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'Confirmation request changed';END IF;
   RETURN jsonb_build_object('session',to_jsonb(s));END IF;
  -- A concurrent device may have confirmed the exact form; do not create a second assessment or restart time.
  IF s.htf_context IS DISTINCT FROM p_expected_context THEN RAISE EXCEPTION 'Preparation changed on another device; reload';END IF;
  plan:=p_payload->'plan';goal:=plan->'personal_plan';
  legacy_start:=s.htf_context#>>'{htf_v8,plan,personal_plan,started_at}';
  stamp:=CASE WHEN legacy_start IS NOT NULL THEN legacy_start::timestamptz ELSE clock_timestamp() END;
  duration:=(goal->>'duration_minutes')::integer;
  IF legacy_start IS NOT NULL THEN goal:=s.htf_context#>'{htf_v8,plan,personal_plan}';ELSE goal:=goal||jsonb_build_object('started_at',stamp,'end_at',stamp+make_interval(mins=>duration));END IF;
  plan:=jsonb_set(plan,'{personal_plan}',goal);
  result:=public.save_htf_assessment_v808(p_request_id,s.id,p_expected_context,plan,p_payload->'context');
  INSERT INTO public.session_events_v810(owner_id,session_id,kind,event_key,payload) VALUES(uid,s.id,'confirmed',p_request_id::text,jsonb_build_object('request',p_payload,'first_started_at',stamp));
  SELECT * INTO s FROM public.trading_sessions WHERE id=s.id;
  RETURN jsonb_build_object('session',to_jsonb(s));
 END IF;
 v_kind:=CASE p_action WHEN 'close' THEN 'closed' WHEN 'ack' THEN 'warning_ack' ELSE 'supplement' END;
 v_key:=CASE p_action WHEN 'close' THEN 'closed' WHEN 'ack' THEN p_payload->>'event_key' ELSE p_request_id::text END;
 IF v_key IS NULL OR length(v_key) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'Invalid event identity';END IF;
 SELECT * INTO e FROM public.session_events_v810 WHERE session_id=s.id AND kind=v_kind AND event_key=v_key; -- qualified below to avoid PL/pgSQL variable ambiguity
 IF FOUND THEN
  IF p_action<>'close' AND e.payload IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'Request payload changed';END IF;
  RETURN jsonb_build_object('session',to_jsonb(s),'event',to_jsonb(e));END IF;
 IF p_action='close' THEN
  IF s.status<>'open' THEN RETURN jsonb_build_object('session',to_jsonb(s));END IF;
  stamp:=clock_timestamp();
  INSERT INTO public.session_events_v810(owner_id,session_id,kind,event_key,payload,created_at) VALUES(uid,s.id,'closed','closed',jsonb_build_object('missing',missing,'rule_breach',jsonb_array_length(missing)>0,'open_trades',n,'rule_breaches',breaches),stamp);
  UPDATE public.trading_sessions SET status='closed',closed_at=stamp WHERE id=s.id RETURNING * INTO s;
 ELSE
  IF p_action='supplement' AND (s.status<>'closed' OR length(btrim(coalesce(p_payload->>'note',''))) NOT BETWEEN 1 AND 3000) THEN RAISE EXCEPTION 'Closed session and actual supplementary information required';END IF;
  INSERT INTO public.session_events_v810(owner_id,session_id,kind,event_key,payload) VALUES(uid,s.id,v_kind,v_key,p_payload) RETURNING * INTO e;
 END IF;
 RETURN jsonb_build_object('session',to_jsonb(s),'event',to_jsonb(e));
END $$;
REVOKE ALL ON FUNCTION public.session_action_v810(uuid,uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.session_action_v810(uuid,uuid,text,jsonb,jsonb) TO authenticated;
-- Documentation is never blocked by incomplete preparation or reached time/money limits.
-- This wrapper annotates the actual entry after the established idempotent V736 writer.
CREATE FUNCTION public.record_trade_attempt_v810(
 p_session_id uuid,p_setup_type text,p_instrument text,p_direction text,p_allocations jsonb,p_entry_emotion text,p_client_request_id uuid,
 p_limit_reason text DEFAULT NULL,p_idea_id uuid DEFAULT NULL,p_warning_answers jsonb DEFAULT NULL,p_entry_context jsonb DEFAULT '{}',p_new_idea jsonb DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t uuid;s public.trading_sessions;goal jsonb;issues jsonb:='[]';r record;net numeric;complete boolean;retrospective boolean:=coalesce(p_entry_context->>'documented_after_execution','false')='true';classification text;
BEGIN
 SELECT * INTO s FROM public.trading_sessions WHERE id=p_session_id AND owner_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Session unavailable';END IF;
 t:=public.record_trade_attempt_v736(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion,p_client_request_id,p_limit_reason,p_idea_id,p_warning_answers,p_entry_context,p_new_idea);
 SELECT * INTO s FROM public.trading_sessions WHERE id=p_session_id AND owner_id=auth.uid() FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.trades WHERE id=t AND observations?'session_rules_v810') THEN RETURN t;END IF;
 IF jsonb_array_length(public.session_missing_v810(s.htf_context))>0 THEN issues:=issues||jsonb_build_array(jsonb_build_object('type','preparation_missing','classification','rule_breach'));END IF;
 classification:=CASE WHEN retrospective OR nullif(btrim(p_limit_reason),'') IS NOT NULL THEN 'review_required' ELSE 'rule_breach' END;
 goal:=s.htf_context#>'{htf_v8,plan,personal_plan}';
 IF goal->>'end_at' IS NOT NULL AND clock_timestamp()>=(goal->>'end_at')::timestamptz THEN issues:=issues||jsonb_build_array(jsonb_build_object('type','time_limit','classification',classification,'planned_end',goal->>'end_at'));END IF;
 IF goal->>'loss_limit' IS NOT NULL THEN
  FOR r IN SELECT DISTINCT CASE WHEN goal->>'scope'='per_account' THEN a.account_id ELSE NULL::uuid END AS account_id FROM public.trade_account_allocations a JOIN public.trades x ON x.id=a.trade_id WHERE x.session_id=s.id AND x.owner_id=auth.uid() AND x.exit_at IS NOT NULL LOOP
   SELECT coalesce(sum(ar.realized_pnl_usd-ar.fees_usd),0),count(*)>0 AND bool_and(ar.id IS NOT NULL AND ar.result_status='final' AND ar.realized_pnl_usd IS NOT NULL AND ar.fees_usd IS NOT NULL) INTO net,complete FROM public.trades x LEFT JOIN public.trade_account_allocations a ON a.trade_id=x.id LEFT JOIN public.account_trade_results ar ON ar.allocation_id=a.id WHERE x.session_id=s.id AND x.owner_id=auth.uid() AND x.exit_at IS NOT NULL AND (r.account_id IS NULL OR a.account_id=r.account_id);
   IF complete AND net<=-(goal->>'loss_limit')::numeric THEN issues:=issues||jsonb_build_array(jsonb_build_object('type','loss_limit','classification',classification,'account_id',r.account_id,'net',net));END IF;
  END LOOP;
 END IF;
 UPDATE public.trades SET observations=observations||jsonb_build_object('session_rules_v810',jsonb_build_object('checked_at',clock_timestamp(),'issues',issues,'reason',p_limit_reason,'retrospective',retrospective)),rule_deviation=rule_deviation OR EXISTS(SELECT 1 FROM jsonb_array_elements(issues) i WHERE i->>'classification'='rule_breach') WHERE id=t AND owner_id=auth.uid();
 RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.record_trade_attempt_v810(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v810(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) TO authenticated;
CREATE FUNCTION public.guard_session_entry_evidence_v810() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item jsonb;idx integer:=0;source text;decision text;
BEGIN
 IF OLD.observations?'session_rules_v810' AND NEW.observations->'session_rules_v810' IS DISTINCT FROM OLD.observations->'session_rules_v810' THEN RAISE EXCEPTION 'Original session rule evidence is immutable';END IF;
 IF NEW.observations->>'compliance_reviewed'='true' THEN
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(NEW.observations#>'{session_rules_v810,issues}','[]')) LOOP
   source:='session-rule-'||idx;idx:=idx+1;decision:=NEW.observations#>>ARRAY['exception_reviews',source];
   IF item->>'classification'='review_required' AND coalesce(decision,'') NOT IN('accepted','breach') THEN RAISE EXCEPTION 'Session boundary exception must be reviewed';END IF;
   IF item->>'classification'='rule_breach' OR decision='breach' THEN
    IF NOT NEW.rule_deviation OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.observations->'review_errors','[]')) e WHERE e->>'source_id'=source AND e->>'confirmed_breach'='true' AND length(btrim(coalesce(e->>'countermeasure','')))>0) THEN RAISE EXCEPTION 'Session breach needs an error and concrete countermeasure';END IF;
   END IF;
  END LOOP;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_session_entry_evidence_v810() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_session_entry_evidence_v810 BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_session_entry_evidence_v810();
