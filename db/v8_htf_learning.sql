-- V8-only, additive schema. Existing V7 tables/policies/functions are not redefined.
CREATE TABLE public.v8_htf_assessments (
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 session_id uuid NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 plan jsonb NOT NULL CHECK(jsonb_typeof(plan)='object'),
 reviewed_at timestamptz,
 result text CHECK(result IN ('confirmed','partial','invalidated','unclear')),
 learning text,
 playbook boolean NOT NULL DEFAULT false,
 FOREIGN KEY(session_id,owner_id) REFERENCES public.trading_sessions(id,owner_id) ON DELETE CASCADE,
 CHECK((reviewed_at IS NULL AND result IS NULL AND learning IS NULL AND NOT playbook) OR
       (reviewed_at>=captured_at+interval '2 hours' AND result IS NOT NULL AND length(btrim(learning)) BETWEEN 3 AND 1500))
);
CREATE INDEX v8_htf_owner_captured ON public.v8_htf_assessments(owner_id,captured_at DESC);
CREATE INDEX v8_htf_session_owner ON public.v8_htf_assessments(session_id,owner_id);
ALTER TABLE public.v8_htf_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY v8_htf_read ON public.v8_htf_assessments FOR SELECT TO authenticated USING((SELECT auth.uid())=owner_id);
REVOKE ALL ON public.v8_htf_assessments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.v8_htf_assessments TO authenticated;
CREATE TABLE public.v8_htf_preferences (
 owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 technical_points jsonb NOT NULL CHECK(jsonb_typeof(technical_points)='array' AND jsonb_array_length(technical_points) BETWEEN 1 AND 20)
);
ALTER TABLE public.v8_htf_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY v8_htf_preferences_owner ON public.v8_htf_preferences FOR ALL TO authenticated USING((SELECT auth.uid())=owner_id) WITH CHECK((SELECT auth.uid())=owner_id);
REVOKE ALL ON public.v8_htf_preferences FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.v8_htf_preferences TO authenticated;
CREATE FUNCTION public.save_htf_assessment_v803(p_id uuid,p_session_id uuid,p_expected_context jsonb,p_plan jsonb,p_context jsonb)
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
 IF coalesce(p_plan->>'direction','') NOT IN ('long','short','neutral','unclear') OR coalesce(p_plan->>'sentiment','') NOT IN ('bullish','bearish','neutral','mixed','unclear') OR length(btrim(coalesce(p_plan->>'news',''))) NOT BETWEEN 1 AND 1500 OR coalesce(p_plan->>'setup_state','') NOT IN ('yes','no','unclear') THEN RAISE EXCEPTION 'News, Sentiment, Richtung und Setup-Frage vervollständigen'; END IF;
 IF jsonb_typeof(p_plan->'technical') IS DISTINCT FROM 'array' OR jsonb_array_length(p_plan->'technical') NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Ungültige technische Prüfpunkte'; END IF;
 FOR v_point IN SELECT value FROM jsonb_array_elements(p_plan->'technical') LOOP
  IF jsonb_typeof(v_point) IS DISTINCT FROM 'object' OR length(btrim(coalesce(v_point->>'label',''))) NOT BETWEEN 1 AND 80 OR length(coalesce(v_point->>'note',''))>1500 OR jsonb_typeof(v_point->'checked') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Ungültiger Prüfpunkt'; END IF;
 END LOOP;
 FOR v_key IN SELECT unnest(ARRAY['focus','pressure','fatigue','urge']) LOOP
  IF jsonb_typeof(p_context#>ARRAY['mental_check','scales',v_key]) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Mentale Verfassung vollständig bewerten'; END IF;
  v_number:=(p_context#>>ARRAY['mental_check','scales',v_key])::numeric;
  IF v_number<>trunc(v_number) OR v_number<1 OR v_number>10 THEN RAISE EXCEPTION 'Ungültige Bewertung'; END IF;
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
REVOKE ALL ON FUNCTION public.save_htf_assessment_v803(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.review_htf_assessment_v803(uuid,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_htf_assessment_v803(uuid,uuid,jsonb,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_htf_assessment_v803(uuid,text,text,boolean) TO authenticated;
