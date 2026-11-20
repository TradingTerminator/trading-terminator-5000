BEGIN;
DO $$
DECLARE
 u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); req uuid:=gen_random_uuid();
BEGIN
 INSERT INTO auth.users(id,aud,role) VALUES (u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u)::text,true);
 SET LOCAL ROLE authenticated;
 IF public.save_workspace_revision_v814('prep',0,req,'{"focus":3}')<>1 OR public.save_workspace_revision_v814('prep',0,req,'{"focus":3}')<>1 THEN RAISE EXCEPTION 'Replay failed'; END IF;
 BEGIN
  PERFORM public.save_workspace_revision_v814('prep',0,gen_random_uuid(),'{"focus":9}');
  RAISE EXCEPTION 'Lost update accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 IF (SELECT count(*) FROM public.workspace_revisions_v814)<>1 THEN RAISE EXCEPTION 'Duplicate draft';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v)::text,true);
 IF EXISTS(SELECT FROM public.workspace_revisions_v814) THEN RAISE EXCEPTION 'Foreign draft visible';END IF;
 IF public.save_workspace_revision_v814('prep',0,gen_random_uuid(),'{}')<>1 THEN RAISE EXCEPTION 'Wrong user scope';END IF;
END $$;
ROLLBACK;
