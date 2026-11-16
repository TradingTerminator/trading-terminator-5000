CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
CREATE TABLE public.trading_setup_catalog(id uuid PRIMARY KEY,owner_id uuid NOT NULL);
CREATE TABLE public.v8_htf_preferences(owner_id uuid PRIMARY KEY,technical_points jsonb NOT NULL);
CREATE TABLE public.v8_htf_assessments(id uuid PRIMARY KEY,owner_id uuid NOT NULL,session_id uuid,captured_at timestamptz NOT NULL DEFAULT now(),plan jsonb NOT NULL,reviewed_at timestamptz,result text,learning text,playbook boolean NOT NULL DEFAULT false);
ALTER TABLE public.v8_htf_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_htf ON public.v8_htf_assessments FOR SELECT TO authenticated USING(owner_id=auth.uid());
GRANT SELECT ON public.v8_htf_assessments TO authenticated;
CREATE TABLE public.training_goals_v7(id uuid PRIMARY KEY,owner_id uuid NOT NULL,goal text,status text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),source_trade_id uuid,source_error_id text,error_type text,revised_from_id uuid);
ALTER TABLE public.training_goals_v7 ENABLE ROW LEVEL SECURITY;CREATE POLICY own_goals ON public.training_goals_v7 FOR ALL TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());GRANT SELECT,INSERT,UPDATE ON public.training_goals_v7 TO authenticated;
CREATE TABLE public.trades(id uuid PRIMARY KEY,owner_id uuid NOT NULL,entry_at timestamptz DEFAULT now(),exit_at timestamptz,exit_reason text,realized_pnl_usd numeric,initial_risk_usd numeric,updated_at timestamptz,observations jsonb NOT NULL DEFAULT '{}');
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;CREATE POLICY own_trades ON public.trades FOR ALL TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());GRANT SELECT,INSERT,UPDATE ON public.trades TO authenticated;
CREATE TABLE public.trade_account_allocations(id uuid PRIMARY KEY,trade_id uuid,owner_id uuid);
CREATE TABLE public.account_trade_results(id uuid PRIMARY KEY,allocation_id uuid,owner_id uuid);
GRANT SELECT ON public.trade_account_allocations,public.account_trade_results TO authenticated;
CREATE FUNCTION public.review_htf_assessment_v803(p_id uuid,p_result text,p_learning text,p_playbook boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_owner uuid:=auth.uid(); v_row public.v8_htf_assessments;
BEGIN
 IF v_owner IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO v_row FROM public.v8_htf_assessments WHERE id=p_id AND owner_id=v_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'HTF-Einschätzung nicht verfügbar'; END IF;
 IF clock_timestamp()<v_row.captured_at+interval '2 hours' THEN RAISE EXCEPTION 'HTF-Bewertung erst ab %',v_row.captured_at+interval '2 hours'; END IF;
 IF p_result IS NULL OR p_result NOT IN ('confirmed','partial','invalidated','unclear') OR length(btrim(coalesce(p_learning,''))) NOT BETWEEN 3 AND 1500 THEN RAISE EXCEPTION 'Ergebnis und konkreten Lernpunkt ergänzen'; END IF;
 IF coalesce(p_playbook,false) AND v_row.plan->>'setup_state'<>'yes' THEN RAISE EXCEPTION 'Playbook-Beispiel benötigt ein verknüpftes Setup'; END IF;
 UPDATE public.v8_htf_assessments SET result=p_result,learning=btrim(p_learning),playbook=coalesce(p_playbook,false),reviewed_at=clock_timestamp() WHERE id=p_id RETURNING * INTO v_row;
 RETURN to_jsonb(v_row);
END $$;
CREATE OR REPLACE FUNCTION public.set_training_focus_v735(p_request_id uuid,p_goal text,p_expected_id uuid DEFAULT NULL,p_source_trade_id uuid DEFAULT NULL,p_source_error_id text DEFAULT NULL)
RETURNS public.training_goals_v7 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_active uuid;v_saved public.training_goals_v7;v_errors jsonb;v_error jsonb;
BEGIN
 IF v_uid IS NULL OR p_request_id IS NULL OR p_goal IS NULL OR length(btrim(p_goal)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'Valid training rule and authentication required';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text,735));
 SELECT * INTO v_saved FROM public.training_goals_v7 WHERE owner_id=v_uid AND id=p_request_id;
 IF FOUND THEN
 IF v_saved.status<>'active' THEN RAISE EXCEPTION 'The requested training focus is no longer active. Reload the current focus';END IF;
 IF v_saved.goal<>btrim(p_goal) OR v_saved.source_trade_id IS DISTINCT FROM p_source_trade_id OR v_saved.source_error_id IS DISTINCT FROM p_source_error_id THEN RAISE EXCEPTION 'Focus request already used with other inputs';END IF;
 RETURN v_saved;
 END IF;
 SELECT id INTO v_active FROM public.training_goals_v7 WHERE owner_id=v_uid AND status='active';
 IF v_active IS DISTINCT FROM p_expected_id THEN RAISE EXCEPTION 'Training focus changed on another device. Reload before replacing';END IF;
 IF p_source_trade_id IS NOT NULL THEN
 SELECT CASE WHEN jsonb_typeof(observations->'review_errors')='array' THEN observations->'review_errors' ELSE jsonb_build_array(jsonb_build_object('id','legacy-'||id::text,'type',observations->>'review_error','countermeasure',observations->>'countermeasure')) END INTO v_errors
 FROM public.trades WHERE id=p_source_trade_id AND owner_id=v_uid AND exit_at IS NOT NULL AND observations->>'compliance_reviewed'='true';
 SELECT value INTO v_error FROM jsonb_array_elements(coalesce(v_errors,'[]')) WHERE value->>'id'=p_source_error_id;
 IF v_error IS NULL OR btrim(coalesce(v_error->>'countermeasure',''))<>btrim(p_goal) THEN RAISE EXCEPTION 'Save and complete the source review and countermeasure first';END IF;
 ELSIF p_source_error_id IS NOT NULL THEN RAISE EXCEPTION 'Source trade required';END IF;
 UPDATE public.training_goals_v7 SET status='replaced',updated_at=now() WHERE owner_id=v_uid AND status='active';
 INSERT INTO public.training_goals_v7(id,owner_id,goal,status,source_trade_id,source_error_id,error_type)
 VALUES(p_request_id,v_uid,btrim(p_goal),'active',p_source_trade_id,p_source_error_id,v_error->>'type') RETURNING * INTO v_saved;
 RETURN v_saved;
END $$;
REVOKE ALL ON FUNCTION public.set_training_focus_v735(uuid,text,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_training_focus_v735(uuid,text,uuid,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.capture_training_focus_v735() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_focus jsonb;
BEGIN
 SELECT jsonb_build_object('goal_id',id,'rule',goal,'version_at',updated_at,'source_trade_id',source_trade_id,'source_error_id',source_error_id)
 INTO v_focus FROM public.training_goals_v7 WHERE owner_id=NEW.owner_id AND status='active';
 NEW.observations:=coalesce(NEW.observations,'{}')||jsonb_build_object('training_focus',v_focus);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_training_focus_v735() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_training_focus_v735 BEFORE INSERT ON public.trades FOR EACH ROW EXECUTE FUNCTION public.capture_training_focus_v735();

