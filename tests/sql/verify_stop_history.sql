-- Verification only; all synthetic rows are rolled back by the inner exception.
-- Run with an administrative connection. Never targets an existing trade.
DO $$
DECLARE
 owner_id uuid; other_id uuid := gen_random_uuid();
 session_id uuid := gen_random_uuid(); account_id uuid := gen_random_uuid();
 trade_id uuid := gen_random_uuid(); allocation_id uuid := gen_random_uuid(); adjustment_id uuid;
 checks jsonb := '{}'; n integer; rejected boolean;
BEGIN
 BEGIN
  SELECT u.id INTO STRICT owner_id FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM public.trading_sessions s WHERE s.owner_id=u.id AND s.status='open')
   ORDER BY u.created_at LIMIT 1;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  INSERT INTO public.trading_sessions(id,owner_id,session_date) VALUES(session_id,owner_id,current_date);
  INSERT INTO public.trading_accounts(id,owner_id,account_name,account_type,default_instrument,default_quantity)
   VALUES(account_id,owner_id,'ROLLBACK verification fixture','demo','MNQ',1);
  INSERT INTO public.trades(id,owner_id,session_id,setup_type,instrument,direction)
   VALUES(trade_id,owner_id,session_id,'Verification fixture','MNQ','long');
  INSERT INTO public.trade_account_allocations(id,owner_id,trade_id,account_id,role,instrument,planned_quantity,initial_sl_points,calculated_risk_usd,initial_risk_usd)
   VALUES(allocation_id,owner_id,trade_id,account_id,'leader','MNQ',1,10,20,20);
  UPDATE public.trades SET initial_risk_usd=20 WHERE id=trade_id;
  EXECUTE 'SET LOCAL ROLE authenticated';
  adjustment_id := public.record_stop_adjustment(allocation_id,-40,-20,'profit_protection',NULL);
  SELECT count(*) INTO n FROM public.stop_adjustments WHERE id=adjustment_id;
  checks := checks || jsonb_build_object('open_trade_rpc_and_owner_read',n=1);
  rejected := false;
  BEGIN
   INSERT INTO public.stop_adjustments(owner_id,trade_id,allocation_id,adjustment_type,reason,previous_stop_ticks,new_stop_ticks)
    VALUES(owner_id,trade_id,allocation_id,'break_even','profit_protection',-20,0);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  checks := checks || jsonb_build_object('direct_insert_denied',rejected);
  rejected := false;
  BEGIN UPDATE public.stop_adjustments SET notes='tamper' WHERE id=adjustment_id;
  EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  checks := checks || jsonb_build_object('direct_update_denied',rejected);
  rejected := false;
  BEGIN DELETE FROM public.stop_adjustments WHERE id=adjustment_id;
  EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  checks := checks || jsonb_build_object('direct_delete_denied',rejected);
  rejected := false;
  BEGIN PERFORM public.record_stop_adjustment(allocation_id,-40,0,'profit_protection',NULL);
  EXCEPTION WHEN raise_exception THEN rejected := SQLERRM LIKE 'Stop changed since last refresh.%'; END;
  checks := checks || jsonb_build_object('stale_previous_stop_rejected',rejected);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.stop_adjustments WHERE id=adjustment_id;
  checks := checks || jsonb_build_object('other_owner_cannot_read',n=0);
  rejected := false;
  BEGIN PERFORM public.record_stop_adjustment(allocation_id,-20,0,'profit_protection',NULL);
  EXCEPTION WHEN raise_exception THEN rejected := SQLERRM='Allocation not found'; END;
  checks := checks || jsonb_build_object('other_owner_rpc_denied',rejected);
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  UPDATE public.trades SET exit_at=clock_timestamp(),exit_reason='manual',realized_pnl_usd=0 WHERE id=trade_id;
  EXECUTE 'SET LOCAL ROLE authenticated';
  rejected := false;
  BEGIN PERFORM public.record_stop_adjustment(allocation_id,-20,0,'profit_protection',NULL);
  EXCEPTION WHEN raise_exception THEN rejected := SQLERRM='Trade is already closed'; END;
  checks := checks || jsonb_build_object('closed_trade_rpc_denied',rejected);
  SELECT count(*) INTO n FROM public.trade_account_allocations a
   JOIN public.trades t ON t.id=a.trade_id
   WHERE a.id=allocation_id AND a.initial_sl_points=10 AND a.initial_risk_usd=20 AND t.initial_risk_usd=20;
  checks := checks || jsonb_build_object('initial_risk_unchanged',n=1);
  RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='rollback_synthetic_fixture';
 EXCEPTION WHEN SQLSTATE 'P0002' THEN
  IF SQLERRM <> 'rollback_synthetic_fixture' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM public.trading_sessions WHERE id=session_id;
 checks := checks || jsonb_build_object('fixture_rolled_back',n=0);
 IF EXISTS(SELECT 1 FROM jsonb_each(checks) WHERE value <> 'true'::jsonb) THEN
  RAISE EXCEPTION 'Verification failed: %',checks;
 END IF;
 PERFORM set_config('tt.sl_test_results',checks::text,true);
END $$;
SELECT current_setting('tt.sl_test_results')::jsonb AS verification;
