'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import type { Store } from '@/lib/types';

const CURRENCIES = ['₸', '₽', '$', '€', '£', '₴', 'сум', 'сом'];

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function StoreSettingsForm({ store }: { store: Store }) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    city: store.city || '',
    address: store.address || '',
    whatsapp: store.whatsapp || '',
    currency: store.currency || '₸',
    button_color: store.button_color || '#7a1220',
    text_on_button: store.text_on_button || '#ffffff',
    is_active: store.is_active,
    logo_url: store.logo_url || '',
    cover_url: store.cover_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleUpload(field: 'logo_url' | 'cover_url', file?: File) {
    if (!file) return;
    try {
      const url = await uploadImage(file, store.id);
      set(field, url);
    } catch (e: any) {
      setErr('Ошибка загрузки: ' + e.message);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setSaving(true);

    const { error } = await supabase
      .from('stores')
      .update({
        ...form,
        slug: slugify(form.slug),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        updated_at: new Date().toISOString(),
      })
      .eq('id', store.id);

    setSaving(false);
    if (error) {
      setErr(error.code === '23505' ? 'Этот адрес уже занят' : 'Ошибка: ' + error.message);
      return;
    }
    setMsg('Сохранено ✓');
    router.refresh();
  }

  const input = 'w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-rose-400';
  const label = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Основное */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Основное</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Название магазина</label>
            <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={label}>Адрес страницы (site.com/…)</label>
            <input className={input} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Описание</label>
            <textarea className={input} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Контакты и адрес</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Город</label>
            <input className={input} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Алматы" />
          </div>
          <div>
            <label className={label}>Адрес</label>
            <input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="ул. Абая, 10" />
          </div>
          <div>
            <label className={label}>Номер WhatsApp (для заказов)</label>
            <input className={input} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="77001234567" />
            <p className="mt-1 text-xs text-gray-400">В международном формате без «+», напр. 77001234567</p>
          </div>
          <div>
            <label className={label}>Валюта</label>
            <select className={input} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Оформление */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Оформление</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Цвет кнопок / акцент</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.button_color} onChange={(e) => set('button_color', e.target.value)} className="h-10 w-14 rounded border" />
              <input className={input} value={form.button_color} onChange={(e) => set('button_color', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Цвет текста на кнопках</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.text_on_button} onChange={(e) => set('text_on_button', e.target.value)} className="h-10 w-14 rounded border" />
              <input className={input} value={form.text_on_button} onChange={(e) => set('text_on_button', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Логотип</label>
            {form.logo_url && <img src={form.logo_url} alt="" className="mb-2 h-16 w-16 rounded-full object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => handleUpload('logo_url', e.target.files?.[0])} />
          </div>
          <div>
            <label className={label}>Обложка (баннер)</label>
            {form.cover_url && <img src={form.cover_url} alt="" className="mb-2 h-16 w-full rounded object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => handleUpload('cover_url', e.target.files?.[0])} />
          </div>
        </div>
      </section>

      {/* Видимость */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-5 w-5" />
          <span className="text-sm font-medium text-gray-700">Витрина опубликована (видна клиентам)</span>
        </label>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="rounded-lg bg-rose-900 px-6 py-3 font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
          {saving ? 'Сохраняем…' : 'Сохранить изменения'}
        </button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
