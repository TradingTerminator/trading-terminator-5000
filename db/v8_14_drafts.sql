-- Each document is private to its owner. Immutable revisions preserve concurrent edits.
CREATE TABLE public.workspace_revisions_v814 (
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 document_key text NOT NULL CHECK (length(document_key) BETWEEN 1 AND 160),
 revision bigint NOT NULL CHECK (revision > 0),
 request_id uuid NOT NULL,
 payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 524288),
 PRIMARY KEY(owner_id, document_key, revision),
 UNIQUE(owner_id, request_id)
);
ALTER TABLE public.workspace_revisions_v814 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workspace_revisions_v814 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.workspace_revisions_v814 TO authenticated;
CREATE POLICY read_own_revision ON public.workspace_revisions_v814 FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));

CREATE FUNCTION public.save_workspace_revision_v814(p_document text, p_base bigint, p_request uuid, p_payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 actor uuid := auth.uid();
 previous public.workspace_revisions_v814;
 latest bigint;
BEGIN
 IF actor IS NULL OR p_base IS NULL OR p_base < 0 OR p_document IS NULL OR p_request IS NULL OR p_payload IS NULL THEN
  RAISE EXCEPTION 'Ungültiger Entwurf';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || ':' || p_document, 0));
 SELECT * INTO previous FROM public.workspace_revisions_v814 WHERE owner_id = actor AND request_id = p_request;
 IF FOUND THEN
  IF previous.document_key = p_document AND previous.payload = p_payload AND previous.revision = p_base + 1 THEN RETURN previous.revision; END IF;
  RAISE EXCEPTION 'Anfragekennung bereits belegt';
 END IF;
 SELECT coalesce(max(revision), 0) INTO latest FROM public.workspace_revisions_v814 WHERE owner_id = actor AND document_key = p_document;
 IF latest <> p_base THEN RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Entwurf auf einem anderen Gerät geändert'; END IF;
 INSERT INTO public.workspace_revisions_v814(owner_id, document_key, revision, request_id, payload)
 VALUES(actor, p_document, latest + 1, p_request, p_payload);
 RETURN latest + 1;
END $$;
REVOKE ALL ON FUNCTION public.save_workspace_revision_v814(text,bigint,uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_workspace_revision_v814(text,bigint,uuid,jsonb) TO authenticated;
