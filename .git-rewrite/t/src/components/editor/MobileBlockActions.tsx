import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Pencil, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  X,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Block } from '@/types/page';

interface MobileBlockActionsProps {
  block: Block | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onMoveToTop?: (id: string) => void;
  onMoveToBottom?: (id: string) => void;
  onDuplicate?: (block: Block) => void;
  onToggleVisibility?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const MobileBlockActions = memo(function MobileBlockActions({
  block,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onDuplicate,
  onToggleVisibility,
  isFirst = false,
  isLast = false,
}: MobileBlockActionsProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAction = useCallback((action: () => void, hapticType: 'light' | 'medium' | 'warning' = 'light') => {
    if (hapticType === 'warning') {
      haptic.warning();
    } else if (hapticType === 'medium') {
      haptic.mediumTap();
    } else {
      haptic.lightTap();
    }
    action();
    if (hapticType !== 'warning') {
      onOpenChange(false);
    }
  }, [haptic, onOpenChange]);

  const handleDelete = useCallback(() => {
    if (!block) return;
    if (confirmDelete) {
      haptic.error();
      onDelete(block.id);
      onOpenChange(false);
      setConfirmDelete(false);
    } else {
      haptic.warning();
      setConfirmDelete(true);
    }
  }, [block, confirmDelete, haptic, onDelete, onOpenChange]);

  if (!block) return null;

  const isProfileBlock = block.type === 'profile';

  const moveActions = [
    {
      icon: ArrowUpToLine,
      label: t('blockActions.moveToTop', 'В начало'),
      onClick: () => handleAction(() => onMoveToTop?.(block.id)),
      disabled: isFirst,
    },
    {
      icon: ChevronUp,
      label: t('blockActions.moveUp', 'Вверх'),
      onClick: () => handleAction(() => onMoveUp?.(block.id)),
      disabled: isFirst,
    },
    {
      icon: ChevronDown,
      label: t('blockActions.moveDown', 'Вниз'),
      onClick: () => handleAction(() => onMoveDown?.(block.id)),
      disabled: isLast,
    },
    {
      icon: ArrowDownToLine,
      label: t('blockActions.moveToBottom', 'В конец'),
      onClick: () => handleAction(() => onMoveToBottom?.(block.id)),
      disabled: isLast,
    },
  ];

  const otherActions = [
    ...(onDuplicate ? [{
      icon: Copy,
      label: t('blockActions.duplicate', 'Дублировать'),
      onClick: () => handleAction(() => onDuplicate(block)),
    }] : []),
    ...(onToggleVisibility ? [{
      icon: EyeOff,
      label: t('blockActions.hide', 'Скрыть'),
      onClick: () => handleAction(() => onToggleVisibility(block.id)),
    }] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) setConfirmDelete(false);
      onOpenChange(isOpen);
    }}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[75vh] rounded-t-[32px] p-0 bg-card/98 backdrop-blur-3xl border-t-0 shadow-2xl [&>button]:hidden"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
        </div>
        
        <SheetHeader className="px-6 pb-4 border-b border-border/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-black">
              {t(`blockEditor.${block.type}`, block.type)}
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="rounded-2xl h-11 w-11 hover:bg-muted/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            {t('blockActions.description', 'Действия с блоком')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-5 space-y-5 pb-safe">
          {/* Primary action - EXTRA LARGE for easy tapping */}
          <Button 
            onClick={() => handleAction(() => onEdit(block), 'medium')}
            className="w-full h-18 rounded-3xl text-xl font-black gap-4 shadow-xl shadow-primary/25"
          >
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Pencil className="h-6 w-6" />
            </div>
            {t('blockActions.edit', 'Редактировать')}
          </Button>

          {/* Move actions grid - LARGER buttons for easy tapping */}
          {!isProfileBlock && (onMoveUp || onMoveDown) && (
            <div className="grid grid-cols-4 gap-3">
              {moveActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className={cn(
                    "h-20 flex-col gap-2 rounded-2xl bg-muted/30 border-border/30 active:scale-95 transition-all",
                    action.disabled && "opacity-35"
                  )}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-xs font-bold">{action.label}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Other actions - LARGER */}
          {otherActions.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {otherActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-16 rounded-2xl bg-muted/30 border-border/30 gap-3 text-base font-bold active:scale-95 transition-all"
                  onClick={action.onClick}
                >
                  <action.icon className="h-5 w-5" />
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Delete action - CLEAR and LARGE */}
          {!isProfileBlock && (
            <Button 
              variant={confirmDelete ? "destructive" : "outline"}
              className={cn(
                "w-full h-16 rounded-2xl gap-4 transition-all text-lg font-bold active:scale-95",
                !confirmDelete && "text-destructive border-destructive/30 border-2 hover:bg-destructive/10"
              )}
              onClick={handleDelete}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                confirmDelete ? "bg-white/20" : "bg-destructive/10"
              )}>
                <Trash2 className="h-5 w-5" />
              </div>
              {confirmDelete 
                ? t('blockActions.confirmDelete', 'Подтвердить удаление') 
                : t('blockActions.delete', 'Удалить блок')
              }
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});
