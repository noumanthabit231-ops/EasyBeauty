import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isSubscriptionActive } from '@/lib/auth';
import Storefront from '@/components/Storefront';
import type { Store, Category, Product, Promo } from '@/lib/types';

export const revalidate = 30;

async function loadStore(slug: string) {
  const supabase = createClient();
  const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle();
  return store as Store | null;
}

export async function generateMetadata({ params }: { params: { store: string } }): Promise<Metadata> {
  const store = await loadStore(params.store);
  if (!store) return { title: 'Магазин не найден' };
  return {
    title: store.name,
    description: store.description || `Каталог магазина ${store.name}`,
    openGraph: { title: store.name, images: store.cover_url ? [store.cover_url] : [] },
  };
}

export default async function StorePage({ params }: { params: { store: string } }) {
  const supabase = createClient();
  const store = await loadStore(params.store);

  if (!store) notFound();

  // Витрина видна только если активна и подписка в силе
  if (!store.is_active || !isSubscriptionActive(store)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{store.name}</h1>
          <p className="mt-2 text-gray-500">Магазин временно недоступен.</p>
        </div>
      </main>
    );
  }

  const [{ data: categories }, { data: products }, { data: promos }] = await Promise.all([
    supabase.from('categories').select('*').eq('store_id', store.id).order('sort_order'),
    supabase.from('products').select('*').eq('store_id', store.id).eq('is_available', true).order('sort_order'),
    supabase.from('promos').select('*').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }),
  ]);

  return (
    <Storefront
      store={store}
      categories={(categories as Category[]) || []}
      products={(products as Product[]) || []}
      promos={(promos as Promo[]) || []}
    />
  );
}
