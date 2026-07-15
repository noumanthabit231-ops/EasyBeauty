'use client';

import { useMemo, useState } from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';

function orderedTree(cats: Category[]): { cat: Category; depth: number }[] {
  const byParent = new Map<string | null, Category[]>();
  for (const c of cats) {
    const key = c.parent_id ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const out: { cat: Category; depth: number }[] = [];
  const walk = (pid: string | null, depth: number) => {
    for (const c of byParent.get(pid) ?? []) {
      out.push({ cat: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

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
  const [parentId, setParentId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const tree = useMemo(() => orderedTree(items), [items]);

  // ids потомков категории (чтобы нельзя было сделать её своим же родителем)
  function descendants(id: string): Set<string> {
    const set = new Set<string>();
    const walk = (pid: string) => {
      for (const c of items.filter((x) => x.parent_id === pid)) {
        set.add(c.id);
        walk(c.id);
      }
    };
    walk(id);
    return set;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const siblings = items.filter((c) => (c.parent_id ?? '') === parentId).length;
    const { data, error } = await supabase
      .from('categories')
      .insert({
        store_id: storeId,
        parent_id: parentId || null,
        name: name.trim(),
        icon,
        subtitle,
        sort_order: siblings,
      })
      .select()
      .single();
    setBusy(false);
    if (!error && data) {
      setItems([...items, data as Category]);
      setIcon(''); setName(''); setSubtitle('');
    } else if (error) {
      alert('Ошибка: ' + error.message);
    }
  }

  function patch(id: string, field: keyof Category, value: string | null) {
    setItems((arr) => arr.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function save(c: Category) {
    await supabase
      .from('categories')
      .update({ name: c.name, icon: c.icon, subtitle: c.subtitle, parent_id: c.parent_id })
      .eq('id', c.id);
    setSavedId(c.id);
    setTimeout(() => setSavedId((v) => (v === c.id ? null : v)), 1500);
  }

  async function changeParent(c: Category, newParent: string) {
    const parent_id = newParent || null;
    patch(c.id, 'parent_id', parent_id);
    await supabase.from('categories').update({ parent_id }).eq('id', c.id);
  }

  async function remove(id: string) {
    const kids = items.filter((x) => x.parent_id === id).length;
    const msg = kids > 0
      ? 'Удалить категорию вместе со всеми вложенными подкатегориями?'
      : 'Удалить категорию? Товары останутся без категории.';
    if (!confirm(msg)) return;
    await supabase.from('categories').delete().eq('id', id);
    // удаляем и потомков локально
    const toRemove = descendants(id);
    toRemove.add(id);
    setItems((arr) => arr.filter((c) => !toRemove.has(c.id)));
  }

  const inp = 'rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-rose-400';

  // опции родителя для формы добавления
  const parentOptions = tree.map(({ cat, depth }) => (
    <option key={cat.id} value={cat.id}>{' '.repeat(depth * 3)}{depth > 0 ? '└ ' : ''}{cat.name}</option>
  ));

  return (
    <div>
      {/* Форма добавления */}
      <form onSubmit={add} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[70px_1fr]">
          <input className={inp + ' text-center text-xl'} placeholder="🎁" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
          <input className={inp} placeholder="Название (напр. Бренды)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <input className={inp + ' mt-3 w-full'} placeholder="Подзаголовок (необязательно)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">Раздел (родитель)</label>
          <select className={inp + ' w-full'} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— Верхний уровень —</option>
            {parentOptions}
          </select>
        </div>
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
        <ul className="space-y-2">
          {tree.map(({ cat: c, depth }) => {
            const blocked = descendants(c.id);
            return (
              <li
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-3"
                style={{ marginLeft: depth * 20 }}
              >
                <div className="grid gap-2 sm:grid-cols-[54px_1fr_auto]">
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
                <div className="mt-2 flex items-center gap-2">
                  <span className="shrink-0 text-xs text-gray-400">Внутри:</span>
                  <select
                    className={inp + ' w-full text-sm'}
                    value={c.parent_id ?? ''}
                    onChange={(e) => changeParent(c, e.target.value)}
                  >
                    <option value="">— Верхний уровень —</option>
                    {tree
                      .filter(({ cat }) => cat.id !== c.id && !blocked.has(cat.id))
                      .map(({ cat, depth }) => (
                        <option key={cat.id} value={cat.id}>{' '.repeat(depth * 3)}{depth > 0 ? '└ ' : ''}{cat.name}</option>
                      ))}
                  </select>
                </div>
                {savedId === c.id && <span className="mt-1 block text-xs text-green-600">Сохранено ✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
