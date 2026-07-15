import type { Store } from '@/lib/types';
import { isSubscriptionActive } from '@/lib/auth';

export default function SubscriptionBanner({ store }: { store: Store }) {
  const active = isSubscriptionActive(store);

  // Пока подписка активна (в т.ч. пробный период) — ничего не показываем.
  if (active) return null;

  // Показываем предупреждение только когда витрина реально скрыта.
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      ⚠️ Подписка неактивна — витрина скрыта от клиентов. Свяжитесь с администратором для продления.
    </div>
  );
}
