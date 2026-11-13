-- Proposal only: shared V7/V8 database privileges. Not applied.
-- Both released clients read history directly and write via record_stop_adjustment.
-- This removes direct client INSERT/UPDATE/DELETE; the existing SECURITY DEFINER
-- RPC retains ownership checks, closed-trade protection and optimistic concurrency.
BEGIN;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.stop_adjustments FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_stop_adjustment(uuid, integer, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_stop_adjustment(uuid, integer, integer, text, text) TO authenticated;
COMMIT;
-- Before applying: confirm current grants/RPC definition and backup privileges.
-- After applying: verify SELECT history remains allowed for its owner, direct
-- mutations are denied, open-trade RPC succeeds, and closed-trade RPC rejects.
-- Verify with isolated fixtures, never by modifying a real trade.
