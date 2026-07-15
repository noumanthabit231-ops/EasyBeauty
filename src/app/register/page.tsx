'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setLoading(false);
      setError(error.message.includes('already') ? 'Такой email уже зарегистрирован' : error.message);
      return;
    }

    // Если email-подтверждение выключено — сессия активна сразу.
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl">
            ✉️
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Проверьте почту</h1>
          <p className="mt-3 text-sm text-gray-500">
            Мы отправили письмо на <span className="font-medium text-gray-700">{email}</span>.
            Перейдите по ссылке из письма, чтобы подтвердить адрес и войти в кабинет.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Не пришло письмо? Проверьте папку «Спам» или попробуйте войти позже.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-rose-900 px-5 py-2.5 font-medium text-white hover:bg-rose-800"
          >
            Перейти ко входу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="mb-6 block text-center text-2xl font-bold text-rose-900">
          BeautyTap
        </Link>
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-800">Создать магазин</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-rose-400"
          />
          <input
            type="password" required minLength={6} placeholder="Пароль (мин. 6 символов)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-rose-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-rose-900 py-3 font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
          >
            {loading ? 'Создаём…' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-rose-700 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
