import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';

const OPTIONS = [
  { value: 'system', key: 'dashboard.accountSettings.themeSystem', fallback: 'Как в системе' },
  { value: 'light', key: 'dashboard.accountSettings.themeLight', fallback: 'Светлая' },
  { value: 'dark', key: 'dashboard.accountSettings.themeDark', fallback: 'Тёмная' },
] as const;

/**
 * Light / dark / system theme of the LinkMAX interface. Pages built by users
 * keep their own theme; this only changes the dashboard, editor and landing.
 */
export function AppThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  // next-themes knows the stored value only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme ?? 'system' : 'system';

  return (
    <div
      role="radiogroup"
      aria-label={t('dashboard.accountSettings.interfaceTheme', 'Тема интерфейса')}
      className="inline-flex rounded-control border border-border bg-muted p-0.5"
    >
      {OPTIONS.map((option) => {
        const selected = current === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              'min-h-9 rounded-[calc(var(--radius-control)-2px)] px-3 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(option.key, option.fallback)}
          </button>
        );
      })}
    </div>
  );
}
