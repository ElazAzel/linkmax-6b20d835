/**
 * ResponseTimeTag - Urgency indicator for leads based on age
 * < 5 min: green "just now" | 5-60 min: yellow "X min ago" | > 1h: red "X h ago" | > 24h: gray "missed"
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';
import { differenceInMinutes, differenceInHours } from 'date-fns';

interface ResponseTimeTagProps {
  createdAt: string;
  status: string;
  className?: string;
}

export type UrgencyLevel = 'fresh' | 'warm' | 'urgent' | 'missed';

export function getUrgencyLevel(createdAt: string, status: string): UrgencyLevel | null {
  if (status !== 'new') return null;
  const mins = differenceInMinutes(new Date(), new Date(createdAt));
  if (mins < 5) return 'fresh';
  if (mins < 60) return 'warm';
  if (mins < 1440) return 'urgent'; // 24h
  return 'missed';
}

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  fresh: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
  warm: 'bg-amber-500/15 text-amber-600 border-amber-500/20',
  urgent: 'bg-destructive/15 text-destructive border-destructive/20',
  missed: 'bg-muted text-muted-foreground border-border/30',
};

export const ResponseTimeTag = memo(function ResponseTimeTag({
  createdAt,
  status,
  className,
}: ResponseTimeTagProps) {
  const { t } = useTranslation();

  const { level, label } = useMemo(() => {
    const urgency = getUrgencyLevel(createdAt, status);
    if (!urgency) return { level: null, label: '' };

    const mins = differenceInMinutes(new Date(), new Date(createdAt));
    const hours = differenceInHours(new Date(), new Date(createdAt));

    switch (urgency) {
      case 'fresh':
        return { level: urgency, label: t('crm.responseTime.justNow', 'только что') };
      case 'warm':
        return { level: urgency, label: t('crm.responseTime.minutesAgo', '{{count}} мин назад', { count: mins }) };
      case 'urgent':
        return { level: urgency, label: t('crm.responseTime.hoursAgo', '{{count}} ч назад — ответьте!', { count: hours }) };
      case 'missed':
        return { level: urgency, label: t('crm.responseTime.missed', 'пропущено') };
    }
  }, [createdAt, status, t]);

  if (!level) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        URGENCY_STYLES[level],
        level === 'urgent' && 'animate-pulse',
        className
      )}
    >
      {label}
    </span>
  );
});
