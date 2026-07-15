'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Promo } from '@/lib/types';

export default function PromosManager({ storeId, initial }: { storeId: string; initial: Promo[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Promo[]>(initial);
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [discount, setDiscount] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const { data } = await supabase
      .from('promos')
      .insert({
        store_id: storeId,
        code: code.trim().toUpperCase(),
        description: desc,
        discount_percent: Number(discount) || 0,
      })
      .select()
      .single();
    if (data) {
      setItems([data as Promo, ...items]);
      setCode(''); setDesc(''); setDiscount('');
    }
  }

  async function toggle(p: Promo) {
    const { data } = await supabase.from('promos').update({ is_active: !p.is_active }).eq('id', p.id).select().single();
    if (data) setItems((arr) => arr.map((x) => (x.id === p.id ? (data as Promo) : x)));
  }

  async function remove(id: string) {
    if (!confirm('Удалить промокод?')) return;
    await supabase.from('promos').delete().eq('id', id);
    setItems((arr) => arr.filter((x) => x.id !== id));
  }

  const input = 'rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-rose-400';

  return (
    <div>
      <form onSubmit={add} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
        <input className={input} placeholder="Код (SALE20)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className={input} placeholder="Описание акции" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <input className={input} type="number" placeholder="Скидка %" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-400">Пока нет акций.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <span className="rounded bg-rose-100 px-2 py-1 font-mono text-sm font-bold text-rose-700">{p.code}</span>
              <div className="flex-1">
                <div className="text-sm">{p.description || '—'}</div>
                {p.discount_percent > 0 && <div className="text-xs text-gray-400">скидка {p.discount_percent}%</div>}
              </div>
              <button
                onClick={() => toggle(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {p.is_active ? 'активен' : 'выключен'}
              </button>
              <button onClick={() => remove(p.id)} className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
