import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';

/**
 * Status pill (DESIGN.md → Badge и статусы): dot + word, soft tinted
 * background. Colour is never the only signal — the label is always shown.
 */
export type StatusTone = 'success' | 'warning' | 'info' | 'destructive' | 'neutral' | 'accent';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/14 text-warning',
  info: 'bg-info/12 text-info',
  destructive: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
};

/** Presets for page/save states shown across the dashboard. */
export type StatusType = 'draft' | 'published' | 'new' | 'error' | 'saving' | 'success';

const PRESETS: Record<StatusType, { tone: StatusTone; labelKey: string; defaultLabel: string }> = {
  draft: { tone: 'warning', labelKey: 'dashboard.status.draft', defaultLabel: 'Черновик' },
  published: { tone: 'success', labelKey: 'dashboard.status.published', defaultLabel: 'Опубликован' },
  new: { tone: 'info', labelKey: 'dashboard.status.new', defaultLabel: 'Новый' },
  error: { tone: 'destructive', labelKey: 'dashboard.status.error', defaultLabel: 'Ошибка' },
  saving: { tone: 'neutral', labelKey: 'dashboard.status.saving', defaultLabel: 'Сохранение...' },
  success: { tone: 'success', labelKey: 'dashboard.status.success', defaultLabel: 'Сохранено' },
};

interface StatusBadgeProps {
  /** Preset status with a translated label. */
  status?: StatusType;
  /** Explicit tone; combine with `children` for the label. */
  tone?: StatusTone;
  children?: ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({
  status,
  tone,
  children,
  size = 'md',
  dot = true,
  className,
}: StatusBadgeProps) {
  const { t } = useTranslation();
  const preset = status ? PRESETS[status] : undefined;
  const resolvedTone = tone ?? preset?.tone ?? 'neutral';
  const label = children ?? (preset ? t(preset.labelKey, preset.defaultLabel) : null);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium',
        size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs',
        TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {label}
    </span>
  );
});
