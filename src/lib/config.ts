// Номер WhatsApp администратора платформы.
// На него уходят заказы с витрин, у которых закончилась подписка.
// Можно переопределить переменной окружения NEXT_PUBLIC_FALLBACK_WHATSAPP.
export const FALLBACK_WHATSAPP = (
  process.env.NEXT_PUBLIC_FALLBACK_WHATSAPP || '77478504881'
).replace(/\D/g, '');
