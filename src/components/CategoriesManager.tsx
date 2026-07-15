'use client';

import { useState } from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';

export default function CategoriesManager({
  storeId,
  initial,
}: {
  storeId: string;
  initial: Category[];
}) {
  const supabase = createClient();
  const [items, setItems] = useState<Category[]>(initial);
  const [icon, setIcon] = useState('');
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('categories')
      .insert({ store_id: storeId, name: name.trim(), icon, subtitle, sort_order: items.length })
      .select()
      .single();
    setBusy(false);
    if (!error && data) {
      setItems([...items, data as Category]);
      setIcon(''); setName(''); setSubtitle('');
    }
  }

  function patch(id: string, field: keyof Category, value: string) {
    setItems((arr) => arr.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function save(c: Category) {
    await supabase.from('categories').update({ name: c.name, icon: c.icon, subtitle: c.subtitle }).eq('id', c.id);
    setSavedId(c.id);
    setTimeout(() => setSavedId((v) => (v === c.id ? null : v)), 1500);
  }

  async function remove(id: string) {
    if (!confirm('Удалить категорию? Товары останутся без категории.')) return;
    await supabase.from('categories').delete().eq('id', id);
    setItems((arr) => arr.filter((c) => c.id !== id));
  }

  const inp = 'rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-rose-400';

  return (
    <div>
      {/* Форма добавления */}
      <form onSubmit={add} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[70px_1fr]">
          <input className={inp + ' text-center text-xl'} placeholder="🎁" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
          <input className={inp} placeholder="Название (напр. УХОД ПО ТИПУ КОЖИ)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <input className={inp + ' mt-3 w-full'} placeholder="Подзаголовок (напр. комбинированная, сухая, жирная)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Добавить категорию
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-400">Пока нет категорий. Добавьте первую выше.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-[60px_1fr_auto]">
                <input className={inp + ' text-center text-xl'} value={c.icon || ''} maxLength={2} onChange={(e) => patch(c.id, 'icon', e.target.value)} placeholder="—" />
                <input className={inp + ' font-medium'} value={c.name} onChange={(e) => patch(c.id, 'name', e.target.value)} />
                <div className="flex items-center gap-1">
                  <button onClick={() => save(c)} title="Сохранить" className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600">
                    <Save className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(c.id)} title="Удалить" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input className={inp + ' mt-2 w-full text-sm'} value={c.subtitle || ''} onChange={(e) => patch(c.id, 'subtitle', e.target.value)} placeholder="Подзаголовок (необязательно)" />
              {savedId === c.id && <span className="mt-1 block text-xs text-green-600">Сохранено ✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
