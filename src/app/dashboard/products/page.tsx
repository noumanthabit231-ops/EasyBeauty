import { redirect } from 'next/navigation';
import { getOwnerStore } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ProductsManager from '@/components/ProductsManager';
import type { Product, Category } from '@/lib/types';

export default async function ProductsPage() {
  const store = await getOwnerStore();
  if (!store) redirect('/dashboard');

  const supabase = createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('store_id', store.id).order('sort_order'),
    supabase.from('categories').select('*').eq('store_id', store.id).order('sort_order'),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Товары</h1>
      <p className="mb-6 text-gray-500">Добавляйте товары, цены, фото и бейджи скидок.</p>
      <ProductsManager
        storeId={store.id}
        currency={store.currency}
        categories={(categories as Category[]) || []}
        initial={(products as Product[]) || []}
      />
    </div>
  );
}
