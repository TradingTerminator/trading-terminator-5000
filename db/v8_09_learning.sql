-- V8.09 additive metadata and owner-checked learning APIs. No historical rows are rewritten.
CREATE FUNCTION public.valid_setup_media_v809(v jsonb,uid uuid) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE r record;c jsonb;k text;
BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR pg_column_size(v)>65536 THEN RETURN false;END IF;
 FOR k IN SELECT jsonb_object_keys(v) LOOP IF k NOT IN('pattern','examples') THEN RETURN false;END IF;END LOOP;
 IF v?'pattern' THEN
 c:=v->'pattern';IF jsonb_typeof(c) IS DISTINCT FROM 'object' THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['scale','x','y'] LOOP IF jsonb_typeof(c->k) IS DISTINCT FROM 'number' THEN RETURN false;END IF;END LOOP;
 IF (c->>'scale')::numeric NOT BETWEEN 1 AND 3 OR (c->>'x')::numeric NOT BETWEEN 0 AND 100 OR (c->>'y')::numeric NOT BETWEEN 0 AND 100 THEN RETURN false;END IF;END IF;
 IF v?'examples' THEN
 IF jsonb_typeof(v->'examples') IS DISTINCT FROM 'object' THEN RETURN false;END IF;
 FOR r IN SELECT * FROM jsonb_each(v->'examples') LOOP
 c:=r.value;IF r.key !~ '^[0-9a-fA-F-]{36}$' OR jsonb_typeof(c) IS DISTINCT FROM 'object' OR coalesce(c->>'path','') NOT LIKE uid::text||'/trade/'||r.key||'/%' OR length(c->>'path')>500 THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['scale','x','y'] LOOP IF jsonb_typeof(c->k) IS DISTINCT FROM 'number' THEN RETURN false;END IF;END LOOP;
 IF (c->>'scale')::numeric NOT BETWEEN 1 AND 3 OR (c->>'x')::numeric NOT BETWEEN 0 AND 100 OR (c->>'y')::numeric NOT BETWEEN 0 AND 100 THEN RETURN false;END IF;
 END LOOP;END IF;RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.valid_setup_media_v809(jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.valid_setup_media_v809(jsonb,uuid) TO authenticated;
ALTER TABLE public.trading_setup_catalog ADD COLUMN media_views jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.trading_setup_catalog ADD CONSTRAINT setup_media_v809 CHECK(public.valid_setup_media_v809(media_views,owner_id));
ALTER TABLE public.v8_htf_preferences ADD COLUMN scenarios jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(scenarios)='array' AND jsonb_array_length(scenarios)<=30 AND pg_column_size(scenarios)<=20000);
CREATE FUNCTION public.review_htf_assessment_v809(p_id uuid,p_expected_reviewed_at timestamptz,p_result text,p_learning text,p_playbook boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();r public.v8_htf_assessments;b jsonb;e record;states text[]:='{}';derived text;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required';END IF;
 SELECT * INTO r FROM public.v8_htf_assessments WHERE id=p_id AND owner_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'HTF-Einschätzung nicht verfügbar';END IF;
 IF r.reviewed_at IS DISTINCT FROM p_expected_reviewed_at THEN
 IF r.result IS NOT DISTINCT FROM p_result AND r.learning IS NOT DISTINCT FROM p_learning AND r.playbook IS NOT DISTINCT FROM p_playbook THEN RETURN to_jsonb(r);END IF;
 RAISE EXCEPTION 'Learning inzwischen geändert. Neu laden; Entwurf vergleichen.';END IF;
 IF left(coalesce(p_learning,''),7)<>'@TT809:' THEN RAISE EXCEPTION 'Structured V809 learning required';END IF;
 b:=substring(p_learning from 8)::jsonb;
 IF jsonb_typeof(b) IS DISTINCT FROM 'object' OR jsonb_typeof(b->'points') IS DISTINCT FROM 'object' OR jsonb_typeof(b->'actual') IS DISTINCT FROM 'object' OR length(btrim(coalesce(b->>'note',''))) NOT BETWEEN 1 AND 600 OR length(coalesce(b->>'training_rule',''))>500 THEN RAISE EXCEPTION 'Invalid core learning';END IF;
 FOR e IN SELECT * FROM jsonb_each_text(b->'points') LOOP
 IF e.key NOT IN('macro','sentiment','technical','scenario') OR e.value NOT IN('confirmed','partial','invalidated','unclear') THEN RAISE EXCEPTION 'Invalid core rating';END IF;
 IF (e.key='macro' AND coalesce(r.plan->>'macro_direction','') IN('','unclear')) OR (e.key='sentiment' AND coalesce(r.plan->>'sentiment','') IN('','unclear')) OR (e.key='technical' AND coalesce(r.plan->>'direction','') IN('','unclear')) OR (e.key='scenario' AND btrim(coalesce(r.plan->>'scenario_note',r.plan->'scenario'->>'when',''))='') THEN RAISE EXCEPTION 'No original thesis for rating';END IF;
 IF e.key='scenario' AND coalesce(b->>'condition','')<>'yes' AND e.value<>'unclear' THEN RAISE EXCEPTION 'Condition did not occur or is unknown';END IF;
 IF e.value<>'unclear' THEN
 IF length(btrim(coalesce(b->'actual'->>e.key,'')))=0 THEN RAISE EXCEPTION 'Actual observation required';END IF;
 states:=array_append(states,e.value);END IF;
 END LOOP;
 derived:=CASE WHEN cardinality(states)=0 THEN 'unclear' WHEN 'confirmed'=ALL(states) THEN 'confirmed' WHEN 'invalidated'=ALL(states) THEN 'invalidated' ELSE 'partial' END;
 IF p_result IS DISTINCT FROM derived THEN RAISE EXCEPTION 'Overall result does not match core ratings';END IF;
 RETURN public.review_htf_assessment_v803(p_id,p_result,p_learning,p_playbook);
END $$;
REVOKE ALL ON FUNCTION public.review_htf_assessment_v809(uuid,timestamptz,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_htf_assessment_v809(uuid,timestamptz,text,text,boolean) TO authenticated;
ALTER TABLE public.training_goals_v7 ADD COLUMN source_htf_id uuid REFERENCES public.v8_htf_assessments(id) ON DELETE SET NULL;
CREATE FUNCTION public.set_htf_training_focus_v809(p_request_id uuid,p_expected_id uuid,p_htf_id uuid,p_rule text) RETURNS public.training_goals_v7 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();h public.v8_htf_assessments;g public.training_goals_v7;b jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required';END IF;
 SELECT * INTO h FROM public.v8_htf_assessments WHERE id=p_htf_id AND owner_id=uid AND reviewed_at IS NOT NULL;
 IF NOT FOUND OR left(coalesce(h.learning,''),7)<>'@TT809:' THEN RAISE EXCEPTION 'Saved structured HTF learning required';END IF;
 b:=substring(h.learning from 8)::jsonb;
 IF btrim(coalesce(b->>'training_rule','')) IS DISTINCT FROM btrim(p_rule) OR length(btrim(coalesce(p_rule,''))) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'Save concrete HTF training rule first';END IF;
 g:=public.set_training_focus_v735(p_request_id,p_rule,p_expected_id,NULL,NULL);
 IF g.source_htf_id IS NOT NULL AND g.source_htf_id<>p_htf_id THEN RAISE EXCEPTION 'Training source identity conflict';END IF;
 UPDATE public.training_goals_v7 SET source_htf_id=p_htf_id WHERE id=g.id AND owner_id=uid RETURNING * INTO g;RETURN g;
END $$;
REVOKE ALL ON FUNCTION public.set_htf_training_focus_v809(uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_htf_training_focus_v809(uuid,uuid,uuid,text) TO authenticated;
CREATE FUNCTION public.validate_htf_training_source_v809() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.revised_from_id IS NOT NULL AND NEW.source_htf_id IS NULL THEN SELECT source_htf_id INTO NEW.source_htf_id FROM public.training_goals_v7 WHERE id=NEW.revised_from_id AND owner_id=NEW.owner_id;END IF;
 IF NEW.source_htf_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.v8_htf_assessments WHERE id=NEW.source_htf_id AND owner_id=NEW.owner_id AND reviewed_at IS NOT NULL) THEN RAISE EXCEPTION 'Training source must belong to same owner';END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_htf_training_source_v809() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_htf_training_source_v809 BEFORE INSERT OR UPDATE OF source_htf_id,owner_id ON public.training_goals_v7 FOR EACH ROW EXECUTE FUNCTION public.validate_htf_training_source_v809();
CREATE FUNCTION public.capture_htf_training_source_v809() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE h uuid;
BEGIN
 SELECT source_htf_id INTO h FROM public.training_goals_v7 WHERE id=(NEW.observations->'training_focus'->>'goal_id')::uuid AND owner_id=NEW.owner_id;
 IF h IS NOT NULL THEN NEW.observations:=jsonb_set(NEW.observations,'{training_focus}',NEW.observations->'training_focus'||jsonb_build_object('source_htf_id',h));END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_htf_training_source_v809() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_z_htf_training_v809 BEFORE INSERT ON public.trades FOR EACH ROW EXECUTE FUNCTION public.capture_htf_training_source_v809();
CREATE FUNCTION public.close_historical_trade_v809(p_trade_id uuid,p_exit_reason text,p_results jsonb,p_note text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();t public.trades;r jsonb;stamp timestamptz;e jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required';END IF;
 SELECT * INTO t FROM public.trades WHERE id=p_trade_id AND owner_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Trade not available';END IF;
 IF (t.entry_at AT TIME ZONE 'Europe/Berlin')::date=(clock_timestamp() AT TIME ZONE 'Europe/Berlin')::date AND coalesce(t.observations#>>'{entry_context_v736,documented_after_execution}','false')<>'true' THEN RAISE EXCEPTION 'Historical or explicitly retrospective trade required';END IF;
 IF length(btrim(coalesce(p_note,''))) NOT BETWEEN 3 AND 500 OR p_exit_reason IS NULL OR p_exit_reason NOT IN('TP','SL','BE','extended_tp','daily_target','manual','other') THEN RAISE EXCEPTION 'Exit reason and explanation required';END IF;
 IF t.exit_at IS NOT NULL THEN
 IF t.observations->>'historical_exit_note'=btrim(p_note) AND t.exit_reason=p_exit_reason AND ((p_results IS NULL AND t.observations->>'results_pending_v808'='true') OR t.observations->'historical_exit_results'=p_results) THEN RETURN jsonb_build_object('trade_id',t.id,'exit_at',t.exit_at,'pending',p_results IS NULL);END IF;
 RAISE EXCEPTION 'Trade already closed';END IF;
 IF t.observations?'exit_emotion_scales' THEN RAISE EXCEPTION 'Existing feelings must not be discarded';END IF;
 IF p_results IS NOT NULL THEN
 IF jsonb_typeof(p_results) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Results must be an array';END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(p_results) LOOP IF jsonb_typeof(e->'fees_usd') IS DISTINCT FROM 'number' OR (e->>'fees_usd')::numeric<0 THEN RAISE EXCEPTION 'Explicit fees required';END IF;END LOOP;
 r:=public.close_trade_with_account_results(p_trade_id,p_exit_reason,p_results);
 ELSE
 IF EXISTS(SELECT 1 FROM public.account_trade_results r JOIN public.trade_account_allocations a ON a.id=r.allocation_id WHERE a.trade_id=t.id) THEN RAISE EXCEPTION 'Account results already exist';END IF;
 stamp:=greatest(clock_timestamp(),t.entry_at);
 UPDATE public.trades SET exit_at=stamp,exit_reason=p_exit_reason,realized_pnl_usd=NULL,observations=observations||jsonb_build_object('results_pending_v808',true),updated_at=stamp WHERE id=t.id AND owner_id=uid;
 r:=jsonb_build_object('trade_id',t.id,'exit_at',stamp,'pending',true);
 END IF;
 UPDATE public.trades SET observations=observations||jsonb_build_object('historical_exit_note',btrim(p_note),'exit_emotions_unknown',true,'historical_exit_results',p_results) WHERE id=t.id AND owner_id=uid;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.close_historical_trade_v809(uuid,text,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.close_historical_trade_v809(uuid,text,jsonb,text) TO authenticated;
