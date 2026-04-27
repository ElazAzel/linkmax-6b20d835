/**
 * FloatingBlockToolbar — popover-тулбар, появляющийся над/возле блока на hover/select.
 *
 * Содержит 4 действия: Edit, Duplicate, AI-Improve (если есть колбэк), Delete.
 * Используется внутри `SortableGridBlockItem` вместо постоянных абсолютных кнопок.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { cn } from '@/lib/utils/utils';

export interface FloatingBlockToolbarProps {
  visible: boolean;
  onEdit: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  onAIImprove?: () => void;
  /** Не показывать duplicate/delete для profile */
  isProfile?: boolean;
  className?: string;
}

export const FloatingBlockToolbar = memo(function FloatingBlockToolbar({
  visible,
  onEdit,
  onDuplicate,
  onDelete,
  onAIImprove,
  isProfile,
  className,
}: FloatingBlockToolbarProps) {
  const { t } = useTranslation();

  return (
    <div
      role="toolbar"
      aria-label={t('editor.blockToolbar.label', 'Действия блока')}
      className={cn(
        'absolute top-2 right-2 z-30 flex items-center gap-0.5',
        'p-1 rounded-xl bg-background/95 backdrop-blur-md border border-border/15',
        'shadow-[0_8px_24px_-6px_rgba(0,0,0,0.2)] transition-all duration-200',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-1 pointer-events-none',
        className,
      )}
    >
      <ToolbarButton
        label={t('editor.blockToolbar.edit', 'Редактировать')}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEdit();
        }}
      >
        <Edit2 className="h-4 w-4" />
      </ToolbarButton>

      {!isProfile && onDuplicate && (
        <ToolbarButton
          label={t('editor.blockToolbar.duplicate', 'Дублировать')}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDuplicate();
          }}
          className="hidden sm:inline-flex"
        >
          <Copy className="h-4 w-4" />
        </ToolbarButton>
      )}

      {onAIImprove && (
        <ToolbarButton
          label={t('editor.blockToolbar.ai', 'AI улучшить')}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAIImprove();
          }}
          className="text-primary"
        >
          <Sparkles className="h-4 w-4" />
        </ToolbarButton>
      )}

      {!isProfile && (
        <ToolbarButton
          label={t('editor.blockToolbar.delete', 'Удалить')}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete();
          }}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </ToolbarButton>
      )}
    </div>
  );
});

interface ToolbarButtonProps {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

function ToolbarButton({ children, label, onClick, className }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onTouchEnd={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-lg',
        'text-foreground/80 hover:text-foreground hover:bg-accent',
        'transition-colors active:scale-95',
        className,
      )}
    >
      {children}
    </button>
  );
}
