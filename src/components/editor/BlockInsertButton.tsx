'use client';

import { useNavigate } from 'react-router-dom';
import { memo, useState, useMemo } from 'react';
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
import type { Niche } from '@/lib/niches';
import type { BlockType } from '@/types/page';

interface BlockInsertButtonProps {
  onInsert: (blockType: string) => void;
  isPremium?: boolean;
  currentBlockCount?: number;
  className?: string;
  currentTier?: FreeTier;
  pageNiche?: Niche | string;
  existingBlocks?: BlockType[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
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
  isPremium = false,
  currentBlockCount = 0,
  className,
  currentTier = 'identity',
  pageNiche,
  existingBlocks = [],
  isOpen: externalIsOpen,
  onOpenChange,
  hideTrigger = false
}: BlockInsertButtonProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchQuery('');
    }
    setIsOpen(open);
  };

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

    // Close first, then insert in a microtask to avoid race conditions
    // while keeping UX responsive on mobile/desktop.
    handleOpenChange(false);
    queueMicrotask(() => onInsert(blockType));
  };

  const getReasonTooltip = (blockType: string): string | null => {
    const rec = recommendations.find(r => r.block === blockType);
    return rec ? t(rec.reason, '') : null;
  };

  const renderBlockItem = (block: typeof MANIFEST_BLOCKS[number], showRelevantBadge: boolean = false) => {
    const isLocked = !canUseBlock(block.tier);
    const IconComponent = getLucideIcon(block.icon);
    const reasonTooltip = showRelevantBadge ? getReasonTooltip(block.type) : null;

    const blockButton = (
      <button
        key={block.type}
        onClick={() => handleInsert(block.type, block.tier)}
        disabled={isLocked}
        data-testid={`add-block-option-${block.type}`}
        className={cn(
          "relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all",
          isLocked
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-muted/50 active:scale-95"
        )}
      >
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
          block.color
        )}>
          <IconComponent className="h-7 w-7" />
        </div>

        <span className="text-sm font-bold text-center leading-tight">
          {t(block.labelKey, block.type)}
        </span>

        {showRelevantBadge && !isLocked && (
          <div className="absolute -top-1 -left-1">
            <Badge
              variant="default"
              className="text-xs px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-500 border-0"
            >
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              {t('recommendations.relevant', 'Актуально')}
            </Badge>
          </div>
        )}

        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {block.tier === 'pro' && !isLocked && (
          <div className="absolute top-2 right-2">
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </button>
    );

    if (reasonTooltip && !isMobile) {
      return (
        <TooltipProvider key={block.type}>
          <Tooltip>
            <TooltipTrigger asChild>
              {blockButton}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">{reasonTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return blockButton;
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {!hideTrigger && (
        <Button
          variant="default"
          size="lg"
          onClick={() => setIsOpen(true)}
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

      <Sheet open={isOpen} onOpenChange={(open) => {
        handleOpenChange(open);
      }}>
        <SheetContent
          side="bottom"
          hideCloseButton
          data-testid="add-block-sheet"
          className="h-[85vh] p-0 bg-background border-t-0 rounded-t-[32px] outline-none"
        >
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
          </div>

          <SheetHeader className="px-6 pt-2 pb-5 border-b border-border/10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black">{t('editor.addBlock', 'Добавить')}</SheetTitle>
              <div className="flex items-center gap-3">
                {!isPremium && (
                  <Badge
                    variant={isAtBlockLimit ? 'destructive' : 'secondary'}
                    className="text-sm px-4 py-1.5 rounded-full font-bold"
                  >
                    {remainingBlocks > 0 ? `${remainingBlocks} ${t('freemium.left', 'осталось')}` : t('freemium.limit', 'Лимит')}
                  </Badge>
                )}
                <SheetClose asChild>
                  <button
                    type="button"
                    data-testid="add-block-sheet-close"
                    className="p-2 rounded-full hover:bg-muted transition-colors active:scale-90"
                    aria-label={t('common.close', 'Close')}
                  >
                    <X className="h-6 w-6 text-muted-foreground" />
                  </button>
                </SheetClose>
              </div>
            </div>
            <SheetDescription className="sr-only">{t('editor.selectBlock', 'Выберите блок для добавления')}</SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 border-b border-border/10 bg-muted/20">
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

          <div className="overflow-y-auto px-5 py-5" style={{ height: 'calc(100% - 180px)' }}>
            {recommendedBlocks.length > 0 && !searchQuery && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">
                    {t('recommendations.title', 'Рекомендовано для вас')}
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {recommendedBlocks.map((block) => renderBlockItem(block, true))}
                </div>
              </div>
            )}

            {otherBlocks.length > 0 && (
              <div>
                {recommendedBlocks.length > 0 && !searchQuery && (
                  <div className="flex items-center gap-2 mb-4 px-1 pt-2 border-t border-border/10">
                    <h3 className="text-sm font-bold text-muted-foreground">
                      {t('recommendations.allBlocks', 'Все блоки')}
                    </h3>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {otherBlocks.map((block) => renderBlockItem(block, false))}
                </div>
              </div>
            )}

            {filteredBlocks.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">{t('common.noResults', 'Ничего не найдено')}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});
