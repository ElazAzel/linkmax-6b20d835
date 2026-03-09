/**
 * BulkActionBar - Fixed bottom bar for multi-select bulk operations
 * P4: Block Editor Interaction OS
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import X from 'lucide-react/dist/esm/icons/x';

interface BulkActionBarProps {
  selectedCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClearSelection: () => void;
}

export const BulkActionBar = memo(function BulkActionBar({
  selectedCount,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onClearSelection,
}: BulkActionBarProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {selectedCount > 1 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-lg"
        >
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {selectedCount} {t('editor.selected', 'selected')}
          </span>
          
          <div className="w-px h-5 bg-border" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onMoveUp}
            title={t('editor.moveUp', 'Move up')}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onMoveDown}
            title={t('editor.moveDown', 'Move down')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onDuplicate}
            title={t('editor.duplicate', 'Duplicate')}
          >
            <Copy className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title={t('editor.delete', 'Delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onClearSelection}
            title={t('editor.clearSelection', 'Clear selection')}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
