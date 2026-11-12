-- Execute in the SAME transaction as the migration, then ROLLBACK.
CREATE TEMP TABLE tt_test_results(name text,result jsonb);
GRANT SELECT,INSERT ON tt_test_results TO authenticated;
CREATE FUNCTION pg_temp.expect_rejection(statement text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE msg text;
BEGIN
 BEGIN EXECUTE statement;EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RETURN msg;END;
 RAISE EXCEPTION 'TEST FAILED: operation unexpectedly accepted: %',statement;
END $$;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',(SELECT id FROM auth.users LIMIT 1),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
WITH s AS(INSERT INTO public.trading_sessions(session_date,status) VALUES('2099-02-01','open') RETURNING id) SELECT set_config('tt_test.session',id::text,true) FROM s;
WITH s AS(INSERT INTO public.trading_sessions(session_date,status) VALUES('2099-02-02','open') RETURNING id) SELECT set_config('tt_test.session2',id::text,true) FROM s;
WITH a AS(INSERT INTO public.trading_accounts(account_name,account_type,default_instrument,default_quantity) VALUES('TEMP_SECURITY_V735','demo','MNQ',1) RETURNING id) SELECT set_config('tt_test.account',id::text,true) FROM a;
SELECT set_config('tt_test.request',gen_random_uuid()::text,true);
SELECT set_config('tt_test.allocations',jsonb_build_array(jsonb_build_object('account_id',current_setting('tt_test.account'),'role','leader','instrument','MNQ','planned_quantity',1,'initial_sl_ticks',40))::text,true);
SELECT set_config('tt_test.trade',public.record_trade_attempt_v735(current_setting('tt_test.session')::uuid,'TEST','MNQ','long',current_setting('tt_test.allocations')::jsonb,'plan',current_setting('tt_test.request')::uuid)::text,true);
INSERT INTO tt_test_results SELECT 'risk_update_rejected',to_jsonb(pg_temp.expect_rejection(format('update public.trades set initial_risk_usd=1 where id=%L',current_setting('tt_test.trade'))));
INSERT INTO tt_test_results SELECT 'instrument_rejected',to_jsonb(pg_temp.expect_rejection(format('update public.trade_account_allocations set instrument=''UNSUPPORTED'' where trade_id=%L',current_setting('tt_test.trade'))));
INSERT INTO tt_test_results SELECT 'idempotent_retry',to_jsonb(public.record_trade_attempt_v735(current_setting('tt_test.session')::uuid,'TEST','MNQ','long',current_setting('tt_test.allocations')::jsonb,'plan',current_setting('tt_test.request')::uuid)::text=current_setting('tt_test.trade'));
DO $$DECLARE i int;v uuid;BEGIN FOR i IN 1..6 LOOP v:=public.record_trade_attempt_v735(current_setting('tt_test.session2')::uuid,'TEST','MNQ','long',current_setting('tt_test.allocations')::jsonb,'plan',gen_random_uuid(),CASE WHEN i=6 THEN 'Geprüfte Ausnahme' ELSE NULL END);END LOOP;PERFORM set_config('tt_test.last',v::text,true);END $$;
INSERT INTO tt_test_results SELECT 'day_limit_across_sessions',jsonb_build_object('all_counted',(SELECT (observations->'limit_exception'->>'day_trade_number')::int>=7 FROM public.trades WHERE id=current_setting('tt_test.last')::uuid),'needs_review',(SELECT observations->'limit_exception'->>'review_required'='true' FROM public.trades WHERE id=current_setting('tt_test.last')::uuid),'not_automatically_breach',(SELECT NOT rule_deviation FROM public.trades WHERE id=current_setting('tt_test.last')::uuid));
INSERT INTO tt_test_results SELECT 'countermeasure_required',to_jsonb(pg_temp.expect_rejection(format('update public.trades set observations=observations||''{"compliance_reviewed":true,"review_errors":[{"type":"fomo","countermeasure":"","confirmed_breach":true}]}''::jsonb,rule_deviation=true where id=%L',current_setting('tt_test.trade'))));
UPDATE public.trades SET observations=observations||jsonb_build_object('compliance_reviewed',true,'review_errors',jsonb_build_array(jsonb_build_object('id','f1','type','fomo','countermeasure','Wenn FOMO, dann warten','confirmed_breach',true),jsonb_build_object('id','f2','type','poor_entry','countermeasure','Wenn Trigger fehlt, dann warten','confirmed_breach',true))),rule_deviation=true WHERE id=current_setting('tt_test.trade')::uuid;
INSERT INTO tt_test_results SELECT 'two_errors_saved',to_jsonb(jsonb_array_length(observations->'review_errors')=2) FROM public.trades WHERE id=current_setting('tt_test.trade')::uuid;
INSERT INTO tt_test_results SELECT 'snapshot_complete',jsonb_build_object('table_count',jsonb_array_length(jsonb_path_query_array(public.export_journal_snapshot_v735(),'$.tables.keyvalue()')),'own_only',NOT EXISTS(SELECT 1 FROM jsonb_each(public.export_journal_snapshot_v735()->'tables') tab CROSS JOIN LATERAL jsonb_array_elements(tab.value) row WHERE row->>'owner_id'<>auth.uid()::text));
SELECT set_config('tt_test.stop_trade',public.record_trade_attempt_v735(current_setting('tt_test.session')::uuid,'TEST','MNQ','long',current_setting('tt_test.allocations')::jsonb,'plan',gen_random_uuid(),'Geprüfte Tagesausnahme')::text,true);
SELECT set_config('tt_test.stop_allocation',(SELECT id::text FROM public.trade_account_allocations WHERE trade_id=current_setting('tt_test.stop_trade')::uuid),true);
SELECT public.record_stop_adjustment(current_setting('tt_test.stop_allocation')::uuid,-40,-60,'market_structure',NULL);
INSERT INTO tt_test_results SELECT 'risk_widening_documented_without_block',jsonb_build_object('breach',rule_deviation,'initial_risk_unchanged',initial_risk_usd=20,'review_pending',observations->>'compliance_reviewed'='false') FROM public.trades WHERE id=current_setting('tt_test.stop_trade')::uuid;
INSERT INTO tt_test_results SELECT 'risk_widening_requires_review',to_jsonb(pg_temp.expect_rejection(format('update public.trades set observations=observations||''{"compliance_reviewed":true,"review_errors":[],"exception_reviews":{"daily-limit":"accepted"}}''::jsonb,rule_deviation=false where id=%L',current_setting('tt_test.stop_trade'))));
SELECT public.close_trade_with_emotions_v7(current_setting('tt_test.stop_trade')::uuid,'TP',jsonb_build_array(jsonb_build_object('allocation_id',current_setting('tt_test.stop_allocation'),'realized_pnl_usd',10,'fees_usd',1)),ARRAY['disciplined']);
INSERT INTO tt_test_results SELECT 'profitable_exit_remains_breach',jsonb_build_object('pnl',realized_pnl_usd,'breach',rule_deviation,'original_risk',initial_risk_usd) FROM public.trades WHERE id=current_setting('tt_test.stop_trade')::uuid;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',true);
INSERT INTO tt_test_results SELECT 'foreign_snapshot_empty',to_jsonb(NOT EXISTS(SELECT 1 FROM jsonb_each(public.export_journal_snapshot_v735()->'tables') t WHERE jsonb_array_length(t.value)>0));
SELECT jsonb_agg(to_jsonb(t)) AS verification FROM tt_test_results t;
