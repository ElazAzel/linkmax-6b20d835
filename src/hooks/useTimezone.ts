import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, ru, kk } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export interface TimezoneInfo {
    name: string;
    offset: string;
    value: string;
}

/**
 * useTimezone - Hook for automated DST/Local offset handling
 * and timezone-aware date formatting.
 */
export function useTimezone() {
    const { i18n } = useTranslation();

    const locale = useMemo(() => {
        switch (i18n.language) {
            case 'ru': return ru;
            case 'kk': return kk;
            default: return enUS;
        }
    }, [i18n.language]);

    const userTimezone = useMemo(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }, []);

    /**
     * Formats a UTC date string to the user's local time
     */
    const formatToLocal = (utcString: string, formatStr: string = 'PPp') => {
        try {
            const date = parseISO(utcString);
            return format(date, formatStr, { locale });
        } catch (e) {
            console.error('Timezone conversion error:', e);
            return utcString;
        }
    };

    /**
     * Returns the current offset in minutes (e.g., -300 for GMT+5)
     */
    const getLocalOffset = () => new Date().getTimezoneOffset();

    /**
     * Converts local time to UTC for server submission
     */
    const toUTC = (date: Date) => {
        return date.toISOString();
    };

    return {
        userTimezone,
        locale,
        formatToLocal,
        getLocalOffset,
        toUTC
    };
}
