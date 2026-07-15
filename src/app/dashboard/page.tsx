import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, LayoutGrid, Tag, ExternalLink } from 'lucide-react';
import { getSessionUser, getOwnerStore, isSubscriptionActive } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Onboarding from '@/components/Onboarding';
import SubscriptionBanner from '@/components/SubscriptionBanner';

export default async function DashboardHome() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const store = await getOwnerStore();
  if (!store) return <Onboarding userId={user.id} />;

  const supabase = createClient();
  const [{ count: products }, { count: categories }, { count: promos }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('promos').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
  ]);

  const active = isSubscriptionActive(store);

  const cards = [
    { label: 'Товаров', value: products ?? 0, icon: Package, href: '/dashboard/products' },
    { label: 'Категорий', value: categories ?? 0, icon: LayoutGrid, href: '/dashboard/categories' },
    { label: 'Акций', value: promos ?? 0, icon: Tag, href: '/dashboard/promos' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
      <p className="mt-1 text-gray-500">Панель управления магазином</p>

      <SubscriptionBanner store={store} />

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Адрес витрины</div>
            <div className="font-medium text-rose-900">/{store.slug}</div>
          </div>
          <a
            href={`/${store.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
          >
            <ExternalLink className="h-4 w-4" /> Открыть
          </a>
        </div>
        {!active && (
          <p className="mt-3 text-sm text-amber-700">
            ⚠️ Витрина скрыта, пока подписка не активна.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl border border-gray-200 bg-white p-5 hover:border-rose-300">
            <c.icon className="h-6 w-6 text-rose-700" />
            <div className="mt-3 text-3xl font-bold text-gray-900">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
