'use client';

import { useState, useTransition } from 'react';
import { ExternalLink } from 'lucide-react';
import { activateSubscription, expireSubscription, toggleStoreActive } from '@/app/admin/actions';
import { storeUrl, storeDisplayUrl } from '@/lib/urls';
import type { Store } from '@/lib/types';

function StatusBadge({ store }: { store: Store }) {
  const isActive =
    store.subscription_status === 'active' &&
    (!store.subscription_expires_at || new Date(store.subscription_expires_at) > new Date());
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isActive ? 'Активна' : 'Нет подписки'}
    </span>
  );
}

export default function AdminStores({ stores }: { stores: Store[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function run(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    startTransition(async () => {
      await fn();
      setBusyId(null);
    });
  }

  if (stores.length === 0) {
    return <p className="text-gray-400">Пока нет ни одного магазина.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="px-4 py-3">Магазин</th>
            <th className="px-4 py-3">Подписка</th>
            <th className="px-4 py-3">Действует до</th>
            <th className="px-4 py-3">Витрина</th>
            <th className="px-4 py-3">Действия</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => {
            const busy = busyId === s.id && pending;
            return (
              <tr key={s.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{s.name}</div>
                  <a href={storeUrl(s.slug)} target="_blank" className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline">
                    {storeDisplayUrl(s.slug)} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-3"><StatusBadge store={s} /></td>
                <td className="px-4 py-3 text-gray-600">
                  {s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString('ru-RU') : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => run(s.id, () => toggleStoreActive(s.id, !s.is_active))}
                    disabled={busy}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {s.is_active ? 'вкл' : 'выкл'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => run(s.id, () => activateSubscription(s.id, 1))} disabled={busy}
                      className="rounded-lg bg-rose-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-800 disabled:opacity-50">
                      +1 мес
                    </button>
                    <button onClick={() => run(s.id, () => activateSubscription(s.id, 3))} disabled={busy}
                      className="rounded-lg bg-rose-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50">
                      +3 мес
                    </button>
                    <button onClick={() => run(s.id, () => activateSubscription(s.id, 12))} disabled={busy}
                      className="rounded-lg bg-rose-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50">
                      +1 год
                    </button>
                    <button onClick={() => run(s.id, () => expireSubscription(s.id))} disabled={busy}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                      Отключить
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
