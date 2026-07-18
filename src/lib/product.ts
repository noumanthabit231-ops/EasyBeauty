import type { Product } from '@/lib/types';

/** Список фото товара: массив images, иначе одиночное image_url, иначе пусто. */
export function productImages(p: Pick<Product, 'images' | 'image_url'>): string[] {
  if (p.images && p.images.length > 0) return p.images.filter(Boolean);
  return p.image_url ? [p.image_url] : [];
}
