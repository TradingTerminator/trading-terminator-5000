CREATE TABLE IF NOT EXISTS public.test_setups_v8141(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
 source_id uuid NOT NULL, name text NOT NULL, source_data jsonb NOT NULL,
 is_test_data boolean NOT NULL DEFAULT true CHECK(is_test_data), UNIQUE(owner_id,source_id)
);
ALTER TABLE public.test_setups_v8141 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.test_setups_v8141 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.test_setups_v8141 TO authenticated;
DO $$BEGIN IF NOT EXISTS(SELECT FROM pg_policies WHERE schemaname='public' AND tablename='test_setups_v8141' AND policyname='own_test_setup') THEN
 CREATE POLICY own_test_setup ON public.test_setups_v8141 FOR SELECT TO authenticated USING(owner_id=(select auth.uid()));END IF;END$$;
