-- ============================================================================
--  Cosmetics SaaS — схема базы данных (Supabase / PostgreSQL)
--  Выполните этот скрипт целиком в Supabase → SQL Editor
-- ============================================================================

-- Расширения
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. profiles — привязка пользователей Supabase Auth к роли
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'owner',        -- 'owner' | 'super_admin'
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. stores — магазины (по одному на владельца, но схема допускает несколько)
-- ----------------------------------------------------------------------------
create table if not exists public.stores (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,                  -- адрес: site.com/{slug}
  name text not null default 'Мой магазин',
  description text default '',
  city text default '',
  address text default '',
  whatsapp text default '',                   -- номер в межд. формате, напр. 77001234567
  currency text default '₸',                  -- символ валюты
  logo_url text default '',
  cover_url text default '',
  button_color text default '#7a1220',        -- цвет кнопок/акцента
  text_on_button text default '#ffffff',
  font_family text default 'inter',            -- шрифт витрины
  bg_color text default '',                     -- цвет фона (пусто = по умолчанию)
  bg_image_url text default '',                 -- картинка-фон витрины
  about text default '',                         -- блок «О нас» на главной
  show_map boolean not null default true,        -- показывать карту на главной
  is_active boolean not null default true,    -- витрина видна публично
  -- Подписка (управляется супер-админом вручную)
  subscription_status text not null default 'trial',  -- 'trial' | 'active' | 'expired'
  subscription_expires_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stores_slug on public.stores(slug);
create index if not exists idx_stores_owner on public.stores(owner_id);

-- ----------------------------------------------------------------------------
-- 3. categories — категории товаров внутри магазина
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete cascade,  -- вложенность (дерево)
  name text not null,
  subtitle text default '',                   -- подзаголовок (список подкатегорий)
  icon text default '',                        -- эмодзи-иконка слева
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_store on public.categories(store_id);
create index if not exists idx_categories_parent on public.categories(parent_id);

-- ----------------------------------------------------------------------------
-- 4. products — товары / услуги
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text default '',
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),                     -- для показа скидки (зачёркнутая)
  image_url text default '',
  badge text default '',                       -- напр. 'ХИТ', 'НОВИНКА', 'АКЦИЯ'
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_store on public.products(store_id);
create index if not exists idx_products_category on public.products(category_id);

-- ----------------------------------------------------------------------------
-- 5. promos — промокоды / акции
-- ----------------------------------------------------------------------------
create table if not exists public.promos (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  description text default '',
  discount_percent int default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_promos_store on public.promos(store_id);

-- ----------------------------------------------------------------------------
-- 6. banners — баннеры-карусель на главной
-- ----------------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  image_url text not null,
  link_url text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_banners_store on public.banners(store_id);

-- ----------------------------------------------------------------------------
-- 7. links — кнопки-ссылки на главной (соцсети, SALE, лояльность, свои ссылки)
-- ----------------------------------------------------------------------------
create table if not exists public.links (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  kind text not null default 'custom',
  title text not null,
  subtitle text default '',
  url text default '',
  highlight boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_links_store on public.links(store_id);

-- ----------------------------------------------------------------------------
--  Триггер: авто-создание profile при регистрации пользователя
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'owner')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
--  Хелпер: проверка супер-админа
-- ----------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ============================================================================
--  RLS (Row Level Security)
-- ============================================================================
alter table public.profiles   enable row level security;
alter table public.stores     enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.promos     enable row level security;
alter table public.banners    enable row level security;
alter table public.links      enable row level security;

-- ---- profiles ----
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id or public.is_super_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

-- ---- stores ----
-- Публичное чтение только активных магазинов (для витрины)
drop policy if exists "stores public read" on public.stores;
create policy "stores public read" on public.stores
  for select using (is_active = true or owner_id = auth.uid() or public.is_super_admin());

drop policy if exists "stores owner insert" on public.stores;
create policy "stores owner insert" on public.stores
  for insert with check (owner_id = auth.uid());

drop policy if exists "stores owner update" on public.stores;
create policy "stores owner update" on public.stores
  for update using (owner_id = auth.uid() or public.is_super_admin());

drop policy if exists "stores owner delete" on public.stores;
create policy "stores owner delete" on public.stores
  for delete using (owner_id = auth.uid() or public.is_super_admin());

-- ---- categories / products / promos ----
-- Хелпер-условие: строка принадлежит магазину текущего владельца
--   Для чтения публично отдаём всё (витрина), запись — только владелец/суперадмин.

-- categories
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

drop policy if exists "categories owner write" on public.categories;
create policy "categories owner write" on public.categories
  for all using (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

-- products
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (true);

drop policy if exists "products owner write" on public.products;
create policy "products owner write" on public.products
  for all using (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

-- promos
drop policy if exists "promos public read" on public.promos;
create policy "promos public read" on public.promos for select using (is_active = true or
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin())));

drop policy if exists "promos owner write" on public.promos;
create policy "promos owner write" on public.promos
  for all using (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

-- banners
drop policy if exists "banners public read" on public.banners;
create policy "banners public read" on public.banners for select using (true);

drop policy if exists "banners owner write" on public.banners;
create policy "banners owner write" on public.banners
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

-- links
drop policy if exists "links public read" on public.links;
create policy "links public read" on public.links for select using (true);

drop policy if exists "links owner write" on public.links;
create policy "links owner write" on public.links
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

-- ============================================================================
--  Storage: бакет для картинок товаров/логотипов
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('store-media', 'store-media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'store-media');

drop policy if exists "media auth upload" on storage.objects;
create policy "media auth upload" on storage.objects
  for insert with check (bucket_id = 'store-media' and auth.role() = 'authenticated');

drop policy if exists "media auth update" on storage.objects;
create policy "media auth update" on storage.objects
  for update using (bucket_id = 'store-media' and auth.role() = 'authenticated');

drop policy if exists "media auth delete" on storage.objects;
create policy "media auth delete" on storage.objects
  for delete using (bucket_id = 'store-media' and auth.role() = 'authenticated');

-- ============================================================================
--  Как назначить супер-администратора (выполнить ПОСЛЕ первой регистрации):
--    update public.profiles set role = 'super_admin'
--    where email = 'noumanthabit231@gmail.com';
-- ============================================================================
