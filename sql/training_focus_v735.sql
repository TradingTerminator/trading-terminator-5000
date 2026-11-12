-- Additive feature for the UNPUBLISHED test build. Apply after security_v735.sql.
-- No existing goal or journal rows are rewritten.
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.training_goals_v7 WHERE status='active' GROUP BY owner_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Choose one existing active training focus before enabling this feature';END IF;END $$;
ALTER TABLE public.training_goals_v7 ADD COLUMN source_trade_id uuid REFERENCES public.trades(id) ON DELETE SET NULL;
ALTER TABLE public.training_goals_v7 ADD COLUMN source_error_id text;
ALTER TABLE public.training_goals_v7 ADD COLUMN error_type text;
ALTER TABLE public.training_goals_v7 DROP CONSTRAINT training_goals_v7_status_check;
ALTER TABLE public.training_goals_v7 ADD CONSTRAINT training_goals_v7_status_check CHECK(status IN('active','practiced','replaced'));
CREATE UNIQUE INDEX training_one_active_v735 ON public.training_goals_v7(owner_id) WHERE status='active';

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

CREATE OR REPLACE FUNCTION public.validate_training_practice_v735() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v jsonb;
BEGIN
 IF NEW.observations->'training_focus' IS DISTINCT FROM OLD.observations->'training_focus' THEN RAISE EXCEPTION 'Training focus at entry is immutable';END IF;
 IF NEW.observations ? 'training_practice' THEN
 v:=NEW.observations->'training_practice';
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR NEW.observations->'training_focus' IS NULL OR NEW.observations->'training_focus'='null'::jsonb OR v->>'goal_id' IS DISTINCT FROM NEW.observations->'training_focus'->>'goal_id' OR coalesce(v->>'result','') NOT IN('pending','no_opportunity','followed','partial','missed') OR length(coalesce(v->>'note',''))>500 THEN RAISE EXCEPTION 'Invalid training practice review';END IF;
 IF NEW.exit_at IS NULL AND v->>'result'<>'pending' THEN RAISE EXCEPTION 'Assess training practice after the trade exit';END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_training_practice_v735() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_training_practice_v735 BEFORE UPDATE OF observations ON public.trades FOR EACH ROW EXECUTE FUNCTION public.validate_training_practice_v735();
