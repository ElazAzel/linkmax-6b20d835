/**
 * Locale-aware date & currency formatting utilities
 *
 * Instead of hardcoding 'ru-RU', these helpers use the current i18n language
 * mapped to a proper BCP 47 locale tag.
 */

const LANGUAGE_TO_LOCALE: Record<string, string> = {
    ru: 'ru-RU',
    en: 'en-US',
    kk: 'kk-KZ',
};

/**
 * Get BCP 47 locale from i18n language code
 */
export function getLocale(lang?: string): string {
    return LANGUAGE_TO_LOCALE[lang || 'ru'] || 'ru-RU';
}

/**
 * Format a date string or Date using the user's locale
 */
export function formatDate(
    dateInput: string | Date | null | undefined,
    lang?: string,
    options?: Intl.DateTimeFormatOptions
): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const defaultOpts: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    };

    return date.toLocaleDateString(getLocale(lang), options || defaultOpts);
}

/**
 * Format a date with time
 */
export function formatDateTime(
    dateInput: string | Date | null | undefined,
    lang?: string
): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString(getLocale(lang), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a compact date (no year)
 */
export function formatDateShort(
    dateInput: string | Date | null | undefined,
    lang?: string
): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString(getLocale(lang), {
        day: 'numeric',
        month: 'long',
    });
}

/**
 * Format currency (KZT by default)
 */
export function formatCurrency(
    amount: number,
    lang?: string,
    currency = 'KZT'
): string {
    return new Intl.NumberFormat(getLocale(lang), {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format a relative time (e.g., "2 days ago", "через 3 часа")
 */
export function formatRelativeTime(
    dateInput: string | Date | null | undefined,
    lang?: string
): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const now = Date.now();
    const diffMs = date.getTime() - now;
    const absDiffMs = Math.abs(diffMs);

    const rtf = new Intl.RelativeTimeFormat(getLocale(lang), { numeric: 'auto' });

    if (absDiffMs < 60_000) return rtf.format(Math.round(diffMs / 1000), 'second');
    if (absDiffMs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), 'minute');
    if (absDiffMs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), 'hour');
    if (absDiffMs < 2_592_000_000) return rtf.format(Math.round(diffMs / 86_400_000), 'day');
    return rtf.format(Math.round(diffMs / 2_592_000_000), 'month');
}
