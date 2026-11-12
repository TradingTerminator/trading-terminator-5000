-- Follow-up for projects which applied the initial V7.35 migration.
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
