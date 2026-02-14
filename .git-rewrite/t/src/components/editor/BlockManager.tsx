/**
 * BlockManager - Unified structure & reorder panel
 * Combines block navigation, quick actions, and reordering in one mobile-optimized sheet
 */
import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  MoreHorizontal,
  Edit2,
  X,
  Check,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icon-utils';
import type { Block } from '@/types/page';

interface BlockManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: Block[];
  onBlockSelect: (blockId: string) => void;
  onBlockHide?: (blockId: string) => void;
  onBlockDuplicate?: (blockId: string) => void;
  onBlockDelete?: (blockId: string) => void;
  onReorder: (blocks: Block[]) => void;
  hiddenBlockIds?: Set<string>;
}

// Block type to icon mapping
const BLOCK_ICONS: Record<string, string> = {
  profile: 'User',
  link: 'Link',
  button: 'MousePointer2',
  text: 'Type',
  image: 'Image',
  video: 'Video',
  carousel: 'Images',
  product: 'ShoppingBag',
  form: 'FileText',
  messenger: 'MessageCircle',
  socials: 'Share2',
  separator: 'Minus',
  avatar: 'UserCircle',
  catalog: 'Grid3X3',
  booking: 'Calendar',
  faq: 'HelpCircle',
  pricing: 'CreditCard',
  testimonial: 'Quote',
  countdown: 'Clock',
  map: 'MapPin',
  download: 'Download',
  newsletter: 'Mail',
  custom_code: 'Code',
  search: 'Search',
  before_after: 'ArrowLeftRight',
  community: 'Users',
  shoutout: 'Megaphone',
  scratch: 'Gift',
};

export const BlockManager = memo(function BlockManager({
  open,
  onOpenChange,
  blocks,
  onBlockSelect,
  onBlockHide,
  onBlockDuplicate,
  onBlockDelete,
  onReorder,
  hiddenBlockIds = new Set(),
}: BlockManagerProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;
  
  // Local state for reordering
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset when opening
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setLocalBlocks(blocks);
      setHasChanges(false);
    }
    onOpenChange(isOpen);
  }, [blocks, onOpenChange]);

  const getBlockTitle = useCallback((block: Block): string => {
    const content = block as any;
    const rawTitle = content.title || content.name || content.text || content.content;
    
    if (rawTitle && typeof rawTitle === 'object') {
      if ('ru' in rawTitle || 'en' in rawTitle || 'kk' in rawTitle) {
        const translated = getTranslatedString(rawTitle, currentLang);
        return translated ? translated.substring(0, 25) : t(`blocks.${block.type}`, block.type);
      }
      return t(`blocks.${block.type}`, block.type);
    }
    
    if (typeof rawTitle === 'string' && rawTitle.trim()) {
      return rawTitle.substring(0, 25);
    }
    
    return t(`blocks.${block.type}`, block.type);
  }, [currentLang, t]);

  const getBlockIcon = useCallback((type: string) => {
    const iconName = BLOCK_ICONS[type] || 'Box';
    return getLucideIcon(iconName);
  }, []);

  // Separate profile from content blocks
  const profileBlock = localBlocks.find(b => b.type === 'profile');
  const contentBlocks = localBlocks.filter(b => b.type !== 'profile');

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentBlocks.length) return;

    const newContentBlocks = [...contentBlocks];
    [newContentBlocks[index], newContentBlocks[newIndex]] = [newContentBlocks[newIndex], newContentBlocks[index]];
    
    const newBlocks = profileBlock ? [profileBlock, ...newContentBlocks] : newContentBlocks;
    setLocalBlocks(newBlocks);
    setHasChanges(true);
  }, [contentBlocks, profileBlock]);

  const handleSave = useCallback(() => {
    onReorder(localBlocks);
    setHasChanges(false);
    onOpenChange(false);
  }, [localBlocks, onReorder, onOpenChange]);

  const handleCancel = useCallback(() => {
    setLocalBlocks(blocks);
    setHasChanges(false);
    onOpenChange(false);
  }, [blocks, onOpenChange]);

  const handleSelect = useCallback((blockId: string) => {
    if (hasChanges) {
      onReorder(localBlocks);
    }
    onBlockSelect(blockId);
    onOpenChange(false);
  }, [hasChanges, localBlocks, onReorder, onBlockSelect, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-[32px] p-0 bg-card/98 backdrop-blur-3xl [&>button]:hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="px-4 pb-3 border-b border-border/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold">
                  {t('blockManager.title', 'Блоки')}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {t('blockManager.description', '{{count}} блоков · Перетащите для сортировки', { count: blocks.length })}
                </SheetDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel}
              className="h-10 w-10 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(85vh-160px)]">
          <div className="p-3 space-y-1.5">
            {/* Profile block (fixed at top) */}
            {profileBlock && (
              <div className="mb-3">
                <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-2 mb-1.5">
                  {t('blockManager.profile', 'Профиль')}
                </div>
                <BlockItem
                  block={profileBlock}
                  index={-1}
                  isProfile
                  isHidden={hiddenBlockIds.has(profileBlock.id)}
                  getBlockIcon={getBlockIcon}
                  getBlockTitle={getBlockTitle}
                  onSelect={handleSelect}
                  onHide={onBlockHide}
                  onDuplicate={onBlockDuplicate}
                  onDelete={onBlockDelete}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  canMoveUp={false}
                  canMoveDown={false}
                  t={t}
                />
              </div>
            )}

            {/* Content blocks */}
            <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-2 mb-1.5">
              {t('blockManager.content', 'Контент')}
            </div>
            
            {contentBlocks.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {t('blockManager.empty', 'Нет блоков')}
              </div>
            ) : (
              contentBlocks.map((block, index) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  index={index}
                  isHidden={hiddenBlockIds.has(block.id)}
                  getBlockIcon={getBlockIcon}
                  getBlockTitle={getBlockTitle}
                  onSelect={handleSelect}
                  onHide={onBlockHide}
                  onDuplicate={onBlockDuplicate}
                  onDelete={(id) => {
                    onBlockDelete?.(id);
                    setLocalBlocks(prev => prev.filter(b => b.id !== id));
                  }}
                  onMoveUp={() => moveBlock(index, 'up')}
                  onMoveDown={() => moveBlock(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < contentBlocks.length - 1}
                  t={t}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer with save (only show when changes exist) */}
        {hasChanges && (
          <SheetFooter className="p-3 pb-safe border-t border-border/10 bg-background/95">
            <Button 
              onClick={handleSave}
              className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/25"
            >
              <Check className="h-5 w-5 mr-2" />
              {t('common.save', 'Сохранить')}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
});

// Individual block item
interface BlockItemProps {
  block: Block;
  index: number;
  isProfile?: boolean;
  isHidden: boolean;
  getBlockIcon: (type: string) => React.ComponentType<{ className?: string }>;
  getBlockTitle: (block: Block) => string;
  onSelect: (blockId: string) => void;
  onHide?: (blockId: string) => void;
  onDuplicate?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'];
}

function BlockItem({
  block,
  index,
  isProfile,
  isHidden,
  getBlockIcon,
  getBlockTitle,
  onSelect,
  onHide,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  t,
}: BlockItemProps) {
  const Icon = getBlockIcon(block.type);
  const title = getBlockTitle(block);

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-3 rounded-2xl transition-all active:scale-[0.98]",
        "bg-muted/40 border border-border/10",
        "hover:bg-muted/60 hover:border-border/20",
        isHidden && "opacity-40",
        isProfile && "bg-primary/5 border-primary/10"
      )}
    >
      {/* Drag handle / position */}
      {isProfile ? (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-primary/40" />
        </div>
      ) : (
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
          {index + 1}
        </div>
      )}

      {/* Icon */}
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        "bg-background border border-border/20"
      )}>
        <Icon className="h-4.5 w-4.5" />
      </div>

      {/* Title - clickable */}
      <button
        onClick={() => onSelect(block.id)}
        className="flex-1 text-left min-w-0 py-1"
      >
        <div className="font-semibold text-sm truncate">{title}</div>
        <div className="text-[10px] text-muted-foreground">
          {t(`blocks.${block.type}`, block.type)}
        </div>
      </button>

      {/* Move controls (compact) */}
      {!isProfile && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-8 rounded-l-xl rounded-r-none"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-8 rounded-r-xl rounded-l-none border-l border-border/10"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl p-1.5 min-w-[160px]">
          <DropdownMenuItem 
            onClick={() => onSelect(block.id)}
            className="rounded-xl py-2.5 px-3"
          >
            <Edit2 className="h-4 w-4 mr-2.5" />
            {t('blockManager.edit', 'Редактировать')}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onHide?.(block.id)}
            className="rounded-xl py-2.5 px-3"
          >
            {isHidden ? (
              <>
                <Eye className="h-4 w-4 mr-2.5" />
                {t('blockManager.show', 'Показать')}
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2.5" />
                {t('blockManager.hide', 'Скрыть')}
              </>
            )}
          </DropdownMenuItem>
          
          {!isProfile && (
            <DropdownMenuItem 
              onClick={() => onDuplicate?.(block.id)}
              className="rounded-xl py-2.5 px-3"
            >
              <Copy className="h-4 w-4 mr-2.5" />
              {t('blockManager.duplicate', 'Дублировать')}
            </DropdownMenuItem>
          )}
          
          {!isProfile && (
            <>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                onClick={() => onDelete?.(block.id)}
                className="rounded-xl py-2.5 px-3 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2.5" />
                {t('blockManager.delete', 'Удалить')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
