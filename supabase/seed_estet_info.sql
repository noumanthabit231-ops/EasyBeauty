-- ============================================================================
--  ESTET: блок «О нас» (оплата, режим работы, адреса, доставка, преимущества)
--  + две кнопки Instagram на главной.
--  Выполнить в Supabase → SQL Editor → Run. Магазин ищется по email владельца.
--  Скрипт идемпотентный: можно запускать повторно.
-- ============================================================================

do $$
declare
  v_email text := 'shoma757@mail.ru';
  v_store uuid;
  v_next  int;
begin
  select s.id into v_store
  from public.stores s
  join auth.users u on u.id = s.owner_id
  where lower(u.email) = lower(v_email)
  order by s.created_at
  limit 1;

  if v_store is null then
    raise exception 'Магазин для email % не найден', v_email;
  end if;

  -- ---- Блок «О нас» ----
  update public.stores
  set about = $about$РЕЖИМ РАБОТЫ И АДРЕСА

ТД «Арлан» (21 век), 4 бутик
Ежедневно с 11:00 до 20:00, без выходных

ТД «Ясмин», 5 мкр, 4 бутик
С 11:00 до 19:00, воскресенье — выходной


СПОСОБЫ ОПЛАТЫ

• Наличный расчёт
• Kaspi Gold / RED / Kaspi QR
• Карты: Visa / Mastercard
• Halyk, Halyk QR


ДОСТАВКА

• Такси
• Яндекс Курьером — стоимость зависит от тарифа


НАШИ ПРЕИМУЩЕСТВА

• Бесплатный индивидуальный подбор ухода
• Топовые бренды — 100% оригинальная продукция
• Уходовая и декоративная косметика$about$
  where id = v_store;

  -- ---- Кнопки Instagram (пересоздаём, чтобы не дублировались) ----
  delete from public.links where store_id = v_store and kind = 'instagram';

  select coalesce(max(sort_order) + 1, 0) into v_next
  from public.links where store_id = v_store;

  insert into public.links (store_id, kind, title, subtitle, url, highlight, sort_order) values
    (v_store, 'instagram', 'Instagram', '@estet_aksay',   'https://www.instagram.com/estet_aksay',   false, v_next),
    (v_store, 'instagram', 'Instagram', '@estet_storekz', 'https://www.instagram.com/estet_storekz', false, v_next + 1);

  raise notice 'Готово: «О нас» и 2 кнопки Instagram добавлены магазину %', v_store;
end $$;
