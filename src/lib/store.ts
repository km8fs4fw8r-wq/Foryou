import { supabase, type Card } from './supabase';

export async function uploadPhoto(file: File, cardId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${cardId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('card-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  const { data } = supabase.storage.from('card-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function createCard(params: {
  recipientName: string;
  message: string;
  photoUrls: string[];
}): Promise<string> {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      recipient_name: params.recipientName,
      message: params.message,
      theme: 'default',
      photo_urls: params.photoUrls,
      voice_url: null,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to save card: ${error.message}`);
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
