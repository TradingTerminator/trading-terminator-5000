BEGIN;
DO $$
DECLARE u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();s uuid:=gen_random_uuid();a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();req uuid:=gen_random_uuid();t uuid;aid uuid;bid uuid;
 allocs jsonb;ctx jsonb;scales jsonb:='{"fear":2,"stress":3,"greed":1,"frustration":1,"relief":6,"uncertain":3,"satisfaction":5,"calm":7,"confidence":8,"euphoria":1}';
 results jsonb;answer jsonb;exit_time timestamptz;denied boolean;
BEGIN
 INSERT INTO auth.users(id,aud,role) VALUES(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 INSERT INTO public.trading_accounts(id,owner_id,account_name,account_type,default_instrument,default_quantity,default_sl_ticks,fee_schedule_v813)
 VALUES(a,u,'NQ 813','demo','NQ',1,40,'{"NQ":{"amount":2.125,"basis":"side","currency":"USD"}}'),
       (b,u,'MNQ 813','demo','MNQ',3,20,'{"MNQ":{"amount":1.56,"basis":"round_turn","currency":"USD","valid_from":"2000-01-01"}}');
 INSERT INTO public.trading_sessions(id,owner_id,session_date,status,htf_context)
 VALUES(s,u,(clock_timestamp() AT TIME ZONE 'Europe/Berlin')::date,'open',
 jsonb_build_object('selected_accounts',jsonb_build_array(jsonb_build_object('account_id',a),jsonb_build_object('account_id',b)),
 'htf_v8',jsonb_build_object('id',gen_random_uuid(),'plan',jsonb_build_object('personal_plan',jsonb_build_object('end_at',clock_timestamp()+interval '1 hour','scope','total')))));
 allocs:=jsonb_build_array(jsonb_build_object('account_id',a,'instrument','NQ','planned_quantity',1,'initial_sl_ticks',40,'role','leader'),
 jsonb_build_object('account_id',b,'instrument','MNQ','planned_quantity',3,'initial_sl_ticks',20,'role','follower'));
 ctx:='{"capture_version":737,"documented_after_execution":false,"recording_mode":"planned","execution_mode":"copy","emotion_scales":{"focus":5,"pressure":5,"fomo":5,"revenge":5,"fear":5,"greed":5},"planned_tp_ticks":80,"ltf_v811":{"schema":813,"status":"reviewed","values":{"delta":"neutral","cvd":"not_relevant","liquidity_target":"above"},"images":[]}}';
 IF NOT public.valid_ltf_v811(ctx->'ltf_v811') OR public.valid_ltf_v811(jsonb_set(ctx->'ltf_v811','{values,delta}','"fake"')) THEN RAISE EXCEPTION 'Invalid sparse LTF validator'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 ctx:=jsonb_set(ctx,'{ltf_v811}','{"schema":813,"status":"not_reviewed","timing":"pending","values":{},"images":[]}'::jsonb);
 t:=public.record_trade_attempt_v814(s,'Momentum','NQ','long',allocs,'unreported',req,NULL,NULL,NULL,ctx,NULL);
 answer:=public.finish_ltf_v814(t,'reviewed','{"delta":"positive"}');
 IF answer->>'timing'<>'after_entry' OR public.finish_ltf_v814(t,'reviewed','{"delta":"positive"}')<>answer THEN RAISE EXCEPTION 'Nachträgliche Analyse oder Replay falsch'; END IF;
 IF (SELECT observations#>>'{entry_context_v736,ltf_v811,timing}' FROM public.trades WHERE id=t)<>'pending' THEN RAISE EXCEPTION 'Ursprüngliche Entry-Analyse überschrieben'; END IF;
 IF (SELECT playbook_reference_v814 FROM public.trades WHERE id=t) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Unexpected default reference';END IF;
 UPDATE public.trades SET playbook_reference_v814=true WHERE id=t AND NOT playbook_reference_v814;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unable to mark reference';END IF;
 SELECT id INTO aid FROM public.trade_account_allocations WHERE trade_id=t AND account_id=a;
 SELECT id INTO bid FROM public.trade_account_allocations WHERE trade_id=t AND account_id=b;
 UPDATE public.trading_accounts SET fee_schedule_v813='{"NQ":{"amount":99,"basis":"side","currency":"USD"}}' WHERE id=a;
 IF public.record_trade_attempt_v814(s,'Momentum','NQ','long',allocs,'unreported',req,NULL,NULL,NULL,ctx,NULL)<>t THEN RAISE EXCEPTION 'Entry request was not idempotent';END IF;
 IF (SELECT observations#>>ARRAY['fee_snapshot_v813',aid::text,'amount'] FROM public.trades WHERE id=t)<>'2.125' THEN RAISE EXCEPTION 'Fee snapshot changed';END IF;
 exit_time:=clock_timestamp();
 answer:=public.close_trade_v813(t,exit_time,scales);
 IF public.close_trade_v813(t,exit_time,scales)<>answer OR NOT EXISTS(SELECT FROM public.trades WHERE id=t AND exit_at=exit_time AND realized_pnl_usd IS NULL AND observations#>>'{exit_capture_v813,reason_pending}'='true') THEN RAISE EXCEPTION 'Exit was not a standalone replayable transaction'; END IF;
 results:=jsonb_build_array(jsonb_build_object('allocation_id',aid,'realized_pnl_usd',100),jsonb_build_object('allocation_id',bid,'realized_pnl_usd',10,'contract_sides',8));
 denied:=false;BEGIN PERFORM public.complete_trade_v813(t,'extended_tp',85,NULL,NULL,results);EXCEPTION WHEN raise_exception THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'TP change accepted without reason'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v,'role','authenticated')::text,true);
 denied:=false;BEGIN PERFORM public.complete_trade_v813(t,'TP',80,NULL,NULL,results);EXCEPTION WHEN raise_exception THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Foreign result accepted'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 answer:=public.complete_trade_v813(t,'extended_tp',85,'Fortgesetzter Impuls',NULL,results);
 IF public.complete_trade_v813(t,'extended_tp',85,'Fortgesetzter Impuls',NULL,results)<>answer THEN RAISE EXCEPTION 'Result replay changed';END IF;
 IF NOT EXISTS(SELECT FROM public.trades WHERE id=t AND initial_risk_usd=230 AND realized_pnl_usd=110 AND exit_reason='extended_tp') THEN RAISE EXCEPTION 'Trade totals/state invalid'; END IF;
 IF (SELECT fees_usd FROM public.account_trade_results WHERE allocation_id=aid)<>4.25 OR (SELECT fees_usd FROM public.account_trade_results WHERE allocation_id=bid)<>6.24 THEN RAISE EXCEPTION 'Fee formula incorrect';END IF;
 DECLARE ticket uuid; generation text; outcome jsonb; original_name text:='Eigene Strategie'; BEGIN
 INSERT INTO public.trading_setup_catalog(owner_id,name) VALUES(u,original_name);
 EXECUTE 'RESET ROLE';PERFORM set_config('request.jwt.claims','{}',true);
 INSERT INTO public.test_setups_v8141(owner_id,name,source_id,source_data) VALUES(u,'A',a,'{}'),(v,'B',b,'{}') ON CONFLICT(owner_id,source_id) DO NOTHING;
 INSERT INTO public.test_setups_v8141(owner_id,name,source_id,source_data) VALUES(u,'A',a,'{}') ON CONFLICT(owner_id,source_id) DO NOTHING;
 INSERT INTO storage.objects(bucket_id,name) VALUES('trading-chart-screenshots',u::text||'/trade/'||t::text||'/old.png'),('trading-chart-screenshots',v::text||'/trade/keep/old.png');
 EXECUTE 'SET LOCAL ROLE authenticated';PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 IF (SELECT count(*) FROM public.test_setups_v8141)<>1 OR public.tt_remove_tests_v8141(ARRAY(SELECT id FROM public.test_setups_v8141))<>1 THEN RAISE EXCEPTION 'Fixture isolation failed';END IF;
 IF NOT EXISTS(SELECT FROM public.trading_setup_catalog WHERE owner_id=u) OR NOT EXISTS(SELECT FROM public.trades WHERE id=t) THEN RAISE EXCEPTION 'Personal history removed';END IF;
 ticket:=public.tt_prepare_reset_v8141();
 IF NOT EXISTS(SELECT FROM public.trades WHERE id=t) THEN RAISE EXCEPTION 'Preparation modified data';END IF;
 denied:=false;BEGIN PERFORM public.tt_begin_reset_v8141(ticket,'falsch');EXCEPTION WHEN raise_exception THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Bad phrase accepted';END IF;
 outcome:=public.tt_begin_reset_v8141(ticket,'ALLES ENDGÜLTIG LÖSCHEN');generation:=outcome->>'generation';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v,'role','authenticated')::text,true);
 denied:=false;BEGIN PERFORM public.tt_finish_reset_v8141(ticket);EXCEPTION WHEN raise_exception THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Foreign reset accepted';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 denied:=false;BEGIN PERFORM public.tt_finish_reset_v8141(ticket);EXCEPTION WHEN raise_exception THEN denied:=true;END;
 IF NOT denied OR (SELECT count(*) FROM public.tt_reset_files_v8141(ticket))<>1 THEN RAISE EXCEPTION 'Storage guard failed';END IF;
 EXECUTE 'RESET ROLE';
 DELETE FROM storage.objects WHERE bucket_id='trading-chart-screenshots' AND name=u::text||'/trade/'||t::text||'/old.png';
 EXECUTE 'SET LOCAL ROLE authenticated';
 outcome:=public.tt_finish_reset_v8141(ticket);
 IF outcome->>'phase'<>'ready' OR EXISTS(SELECT FROM public.trades WHERE id=t) OR EXISTS(SELECT FROM public.trading_setup_catalog WHERE owner_id=u) THEN RAISE EXCEPTION 'Reset incomplete';END IF;
 IF public.tt_finish_reset_v8141(ticket)<>outcome THEN RAISE EXCEPTION 'Retry mismatch';END IF;
 denied:=false;BEGIN INSERT INTO public.trading_setup_catalog(owner_id,name) VALUES(u,'stale');EXCEPTION WHEN serialization_failure THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Offline replay accepted';END IF;
 PERFORM set_config('request.headers',jsonb_build_object('x-tt-generation',generation)::text,true);
 INSERT INTO public.trading_setup_catalog(owner_id,name) VALUES(u,'fresh');EXECUTE 'RESET ROLE';IF NOT EXISTS(SELECT FROM auth.users WHERE id=u) OR NOT EXISTS(SELECT FROM public.test_setups_v8141 WHERE owner_id=v) OR NOT EXISTS(SELECT FROM storage.objects WHERE name=v::text||'/trade/keep/old.png') THEN RAISE EXCEPTION 'Isolation failed';END IF;END;
 EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;
SELECT 'PASS authenticated reset, stale writes, trading history, account isolation, retry and fresh setup' AS result;
