/**
 * StatusBadge - Consistent status indicator
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'draft' | 'published' | 'new' | 'error' | 'saving' | 'success';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; labelKey: string; defaultLabel: string }> = {
  draft: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-600',
    labelKey: 'dashboard.status.draft',
    defaultLabel: 'Черновик',
  },
  published: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-600',
    labelKey: 'dashboard.status.published',
    defaultLabel: 'Опубликован',
  },
  new: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-600',
    labelKey: 'dashboard.status.new',
    defaultLabel: 'Новый',
  },
  error: {
    bg: 'bg-destructive/20',
    text: 'text-destructive',
    labelKey: 'dashboard.status.error',
    defaultLabel: 'Ошибка',
  },
  saving: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    labelKey: 'dashboard.status.saving',
    defaultLabel: 'Сохранение...',
  },
  success: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-600',
    labelKey: 'dashboard.status.success',
    defaultLabel: 'Сохранено',
  },
};

export const StatusBadge = memo(function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 font-semibold",
        config.bg,
        config.text,
        size === 'sm' ? 'text-xs h-5 px-2' : 'text-xs h-6 px-2.5',
        className
      )}
    >
      {t(config.labelKey, config.defaultLabel)}
    </Badge>
  );
});
