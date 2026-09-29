/**
 * BlockContextToolbar - Floating toolbar for selected block(s)
 * P4: Block Editor Interaction OS
 * P5: Transform engine integration
 */
import { memo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Clipboard from 'lucide-react/dist/esm/icons/clipboard';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Check from 'lucide-react/dist/esm/icons/check';
import type { Block, BlockType } from '@/types/page';
import { getTransformTargets, getTransformWarning } from '@/lib/editor/transform-engine';

interface BlockContextToolbarProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (block: Block) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onTransform?: (block: Block, toType: BlockType) => void;
  isFirst?: boolean;
  isLast?: boolean;
  /**
   * `inline` — small bar inside the top of the block (desktop).
   * `dock` — full-width bar fixed above the bottom navigation with 44px
   * targets (mobile). Rendered through a portal so transformed ancestors
   * (dnd-kit, animations) cannot break `position: fixed`.
   */
  placement?: 'inline' | 'dock';
  /** Deselect the block (shown as "Done" in the dock variant). */
  onClose?: () => void;
}

export const BlockContextToolbar = memo(function BlockContextToolbar({
  block,
  onEdit,
  onDuplicate,
  onDelete,
  onCopy,
  onMoveUp,
  onMoveDown,
  onTransform,
  isFirst = false,
  isLast = false,
  placement = 'inline',
  onClose,
}: BlockContextToolbarProps) {
  const { t } = useTranslation();
  const isProfile = block.type === 'profile';

  const transformTargets = getTransformTargets(block.type as BlockType);

  const isDock = placement === 'dock';
  // min-h/min-w override the Button size minimums so both variants are exact
  const btn = isDock
    ? 'h-11 w-11 min-h-11 min-w-11 p-0 rounded-xl'
    : 'h-8 w-8 min-h-8 min-w-8 p-0 rounded-lg';
  const icon = isDock ? 'h-5 w-5' : 'h-3.5 w-3.5';

  const bar = (
    <div
      role="toolbar"
      aria-label={t('editor.blockToolbar.label', 'Действия с блоком')}
      className={cn(
        'z-50 flex items-center rounded-2xl bg-card border border-border shadow-lg',
        isDock
          ? 'fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+88px)] w-[calc(100vw-1rem)] max-w-md justify-between px-2 py-1.5'
          : 'absolute top-2 left-1/2 -translate-x-1/2 gap-0.5 px-1 py-1',
      )}
    >
      <Button
        size="sm"
        variant="ghost"
        className={btn}
        onClick={(e) => { e.stopPropagation(); onEdit(block); }}
        title={t('editor.edit', 'Edit')}
      >
        <Edit2 className={icon} />
      </Button>

      {!isProfile && (
        <>
          {!isFirst && onMoveUp && (
            <Button
              size="sm"
              variant="ghost"
              className={btn}
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              title={t('editor.moveUp', 'Move up')}
            >
              <ChevronUp className={icon} />
            </Button>
          )}

          {!isLast && onMoveDown && (
            <Button
              size="sm"
              variant="ghost"
              className={btn}
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              title={t('editor.moveDown', 'Move down')}
            >
              <ChevronDown className={icon} />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className={btn}
            onClick={(e) => { e.stopPropagation(); onCopy(block); }}
            title={t('editor.copy', 'Copy')}
          >
            <Clipboard className={icon} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className={btn}
            onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
            title={t('editor.duplicate', 'Duplicate')}
          >
            <Copy className={icon} />
          </Button>

          {/* P5: Transform */}
          {transformTargets.length > 0 && onTransform && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={btn}
                  onClick={(e) => e.stopPropagation()}
                  title={t('editor.transform', 'Convert to...')}
                >
                  <RefreshCw className={icon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="rounded-xl min-w-[160px]">
                {transformTargets.map(target => {
                  const warnings = getTransformWarning(block.type as BlockType, target);
                  const isLossy = warnings.length > 0;
                  return (
                    <DropdownMenuItem
                      key={target}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransform(block, target);
                      }}
                      className="rounded-lg py-2 px-3"
                    >
                      <span className="flex-1">{t(`blocks.${target}`, target)}</span>
                      {isLossy && (
                        <AlertTriangle className="h-3 w-3 text-amber-500 ml-2 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            size="sm"
            variant="ghost"
            className={cn(btn, 'text-destructive hover:text-destructive')}
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
            title={t('editor.delete', 'Delete')}
          >
            <Trash2 className={icon} />
          </Button>
        </>
      )}

      {isDock && onClose && (
        <Button
          size="sm"
          className="h-11 min-h-11 px-4 rounded-xl gap-1.5"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <Check className="h-4 w-4" />
          {t('editor.blockToolbar.done', 'Готово')}
        </Button>
      )}
    </div>
  );

  return isDock && typeof document !== 'undefined' ? createPortal(bar, document.body) : bar;
});
