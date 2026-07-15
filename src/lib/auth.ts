import { createClient } from '@/lib/supabase/server';
import type { Store, Profile } from '@/lib/types';

export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data as Profile | null;
}

/** Магазин текущего владельца (первый, если несколько). null — если ещё не создан. */
export async function getOwnerStore(): Promise<Store | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as Store | null;
}

export function isSubscriptionActive(store: Store): boolean {
  if (store.subscription_status === 'active') return true;
  if (store.subscription_status === 'trial' && store.subscription_expires_at) {
    return new Date(store.subscription_expires_at) > new Date();
  }
  return false;
}
