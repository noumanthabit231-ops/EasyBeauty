-- Кастомизация оформления витрины: шрифт и фон.
-- Выполните в Supabase → SQL Editor.

alter table public.stores add column if not exists font_family text default 'inter';
alter table public.stores add column if not exists bg_color text default '';
alter table public.stores add column if not exists bg_image_url text default '';
