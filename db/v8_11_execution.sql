-- Additive metadata only; V7 values, IDs, entries and original risk are not rewritten.
ALTER TABLE public.trading_accounts ADD COLUMN default_sl_ticks integer CHECK(default_sl_ticks BETWEEN 1 AND 100000);
ALTER TABLE public.trade_ideas_v733 ADD COLUMN revision_v811 integer NOT NULL DEFAULT 0;
ALTER TABLE public.trade_ideas_v733 ADD COLUMN updated_at_v811 timestamptz;
-- Original target remains protected by V740. Editable current plan has a separate field.
ALTER TABLE public.trade_ideas_v733 ADD COLUMN current_plan_v811 jsonb CHECK(jsonb_typeof(current_plan_v811)='object' AND pg_column_size(current_plan_v811)<=10000);
CREATE FUNCTION public.guard_idea_revision_v811() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF (NEW.thesis,NEW.trigger_condition,NEW.current_plan_v811,NEW.invalidation,NEW.setup_type,NEW.instrument,NEW.direction,NEW.status) IS DISTINCT FROM (OLD.thesis,OLD.trigger_condition,OLD.current_plan_v811,OLD.invalidation,OLD.setup_type,OLD.instrument,OLD.direction,OLD.status) THEN NEW.revision_v811:=OLD.revision_v811+1;NEW.updated_at_v811:=clock_timestamp();ELSE NEW.revision_v811:=OLD.revision_v811;NEW.updated_at_v811:=OLD.updated_at_v811;END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_idea_revision_v811() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_idea_revision_v811 BEFORE UPDATE ON public.trade_ideas_v733 FOR EACH ROW EXECUTE FUNCTION public.guard_idea_revision_v811();
CREATE FUNCTION public.edit_idea_v811(p_id uuid,p_expected_revision integer,p_values jsonb,p_archive boolean DEFAULT false) RETURNS public.trade_ideas_v733 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r public.trade_ideas_v733;
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(p_values) IS DISTINCT FROM 'object' OR pg_column_size(p_values)>10000 THEN RAISE EXCEPTION 'Authentication and valid idea required';END IF;
 SELECT * INTO r FROM public.trade_ideas_v733 WHERE id=p_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Idea unavailable';END IF;
 IF r.revision_v811 IS DISTINCT FROM p_expected_revision THEN IF (coalesce(r.current_plan_v811->>'thesis',r.thesis),coalesce(r.current_plan_v811->>'trigger_condition',r.trigger_condition),coalesce(r.current_plan_v811->>'target_zone',r.target_zone,''),coalesce(r.current_plan_v811->>'invalidation',r.invalidation)) IS NOT DISTINCT FROM (btrim(p_values->>'thesis'),btrim(p_values->>'trigger_condition'),btrim(coalesce(p_values->>'target_zone','')),btrim(p_values->>'invalidation')) AND (NOT p_archive OR r.status='completed') THEN RETURN r;END IF;RAISE EXCEPTION 'Idea changed on another device; reload';END IF;
 IF length(btrim(coalesce(p_values->>'thesis',''))) NOT BETWEEN 1 AND 2000 OR length(btrim(coalesce(p_values->>'trigger_condition',''))) NOT BETWEEN 1 AND 1000 OR length(btrim(coalesce(p_values->>'invalidation',''))) NOT BETWEEN 1 AND 1000 OR length(coalesce(p_values->>'target_zone',''))>1000 THEN RAISE EXCEPTION 'Thesis, trigger and invalidation required';END IF;
 UPDATE public.trade_ideas_v733 SET current_plan_v811=jsonb_build_object('thesis',btrim(p_values->>'thesis'),'trigger_condition',btrim(p_values->>'trigger_condition'),'target_zone',btrim(p_values->>'target_zone'),'invalidation',btrim(p_values->>'invalidation')),status=CASE WHEN p_archive THEN 'completed' ELSE status END WHERE id=r.id AND owner_id=auth.uid() RETURNING * INTO r;RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.edit_idea_v811(uuid,integer,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_idea_v811(uuid,integer,jsonb,boolean) TO authenticated;
CREATE FUNCTION public.valid_ltf_v811(p jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE k text;allowed jsonb:='{"volume":["long","short","neutral","unclear"],"stopping":["stopping","topping","none","unclear"],"cvd":["rising","falling","flat","unclear"],"delta":["positive","negative","neutral","unclear"],"vpoc":["above","at","below","unclear"],"vwap":["above","at","below","unclear"],"zone":["top","middle","bottom","outside","unclear"],"zone_direction":["long","short","neutral","unclear"],"aggression":["buy","sell","balanced","unclear"],"absorption":["buy_absorbed","sell_absorbed","none","unclear"],"liquidity":["above","below","both","none","unclear"]}';
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR pg_column_size(p)>20000 OR coalesce(p->>'status','') NOT IN('reviewed','not_reviewed','unavailable') OR jsonb_typeof(p->'images') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'images')>4 THEN RETURN false;END IF;
 IF jsonb_array_length(p->'images')=0 AND coalesce(p->>'image_absence','') NOT IN('not_captured','not_available','historical_unknown') THEN RETURN false;END IF;
 IF p->>'status'='reviewed' THEN
  IF coalesce(p->>'timeframe','') NOT IN('m1','m3','m5','ticks','other') OR length(btrim(coalesce(p->>'reference',''))) NOT BETWEEN 1 AND 200 OR jsonb_typeof(p->'values') IS DISTINCT FROM 'object' THEN RETURN false;END IF;
  FOR k IN SELECT jsonb_object_keys(allowed) LOOP IF NOT ((allowed->k)||'["not_reviewed","unavailable"]'::jsonb)?coalesce(p->'values'->>k,'') THEN RETURN false;END IF;END LOOP;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.valid_ltf_v811(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.valid_ltf_v811(jsonb) TO authenticated;
CREATE FUNCTION public.record_trade_attempt_v811(
 p_session_id uuid,p_setup_type text,p_instrument text,p_direction text,p_allocations jsonb,p_entry_emotion text,p_client_request_id uuid,
 p_limit_reason text DEFAULT NULL,p_idea_id uuid DEFAULT NULL,p_warning_answers jsonb DEFAULT NULL,p_entry_context jsonb DEFAULT '{}',p_new_idea jsonb DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t uuid;s public.trading_sessions;idea public.trade_ideas_v733;path text;r record;standard jsonb;actual jsonb;changes jsonb:='[]';snapshots jsonb:='[]';key text;news jsonb;news_issues jsonb:='[]';stamp timestamptz:=clock_timestamp();classification text;obs jsonb;old_evidence jsonb;
BEGIN
 IF auth.uid() IS NULL OR coalesce(p_entry_context->>'recording_mode','') NOT IN('planned','retrospective') OR NOT public.valid_ltf_v811(p_entry_context->'ltf_v811') THEN RAISE EXCEPTION 'Explicit recording mode and LTF observation or documented absence required';END IF;
 IF p_entry_context->>'recording_mode'='planned' AND (p_entry_context->>'capture_version' IS DISTINCT FROM '737' OR NOT public.valid_emotion_scales_v736(p_entry_context->'emotion_scales') OR NOT (p_entry_context->'emotion_scales')?&ARRAY['focus','pressure','fomo','revenge','fear','greed']) THEN RAISE EXCEPTION 'Planned entry requires six conscious ratings';END IF;
 IF (p_entry_context->>'recording_mode'='retrospective') IS DISTINCT FROM coalesce((p_entry_context->>'documented_after_execution')::boolean,false) THEN RAISE EXCEPTION 'Recording mode contradicts timing';END IF;
 FOR path IN SELECT jsonb_array_elements_text(p_entry_context#>'{ltf_v811,images}') LOOP
  IF path NOT LIKE auth.uid()::text||'/entry/'||p_client_request_id::text||'/%' OR length(path)>500 OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='trading-chart-screenshots' AND name=path) THEN RAISE EXCEPTION 'Screenshot does not belong to this entry';END IF;
 END LOOP;
 t:=public.record_trade_attempt_v810(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion,p_client_request_id,p_limit_reason,p_idea_id,p_warning_answers,p_entry_context,p_new_idea);
 SELECT observations->'entry_evidence_v811',observations INTO old_evidence,obs FROM public.trades WHERE id=t AND owner_id=auth.uid();IF old_evidence IS NOT NULL THEN RETURN t;END IF;
 SELECT * INTO s FROM public.trading_sessions WHERE id=p_session_id AND owner_id=auth.uid();
 FOR r IN SELECT a.id,a.account_id,a.instrument,a.planned_quantity,a.initial_sl_points,a.initial_risk_usd,c.default_instrument,c.default_quantity,c.default_sl_ticks FROM public.trade_account_allocations a JOIN public.trading_accounts c ON c.id=a.account_id AND c.owner_id=a.owner_id WHERE a.trade_id=t AND a.owner_id=auth.uid() ORDER BY a.id LOOP
  standard:=jsonb_build_object('instrument',r.default_instrument,'quantity',r.default_quantity,'ticks',r.default_sl_ticks);actual:=jsonb_build_object('instrument',r.instrument,'quantity',r.planned_quantity,'ticks',r.initial_sl_points*4);
  snapshots:=snapshots||jsonb_build_array(jsonb_build_object('account_id',r.account_id,'standard',standard,'actual',actual,'initial_risk_usd',r.initial_risk_usd));
  FOR key IN SELECT unnest(ARRAY['instrument','quantity','ticks']) LOOP
   IF standard->key IS DISTINCT FROM 'null'::jsonb AND standard->key IS DISTINCT FROM actual->key THEN changes:=changes||jsonb_build_array(jsonb_build_object('account_id',r.account_id,'field',key,'expected',standard->key,'actual',actual->key,'at',stamp,'initial_risk_usd',r.initial_risk_usd,'risk_delta_usd',CASE WHEN r.default_sl_ticks IS NULL THEN NULL ELSE r.initial_risk_usd-r.default_sl_ticks*r.default_quantity*(CASE r.default_instrument WHEN 'NQ' THEN 5 WHEN 'MNQ' THEN .5 WHEN 'ES' THEN 12.5 WHEN 'MES' THEN 1.25 END) END,'standard_risk_usd',CASE WHEN r.default_sl_ticks IS NULL THEN NULL ELSE r.default_sl_ticks*r.default_quantity*(CASE r.default_instrument WHEN 'NQ' THEN 5 WHEN 'MNQ' THEN .5 WHEN 'ES' THEN 12.5 WHEN 'MES' THEN 1.25 END) END));END IF;
  END LOOP;
 END LOOP;
 SELECT * INTO idea FROM public.trade_ideas_v733 WHERE id=(SELECT x.idea_id FROM public.trade_attempts_v733 x WHERE x.trade_id=t AND x.owner_id=auth.uid() LIMIT 1) AND owner_id=auth.uid();
 classification:=CASE WHEN p_entry_context->>'recording_mode'='retrospective' OR length(btrim(coalesce(p_entry_context->>'news_deviation_note','')))>0 THEN 'review_required' ELSE 'rule_breach' END;
 FOR news IN SELECT value FROM jsonb_array_elements(coalesce(s.htf_context#>'{htf_v8,plan,news_windows}','[]')) LOOP
  IF news->>'rule'='avoid' AND news->>'from' IS NOT NULL AND news->>'to' IS NOT NULL AND stamp BETWEEN (news->>'from')::timestamptz AND (news->>'to')::timestamptz THEN news_issues:=news_issues||jsonb_build_array(jsonb_build_object('type','news_window','classification',classification,'event',news,'at',stamp));END IF;
 END LOOP;
 UPDATE public.trades SET observations=observations||jsonb_build_object('entry_evidence_v811',jsonb_build_object('recorded_at',stamp,'account_standards',snapshots,'account_changes',changes,'deviation_reason',p_entry_context->>'account_deviation_note','session_accounts',s.htf_context->'selected_accounts','idea_snapshot',CASE WHEN idea.id IS NOT NULL THEN to_jsonb(idea)||coalesce(idea.current_plan_v811,'{}'::jsonb)||jsonb_build_object('original_plan',jsonb_build_object('thesis',idea.thesis,'trigger_condition',idea.trigger_condition,'target_zone',idea.target_zone,'invalidation',idea.invalidation)) ELSE NULL END,'news_issues',news_issues,'news_windows_snapshot',s.htf_context#>'{htf_v8,plan,news_windows}')),rule_deviation=rule_deviation OR EXISTS(SELECT 1 FROM jsonb_array_elements(news_issues) i WHERE i->>'classification'='rule_breach') WHERE id=t AND owner_id=auth.uid();
 RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.record_trade_attempt_v811(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v811(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) TO authenticated;
CREATE FUNCTION public.guard_entry_evidence_v811() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN IF OLD.observations?'entry_evidence_v811' AND NEW.observations->'entry_evidence_v811' IS DISTINCT FROM OLD.observations->'entry_evidence_v811' THEN RAISE EXCEPTION 'Original entry evidence is immutable';END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION public.guard_entry_evidence_v811() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_entry_evidence_v811 BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_entry_evidence_v811();
CREATE TABLE public.stop_requests_v811(owner_id uuid NOT NULL REFERENCES auth.users(id),request_id uuid NOT NULL,payload jsonb NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(owner_id,request_id));
ALTER TABLE public.stop_requests_v811 ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_stop_requests_v811 ON public.stop_requests_v811 FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
REVOKE ALL ON public.stop_requests_v811 FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.stop_requests_v811 TO authenticated;
CREATE FUNCTION public.record_stop_batch_v811(p_request_id uuid,p_items jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();prior public.stop_requests_v811;r jsonb;results jsonb:='[]';result jsonb;n integer;stop_id uuid;saved_event jsonb;
BEGIN
 IF uid IS NULL OR p_request_id IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 OR pg_column_size(p_items)>60000 THEN RAISE EXCEPTION 'Authenticated stop request required';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text||p_request_id::text,811));
 SELECT * INTO prior FROM public.stop_requests_v811 WHERE owner_id=uid AND request_id=p_request_id;
 IF FOUND THEN IF prior.payload IS DISTINCT FROM p_items THEN RAISE EXCEPTION 'Stop request payload changed';END IF;RETURN prior.result;END IF;
 IF (SELECT count(DISTINCT value->>'allocation_id') FROM jsonb_array_elements(p_items))<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Duplicate account allocation';END IF;
 PERFORM a.id FROM public.trade_account_allocations a WHERE a.id IN(SELECT (value->>'allocation_id')::uuid FROM jsonb_array_elements(p_items)) AND a.owner_id=uid ORDER BY a.id FOR UPDATE;
 GET DIAGNOSTICS n=ROW_COUNT;IF n<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Allocation unavailable for this owner';END IF;
 IF (SELECT count(DISTINCT trade_id) FROM public.trade_account_allocations WHERE id IN(SELECT (value->>'allocation_id')::uuid FROM jsonb_array_elements(p_items)))<>1 THEN RAISE EXCEPTION 'One trade per management action';END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF (r->>'previous_ticks')::integer=(r->>'new_ticks')::integer THEN RAISE EXCEPTION 'Stop unchanged';END IF;
  stop_id:=public.record_stop_adjustment((r->>'allocation_id')::uuid,(r->>'previous_ticks')::integer,(r->>'new_ticks')::integer,r->>'reason',r->>'notes');
  SELECT to_jsonb(x) INTO saved_event FROM public.stop_adjustments x WHERE id=stop_id AND owner_id=uid;
  results:=results||jsonb_build_array(saved_event);
 END LOOP;
 result:=jsonb_build_object('saved',true,'results',results);
 INSERT INTO public.stop_requests_v811(owner_id,request_id,payload,result) VALUES(uid,p_request_id,p_items,result);RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.record_stop_batch_v811(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_stop_batch_v811(uuid,jsonb) TO authenticated;
CREATE FUNCTION public.export_journal_snapshot_v811() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE snapshot jsonb;table_name text;rows jsonb;tables jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required';END IF;
 snapshot:=public.export_journal_snapshot_v803();tables:=snapshot->'tables';
 FOREACH table_name IN ARRAY ARRAY['session_events_v810','stop_requests_v811'] LOOP
  EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) FROM public.%I r WHERE owner_id=$1',table_name) INTO rows USING auth.uid();
  IF jsonb_array_length(rows)>50000 THEN RAISE EXCEPTION 'Browser backup too large';END IF;tables:=tables||jsonb_build_object(table_name,rows);
 END LOOP;RETURN jsonb_set(snapshot,'{tables}',tables);
END $$;
REVOKE ALL ON FUNCTION public.export_journal_snapshot_v811() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.export_journal_snapshot_v811() TO authenticated;
CREATE FUNCTION public.guard_news_review_v811() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e jsonb;i integer:=0;source text;decision text;
BEGIN
 IF NEW.observations->>'compliance_reviewed'='true' THEN FOR e IN SELECT value FROM jsonb_array_elements(coalesce(NEW.observations#>'{entry_evidence_v811,news_issues}','[]')) LOOP
 source:='news-rule-'||i;i:=i+1;decision:=NEW.observations#>>ARRAY['exception_reviews',source];
 IF e->>'classification'='review_required' AND coalesce(decision,'') NOT IN('accepted','breach') THEN RAISE EXCEPTION 'News exception requires explicit review';END IF;
 IF e->>'classification'='rule_breach' OR decision='breach' THEN
 IF NOT NEW.rule_deviation OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.observations->'review_errors','[]')) r WHERE r->>'source_id'=source AND r->>'confirmed_breach'='true' AND length(btrim(coalesce(r->>'countermeasure','')))>0) THEN RAISE EXCEPTION 'News breach requires error and concrete countermeasure';END IF;
 END IF;END LOOP;END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_news_review_v811() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_news_review_v811 BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_news_review_v811();
