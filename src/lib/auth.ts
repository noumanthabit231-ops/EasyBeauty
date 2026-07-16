import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Store, Profile } from '@/lib/types';

// cache() дедуплицирует вызовы в рамках одного серверного рендера.
// Используем getSession() (читает JWT из cookie, без сетевой проверки) —
// подлинность пользователя уже проверил middleware через getUser(),
// а доступ к данным дополнительно ограничен RLS. Это убирает лишний
// сетевой round-trip к Supabase Auth на каждую навигацию.
export const getSessionUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data as Profile | null;
});

/** Магазин текущего владельца (первый, если несколько). null — если ещё не создан. */
export const getOwnerStore = cache(async (): Promise<Store | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as Store | null;
});

/** Подписка активна, только если её включил админ и срок ещё не вышел. */
export function isSubscriptionActive(store: Store): boolean {
  if (store.subscription_status !== 'active') return false;
  if (!store.subscription_expires_at) return true;
  return new Date(store.subscription_expires_at) > new Date();
}
