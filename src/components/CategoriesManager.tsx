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
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('categories')
      .insert({ store_id: storeId, name: newName.trim(), sort_order: items.length })
      .select()
      .single();
    setBusy(false);
    if (!error && data) {
      setItems([...items, data as Category]);
      setNewName('');
    }
  }

  async function rename(id: string, name: string) {
    setItems((arr) => arr.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function saveName(id: string, name: string) {
    await supabase.from('categories').update({ name }).eq('id', id);
  }

  async function remove(id: string) {
    if (!confirm('Удалить категорию? Товары останутся без категории.')) return;
    await supabase.from('categories').delete().eq('id', id);
    setItems((arr) => arr.filter((c) => c.id !== id));
  }

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новая категория (напр. Уход за кожей)"
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-rose-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-400">Пока нет категорий. Добавьте первую выше.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
              <input
                value={c.name}
                onChange={(e) => rename(c.id, e.target.value)}
                onBlur={(e) => saveName(c.id, e.target.value)}
                className="flex-1 rounded px-2 py-1 outline-none focus:bg-rose-50"
              />
              <button onClick={() => saveName(c.id, c.name)} title="Сохранить" className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600">
                <Save className="h-4 w-4" />
              </button>
              <button onClick={() => remove(c.id)} title="Удалить" className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
