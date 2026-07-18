-- Несколько фото у товара. images[0] — главное (оно же дублируется в image_url
-- для обратной совместимости: миниатюры в корзине/заказах).
-- Выполните в Supabase → SQL Editor.

alter table public.products add column if not exists images text[] not null default '{}';

-- Перенести уже загруженные одиночные фото в массив
update public.products
set images = array[image_url]
where (images is null or array_length(images, 1) is null)
  and coalesce(image_url, '') <> '';
