-- ============================================================================
--  Заполнение дерева категорий для магазина (пример клиента).
--  Выполнить в Supabase → SQL Editor → Run.
--  Скрипт находит магазин по email владельца — подставлять ничего не нужно.
--  ВНИМАНИЕ: скрипт СНАЧАЛА удаляет существующие категории этого магазина,
--  чтобы структура получилась ровно как в списке (запускать можно повторно).
-- ============================================================================

-- Нужные колонки (если миграции ещё не применяли — безопасно выполнится).
alter table public.categories add column if not exists icon text default '';
alter table public.categories add column if not exists subtitle text default '';
alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete cascade;

do $$
declare
  v_email   text := 'shoma757@mail.ru';   -- email владельца магазина
  v_store   uuid;
  v_catalog uuid;
  v_brands  uuid;
  v_deco    uuid;
  v_hair    uuid;
  v_body    uuid;
begin
  select s.id into v_store
  from public.stores s
  join auth.users u on u.id = s.owner_id
  where lower(u.email) = lower(v_email)
  order by s.created_at
  limit 1;

  if v_store is null then
    raise exception 'Магазин для email % не найден. Сначала создайте магазин в кабинете.', v_email;
  end if;

  -- чистим старые категории этого магазина (товары останутся, просто без категории)
  delete from public.categories where store_id = v_store;

  -- ---- Верхний уровень ----
  insert into public.categories (store_id, parent_id, name, subtitle, icon, sort_order)
  values (v_store, null, 'Акции', 'Sale', '🔥', 0);

  insert into public.categories (store_id, parent_id, name, icon, sort_order)
  values (v_store, null, 'Каталог товаров', '🛍️', 1)
  returning id into v_catalog;

  -- ---- Внутри «Каталог товаров» ----
  insert into public.categories (store_id, parent_id, name, sort_order)
  values (v_store, v_catalog, 'Подарочные наборы', 0);

  insert into public.categories (store_id, parent_id, name, sort_order)
  values (v_store, v_catalog, 'Бренды', 1)
  returning id into v_brands;

  insert into public.categories (store_id, parent_id, name, sort_order) values
    (v_store, v_brands, 'Anua',      0),
    (v_store, v_brands, 'Axis-Y',    1),
    (v_store, v_brands, 'Celimax',   2),
    (v_store, v_brands, 'Dr.Althea', 3);

  insert into public.categories (store_id, parent_id, name, sort_order)
  values (v_store, v_catalog, 'Декоративная косметика', 2)
  returning id into v_deco;

  insert into public.categories (store_id, parent_id, name, sort_order) values
    (v_store, v_deco, 'Тональные средства',    0),
    (v_store, v_deco, 'Праймеры, фиксаторы',   1),
    (v_store, v_deco, 'Для глаз',              2),
    (v_store, v_deco, 'Для губ',               3),
    (v_store, v_deco, 'Модулирующие средства', 4);

  insert into public.categories (store_id, parent_id, name, sort_order)
  values (v_store, v_catalog, 'Все для волос', 3)
  returning id into v_hair;

  insert into public.categories (store_id, parent_id, name, sort_order) values
    (v_store, v_hair, 'Уход (шампуни, бальзамы, маски, скрабы)', 0),
    (v_store, v_hair, 'Оттеночные средства',                    1),
    (v_store, v_hair, 'Несмываемый уход',                       2),
    (v_store, v_hair, 'Стайлинг',                               3),
    (v_store, v_hair, 'Краска для волос',                       4);

  insert into public.categories (store_id, parent_id, name, sort_order)
  values (v_store, v_catalog, 'Все для тела', 4)
  returning id into v_body;

  insert into public.categories (store_id, parent_id, name, sort_order) values
    (v_store, v_body, 'Очищение',      0),
    (v_store, v_body, 'Уход для тела',  1);

  -- ---- Остальные разделы верхнего уровня ----
  insert into public.categories (store_id, parent_id, name, icon, subtitle, sort_order) values
    (v_store, null, 'Парфюмерия',    '🌸', '',                              2),
    (v_store, null, 'Аксессуары',    '💍', 'Бижутерия, заколки, расчёски',  3),
    (v_store, null, 'Текстиль',      '🧺', '',                              4),
    (v_store, null, 'Аромадиффузоры','🕯️', '',                              5),
    (v_store, null, 'В наличии',     '✅', '',                              6);

  raise notice 'Готово: категории созданы для магазина %', v_store;
end $$;
