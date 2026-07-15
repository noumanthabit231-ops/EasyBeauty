'use client';

import { useState } from 'react';
import { Trash2, Plus, Save, CornerDownRight, Check, X } from 'lucide-react';
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
  const [savedId, setSavedId] = useState<string | null>(null);

  // форма добавления верхнего уровня
  const [tIcon, setTIcon] = useState('');
  const [tName, setTName] = useState('');
  const [tSub, setTSub] = useState('');

  // форма добавления подкатегории (открыта максимум одна)
  const [childParent, setChildParent] = useState<string | null>(null);
  const [cIcon, setCIcon] = useState('');
  const [cName, setCName] = useState('');
  const [cSub, setCSub] = useState('');

  const childrenOf = (pid: string | null) =>
    items
      .filter((c) => (c.parent_id ?? null) === pid)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  async function addCategory(parentId: string | null, icon: string, name: string, sub: string) {
    if (!name.trim()) return false;
    const siblings = items.filter((c) => (c.parent_id ?? null) === parentId).length;
    const { data, error } = await supabase
      .from('categories')
      .insert({ store_id: storeId, parent_id: parentId, name: name.trim(), icon, subtitle: sub, sort_order: siblings })
      .select()
      .single();
    if (error) {
      alert('Ошибка: ' + error.message);
      return false;
    }
    if (data) setItems((a) => [...a, data as Category]);
    return true;
  }

  async function addTop(e: React.FormEvent) {
    e.preventDefault();
    if (await addCategory(null, tIcon, tName, tSub)) {
      setTIcon(''); setTName(''); setTSub('');
    }
  }

  function openChildForm(parentId: string) {
    setChildParent(parentId);
    setCIcon(''); setCName(''); setCSub('');
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    if (childParent && (await addCategory(childParent, cIcon, cName, cSub))) {
      setChildParent(null);
      setCIcon(''); setCName(''); setCSub('');
    }
  }

  function patch(id: string, field: keyof Category, value: string) {
    setItems((arr) => arr.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function save(c: Category) {
    const { error } = await supabase
      .from('categories')
      .update({ name: c.name, icon: c.icon, subtitle: c.subtitle })
      .eq('id', c.id);
    if (error) { alert('Ошибка: ' + error.message); return; }
    setSavedId(c.id);
    setTimeout(() => setSavedId((v) => (v === c.id ? null : v)), 1500);
  }

  function collectDescendants(id: string): Set<string> {
    const set = new Set<string>();
    const walk = (pid: string) => {
      for (const c of items.filter((x) => x.parent_id === pid)) { set.add(c.id); walk(c.id); }
    };
    walk(id);
    return set;
  }

  async function remove(id: string) {
    const kids = items.filter((x) => x.parent_id === id).length;
    const msg = kids > 0
      ? 'Удалить категорию вместе со всеми вложенными подкатегориями?'
      : 'Удалить категорию? Товары останутся без категории.';
    if (!confirm(msg)) return;
    await supabase.from('categories').delete().eq('id', id);
    const toRemove = collectDescendants(id);
    toRemove.add(id);
    setItems((arr) => arr.filter((c) => !toRemove.has(c.id)));
  }

  const inp = 'rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-rose-400';

  // рекурсивный рендер узла дерева
  function renderNode(c: Category): JSX.Element {
    const kids = childrenOf(c.id);
    return (
      <li key={c.id}>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              className={inp + ' w-14 shrink-0 text-center text-xl'}
              value={c.icon || ''}
              maxLength={2}
              onChange={(e) => patch(c.id, 'icon', e.target.value)}
              placeholder="—"
              title="Эмодзи-иконка"
            />
            <input
              className={inp + ' flex-1 font-medium'}
              value={c.name}
              onChange={(e) => patch(c.id, 'name', e.target.value)}
              placeholder="Название"
            />
          </div>
          <input
            className={inp + ' mt-2 w-full text-sm'}
            value={c.subtitle || ''}
            onChange={(e) => patch(c.id, 'subtitle', e.target.value)}
            placeholder="Подзаголовок (необязательно)"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => openChildForm(c.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100"
            >
              <CornerDownRight className="h-3.5 w-3.5" /> Подкатегория
            </button>
            <button
              onClick={() => save(c)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-800"
            >
              {savedId === c.id ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {savedId === c.id ? 'Сохранено' : 'Сохранить'}
            </button>
            <button
              onClick={() => remove(c.id)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* форма добавления подкатегории */}
        {childParent === c.id && (
          <form onSubmit={addChild} className="mt-2 ml-6 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 p-3">
            <div className="mb-1 text-xs font-medium text-rose-700">Новая подкатегория внутри «{c.name}»</div>
            <div className="flex items-center gap-2">
              <input className={inp + ' w-14 shrink-0 text-center text-xl'} value={cIcon} maxLength={2} onChange={(e) => setCIcon(e.target.value)} placeholder="🏷️" autoFocus={false} />
              <input className={inp + ' flex-1'} value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Название (напр. Anua)" autoFocus />
            </div>
            <input className={inp + ' mt-2 w-full text-sm'} value={cSub} onChange={(e) => setCSub(e.target.value)} placeholder="Подзаголовок (необязательно)" />
            <div className="mt-2 flex gap-2">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-800">
                <Plus className="h-3.5 w-3.5" /> Добавить внутрь
              </button>
              <button type="button" onClick={() => setChildParent(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <X className="h-3.5 w-3.5" /> Отмена
              </button>
            </div>
          </form>
        )}

        {/* дети */}
        {kids.length > 0 && (
          <ul className="mt-2 space-y-2 border-l-2 border-rose-100 pl-4">
            {kids.map((k) => renderNode(k))}
          </ul>
        )}
      </li>
    );
  }

  const roots = childrenOf(null);

  return (
    <div>
      {/* Форма добавления верхнего уровня */}
      <form onSubmit={addTop} className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-gray-700">Добавить категорию верхнего уровня</div>
        <div className="flex items-center gap-2">
          <input className={inp + ' w-14 shrink-0 text-center text-xl'} placeholder="🎁" value={tIcon} onChange={(e) => setTIcon(e.target.value)} maxLength={2} />
          <input className={inp + ' flex-1'} placeholder="Название (напр. Каталог товаров)" value={tName} onChange={(e) => setTName(e.target.value)} />
        </div>
        <input className={inp + ' mt-2 w-full'} placeholder="Подзаголовок (необязательно)" value={tSub} onChange={(e) => setTSub(e.target.value)} />
        <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </form>

      {roots.length === 0 ? (
        <p className="text-gray-400">Пока нет категорий. Добавьте первую выше. Внутрь неё потом можно вложить подкатегории кнопкой «Подкатегория».</p>
      ) : (
        <ul className="space-y-2">{roots.map((c) => renderNode(c))}</ul>
      )}
    </div>
  );
}
