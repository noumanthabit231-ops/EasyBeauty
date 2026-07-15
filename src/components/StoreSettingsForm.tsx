'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { FONTS, fontStack } from '@/lib/theme';
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
    whatsapp: store.whatsapp || '',
    currency: store.currency || '₸',
    button_color: store.button_color || '#7a1220',
    text_on_button: store.text_on_button || '#ffffff',
    font_family: store.font_family || 'inter',
    bg_color: store.bg_color || '',
    bg_image_url: store.bg_image_url || '',
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

  async function handleUpload(field: 'logo_url' | 'cover_url' | 'bg_image_url', file?: File) {
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
        <h2 className="mb-4 text-lg font-semibold">Контакты</h2>
        <div className="grid gap-4 sm:grid-cols-2">
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
        <p className="mt-3 text-xs text-gray-400">Город и адрес теперь редактируются в разделе «Главная страница».</p>
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
            <label className={label}>Аватар (логотип)</label>
            {form.logo_url ? (
              <img src={form.logo_url} alt="" className="mb-2 h-16 w-16 rounded-full object-cover" />
            ) : (
              <p className="mb-2 text-xs text-gray-400">Пока не загружен — на витрине показывается буква названия.</p>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleUpload('logo_url', e.target.files?.[0])} />
          </div>
          <div>
            <label className={label}>Обложка (баннер над каталогом)</label>
            {form.cover_url && <img src={form.cover_url} alt="" className="mb-2 h-16 w-full rounded object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => handleUpload('cover_url', e.target.files?.[0])} />
          </div>
        </div>
      </section>

      {/* Шрифт и фон */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Шрифт и фон</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Шрифт витрины</label>
            <select className={input} value={form.font_family} onChange={(e) => set('font_family', e.target.value)}>
              {FONTS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-lg" style={{ fontFamily: fontStack(form.font_family) }}>
              {form.name || 'Пример текста'} — 12 500 ₸
            </div>
          </div>

          <div>
            <label className={label}>Цвет фона</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.bg_color || '#f9fafb'}
                onChange={(e) => set('bg_color', e.target.value)}
                className="h-10 w-14 rounded border"
              />
              <input className={input} value={form.bg_color} placeholder="по умолчанию" onChange={(e) => set('bg_color', e.target.value)} />
              {form.bg_color && (
                <button type="button" onClick={() => set('bg_color', '')} className="whitespace-nowrap text-sm text-gray-400 hover:text-gray-700">
                  сбросить
                </button>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Фоновая картинка</label>
            {form.bg_image_url && (
              <div className="mb-2 flex items-center gap-3">
                <img src={form.bg_image_url} alt="" className="h-20 w-32 rounded object-cover" />
                <button type="button" onClick={() => set('bg_image_url', '')} className="text-sm text-gray-400 hover:text-red-600">
                  убрать фон
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleUpload('bg_image_url', e.target.files?.[0])} />
            <p className="mt-1 text-xs text-gray-400">Если загружена картинка — она важнее цвета фона. Товары показываются на белых карточках поверх фона.</p>
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
