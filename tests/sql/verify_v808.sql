-- Two synthetic identities and all fixture data exist only inside a rolled-back transaction.
-- Run after db/v8_08_preparation.sql within BEGIN ... ROLLBACK when checking a candidate.
DO $$
DECLARE a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); other_s uuid:=gen_random_uuid(); account_a uuid:=gen_random_uuid(); account_b uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid(); alloc uuid:=gen_random_uuid(); result jsonb; plan jsonb; context jsonb; expected jsonb; denied boolean; n integer; key text;
BEGIN
 INSERT INTO auth.users(id,aud,role) VALUES(a,'authenticated','authenticated'),(b,'authenticated','authenticated');
 INSERT INTO public.trading_sessions(id,owner_id,session_date,htf_context) VALUES(s,a,(clock_timestamp() AT TIME ZONE 'Europe/Berlin')::date,'{}'),(other_s,b,(clock_timestamp() AT TIME ZONE 'Europe/Berlin')::date,'{}');
 INSERT INTO public.trading_accounts(id,owner_id,account_name) VALUES(account_a,a,'V808 synthetic A'),(account_b,b,'V808 synthetic B');
 INSERT INTO public.v8_htf_preferences(owner_id,technical_points) VALUES(a,'[{"key":"zones","label":"A"}]'),(b,'[{"key":"zones","label":"B"}]');
 plan:=jsonb_build_object('schema_version',808,'news','Keine relevanten News','sentiment','neutral','direction','long','setup_state','no','technical','[{"key":"extremes","label":"Extrempunkte","checked":true,"assessment":"marked","note":""},{"key":"zones","label":"Zonen","checked":true,"assessment":"marked","note":""},{"key":"options","label":"Optionslevels","checked":true,"assessment":"unavailable","note":"Keine Daten verfügbar"}]'::jsonb,'images','[]'::jsonb,'personal_plan',jsonb_build_object('duration_minutes',90,'started_at',clock_timestamp()-interval '2 hours','end_at',clock_timestamp()-interval '30 minutes','profit_goal',null,'loss_limit',null,'scope','per_account'));
 -- Use one exact timestamp pair rather than two clock_timestamp calls.
 plan:=jsonb_set(plan,'{personal_plan,end_at}',to_jsonb((plan#>>'{personal_plan,started_at}')::timestamptz+interval '90 minutes'));
 context:='{"mental_check":{"scales":{"focus":8,"pressure":2,"fatigue":2,"urge":2,"fear":2,"greed":2,"revenge":2,"frustration":2},"conscious_continue":false}}';
 INSERT INTO public.trades(id,owner_id,session_id,setup_type,instrument,direction) VALUES(tid,a,s,'Synthetic','MNQ','long');
 INSERT INTO public.trade_account_allocations(id,owner_id,trade_id,account_id,instrument,planned_quantity,initial_sl_points,initial_risk_usd,calculated_risk_usd) VALUES(alloc,a,tid,account_a,'MNQ',1,10,20,20);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 SELECT htf_context INTO expected FROM public.trading_sessions WHERE id=s;
 result:=public.save_htf_assessment_v808(sid,s,expected,plan,context);
 IF result#>>'{assessment,id}'<>sid::text THEN RAISE EXCEPTION 'Missing save acknowledgement'; END IF;
 result:=public.save_htf_assessment_v808(sid,s,'{}',plan,context);
 SELECT count(*) INTO n FROM public.v8_htf_assessments WHERE id=sid;
 IF n<>1 THEN RAISE EXCEPTION 'Retry duplicated assessment'; END IF;
 SELECT htf_context INTO expected FROM public.trading_sessions WHERE id=s;
 denied:=false;BEGIN PERFORM public.save_htf_assessment_v808(gen_random_uuid(),s,expected,plan,jsonb_set(context,'{mental_check,scales,fear}','9'));EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='Warnhinweis einzeln bestätigen: fear';END;IF NOT denied THEN RAISE EXCEPTION 'Unacknowledged warning accepted';END IF;
 denied:=false;BEGIN PERFORM public.save_htf_assessment_v808(gen_random_uuid(),s,expected,jsonb_set(plan,'{personal_plan,duration_minutes}','0'),context);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='Handelsdauer 5–720 Minuten';END;
 IF NOT denied THEN RAISE EXCEPTION 'Invalid duration accepted';END IF;
 FOR key IN SELECT unnest(ARRAY['fear','greed','revenge','frustration']) LOOP
  denied:=false;BEGIN PERFORM public.save_htf_assessment_v808(gen_random_uuid(),s,expected,plan,context#-ARRAY['mental_check','scales',key]);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='Mentale Verfassung vollständig bewerten';END;
  IF NOT denied THEN RAISE EXCEPTION 'Missing emotion accepted: %',key;END IF;
 END LOOP;
 denied:=false;BEGIN PERFORM public.save_htf_assessment_v808(gen_random_uuid(),s,expected,jsonb_set(plan,'{technical,2,note}','""'),context);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE 'Chart-Markierung%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Unavailable option level accepted without reason';END IF;
 denied:=false;BEGIN PERFORM public.save_htf_assessment_v808(gen_random_uuid(),s,expected,jsonb_set(plan,'{images}',jsonb_build_array(b::text||'/session/'||other_s::text||'/foreign.png')),context);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='Bild gehört nicht zu dieser Handelssession';END;
 IF NOT denied THEN RAISE EXCEPTION 'Foreign screenshot accepted';END IF;
 SELECT count(*) INTO n FROM public.trading_sessions WHERE id=other_s;
 IF n<>0 THEN RAISE EXCEPTION 'Foreign session visible';END IF;
 SELECT count(*) INTO n FROM public.trading_accounts WHERE id=account_b;
 IF n<>0 THEN RAISE EXCEPTION 'Foreign account visible';END IF;
 SELECT count(*) INTO n FROM public.v8_htf_preferences WHERE owner_id=b;
 IF n<>0 THEN RAISE EXCEPTION 'Foreign preferences visible';END IF;
 result:=public.close_trade_pending_v808(tid,'manual','{"fear":1,"stress":2,"greed":1,"frustration":1,"relief":5,"uncertain":2}');
 IF result->>'pending'<>'true' OR NOT EXISTS(SELECT 1 FROM public.trades WHERE id=tid AND exit_at IS NOT NULL AND realized_pnl_usd IS NULL) THEN RAISE EXCEPTION 'Deferred exit lost unknown P&L';END IF;
 result:=public.close_trade_pending_v808(tid,'manual','{"fear":1,"stress":2,"greed":1,"frustration":1,"relief":5,"uncertain":2}');
 denied:=false;BEGIN PERFORM public.complete_trade_results_v808(tid,jsonb_build_array(jsonb_build_object('allocation_id',alloc,'realized_pnl_usd',25,'fees_usd',null)));EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='P&L und Gebühren ausdrücklich eingeben';END;
 IF NOT denied THEN RAISE EXCEPTION 'Unknown fees accepted';END IF;
 result:=public.complete_trade_results_v808(tid,jsonb_build_array(jsonb_build_object('allocation_id',alloc,'realized_pnl_usd',25,'fees_usd',2)));
 IF result->>'total_pnl_usd'<>'25' OR NOT EXISTS(SELECT 1 FROM public.trade_account_allocations WHERE id=alloc AND initial_risk_usd=20) THEN RAISE EXCEPTION 'Finalization changed original risk';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.trades WHERE id=tid;IF n<>0 THEN RAISE EXCEPTION 'Foreign trade visible';END IF;
 SELECT count(*) INTO n FROM public.account_trade_results WHERE allocation_id=alloc;IF n<>0 THEN RAISE EXCEPTION 'Foreign P&L visible';END IF;
 SELECT count(*) INTO n FROM public.v8_htf_assessments WHERE id=sid;
 IF n<>0 THEN RAISE EXCEPTION 'Foreign assessment visible';END IF;
 denied:=false;BEGIN PERFORM public.save_htf_assessment_v808(gen_random_uuid(),s,expected,plan,context);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='Handelssession nicht verfügbar';END;
 IF NOT denied THEN RAISE EXCEPTION 'Foreign RPC allowed';END IF;
 denied:=false;BEGIN PERFORM public.complete_trade_results_v808(tid,'[]');EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='Trade nicht verfügbar';END;IF NOT denied THEN RAISE EXCEPTION 'Foreign result finalization allowed';END IF;
 IF has_function_privilege('anon','public.save_htf_assessment_v808(uuid,uuid,jsonb,jsonb,jsonb)','execute') THEN RAISE EXCEPTION 'Anonymous RPC allowed';END IF;
 EXECUTE 'RESET ROLE';
 denied:=false;BEGIN UPDATE public.trades SET realized_pnl_usd=NULL,observations=observations-'results_pending_v808' WHERE id=tid;EXCEPTION WHEN check_violation THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Legacy exit result invariant weakened';END IF;
END $$;
SELECT 'V808 SQL assertions passed; caller must roll back fixtures' AS result;
