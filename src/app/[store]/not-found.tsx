import Link from 'next/link';

export default function StoreNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Магазин не найден</h1>
        <p className="mt-2 text-gray-500">Проверьте правильность ссылки.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-rose-900 px-5 py-2.5 font-medium text-white hover:bg-rose-800">
          На главную
        </Link>
      </div>
    </main>
  );
}
