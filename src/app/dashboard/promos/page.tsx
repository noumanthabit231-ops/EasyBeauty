import { redirect } from 'next/navigation';
import { getOwnerStore } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PromosManager from '@/components/PromosManager';
import type { Promo } from '@/lib/types';

export default async function PromosPage() {
  const store = await getOwnerStore();
  if (!store) redirect('/dashboard');

  const supabase = createClient();
  const { data } = await supabase
    .from('promos')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Акции и промокоды</h1>
      <p className="mb-6 text-gray-500">Промокоды показываются на витрине магазина.</p>
      <PromosManager storeId={store.id} initial={(data as Promo[]) || []} />
    </div>
  );
}
