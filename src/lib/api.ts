import { supabase, type Theme } from './supabase';

export async function uploadPhoto(file: File, cardId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${cardId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('card-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('card-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadVoice(blob: Blob, cardId: string): Promise<string> {
  const path = `${cardId}/voice.webm`;
  const { error } = await supabase.storage.from('card-voice').upload(path, blob, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'audio/webm',
  });
  if (error) throw error;
  const { data } = supabase.storage.from('card-voice').getPublicUrl(path);
  return data.publicUrl;
}

export async function createCard(params: {
  recipientName: string;
  message: string;
  theme: Theme;
  photoUrls: string[];
  voiceUrl: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      recipient_name: params.recipientName,
      message: params.message,
      theme: params.theme,
      photo_urls: params.photoUrls,
      voice_url: params.voiceUrl,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function getCard(id: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
