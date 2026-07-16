import { redirect } from 'next/navigation';
import { getSessionUser, getOwnerStore, getProfile } from '@/lib/auth';
import { storeUrl } from '@/lib/urls';
import DashboardNav from '@/components/DashboardNav';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [store, profile] = await Promise.all([getOwnerStore(), getProfile()]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <div className="text-lg font-bold text-rose-900">BeautyTap</div>
          <div className="mt-1 truncate text-xs text-gray-400">{user.email}</div>
        </div>

        <DashboardNav
          isSuperAdmin={profile?.role === 'super_admin'}
          storeHref={store ? storeUrl(store.slug) : undefined}
        />

        <div className="border-t border-gray-100 p-3">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
