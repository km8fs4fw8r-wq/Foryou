ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'classic';

ALTER TABLE public.cards
  DROP CONSTRAINT IF EXISTS cards_theme_check;

UPDATE public.cards
SET theme = 'classic'
WHERE theme IS NULL
   OR theme NOT IN ('classic', 'rose', 'midnight', 'forest');

ALTER TABLE public.cards
  ALTER COLUMN theme SET DEFAULT 'classic',
  ALTER COLUMN theme SET NOT NULL;

ALTER TABLE public.cards
  ADD CONSTRAINT cards_theme_check
  CHECK (theme IN ('classic', 'rose', 'midnight', 'forest'));
