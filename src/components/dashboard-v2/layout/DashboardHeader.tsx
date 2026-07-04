/**
 * DashboardHeader — единая шапка экранов dashboard со слотами.
 *
 * Слоты:
 *  - leading      → элемент слева от заголовка (по умолчанию: меню/back)
 *  - title        → строка заголовка
 *  - subtitle     → подзаголовок (caption)
 *  - activeTab    → пометка под-секции рядом с title
 *  - pageSwitcher → переключатель страниц (рендерится под title или вместо)
 *  - actions      → правая часть (CTA, иконки)
 *  - trailing     → дополнительные элементы справа после actions
 *  - bottomSlot   → нижняя строка под основной шапкой (toolbar, фильтры)
 *
 * Стандарты Sprint 1:
 *  - Compact высота: 14 (mobile) / 16 (desktop)
 *  - Без uppercase/black шрифтов в заголовке (font-semibold)
 *  - Sticky top-0, z-40, безопасная зона iOS
 *  - aria-label на иконках
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Menu from 'lucide-react/dist/esm/icons/menu';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { cn } from '@/lib/utils/utils';

export interface DashboardHeaderProps {
  /** Open mobile sidebar / nav drawer */
  onMenuClick?: () => void;
  /** Active sub-tab label rendered next to title */
  activeTab?: string;
  /** Page switcher dropdown (rendered under title or as title fallback) */
  pageSwitcher?: React.ReactNode;
  /** Main heading */
  title?: string;
  /** Caption under title */
  subtitle?: string;
  /** Right-aligned actions (CTAs / icon buttons) */
  actions?: React.ReactNode;
  /** Extra trailing slot rendered after actions */
  trailing?: React.ReactNode;
  /** Custom leading element (replaces default menu/back button) */
  leading?: React.ReactNode;
  /** Bottom row under the header (toolbar, filters, tabs). Sticks together with header. */
  bottomSlot?: React.ReactNode;
  /** Show back arrow instead of menu */
  showBack?: boolean;
  onBack?: () => void;
  /** Hide live status pill on desktop */
  hideLivePill?: boolean;
  className?: string;
}

export const DashboardHeader = memo(function DashboardHeader({
  onMenuClick,
  activeTab,
  pageSwitcher,
  title,
  subtitle,
  actions,
  trailing,
  leading,
  bottomSlot,
  showBack,
  onBack,
  hideLivePill,
  className,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  const defaultLeading = showBack && onBack ? (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('common.back', 'Назад')}
      className="h-10 w-10 rounded-xl hover:bg-white/10 transition-colors active:scale-95 shrink-0"
      onClick={onBack}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  ) : onMenuClick ? (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('common.menu', 'Меню')}
      className="md:hidden h-10 w-10 rounded-xl hover:bg-white/10 transition-colors active:scale-95 shrink-0"
      onClick={onMenuClick}
    >
      <Menu className="h-5 w-5" />
    </Button>
  ) : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/10 pt-[env(safe-area-inset-top)] translate-z-0",
        className,
      )}
    >
      <div className="h-14 md:h-16 flex items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {leading ?? defaultLeading}
          <div className="flex flex-col min-w-0">
            {title && (
              <h1 className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 truncate">
                <span className="truncate">{title}</span>
                {activeTab && (
                  <span className="opacity-40 text-xs md:text-sm font-normal shrink-0">
                    / {activeTab}
                  </span>
                )}
              </h1>
            )}
            {subtitle && (
              <p className="text-[11px] md:text-xs text-muted-foreground/70 truncate">
                {subtitle}
              </p>
            )}
            {!title && pageSwitcher}
          </div>
          {title && pageSwitcher && (
            <div className="hidden md:flex ml-2 shrink-0">{pageSwitcher}</div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {actions}
          {trailing}
          {!hideLivePill && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                {t('dashboard.header.live', 'Live')}
              </span>
            </div>
          )}
        </div>
      </div>

      {bottomSlot && (
        <div className="border-t border-border/10 bg-card/50">{bottomSlot}</div>
      )}
    </header>
  );
});
