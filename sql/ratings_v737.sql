-- Only V7.37 entries require the new complete rating sets; historical rows are not rewritten.
CREATE OR REPLACE FUNCTION public.guard_ratings_v737() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v jsonb; k text;
BEGIN
 IF NEW.observations->'entry_context_v736'->>'capture_version'='737' THEN
  v:=NEW.observations->'entry_context_v736'->'emotion_scales';
  IF NOT public.valid_emotion_scales_v736(v) THEN RAISE EXCEPTION 'Invalid entry ratings';END IF;
  FOREACH k IN ARRAY ARRAY['focus','pressure','fomo','revenge','fear','greed'] LOOP IF NOT(v ? k) THEN RAISE EXCEPTION 'Entry rating required: %',k;END IF;END LOOP;
  IF NEW.observations ? 'exit_emotion_scales' THEN
   v:=NEW.observations->'exit_emotion_scales';
   IF NOT public.valid_emotion_scales_v736(v) THEN RAISE EXCEPTION 'Invalid exit ratings';END IF;
   FOREACH k IN ARRAY ARRAY['fear','stress','greed','frustration','relief','uncertain'] LOOP IF NOT(v ? k) THEN RAISE EXCEPTION 'Exit rating required: %',k;END IF;END LOOP;
  END IF;
  IF NEW.observations->>'compliance_reviewed'='true' THEN
   v:=NEW.observations->'during_emotion_scales';
   IF NOT public.valid_emotion_scales_v736(v) THEN RAISE EXCEPTION 'Rate during-trade emotions in review';END IF;
   FOREACH k IN ARRAY ARRAY['fear','greed','uncertain'] LOOP IF NOT(v ? k) THEN RAISE EXCEPTION 'Review rating required: %',k;END IF;END LOOP;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_ratings_v737() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_ratings_v737 BEFORE UPDATE OF observations ON public.trades FOR EACH ROW EXECUTE FUNCTION public.guard_ratings_v737();
