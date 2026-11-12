-- Apply ONLY after all live application entry points use V7.35.
-- The new RPC becomes the single entry API; its entire call chain validates auth.uid().
ALTER FUNCTION public.record_trade_attempt_v735(uuid,text,text,text,jsonb,text,uuid,text,uuid,jsonb) SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.record_trade_attempt_v733(uuid,text,text,text,jsonb,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.create_trade_with_risk_v732(uuid,text,text,text,jsonb,text) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.create_trade_with_allocations_v7(uuid,text,text,text,jsonb,text) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.create_trade_with_allocations(uuid,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE INSERT ON public.trades,public.trade_account_allocations,public.trade_attempts_v733 FROM authenticated;
REVOKE INSERT ON public.trade_entry_requests_v735 FROM authenticated;
