'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Search, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';
import type { OrderRow, ItemRow } from '@/components/Analytics';

const MAX_LISTED = 100;

function todayInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function OrdersManager({
  storeId,
  orders,
  items,
  products,
  currency,
}: {
  storeId: string;
  orders: OrderRow[];
  items: ItemRow[];
  products: Product[];
  currency: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayInput());
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<Record<string, number>>({}); // productId → qty
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const money = (v: number) => `${Math.round(v).toLocaleString('ru-RU')} ${currency}`;

  const itemsByOrder = useMemo(() => {
    const m = new Map<string, ItemRow[]>();
    for (const i of items) {
      const arr = m.get(i.order_id) ?? [];
      arr.push(i);
      m.set(i.order_id, arr);
    }
    return m;
  }, [items]);

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    return list.slice(0, 50);
  }, [products, query]);

  const chosen = useMemo(
    () =>
      Object.entries(lines)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product),
    [lines, products]
  );
  const draftTotal = chosen.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);

  function addLine(id: string) {
    setLines((l) => ({ ...l, [id]: (l[id] ?? 0) + 1 }));
  }
  function setQty(id: string, delta: number) {
    setLines((l) => {
      const qty = (l[id] ?? 0) + delta;
      if (qty <= 0) {
        const { [id]: _, ...rest } = l;
        return rest;
      }
      return { ...l, [id]: qty };
    });
  }

  function resetForm() {
    setLines({});
    setQuery('');
    setDate(todayInput());
    setErr('');
  }

  async function save() {
    if (chosen.length === 0) { setErr('Добавьте хотя бы один товар'); return; }
    setBusy(true);
    setErr('');
    // полдень по местному времени — чтобы дата не «уехала» на соседний день из-за часового пояса
    const at = new Date(`${date}T12:00:00`);
    const { error } = await supabase.rpc('create_manual_order', {
      p_store_id: storeId,
      p_items: chosen.map((l) => ({ product_id: l.product.id, qty: l.qty })),
      p_created_at: at.toISOString(),
    });
    setBusy(false);
    if (error) { setErr('Ошибка: ' + error.message); return; }
    setOpen(false);
    resetForm();
    router.refresh();
  }

  async function removeOrder(id: string) {
    if (!confirm('Удалить заказ целиком?')) return;
    const { error } = await supabase.rpc('delete_order', { p_order_id: id });
    if (error) { alert('Ошибка: ' + error.message); return; }
    router.refresh();
  }

  async function removeItem(id: string) {
    if (!confirm('Удалить эту позицию из заказа?')) return;
    const { error } = await supabase.rpc('delete_order_item', { p_item_id: id });
    if (error) { alert('Ошибка: ' + error.message); return; }
    router.refresh();
  }

  const listed = orders.slice(0, MAX_LISTED);
  const inp = 'rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-rose-400';

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Заказы</h2>
          <p className="text-sm text-gray-500">
            Можно добавить заказ, сделанный не через сайт, или удалить лишний (например, тестовый).
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setOpen(true); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-rose-900 px-4 py-2.5 font-medium text-white hover:bg-rose-800"
        >
          <Plus className="h-4 w-4" /> Добавить заказ
        </button>
      </div>

      {listed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-400">
          За выбранный период заказов нет.
        </p>
      ) : (
        <ul className="space-y-3">
          {listed.map((o) => {
            const its = itemsByOrder.get(o.id) ?? [];
            return (
              <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(o.created_at).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-400">{o.items_count} шт · {money(Number(o.total))}</div>
                  </div>
                  <button
                    onClick={() => removeOrder(o.id)}
                    title="Удалить заказ"
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <ul className="mt-3 divide-y divide-gray-50 border-t border-gray-100 pt-2">
                  {its.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-2">
                      <div className="min-w-0 flex-1 truncate text-sm text-gray-700">{i.product_name}</div>
                      <div className="shrink-0 text-sm text-gray-500">
                        {i.qty} шт × {money(Number(i.price))}
                      </div>
                      <button
                        onClick={() => removeItem(i.id)}
                        title="Удалить позицию"
                        className="shrink-0 rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {orders.length > MAX_LISTED && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Показаны последние {MAX_LISTED} заказов из {orders.length} за период.
        </p>
      )}

      {/* Модалка добавления */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="text-lg font-semibold">Новый заказ</h3>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <label className="mb-1 block text-sm font-medium text-gray-700">Дата заказа</label>
              <input type="date" value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} className={inp} />

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск товара по названию"
                  className={inp + ' w-full pl-9'}
                />
              </div>

              {/* Список товаров */}
              <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-gray-200">
                {found.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-400">Ничего не найдено</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {found.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 p-2">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-gray-50">
                          {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-400">{money(Number(p.price))}</div>
                        </div>
                        <button
                          onClick={() => addLine(p.id)}
                          className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100"
                        >
                          Добавить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Выбранные позиции */}
              {chosen.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium text-gray-700">В заказе</div>
                  <ul className="space-y-2">
                    {chosen.map((l) => (
                      <li key={l.product.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
                        <div className="min-w-0 flex-1 truncate text-sm text-gray-800">{l.product.name}</div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button onClick={() => setQty(l.product.id, -1)} className="rounded-full border bg-white p-1"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm font-medium">{l.qty}</span>
                          <button onClick={() => setQty(l.product.id, 1)} className="rounded-full border bg-white p-1"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="w-24 shrink-0 text-right text-sm font-medium">
                          {money(Number(l.product.price) * l.qty)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-5">
              <div className="text-sm text-gray-500">
                Итого: <span className="text-lg font-bold text-gray-900">{money(draftTotal)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2.5 hover:bg-gray-50">Отмена</button>
                <button
                  onClick={save}
                  disabled={busy || chosen.length === 0}
                  className="rounded-lg bg-rose-900 px-5 py-2.5 font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
                >
                  {busy ? 'Сохраняем…' : 'Сохранить заказ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
