import { redirect } from 'next/navigation';
import { getSessionUser, getOwnerStore, getProfile } from '@/lib/auth';
import { storeUrl } from '@/lib/urls';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [store, profile] = await Promise.all([getOwnerStore(), getProfile()]);

  return (
    <DashboardShell
      email={user.email ?? ''}
      isSuperAdmin={profile?.role === 'super_admin'}
      storeHref={store ? storeUrl(store.slug) : undefined}
    >
      {children}
    </DashboardShell>
  );
}
