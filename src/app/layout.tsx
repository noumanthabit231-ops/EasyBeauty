import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BeautyTap — витрина для косметических магазинов',
  description:
    'Создайте страницу вашего магазина косметики за 5 минут: товары, категории, акции, промокоды и заказы через WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&family=Inter:wght@400;500;600;700&family=Lora:wght@400;600;700&family=Montserrat:wght@400;600;700&family=PT+Serif:wght@400;700&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-gray-900">{children}</body>
    </html>
  );
}
