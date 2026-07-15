-- Вложенные категории (дерево): категория может иметь родителя.
-- Выполните в Supabase → SQL Editor.

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete cascade;

create index if not exists idx_categories_parent on public.categories(parent_id);
