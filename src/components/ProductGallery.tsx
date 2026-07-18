'use client';

import { useEffect, useRef, useState } from 'react';

export default function ProductGallery({
  images,
  fit = 'cover',
  autoplay = false,
  onImageClick,
  accent = '#7a1220',
}: {
  images: string[];
  fit?: 'cover' | 'contain';
  autoplay?: boolean;
  onImageClick?: () => void;
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const stopped = useRef(false);
  const downX = useRef<number | null>(null);
  const moved = useRef(false);

  const count = images.length;

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  }

  function goTo(i: number) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  // Автопрокрутка (только в детальном просмотре). Останавливается навсегда,
  // как только пользователь коснулся/пролистнул/прокрутил колесом.
  useEffect(() => {
    if (!autoplay || count <= 1) return;
    const t = setInterval(() => {
      if (stopped.current) return;
      const el = ref.current;
      if (!el) return;
      const cur = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((cur + 1) % count) * el.clientWidth, behavior: 'smooth' });
    }, 3000);
    return () => clearInterval(t);
  }, [autoplay, count]);

  function stopAuto() {
    stopped.current = true;
  }

  if (count === 0) {
    return <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">нет фото</div>;
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={(e) => {
          downX.current = e.clientX;
          moved.current = false;
          stopAuto();
        }}
        onPointerMove={(e) => {
          if (downX.current !== null && Math.abs(e.clientX - downX.current) > 8) moved.current = true;
        }}
        onWheel={stopAuto}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, i) => (
          <div key={i} className="h-full w-full shrink-0 snap-center">
            <img
              src={src}
              alt=""
              draggable={false}
              onClick={() => { if (!moved.current) onImageClick?.(); }}
              className={`h-full w-full select-none ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${onImageClick ? 'cursor-pointer' : ''}`}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          {/* Точки */}
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 14 : 6,
                  background: i === idx ? accent : 'rgba(255,255,255,0.85)',
                  boxShadow: '0 0 2px rgba(0,0,0,0.35)',
                }}
              />
            ))}
          </div>
          {/* Счётчик */}
          <div className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white">
            {idx + 1}/{count}
          </div>
        </>
      )}
    </div>
  );
}
