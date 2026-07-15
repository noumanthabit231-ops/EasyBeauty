import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Settings, LayoutGrid, Package, ExternalLink, Home } from 'lucide-react';
import { getSessionUser, getOwnerStore, getProfile } from '@/lib/auth';
import { storeUrl } from '@/lib/urls';
import LogoutButton from '@/components/LogoutButton';

const navItems = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/dashboard/homepage', label: 'Главная страница', icon: Home },
  { href: '/dashboard/products', label: 'Товары', icon: Package },
  { href: '/dashboard/categories', label: 'Категории', icon: LayoutGrid },
  { href: '/dashboard/settings', label: 'Настройки магазина', icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [store, profile] = await Promise.all([getOwnerStore(), getProfile()]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <div className="text-lg font-bold text-rose-900">Beauty Links</div>
          <div className="mt-1 truncate text-xs text-gray-400">{user.email}</div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          {profile?.role === 'super_admin' && (
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              <LayoutDashboard className="h-4 w-4" /> Супер-админка
            </Link>
          )}

          {store && (
            <a
              href={storeUrl(store.slug)}
              target="_blank"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              <ExternalLink className="h-4 w-4" /> Открыть витрину
            </a>
          )}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
