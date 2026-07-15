'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import type { Product, Category } from '@/lib/types';

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
    for (const c of byParent.get(pid) ?? []) { out.push({ cat: c, depth }); walk(c.id, depth + 1); }
  };
  walk(null, 0);
  return out;
}

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  old_price: string;
  category_id: string;
  badge: string;
  image_url: string;
  is_available: boolean;
};

const empty: Draft = {
  name: '', description: '', price: '', old_price: '',
  category_id: '', badge: '', image_url: '', is_available: true,
};

export default function ProductsManager({
  storeId,
  currency,
  categories,
  initial,
}: {
  storeId: string;
  currency: string;
  categories: Category[];
  initial: Product[];
}) {
  const supabase = createClient();
  const [items, setItems] = useState<Product[]>(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const orderedCats = useMemo(() => orderedTree(categories), [categories]);

  function openNew() { setDraft({ ...empty }); }
  function openEdit(p: Product) {
    setDraft({
      id: p.id, name: p.name, description: p.description || '',
      price: String(p.price), old_price: p.old_price ? String(p.old_price) : '',
      category_id: p.category_id || '', badge: p.badge || '',
      image_url: p.image_url || '', is_available: p.is_available,
    });
  }

  async function onFile(file?: File) {
    if (!file || !draft) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, storeId);
      setDraft({ ...draft, image_url: url });
    } catch (e: any) {
      alert('Ошибка загрузки: ' + e.message);
    }
    setUploading(false);
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) { alert('Введите название'); return; }
    setSaving(true);

    const payload = {
      store_id: storeId,
      name: draft.name.trim(),
      description: draft.description,
      price: Number(draft.price) || 0,
      old_price: draft.old_price ? Number(draft.old_price) : null,
      category_id: draft.category_id || null,
      badge: draft.badge,
      image_url: draft.image_url,
      is_available: draft.is_available,
    };

    if (draft.id) {
      const { data } = await supabase.from('products').update(payload).eq('id', draft.id).select().single();
      if (data) setItems((arr) => arr.map((p) => (p.id === draft.id ? (data as Product) : p)));
    } else {
      const { data } = await supabase.from('products').insert({ ...payload, sort_order: items.length }).select().single();
      if (data) setItems((arr) => [...arr, data as Product]);
    }
    setSaving(false);
    setDraft(null);
  }

  async function remove(id: string) {
    if (!confirm('Удалить товар?')) return;
    await supabase.from('products').delete().eq('id', id);
    setItems((arr) => arr.filter((p) => p.id !== id));
  }

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name || '—';
  const input = 'w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-rose-400';

  return (
    <div>
      <button onClick={openNew} className="mb-6 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800">
        <Plus className="h-4 w-4" /> Добавить товар
      </button>

      {items.length === 0 ? (
        <p className="text-gray-400">Пока нет товаров. Добавьте первый.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="aspect-square bg-gray-50">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">нет фото</div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium leading-tight">{p.name}</div>
                  {p.badge && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">{p.badge}</span>}
                </div>
                <div className="mt-1 text-xs text-gray-400">{catName(p.category_id)}</div>
                <div className="mt-1 text-sm font-semibold">
                  {p.price.toLocaleString('ru-RU')} {currency}
                  {p.old_price ? <span className="ml-2 text-xs text-gray-400 line-through">{p.old_price.toLocaleString('ru-RU')}</span> : null}
                </div>
                {!p.is_available && <div className="mt-1 text-xs text-amber-600">скрыт</div>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-sm hover:bg-gray-50">
                    <Pencil className="h-3.5 w-3.5" /> Изменить
                  </button>
                  <button onClick={() => remove(p.id)} className="rounded-lg border border-gray-200 px-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDraft(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{draft.id ? 'Редактировать товар' : 'Новый товар'}</h2>
              <button onClick={() => setDraft(null)} className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Фото</label>
                {draft.image_url && <img src={draft.image_url} alt="" className="mb-2 h-32 w-32 rounded-lg object-cover" />}
                <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
                {uploading && <span className="ml-2 text-sm text-gray-400">загрузка…</span>}
              </div>
              <input className={input} placeholder="Название" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <textarea className={input} rows={2} placeholder="Описание" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={input} type="number" placeholder="Цена" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
                <input className={input} type="number" placeholder="Старая цена (необяз.)" value={draft.old_price} onChange={(e) => setDraft({ ...draft, old_price: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className={input} value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
                  <option value="">Без категории</option>
                  {orderedCats.map(({ cat, depth }) => (
                    <option key={cat.id} value={cat.id}>{' '.repeat(depth * 3)}{depth > 0 ? '└ ' : ''}{cat.name}</option>
                  ))}
                </select>
                <input className={input} placeholder="Бейдж (ХИТ, АКЦИЯ)" value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_available} onChange={(e) => setDraft({ ...draft, is_available: e.target.checked })} className="h-4 w-4" />
                Показывать на витрине
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={save} disabled={saving || uploading} className="flex-1 rounded-lg bg-rose-900 py-2.5 font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button onClick={() => setDraft(null)} className="rounded-lg border border-gray-200 px-4 py-2.5 hover:bg-gray-50">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
