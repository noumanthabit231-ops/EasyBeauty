'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9а-я\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Onboarding({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const finalSlug = slugify(slug || name);
    if (!finalSlug) {
      setError('Введите название магазина');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('stores').insert({
      owner_id: userId,
      name: name || 'Мой магазин',
      slug: finalSlug,
    });

    setLoading(false);
    if (error) {
      setError(
        error.code === '23505'
          ? 'Такой адрес уже занят, выберите другой'
          : 'Ошибка: ' + error.message
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Создадим ваш магазин 🎉</h1>
      <p className="mt-2 text-gray-500">Пару шагов — и витрина готова.</p>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Название магазина</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!touchedSlug) setSlug(slugify(e.target.value));
            }}
            placeholder="MIDO Beauty"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-rose-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Адрес страницы</label>
          <div className="flex items-center rounded-lg border border-gray-200 focus-within:border-rose-400">
            <span className="pl-3 text-sm text-gray-400">site.com/</span>
            <input
              value={slug}
              onChange={(e) => {
                setTouchedSlug(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="mido"
              className="w-full rounded-lg px-2 py-3 outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Латиница, цифры и дефисы. Можно изменить позже.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-rose-900 py-3 font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {loading ? 'Создаём…' : 'Создать магазин'}
        </button>
      </form>
    </div>
  );
}
