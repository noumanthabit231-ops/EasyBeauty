'use client';

import { useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadImage, deleteImage } from '@/lib/upload';
import type { Banner } from '@/lib/types';

export default function BannersManager({ storeId, initial }: { storeId: string; initial: Banner[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Banner[]>(initial);
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, storeId);
        const { data } = await supabase
          .from('banners')
          .insert({ store_id: storeId, image_url: url, sort_order: items.length })
          .select()
          .single();
        if (data) setItems((a) => [...a, data as Banner]);
      }
    } catch (e: any) {
      alert('Ошибка загрузки: ' + e.message);
    }
    setUploading(false);
  }

  async function setLink(id: string, link_url: string) {
    setItems((a) => a.map((b) => (b.id === id ? { ...b, link_url } : b)));
    await supabase.from('banners').update({ link_url }).eq('id', id);
  }

  async function remove(id: string) {
    if (!confirm('Удалить баннер?')) return;
    const img = items.find((b) => b.id === id)?.image_url;
    await supabase.from('banners').delete().eq('id', id);
    setItems((a) => a.filter((b) => b.id !== id));
    await deleteImage(img);
  }

  return (
    <div>
      <label className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800">
        <Upload className="h-4 w-4" /> {uploading ? 'Загрузка…' : 'Загрузить баннеры'}
        <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </label>
      <p className="mb-4 text-xs text-gray-400">Рекомендуемый формат — вертикальный (примерно 4:5). Можно выбрать несколько сразу.</p>

      {items.length === 0 ? (
        <p className="text-gray-400">Пока нет баннеров.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img src={b.image_url} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="p-3">
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
                  placeholder="Ссылка при клике (необязательно)"
                  defaultValue={b.link_url || ''}
                  onBlur={(e) => setLink(b.id, e.target.value)}
                />
                <button onClick={() => remove(b.id)} className="mt-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
