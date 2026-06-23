import { supabase, type Card } from './supabase';
import type { CardTheme } from './themes';

export async function uploadPhoto(file: File, cardId: string): Promise<string> {
  const rawExtension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const extension = rawExtension.replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `cards/${cardId}/${crypto.randomUUID()}.${extension}`;

  console.info('[Supabase trace] storage.objects INSERT started', {
    bucket: 'card-photos',
    path,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  const { data, error } = await supabase.storage.from('card-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('[Supabase trace] storage.objects INSERT failed', {
      operation: 'storage.objects INSERT',
      bucket: 'card-photos',
      path,
      error,
    });
    console.error('[Supabase trace] exact Storage error object', error);
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  console.info('[Supabase trace] storage.objects INSERT succeeded', {
    bucket: 'card-photos',
    requestedPath: path,
    returnedData: data,
  });

  return data.path;
}

export function getPhotoPublicUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;

  const path = value
    .replace(/^\/+/, '')
    .replace(/^card-photos\//, '')
    .replace(/\/+/g, '/');

  return supabase.storage.from('card-photos').getPublicUrl(path).data.publicUrl;
}

export async function createCard(params: {
  recipientName: string;
  message: string;
  photoPath: string | null;
  theme: CardTheme;
}): Promise<string> {
  const row = {
    recipient: params.recipientName,
    message: params.message,
    photo_url: params.photoPath,
    theme: params.theme,
    voice_url: null,
  };

  console.info('[Supabase trace] public.cards INSERT started', {
    table: 'public.cards',
    row,
  });

  const { data, error } = await supabase
    .from('cards')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    console.error('[Supabase trace] public.cards INSERT failed', {
      operation: 'public.cards INSERT',
      table: 'public.cards',
      row,
      error,
    });
    console.error('[Supabase trace] exact PostgREST error object', error);
    throw new Error(`Failed to save card: ${error.message}`);
  }

  console.info('[Supabase trace] public.cards INSERT succeeded', {
    table: 'public.cards',
    returnedData: data,
  });

  return data.id;
}

export async function getCard(id: string): Promise<Card | null> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load card: ${error.message}`);
  return data;
}
