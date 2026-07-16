'use server';

import { revalidatePath } from 'next/cache';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

async function assertSuperAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Доступ запрещён');
  }
}

/** Активировать подписку на N месяцев (продлевает от текущей даги окончания или now). */
export async function activateSubscription(storeId: string, months: number) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: store } = await admin
    .from('stores')
    .select('subscription_expires_at')
    .eq('id', storeId)
    .single();

  const base =
    store?.subscription_expires_at && new Date(store.subscription_expires_at) > new Date()
      ? new Date(store.subscription_expires_at)
      : new Date();
  base.setMonth(base.getMonth() + months);

  await admin
    .from('stores')
    .update({
      subscription_status: 'active',
      subscription_expires_at: base.toISOString(),
      is_active: true,
    })
    .eq('id', storeId);

  revalidatePath('/admin');
}

/** Установить произвольную дату окончания подписки (YYYY-MM-DD). */
export async function setSubscriptionUntil(storeId: string, dateISO: string) {
  await assertSuperAdmin();
  if (!dateISO) throw new Error('Не указана дата');

  // конец выбранного дня — чтобы «до 20 июля» означало включительно
  const until = new Date(`${dateISO}T23:59:59`);
  if (isNaN(until.getTime())) throw new Error('Некорректная дата');

  const isPast = until <= new Date();
  const admin = createAdminClient();

  await admin
    .from('stores')
    .update({
      subscription_status: isPast ? 'expired' : 'active',
      subscription_expires_at: until.toISOString(),
      ...(isPast ? {} : { is_active: true }),
    })
    .eq('id', storeId);

  revalidatePath('/admin');
}

/** Пометить подписку истёкшей (скрывает витрину). */
export async function expireSubscription(storeId: string) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  await admin
    .from('stores')
    .update({ subscription_status: 'expired' })
    .eq('id', storeId);
  revalidatePath('/admin');
}

/** Включить/выключить публикацию витрины. */
export async function toggleStoreActive(storeId: string, active: boolean) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  await admin.from('stores').update({ is_active: active }).eq('id', storeId);
  revalidatePath('/admin');
}
