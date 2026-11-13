-- V7.40: existing ideas gain immutable target and explicit retrospective evaluation.
ALTER TABLE public.trade_ideas_v733 ADD COLUMN target_zone text, ADD COLUMN target_recorded_at timestamptz,
 ADD COLUMN learning_review jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN learning_reviewed_at timestamptz,
 ADD COLUMN learning_revision bigint NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.guard_idea_learning_v740() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r jsonb:=new.learning_review; v text;
BEGIN
 IF TG_OP='INSERT' THEN
  new.target_zone:=nullif(btrim(new.target_zone),'');
  new.target_recorded_at:=case when new.target_zone is not null then transaction_timestamp() else null end;
  new.learning_revision:=0;new.learning_reviewed_at:=null;
  IF r<>'{}'::jsonb THEN RAISE EXCEPTION 'Idee zuerst mit ihrem Plan anlegen';END IF;
 ELSE
  IF (new.target_zone,new.target_recorded_at) IS DISTINCT FROM (old.target_zone,old.target_recorded_at) THEN RAISE EXCEPTION 'Ursprünglicher Zielbereich ist unveränderlich';END IF;
  new.learning_revision:=old.learning_revision;new.learning_reviewed_at:=old.learning_reviewed_at;
 END IF;
 IF new.target_zone IS NOT NULL AND length(new.target_zone) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Zielbereich: maximal 1000 Zeichen';END IF;
 IF jsonb_typeof(r) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Ungültiges Ideen-Review';END IF;
 IF r='{}'::jsonb THEN RETURN new;END IF;
 IF new.status='active' THEN RAISE EXCEPTION 'Bewertete Idee abschließen oder invalidieren';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(r) k WHERE k NOT IN ('outcome','participation','reasons','note','trigger_followed','risk_followed')) THEN RAISE EXCEPTION 'Unbekanntes Review-Feld';END IF;
 IF coalesce(r->>'outcome','') NOT IN ('confirmed','partial','invalidated','unclear') OR coalesce(r->>'participation','') NOT IN ('none','stopped','early_exit','captured','unclear') THEN RAISE EXCEPTION 'Ideenverlauf und Teilnahme bewerten';END IF;
 IF (r->>'outcome')='confirmed' AND new.target_zone IS NULL THEN RAISE EXCEPTION 'Ohne vorher dokumentiertes Ziel nur teilweise/nicht beurteilbar wählen';END IF;
 IF jsonb_typeof(r->'reasons') IS DISTINCT FROM 'array' OR jsonb_array_length(r->'reasons')>6 THEN RAISE EXCEPTION 'Ungültige Gründe';END IF;
 FOR v IN SELECT jsonb_array_elements_text(r->'reasons') LOOP
  IF v NOT IN ('early_entry','late_entry','missed_trigger','stopped','uncertainty','other') THEN RAISE EXCEPTION 'Unbekannter Grund';END IF;
 END LOOP;
 IF (SELECT count(*) FROM jsonb_array_elements(r->'reasons'))<>(SELECT count(DISTINCT x) FROM jsonb_array_elements(r->'reasons') x) THEN RAISE EXCEPTION 'Grund doppelt';END IF;
 IF r->>'outcome'='confirmed' AND r->>'participation' NOT IN ('captured','unclear') AND jsonb_array_length(r->'reasons')=0 THEN RAISE EXCEPTION 'Grund der verpassten Teilnahme ergänzen';END IF;
 IF jsonb_typeof(r->'note') IS DISTINCT FROM 'string' OR length(btrim(r->>'note')) NOT BETWEEN 10 AND 1500 THEN RAISE EXCEPTION 'Verlauf/Beleg kurz beschreiben (10–1500 Zeichen)';END IF;
 IF coalesce(r->>'trigger_followed','') NOT IN ('yes','no','unclear','na') OR coalesce(r->>'risk_followed','') NOT IN ('yes','no','unclear','na') THEN RAISE EXCEPTION 'Trigger und Anfangsrisiko prüfen';END IF;
 IF EXISTS(SELECT 1 FROM public.trade_attempts_v733 a JOIN public.trades t ON t.id=a.trade_id WHERE a.idea_id=new.id AND t.exit_at IS NULL) THEN RAISE EXCEPTION 'Zugehörige Trades zuerst schließen';END IF;
 IF EXISTS(SELECT 1 FROM public.trade_attempts_v733 a WHERE a.idea_id=new.id) AND (r->>'trigger_followed'='na' OR r->>'risk_followed'='na') THEN RAISE EXCEPTION 'Bei ausgeführten Versuchen Trigger und Risiko bewerten';END IF;
 IF TG_OP='UPDATE' AND r IS DISTINCT FROM old.learning_review THEN new.learning_revision:=old.learning_revision+1;new.learning_reviewed_at:=clock_timestamp();END IF;
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION public.guard_idea_learning_v740() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_idea_learning_v740 BEFORE INSERT OR UPDATE ON public.trade_ideas_v733 FOR EACH ROW EXECUTE FUNCTION public.guard_idea_learning_v740();
CREATE OR REPLACE FUNCTION public.record_trade_attempt_v736(
 p_session_id uuid,p_setup_type text,p_instrument text,p_direction text,p_allocations jsonb,p_entry_emotion text,p_client_request_id uuid,
 p_limit_reason text DEFAULT NULL,p_idea_id uuid DEFAULT NULL,p_warning_answers jsonb DEFAULT NULL,
 p_entry_context jsonb DEFAULT '{}'::jsonb,p_new_idea jsonb DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_session public.trading_sessions;v_idea public.trade_ideas_v733;v_idea_id uuid:=p_idea_id;v_trade uuid;v_old jsonb;v_item jsonb;v_n int;
BEGIN
 IF v_uid IS NULL OR p_client_request_id IS NULL THEN RAISE EXCEPTION 'Authentication and request ID required';END IF;
 IF jsonb_typeof(p_entry_context) IS DISTINCT FROM 'object' OR coalesce(p_entry_context->>'execution_mode','') NOT IN ('independent','copy') OR NOT public.valid_emotion_scales_v736(p_entry_context->'emotion_scales') THEN RAISE EXCEPTION 'Invalid entry context';END IF;
 SELECT * INTO v_session FROM public.trading_sessions WHERE id=p_session_id AND owner_id=v_uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session unavailable';END IF;
 IF jsonb_typeof(p_allocations) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Accounts required';END IF;
 v_n:=jsonb_array_length(p_allocations);
 IF (p_entry_context->>'execution_mode'='independent' AND v_n<>1) OR (p_entry_context->>'execution_mode'='copy' AND v_n<2) THEN RAISE EXCEPTION 'Independent trade needs one account; copy trade needs at least two';END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_allocations) LOOP
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(v_session.htf_context->'selected_accounts','[]')) a WHERE a->>'account_id'=v_item->>'account_id') THEN RAISE EXCEPTION 'Account not available in this session';END IF;
 END LOOP;
 -- The complete V7.36 request is serialized per owner/request; V7.35 also enforces its payload hash.
 PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text||p_client_request_id::text,736));
 IF p_new_idea IS NOT NULL AND p_new_idea<>'null'::jsonb THEN
 IF p_idea_id IS NOT NULL OR jsonb_typeof(p_new_idea)<>'object' OR length(btrim(coalesce(p_new_idea->>'thesis',''))) NOT BETWEEN 1 AND 2000 OR length(btrim(coalesce(p_new_idea->>'trigger_condition',''))) NOT BETWEEN 1 AND 1000 OR length(btrim(coalesce(p_new_idea->>'invalidation',''))) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Complete new idea required';END IF;
 v_idea_id:=p_client_request_id;
 SELECT * INTO v_idea FROM public.trade_ideas_v733 WHERE id=v_idea_id AND owner_id=v_uid;
 IF FOUND THEN
 IF (v_idea.session_id,v_idea.setup_type,v_idea.instrument,v_idea.direction,v_idea.thesis,v_idea.trigger_condition,v_idea.invalidation,v_idea.target_zone) IS DISTINCT FROM (p_session_id,p_setup_type,p_instrument,p_direction,btrim(p_new_idea->>'thesis'),btrim(p_new_idea->>'trigger_condition'),btrim(p_new_idea->>'invalidation'),nullif(btrim(p_new_idea->>'target_zone'),'')) THEN RAISE EXCEPTION 'Request ID already used with a different idea';END IF;
 ELSE
 INSERT INTO public.trade_ideas_v733(id,owner_id,session_id,setup_type,instrument,direction,thesis,trigger_condition,invalidation,target_zone)
 VALUES(v_idea_id,v_uid,p_session_id,p_setup_type,p_instrument,p_direction,btrim(p_new_idea->>'thesis'),btrim(p_new_idea->>'trigger_condition'),btrim(p_new_idea->>'invalidation'),nullif(btrim(p_new_idea->>'target_zone'),''));
 END IF;
 END IF;
 v_trade:=public.record_trade_attempt_v735(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion,p_client_request_id,p_limit_reason,v_idea_id,p_warning_answers);
 SELECT observations->'entry_context_v736' INTO v_old FROM public.trades WHERE id=v_trade AND owner_id=v_uid;
 IF v_old IS NOT NULL AND v_old IS DISTINCT FROM p_entry_context THEN RAISE EXCEPTION 'Request ID already used with different entry ratings or execution mode';END IF;
 UPDATE public.trades SET observations=observations||jsonb_build_object('entry_context_v736',p_entry_context) WHERE id=v_trade AND owner_id=v_uid AND v_old IS NULL;
 RETURN v_trade;
END $$;
REVOKE ALL ON FUNCTION public.record_trade_attempt_v736(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v736(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) TO authenticated;

