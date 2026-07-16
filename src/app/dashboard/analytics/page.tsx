import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getOwnerStore } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Analytics, { type OrderRow, type ItemRow } from '@/components/Analytics';
import OrdersManager from '@/components/OrdersManager';
import type { Product } from '@/lib/types';

const PERIODS = [
  { key: '7', label: '7 дней' },
  { key: '30', label: '30 дней' },
  { key: '90', label: '90 дней' },
  { key: 'all', label: 'Всё время' },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const store = await getOwnerStore();
  if (!store) redirect('/dashboard');

  const period = PERIODS.some((p) => p.key === searchParams.period) ? searchParams.period! : '30';
  const days = period === 'all' ? null : Number(period);
  const since = days ? new Date(Date.now() - days * 86400000).toISOString() : null;

  const supabase = createClient();

  let ordersQuery = supabase
    .from('orders')
    .select('id, total, items_count, created_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(5000);

  let itemsQuery = supabase
    .from('order_items')
    .select('id, order_id, product_name, qty, price, created_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(20000);

  if (since) {
    ordersQuery = ordersQuery.gte('created_at', since);
    itemsQuery = itemsQuery.gte('created_at', since);
  }

  const [{ data: orders }, { data: items }, { data: products }] = await Promise.all([
    ordersQuery,
    itemsQuery,
    supabase.from('products').select('*').eq('store_id', store.id).order('name'),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Аналитика</h1>
      <p className="mb-6 text-gray-500">
        Заказ учитывается в момент, когда клиент нажал «Оформить заказ в WhatsApp» на витрине.
      </p>

      {/* Период */}
      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/dashboard/analytics?period=${p.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              p.key === period
                ? 'bg-rose-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <Analytics
        orders={(orders as OrderRow[]) || []}
        items={(items as ItemRow[]) || []}
        currency={store.currency || '₸'}
        days={days}
      />

      <OrdersManager
        storeId={store.id}
        orders={(orders as OrderRow[]) || []}
        items={(items as ItemRow[]) || []}
        products={(products as Product[]) || []}
        currency={store.currency || '₸'}
      />
    </div>
  );
}
