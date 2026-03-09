/**
 * BlockContextToolbar - Floating toolbar for selected block(s)
 * P4: Block Editor Interaction OS
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Clipboard from 'lucide-react/dist/esm/icons/clipboard';
import type { Block } from '@/types/page';

interface BlockContextToolbarProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (block: Block) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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
  isFirst = false,
  isLast = false,
}: BlockContextToolbarProps) {
  const { t } = useTranslation();
  const isProfile = block.type === 'profile';

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
