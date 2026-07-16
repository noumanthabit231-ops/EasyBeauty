import { redirect } from 'next/navigation';
import { getOwnerStore } from '@/lib/auth';
import StoreSettingsForm from '@/components/StoreSettingsForm';

export default async function SettingsPage() {
  const store = await getOwnerStore();
  if (!store) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Настройки магазина</h1>
      <StoreSettingsForm store={store} />
    </div>
  );
}
