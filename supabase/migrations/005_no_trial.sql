-- Убираем пробный период: у платформы его нет.
-- Новый магазин создаётся БЕЗ подписки; подписку включает супер-админ в /admin.
-- Пока подписки нет — витрина работает, но заказы уходят администратору платформы.
-- Выполните в Supabase → SQL Editor.

-- 1. Новые магазины больше не получают trial на 14 дней
alter table public.stores
  alter column subscription_status set default 'expired';

alter table public.stores
  alter column subscription_expires_at drop default;

-- 2. Существующие «пробные» магазины переводим в «без подписки»
update public.stores
set subscription_status = 'expired'
where subscription_status = 'trial';
