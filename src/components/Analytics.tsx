'use client';

import { useMemo } from 'react';
import { ShoppingBag, Wallet, Receipt, Package } from 'lucide-react';

export type OrderRow = { id: string; total: number; items_count: number; created_at: string };
export type ItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  qty: number;
  price: number;
  created_at: string;
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function Analytics({
  orders: rawOrders,
  items: rawItems,
  currency,
  days,
}: {
  orders: OrderRow[];
  items: ItemRow[];
  currency: string;
  days: number | null; // null = всё время
}) {
  const money = (v: number) => `${Math.round(v).toLocaleString('ru-RU')} ${currency}`;

  // Сервер отдаёт заказы за скользящее окно (days × 24ч), а график строится по
  // календарным дням в часовом поясе владельца. Приводим оба к одной границе —
  // началу первого дня графика, иначе карточки и столбцы покажут разные суммы.
  const fromTs = useMemo(() => {
    if (!days) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d.getTime();
  }, [days]);

  const orders = useMemo(
    () => (fromTs === null ? rawOrders : rawOrders.filter((o) => new Date(o.created_at).getTime() >= fromTs)),
    [rawOrders, fromTs]
  );
  const items = useMemo(
    () => (fromTs === null ? rawItems : rawItems.filter((i) => new Date(i.created_at).getTime() >= fromTs)),
    [rawItems, fromTs]
  );

  const stats = useMemo(() => {
    const count = orders.length;
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    return {
      count,
      revenue,
      avg: count ? revenue / count : 0,
      itemsSold: items.reduce((s, i) => s + i.qty, 0),
    };
  }, [orders, items]);

  const top = useMemo(() => {
    const m = new Map<string, { qty: number; revenue: number }>();
    for (const i of items) {
      const cur = m.get(i.product_name) ?? { qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += Number(i.price) * i.qty;
      m.set(i.product_name, cur);
    }
    return [...m.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [items]);

  const timeline = useMemo(() => {
    if (days) {
      const map = new Map<string, { count: number; sum: number }>();
      for (const o of orders) {
        const key = new Date(o.created_at).toDateString();
        const cur = map.get(key) ?? { count: 0, sum: 0 };
        cur.count++;
        cur.sum += Number(o.total);
        map.set(key, cur);
      }
      const out: { label: string; count: number; sum: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const v = map.get(d.toDateString()) ?? { count: 0, sum: 0 };
        out.push({
          label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
          ...v,
        });
      }
      return out;
    }
    // всё время — группируем по месяцам
    const map = new Map<string, { count: number; sum: number; label: string }>();
    for (const o of orders) {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const cur =
        map.get(key) ?? {
          count: 0,
          sum: 0,
          label: d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
        };
      cur.count++;
      cur.sum += Number(o.total);
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => ({ label: v.label, count: v.count, sum: v.sum }));
  }, [orders, days]);

  const weekday = useMemo(() => {
    const arr = new Array(7).fill(0);
    for (const o of orders) {
      const d = new Date(o.created_at);
      arr[(d.getDay() + 6) % 7]++; // Пн = 0
    }
    return arr as number[];
  }, [orders]);

  const maxTimeline = Math.max(1, ...timeline.map((b) => b.count));
  const maxWeekday = Math.max(1, ...weekday);

  const cards = [
    { label: 'Заказов', value: stats.count.toLocaleString('ru-RU'), icon: ShoppingBag },
    { label: 'Сумма заказов', value: money(stats.revenue), icon: Wallet },
    { label: 'Средний чек', value: money(stats.avg), icon: Receipt },
    { label: 'Товаров заказано', value: stats.itemsSold.toLocaleString('ru-RU'), icon: Package },
  ];

  if (stats.count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-gray-500">За выбранный период заказов не было.</p>
        <p className="mt-2 text-sm text-gray-400">
          Заказ появляется здесь, когда клиент нажимает «Оформить заказ в WhatsApp» на витрине.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Карточки */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <c.icon className="h-5 w-5 text-rose-700" />
            <div className="mt-3 text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Заказы по времени */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {days ? 'Заказы по дням' : 'Заказы по месяцам'}
        </h2>
        <div className="overflow-x-auto">
          <div className="flex h-40 items-end gap-1" style={{ minWidth: timeline.length * 12 }}>
            {timeline.map((b, i) => (
              <div
                key={i}
                className="group flex min-w-[8px] flex-1 flex-col justify-end"
                title={`${b.label}: ${b.count} заказ(ов), ${money(b.sum)}`}
              >
                <div
                  className="w-full rounded-t bg-rose-400 transition group-hover:bg-rose-600"
                  style={{ height: `${(b.count / maxTimeline) * 100}%`, minHeight: b.count ? 3 : 0 }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>{timeline[0]?.label}</span>
          <span>{timeline[timeline.length - 1]?.label}</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">Наведите на столбец, чтобы увидеть точные цифры.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Дни недели */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Когда заказывают</h2>
          <div className="flex h-32 items-end gap-3">
            {weekday.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2" title={`${WEEKDAYS[i]}: ${n}`}>
                <div className="w-full rounded-t bg-rose-400" style={{ height: `${(n / maxWeekday) * 100}%`, minHeight: n ? 3 : 0 }} />
                <span className="text-xs text-gray-500">{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">Количество заказов по дням недели за период.</p>
        </div>

        {/* Топ товаров */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Топ товаров</h2>
          <ul className="space-y-3">
            {top.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-sm font-semibold text-gray-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-800">{p.name}</div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-rose-400" style={{ width: `${(p.qty / top[0].qty) * 100}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-gray-900">{p.qty} шт</div>
                  <div className="text-xs text-gray-400">{money(p.revenue)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
