-- ============================================================================
--  Ручное управление заказами владельцем магазина:
--  добавить заказ (с выбором даты), удалить заказ, удалить позицию из заказа.
--  Выполните в Supabase → SQL Editor.
-- ============================================================================

-- Проверка: текущий пользователь — владелец магазина (или супер-админ)
create or replace function public.owns_store(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id
      and (s.owner_id = auth.uid() or public.is_super_admin())
  );
$$;

-- ---------------------------------------------------------------------------
--  Добавить заказ вручную (напр. друг заказал не через сайт).
--  Клиент шлёт [{product_id, qty}] и дату; цены/названия/сумму считает сервер.
-- ---------------------------------------------------------------------------
create or replace function public.create_manual_order(
  p_store_id uuid,
  p_items jsonb,
  p_created_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_count int := 0;
  v_at timestamptz := coalesce(p_created_at, now());
begin
  if not public.owns_store(p_store_id) then
    raise exception 'Нет доступа к этому магазину';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Пустой заказ';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Слишком много позиций';
  end if;

  insert into public.orders (store_id, created_at)
  values (p_store_id, v_at)
  returning id into v_order_id;

  -- created_at позиций = дате заказа, иначе аналитика по периодам разъедется
  insert into public.order_items (order_id, store_id, product_id, product_name, price, qty, created_at)
  select v_order_id, p_store_id, p.id, p.name, p.price,
         greatest(1, least(999, coalesce((i->>'qty')::int, 1))),
         v_at
  from jsonb_array_elements(p_items) as i
  join public.products p
    on p.id = (i->>'product_id')::uuid and p.store_id = p_store_id;

  select coalesce(sum(price * qty), 0), coalesce(sum(qty), 0)
    into v_total, v_count
  from public.order_items where order_id = v_order_id;

  if v_count = 0 then
    delete from public.orders where id = v_order_id;
    raise exception 'Товары не найдены';
  end if;

  update public.orders set total = v_total, items_count = v_count where id = v_order_id;
  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
--  Удалить заказ целиком (позиции удалятся каскадом)
-- ---------------------------------------------------------------------------
create or replace function public.delete_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_store uuid;
begin
  select store_id into v_store from public.orders where id = p_order_id;
  if v_store is null then raise exception 'Заказ не найден'; end if;
  if not public.owns_store(v_store) then raise exception 'Нет доступа'; end if;

  delete from public.orders where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
--  Удалить одну позицию из заказа. Сумма заказа пересчитывается.
--  Если позиций не осталось — удаляется и сам заказ.
-- ---------------------------------------------------------------------------
create or replace function public.delete_order_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid;
  v_order uuid;
  v_total numeric(12,2) := 0;
  v_count int := 0;
begin
  select store_id, order_id into v_store, v_order
  from public.order_items where id = p_item_id;

  if v_order is null then raise exception 'Позиция не найдена'; end if;
  if not public.owns_store(v_store) then raise exception 'Нет доступа'; end if;

  delete from public.order_items where id = p_item_id;

  select coalesce(sum(price * qty), 0), coalesce(sum(qty), 0)
    into v_total, v_count
  from public.order_items where order_id = v_order;

  if v_count = 0 then
    delete from public.orders where id = v_order;
  else
    update public.orders set total = v_total, items_count = v_count where id = v_order;
  end if;
end;
$$;

grant execute on function public.owns_store(uuid) to authenticated;
grant execute on function public.create_manual_order(uuid, jsonb, timestamptz) to authenticated;
grant execute on function public.delete_order(uuid) to authenticated;
grant execute on function public.delete_order_item(uuid) to authenticated;
