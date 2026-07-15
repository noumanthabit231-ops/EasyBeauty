-- Главная страница (link-in-bio): баннеры-карусель, кнопки-ссылки, «О нас», карта.
-- Выполните в Supabase → SQL Editor.

-- Поля магазина
alter table public.stores add column if not exists about text default '';
alter table public.stores add column if not exists show_map boolean default true;

-- Баннеры (карусель акций)
create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  image_url text not null,
  link_url text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_banners_store on public.banners(store_id);

-- Кнопки-ссылки (WhatsApp, Instagram, TikTok, SALE, лояльность, свои ссылки…)
create table if not exists public.links (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  kind text not null default 'custom',   -- whatsapp|instagram|tiktok|telegram|sale|catalog|loyalty|wholesale|custom
  title text not null,
  subtitle text default '',
  url text default '',
  highlight boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_links_store on public.links(store_id);

-- RLS
alter table public.banners enable row level security;
alter table public.links   enable row level security;

drop policy if exists "banners public read" on public.banners;
create policy "banners public read" on public.banners for select using (true);

drop policy if exists "banners owner write" on public.banners;
create policy "banners owner write" on public.banners
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

drop policy if exists "links public read" on public.links;
create policy "links public read" on public.links for select using (true);

drop policy if exists "links owner write" on public.links;
create policy "links owner write" on public.links
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  ) with check (
    exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_super_admin()))
  );
