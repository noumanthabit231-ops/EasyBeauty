import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import AdminStores from '@/components/AdminStores';
import LogoutButton from '@/components/LogoutButton';
import type { Store } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'super_admin') redirect('/dashboard');

  const admin = createAdminClient();
  const { data: stores } = await admin
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (stores as Store[]) || [];
  const activeCount = list.filter((s) => s.subscription_status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-bold text-rose-900">Beauty Links · Супер-админ</div>
            <div className="text-xs text-gray-400">{profile.email}</div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">Мой кабинет</Link>
            <div className="w-24"><LogoutButton /></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-3xl font-bold">{list.length}</div>
            <div className="text-sm text-gray-500">Всего магазинов</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-500">Активных подписок</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-3xl font-bold text-gray-400">{list.length - activeCount}</div>
            <div className="text-sm text-gray-500">Без подписки</div>
          </div>
        </div>

        <h1 className="mb-4 text-xl font-bold text-gray-900">Магазины</h1>
        <AdminStores stores={list} />
      </main>
    </div>
  );
}
