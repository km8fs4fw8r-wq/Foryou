/*
# Storage RLS Policies for WishLink

1. Storage Buckets
   - `card-photos`: public read, anon upload for card photos
   - `card-voice`: public read, anon upload for voice recordings

2. Security
   - All users (anon + authenticated) can upload and read files.
   - Files are publicly accessible via their URL.
*/

-- Policies for card-photos bucket
DROP POLICY IF EXISTS "Public read card photos" ON storage.objects;
CREATE POLICY "Public read card photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'card-photos');

DROP POLICY IF EXISTS "Anon upload card photos" ON storage.objects;
CREATE POLICY "Anon upload card photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'card-photos');

DROP POLICY IF EXISTS "Anon delete card photos" ON storage.objects;
CREATE POLICY "Anon delete card photos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'card-photos');

-- Policies for card-voice bucket
DROP POLICY IF EXISTS "Public read card voice" ON storage.objects;
CREATE POLICY "Public read card voice"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'card-voice');

DROP POLICY IF EXISTS "Anon upload card voice" ON storage.objects;
CREATE POLICY "Anon upload card voice"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'card-voice');

DROP POLICY IF EXISTS "Anon delete card voice" ON storage.objects;
CREATE POLICY "Anon delete card voice"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'card-voice');
