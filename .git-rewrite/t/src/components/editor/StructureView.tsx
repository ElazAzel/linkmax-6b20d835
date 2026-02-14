/**
 * StructureView - Bottom sheet showing tree of sections and blocks
 * With quick navigation, hide/duplicate/rename actions
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Edit2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icon-utils';
import type { Block } from '@/types/page';

interface StructureViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: Block[];
  onBlockSelect: (blockId: string) => void;
  onBlockHide?: (blockId: string) => void;
  onBlockDuplicate?: (blockId: string) => void;
  onBlockDelete?: (blockId: string) => void;
  onBlockMoveUp?: (blockId: string) => void;
  onBlockMoveDown?: (blockId: string) => void;
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

export const StructureView = memo(function StructureView({
  open,
  onOpenChange,
  blocks,
  onBlockSelect,
  onBlockHide,
  onBlockDuplicate,
  onBlockDelete,
  onBlockMoveUp,
  onBlockMoveDown,
  hiddenBlockIds = new Set(),
}: StructureViewProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const getBlockTitle = (block: Block): string => {
    const content = block as any;
    // Handle multilingual strings properly - check all possible title fields
    const rawTitle = content.title || content.name || content.text || content.content;
    
    // If it's a multilingual object, extract the correct language string
    if (rawTitle && typeof rawTitle === 'object') {
      // Check if it's a multilingual object with language keys
      if ('ru' in rawTitle || 'en' in rawTitle || 'kk' in rawTitle) {
        const translated = getI18nText(rawTitle, currentLang);
        return translated ? translated.substring(0, 30) : t(`blocks.${block.type}`, block.type);
      }
      // If it's some other object, don't render it
      return t(`blocks.${block.type}`, block.type);
    }
    
    // If it's a string, use it
    if (typeof rawTitle === 'string' && rawTitle.trim()) {
      return rawTitle.substring(0, 30);
    }
    
    // Default fallback
    return t(`blocks.${block.type}`, block.type);
  };

  const getBlockIcon = (type: string) => {
    const iconName = BLOCK_ICONS[type] || 'Box';
    const Icon = getLucideIcon(iconName);
    return Icon;
  };

  const profileBlock = blocks.find(b => b.type === 'profile');
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] rounded-t-[32px] p-0 bg-card/98 backdrop-blur-3xl [&>button]:hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/25" />
        </div>

        <SheetHeader className="px-6 pb-4 border-b border-border/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black">
                  {t('structure.title', 'Структура')}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {t('structure.description', '{{count}} блоков', { count: blocks.length })}
                </SheetDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-12 w-12 rounded-2xl"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(75vh-140px)]">
          <div className="p-4 space-y-2">
            {/* Profile block (special) */}
            {profileBlock && (
              <div className="mb-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {t('structure.profileSection', 'Профиль')}
                </div>
                <BlockListItem
                  block={profileBlock}
                  index={0}
                  totalCount={1}
                  isHidden={hiddenBlockIds.has(profileBlock.id)}
                  getBlockIcon={getBlockIcon}
                  getBlockTitle={getBlockTitle}
                  onSelect={onBlockSelect}
                  onHide={onBlockHide}
                  onDuplicate={onBlockDuplicate}
                  onDelete={onBlockDelete}
                  onMoveUp={onBlockMoveUp}
                  onMoveDown={onBlockMoveDown}
                  t={t}
                />
              </div>
            )}

            {/* Content blocks */}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              {t('structure.contentSection', 'Контент')}
            </div>
            
            {contentBlocks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t('structure.noBlocks', 'Пока нет блоков')}
              </div>
            ) : (
              contentBlocks.map((block, index) => (
                <BlockListItem
                  key={block.id}
                  block={block}
                  index={index}
                  totalCount={contentBlocks.length}
                  isHidden={hiddenBlockIds.has(block.id)}
                  getBlockIcon={getBlockIcon}
                  getBlockTitle={getBlockTitle}
                  onSelect={onBlockSelect}
                  onHide={onBlockHide}
                  onDuplicate={onBlockDuplicate}
                  onDelete={onBlockDelete}
                  onMoveUp={onBlockMoveUp}
                  onMoveDown={onBlockMoveDown}
                  t={t}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});

// Individual block item in the list
interface BlockListItemProps {
  block: Block;
  index: number;
  totalCount: number;
  isHidden: boolean;
  getBlockIcon: (type: string) => React.ComponentType<{ className?: string }>;
  getBlockTitle: (block: Block) => string;
  onSelect: (blockId: string) => void;
  onHide?: (blockId: string) => void;
  onDuplicate?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'];
}

function BlockListItem({
  block,
  index,
  totalCount,
  isHidden,
  getBlockIcon,
  getBlockTitle,
  onSelect,
  onHide,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  t,
}: BlockListItemProps) {
  const Icon = getBlockIcon(block.type);
  const title = getBlockTitle(block);
  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/10 transition-all",
        "hover:bg-muted/50 hover:border-border/30",
        isHidden && "opacity-50"
      )}
    >
      {/* Drag handle indicator */}
      <div className="text-muted-foreground/50">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Icon */}
      <div className={cn(
        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
        "bg-background/80 border border-border/20"
      )}>
        <Icon className="h-5 w-5 text-foreground" />
      </div>

      {/* Title - clickable to navigate */}
      <button
        onClick={() => onSelect(block.id)}
        className="flex-1 text-left min-w-0"
      >
        <div className="font-semibold truncate">{typeof title === 'string' ? title : String(title || '')}</div>
        <div className="text-xs text-muted-foreground">
          {t(`blocks.${block.type}`, block.type)}
        </div>
      </button>

      {/* Quick actions */}
      <div className="flex items-center gap-1">
        {/* Move up/down */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          disabled={!canMoveUp}
          onClick={() => onMoveUp?.(block.id)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          disabled={!canMoveDown}
          onClick={() => onMoveDown?.(block.id)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-2">
            <DropdownMenuItem 
              onClick={() => onSelect(block.id)}
              className="rounded-xl py-3 px-4"
            >
              <Edit2 className="h-4 w-4 mr-3" />
              {t('structure.edit', 'Редактировать')}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => onHide?.(block.id)}
              className="rounded-xl py-3 px-4"
            >
              {isHidden ? (
                <>
                  <Eye className="h-4 w-4 mr-3" />
                  {t('structure.show', 'Показать')}
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-3" />
                  {t('structure.hide', 'Скрыть')}
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => onDuplicate?.(block.id)}
              className="rounded-xl py-3 px-4"
            >
              <Copy className="h-4 w-4 mr-3" />
              {t('structure.duplicate', 'Дублировать')}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => onDelete?.(block.id)}
              className="rounded-xl py-3 px-4 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              {t('structure.delete', 'Удалить')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
