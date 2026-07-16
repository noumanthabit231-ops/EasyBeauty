'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, Package, LayoutGrid, Settings, ExternalLink, Shield, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/dashboard/homepage', label: 'Главная страница', icon: Home },
  { href: '/dashboard/products', label: 'Товары', icon: Package },
  { href: '/dashboard/categories', label: 'Категории', icon: LayoutGrid },
  { href: '/dashboard/settings', label: 'Настройки магазина', icon: Settings },
];

export default function DashboardNav({
  isSuperAdmin,
  storeHref,
}: {
  isSuperAdmin: boolean;
  storeHref?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map((item) => {
        const active =
          item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-rose-100 text-rose-900'
                : 'text-gray-700 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      {isSuperAdmin && (
        <Link
          href="/admin"
          className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname.startsWith('/admin')
              ? 'bg-amber-200 text-amber-900'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <Shield className="h-4 w-4" /> Супер-админка
        </Link>
      )}

      {storeHref && (
        <a
          href={storeHref}
          target="_blank"
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
        >
          <ExternalLink className="h-4 w-4" /> Открыть витрину
        </a>
      )}
    </nav>
  );
}
