/**
 * EditorToolbar - Floating editor controls with Undo/Redo
 * iOS-style floating action bar for the editor
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Undo2,
  Redo2,
  Plus,
  Layers,
  ArrowUpDown,
  Eye,
  Save,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditorToolbarProps {
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  
  // Actions
  onAddBlock: () => void;
  onOpenStructure: () => void;
  onOpenReorder: () => void;
  onPreview: () => void;
  onSave: () => void;
  
  // State
  saving?: boolean;
  hasUnsavedChanges?: boolean;
}

export const EditorToolbar = memo(function EditorToolbar({
  canUndo,
  canRedo,
  historyLength,
  onUndo,
  onRedo,
  onAddBlock,
  onOpenStructure,
  onOpenReorder,
  onPreview,
  onSave,
  saving = false,
  hasUnsavedChanges = false,
}: EditorToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden">
      <div className="flex items-center gap-2 p-2 bg-card/90 backdrop-blur-2xl border border-border/20 rounded-[20px] shadow-2xl shadow-black/20">
        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className={cn(
                "h-12 w-12 rounded-2xl transition-all",
                canUndo && "hover:bg-primary/10 active:scale-95"
              )}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-xl">
            {t('editor.undo', 'Отменить')} (⌘Z)
          </TooltipContent>
        </Tooltip>

        {/* History indicator */}
        {historyLength > 0 && (
          <div className="text-xs font-bold text-muted-foreground px-1">
            {historyLength}/7
          </div>
        )}

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className={cn(
                "h-12 w-12 rounded-2xl transition-all",
                canRedo && "hover:bg-primary/10 active:scale-95"
              )}
            >
              <Redo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-xl">
            {t('editor.redo', 'Повторить')} (⌘⇧Z)
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-8 bg-border/50" />

        {/* Add Block - Primary action */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onAddBlock}
              className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-xl">
            {t('editor.addBlock', 'Добавить блок')}
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-8 bg-border/50" />

        {/* Structure View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenStructure}
              className="h-12 w-12 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
            >
              <Layers className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-xl">
            {t('editor.structure', 'Структура')}
          </TooltipContent>
        </Tooltip>

        {/* Reorder Mode */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenReorder}
              className="h-12 w-12 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
            >
              <ArrowUpDown className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-xl">
            {t('editor.reorder', 'Упорядочить')}
          </TooltipContent>
        </Tooltip>

        {/* Preview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreview}
              className="h-12 w-12 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-xl">
            {t('editor.preview', 'Предпросмотр')}
          </TooltipContent>
        </Tooltip>

        {/* Save (shows if unsaved changes) */}
        {hasUnsavedChanges && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSave}
                disabled={saving}
                className={cn(
                  "h-12 px-4 rounded-2xl transition-all",
                  "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30",
                  "active:scale-95"
                )}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-xl">
              {t('editor.save', 'Сохранить')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
