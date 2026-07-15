import type { Store } from '@/lib/types';
import { isSubscriptionActive } from '@/lib/auth';

export default function SubscriptionBanner({ store }: { store: Store }) {
  const active = isSubscriptionActive(store);
  const expires = store.subscription_expires_at
    ? new Date(store.subscription_expires_at)
    : null;

  const daysLeft = expires
    ? Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (store.subscription_status === 'active') {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        ✅ Подписка активна{expires ? ` до ${expires.toLocaleDateString('ru-RU')}` : ''}.
      </div>
    );
  }

  if (store.subscription_status === 'trial' && active) {
    return (
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        🎁 Пробный период: осталось {daysLeft} дн. Свяжитесь с администратором, чтобы оформить подписку.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      ⚠️ Подписка неактивна — витрина скрыта от клиентов. Свяжитесь с администратором для продления.
    </div>
  );
}
