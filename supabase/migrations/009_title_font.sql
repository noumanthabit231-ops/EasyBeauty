-- Отдельный шрифт для названия магазина (логотипа).
-- Пусто = использовать общий шрифт витрины (font_family).
-- Выполните в Supabase → SQL Editor.

alter table public.stores add column if not exists title_font text default '';
