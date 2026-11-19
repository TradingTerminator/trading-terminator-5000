BEGIN;
DO $$
DECLARE u uuid:=gen_random_uuid();a uuid:=gen_random_uuid();sid uuid;old_sid uuid;result jsonb;ctx jsonb;plan jsonb;payload jsonb;closed_context jsonb;cycle integer;
BEGIN
 INSERT INTO auth.users(id,aud,role) VALUES(u,'authenticated','authenticated');
 INSERT INTO public.trading_accounts(id,owner_id,account_name,account_type,default_instrument,default_quantity,default_sl_ticks) VALUES(a,u,'V812 isolated','demo','MNQ',1,40);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 payload:=jsonb_build_object('selected_accounts',jsonb_build_array(jsonb_build_object('account_id',a,'instrument','MNQ','planned_quantity',1,'initial_sl_ticks',40)));
 FOR cycle IN 1..3 LOOP
  sid:=gen_random_uuid();result:=public.session_action_v810(sid,gen_random_uuid(),'start',payload,NULL);ctx:=result#>'{session,htf_context}';
  IF result#>>'{session,id}'<>sid::text OR ctx?'htf_v8' OR ctx?'mental_check' OR ctx?'preparation_v812' OR ctx?'htf_images_v8' THEN RAISE EXCEPTION 'Session inherited old preparation';END IF;
  IF old_sid IS NOT NULL AND EXISTS(SELECT 1 FROM public.trading_sessions WHERE id=old_sid AND (status<>'closed' OR htf_context IS DISTINCT FROM closed_context)) THEN RAISE EXCEPTION 'Starting next session rewrote old data';END IF;
  IF cycle=1 THEN
   plan:='{"schema_version":808,"news":"Keine relevanten News","sentiment":"neutral","direction":"long","setup_state":"no","technical":[{"key":"extremes","label":"Extrempunkte","checked":true,"assessment":"marked","note":""},{"key":"zones","label":"Zonen","checked":true,"assessment":"marked","note":""},{"key":"options","label":"Optionslevels","checked":true,"assessment":"marked","note":""}],"images":[],"warning_acknowledgements":{},"personal_plan":{"duration_minutes":90,"scope":"total","profit_goal":100,"loss_limit":120}}'::jsonb||'{"preparation_v812":{"overview_reviewed":true,"overview_reviewed_at":"2026-11-19T17:00:00Z"}}'::jsonb;
   result:=public.session_action_v810(sid,gen_random_uuid(),'confirm',jsonb_build_object('plan',plan,'context','{"mental_check":{"scales":{"focus":8,"pressure":1,"fatigue":1,"urge":1,"fear":1,"greed":1,"revenge":1,"frustration":1},"conscious_continue":false}}'::jsonb),ctx);
   IF result#>>'{session,htf_context,htf_v8,plan,preparation_v812,overview_reviewed}'<>'true' OR NOT EXISTS(SELECT 1 FROM public.trading_sessions WHERE id=sid AND htf_context#>>'{htf_v8,plan,preparation_v812,overview_reviewed}'='true') THEN RAISE EXCEPTION 'Review receipt not persisted for another client';END IF;
  END IF;
  result:=public.session_action_v810(sid,gen_random_uuid(),'close','{}',NULL);old_sid:=sid;closed_context:=result#>'{session,htf_context}';
 END LOOP;
 IF (SELECT count(*) FROM public.trading_sessions WHERE owner_id=u AND session_date=(clock_timestamp() AT TIME ZONE 'Europe/Berlin')::date AND status='closed')<>3 THEN RAISE EXCEPTION 'Multiple same-day sessions corrupted';END IF;
 EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;
SELECT 'PASS V812 first/complete/early/multiple-same-day sessions, neutral server initialization, immutable prior sessions and persisted cross-client progress receipt' AS result;
