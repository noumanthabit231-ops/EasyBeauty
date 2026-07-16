-- Оформление названия и логотипа магазина: цвет, размеры, подложка.
-- Выполните в Supabase → SQL Editor.

-- Цвет названия (пусто = тёмный по умолчанию)
alter table public.stores add column if not exists title_color text default '';

-- Размер названия, px
alter table public.stores add column if not exists title_size int default 30;

-- Размер логотипа-аватара, px
alter table public.stores add column if not exists logo_size int default 96;

-- Белая подложка под названием (нужна только поверх пёстрого фона)
alter table public.stores add column if not exists title_plate boolean default false;
