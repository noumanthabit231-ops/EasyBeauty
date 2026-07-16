import Link from 'next/link';
import { ShoppingBag, Palette, MessageCircle, LayoutGrid, Tag, Check } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-2xl font-bold tracking-tight text-rose-900">BeautyTap</div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-100">
            Войти
          </Link>
          <Link href="/register" className="rounded-lg bg-rose-900 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800">
            Создать магазин
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
        <h1 className="text-4xl font-extrabold leading-tight text-rose-950 sm:text-5xl">
          Страница-витрина для вашего<br />магазина косметики
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Загрузите товары, категории, акции и промокоды. Клиенты собирают корзину и
          оформляют заказ прямо в WhatsApp — без сайта, без эквайринга, за пару минут.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-rose-900 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-800">
            Создать магазин
          </Link>
          <Link href="/login" className="rounded-xl border border-rose-200 bg-white px-6 py-3 font-semibold text-rose-900 hover:bg-rose-50">
            У меня уже есть аккаунт
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: LayoutGrid, title: 'Категории и товары', text: 'Гибкая структура каталога: категории, цены, старые цены, бейджи «ХИТ» и «АКЦИЯ».' },
            { icon: MessageCircle, title: 'Заказы в WhatsApp', text: 'Корзина формирует готовое сообщение и открывает чат с вашим номером.' },
            { icon: Palette, title: 'Свой стиль', text: 'Логотип, обложка, цвет кнопок, название и валюта — всё настраивается.' },
            { icon: Tag, title: 'Акции и промокоды', text: 'Публикуйте промокоды со скидками и специальные предложения.' },
            { icon: ShoppingBag, title: 'Ваш адрес', text: 'Красивая ссылка вида site.com/ваш-магазин. Делитесь в Instagram и TikTok.' },
            { icon: Check, title: 'Без разработчиков', text: 'Всё редактируется в удобной админ-панели. Никакого кода.' },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
              <f.icon className="h-8 w-8 text-rose-700" />
              <h3 className="mt-4 text-lg font-semibold text-rose-950">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-rose-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} BeautyTap. Все права защищены.
      </footer>
    </main>
  );
}
