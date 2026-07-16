-- ============================================================================
--  Заказы для аналитики.
--  Заказ фиксируется в момент, когда клиент нажал «Оформить заказ в WhatsApp».
--  Выполните в Supabase → SQL Editor.
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  total numeric(12,2) not null default 0,
  items_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,          -- снимок названия на момент заказа
  price numeric(12,2) not null,        -- снимок цены
  qty int not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_store_created on public.order_items(store_id, created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ---------------------------------------------------------------------------
--  RLS: читать заказы может только владелец магазина (и супер-админ).
--  Прямая вставка запрещена — заказы создаются только функцией create_order.
-- ---------------------------------------------------------------------------
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders owner read" on public.orders;
create policy "orders owner read" on public.orders
  for select using (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

drop policy if exists "order_items owner read" on public.order_items;
create policy "order_items owner read" on public.order_items
  for select using (
    exists (select 1 from public.stores s where s.id = store_id
            and (s.owner_id = auth.uid() or public.is_super_admin()))
  );

-- ---------------------------------------------------------------------------
--  create_order — единственный способ создать заказ.
--  Клиент присылает только [{product_id, qty}]; названия, цены и сумму
--  считает сервер по данным из БД, чтобы их нельзя было подделать.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p_store_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_count int := 0;
begin
  if not exists (select 1 from public.stores where id = p_store_id and is_active = true) then
    raise exception 'Магазин не найден';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Пустой заказ';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Слишком много позиций';
  end if;

  insert into public.orders (store_id) values (p_store_id) returning id into v_order_id;

  insert into public.order_items (order_id, store_id, product_id, product_name, price, qty)
  select
    v_order_id,
    p_store_id,
    p.id,
    p.name,
    p.price,
    greatest(1, least(999, coalesce((i->>'qty')::int, 1)))
  from jsonb_array_elements(p_items) as i
  join public.products p
    on p.id = (i->>'product_id')::uuid
   and p.store_id = p_store_id;

  select coalesce(sum(price * qty), 0), coalesce(sum(qty), 0)
    into v_total, v_count
  from public.order_items where order_id = v_order_id;

  if v_count = 0 then
    delete from public.orders where id = v_order_id;
    raise exception 'Товары не найдены';
  end if;

  update public.orders
     set total = v_total, items_count = v_count
   where id = v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(uuid, jsonb) to anon, authenticated;
