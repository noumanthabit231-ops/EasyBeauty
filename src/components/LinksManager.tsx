'use client';

import { useState } from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Link, LinkKind } from '@/lib/types';

const KINDS: { value: LinkKind; label: string; defTitle: string; needsUrl: boolean }[] = [
  { value: 'whatsapp', label: 'WhatsApp', defTitle: 'Написать в WhatsApp', needsUrl: false },
  { value: 'instagram', label: 'Instagram', defTitle: 'Instagram', needsUrl: true },
  { value: 'tiktok', label: 'TikTok', defTitle: 'TikTok', needsUrl: true },
  { value: 'telegram', label: 'Telegram', defTitle: 'Telegram', needsUrl: true },
  { value: 'sale', label: 'SALE (все товары)', defTitle: 'SALE', needsUrl: false },
  { value: 'loyalty', label: 'Система лояльности', defTitle: 'Система лояльности', needsUrl: true },
  { value: 'wholesale', label: 'Оптовые продажи', defTitle: 'Оптовые продажи', needsUrl: true },
  { value: 'custom', label: 'Своя ссылка', defTitle: '', needsUrl: true },
];

export default function LinksManager({ storeId, initial }: { storeId: string; initial: Link[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Link[]>(initial);
  const [kind, setKind] = useState<LinkKind>('whatsapp');
  const [title, setTitle] = useState('Написать в WhatsApp');
  const [subtitle, setSubtitle] = useState('');
  const [url, setUrl] = useState('');
  const [highlight, setHighlight] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const kindInfo = (k: LinkKind) => KINDS.find((x) => x.value === k)!;

  function onKindChange(k: LinkKind) {
    setKind(k);
    setTitle(kindInfo(k).defTitle);
    setHighlight(k === 'sale');
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data, error } = await supabase
      .from('links')
      .insert({ store_id: storeId, kind, title: title.trim(), subtitle, url, highlight, sort_order: items.length })
      .select()
      .single();
    if (error) { alert('Ошибка: ' + error.message); return; }
    if (data) {
      setItems([...items, data as Link]);
      setSubtitle(''); setUrl('');
    }
  }

  function patch(id: string, field: keyof Link, value: string | boolean) {
    setItems((arr) => arr.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  async function save(l: Link) {
    await supabase.from('links').update({ title: l.title, subtitle: l.subtitle, url: l.url, highlight: l.highlight }).eq('id', l.id);
    setSavedId(l.id);
    setTimeout(() => setSavedId((v) => (v === l.id ? null : v)), 1500);
  }

  async function remove(id: string) {
    if (!confirm('Удалить кнопку?')) return;
    await supabase.from('links').delete().eq('id', id);
    setItems((a) => a.filter((l) => l.id !== id));
  }

  const inp = 'rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-rose-400';

  return (
    <div>
      {/* Форма добавления */}
      <form onSubmit={add} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Тип кнопки</label>
            <select className={inp + ' w-full'} value={kind} onChange={(e) => onKindChange(e.target.value as LinkKind)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Заголовок</label>
            <input className={inp + ' w-full'} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Текст на кнопке" />
          </div>
        </div>
        <input className={inp + ' mt-3 w-full'} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Подзаголовок (необязательно)" />
        {kindInfo(kind).needsUrl && (
          <input className={inp + ' mt-3 w-full'} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Ссылка (https://…)" />
        )}
        {kind === 'whatsapp' && (
          <p className="mt-2 text-xs text-gray-400">Номер берётся из настроек магазина. Можно указать другой в поле ссылки (по желанию).</p>
        )}
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} className="h-4 w-4" />
          Выделить цветом (акцентная кнопка)
        </label>
        <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800">
          <Plus className="h-4 w-4" /> Добавить кнопку
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-400">Пока нет кнопок-ссылок.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => (
            <li key={l.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">{kindInfo(l.kind).label}</span>
                <input className={inp + ' flex-1 font-medium'} value={l.title} onChange={(e) => patch(l.id, 'title', e.target.value)} />
                <button onClick={() => save(l)} title="Сохранить" className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"><Save className="h-4 w-4" /></button>
                <button onClick={() => remove(l.id)} title="Удалить" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <input className={inp + ' mt-2 w-full text-sm'} value={l.subtitle || ''} onChange={(e) => patch(l.id, 'subtitle', e.target.value)} placeholder="Подзаголовок" />
              {kindInfo(l.kind).needsUrl && (
                <input className={inp + ' mt-2 w-full text-sm'} value={l.url || ''} onChange={(e) => patch(l.id, 'url', e.target.value)} placeholder="Ссылка (https://…)" />
              )}
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={l.highlight} onChange={(e) => patch(l.id, 'highlight', e.target.checked)} className="h-4 w-4" />
                Выделить цветом
              </label>
              {savedId === l.id && <span className="mt-1 block text-xs text-green-600">Сохранено ✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
