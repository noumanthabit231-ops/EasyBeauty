'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  ShoppingBag, Plus, Minus, X, MapPin, Tag, ArrowLeft, Search, ChevronRight, ChevronDown,
  Home, Instagram, Music2, Send, Percent, Gift, Package, Link as LinkIcon, Info,
} from 'lucide-react';
import { fontStack } from '@/lib/theme';
import BannerCarousel from '@/components/BannerCarousel';
import type { Store, Category, Product, Promo, Banner, Link, LinkKind, CartItem } from '@/lib/types';

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 1;
  const toLin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = toLin(parseInt(h.slice(0, 2), 16) / 255);
  const g = toLin(parseInt(h.slice(2, 4), 16) / 255);
  const b = toLin(parseInt(h.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function readableDark(...colors: string[]): string {
  const dark = colors.filter((c) => c && c.startsWith('#')).sort((a, b) => luminance(a) - luminance(b))[0];
  return dark && luminance(dark) < 0.55 ? dark : '#3f1d22';
}

function WhatsAppGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ fill: color }}>
      <path d="M17.6 6.3A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.9 11.9L4 20l4.2-1.1A7.9 7.9 0 0012 20a7.95 7.95 0 005.6-13.7zM12 18.5a6.6 6.6 0 01-3.4-.9l-.2-.1-2.5.6.7-2.4-.2-.3a6.57 6.57 0 1112.1-3.5 6.6 6.6 0 01-6.5 7z" />
    </svg>
  );
}

export default function Storefront({
  store,
  categories,
  products,
  promos,
  banners,
  links,
}: {
  store: Store;
  categories: Category[];
  products: Product[];
  promos: Promo[];
  banners: Banner[];
  links: Link[];
}) {
  const [atLanding, setAtLanding] = useState(true);
  const [stack, setStack] = useState<Category[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const accent = store.button_color || '#7a1220';
  const onAccent = store.text_on_button || '#ffffff';
  const cur = store.currency || '₸';
  const buttonTextOnWhite = readableDark(accent, onAccent);

  const hasBgImage = !!store.bg_image_url;
  const pageStyle: CSSProperties = { fontFamily: fontStack(store.font_family) };
  if (hasBgImage) {
    pageStyle.backgroundImage = `url(${store.bg_image_url})`;
    pageStyle.backgroundSize = 'cover';
    pageStyle.backgroundPosition = 'center';
    pageStyle.backgroundAttachment = 'fixed';
  } else {
    pageStyle.backgroundColor = store.bg_color || '#f9fafb';
  }

  const featBtn: CSSProperties = { background: accent, color: onAccent };
  const whiteBtn: CSSProperties = { background: 'rgba(255,255,255,0.92)', color: buttonTextOnWhite, border: '1px solid rgba(0,0,0,0.05)' };
  const btnCls = 'relative block w-full rounded-2xl px-12 py-4 text-center shadow-sm transition active:scale-[.99]';

  const childrenOf = (pid: string | null) =>
    categories.filter((c) => (c.parent_id ?? null) === pid).sort((a, b) => a.sort_order - b.sort_order);
  const productsOf = (cid: string) => products.filter((p) => p.category_id === cid);

  const current = stack[stack.length - 1] ?? null;
  const catalogRoot = stack.length === 0 && !showAll;
  const subcats = childrenOf(current?.id ?? null);
  const leafProducts = current ? productsOf(current.id) : [];

  const shownProducts = useMemo(() => {
    let list: Product[] = showAll ? products : current ? products.filter((p) => p.category_id === current.id) : [];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [showAll, current, query, products]);

  const addrStr = [store.city, store.address].filter(Boolean).join(', ');
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(addrStr)}&output=embed`;
  const mapLink = `https://maps.google.com/maps?q=${encodeURIComponent(addrStr)}`;

  // навигация
  function goLanding() { setAtLanding(true); setStack([]); setShowAll(false); setQuery(''); }
  function openCatalogRoot() { setAtLanding(false); setStack([]); setShowAll(false); setQuery(''); }
  function openAllProducts() { setAtLanding(false); setStack([]); setShowAll(true); setQuery(''); }
  function enter(c: Category) { setQuery(''); setShowAll(false); setStack((s) => [...s, c]); }
  function jumpTo(index: number) { setStack((s) => s.slice(0, index + 1)); setShowAll(false); setQuery(''); }
  function back() { setQuery(''); if (showAll) { openCatalogRoot(); return; } if (stack.length === 0) { goLanding(); return; } setStack((s) => s.slice(0, -1)); }

  // корзина
  const cartItems = Object.values(cart);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalSum = cartItems.reduce((s, i) => s + i.qty * i.product.price, 0);
  function addToCart(p: Product) { setCart((c) => ({ ...c, [p.id]: { product: p, qty: (c[p.id]?.qty || 0) + 1 } })); }
  function changeQty(id: string, delta: number) {
    setCart((c) => {
      const item = c[id];
      if (!item) return c;
      const qty = item.qty + delta;
      if (qty <= 0) { const { [id]: _, ...rest } = c; return rest; }
      return { ...c, [id]: { ...item, qty } };
    });
  }
  function checkout() {
    if (!store.whatsapp) { alert('Магазин не указал номер WhatsApp.'); return; }
    const lines = cartItems.map(
      (i) => `• ${i.product.name} — ${i.qty} × ${i.product.price.toLocaleString('ru-RU')} ${cur} = ${(i.qty * i.product.price).toLocaleString('ru-RU')} ${cur}`
    );
    const text = `Здравствуйте! Хочу оформить заказ в *${store.name}*:\n\n` + lines.join('\n') +
      `\n\n*Итого: ${totalSum.toLocaleString('ru-RU')} ${cur}*` + (store.address ? `\n\nАдрес магазина: ${addrStr}` : '');
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  }

  // ---------- иконки ссылок ----------
  function linkIcon(kind: LinkKind, color: string) {
    const cls = 'h-5 w-5';
    switch (kind) {
      case 'whatsapp': return <WhatsAppGlyph color={color} />;
      case 'instagram': return <Instagram className={cls} style={{ color }} />;
      case 'tiktok': return <Music2 className={cls} style={{ color }} />;
      case 'telegram': return <Send className={cls} style={{ color }} />;
      case 'sale': return <Percent className={cls} style={{ color }} />;
      case 'catalog': return <ShoppingBag className={cls} style={{ color }} />;
      case 'loyalty': return <Gift className={cls} style={{ color }} />;
      case 'wholesale': return <Package className={cls} style={{ color }} />;
      default: return <LinkIcon className={cls} style={{ color }} />;
    }
  }

  function renderLink(l: Link) {
    const style = l.highlight ? featBtn : whiteBtn;
    const iconColor = l.highlight ? onAccent : buttonTextOnWhite;
    const inner = (
      <>
        <span className="absolute left-4 top-1/2 -translate-y-1/2">{linkIcon(l.kind, iconColor)}</span>
        <div className="text-sm font-bold uppercase tracking-wide">{l.title}</div>
        {l.subtitle && <div className="mt-0.5 text-xs opacity-70">{l.subtitle}</div>}
      </>
    );
    if (l.kind === 'sale') return <button key={l.id} onClick={openAllProducts} className={btnCls} style={style}>{inner}</button>;
    if (l.kind === 'catalog') return <button key={l.id} onClick={openCatalogRoot} className={btnCls} style={style}>{inner}</button>;
    const href = l.kind === 'whatsapp'
      ? `https://wa.me/${(l.url || store.whatsapp).replace(/\D/g, '')}`
      : l.url || '#';
    return <a key={l.id} href={href} target="_blank" rel="noreferrer" className={btnCls} style={style}>{inner}</a>;
  }

  // ---------- кнопка категории ----------
  const catButton = (c: Category | null, featured = false) => (
    <button
      key={c?.id ?? '__all__'}
      onClick={() => (c ? enter(c) : openAllProducts())}
      className={btnCls}
      style={featured ? featBtn : whiteBtn}
    >
      {c?.icon ? (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl leading-none">{c.icon}</span>
      ) : !c ? (
        <ShoppingBag className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: featured ? onAccent : buttonTextOnWhite }} />
      ) : null}
      <div className="text-sm font-bold uppercase tracking-wide">{c ? c.name : 'ВСЕ ТОВАРЫ'}</div>
      {c?.subtitle && <div className="mt-0.5 text-xs text-gray-400">{c.subtitle}</div>}
      {c && childrenOf(c.id).length > 0 && (
        <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
      )}
    </button>
  );

  const searchBox = () => (
    <div className="relative mt-4">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по названию"
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-rose-400"
      />
    </div>
  );

  const productGrid = (list: Product[]) => (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {list.map((p) => (
        <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="relative aspect-square bg-gray-50">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">нет фото</div>
            )}
            {p.badge && (
              <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: accent, color: onAccent }}>{p.badge}</span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-3">
            <div className="text-sm font-medium leading-tight text-gray-900">{p.name}</div>
            {p.description && <div className="mt-1 line-clamp-2 text-xs text-gray-400">{p.description}</div>}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-semibold text-gray-900">{p.price.toLocaleString('ru-RU')} {cur}</span>
              {p.old_price ? <span className="text-xs text-gray-400 line-through">{p.old_price.toLocaleString('ru-RU')}</span> : null}
            </div>
            <button onClick={() => addToCart(p)} className="mt-3 w-full rounded-lg py-2 text-sm font-semibold transition active:scale-95" style={featBtn}>В корзину</button>
          </div>
        </div>
      ))}
    </div>
  );

  const logoBlock = (big: boolean, onClick?: () => void) => (
    <div className="relative flex flex-col items-center pt-8 text-center">
      <div className="pointer-events-none absolute -top-4 h-40 w-40 rounded-full opacity-40 blur-2xl" style={{ background: accent + '33' }} />
      <button onClick={onClick} disabled={!onClick} className={onClick ? 'relative cursor-pointer' : 'relative'}>
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className={`rounded-full bg-white object-cover shadow-sm ${big ? 'h-24 w-24' : 'h-16 w-16'}`} />
        ) : (
          <div className={`flex items-center justify-center rounded-full font-bold shadow-sm ${big ? 'h-24 w-24 text-3xl' : 'h-16 w-16 text-xl'}`} style={featBtn}>
            {store.name.charAt(0)}
          </div>
        )}
      </button>
      {big && (
        <div className={`relative mt-3 flex flex-col items-center ${hasBgImage ? 'rounded-2xl bg-white/75 px-6 py-3 backdrop-blur-sm' : ''}`}>
          <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
          {store.description && <p className="mt-1 max-w-md text-sm text-gray-600">{store.description}</p>}
          {addrStr && (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600"><MapPin className="h-4 w-4" /> {addrStr}</div>
          )}
        </div>
      )}
    </div>
  );

  // =================== ГЛАВНАЯ (лендинг) ===================
  if (atLanding) {
    return (
      <main className="min-h-screen pb-28" style={pageStyle}>
        <div className="mx-auto max-w-xl px-4">
          {logoBlock(true)}

          <BannerCarousel banners={banners} accent={accent} />

          {/* Промокоды */}
          {promos.length > 0 && (
            <div className="mt-6 space-y-2">
              {promos.map((p) => (
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

          {/* Кнопки */}
          <div className="mt-6 space-y-3">
            <button onClick={openCatalogRoot} className={btnCls} style={featBtn}>
              <ShoppingBag className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: onAccent }} />
              <div className="text-sm font-bold uppercase tracking-wide">Каталог товаров</div>
            </button>

            {links.map(renderLink)}
          </div>

          {/* О нас */}
          {store.about && (
            <div className="mt-3">
              <button onClick={() => setAboutOpen((o) => !o)} className={btnCls} style={whiteBtn}>
                <Info className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: buttonTextOnWhite }} />
                <div className="text-sm font-bold uppercase tracking-wide">О нас</div>
                <ChevronDown className={`absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
              </button>
              {aboutOpen && (
                <div className="mt-2 whitespace-pre-line rounded-2xl bg-white/92 p-4 text-sm text-gray-600 shadow-sm">{store.about}</div>
              )}
            </div>
          )}

          {/* Карта */}
          {store.show_map && addrStr && (
            <div className="mt-3 overflow-hidden rounded-2xl shadow-sm">
              <iframe title="Карта" src={mapSrc} className="h-56 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}

          {/* Адрес */}
          {addrStr && (
            <a href={mapLink} target="_blank" rel="noreferrer" className={`mt-3 ${btnCls}`} style={whiteBtn}>
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: buttonTextOnWhite }} />
              <div className="text-sm font-medium">{addrStr}</div>
            </a>
          )}

          <footer className="mt-12 pb-6 text-center text-xs text-gray-300">Работает на Beauty Links</footer>
        </div>
        {cartFloating()}
        {cartDrawer()}
      </main>
    );
  }

  // =================== КАТАЛОГ ===================
  return (
    <main className="min-h-screen pb-28" style={pageStyle}>
      {/* Кнопка «На главную» слева */}
      <button
        onClick={goLanding}
        title="На главную"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md hover:bg-gray-50"
      >
        <Home className="h-5 w-5" />
      </button>

      <div className="mx-auto max-w-3xl px-4">
        {logoBlock(false, goLanding)}

        {/* Хлебные крошки */}
        <div className="mt-6 flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <button onClick={goLanding} className="flex items-center gap-1 hover:text-gray-800"><Home className="h-3.5 w-3.5" /> Главная</button>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <button onClick={openCatalogRoot} className={catalogRoot && !showAll ? 'font-medium text-gray-800' : 'hover:text-gray-800'}>Каталог</button>
          {stack.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              <button onClick={() => jumpTo(i)} className={i === stack.length - 1 && !showAll ? 'font-medium text-gray-800' : 'hover:text-gray-800'}>{c.name}</button>
            </span>
          ))}
          {showAll && (<span className="flex items-center gap-1"><ChevronRight className="h-3.5 w-3.5 text-gray-300" /><span className="font-medium text-gray-800">Все товары</span></span>)}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button onClick={back} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /></button>
          <h2 className="text-lg font-bold text-gray-900">{showAll ? 'Все товары' : current ? current.name : 'Каталог товаров'}</h2>
        </div>

        {showAll ? (
          <>
            {searchBox()}
            {productGrid(shownProducts)}
            {shownProducts.length === 0 && <p className="mt-10 text-center text-gray-400">{query ? 'Ничего не найдено.' : 'Пока нет товаров.'}</p>}
          </>
        ) : catalogRoot ? (
          <>
            <div className="mt-5 space-y-3">
              {catButton(null, true)}
              {subcats.map((c) => catButton(c))}
            </div>
            {subcats.length === 0 && products.length === 0 && <p className="mt-10 text-center text-gray-400">Магазин ещё наполняется товарами.</p>}
          </>
        ) : (
          <>
            {subcats.length > 0 && <div className="mt-5 space-y-3">{subcats.map((c) => catButton(c))}</div>}
            {leafProducts.length > 0 && (
              <>
                {searchBox()}
                {productGrid(shownProducts)}
                {shownProducts.length === 0 && <p className="mt-10 text-center text-gray-400">Ничего не найдено.</p>}
              </>
            )}
            {subcats.length === 0 && leafProducts.length === 0 && <p className="mt-10 text-center text-gray-400">В этом разделе пока пусто.</p>}
          </>
        )}

        <footer className="mt-12 pb-6 text-center text-xs text-gray-300">Работает на Beauty Links</footer>
      </div>
      {cartFloating()}
      {cartDrawer()}
    </main>
  );

  // ---------- корзина ----------
  function cartFloating() {
    if (totalQty === 0) return null;
    return (
      <button onClick={() => setCartOpen(true)} className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full px-6 py-3 font-semibold shadow-xl" style={featBtn}>
        <ShoppingBag className="h-5 w-5" /> Корзина · {totalQty} · {totalSum.toLocaleString('ru-RU')} {cur}
      </button>
    );
  }
  function cartDrawer() {
    if (!cartOpen) return null;
    return (
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
              <button onClick={checkout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold" style={{ background: '#25D366', color: '#fff' }}>
                <WhatsAppGlyph color="#fff" /> Оформить заказ в WhatsApp
              </button>
              <p className="mt-2 text-center text-xs text-gray-400">Вы перейдёте в WhatsApp с готовым сообщением</p>
            </>
          )}
        </div>
      </div>
    );
  }
}
