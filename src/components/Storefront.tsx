'use client';

import { useMemo, useState } from 'react';
import { ShoppingBag, Plus, Minus, X, MapPin, Tag } from 'lucide-react';
import type { Store, Category, Product, Promo, CartItem } from '@/lib/types';

export default function Storefront({
  store,
  categories,
  products,
  promos,
}: {
  store: Store;
  categories: Category[];
  products: Product[];
  promos: Promo[];
}) {
  const [activeCat, setActiveCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const accent = store.button_color || '#7a1220';
  const onAccent = store.text_on_button || '#ffffff';
  const cur = store.currency || '₸';

  const visible = useMemo(
    () => (activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat)),
    [activeCat, products]
  );

  const cartItems = Object.values(cart);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalSum = cartItems.reduce((s, i) => s + i.qty * i.product.price, 0);

  function addToCart(p: Product) {
    setCart((c) => ({ ...c, [p.id]: { product: p, qty: (c[p.id]?.qty || 0) + 1 } }));
  }
  function changeQty(id: string, delta: number) {
    setCart((c) => {
      const cur = c[id];
      if (!cur) return c;
      const qty = cur.qty + delta;
      if (qty <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...cur, qty } };
    });
  }

  function checkout() {
    if (!store.whatsapp) {
      alert('Магазин не указал номер WhatsApp.');
      return;
    }
    const lines = cartItems.map(
      (i) => `• ${i.product.name} — ${i.qty} × ${i.product.price.toLocaleString('ru-RU')} ${cur} = ${(i.qty * i.product.price).toLocaleString('ru-RU')} ${cur}`
    );
    const text =
      `Здравствуйте! Хочу оформить заказ в *${store.name}*:\n\n` +
      lines.join('\n') +
      `\n\n*Итого: ${totalSum.toLocaleString('ru-RU')} ${cur}*` +
      (store.address ? `\n\nАдрес магазина: ${store.city} ${store.address}` : '');
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      {/* Cover + header */}
      <div className="relative">
        {store.cover_url ? (
          <img src={store.cover_url} alt="" className="h-40 w-full object-cover sm:h-56" />
        ) : (
          <div className="h-28 w-full" style={{ background: accent }} />
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-12 flex flex-col items-center text-center">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-md" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-2xl font-bold shadow-md" style={{ background: accent, color: onAccent }}>
              {store.name.charAt(0)}
            </div>
          )}
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{store.name}</h1>
          {store.description && <p className="mt-1 max-w-md text-sm text-gray-500">{store.description}</p>}
          {(store.city || store.address) && (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" /> {[store.city, store.address].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* Promos */}
        {promos.length > 0 && (
          <div className="mt-6 space-y-2">
            {promos.map((p: Promo) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: accent + '40', background: accent + '0d' }}>
                <Tag className="h-5 w-5 shrink-0" style={{ color: accent }} />
                <div className="flex-1 text-sm">
                  <span className="font-mono font-bold" style={{ color: accent }}>{p.code}</span>
                  {p.description && <span className="text-gray-600"> — {p.description}</span>}
                </div>
                {p.discount_percent > 0 && <span className="text-sm font-bold" style={{ color: accent }}>-{p.discount_percent}%</span>}
              </div>
            ))}
          </div>
        )}

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCat('all')}
              className="rounded-full px-4 py-1.5 text-sm font-medium"
              style={activeCat === 'all' ? { background: accent, color: onAccent } : { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' }}
            >
              Все
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={activeCat === c.id ? { background: accent, color: onAccent } : { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="relative aspect-square bg-gray-50">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">нет фото</div>
                )}
                {p.badge && (
                  <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: accent, color: onAccent }}>
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="text-sm font-medium leading-tight text-gray-900">{p.name}</div>
                {p.description && <div className="mt-1 line-clamp-2 text-xs text-gray-400">{p.description}</div>}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-semibold text-gray-900">{p.price.toLocaleString('ru-RU')} {cur}</span>
                  {p.old_price ? <span className="text-xs text-gray-400 line-through">{p.old_price.toLocaleString('ru-RU')}</span> : null}
                </div>
                <button
                  onClick={() => addToCart(p)}
                  className="mt-3 w-full rounded-lg py-2 text-sm font-semibold transition active:scale-95"
                  style={{ background: accent, color: onAccent }}
                >
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>

        {visible.length === 0 && <p className="mt-10 text-center text-gray-400">В этой категории пока нет товаров.</p>}

        <footer className="mt-12 pb-6 text-center text-xs text-gray-300">
          Работает на Beauty Links
        </footer>
      </div>

      {/* Floating cart button */}
      {totalQty > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full px-6 py-3 font-semibold shadow-xl"
          style={{ background: accent, color: onAccent }}
        >
          <ShoppingBag className="h-5 w-5" />
          Корзина · {totalQty} · {totalSum.toLocaleString('ru-RU')} {cur}
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setCartOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Ваш заказ</h2>
              <button onClick={() => setCartOpen(false)} className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            {cartItems.length === 0 ? (
              <p className="py-8 text-center text-gray-400">Корзина пуста</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {cartItems.map((i) => (
                    <li key={i.product.id} className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        {i.product.image_url && <img src={i.product.image_url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{i.product.name}</div>
                        <div className="text-xs text-gray-400">{i.product.price.toLocaleString('ru-RU')} {cur}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(i.product.id, -1)} className="rounded-full border p-1"><Minus className="h-4 w-4" /></button>
                        <span className="w-6 text-center text-sm font-medium">{i.qty}</span>
                        <button onClick={() => changeQty(i.product.id, 1)} className="rounded-full border p-1"><Plus className="h-4 w-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <span className="text-gray-500">Итого</span>
                  <span className="text-xl font-bold">{totalSum.toLocaleString('ru-RU')} {cur}</span>
                </div>

                <button
                  onClick={checkout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold"
                  style={{ background: '#25D366', color: '#fff' }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.6 6.3A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.9 11.9L4 20l4.2-1.1A7.9 7.9 0 0012 20a7.95 7.95 0 005.6-13.7zM12 18.5a6.6 6.6 0 01-3.4-.9l-.2-.1-2.5.6.7-2.4-.2-.3a6.57 6.57 0 1112.1-3.5 6.6 6.6 0 01-6.5 7z"/></svg>
                  Оформить заказ в WhatsApp
                </button>
                <p className="mt-2 text-center text-xs text-gray-400">Вы перейдёте в WhatsApp с готовым сообщением</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
