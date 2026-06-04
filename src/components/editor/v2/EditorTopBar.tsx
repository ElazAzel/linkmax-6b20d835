/**
 * EditorTopBar — компактная (h-14) шапка редактора v2.
 *
 * Слои слева→направо:
 *  • back/menu + название страницы (PageSwitcher или title)
 *  • PageHealthMeter (прогресс активации)
 *  • Preview (iconButton, на md+ с label)
 *  • Publish/Share (primary)
 *  • Overflow ⋯ (Undo/Redo, Структура, Версии, Review modes, AI)
 *
 * Всё что не критично — скрыто в overflow-меню.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import Redo2 from 'lucide-react/dist/esm/icons/redo-2';
import History from 'lucide-react/dist/esm/icons/history';
import Layers from 'lucide-react/dist/esm/icons/layers';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/utils';
import { PageHealthMeter, type PageHealthMeterProps } from './PageHealthMeter';
import { OfflineBadge } from '@/pwa/OfflineBadge';

export interface EditorTopBarProps {
  /** Title slot — обычно PageSwitcher или текст */
  titleSlot?: React.ReactNode;
  health: PageHealthMeterProps;

  isPublished: boolean;
  onPreview: () => void;
  onShare: () => void;

  // Overflow actions
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenStructure?: () => void;
  onOpenVersions?: () => void;
  onOpenTemplates?: () => void;
  onOpenAI?: () => void;
  reviewMode?: string;
  onToggleReviewMode?: (mode: 'problematic' | 'cta_contact') => void;
  hasContent?: boolean;

  className?: string;
}

export const EditorTopBar = memo(function EditorTopBar({
  titleSlot,
  health,
  isPublished,
  onPreview,
  onShare,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenStructure,
  onOpenVersions,
  onOpenTemplates,
  onOpenAI,
  reviewMode = 'normal',
  onToggleReviewMode,
  hasContent,
  className,
}: EditorTopBarProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-14 flex items-center justify-between gap-2 px-3 md:px-6',
        'bg-background/85 backdrop-blur-md border-b border-border/10',
        'pt-[env(safe-area-inset-top)]',
        className,
      )}
    >
      {/* Left: title slot */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {titleSlot}
      </div>

      {/* Center: health (desktop, hidden on small mobile) */}
      <div className="hidden xs:flex items-center justify-center shrink-0">
        <PageHealthMeter {...health} />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('editor.preview', 'Превью')}
          title={t('editor.preview', 'Превью')}
          className="h-10 px-2.5 md:px-3 rounded-xl gap-1.5"
          onClick={onPreview}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden md:inline text-sm font-medium">
            {t('editor.preview', 'Превью')}
          </span>
        </Button>

        <Button
          size="sm"
          className={cn(
            'h-10 rounded-xl font-semibold text-sm px-3 md:px-4 gap-1.5',
            !isPublished
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.4)]'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20',
          )}
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
          <span>
            {isPublished ? t('editor.share', 'Поделиться') : t('editor.publish', 'Опубликовать')}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('editor.topbar.overflow', 'Ещё')}
              className="h-10 w-10 rounded-xl"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {t('editor.topbar.history', 'История')}
            </DropdownMenuLabel>
            <DropdownMenuItem disabled={!canUndo} onClick={() => onUndo?.()}>
              <Undo2 className="h-4 w-4 mr-2" />
              {t('editor.undo', 'Отменить')}
              <span className="ml-auto text-[10px] text-muted-foreground">⌘Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canRedo} onClick={() => onRedo?.()}>
              <Redo2 className="h-4 w-4 mr-2" />
              {t('editor.redo', 'Повторить')}
              <span className="ml-auto text-[10px] text-muted-foreground">⌘⇧Z</span>
            </DropdownMenuItem>
            {onOpenVersions && (
              <DropdownMenuItem onClick={onOpenVersions}>
                <History className="h-4 w-4 mr-2" />
                {t('editor.versions', 'История версий')}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {t('editor.topbar.tools', 'Инструменты')}
            </DropdownMenuLabel>
            {onOpenTemplates && (
              <DropdownMenuItem onClick={onOpenTemplates}>
                <LayoutTemplate className="h-4 w-4 mr-2" />
                {t('editor.templates', 'Шаблоны')}
              </DropdownMenuItem>
            )}
            {hasContent && onOpenStructure && (
              <DropdownMenuItem onClick={onOpenStructure}>
                <Layers className="h-4 w-4 mr-2" />
                {t('editor.structure', 'Структура страницы')}
              </DropdownMenuItem>
            )}
            {onOpenAI && (
              <DropdownMenuItem onClick={onOpenAI}>
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                {t('editor.aiAssistant', 'AI-помощник')}
              </DropdownMenuItem>
            )}

            {hasContent && onToggleReviewMode && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {t('editor.topbar.review', 'Режим проверки')}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onToggleReviewMode('problematic')}>
                  <AlertCircle
                    className={cn(
                      'h-4 w-4 mr-2',
                      reviewMode === 'problematic' ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  />
                  {t('editor.problematic', 'Проблемные блоки')}
                  {reviewMode === 'problematic' && (
                    <span className="ml-auto text-[10px] text-destructive font-bold">ON</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleReviewMode('cta_contact')}>
                  <MousePointerClick
                    className={cn(
                      'h-4 w-4 mr-2',
                      reviewMode === 'cta_contact' ? 'text-emerald-500' : 'text-muted-foreground',
                    )}
                  />
                  {t('editor.cta', 'Только CTA')}
                  {reviewMode === 'cta_contact' && (
                    <span className="ml-auto text-[10px] text-emerald-500 font-bold">ON</span>
                  )}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
