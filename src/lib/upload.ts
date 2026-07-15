import { createClient } from '@/lib/supabase/client';

/** Загружает файл в бакет store-media и возвращает публичный URL. */
export async function uploadImage(file: File, storeId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('store-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('store-media').getPublicUrl(path);
  return data.publicUrl;
}
