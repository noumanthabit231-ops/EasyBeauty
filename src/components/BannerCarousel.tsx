'use client';

import { useEffect, useRef, useState } from 'react';
import type { Banner } from '@/lib/types';

export default function BannerCarousel({ banners, accent }: { banners: Banner[]; accent: string }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 4500);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const go = (i: number) => setIndex(((i % count) + count) % count);

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  }

  return (
    <div className="mt-6">
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b) => {
            const img = (
              <img src={b.image_url} alt="" className="h-full w-full object-cover" />
            );
            return (
              <div key={b.id} className="aspect-[4/5] w-full shrink-0 bg-gray-100">
                {b.link_url ? (
                  <a href={b.link_url} target="_blank" rel="noreferrer" className="block h-full w-full">{img}</a>
                ) : (
                  img
                )}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Слайд ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{ width: i === index ? 18 : 8, background: i === index ? accent : accent + '55' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
