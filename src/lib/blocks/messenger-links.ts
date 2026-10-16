import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';

/**
 * Phone digits for wa.me / viber / t.me/+. Kazakhstan and Russia numbers are
 * often typed in the local "8 7xx …" form; WhatsApp only finds them as "7 7xx …".
 */
export function messengerPhoneDigits(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
}

/** The prefilled message: blocks store it either as text or as { ru, en, kk }. */
export function messengerMessageText(message: unknown, language: string): string {
  if (!message) return '';
  if (typeof message === 'string') return message.trim();
  return getI18nText(message as Parameters<typeof getI18nText>[0], language as SupportedLanguage).trim();
}

export function whatsappHref(phone: string, message: unknown, language: string): string | undefined {
  const digits = messengerPhoneDigits(phone);
  if (!digits) return undefined;
  const text = messengerMessageText(message, language);
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
