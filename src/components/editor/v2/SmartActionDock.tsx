/**
 * SmartActionDock — sticky-bottom 4-кнопочный док редактора.
 *
 * Это первая точка действия для пользователя: добавить блок, улучшить ИИ,
 * посмотреть превью, опубликовать. По мобильному стандарту 2026 — крупные
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
import Eye from 'lucide-react/dist/esm/icons/eye';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import { cn } from '@/lib/utils/utils';
import { useIsMobile } from '@/hooks/ui/use-mobile';

export interface SmartActionDockProps {
  onAddBlock: () => void;
  onAIImprove?: () => void;
  onPreview: () => void;
  onPublish: () => void;
  isPublished?: boolean;
  hasContent?: boolean;
  className?: string;
}

export const SmartActionDock = memo(function SmartActionDock({
  onAddBlock,
  onAIImprove,
  onPreview,
  onPublish,
  isPublished,
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
          'bg-card/95 backdrop-blur-xl border border-border/15',
          'shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)]',
        )}
      >
        {/* Primary: Add block */}
        <button
          type="button"
          onClick={onAddBlock}
          aria-label={t('editor.dock.add', 'Добавить блок')}
          data-onboarding="add-block"
          className={cn(
            'group flex items-center gap-2 h-12 rounded-xl px-4 transition-all',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'active:scale-[0.97] shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.5)]',
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-sm font-semibold whitespace-nowrap">
            {t('editor.dock.add', 'Блок')}
          </span>
        </button>

        {/* AI Improve — only when there is content */}
        {onAIImprove && hasContent && (
          <button
            type="button"
            onClick={onAIImprove}
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

        {/* Preview */}
        <button
          type="button"
          onClick={onPreview}
          aria-label={t('editor.dock.preview', 'Превью')}
          className={cn(
            'flex items-center justify-center h-12 w-12 rounded-xl transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-accent',
            'active:scale-[0.95]',
          )}
        >
          <Eye className="h-5 w-5" />
        </button>

        {/* Publish / Share */}
        <button
          type="button"
          onClick={onPublish}
          aria-label={isPublished ? t('editor.share', 'Поделиться') : t('editor.publish', 'Опубликовать')}
          className={cn(
            'flex items-center gap-2 h-12 rounded-xl px-4 transition-all active:scale-[0.97]',
            isPublished
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              : hasContent
              ? 'bg-foreground text-background hover:bg-foreground/90'
              : 'bg-muted text-muted-foreground hover:bg-accent',
          )}
        >
          {isPublished ? (
            <Share2 className="h-5 w-5" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          <span className="text-sm font-semibold whitespace-nowrap">
            {isPublished
              ? t('editor.dock.share', 'Поделиться')
              : t('editor.dock.publish', 'Опубликовать')}
          </span>
        </button>
      </div>
    </div>
  );
});
