import { redirect } from 'next/navigation';
import { getOwnerStore } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import BannersManager from '@/components/BannersManager';
import LinksManager from '@/components/LinksManager';
import LandingInfoForm from '@/components/LandingInfoForm';
import type { Banner, Link } from '@/lib/types';

export default async function HomepagePage() {
  const store = await getOwnerStore();
  if (!store) redirect('/dashboard');

  const supabase = createClient();
  const [{ data: banners }, { data: links }] = await Promise.all([
    supabase.from('banners').select('*').eq('store_id', store.id).order('sort_order'),
    supabase.from('links').select('*').eq('store_id', store.id).order('sort_order'),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Главная страница</h1>
      <p className="mb-8 text-gray-500">Баннеры-акции, кнопки-ссылки, блок «О нас» и карта — всё, что видит клиент на первом экране.</p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Баннеры (карусель)</h2>
        <BannersManager storeId={store.id} initial={(banners as Banner[]) || []} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Кнопки-ссылки</h2>
        <p className="mb-4 text-sm text-gray-500">WhatsApp, Instagram, TikTok, SALE, оптовые продажи и свои ссылки. Кнопка «Каталог товаров» есть на главной всегда.</p>
        <LinksManager storeId={store.id} initial={(links as Link[]) || []} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">«О нас» и карта</h2>
        <LandingInfoForm store={store} />
      </section>
    </div>
  );
}
