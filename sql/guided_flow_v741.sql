-- Additive migration: immutable session-local trade number, setup rules and server-owned configuration history.
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS session_trade_no integer;
WITH ranked AS (SELECT id,row_number() OVER(PARTITION BY session_id ORDER BY entry_at,created_at,id)::integer AS n FROM public.trades WHERE session_id IS NOT NULL)
UPDATE public.trades t SET session_trade_no=r.n FROM ranked r WHERE t.id=r.id AND t.session_trade_no IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trades_session_number_v741 ON public.trades(session_id,session_trade_no) WHERE session_trade_no IS NOT NULL;
CREATE OR REPLACE FUNCTION public.number_session_trade_v741() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.session_trade_no IS DISTINCT FROM OLD.session_trade_no OR NEW.session_id IS DISTINCT FROM OLD.session_id THEN RAISE EXCEPTION 'Session and trade number are immutable'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.session_id IS NULL THEN NEW.session_trade_no:=NULL; RETURN NEW; END IF;
 -- Lock the parent row: concurrent inserts into one session serialize, independently of account/copy mode.
 PERFORM id FROM public.trading_sessions WHERE id=NEW.session_id AND owner_id=NEW.owner_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session is not accessible'; END IF;
 SELECT coalesce(max(session_trade_no),0)+1 INTO NEW.session_trade_no FROM public.trades WHERE session_id=NEW.session_id;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS number_session_trade_v741 ON public.trades;
CREATE TRIGGER number_session_trade_v741 BEFORE INSERT OR UPDATE OF session_id,session_trade_no ON public.trades FOR EACH ROW EXECUTE FUNCTION public.number_session_trade_v741();
REVOKE ALL ON FUNCTION public.number_session_trade_v741() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.number_session_trade_v741() TO authenticated;
ALTER TABLE public.trading_setup_catalog ADD COLUMN IF NOT EXISTS rules jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.valid_setup_rules_v741(v jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT jsonb_typeof(v)='object' AND NOT EXISTS(SELECT 1 FROM jsonb_each(CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}' END) e WHERE key NOT IN ('context','trigger','target','invalidation','avoid') OR jsonb_typeof(value)<>'string' OR length(value#>>'{}')>1000)
$$;
ALTER TABLE public.trading_setup_catalog ADD CONSTRAINT setup_rules_valid_v741 CHECK (public.valid_setup_rules_v741(rules));
REVOKE ALL ON FUNCTION public.valid_setup_rules_v741(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.valid_setup_rules_v741(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.audit_session_accounts_v741() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE old_config jsonb;new_config jsonb;history jsonb;
BEGIN
 new_config:=coalesce(NEW.htf_context->'selected_accounts','[]'::jsonb);
 IF TG_OP='INSERT' THEN old_config:='[]';history:='[]'; ELSE old_config:=coalesce(OLD.htf_context->'selected_accounts','[]'::jsonb);history:=coalesce(OLD.htf_context->'account_configuration_history','[]'::jsonb);END IF;
 IF old_config IS DISTINCT FROM new_config THEN
  history:=history||jsonb_build_array(jsonb_build_object('changed_at',transaction_timestamp(),'previous',old_config,'next',new_config));
 END IF;
 NEW.htf_context:=coalesce(NEW.htf_context,'{}'::jsonb)||jsonb_build_object('account_configuration_history',history);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS audit_session_accounts_v741 ON public.trading_sessions;
CREATE TRIGGER audit_session_accounts_v741 BEFORE INSERT OR UPDATE OF htf_context ON public.trading_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_session_accounts_v741();
REVOKE ALL ON FUNCTION public.audit_session_accounts_v741() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.audit_session_accounts_v741() TO authenticated;
ALTER TABLE public.training_goals_v7 ADD COLUMN IF NOT EXISTS revised_from_id uuid REFERENCES public.training_goals_v7(id);
CREATE OR REPLACE FUNCTION public.revise_training_focus_v741(p_request_id uuid,p_expected_id uuid,p_goal text) RETURNS public.training_goals_v7 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE uid uuid:=auth.uid(); prior public.training_goals_v7; saved public.training_goals_v7;
BEGIN
 IF uid IS NULL OR p_request_id IS NULL OR length(btrim(coalesce(p_goal,''))) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'Valid rule and authentication required';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,735));
 SELECT * INTO saved FROM public.training_goals_v7 WHERE id=p_request_id AND owner_id=uid;
 IF FOUND THEN
  IF saved.goal IS DISTINCT FROM btrim(p_goal) OR saved.revised_from_id IS DISTINCT FROM p_expected_id OR saved.status<>'active' THEN RAISE EXCEPTION 'Revision request changed or is no longer active';END IF;RETURN saved;
 END IF;
 SELECT * INTO prior FROM public.training_goals_v7 WHERE owner_id=uid AND status='active' FOR UPDATE;
 IF prior.id IS DISTINCT FROM p_expected_id OR prior.id IS NULL THEN RAISE EXCEPTION 'Training focus changed; reload';END IF;
 UPDATE public.training_goals_v7 SET status='replaced',updated_at=transaction_timestamp() WHERE id=prior.id;
 INSERT INTO public.training_goals_v7(id,owner_id,goal,status,source_trade_id,source_error_id,error_type,revised_from_id)
 VALUES(p_request_id,uid,btrim(p_goal),'active',prior.source_trade_id,prior.source_error_id,prior.error_type,prior.id) RETURNING * INTO saved;
 RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.revise_training_focus_v741(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revise_training_focus_v741(uuid,uuid,text) TO authenticated;
