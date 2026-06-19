/*
# Create WishLink Cards Table

1. New Tables
   - `cards`
     - `id` (uuid, primary key) — unique card identifier, used in shareable URL
     - `recipient_name` (text, not null) — name of the person receiving the card
     - `message` (text) — personal written message
     - `theme` (text) — card theme: birthday, anniversary, graduation, friendship
     - `photo_urls` (text[]) — array of public URLs for uploaded photos
     - `voice_url` (text) — public URL for the recorded voice message
     - `created_at` (timestamptz) — creation timestamp

2. Security
   - Enable RLS on `cards`.
   - Allow anon + authenticated full CRUD (single-tenant, no auth required).
   - Anyone with the card ID can view it (public shareable links).

3. Notes
   - No user auth required — cards are created anonymously and shared by link.
   - Photos and voice are stored as public URLs (from Supabase Storage).
*/

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name text NOT NULL,
  message text,
  theme text NOT NULL DEFAULT 'birthday',
  photo_urls text[] DEFAULT '{}',
  voice_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cards" ON cards;
CREATE POLICY "anon_select_cards" ON cards FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cards" ON cards;
CREATE POLICY "anon_insert_cards" ON cards FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cards" ON cards;
CREATE POLICY "anon_update_cards" ON cards FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cards" ON cards;
CREATE POLICY "anon_delete_cards" ON cards FOR DELETE
TO anon, authenticated USING (true);
