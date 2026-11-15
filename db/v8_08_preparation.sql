-- Preserve the legacy completed-exit rule, with an explicit V808 pending-result state.
ALTER TABLE public.trades DROP CONSTRAINT trades_check1;
ALTER TABLE public.trades ADD CONSTRAINT trades_check1 CHECK (
 exit_at IS NULL OR (exit_reason IS NOT NULL AND
  (realized_pnl_usd IS NOT NULL OR coalesce(observations->>'results_pending_v808'='true',false)))
);
-- V8.08 RPCs and narrowly scoped pending-result exit constraint. Existing data, RLS and legacy RPCs are preserved.
CREATE FUNCTION public.save_htf_assessment_v808(p_id uuid,p_session_id uuid,p_expected_context jsonb,p_plan jsonb,p_context jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_owner uuid:=auth.uid(); v_session public.trading_sessions; v_row public.v8_htf_assessments; v_plan jsonb; v_context jsonb; v_setup public.trading_setup_catalog; v_point jsonb; v_key text; v_number numeric;
BEGIN
 IF v_owner IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_id IS NULL OR p_session_id IS NULL OR jsonb_typeof(p_plan) IS DISTINCT FROM 'object' OR jsonb_typeof(p_context) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid HTF payload'; END IF;
 SELECT * INTO v_session FROM public.trading_sessions WHERE id=p_session_id AND owner_id=v_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Handelssession nicht verfügbar'; END IF;
 SELECT * INTO v_row FROM public.v8_htf_assessments WHERE id=p_id;
 IF FOUND THEN
  IF v_row.owner_id<>v_owner OR v_row.session_id<>p_session_id THEN RAISE EXCEPTION 'Request identity conflict'; END IF;
  IF (v_row.plan-'setup_snapshot'-'setup_id'-'mental_check') IS DISTINCT FROM (p_plan-'setup_snapshot'-'setup_id'-'mental_check') OR (v_row.plan->>'setup_id') IS DISTINCT FROM (CASE WHEN p_plan->>'setup_state'='yes' THEN p_plan->>'setup_id' ELSE NULL END) OR (v_row.plan->'mental_check') IS DISTINCT FROM (p_context->'mental_check') THEN RAISE EXCEPTION 'Request ID already used with different HTF inputs'; END IF;
  RETURN jsonb_build_object('assessment',to_jsonb(v_row),'context',v_session.htf_context);
 END IF;
 IF v_session.status<>'open' THEN RAISE EXCEPTION 'Handelssession ist beendet'; END IF;
 IF coalesce(v_session.htf_context,'{}') IS DISTINCT FROM p_expected_context THEN RAISE EXCEPTION 'Vorbereitung wurde inzwischen geändert. Bitte neu laden.'; END IF;
 IF coalesce(p_plan->>'direction','') NOT IN ('long','short','neutral','unclear') OR coalesce(p_plan->>'sentiment','') NOT IN ('bullish','bearish','neutral','mixed','unclear') OR length(btrim(coalesce(p_plan->>'news',''))) NOT BETWEEN 1 AND 1500 OR p_plan->>'setup_state' IS DISTINCT FROM 'no' OR p_plan->>'schema_version' IS DISTINCT FROM '808' THEN RAISE EXCEPTION 'News, Sentiment, Richtung und Setup-Frage vervollständigen'; END IF;
 IF jsonb_typeof(p_plan->'technical') IS DISTINCT FROM 'array' OR jsonb_array_length(p_plan->'technical') NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Ungültige technische Prüfpunkte'; END IF;
 FOR v_point IN SELECT value FROM jsonb_array_elements(p_plan->'technical') LOOP
  IF jsonb_typeof(v_point) IS DISTINCT FROM 'object' OR length(btrim(coalesce(v_point->>'label',''))) NOT BETWEEN 1 AND 80 OR length(coalesce(v_point->>'note',''))>1500 OR jsonb_typeof(v_point->'checked') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Ungültiger Prüfpunkt'; END IF;
 END LOOP;
 FOR v_key IN SELECT unnest(ARRAY['focus','pressure','fatigue','urge','fear','greed','revenge','frustration']) LOOP
  IF jsonb_typeof(p_context#>ARRAY['mental_check','scales',v_key]) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Mentale Verfassung vollständig bewerten'; END IF;
  v_number:=(p_context#>>ARRAY['mental_check','scales',v_key])::numeric;
  IF v_number<>trunc(v_number) OR v_number<1 OR v_number>10 THEN RAISE EXCEPTION 'Ungültige Bewertung'; END IF;
 END LOOP;
 -- Never accept a high-risk factor without its individual acknowledgement.
 FOR v_key IN SELECT unnest(ARRAY['focus','pressure','fatigue','urge','fear','greed','revenge','frustration']) LOOP
  v_number:=(p_context#>>ARRAY['mental_check','scales',v_key])::numeric;
  IF (v_key='focus' AND v_number<=3) OR (v_key<>'focus' AND v_number>=7) THEN
   IF p_context#>>'{mental_check,conscious_continue}' IS DISTINCT FROM 'true' OR p_plan#>>ARRAY['warning_acknowledgements',v_key] IS DISTINCT FROM (v_key||':'||v_number::text) THEN RAISE EXCEPTION 'Warnhinweis einzeln bestätigen: %',v_key; END IF;
  END IF;
 END LOOP;
 -- V808 duration is authoritative. A past end time is valid when resuming.
 IF jsonb_typeof(p_plan#>'{personal_plan,duration_minutes}') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Handelsdauer in Minuten fehlt'; END IF;
 v_number:=(p_plan#>>'{personal_plan,duration_minutes}')::numeric;
 IF v_number<>trunc(v_number) OR v_number<5 OR v_number>720 THEN RAISE EXCEPTION 'Handelsdauer 5–720 Minuten'; END IF;
 IF p_plan#>>'{personal_plan,started_at}' IS NULL OR p_plan#>>'{personal_plan,end_at}' IS NULL OR (p_plan#>>'{personal_plan,end_at}')::timestamptz IS DISTINCT FROM ((p_plan#>>'{personal_plan,started_at}')::timestamptz + make_interval(mins=>v_number::integer)) THEN RAISE EXCEPTION 'Handelsende passt nicht zur Dauer'; END IF;
 IF p_plan#>>'{personal_plan,scope}' IS NULL OR p_plan#>>'{personal_plan,scope}' NOT IN ('total','per_account') THEN RAISE EXCEPTION 'Geltungsbereich fehlt'; END IF;
 FOR v_key IN SELECT unnest(ARRAY['profit_goal','loss_limit']) LOOP
  IF p_plan#>ARRAY['personal_plan',v_key] IS DISTINCT FROM 'null'::jsonb THEN
   IF jsonb_typeof(p_plan#>ARRAY['personal_plan',v_key]) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Ungültige Geldgrenze'; END IF;
   v_number:=(p_plan#>>ARRAY['personal_plan',v_key])::numeric;
   IF v_number<=0 OR v_number>100000000 THEN RAISE EXCEPTION 'Ungültige Geldgrenze'; END IF;
  END IF;
 END LOOP;
 FOR v_key IN SELECT unnest(ARRAY['extremes','zones','options']) LOOP
  SELECT value INTO v_point FROM jsonb_array_elements(p_plan->'technical') WHERE value->>'key'=v_key;
  IF NOT FOUND OR v_point->>'assessment' NOT IN ('marked','unavailable') OR v_point->>'assessment' IS NULL OR (v_point->>'assessment'='unavailable' AND length(btrim(coalesce(v_point->>'note','')))=0) THEN RAISE EXCEPTION 'Chart-Markierung oder begründete Ausnahme fehlt: %',v_key; END IF;
 END LOOP;
 v_plan:=(p_plan-'setup_snapshot')||jsonb_build_object('mental_check',p_context->'mental_check');
 IF p_plan->>'setup_state'='yes' THEN
  SELECT * INTO v_setup FROM public.trading_setup_catalog WHERE id=(p_plan->>'setup_id')::uuid AND owner_id=v_owner AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aktives eigenes Setup auswählen'; END IF;
  v_plan:=v_plan||jsonb_build_object('setup_snapshot',jsonb_build_object('id',v_setup.id,'name',v_setup.name,'description',v_setup.description,'rules',v_setup.rules,'image_path',v_setup.image_path));
 ELSE v_plan:=v_plan-'setup_id'; END IF;
 IF jsonb_typeof(p_plan->'images') IS DISTINCT FROM 'array' OR jsonb_array_length(p_plan->'images')>10 THEN RAISE EXCEPTION 'Ungültige Bilderliste'; END IF;
 FOR v_key IN SELECT jsonb_array_elements_text(p_plan->'images') LOOP
  IF v_key NOT LIKE v_owner::text||'/session/'||p_session_id::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='trading-chart-screenshots' AND name=v_key) THEN RAISE EXCEPTION 'Bild gehört nicht zu dieser Handelssession'; END IF;
 END LOOP;
 INSERT INTO public.v8_htf_assessments(id,owner_id,session_id,plan) VALUES(p_id,v_owner,p_session_id,v_plan) RETURNING * INTO v_row;
 -- Keep account configuration/history exclusively from the locked current session.
 v_context:=coalesce(v_session.htf_context,'{}')||(p_context-'selected_accounts'-'account_configuration_history'-'htf_v8')||jsonb_build_object('htf_v8',jsonb_build_object('id',v_row.id,'captured_at',v_row.captured_at,'direction',v_plan->>'direction','setup_snapshot',v_plan->'setup_snapshot','plan',v_plan));
 UPDATE public.trading_sessions SET htf_context=v_context WHERE id=p_session_id AND owner_id=v_owner;
 RETURN jsonb_build_object('assessment',to_jsonb(v_row),'context',v_context);
END $$;
REVOKE ALL ON FUNCTION public.save_htf_assessment_v808(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_htf_assessment_v808(uuid,uuid,jsonb,jsonb,jsonb) TO authenticated;

-- Fast emotional exit: missing broker results remain NULL, never a zero result.
CREATE FUNCTION public.close_trade_pending_v808(p_trade_id uuid,p_exit_reason text,p_scales jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); t public.trades; k text; stamp timestamptz;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO t FROM public.trades WHERE id=p_trade_id AND owner_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Trade nicht verfügbar'; END IF;
 IF p_exit_reason IS NULL OR p_exit_reason NOT IN ('TP','SL','BE','extended_tp','daily_target','manual','other') THEN RAISE EXCEPTION 'Exit-Grund fehlt'; END IF;
 IF NOT public.valid_emotion_scales_v736(p_scales) THEN RAISE EXCEPTION 'Ungültige Exit-Bewertung'; END IF;
 FOREACH k IN ARRAY ARRAY['fear','stress','greed','frustration','relief','uncertain'] LOOP
  IF jsonb_typeof(p_scales->k) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Alle Exit-Empfindungen bewerten'; END IF;
 END LOOP;
 IF t.exit_at IS NOT NULL THEN
  IF t.observations->'exit_emotion_scales'=p_scales AND t.exit_reason=p_exit_reason AND t.observations->>'results_pending_v808'='true' THEN RETURN jsonb_build_object('trade_id',t.id,'exit_at',t.exit_at,'pending',true); END IF;
  RAISE EXCEPTION 'Trade bereits abgeschlossen';
 END IF;
 IF EXISTS(SELECT 1 FROM public.account_trade_results r JOIN public.trade_account_allocations a ON a.id=r.allocation_id WHERE a.trade_id=t.id) THEN RAISE EXCEPTION 'Kontoergebnisse bereits vorhanden'; END IF;
 stamp:=greatest(clock_timestamp(),t.entry_at);
 UPDATE public.trades SET exit_at=stamp,exit_reason=p_exit_reason,realized_pnl_usd=NULL,observations=observations||jsonb_build_object('exit_emotion_scales',p_scales,'exit_emotion_scales_at',stamp,'results_pending_v808',true),updated_at=stamp WHERE id=t.id AND owner_id=uid;
 RETURN jsonb_build_object('trade_id',t.id,'exit_at',stamp,'pending',true);
END $$;
CREATE FUNCTION public.complete_trade_results_v808(p_trade_id uuid,p_results jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); t public.trades; a public.trade_account_allocations; r jsonb; n integer; ids uuid[]:='{}'; aid uuid; pnl numeric; fees numeric; total numeric:=0;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO t FROM public.trades WHERE id=p_trade_id AND owner_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Trade nicht verfügbar'; END IF;
 IF t.exit_at IS NULL OR t.observations->>'results_pending_v808' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Keine offenen Ergebnisse für diesen Trade'; END IF;
 SELECT count(*) INTO n FROM public.trade_account_allocations WHERE trade_id=t.id AND owner_id=uid;
 IF jsonb_typeof(p_results) IS DISTINCT FROM 'array' OR jsonb_array_length(p_results)<>n OR n=0 THEN RAISE EXCEPTION 'Ein Ergebnis je Konto erforderlich'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_results) LOOP
  IF jsonb_typeof(r->'realized_pnl_usd') IS DISTINCT FROM 'number' OR jsonb_typeof(r->'fees_usd') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'P&L und Gebühren ausdrücklich eingeben'; END IF;
  aid:=(r->>'allocation_id')::uuid;pnl:=(r->>'realized_pnl_usd')::numeric;fees:=(r->>'fees_usd')::numeric;
  IF aid=ANY(ids) OR abs(pnl)>100000000 OR fees<0 OR fees>100000000 THEN RAISE EXCEPTION 'Ungültiges Kontoergebnis'; END IF;
  SELECT * INTO a FROM public.trade_account_allocations WHERE id=aid AND trade_id=t.id AND owner_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kontozuordnung gehört nicht zum Trade'; END IF;
  INSERT INTO public.account_trade_results(owner_id,allocation_id,realized_pnl_usd,fees_usd,result_status) VALUES(uid,aid,pnl,fees,'final');
  ids:=array_append(ids,aid);total:=total+pnl;
 END LOOP;
 UPDATE public.trades SET realized_pnl_usd=total,observations=observations||'{"results_pending_v808":false}'::jsonb,updated_at=clock_timestamp() WHERE id=t.id AND owner_id=uid;
 RETURN jsonb_build_object('trade_id',t.id,'total_pnl_usd',total);
END $$;
REVOKE ALL ON FUNCTION public.close_trade_pending_v808(uuid,text,jsonb),public.complete_trade_results_v808(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.close_trade_pending_v808(uuid,text,jsonb),public.complete_trade_results_v808(uuid,jsonb) TO authenticated;
