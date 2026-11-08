import { memo, type CSSProperties } from 'react';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { cn } from '@/lib/utils/utils';
import { Block } from '@/types/page';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';
import { getComposition, type CompositionDef } from '@/lib/design/composition';
import { resolveBlockVariant } from '@/lib/design/block-variants';
import { isBlockShownToVisitors } from '@/lib/blocks/block-visibility';
import { resolveBlockCellAppearance, resolveBlockLayout, resolveProfileComposition, splitBlockLayoutRuns, SELF_STYLED_BLOCK_TYPES, TRANSPARENT_BLOCK_TYPES } from '@/lib/appearance/block-appearance';
import type { PageTheme } from '@/types/page';

interface GridBlocksRendererProps {
  blocks: Block[];
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
  isPreview?: boolean;
  className?: string;
  /** Page theme animation: 'none' renders blocks without entrance motion. */
  animation?: PageTheme['animationStyle'];
}

/**
 * Renders blocks in a responsive layout.
 *
 * Default (legacy) behaviour: a 2-column bento grid — unchanged.
 * Phase 1: contiguous blocks sharing a `sectionId` whose first block carries a
 * `composition` are rendered inside that composition's shell, so sections can
 * be split heroes, editorial stacks, horizontal rails, etc. instead of a stack
 * of identical rounded cards.
 */
const CARD_ONLY_STYLE_KEYS = new Set(['backgroundColor', 'backgroundImage', 'borderRadius', 'boxShadow', 'borderWidth', 'borderStyle', 'borderColor', 'padding']);

function transparentCellStyle(style: CSSProperties | undefined, keepRadius = false): CSSProperties | undefined {
  if (!style) return style;
  // Frameless media ("Во всю ширину") keep the tile radius so a photo is a
  // rounded tile like the rest of the page, just without card padding.
  return Object.fromEntries(Object.entries(style).filter(([key]) => !CARD_ONLY_STYLE_KEYS.has(key) || (keepRadius && key === 'borderRadius'))) as CSSProperties;
}

export const GridBlocksRenderer = memo(function GridBlocksRenderer({
  blocks,
  pageOwnerId,
  pageId,
  isOwnerPremium,
  ownerTier,
  isPreview = false,
  className,
  animation = 'gentle',
}: GridBlocksRendererProps) {
  // Guard against undefined/null blocks
  // Visitors skip blocks that are scheduled out or left empty; filtering here
  // (not inside BlockRenderer) keeps them from leaving an empty card behind.
  const validBlocks = (blocks || []).filter((b): b is Block =>
    b != null && typeof b === 'object' && 'type' in b && (isPreview || isBlockShownToVisitors(b)));

  const { profile: profileBlock, socials: profileSocials, content: contentBlocks } = resolveProfileComposition(validBlocks);

  const noMotion = animation === 'none';
  const energetic = animation === 'energetic';
  // CSS entrance (styles/enter-motion.css); the server render passes 'none'.
  const enter = (index: number, base = 0, extra?: CSSProperties): { className?: string; style?: CSSProperties; 'data-lm-motion'?: string } =>
    noMotion
      ? {}
      : {
          className: 'lm-enter',
          'data-lm-motion': energetic ? 'energetic' : undefined,
          style: {
            '--lm-enter-y': energetic ? '24px' : '12px',
            '--lm-enter-scale': energetic ? 0.96 : 0.99,
            '--lm-enter-dur': energetic ? '0.5s' : '0.45s',
            '--lm-enter-delay': `${base + Math.min(index, 12) * (energetic ? 30 : 50)}ms`,
            ...extra,
          } as CSSProperties,
        };
  const renderCell = (
    block: Block,
    opts?: { index?: number; total?: number; composition?: CompositionDef; enterIndex?: number },
  ) => {
    const composition = opts?.composition;
    const variant = resolveBlockVariant(block.type, (block as any).designVariant);

    const layout = resolveBlockLayout(block);
    const inComposition = !!composition;

    const contentAlignment = block.blockStyle?.contentAlignment || 'center';
    const alignmentClass =
      contentAlignment === 'top' ? 'items-start'
        : contentAlignment === 'bottom' ? 'items-end'
          : 'items-center';

    const isTransparent =
      TRANSPARENT_BLOCK_TYPES.has(block.type) || SELF_STYLED_BLOCK_TYPES.has(block.type) || !!composition?.naked || !!variant?.naked;

    // One resolver for the public grid and the editor canvas (block-appearance).
    // Variant style patches sit UNDER the user's explicit settings.
    const bs = { ...(variant?.stylePatch || {}), ...(block.blockStyle || {}) } as NonNullable<Block['blockStyle']>;
    const appearance = resolveBlockCellAppearance(block, bs);
    const hasCustomBg = appearance.hasCustomBackground && !SELF_STYLED_BLOCK_TYPES.has(block.type);
    const isWide = inComposition || layout.columns === 2;

    const itemClass = composition?.itemClass?.(opts?.index ?? 0, opts?.total ?? 1) || '';

    // Entrance animation lives on the outer element; the card chrome and hover
    // effects live on the inner one, so hover transforms are never cancelled.
    const entrance = enter(opts?.enterIndex ?? opts?.index ?? 0, 40);
    return (
      <div
        key={block.id}
        data-lm-cell
        data-lm-wide={isWide ? '' : undefined}
        data-lm-auto={layout.autoHeight ? '' : undefined}
        data-lm-type={block.type}
        data-lm-motion={entrance['data-lm-motion']}
        className={cn('relative flex min-w-0 min-h-0', !isTransparent && 'lm-owned-surface', !inComposition && !layout.autoHeight && 'lm-fixed-cell', itemClass, entrance.className)}
        style={inComposition ? entrance.style : { ...layout.style, ...entrance.style }}
      >
        <div
          className={cn(
            'group relative flex w-full min-w-0 min-h-0 transition-all duration-300',
            (!layout.autoHeight || variant?.naked || block.type === 'carousel') && 'overflow-hidden',
            !isTransparent && 'block-card',
            alignmentClass,
            !isTransparent && (hasCustomBg ? 'qb-card-hover' : 'qb-card qb-card-hover'),
            isTransparent && 'bg-transparent',
            !isTransparent && appearance.className,
            variant?.className,
          )}
          // Transparent cells (separator, socials, …) keep text colour and font
          // only; the card radius/shadow drew an empty shadowed pill around them.
          style={isTransparent ? transparentCellStyle(appearance.style, !!variant?.naked) : appearance.style}
        >
          {/* Ambient hover sheen */}
          {!isTransparent && !hasCustomBg && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(120%_80%_at_0%_0%,hsl(var(--primary)/0.05),transparent_60%)]"
            />
          )}
          <div className={cn('lm-tile-content relative w-full', !layout.autoHeight && 'h-full', appearance.textEffectClass)}>
            <BlockRenderer
              block={block}
              isPreview={isPreview}
              pageOwnerId={pageOwnerId}
              pageId={pageId}
              isOwnerPremium={isOwnerPremium}
              ownerTier={ownerTier}
              containerStyled={!isTransparent}
            />
          </div>
        </div>
      </div>
    );
  };

  // Split content into runs: composed sections vs legacy bento groups
  type Run =
    | { kind: 'grid'; blocks: Block[] }
    | { kind: 'section'; composition: CompositionDef; blocks: Block[] };

  const runs: Run[] = [];
  for (const block of contentBlocks) {
    const composition = getComposition((block as any).composition);
    const sectionId = (block as any).sectionId as string | undefined;
    const last = runs[runs.length - 1];

    if (composition) {
      runs.push({ kind: 'section', composition, blocks: [block] });
      continue;
    }
    if (
      last?.kind === 'section' &&
      sectionId &&
      (last.blocks[0] as any).sectionId === sectionId
    ) {
      last.blocks.push(block);
      continue;
    }
    if (last?.kind === 'grid') {
      last.blocks.push(block);
      continue;
    }
    runs.push({ kind: 'grid', blocks: [block] });
  }

  const profileEntrance = enter(0, 0, { '--lm-enter-y': '16px', '--lm-enter-dur': '0.5s' } as CSSProperties);

  return (
    <div className={cn('lm-block-stack space-y-4', className)}>
      {/* Profile Block — always full bleed */}
      {profileBlock && (
        <div
          className={cn('lm-profile-card w-full', profileEntrance.className)}
          data-lm-motion={profileEntrance['data-lm-motion']}
          style={{ borderRadius: resolveBlockCellAppearance(profileBlock).style.borderRadius, ...profileEntrance.style }}
        >
          <BlockRenderer
            block={profileBlock}
            isPreview={isPreview}
            pageOwnerId={pageOwnerId}
            pageId={pageId}
            isOwnerPremium={isOwnerPremium}
            ownerTier={ownerTier}
          />
          {profileSocials && <div data-lm-socials><BlockRenderer block={profileSocials} isPreview={isPreview} pageOwnerId={pageOwnerId} pageId={pageId} isOwnerPremium={isOwnerPremium} ownerTier={ownerTier} /></div>}
        </div>
      )}

      {runs.map((run, runIndex) =>
        run.kind === 'grid' ? (
          splitBlockLayoutRuns(run.blocks).map((group, groupIndex) => (
            <div
              key={`grid-${runIndex}-${groupIndex}`}
              data-lm-grid
              className={resolveBlockLayout(group[0]).autoHeight ? 'lm-auto-run' : 'lm-tile-grid'}
            >
              {group.map((block, i) => renderCell(block, { enterIndex: i }))}
            </div>
          ))
        ) : (
          <section
            key={`sec-${runIndex}`}
            data-composition={run.composition.id}
            className={cn('relative', run.composition.shellClass)}
          >
            <div className={run.composition.gridClass}>
              {run.blocks.map((block, i) =>
                renderCell(block, { index: i, total: run.blocks.length, composition: run.composition }),
              )}
            </div>
          </section>
        ),
      )}
    </div>
  );
});
