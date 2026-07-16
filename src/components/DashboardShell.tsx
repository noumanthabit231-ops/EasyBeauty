'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardShell({
  email,
  isSuperAdmin,
  storeHref,
  children,
}: {
  email: string;
  isSuperAdmin: boolean;
  storeHref?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // закрываем меню при переходе на другую страницу
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // не даём странице скроллиться под открытым меню
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Верхняя панель — только на телефоне */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          className="-ml-1 rounded-lg p-2 text-gray-700 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-rose-900">BeautyTap</span>
      </header>

      {/* Затемнение под открытым меню */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Сайдбар: выдвижной на телефоне, обычный на компьютере */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <div className="text-lg font-bold text-rose-900">BeautyTap</div>
            <div className="mt-1 truncate text-xs text-gray-400">{email}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className="-mr-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <DashboardNav
          isSuperAdmin={isSuperAdmin}
          storeHref={storeHref}
          onNavigate={() => setOpen(false)}
        />

        <div className="border-t border-gray-100 p-3">
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
