import { Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { EditorMode } from '@/types/page';
import { useTranslation } from 'react-i18next';

interface EditorModeToggleProps {
  currentMode: EditorMode;
  onToggle: () => void;
}

export function EditorModeToggle({ currentMode, onToggle }: EditorModeToggleProps) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const isGridMode = currentMode === 'grid';

  const handleToggle = () => {
    setShowConfirm(true);
  };

  const confirmToggle = () => {
    setShowConfirm(false);
    onToggle();
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className="h-9 w-9"
            >
              {isGridMode ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3X3 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isGridMode 
              ? t('editor.switchToLinear', 'Switch to Linear Mode') 
              : t('editor.switchToGrid', 'Switch to Grid Mode')
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isGridMode 
                ? t('editor.switchToLinearTitle', 'Switch to Linear Mode?') 
                : t('editor.switchToGridTitle', 'Switch to Grid Mode?')
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isGridMode
                ? t('editor.switchToLinearDesc', 'Blocks will be sorted by creation date and arranged in a single column.')
                : t('editor.switchToGridDesc', 'Blocks will be arranged in a grid. You can drag and resize them freely.')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              {t('common.continue', 'Continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
