'use client';

import { useNavigate } from '@/lib/router-compat';
import { memo, useState, useMemo, useCallback, useEffect, type CSSProperties } from 'react';
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
  SheetClose,
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
import { BLOCK_MANIFEST, isBlockPremium } from '@/lib/blocks/block-manifest';
import { FreemiumBlockLimit } from '@/components/billing/FreemiumBlockLimit';

import { BUSINESS_BLOCK_TYPES, useBusinessFeatures } from '@/lib/features';
import { BLOCK_PRESETS, type BlockPreset, getPresetsForType } from '@/lib/editor/editor-presets';
import { getLucideIcon } from '@/lib/utils/icon-utils';
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

/** The everyday blocks, shown first (about one screen on a phone). */
const PRIMARY_BLOCK_TYPES = ['button', 'link', 'text', 'image', 'carousel', 'video', 'audio', 'download', 'socials', 'messenger', 'form', 'custom_code'] as const;

// Derive block list from manifest (single source of truth)
// Exclude 'profile' since it's auto-added and not insertable
// Built lazily: isBlockPremium reads the manifest + promo window at call time.
function buildManifestBlocks() {
  const coreOrder: string[] = ['button', 'image', 'video', 'audio', 'download', 'text', 'form', 'carousel'];
  return Object.values(BLOCK_MANIFEST)
    .filter((entry) => entry.type !== 'profile')
    .sort((a, b) => {
      const rank = (type: string) => coreOrder.includes(type) ? coreOrder.indexOf(type) : coreOrder.length;
      return rank(a.type) - rank(b.type);
    })
    .map((entry) => ({
      type: entry.type,
      labelKey: entry.labelKey,
      icon: entry.icon,
      // Respect the free-blocks promo: gating comes from isBlockPremium, not the raw manifest flag
      tier: (isBlockPremium(entry.type) ? 'pro' : 'free') as BlockTier,
    }));
}

type ManifestBlock = ReturnType<typeof buildManifestBlocks>[number];

let manifestBlocksCache: ManifestBlock[] | null = null;
function getManifestBlocks(): ManifestBlock[] {
  if (!manifestBlocksCache) manifestBlocksCache = buildManifestBlocks();
  return manifestBlocksCache;
}

/** Endless micro-motion per block type (keyframes in styles/block-tile-motion.css). */
const TILE_MOTION: Record<string, string> = {
  button: 'tap', link: 'swing', text: 'breathe', image: 'zoom', carousel: 'slide', video: 'pulse',
  download: 'drop', socials: 'orbit', messenger: 'bubble', form: 'write', custom_code: 'breathe',
  separator: 'stretch', avatar: 'ping', profile: 'ping', before_after: 'slide', map: 'pin', faq: 'wobble',
  countdown: 'tick', testimonial: 'bubble', scratch: 'wobble', product: 'float', catalog: 'zoom',
  pricing: 'pulse', booking: 'tap', shoutout: 'wobble', community: 'ping', event: 'float', newsletter: 'bubble',
};

/** Stable per-type stagger so the tiles do not move in lockstep. */
function tileDelay(type: string): string {
  let hash = 0;
  for (const char of type) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return `${-(hash % 12) * 0.45}s`;
}

/** Monochrome tile with a living icon: ink on white, inverts on hover. */
function BlockTileIcon({ type, icon }: { type: string; icon: string }) {
  const Icon = getLucideIcon(icon);
  return (
    <span
      className="lm-tile flex h-14 w-14 items-center justify-center rounded-[18px] border border-border/70 bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
      style={{ '--lm-tile-delay': tileDelay(type) } as CSSProperties}
    >
      {type === 'audio' ? (
        <span className="lm-eq" aria-hidden><span /><span /><span /><span /></span>
      ) : (
        <span className="lm-motion" data-motion={TILE_MOTION[type] ?? 'float'} aria-hidden>
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
      )}
    </span>
  );
}

export const BlockInsertButton = memo(function BlockInsertButton({
  onInsert,
  onInsertPreset,
  isPremium = false,
  currentBlockCount = 0,
  className,
  currentTier = 'identity',
  pageNiche,
  isOpen: externalIsOpen,
  onOpenChange,
  hideTrigger = false,
  renderSheet = true,
}: BlockInsertButtonProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const businessEnabled = useBusinessFeatures();
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  // Reset search when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, [setIsOpen]);

  const isAtBlockLimit = !isPremium && currentBlockCount >= FREE_LIMITS.maxBlocks;

  const tierLevel = (tier: FreeTier | BlockTier): number => {
    switch (tier) {
      case 'pro': return 2;
      default: return 1;
    }
  };

  const canUseBlock = (blockTier: BlockTier): boolean => {
    return tierLevel(currentTier) >= tierLevel(blockTier);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const MANIFEST_BLOCKS = getManifestBlocks();
  const visibleBlocks = MANIFEST_BLOCKS.filter(block => businessEnabled || !BUSINESS_BLOCK_TYPES.has(block.type));
  const blockLabel = (block: ManifestBlock) => t(`editor.insertShort.${block.type}`, t(block.labelKey, block.type));
  const filteredBlocks = visibleBlocks.filter(block =>
    !normalizedQuery ||
    t(block.labelKey, block.type).toLowerCase().includes(normalizedQuery) ||
    blockLabel(block).toLowerCase().includes(normalizedQuery) ||
    block.type.replace(/_/g, ' ').includes(normalizedQuery)
  );

  const filteredPresets = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return BLOCK_PRESETS.filter(preset =>
      (businessEnabled || !BUSINESS_BLOCK_TYPES.has(preset.blockType)) && (
        t(preset.labelKey).toLowerCase().includes(query) ||
        preset.keywords.some(k => k.toLowerCase().includes(query))
      )
    );
  }, [businessEnabled, searchQuery, t]);

  const featuredPresets = useMemo(() => {
    if (searchQuery || pageNiche !== 'expert' || !businessEnabled) return [];
    return BLOCK_PRESETS.filter(p =>
      ['expert_consultation_cta', 'expert_guide_buy', 'expert_telegram_join'].includes(p.id)
    );
  }, [businessEnabled, pageNiche, searchQuery]);

  // Grouping: the everyday blocks first, all on one screen.
  const groups = useMemo(() => {
    if (normalizedQuery) return [{ id: 'results', titleKey: '', title: '', blocks: filteredBlocks }];
    const byId = (ids: readonly string[]) => ids
      .map(id => filteredBlocks.find(block => block.type === id))
      .filter((block): block is ManifestBlock => !!block);
    const placed = new Set<string>([...PRIMARY_BLOCK_TYPES, ...BUSINESS_BLOCK_TYPES]);
    return [
      { id: 'primary', titleKey: 'editor.insertGroups.primary', title: 'Основные', blocks: byId(PRIMARY_BLOCK_TYPES) },
      { id: 'more', titleKey: 'editor.insertGroups.more', title: 'Ещё', blocks: filteredBlocks.filter(block => !placed.has(block.type)) },
      { id: 'business', titleKey: 'editor.insertGroups.business', title: 'Продажи и запись', blocks: byId([...BUSINESS_BLOCK_TYPES]) },
    ].filter(group => group.blocks.length > 0);
  }, [filteredBlocks, normalizedQuery]);

  const closeSheet = useCallback(() => {
    setSearchQuery('');
    setIsOpen(false);
  }, [setIsOpen]);

  const closeSheetAndRun = useCallback((callback: () => void) => {
    closeSheet();
    // Run callback after state update propagates
    setTimeout(() => {
      callback();
      toast.success(t('editor.blockAdded', 'Блок добавлен'));
    }, 50);
  }, [closeSheet, t]);

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
    const blockTier = (isBlockPremium(preset.blockType) ? 'pro' : 'free') as BlockTier;

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

  const renderBlockItem = (block: ManifestBlock) => {
    const isLocked = !canUseBlock(block.tier);
    const label = blockLabel(block);

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
          'relative flex min-h-[92px] min-w-0 flex-col items-center justify-start gap-2 rounded-2xl px-1 pb-2 pt-2.5 transition-transform',
          'hover:bg-muted/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isLocked && 'opacity-40 cursor-not-allowed'
        )}
      >
        <BlockTileIcon type={block.type} icon={block.icon} />
        <span lang={i18n.language} className="line-clamp-2 w-full hyphens-auto break-words text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
          {label}
        </span>
        {block.tier === 'pro' && (
          <span
            className={cn(
              'absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full',
              isLocked ? 'bg-muted text-muted-foreground' : 'bg-foreground text-background',
            )}
            aria-label="PRO"
          >
            {isLocked ? <Lock className="h-3 w-3" aria-hidden /> : <Crown className="h-3 w-3" aria-hidden />}
          </span>
        )}
      </button>
    );

    if (isLocked && !isMobile) {
      return (
        <Tooltip key={block.type}>
          <TooltipTrigger asChild>
            {blockButton}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="text-xs">{t('pricing.proHint', 'Откройте этот блок на тарифе Pro — без ограничений на типы блоков.')}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return blockButton;
  };

  const renderPresetItem = (preset: BlockPreset, isFeatured: boolean = false) => {
    const manifest = BLOCK_MANIFEST[preset.blockType];
    if (!manifest) return null;

    const blockTier = (isBlockPremium(preset.blockType) ? 'pro' : 'free') as BlockTier;
    const isLocked = !canUseBlock(blockTier);
    return (
      <button
        key={preset.id}
        type="button"
        onClick={() => handleInsertPresetClick(preset)}
        disabled={isLocked}
        className={cn(
          "relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-all",
          "hover:bg-muted/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isLocked && "opacity-40 cursor-not-allowed",
          isFeatured && "ring-1 ring-primary/20 bg-primary/5"
        )}
      >
        <BlockTileIcon type={preset.blockType} icon={manifest.icon} />

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">
            {t(manifest.labelKey)}
          </span>
          <span className="text-xs font-semibold text-center leading-tight">
            {t(preset.labelKey)}
          </span>
        </div>

        {isFeatured && (
          <div className="absolute -top-1 -right-1">
            <Badge className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </Badge>
          </div>
        )}
      </button>
    );
  };

  const gridClass = 'grid grid-cols-4 gap-x-1 gap-y-2 sm:grid-cols-5 lg:grid-cols-6';

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
          data-testid="add-block-trigger"
        >
          <Plus className={isMobile ? "h-9 w-9" : "h-7 w-7"} strokeWidth={2.5} />
        </Button>
      )}

      {renderSheet && isOpen && (
        <Sheet open onOpenChange={(open) => { if (!open) closeSheet(); }}>
          <SheetContent
            side="bottom"
            hideCloseButton
            data-testid="add-block-sheet"
            className="max-h-[88dvh] p-0 bg-background border-t-0 rounded-t-[28px] outline-none flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1.5 rounded-full bg-muted-foreground/25" />
                  </div>

                  <SheetHeader className="px-0 pt-1 pb-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <SheetTitle className="text-xl font-bold">{t('editor.addBlock', 'Добавить блок')}</SheetTitle>
                      <SheetClose asChild>
                        <button
                          type="button"
                          data-testid="add-block-sheet-close"
                          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90"
                          aria-label={t('common.close', 'Close')}
                        >
                          <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </SheetClose>
                    </div>
                    <SheetDescription className="sr-only">{t('editor.selectBlock', 'Выберите блок для добавления')}</SheetDescription>
                  </SheetHeader>

                  <div className="pb-3">
                    {!isPremium && Number.isFinite(FREE_LIMITS.maxBlocks) && (
                      <div className="mb-3">
                        <FreemiumBlockLimit currentBlocks={currentBlockCount} isPremium={isPremium} />
                      </div>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input
                        data-testid="add-block-search"
                        // On phones the keyboard would cover the grid; focus only where it does not.
                        autoFocus={!isMobile}
                        type="search"
                        enterKeyHint="search"
                        placeholder={t('editor.searchBlocks', 'Поиск блоков...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 text-base rounded-xl bg-muted/50 border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-3xl px-3 pb-6 pt-1 sm:px-5">
                {featuredPresets.length > 0 && (
                  <section className="mb-5">
                    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('expert.featured_presets', 'Готовые решения')}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {featuredPresets.map(preset => renderPresetItem(preset, true))}
                    </div>
                  </section>
                )}

                {searchQuery && filteredPresets.length > 0 && (
                  <section className="mb-5">
                    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('editor.presets_tab', 'Готовые блоки')}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {filteredPresets.map(preset => renderPresetItem(preset))}
                    </div>
                  </section>
                )}

                <TooltipProvider delayDuration={300}>
                  {groups.map(group => (
                    <section key={group.id} className="mb-4" aria-label={group.title ? t(group.titleKey, group.title) : undefined}>
                      {group.title && groups.length > 1 && (
                        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t(group.titleKey, group.title)}
                        </h3>
                      )}
                      <div className={gridClass}>
                        {group.blocks.map(block => renderBlockItem(block))}
                      </div>
                    </section>
                  ))}
                </TooltipProvider>

                {filteredBlocks.length === 0 && filteredPresets.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-base text-muted-foreground font-semibold">{t('common.noResults', 'Ничего не найдено')}</p>
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
