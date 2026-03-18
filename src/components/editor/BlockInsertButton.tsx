'use client';

import { useNavigate } from 'react-router-dom';
import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { cn } from '@/lib/utils/utils';
import { FREE_LIMITS, type FreeTier } from '@/hooks/user/useFreemiumLimits';
import { toast } from 'sonner';
import { BLOCK_MANIFEST } from '@/lib/blocks/block-manifest';
import { getLucideIcon } from '@/lib/utils/icon-utils';

import { getRecommendedBlocks } from '@/lib/blocks/block-recommendations';
import { BLOCK_PRESETS, type BlockPreset, getPresetsForType } from '@/lib/editor/editor-presets';
import type { Niche } from '@/lib/niches';
import type { BlockType } from '@/types/page';

interface BlockInsertButtonProps {
  onInsert: (blockType: string) => void;
  onInsertPreset?: (preset: BlockPreset) => void;
  isPremium?: boolean;
  currentBlockCount?: number;
  className?: string;
  currentTier?: FreeTier;
  pageNiche?: Niche | string;
  existingBlocks?: BlockType[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  renderSheet?: boolean;
}

type BlockTier = 'free' | 'pro';

// Color mapping by block type for the insert panel icons
const BLOCK_COLORS: Record<string, string> = {
  profile: 'bg-cyan-500',
  text: 'bg-slate-500',
  link: 'bg-blue-500',
  button: 'bg-red-500',
  image: 'bg-emerald-500',
  separator: 'bg-gray-400',
  avatar: 'bg-cyan-500',
  socials: 'bg-pink-500',
  messenger: 'bg-green-500',
  video: 'bg-rose-500',
  carousel: 'bg-violet-500',
  before_after: 'bg-cyan-600',
  map: 'bg-green-600',
  faq: 'bg-blue-400',
  form: 'bg-purple-500',
  scratch: 'bg-red-400',
  countdown: 'bg-orange-400',
  custom_code: 'bg-slate-600',
  product: 'bg-amber-500',
  catalog: 'bg-teal-500',
  pricing: 'bg-lime-500',
  download: 'bg-indigo-500',
  booking: 'bg-fuchsia-500',
  shoutout: 'bg-orange-500',
  community: 'bg-indigo-400',
  event: 'bg-emerald-600',
  testimonial: 'bg-yellow-500',
  newsletter: 'bg-sky-500',
};

// Derive block list from manifest (single source of truth)
// Exclude 'profile' since it's auto-added and not insertable
const MANIFEST_BLOCKS = Object.values(BLOCK_MANIFEST)
  .filter((entry) => entry.type !== 'profile')
  .map((entry) => ({
    type: entry.type,
    labelKey: entry.labelKey,
    icon: entry.icon,
    color: BLOCK_COLORS[entry.type] || 'bg-muted',
    tier: (entry.isPremium ? 'pro' : 'free') as BlockTier,
  }));

export const BlockInsertButton = memo(function BlockInsertButton({
  onInsert,
  onInsertPreset,
  isPremium = false,
  currentBlockCount = 0,
  className,
  currentTier = 'identity',
  pageNiche,
  existingBlocks = [],
  isOpen: externalIsOpen,
  onOpenChange,
  hideTrigger = false,
  renderSheet = true,
}: BlockInsertButtonProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSearchQuery('');
    }
    setIsOpen(open);
  }, [setIsOpen]);

  const isAtBlockLimit = !isPremium && currentBlockCount >= FREE_LIMITS.maxBlocks;
  const remainingBlocks = isPremium ? Infinity : FREE_LIMITS.maxBlocks - currentBlockCount;

  const recommendations = useMemo(() => {
    return getRecommendedBlocks(pageNiche, existingBlocks);
  }, [pageNiche, existingBlocks]);

  const recommendedBlockTypes = useMemo(() => {
    return new Set(recommendations.filter(r => r.isRelevant).map(r => r.block));
  }, [recommendations]);

  const tierLevel = (tier: FreeTier | BlockTier): number => {
    switch (tier) {
      case 'pro': return 2;
      default: return 1;
    }
  };

  const canUseBlock = (blockTier: BlockTier): boolean => {
    return tierLevel(currentTier) >= tierLevel(blockTier);
  };

  const filteredBlocks = MANIFEST_BLOCKS.filter(block =>
    t(block.labelKey, block.type).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPresets = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return BLOCK_PRESETS.filter(preset =>
      t(preset.labelKey).toLowerCase().includes(query) ||
      preset.keywords.some(k => k.toLowerCase().includes(query))
    );
  }, [searchQuery, t]);

  const featuredPresets = useMemo(() => {
    if (searchQuery || pageNiche !== 'expert') return [];
    return BLOCK_PRESETS.filter(p =>
      ['expert_consultation_cta', 'expert_guide_buy', 'expert_telegram_join'].includes(p.id)
    );
  }, [pageNiche, searchQuery]);

  const { recommendedBlocks, otherBlocks } = useMemo(() => {
    if (searchQuery) {
      return { recommendedBlocks: [] as typeof MANIFEST_BLOCKS, otherBlocks: filteredBlocks };
    }

    const recommended: typeof MANIFEST_BLOCKS = [];
    const others: typeof MANIFEST_BLOCKS = [];

    filteredBlocks.forEach(block => {
      if (recommendedBlockTypes.has(block.type as BlockType)) {
        recommended.push(block);
      } else {
        others.push(block);
      }
    });

    recommended.sort((a, b) => {
      const scoreA = recommendations.find(r => r.block === a.type)?.score || 0;
      const scoreB = recommendations.find(r => r.block === b.type)?.score || 0;
      return scoreB - scoreA;
    });

    return { recommendedBlocks: recommended.slice(0, 6), otherBlocks: others };
  }, [filteredBlocks, recommendedBlockTypes, recommendations, searchQuery]);

  const closeSheetAndRun = useCallback((callback: () => void) => {
    handleOpenChange(false);
    requestAnimationFrame(() => {
      callback();
      toast.success(t('editor.blockAdded', 'Блок добавлен'));
    });
  }, [handleOpenChange, t]);

  const handleInsert = (blockType: string, blockTier: BlockTier) => {
    if (!canUseBlock(blockTier)) {
      toast.error(t('blocks.proOnly', 'Этот блок доступен только в PRO'), {
        action: {
          label: t('actions.upgrade', 'Upgrade'),
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }

    if (isAtBlockLimit) {
      toast.error(t('blocks.limitReached', 'Достигнут лимит {{count}} блоков. Перейдите на Premium.', { count: FREE_LIMITS.maxBlocks }));
      return;
    }

    closeSheetAndRun(() => {
      onInsert(blockType);
    });
  };

  const handleInsertPresetClick = (preset: BlockPreset) => {
    const manifest = BLOCK_MANIFEST[preset.blockType];
    const blockTier = (manifest?.isPremium ? 'pro' : 'free') as BlockTier;

    if (!canUseBlock(blockTier)) {
      toast.error(t('blocks.proOnly', 'Этот блок доступен только в PRO'), {
        action: {
          label: t('actions.upgrade', 'Upgrade'),
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }

    if (isAtBlockLimit) {
      toast.error(t('blocks.limitReached', 'Достигнут лимит {{count}} блоков. Перейдите на Premium.', { count: FREE_LIMITS.maxBlocks }));
      return;
    }

    closeSheetAndRun(() => {
      if (onInsertPreset) {
        onInsertPreset(preset);
        return;
      }

      onInsert(preset.blockType);
    });
  };

  const getReasonTooltip = (blockType: string): string | null => {
    const rec = recommendations.find(r => r.block === blockType);
    return rec ? t(rec.reason, '') : null;
  };

  const renderBlockItem = (block: typeof MANIFEST_BLOCKS[number], showRelevantBadge: boolean = false) => {
    const isLocked = !canUseBlock(block.tier);
    const IconComponent = getLucideIcon(block.icon);
    const reasonTooltip = showRelevantBadge ? getReasonTooltip(block.type) : null;
    const marker = showRelevantBadge && !isLocked
      ? {
          icon: Sparkles,
          label: t('recommendations.relevant', 'Актуально'),
          className: 'bg-emerald-500 text-white',
        }
      : block.tier === 'pro'
        ? {
            icon: isLocked ? Lock : Crown,
            label: t('pricing.pro', 'PRO'),
            className: isLocked ? 'bg-muted text-muted-foreground' : 'bg-amber-500 text-white',
          }
        : null;

    const blockButton = (
      <button
        key={block.type}
        type="button"
        onClick={() => handleInsert(block.type, block.tier)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleInsert(block.type, block.tier);
          }
        }}
        disabled={isLocked}
        data-testid={`add-block-option-${block.type}`}
        aria-label={t('editor.insertBlockAria', 'Добавить блок {{name}}', { name: t(block.labelKey, block.type) })}
        className={cn(
          "relative flex min-h-[124px] flex-col items-center gap-3 rounded-3xl p-4 transition-all",
          "hover:bg-muted/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isLocked && "opacity-40 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
          block.color
        )}>
          <IconComponent className="h-7 w-7" />
        </div>

        <span className="max-w-[7rem] text-xs sm:text-sm font-bold text-center leading-tight break-words whitespace-normal text-wrap">
          {t(block.labelKey, block.type)}
        </span>

        {marker && (
          <div className="absolute -top-2 left-2">
            <Badge
              variant="default"
              className={cn('border-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', marker.className)}
            >
              <marker.icon className="mr-1 h-2.5 w-2.5" />
              {marker.label}
            </Badge>
          </div>
        )}

        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </button>
    );

    if (reasonTooltip && !isMobile) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {blockButton}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="text-xs">{reasonTooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return blockButton;
  };

  const renderPresetItem = (preset: BlockPreset, isFeatured: boolean = false) => {
    const manifest = BLOCK_MANIFEST[preset.blockType];
    if (!manifest) return null;

    const blockTier = (manifest.isPremium ? 'pro' : 'free') as BlockTier;
    const isLocked = !canUseBlock(blockTier);
    const IconComponent = getLucideIcon(manifest.icon);
    const color = BLOCK_COLORS[preset.blockType] || 'bg-muted';

    return (
      <button
        key={preset.id}
        type="button"
        onClick={() => handleInsertPresetClick(preset)}
        disabled={isLocked}
        className={cn(
          "relative flex flex-col items-center gap-2 rounded-3xl p-4 transition-all",
          "hover:bg-muted/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isLocked && "opacity-40 cursor-not-allowed",
          isFeatured && "ring-1 ring-primary/20 bg-primary/5"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md",
          color
        )}>
          <IconComponent className="h-6 w-6" />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
            {t(manifest.labelKey)}
          </span>
          <span className="text-xs font-bold text-center leading-tight">
            {t(preset.labelKey)}
          </span>
        </div>

        {isFeatured && (
          <div className="absolute -top-1 -right-1">
            <Badge className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-primary animate-pulse">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </Badge>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {!hideTrigger && (
        <Button
          variant="default"
          size="lg"
          onClick={() => handleOpenChange(true)}
          className={cn(
            "shadow-xl shadow-primary/30 transition-all active:scale-95",
            isMobile
              ? "h-18 w-18 rounded-full"
              : "h-14 w-14 rounded-2xl"
          )}
          data-onboarding="add-block"
          data-testid="add-block-trigger"
        >
          <Plus className={isMobile ? "h-9 w-9" : "h-7 w-7"} strokeWidth={2.5} />
        </Button>
      )}

      {renderSheet && (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            hideCloseButton
            data-testid="add-block-sheet"
            className="h-[85vh] p-0 bg-background border-t-0 rounded-t-[32px] outline-none flex flex-col overflow-hidden"
            onPointerDownOutside={(event) => {
              event.preventDefault();
              handleOpenChange(false);
            }}
            onInteractOutside={(event) => {
              event.preventDefault();
              handleOpenChange(false);
            }}
            onEscapeKeyDown={() => handleOpenChange(false)}
          >
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/10">
                <div className="flex justify-center pt-4 pb-2">
                  <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
                </div>

                <SheetHeader className="px-6 pt-2 pb-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-black">{t('editor.addBlock', 'Добавить')}</SheetTitle>
                    <SheetClose asChild>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleOpenChange(false);
                        }}
                        className="p-2 rounded-full hover:bg-muted transition-colors active:scale-90"
                        aria-label={t('common.close', 'Close')}
                      >
                        <X className="h-6 w-6 text-muted-foreground" />
                      </button>
                    </SheetClose>
                  </div>
                  <SheetDescription className="sr-only">{t('editor.selectBlock', 'Выберите блок для добавления')}</SheetDescription>
                </SheetHeader>

                <div className="px-6 pb-5 bg-muted/20">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    {!isPremium && (
                      <Badge
                        variant={isAtBlockLimit ? 'destructive' : 'secondary'}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {remainingBlocks > 0 ? `${remainingBlocks} ${t('freemium.left', 'осталось')}` : t('freemium.limit', 'Лимит')}
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                    <Input
                      data-testid="add-block-search"
                      placeholder={t('editor.searchBlocks', 'Поиск блоков...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-14 h-14 text-lg rounded-2xl bg-background border-border/30 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
              {/* Featured Presets (Expert only) */}
              {featuredPresets.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Badge variant="outline" className="h-5 bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase">
                      {t('expert.presets_badge', 'Эксперт')}
                    </Badge>
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      {t('expert.featured_presets', 'Готовые решения')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {featuredPresets.map(preset => renderPresetItem(preset, true))}
                  </div>
                </div>
              )}

              {recommendedBlocks.length > 0 && !searchQuery && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      {t('recommendations.title', 'Рекомендовано для вас')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <TooltipProvider delayDuration={300}>
                      {recommendedBlocks.map((block) => renderBlockItem(block, true))}
                    </TooltipProvider>
                  </div>
                </div>
              )}

              {searchQuery && filteredPresets.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                      {t('editor.presets_tab', 'Готовые блоки')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPresets.map(preset => renderPresetItem(preset))}
                  </div>
                </div>
              )}

              {otherBlocks.length > 0 && (
                <div>
                  {(recommendedBlocks.length > 0 || featuredPresets.length > 0) && !searchQuery && (
                    <div className="flex items-center gap-2 mb-4 px-1 pt-4 border-t border-border/10">
                      <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                        {t('recommendations.allBlocks', 'Все блоки')}
                      </h3>
                    </div>
                  )}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <TooltipProvider delayDuration={300}>
                      {otherBlocks.map((block) => renderBlockItem(block, false))}
                    </TooltipProvider>
                  </div>
                </div>
              )}

              {filteredBlocks.length === 0 && filteredPresets.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground font-bold">{t('common.noResults', 'Ничего не найдено')}</p>
                </div>
              )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
});
