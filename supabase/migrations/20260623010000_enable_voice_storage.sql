INSERT INTO storage.buckets (id, name, public)
VALUES ('card-voice', 'card-voice', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read card voice" ON storage.objects;
CREATE POLICY "Public read card voice"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'card-voice');

DROP POLICY IF EXISTS "Anon upload card voice" ON storage.objects;
CREATE POLICY "Anon upload card voice"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'card-voice'
  AND (storage.foldername(name))[1] = 'voices'
);
