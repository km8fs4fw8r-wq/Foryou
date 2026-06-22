/*
  Align the deployed cards table with the application contract:
    id, recipient, message, photo_url, voice_url, created_at

  photo_url remains a text array so the existing three-photo UI keeps working.
  Existing recipient names and photo URL arrays are preserved.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cards'
      AND column_name = 'recipient_name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cards'
      AND column_name = 'recipient'
  ) THEN
    ALTER TABLE public.cards RENAME COLUMN recipient_name TO recipient;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cards'
      AND column_name = 'photo_urls'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cards'
      AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.cards RENAME COLUMN photo_urls TO photo_url;
  END IF;
END
$$;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS photo_url text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS voice_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
DECLARE
  photo_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
  INTO photo_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'cards'
    AND a.attname = 'photo_url'
    AND NOT a.attisdropped;

  IF photo_type = 'text' THEN
    ALTER TABLE public.cards
      ALTER COLUMN photo_url TYPE text[]
      USING CASE
        WHEN photo_url IS NULL OR photo_url = '' THEN '{}'::text[]
        ELSE ARRAY[photo_url]
      END;
  END IF;
END
$$;

ALTER TABLE public.cards
  ALTER COLUMN recipient SET NOT NULL,
  ALTER COLUMN photo_url SET DEFAULT '{}'::text[],
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.cards DROP COLUMN IF EXISTS theme;

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cards" ON public.cards;
CREATE POLICY "anon_select_cards"
ON public.cards FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_insert_cards" ON public.cards;
CREATE POLICY "anon_insert_cards"
ON public.cards FOR INSERT
TO anon, authenticated
WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('card-photos', 'card-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read card photos" ON storage.objects;
CREATE POLICY "Public read card photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'card-photos');

DROP POLICY IF EXISTS "Anon upload card photos" ON storage.objects;
CREATE POLICY "Anon upload card photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'card-photos'
  AND (storage.foldername(name))[1] = 'cards'
);
