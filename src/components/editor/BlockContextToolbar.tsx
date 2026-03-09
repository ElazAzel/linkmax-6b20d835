/**
 * BlockContextToolbar - Floating toolbar for selected block(s)
 * P4: Block Editor Interaction OS
 * P5: Transform engine integration
 */
import { memo, useState } from 'react';
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
}: BlockContextToolbarProps) {
  const { t } = useTranslation();
  const isProfile = block.type === 'profile';

  const transformTargets = getTransformTargets(block.type as BlockType);

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-card/95 backdrop-blur-xl border border-border shadow-lg">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={(e) => { e.stopPropagation(); onEdit(block); }}
        title={t('editor.edit', 'Edit')}
      >
        <Edit2 className="h-3.5 w-3.5" />
      </Button>

      {!isProfile && (
        <>
          {!isFirst && onMoveUp && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              title={t('editor.moveUp', 'Move up')}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
          )}

          {!isLast && onMoveDown && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              title={t('editor.moveDown', 'Move down')}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onCopy(block); }}
            title={t('editor.copy', 'Copy')}
          >
            <Clipboard className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
            title={t('editor.duplicate', 'Duplicate')}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          {/* P5: Transform */}
          {transformTargets.length > 0 && onTransform && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => e.stopPropagation()}
                  title={t('editor.transform', 'Convert to...')}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
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
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
            title={t('editor.delete', 'Delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
});
