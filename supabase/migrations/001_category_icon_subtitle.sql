-- Добавляет иконку (эмодзи) и подзаголовок категориям (для Taplink-стиля витрины).
-- Выполните в Supabase → SQL Editor, если БД уже создана по старой схеме.

alter table public.categories add column if not exists icon text default '';
alter table public.categories add column if not exists subtitle text default '';
