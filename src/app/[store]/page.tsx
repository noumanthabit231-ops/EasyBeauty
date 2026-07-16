import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isSubscriptionActive } from '@/lib/auth';
import { FALLBACK_WHATSAPP } from '@/lib/config';
import Storefront from '@/components/Storefront';
import type { Store, Category, Product, Banner, Link } from '@/lib/types';

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

  // Витрина скрыта, только если её явно отключили (владелец или админ).
  // При истёкшей подписке витрина работает, но заказы уходят администратору платформы.
  if (!store.is_active) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{store.name}</h1>
          <p className="mt-2 text-gray-500">Магазин временно недоступен.</p>
        </div>
      </main>
    );
  }

  const [{ data: categories }, { data: products }, { data: banners }, { data: links }] =
    await Promise.all([
      supabase.from('categories').select('*').eq('store_id', store.id).order('sort_order'),
      supabase.from('products').select('*').eq('store_id', store.id).eq('is_available', true).order('sort_order'),
      supabase.from('banners').select('*').eq('store_id', store.id).order('sort_order'),
      supabase.from('links').select('*').eq('store_id', store.id).order('sort_order'),
    ]);

  // Подписка активна → заказы владельцу; истекла → администратору платформы.
  const whatsapp = isSubscriptionActive(store)
    ? (store.whatsapp || '').replace(/\D/g, '')
    : FALLBACK_WHATSAPP;

  return (
    <Storefront
      store={store}
      whatsapp={whatsapp}
      categories={(categories as Category[]) || []}
      products={(products as Product[]) || []}
      banners={(banners as Banner[]) || []}
      links={(links as Link[]) || []}
    />
  );
}
