import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beauty Links — витрина для косметических магазинов',
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
      <body className="font-sans antialiased text-gray-900">{children}</body>
    </html>
  );
}
