import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Theme = 'birthday' | 'anniversary' | 'graduation' | 'friendship';

export interface Card {
  id: string;
  recipient_name: string;
  message: string | null;
  theme: Theme;
  photo_urls: string[];
  voice_url: string | null;
  created_at: string;
}
