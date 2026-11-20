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
 denied:=false;BEGIN PERFORM public.record_trade_attempt_v813(s,'Momentum','NQ','long',allocs,'unreported',req,NULL,NULL,NULL,jsonb_set(ctx,'{ltf_v811,status}','"not_reviewed"'),NULL);EXCEPTION WHEN raise_exception THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Planned unreviewed LTF accepted';END IF;
 t:=public.record_trade_attempt_v813(s,'Momentum','NQ','long',allocs,'unreported',req,NULL,NULL,NULL,ctx,NULL);
 SELECT id INTO aid FROM public.trade_account_allocations WHERE trade_id=t AND account_id=a;
 SELECT id INTO bid FROM public.trade_account_allocations WHERE trade_id=t AND account_id=b;
 UPDATE public.trading_accounts SET fee_schedule_v813='{"NQ":{"amount":99,"basis":"side","currency":"USD"}}' WHERE id=a;
 IF public.record_trade_attempt_v813(s,'Momentum','NQ','long',allocs,'unreported',req,NULL,NULL,NULL,ctx,NULL)<>t THEN RAISE EXCEPTION 'Entry request was not idempotent';END IF;
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
 EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;
SELECT 'PASS V813 sparse LTF, immutable fee rates, partial-fill contract sides, exit time, TP reason, replay and user isolation' AS result;
