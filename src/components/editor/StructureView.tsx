/**
 * StructureView 2.0 - Full control panel for page structure
 * P5: Sections, filters, quality badges, search, review modes
 */
import { memo, useState, useMemo, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import X from 'lucide-react/dist/esm/icons/x';
import Search from 'lucide-react/dist/esm/icons/search';
import FolderOpen from 'lucide-react/dist/esm/icons/folder-open';
import FolderMinus from 'lucide-react/dist/esm/icons/folder-minus';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { cn } from '@/lib/utils/utils';
import { getLucideIcon } from '@/lib/utils/icon-utils';
import { getBlockIcon as getManifestBlockIcon } from '@/lib/blocks/block-manifest';
import { getSections, type DerivedSection } from '@/lib/editor/section-engine';
import type { SectionMeta } from '@/lib/editor/section-engine';
import type { Block, BlockType } from '@/types/page';
import type { ReviewMode } from '@/store/useEditorStore';
import type { BlockQualityReport } from '@/lib/intelligence/types';

type StructureFilter = 'all' | 'problematic' | 'hidden' | 'cta_contact';

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
  // P5 props
  sectionMeta?: Map<string, SectionMeta>;
  collapsedSections?: Set<string>;
  onToggleSectionCollapse?: (sectionId: string) => void;
  onDissolveSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onRenameSection?: (sectionId: string, label: string) => void;
  blockQuality?: BlockQualityReport[];
  reviewMode?: ReviewMode;
  onSetReviewMode?: (mode: ReviewMode) => void;
}

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
  sectionMeta,
  collapsedSections = new Set(),
  onToggleSectionCollapse,
  onDissolveSection,
  onDeleteSection,
  onDuplicateSection,
  onRenameSection,
  blockQuality = [],
  reviewMode = 'normal',
  onSetReviewMode,
}: StructureViewProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StructureFilter>('all');

  // Quality lookup
  const qualityMap = useMemo(() => {
    const map = new Map<string, BlockQualityReport>();
    blockQuality.forEach(q => map.set(q.blockId, q));
    return map;
  }, [blockQuality]);

  // Derive sections
  const sections = useMemo(() => getSections(blocks), [blocks]);

  const getBlockTitle = useCallback((block: Block): string => {
    const content = block as any;
    const rawTitle = content.title || content.name || content.text || content.content;
    if (rawTitle && typeof rawTitle === 'object') {
      if ('ru' in rawTitle || 'en' in rawTitle || 'kk' in rawTitle) {
        const translated = getI18nText(rawTitle, currentLang);
        return translated ? translated.substring(0, 30) : t(`blocks.${block.type}`, block.type);
      }
      return t(`blocks.${block.type}`, block.type);
    }
    if (typeof rawTitle === 'string' && rawTitle.trim()) {
      return rawTitle.substring(0, 30);
    }
    return t(`blocks.${block.type}`, block.type);
  }, [currentLang, t]);

  const getBlockIconComponent = useCallback((type: string) => {
    const iconName = getManifestBlockIcon(type as BlockType);
    return getLucideIcon(iconName);
  }, []);

  // CTA/contact block types
  const ctaContactTypes = new Set(['button', 'link', 'messenger', 'form', 'booking', 'newsletter']);

  // Filter blocks
  const filterBlock = useCallback((block: Block): boolean => {
    // Search filter
    if (searchQuery) {
      const title = getBlockTitle(block).toLowerCase();
      const type = block.type.toLowerCase();
      const q = searchQuery.toLowerCase();
      if (!title.includes(q) && !type.includes(q)) return false;
    }

    // Category filter
    if (activeFilter === 'problematic') {
      const quality = qualityMap.get(block.id);
      return quality ? quality.score < 70 || quality.issues.length > 0 : false;
    }
    if (activeFilter === 'hidden') {
      return hiddenBlockIds.has(block.id);
    }
    if (activeFilter === 'cta_contact') {
      return ctaContactTypes.has(block.type);
    }

    return true;
  }, [searchQuery, activeFilter, getBlockTitle, qualityMap, hiddenBlockIds]);

  const profileBlock = blocks.find(b => b.type === 'profile');
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  // Group content blocks into sections and ungrouped
  const { sectionGroups, ungroupedBlocks } = useMemo(() => {
    const sectionBlockIds = new Set<string>();
    sections.forEach(s => s.blockIds.forEach(id => sectionBlockIds.add(id)));

    const ungrouped = contentBlocks.filter(b => !sectionBlockIds.has(b.id));
    return { sectionGroups: sections, ungroupedBlocks: ungrouped };
  }, [contentBlocks, sections]);

  const filters: { key: StructureFilter; label: string }[] = [
    { key: 'all', label: t('structure.filterAll', 'Все') },
    { key: 'problematic', label: t('structure.filterProblematic', 'Проблемные') },
    { key: 'hidden', label: t('structure.filterHidden', 'Скрытые') },
    { key: 'cta_contact', label: t('structure.filterCTA', 'CTA') },
  ];

  const getQualityDot = (blockId: string) => {
    const q = qualityMap.get(blockId);
    if (!q) return null;
    const color = q.score >= 80 ? 'bg-emerald-500' : q.score >= 50 ? 'bg-amber-500' : 'bg-destructive';
    return <div className={cn('h-2 w-2 rounded-full shrink-0', color)} />;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        hideCloseButton
        className="h-[80vh] rounded-t-[32px] p-0 bg-card/98 backdrop-blur-3xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/25" />
        </div>

        <SheetHeader className="px-6 pb-3 border-b border-border/10">
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
                  {sections.length > 0 && ` · ${sections.length} ${t('structure.sections', 'секций')}`}
                </SheetDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              aria-label={t('common.close', 'Закрыть')}
              className="h-12 w-12 rounded-2xl"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </SheetHeader>

        {/* Search & Filters */}
        <div className="px-4 py-3 space-y-2 border-b border-border/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('structure.search', 'Поиск...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                  activeFilter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Review mode */}
          {onSetReviewMode && reviewMode !== 'normal' && (
            <div className="flex items-center gap-2 px-1">
              <Badge variant="secondary" className="text-xs">
                {t('structure.reviewMode', 'Режим проверки')}
              </Badge>
              <button
                onClick={() => onSetReviewMode('normal')}
                className="text-xs text-primary hover:underline"
              >
                {t('structure.exitReview', 'Выйти')}
              </button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 h-[calc(80vh-220px)]">
          <div className="p-4 space-y-2">
            {/* Profile block */}
            {profileBlock && filterBlock(profileBlock) && (
              <div className="mb-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {t('structure.profileSection', 'Профиль')}
                </div>
                <BlockRow
                  block={profileBlock}
                  index={0}
                  totalCount={1}
                  isHidden={hiddenBlockIds.has(profileBlock.id)}
                  getBlockIcon={getBlockIconComponent}
                  getBlockTitle={getBlockTitle}
                  onSelect={onBlockSelect}
                  onHide={onBlockHide}
                  onDuplicate={onBlockDuplicate}
                  onDelete={onBlockDelete}
                  onMoveUp={onBlockMoveUp}
                  onMoveDown={onBlockMoveDown}
                  qualityDot={getQualityDot(profileBlock.id)}
                  t={t}
                />
              </div>
            )}

            {/* Section groups */}
            {sectionGroups.map(section => {
              const meta = sectionMeta?.get(section.id);
              const label = meta?.label || t('structure.untitledSection', 'Секция');
              const isCollapsed = collapsedSections.has(section.id);
              const sectionBlocks = section.blockIds
                .map(id => contentBlocks.find(b => b.id === id))
                .filter((b): b is NonNullable<typeof b> => !!b)
                .filter(b => filterBlock(b));

              if (sectionBlocks.length === 0 && searchQuery) return null;

              return (
                <div key={section.id} className="mb-3">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 mb-1">
                    <button
                      onClick={() => onToggleSectionCollapse?.(section.id)}
                      className="p-0.5"
                    >
                      <ChevronRight className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        !isCollapsed && 'rotate-90'
                      )} />
                    </button>
                    <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground flex-1 truncate">
                      {label}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {section.blockIds.length}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => {
                          const newLabel = prompt(t('structure.renameSection', 'Новое имя секции:'), label);
                          if (newLabel) onRenameSection?.(section.id, newLabel);
                        }} className="rounded-lg">
                          <Edit2 className="h-3.5 w-3.5 mr-2" />
                          {t('structure.rename', 'Переименовать')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicateSection?.(section.id)} className="rounded-lg">
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          {t('structure.duplicate', 'Дублировать')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDissolveSection?.(section.id)} className="rounded-lg">
                          <FolderMinus className="h-3.5 w-3.5 mr-2" />
                          {t('structure.dissolve', 'Расгруппировать')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteSection?.(section.id)}
                          className="rounded-lg text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          {t('structure.deleteSection', 'Удалить секцию')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Section blocks */}
                  {!isCollapsed && (
                    <div className="pl-4 space-y-1.5">
                      {sectionBlocks.map((block, idx) => (
                        <BlockRow
                          key={block.id}
                          block={block}
                          index={idx}
                          totalCount={sectionBlocks.length}
                          isHidden={hiddenBlockIds.has(block.id)}
                          getBlockIcon={getBlockIconComponent}
                          getBlockTitle={getBlockTitle}
                          onSelect={onBlockSelect}
                          onHide={onBlockHide}
                          onDuplicate={onBlockDuplicate}
                          onDelete={onBlockDelete}
                          onMoveUp={onBlockMoveUp}
                          onMoveDown={onBlockMoveDown}
                          qualityDot={getQualityDot(block.id)}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped blocks */}
            {ungroupedBlocks.filter(filterBlock).length > 0 && (
              <div>
                {sections.length > 0 && (
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {t('structure.ungrouped', 'Без секции')}
                  </div>
                )}
                {sections.length === 0 && (
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {t('structure.contentSection', 'Контент')}
                  </div>
                )}
                {ungroupedBlocks.filter(filterBlock).map((block, index) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    index={index}
                    totalCount={ungroupedBlocks.length}
                    isHidden={hiddenBlockIds.has(block.id)}
                    getBlockIcon={getBlockIconComponent}
                    getBlockTitle={getBlockTitle}
                    onSelect={onBlockSelect}
                    onHide={onBlockHide}
                    onDuplicate={onBlockDuplicate}
                    onDelete={onBlockDelete}
                    onMoveUp={onBlockMoveUp}
                    onMoveDown={onBlockMoveDown}
                    qualityDot={getQualityDot(block.id)}
                    t={t}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {contentBlocks.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                {t('structure.noBlocks', 'Пока нет блоков')}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});

// ─── Block Row ──────────────────────────────────────────
interface BlockRowProps {
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
  qualityDot?: React.ReactNode;
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'];
}

function BlockRow({
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
  qualityDot,
  t,
}: BlockRowProps) {
  const Icon = getBlockIcon(block.type);
  const title = getBlockTitle(block);
  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  return (
    <div 
      className={cn(
        "flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/5 transition-all",
        "hover:bg-muted/40 hover:border-border/20",
        isHidden && "opacity-50"
      )}
    >
      {/* Icon + quality */}
      <div className="relative">
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          "bg-background/80 border border-border/20"
        )}>
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        {qualityDot && (
          <div className="absolute -top-0.5 -right-0.5">
            {qualityDot}
          </div>
        )}
      </div>

      {/* Title */}
      <button
        onClick={() => onSelect(block.id)}
        className="flex-1 text-left min-w-0"
      >
        <div className="font-semibold text-sm truncate">{typeof title === 'string' ? title : String(title || '')}</div>
        <div className="text-xs text-muted-foreground">
          {t(`blocks.${block.type}`, block.type)}
        </div>
      </button>

      {/* Quick actions */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={!canMoveUp} onClick={() => onMoveUp?.(block.id)}>
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={!canMoveDown} onClick={() => onMoveDown?.(block.id)}>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1.5">
            <DropdownMenuItem onClick={() => onSelect(block.id)} className="rounded-lg py-2 px-3">
              <Edit2 className="h-3.5 w-3.5 mr-2" />
              {t('structure.edit', 'Редактировать')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHide?.(block.id)} className="rounded-lg py-2 px-3">
              {isHidden ? <Eye className="h-3.5 w-3.5 mr-2" /> : <EyeOff className="h-3.5 w-3.5 mr-2" />}
              {isHidden ? t('structure.show', 'Показать') : t('structure.hide', 'Скрыть')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(block.id)} className="rounded-lg py-2 px-3">
              <Copy className="h-3.5 w-3.5 mr-2" />
              {t('structure.duplicate', 'Дублировать')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.(block.id)} className="rounded-lg py-2 px-3 text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              {t('structure.delete', 'Удалить')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
