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
