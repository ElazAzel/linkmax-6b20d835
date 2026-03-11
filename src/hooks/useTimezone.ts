import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, ru, kk } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { format as formatTZ, fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

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

    /**
     * Formats a date in a specific timezone
     */
    const formatInTZ = (date: Date | number | string, tz: string, formatStr: string = 'PPp') => {
        try {
            const d = typeof date === 'string' ? parseISO(date) : date;
            return formatInTimeZone(d, tz, formatStr, { locale });
        } catch (e) {
            console.error('InTZ conversion error:', e);
            return String(date);
        }
    };

    /**
     * Friendly display name for timezone (e.g. GMT+5 Almaty)
     */
    const getFriendlyTZName = (tz: string) => {
        try {
            const now = new Date();
            const offset = formatTZ(now, 'v', { timeZone: tz }); // e.g. "GMT+5"
            const parts = tz.split('/');
            const city = parts[parts.length - 1].replace(/_/g, ' ');
            return `(${offset}) ${city}`;
        } catch {
            return tz;
        }
    };

    return {
        userTimezone,
        locale,
        formatToLocal,
        getLocalOffset,
        toUTC,
        formatInTZ,
        getFriendlyTZName,
        fromZonedTime,
        toZonedTime
    };
}
