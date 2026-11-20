BEGIN;
-- Additive configuration. Existing accounts keep an empty schedule.
ALTER TABLE public.trading_accounts ADD COLUMN fee_schedule_v813 jsonb NOT NULL DEFAULT '{}';

CREATE FUNCTION public.valid_fee_schedule_v813(schedule jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN jsonb_typeof(schedule) IS DISTINCT FROM 'object' THEN false ELSE
 NOT EXISTS(SELECT FROM jsonb_each(schedule) AS s(instrument,rate) WHERE
   instrument NOT IN ('ES','MES','NQ','MNQ') OR jsonb_typeof(rate) IS DISTINCT FROM 'object'
   OR jsonb_typeof(rate->'amount') IS DISTINCT FROM 'number'
   OR coalesce(rate->>'amount','') !~ '^[0-9]{1,6}(\.[0-9]{1,6})?$'
   OR coalesce(rate->>'basis','') NOT IN ('side','round_turn')
   OR coalesce(rate->>'currency','') NOT IN ('USD','EUR','GBP','CHF','CAD','AUD')
   OR (rate->>'valid_from' IS NOT NULL AND (rate->>'valid_from') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')) END;
$$;
ALTER TABLE public.trading_accounts ADD CONSTRAINT fee_schedule_v813_valid CHECK(public.valid_fee_schedule_v813(fee_schedule_v813));

CREATE OR REPLACE FUNCTION public.valid_emotion_scales_v736(p_scales jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN jsonb_typeof(p_scales) IS DISTINCT FROM 'object' THEN false ELSE
 NOT EXISTS(SELECT 1 FROM jsonb_each(p_scales) x WHERE x.key NOT IN ('focus','pressure','fatigue','urge','fomo','revenge','fear','greed','uncertain','stress','frustration','relief','satisfaction','calm','confidence','euphoria') OR jsonb_typeof(x.value)<>'number' OR x.value::text !~ '^(10|[1-9])$') END
$$;

-- Rename the previous validator and delegate legacy payloads to it unchanged.
ALTER FUNCTION public.valid_ltf_v811(jsonb) RENAME TO valid_ltf_legacy_v811;
CREATE FUNCTION public.valid_ltf_v811(p jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE allowed jsonb:='{"volume":["long","short","neutral","unclear"],"stopping":["stopping","topping","none","unclear"],"cvd":["rising","falling","flat","unclear"],"delta":["positive","negative","neutral","unclear"],"vpoc":["above","at","below","unclear"],"vwap":["above","at","below","unclear"],"zone":["top","middle","bottom","outside","unclear"],"zone_direction":["long","short","neutral","unclear"],"aggression":["buy","sell","balanced","unclear"],"absorption":["buy_absorbed","sell_absorbed","none","unclear"],"liquidity":["above","below","both","none","unclear"],"cvd_divergence":["bullish","bearish","none","unclear"],"delta_divergence":["bullish","bearish","none","unclear"],"liquidity_target":["above","below","both","none"],"assessment":["long","short","neutral","unclear"]}';
BEGIN
 IF p->>'schema' IS DISTINCT FROM '813' THEN RETURN public.valid_ltf_legacy_v811(p); END IF;
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR pg_column_size(p)>20000
  OR coalesce(p->>'status','') NOT IN ('reviewed','not_reviewed','unavailable')
  OR jsonb_typeof(p->'images') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'images')>4
  OR jsonb_typeof(p->'values') IS DISTINCT FROM 'object' THEN RETURN false; END IF;
 RETURN NOT EXISTS (SELECT FROM jsonb_each(p->'values') AS v(k,val)
    WHERE NOT allowed ? k OR NOT ((allowed->k)||'["not_relevant"]'::jsonb) @> jsonb_build_array(val));
END $$;
REVOKE ALL ON FUNCTION public.valid_ltf_v811(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.valid_ltf_v811(jsonb) TO authenticated;

CREATE FUNCTION public.record_trade_attempt_v813(
 p_session_id uuid,p_setup_type text,p_instrument text,p_direction text,p_allocations jsonb,p_entry_emotion text,p_client_request_id uuid,
 p_limit_reason text,p_idea_id uuid,p_warning_answers jsonb,p_entry_context jsonb,p_new_idea jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t uuid; snapshots jsonb; prior_id uuid; actual_at timestamptz;
BEGIN
 IF p_entry_context->>'recording_mode'='planned' AND (p_entry_context#>>'{ltf_v811,status}' IS DISTINCT FROM 'reviewed' OR NOT public.valid_ltf_v811(p_entry_context->'ltf_v811')) THEN
  RAISE EXCEPTION 'LTF vor geplantem Entry bewusst prüfen';
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

CREATE FUNCTION public.close_trade_v813(p_trade_id uuid,p_exit_at timestamptz,p_scales jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t public.trades; stamp timestamptz:=clock_timestamp();
BEGIN
 SELECT * INTO t FROM public.trades WHERE id=p_trade_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Trade nicht verfügbar'; END IF;
 IF t.observations->'exit_capture_v813'->'requested_at'=to_jsonb(p_exit_at) AND t.observations->'exit_emotion_scales'=p_scales THEN
   RETURN jsonb_build_object('trade_id',t.id,'exit_at',t.exit_at);
 END IF;
 IF t.exit_at IS NOT NULL THEN RAISE EXCEPTION 'Trade bereits abgeschlossen'; END IF;
 IF NOT public.valid_emotion_scales_v736(p_scales) OR NOT (p_scales ?& ARRAY['fear','stress','greed','frustration','relief','uncertain','satisfaction','calm','confidence','euphoria']) THEN RAISE EXCEPTION 'Exit-Emotionen vollständig bewerten'; END IF;
 IF p_exit_at IS NULL OR p_exit_at<t.entry_at OR p_exit_at>stamp THEN RAISE EXCEPTION 'Exit muss zwischen Entry und jetzt liegen'; END IF;
 IF EXISTS(SELECT FROM public.account_trade_results r JOIN public.trade_account_allocations a ON a.id=r.allocation_id WHERE a.trade_id=t.id AND a.owner_id=auth.uid()) THEN RAISE EXCEPTION 'Kontoergebnisse bereits vorhanden'; END IF;
 UPDATE public.trades SET exit_at=p_exit_at,exit_reason='other',realized_pnl_usd=NULL,updated_at=stamp,
  observations=observations||jsonb_build_object('exit_emotion_scales',p_scales,'exit_emotion_scales_at',stamp,'results_pending_v808',true,
   'exit_capture_v813',jsonb_build_object('requested_at',p_exit_at,'recorded_at',stamp,'reason_pending',true))
 WHERE id=t.id AND owner_id=auth.uid();
 RETURN jsonb_build_object('trade_id',t.id,'exit_at',p_exit_at);
END $$;

CREATE FUNCTION public.complete_trade_v813(p_trade_id uuid,p_reason text,p_exit_tp integer,p_tp_reason text,p_note text,p_results jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t public.trades; a public.trade_account_allocations; r jsonb; rate jsonb; aid uuid; sides integer; fee numeric; planned integer; fees jsonb:='{}'; results jsonb:='[]'; outcome jsonb; payload jsonb;
BEGIN
 SELECT * INTO t FROM public.trades WHERE id=p_trade_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR t.exit_at IS NULL THEN RAISE EXCEPTION 'Geschlossener Trade nicht verfügbar'; END IF;
 IF p_reason IS NULL OR p_reason NOT IN ('TP','SL','BE','manual','other','extended_tp','daily_target') THEN RAISE EXCEPTION 'Exit-Grund wählen'; END IF;
 IF length(coalesce(p_note,''))>1000 OR length(coalesce(p_tp_reason,''))>500 OR coalesce(p_exit_tp,1) NOT BETWEEN 1 AND 999999 THEN RAISE EXCEPTION 'Ungültige Exit-Angaben'; END IF;
 planned:=(t.observations#>>'{entry_context_v736,planned_tp_ticks}')::integer;
 IF planned IS NOT NULL AND (p_exit_tp IS NOT NULL AND planned<>p_exit_tp OR p_reason='extended_tp') AND length(btrim(coalesce(p_tp_reason,'')))=0 THEN RAISE EXCEPTION 'Abweichung vom geplanten TP begründen'; END IF;
 payload:=jsonb_build_object('reason',p_reason,'actual_tp_ticks',p_exit_tp,'tp_reason',p_tp_reason,'note',p_note,'results',p_results);
 IF t.observations->'exit_completion_v813'=payload THEN RETURN jsonb_build_object('trade_id',t.id,'total_pnl_usd',t.realized_pnl_usd); END IF;
 IF coalesce(t.observations->>'results_pending_v808','false')<>'true' THEN RAISE EXCEPTION 'Keine offenen Ergebnisse'; END IF;
 IF jsonb_typeof(p_results) IS DISTINCT FROM 'array' OR pg_column_size(p_results)>60000 THEN RAISE EXCEPTION 'Ungültige Kontoergebnisse'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_results) LOOP
  aid:=(r->>'allocation_id')::uuid;
  SELECT * INTO a FROM public.trade_account_allocations WHERE id=aid AND trade_id=t.id AND owner_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Fremde Kontozuordnung'; END IF;
  rate:=t.observations->'fee_snapshot_v813'->aid::text;
  IF r->>'contract_sides' IS NOT NULL AND coalesce(r->>'contract_sides','') !~ '^[1-9][0-9]{0,7}$' THEN RAISE EXCEPTION 'Ungültige Kontraktseiten'; END IF;
  sides:=coalesce((r->>'contract_sides')::integer,a.planned_quantity*2);
  IF jsonb_typeof(r->'manual_fee_usd')='number' THEN fee:=(r->>'manual_fee_usd')::numeric;
  ELSIF rate->>'currency'='USD' THEN fee:=round((rate->>'amount')::numeric*sides/(CASE rate->>'basis' WHEN 'round_turn' THEN 2 ELSE 1 END),2);
  ELSE RAISE EXCEPTION 'USD-Gebühr für jedes Konto mit fehlendem USD-Tarif angeben'; END IF;
  fees:=fees||jsonb_build_object(aid,jsonb_build_object('schedule',rate,'contract_sides',sides,'actual_sides_documented',r->>'contract_sides' IS NOT NULL,'manual',jsonb_typeof(r->'manual_fee_usd')='number','fee_usd',fee));
  results:=results||jsonb_build_array(jsonb_build_object('allocation_id',aid,'realized_pnl_usd',r->'realized_pnl_usd','fees_usd',fee));
 END LOOP;
 outcome:=public.complete_trade_results_v808(t.id,results);
 UPDATE public.trades SET exit_reason=p_reason,
 observations=observations||jsonb_build_object('exit_completion_v813',payload,'fee_result_v813',fees,
 'exit_capture_v813',coalesce(observations->'exit_capture_v813','{}')||'{"reason_pending":false}'::jsonb)
 WHERE id=t.id AND owner_id=auth.uid();
 RETURN outcome;
END $$;

CREATE FUNCTION public.guard_workflow_v813() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF OLD.observations?'fee_snapshot_v813' AND NEW.observations->'fee_snapshot_v813' IS DISTINCT FROM OLD.observations->'fee_snapshot_v813' THEN RAISE EXCEPTION 'Fee snapshot is immutable'; END IF;
 IF OLD.observations?'fee_result_v813' AND (NEW.observations->'fee_result_v813' IS DISTINCT FROM OLD.observations->'fee_result_v813' OR NEW.observations->'exit_completion_v813' IS DISTINCT FROM OLD.observations->'exit_completion_v813') THEN RAISE EXCEPTION 'Result receipt is immutable'; END IF;
 IF OLD.observations?'exit_capture_v813' AND (NEW.exit_at IS DISTINCT FROM OLD.exit_at OR NEW.observations#>'{exit_capture_v813,requested_at}' IS DISTINCT FROM OLD.observations#>'{exit_capture_v813,requested_at}') THEN RAISE EXCEPTION 'Actual exit time is immutable'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_workflow_v813() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_workflow_v813 BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_workflow_v813();

REVOKE ALL ON FUNCTION public.record_trade_attempt_v813(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb),public.close_trade_v813(uuid,timestamptz,jsonb),public.complete_trade_v813(uuid,text,integer,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v813(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb,jsonb,jsonb),public.close_trade_v813(uuid,timestamptz,jsonb),public.complete_trade_v813(uuid,text,integer,text,text,jsonb) TO authenticated;
COMMIT;
