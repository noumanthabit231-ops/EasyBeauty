import { redirect } from 'next/navigation';
import { getOwnerStore } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import CategoriesManager from '@/components/CategoriesManager';
import type { Category } from '@/lib/types';

export default async function CategoriesPage() {
  const store = await getOwnerStore();
  if (!store) redirect('/dashboard');

  const supabase = createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', store.id)
    .order('sort_order');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Категории</h1>
      <p className="mb-6 text-gray-500">Группируйте товары по разделам витрины.</p>
      <CategoriesManager storeId={store.id} initial={(data as Category[]) || []} />
    </div>
  );
}
