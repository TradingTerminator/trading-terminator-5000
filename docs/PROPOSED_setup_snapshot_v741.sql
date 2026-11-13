-- NOT APPLIED: native migration request declined. Do not include in release prerequisites.
ALTER TABLE public.trade_ideas_v733 ADD COLUMN IF NOT EXISTS setup_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.capture_idea_setup_v741() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE snapshot jsonb;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.setup_snapshot IS DISTINCT FROM OLD.setup_snapshot THEN RAISE EXCEPTION 'Original idea setup is immutable';END IF;
 ELSE
  SELECT jsonb_build_object('id',id,'name',name,'description',description,'rules',rules,'recorded_at',transaction_timestamp()) INTO snapshot FROM public.trading_setup_catalog WHERE owner_id=NEW.owner_id AND name=NEW.setup_type AND active ORDER BY created_at DESC LIMIT 1;
  NEW.setup_snapshot:=coalesce(snapshot,'{}'::jsonb);
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS capture_idea_setup_v741 ON public.trade_ideas_v733;
CREATE TRIGGER capture_idea_setup_v741 BEFORE INSERT OR UPDATE OF setup_snapshot ON public.trade_ideas_v733 FOR EACH ROW EXECUTE FUNCTION public.capture_idea_setup_v741();
REVOKE ALL ON FUNCTION public.capture_idea_setup_v741() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.capture_idea_setup_v741() TO authenticated;
