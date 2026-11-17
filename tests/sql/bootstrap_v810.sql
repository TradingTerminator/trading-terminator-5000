-- Local-only bootstrap; production never executes this file.
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA auth;CREATE SCHEMA storage;
CREATE TABLE auth.users(id uuid PRIMARY KEY,aud text,role text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role'$$;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid,metadata jsonb);
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT string_to_array($1,'/')$$;
GRANT USAGE ON SCHEMA auth,storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
