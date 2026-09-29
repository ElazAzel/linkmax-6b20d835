/**
 * SmartActionDock — нижний док редактора: добавить блок, оформление, ИИ.
 * Превью и публикация — только в верхней панели (EditorTopBar), без дублей. По мобильному стандарту 2026 — крупные
 * tap-зоны (48–56px), gradient-emphasis на главном CTA.
 *
 * Десктоп: floating пилюля по центру, 56px.
 * Мобайл: full-width, h-16, поднимается над DashboardBottomNav (BottomNav сам
 * добавит safe-area). Канвас должен иметь pb >= 128px чтобы док не закрывал
 * контент.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Palette from 'lucide-react/dist/esm/icons/palette';
import { cn } from '@/lib/utils/utils';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { hapticLight, hapticSelection } from '@/platform/native/haptics';

export interface SmartActionDockProps {
  onAddBlock: () => void;
  onAIImprove?: () => void;
  onCustomize?: () => void;
  hasContent?: boolean;
  className?: string;
}

export const SmartActionDock = memo(function SmartActionDock({
  onAddBlock,
  onAIImprove,
  onCustomize,
  hasContent,
  className,
}: SmartActionDockProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div
      role="toolbar"
      aria-label={t('editor.dock.label', 'Действия редактора')}
      className={cn(
        'fixed z-40 left-1/2 -translate-x-1/2',
        // mobile: над BottomNav (BottomNav примерно 80px + safe-area)
        isMobile
          ? 'bottom-[calc(env(safe-area-inset-bottom)+88px)] w-[calc(100vw-1rem)] max-w-md'
          : 'bottom-6 w-auto',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1 p-1.5 rounded-2xl',
          'bg-card border border-border shadow-lg',
        )}
      >
        {/* Primary: Add block */}
        <button
          type="button"
          onClick={() => { hapticLight(); onAddBlock(); }}
          aria-label={t('editor.dock.add', 'Добавить блок')}
          data-onboarding="add-block"
          className={cn(
            'group flex items-center gap-2 h-12 rounded-xl px-4 transition-all',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'active:scale-[0.97]',
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-sm font-semibold whitespace-nowrap">
            {t('editor.dock.add', 'Блок')}
          </span>
        </button>

        {/* AI Improve — only when there is content */}
        {onCustomize && (
          <button
            type="button"
            onClick={() => { hapticSelection(); onCustomize(); }}
            aria-label={t('editor.dock.customize', 'Оформление страницы')}
            title={t('editor.dock.customize', 'Оформление страницы')}
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-xl transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'active:scale-[0.95]',
            )}
          >
            <Palette className="h-5 w-5" />
          </button>
        )}

        {onAIImprove && hasContent && (
          <button
            type="button"
            onClick={() => { hapticSelection(); onAIImprove(); }}
            aria-label={t('editor.dock.ai', 'AI-улучшение')}
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-xl transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'active:scale-[0.95]',
            )}
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}

      </div>
    </div>
  );
});
