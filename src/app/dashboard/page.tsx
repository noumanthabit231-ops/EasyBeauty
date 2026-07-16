import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, LayoutGrid, Home, ExternalLink } from 'lucide-react';
import { getSessionUser, getOwnerStore, isSubscriptionActive } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Onboarding from '@/components/Onboarding';
import { storeUrl, storeDisplayUrl } from '@/lib/urls';

export default async function DashboardHome() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const store = await getOwnerStore();
  if (!store) return <Onboarding userId={user.id} />;

  const supabase = createClient();
  const [{ count: products }, { count: categories }, { count: linksCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('links').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
  ]);

  const active = isSubscriptionActive(store);
  const expires = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
  const daysLeft = expires ? Math.ceil((expires.getTime() - Date.now()) / 86400000) : null;
  const statusLabel = active ? 'Активна' : 'Не активна';

  const cards = [
    { label: 'Товаров', value: products ?? 0, icon: Package, href: '/dashboard/products' },
    { label: 'Категорий', value: categories ?? 0, icon: LayoutGrid, href: '/dashboard/categories' },
    { label: 'Кнопок на главной', value: linksCount ?? 0, icon: Home, href: '/dashboard/homepage' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
      <p className="mt-1 text-gray-500">Панель управления магазином</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">Адрес витрины</div>
            <div className="truncate font-medium text-rose-900">{storeDisplayUrl(store.slug)}</div>
          </div>
          <a
            href={storeUrl(store.slug)}
            target="_blank"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-rose-900 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
          >
            <ExternalLink className="h-4 w-4" /> Открыть
          </a>
        </div>
      </div>

      {/* Подписка */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm text-gray-500">Подписка</div>
            <div className={`mt-1 font-medium ${active ? 'text-green-700' : 'text-amber-700'}`}>
              {statusLabel}
            </div>
          </div>
          <div className="sm:text-right">
            {expires && (
              <div className="text-sm text-gray-700">
                {active ? 'действует до' : 'закончилась'} {expires.toLocaleDateString('ru-RU')}
              </div>
            )}
            {expires && active && daysLeft !== null && (
              <div className="text-xs text-gray-400">осталось {daysLeft} дн.</div>
            )}
          </div>
        </div>
        {!active && (
          <p className="mt-3 text-sm text-amber-700">
            Заказы с витрины сейчас направляются администратору платформы. Свяжитесь с нами, чтобы продлить подписку.
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
