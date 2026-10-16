/**
 * SmartActionDock — нижний док редактора: добавить блок, оформление, ИИ.
 * Превью и публикация — только в верхней панели (EditorTopBar), без дублей. По мобильному стандарту 2026 — крупные
 * tap-зоны (48–56px), gradient-emphasis на главном CTA.
 *
 * Десктоп: пилюля прилипает к низу колонки холста, 56px.
 * Мобайл: full-width, h-16, поднимается над DashboardBottomNav (BottomNav сам
 * добавит safe-area). Канвас должен иметь pb >= 128px чтобы док не закрывал
 * контент.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Palette from 'lucide-react/dist/esm/icons/palette';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';
import { cn } from '@/lib/utils/utils';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { hapticLight, hapticSelection } from '@/platform/native/haptics';

export interface SmartActionDockProps {
  onAddBlock: () => void;
  onAIImprove?: () => void;
  onCustomize?: () => void;
  hasContent?: boolean;
  onToggleOrder?: () => void;
  reordering?: boolean;
  inline?: boolean;
  className?: string;
}

export const SmartActionDock = memo(function SmartActionDock({
  onAddBlock,
  onAIImprove,
  onCustomize,
  hasContent,
  onToggleOrder,
  reordering = false,
  inline = false,
  className,
}: SmartActionDockProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div
      role="toolbar"
      aria-label={t('editor.dock.label', 'Действия редактора')}
      className={cn(
        // Inline (desktop): pinned to the bottom of the canvas column, under the blocks.
        inline ? 'sticky bottom-6 z-30 mx-auto mt-2 w-fit max-w-full' : 'fixed z-40 left-1/2 -translate-x-1/2',
        // mobile: над BottomNav (BottomNav примерно 80px + safe-area)
        !inline && (isMobile
          ? 'bottom-[calc(env(safe-area-inset-bottom)+88px)] w-[calc(100vw-1rem)] max-w-md'
          : 'bottom-6 w-auto'),
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-1 rounded-full p-1.5',
          'bg-card border border-border shadow-sm',
        )}
      >
        {/* Primary: Add block */}
        <button
          type="button"
          onClick={() => { hapticLight(); onAddBlock(); }}
          aria-label={t('editor.dock.add', 'Добавить блок')}
          data-onboarding="add-block"
          className={cn(
            'group flex min-w-0 flex-1 items-center justify-center gap-2 h-12 rounded-full px-4 transition-all',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'active:scale-[0.97]',
          )}
        >
          <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          <span className="min-w-0 truncate text-sm font-semibold">
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
              'flex items-center justify-center h-12 w-12 shrink-0 rounded-full transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'active:scale-[0.95]',
            )}
          >
            <Palette className="h-5 w-5" />
          </button>
        )}

        {onToggleOrder && (
          <button type="button" onClick={() => { hapticSelection(); onToggleOrder(); }}
            aria-label={t('pageV2.actions.order', 'Порядок блоков')}
            aria-pressed={reordering}
            title={t('pageV2.actions.order', 'Порядок блоков')}
            className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
              reordering ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
            <ArrowUpDown className="h-5 w-5" />
          </button>
        )}

        {onAIImprove && hasContent && (
          <button
            type="button"
            onClick={() => { hapticSelection(); onAIImprove(); }}
            aria-label={t('editor.dock.ai', 'AI-улучшение')}
            className={cn(
              'flex items-center justify-center h-12 w-12 shrink-0 rounded-full transition-colors',
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
