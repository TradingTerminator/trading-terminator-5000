-- Additive V7.36 API. Existing entry and exit APIs remain compatible during rollout.
CREATE OR REPLACE FUNCTION public.valid_emotion_scales_v736(p_scales jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN jsonb_typeof(p_scales) IS DISTINCT FROM 'object' THEN false ELSE
 NOT EXISTS(SELECT 1 FROM jsonb_each(p_scales) x WHERE x.key NOT IN ('focus','pressure','fatigue','urge','fomo','revenge','fear','greed','uncertain','stress','frustration','relief') OR jsonb_typeof(x.value)<>'number' OR x.value::text !~ '^(10|[1-9])$') END
$$;
REVOKE ALL ON FUNCTION public.valid_emotion_scales_v736(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.valid_emotion_scales_v736(jsonb) TO authenticated;

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
 IF (v_idea.session_id,v_idea.setup_type,v_idea.instrument,v_idea.direction,v_idea.thesis,v_idea.trigger_condition,v_idea.invalidation) IS DISTINCT FROM (p_session_id,p_setup_type,p_instrument,p_direction,btrim(p_new_idea->>'thesis'),btrim(p_new_idea->>'trigger_condition'),btrim(p_new_idea->>'invalidation')) THEN RAISE EXCEPTION 'Request ID already used with a different idea';END IF;
 ELSE
 INSERT INTO public.trade_ideas_v733(id,owner_id,session_id,setup_type,instrument,direction,thesis,trigger_condition,invalidation)
 VALUES(v_idea_id,v_uid,p_session_id,p_setup_type,p_instrument,p_direction,btrim(p_new_idea->>'thesis'),btrim(p_new_idea->>'trigger_condition'),btrim(p_new_idea->>'invalidation'));
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

CREATE OR REPLACE FUNCTION public.close_trade_with_scales_v736(p_trade_id uuid,p_exit_reason text,p_results jsonb,p_scales jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_result jsonb;v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL OR NOT public.valid_emotion_scales_v736(p_scales) OR p_scales='{}'::jsonb THEN RAISE EXCEPTION 'Rate at least one feeling from 1 to 10';END IF;
 v_result:=public.close_trade_with_account_results(p_trade_id,p_exit_reason,p_results);
 UPDATE public.trades SET observations=observations||jsonb_build_object('exit_emotion_scales',p_scales,'exit_emotion_scales_at',clock_timestamp()) WHERE id=p_trade_id AND owner_id=v_uid;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.close_trade_with_scales_v736(uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.close_trade_with_scales_v736(uuid,text,jsonb,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_scales_v736() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.observations ? 'entry_context_v736' AND NEW.observations->'entry_context_v736' IS DISTINCT FROM OLD.observations->'entry_context_v736' THEN RAISE EXCEPTION 'Entry mode and ratings are immutable';END IF;
 IF OLD.observations ? 'exit_emotion_scales' AND NEW.observations->'exit_emotion_scales' IS DISTINCT FROM OLD.observations->'exit_emotion_scales' THEN RAISE EXCEPTION 'Exit ratings are immutable';END IF;
 IF NEW.observations ? 'during_emotion_scales' AND NOT public.valid_emotion_scales_v736(NEW.observations->'during_emotion_scales') THEN RAISE EXCEPTION 'Invalid emotion ratings';END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_scales_v736() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_scales_v736 BEFORE UPDATE OF observations ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_scales_v736();
