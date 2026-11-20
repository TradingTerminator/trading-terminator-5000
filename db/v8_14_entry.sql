CREATE OR REPLACE FUNCTION public.valid_emotion_scales_v736(p_scales jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN jsonb_typeof(p_scales) IS DISTINCT FROM 'object' THEN false ELSE
 NOT EXISTS(SELECT 1 FROM jsonb_each(p_scales) x WHERE x.key NOT IN ('focus','pressure','fatigue','urge','fomo','revenge','fear','greed','uncertain','stress','frustration','relief','satisfaction','calm','confidence','euphoria','clarity','patience') OR jsonb_typeof(x.value)<>'number' OR x.value::text !~ '^(10|[1-9])$') END
$$;

CREATE FUNCTION public.record_trade_attempt_v814(
 p_session_id uuid,p_setup_type text,p_instrument text,p_direction text,p_allocations jsonb,p_entry_emotion text,p_client_request_id uuid,
 p_limit_reason text,p_idea_id uuid,p_warning_answers jsonb,p_entry_context jsonb,p_new_idea jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t uuid; snapshots jsonb; prior_id uuid; actual_at timestamptz;
BEGIN
 IF p_entry_context#>>'{ltf_v811,status}' = 'not_reviewed' AND
    (p_entry_context#>>'{ltf_v811,timing}' IS DISTINCT FROM 'pending' OR
     p_entry_context#>'{ltf_v811,values}' IS DISTINCT FROM '{}'::jsonb OR
     p_entry_context#>'{ltf_v811,images}' IS DISTINCT FROM '[]'::jsonb) THEN
  RAISE EXCEPTION 'Aufgeschobene Analyse enthält widersprüchliche Angaben';
 END IF;
 IF p_entry_context->>'actual_entry_at' IS NOT NULL THEN
  actual_at:=(p_entry_context->>'actual_entry_at')::timestamptz;
  IF p_entry_context->>'recording_mode' IS DISTINCT FROM 'retrospective' OR NOT isfinite(actual_at) OR actual_at>clock_timestamp() THEN RAISE EXCEPTION 'Ungültiger tatsächlicher Entry-Zeitpunkt'; END IF;
 END IF;
 IF p_entry_context->>'planned_tp_ticks' IS NOT NULL AND coalesce(p_entry_context->>'planned_tp_ticks','') !~ '^[1-9][0-9]{0,5}$' THEN RAISE EXCEPTION 'Ungültiger ursprünglicher TP'; END IF;
 IF p_entry_context->>'reentry_trade_id' IS NOT NULL THEN
  prior_id:=(p_entry_context->>'reentry_trade_id')::uuid;
  IF NOT EXISTS(SELECT FROM public.trades WHERE id=prior_id AND owner_id=auth.uid() AND session_id=p_session_id AND setup_type=p_setup_type AND direction=p_direction AND exit_at IS NOT NULL) THEN RAISE EXCEPTION 'Re-Entry passt nicht zum abgeschlossenen Trade'; END IF;
 END IF;
 t:=public.record_trade_attempt_v811(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion,p_client_request_id,p_limit_reason,p_idea_id,p_warning_answers,p_entry_context,p_new_idea);
 PERFORM 1 FROM public.trades WHERE id=t AND owner_id=auth.uid() FOR UPDATE;
 IF actual_at IS NOT NULL THEN
  UPDATE public.trades SET entry_at=actual_at WHERE id=t AND owner_id=auth.uid() AND exit_at IS NULL AND NOT observations?'fee_snapshot_v813';
 END IF;
 SELECT coalesce(jsonb_object_agg(a.id, CASE WHEN cfg.rate->>'valid_from' IS NULL OR cfg.rate->>'valid_from'<=to_char((tr.entry_at AT TIME ZONE 'Europe/Berlin')::date,'YYYY-MM-DD') THEN cfg.rate ELSE NULL END),'{}')
 INTO snapshots FROM public.trade_account_allocations a
 JOIN public.trading_accounts c ON c.id=a.account_id AND c.owner_id=a.owner_id
 JOIN public.trades tr ON tr.id=a.trade_id AND tr.owner_id=a.owner_id
 CROSS JOIN LATERAL (SELECT c.fee_schedule_v813->a.instrument AS rate) cfg
 WHERE a.trade_id=t AND a.owner_id=auth.uid();
 UPDATE public.trades SET observations=observations||jsonb_build_object('fee_snapshot_v813',snapshots)
 WHERE id=t AND owner_id=auth.uid() AND NOT observations?'fee_snapshot_v813';
 RETURN t;
END $$;

REVOKE ALL ON FUNCTION public.record_trade_attempt_v814(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v814(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb) TO authenticated;

CREATE FUNCTION public.finish_ltf_v814(p_trade uuid,p_status text,p_values jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE trade public.trades; receipt jsonb;
BEGIN
 SELECT * INTO STRICT trade FROM public.trades WHERE id=p_trade AND owner_id=auth.uid() FOR UPDATE;
 IF trade.observations#>>'{entry_context_v736,ltf_v811,timing}' IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Keine offene LTF-Analyse'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('reviewed','unavailable') OR p_values IS NULL
  OR NOT public.valid_ltf_v811(jsonb_build_object('schema',813,'status',p_status,'images','[]'::jsonb,'values',p_values))
  OR (p_status='unavailable' AND p_values<>'{}'::jsonb) OR (p_status='reviewed' AND p_values='{}'::jsonb) THEN
  RAISE EXCEPTION 'Beobachtung auswählen oder Daten nicht verfügbar angeben';
 END IF;
 receipt:=trade.observations->'ltf_after_entry_v814';
 IF receipt IS NOT NULL THEN
  IF receipt->>'status'=p_status AND receipt->'values'=p_values THEN RETURN receipt; END IF;
  RAISE EXCEPTION 'Analyse bereits auf einem Gerät abgeschlossen';
 END IF;
 receipt:=jsonb_build_object('status',p_status,'values',p_values,'timing','after_entry','recorded_at',clock_timestamp());
 UPDATE public.trades SET observations=observations||jsonb_build_object('ltf_after_entry_v814',receipt) WHERE id=p_trade AND owner_id=auth.uid();
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.finish_ltf_v814(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finish_ltf_v814(uuid,text,jsonb) TO authenticated;
