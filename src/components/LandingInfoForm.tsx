'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Store } from '@/lib/types';

export default function LandingInfoForm({ store }: { store: Store }) {
  const router = useRouter();
  const supabase = createClient();
  const [city, setCity] = useState(store.city || '');
  const [address, setAddress] = useState(store.address || '');
  const [about, setAbout] = useState(store.about || '');
  const [showMap, setShowMap] = useState(store.show_map);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const { error } = await supabase.from('stores').update({ city, address, about, show_map: showMap }).eq('id', store.id);
    setSaving(false);
    if (error) { setMsg('Ошибка: ' + error.message); return; }
    setMsg('Сохранено ✓');
    router.refresh();
  }

  const inp = 'w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-rose-400';

  return (
    <form onSubmit={save} className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Город</label>
          <input className={inp} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Адрес</label>
          <input className={inp} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ул. Абая, 10" />
        </div>
      </div>

      <label className="mb-1 block text-sm font-medium text-gray-700">Блок «О нас»</label>
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={5}
        placeholder={'Режим работы: без выходных 11:00–20:00\nОплата: Kaspi, наличные\nДоставка по городу\nНаши преимущества…'}
        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-rose-400"
      />
      <p className="mt-1 text-xs text-gray-400">Показывается на главной как раскрывающийся блок «О нас». Переносы строк сохраняются.</p>

      <label className="mt-4 flex items-center gap-3">
        <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-700">Показывать карту на главной (по адресу магазина)</span>
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-rose-900 px-5 py-2.5 font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>
    </form>
  );
}
