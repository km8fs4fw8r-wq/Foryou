import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://ofjngekwmbxipppmsxgd.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mam5nZWt3bWJ4aXBwcG1zeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTk3NTQsImV4cCI6MjA5NzM5NTc1NH0.7AHM_S2uWt1eUo9msNPbNcwMntO1tTBz6MrbcX7WCWQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Card {
  id: string;
  recipient: string;
  message: string | null;
  photo_url: string | null;
  voice_url: string | null;
  created_at: string;
}
