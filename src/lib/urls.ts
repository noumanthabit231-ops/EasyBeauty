// Ссылка на витрину магазина.
// Если задан NEXT_PUBLIC_ROOT_DOMAIN — возвращаем поддомен (estet.easybeauty.kz),
// иначе путь на текущем домене (/estet).
export function storeUrl(slug: string): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return root ? `https://${slug}.${root}` : `/${slug}`;
}

// То, что показываем как «адрес витрины» в кабинете.
export function storeDisplayUrl(slug: string): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return root ? `${slug}.${root}` : `/${slug}`;
}
