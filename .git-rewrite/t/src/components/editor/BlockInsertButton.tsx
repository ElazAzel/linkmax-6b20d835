import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Lock, Crown, Type, Video, Link2, File, ListOrdered, Image, ShoppingBag, Code, MessageCircle, Calendar, CalendarDays, Star, Gift, Compass, MapPin, Clock, DollarSign, Megaphone, FormInput, Mail, HelpCircle, Layers, Sparkles } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FREE_LIMITS, type FreeTier } from '@/hooks/useFreemiumLimits';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getRecommendedBlocks, type BlockRecommendation } from '@/lib/block-recommendations';
import type { Niche } from '@/lib/niches';
import type { BlockType } from '@/types/page';

interface BlockInsertButtonProps {
  onInsert: (blockType: string) => void;
  isPremium?: boolean;
  currentBlockCount?: number;
  className?: string;
  currentTier?: FreeTier;
  /** Page niche for recommendations */
  pageNiche?: Niche | string;
  /** Existing blocks on page */
  existingBlocks?: BlockType[];
  /** Control sheet externally (for inline mode) */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide FAB button (for inline mode) */
  hideTrigger?: boolean;
}

type BlockTier = 'free' | 'pro';

interface BlockConfig {
  type: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  tier: BlockTier;
}

// Blocks with colorful icons like competitors - labels are translation keys
const ALL_BLOCKS: BlockConfig[] = [
  // Basic
  { type: 'text', label: 'blockTypes.text', Icon: Type, color: 'bg-slate-500', tier: 'free' },
  { type: 'link', label: 'blockTypes.link', Icon: Link2, color: 'bg-blue-500', tier: 'free' },
  { type: 'button', label: 'blockTypes.button', Icon: () => <span className="text-xl font-black">▶</span>, color: 'bg-red-500', tier: 'free' },
  { type: 'image', label: 'blockTypes.image', Icon: Image, color: 'bg-emerald-500', tier: 'free' },
  
  // Media
  { type: 'video', label: 'blockTypes.video', Icon: Video, color: 'bg-rose-500', tier: 'pro' },
  { type: 'carousel', label: 'blockTypes.carousel', Icon: Layers, color: 'bg-violet-500', tier: 'pro' },
  { type: 'avatar', label: 'blockTypes.avatar', Icon: () => <span className="text-xl">👤</span>, color: 'bg-cyan-500', tier: 'free' },
  { type: 'separator', label: 'blockTypes.separator', Icon: () => <span className="text-xl">—</span>, color: 'bg-gray-400', tier: 'free' },
  
  // Social
  { type: 'socials', label: 'blockTypes.socials', Icon: () => <span className="text-xl">@</span>, color: 'bg-pink-500', tier: 'free' },
  { type: 'messenger', label: 'blockTypes.messenger', Icon: MessageCircle, color: 'bg-green-500', tier: 'free' },
  { type: 'shoutout', label: 'blockTypes.shoutout', Icon: Megaphone, color: 'bg-orange-500', tier: 'pro' },
  
  // Business (now pro tier)
  { type: 'product', label: 'blockTypes.product', Icon: ShoppingBag, color: 'bg-amber-500', tier: 'pro' },
  { type: 'catalog', label: 'blockTypes.catalog', Icon: ListOrdered, color: 'bg-teal-500', tier: 'pro' },
  { type: 'pricing', label: 'blockTypes.pricing', Icon: DollarSign, color: 'bg-lime-500', tier: 'pro' },
  { type: 'download', label: 'blockTypes.download', Icon: File, color: 'bg-indigo-500', tier: 'pro' },
  
  // Forms (now pro tier)
  { type: 'form', label: 'blockTypes.form', Icon: FormInput, color: 'bg-purple-500', tier: 'pro' },
  { type: 'newsletter', label: 'blockTypes.newsletter', Icon: Mail, color: 'bg-sky-500', tier: 'pro' },
  { type: 'booking', label: 'blockTypes.booking', Icon: Calendar, color: 'bg-fuchsia-500', tier: 'pro' },
  { type: 'event', label: 'blockTypes.event', Icon: CalendarDays, color: 'bg-emerald-600', tier: 'free' },
  
  // Interactive (now pro tier)
  { type: 'testimonial', label: 'blockTypes.testimonial', Icon: Star, color: 'bg-yellow-500', tier: 'pro' },
  { type: 'scratch', label: 'blockTypes.scratch', Icon: Gift, color: 'bg-red-400', tier: 'pro' },
  { type: 'faq', label: 'blockTypes.faq', Icon: HelpCircle, color: 'bg-blue-400', tier: 'pro' },
  { type: 'countdown', label: 'blockTypes.countdown', Icon: Clock, color: 'bg-orange-400', tier: 'pro' },
  
  // Other
  { type: 'map', label: 'blockTypes.map', Icon: MapPin, color: 'bg-green-600', tier: 'free' },
  { type: 'before_after', label: 'blockTypes.beforeAfter', Icon: Compass, color: 'bg-cyan-600', tier: 'pro' },
  { type: 'custom_code', label: 'blockTypes.customCode', Icon: Code, color: 'bg-slate-600', tier: 'pro' },
  
  // Social - Community
  { type: 'community', label: 'blockTypes.community', Icon: () => <span className="text-xl">👥</span>, color: 'bg-indigo-400', tier: 'pro' },
];

export const BlockInsertButton = memo(function BlockInsertButton({ 
  onInsert, 
  isPremium = false,
  currentBlockCount = 0,
  className,
  currentTier = 'free',
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

  // Support both controlled and uncontrolled modes
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const isAtBlockLimit = !isPremium && currentBlockCount >= FREE_LIMITS.maxBlocks;
  const remainingBlocks = isPremium ? Infinity : FREE_LIMITS.maxBlocks - currentBlockCount;

  // Get niche-based recommendations
  const recommendations = useMemo(() => {
    return getRecommendedBlocks(pageNiche, existingBlocks);
  }, [pageNiche, existingBlocks]);

  // Create a set for quick lookup
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

  const filteredBlocks = ALL_BLOCKS.filter(block => 
    t(block.label, block.type).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split blocks into recommended and others
  const { recommendedBlocks, otherBlocks } = useMemo(() => {
    if (searchQuery) {
      // If searching, don't split
      return { recommendedBlocks: [], otherBlocks: filteredBlocks };
    }
    
    const recommended: BlockConfig[] = [];
    const others: BlockConfig[] = [];
    
    filteredBlocks.forEach(block => {
      if (recommendedBlockTypes.has(block.type as BlockType)) {
        recommended.push(block);
      } else {
        others.push(block);
      }
    });
    
    // Sort recommended by score (use order from recommendations)
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
    
    onInsert(blockType);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Get reason tooltip for a block
  const getReasonTooltip = (blockType: string): string | null => {
    const rec = recommendations.find(r => r.block === blockType);
    return rec ? t(rec.reason, '') : null;
  };

  // Render block item
  const renderBlockItem = (block: BlockConfig, showRelevantBadge: boolean = false) => {
    const isLocked = !canUseBlock(block.tier);
    const IconComponent = block.Icon;
    const reasonTooltip = showRelevantBadge ? getReasonTooltip(block.type) : null;
    
    const blockButton = (
      <button
        key={block.type}
        onClick={() => handleInsert(block.type, block.tier)}
        disabled={isLocked}
        className={cn(
          "relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all",
          isLocked
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-muted/50 active:scale-95"
        )}
      >
        {/* Colorful icon square - LARGER */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
          block.color
        )}>
          <IconComponent className="h-7 w-7" />
        </div>
        
        {/* Label */}
        <span className="text-sm font-bold text-center leading-tight">
          {t(block.label, block.type)}
        </span>
        
        {/* Relevant badge */}
        {showRelevantBadge && !isLocked && (
          <div className="absolute -top-1 -left-1">
            <Badge 
              variant="default" 
              className="text-[9px] px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-500 border-0"
            >
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              {t('recommendations.relevant', 'Актуально')}
            </Badge>
          </div>
        )}
        
        {/* Lock/Crown badge */}
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

    // Wrap with tooltip on desktop if we have a reason
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


  // Mobile & Desktop - Premium app-like sheet
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {/* FAB Button - hidden when using external control */}
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
        >
          <Plus className={isMobile ? "h-9 w-9" : "h-7 w-7"} strokeWidth={2.5} />
        </Button>
      )}

      {/* Premium App-Like Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] p-0 bg-background border-t-0 rounded-t-[32px]"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
          </div>
          
          {/* Header */}
          <SheetHeader className="px-6 pt-2 pb-5 border-b border-border/10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black">{t('editor.addBlock', 'Добавить')}</SheetTitle>
              {!isPremium && (
                <Badge 
                  variant={isAtBlockLimit ? 'destructive' : 'secondary'} 
                  className="text-sm px-4 py-1.5 rounded-full font-bold"
                >
                  {remainingBlocks > 0 ? `${remainingBlocks} ${t('freemium.left', 'осталось')}` : t('freemium.limit', 'Лимит')}
                </Badge>
              )}
            </div>
            <SheetDescription className="sr-only">{t('editor.selectBlock', 'Выберите блок для добавления')}</SheetDescription>
          </SheetHeader>
          
          {/* Search - Larger for mobile */}
          <div className="px-6 py-5 border-b border-border/10 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                placeholder={t('editor.searchBlocks', 'Поиск блоков...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-14 text-lg rounded-2xl bg-background border-border/30 font-medium"
              />
            </div>
          </div>
          
          {/* Blocks with Recommendations */}
          <div className="overflow-y-auto px-5 py-5" style={{ height: 'calc(100% - 180px)' }}>
            {/* Recommended Section - Only show when not searching */}
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

            {/* All Blocks Section */}
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
