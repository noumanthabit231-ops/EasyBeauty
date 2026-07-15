import { createClient } from '@/lib/supabase/client';

const BUCKET = 'store-media';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality)
  );
}

/**
 * Сжимает изображение до целевого размера (по умолчанию ~100 КБ):
 * уменьшает качество, при необходимости — и размеры. Возвращает JPEG-Blob.
 * Прозрачный фон заливается белым.
 */
async function compressImage(file: File, maxKB = 100): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;

  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  function draw(maxDim: number) {
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
      else { width = Math.round((width * maxDim) / height); height = maxDim; }
    }
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }

  const maxBytes = maxKB * 1024;
  let maxDim = 1200;
  draw(maxDim);
  let quality = 0.85;
  let blob = await toBlob(canvas, quality);

  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await toBlob(canvas, quality);
  }
  while (blob.size > maxBytes && maxDim > 400) {
    maxDim = Math.round(maxDim * 0.8);
    draw(maxDim);
    quality = 0.7;
    blob = await toBlob(canvas, quality);
    while (blob.size > maxBytes && quality > 0.4) {
      quality -= 0.1;
      blob = await toBlob(canvas, quality);
    }
  }
  return blob;
}

/** Сжимает и загружает файл в бакет store-media, возвращает публичный URL. */
export async function uploadImage(file: File, storeId: string): Promise<string> {
  const supabase = createClient();
  const blob = await compressImage(file, 100);
  const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Удаляет файл из бакета по его публичному URL (безопасно игнорирует чужие/пустые URL). */
export async function deleteImage(url?: string | null): Promise<void> {
  if (!url) return;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return; // не наш бакет — ничего не делаем
  const path = url.slice(i + marker.length).split('?')[0];
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
