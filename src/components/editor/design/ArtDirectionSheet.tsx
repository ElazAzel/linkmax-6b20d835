/**
 * ArtDirectionSheet — Phase 3 of the design hierarchy.
 *
 * "User provides meaning. LinkMAX provides art direction."
 *
 * Lets the user apply one of the deterministic page recipes to the blocks that
 * are ALREADY on the page: nothing is added, removed or reordered — only
 * `sectionId` / `composition` / `designVariant` are (re)assigned so the page
 * reads as designed sections instead of a stack of identical cards.
 */
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import Check from 'lucide-react/dist/esm/icons/check';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Lock from 'lucide-react/dist/esm/icons/lock';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import {
  PAGE_RECIPES,
  applyArtDirection,
  clearArtDirection,
  type PageRecipe,
} from '@/lib/design/art-direction';
import { getComposition } from '@/lib/design/composition';
import { getKitsForTier, resolveDesignKit, detectActiveKit } from '@/lib/design/design-kits';
import type { PageTheme } from '@/types/page';
import type { Block } from '@/types/blocks';

export interface ArtDirectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: Block[];
  /** Applies the new (annotated) block list — same content, same order. */
  onApply: (blocks: Block[], recipeId: string | null) => void;
  /** Phase 7: applies palette + typography together with the layout. */
  onApplyTheme?: (theme: Partial<PageTheme>) => void;
  /** Current theme preset id, used to highlight the active kit. */
  currentThemePreset?: string | null;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

/** Tiny CSS wireframe that hints at the rhythm of the recipe's sections. */
const RecipeWireframe = memo(function RecipeWireframe({ recipe }: { recipe: PageRecipe }) {
  const rows = useMemo(() => {
    const ids = [recipe.hero, ...recipe.body.slice(0, 2), recipe.closing];
    return ids.map((id) => getComposition(id)?.rhythm ?? 'stack');
  }, [recipe]);

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-lg bg-muted/40 p-2">
      {rows.map((rhythm, i) => {
        const bar = 'rounded-[3px] bg-foreground/15';
        if (rhythm === 'split') {
          return (
            <div key={i} className="flex gap-1.5">
              <div className={cn(bar, 'h-6 flex-1')} />
              <div className={cn(bar, 'h-6 w-1/3 bg-primary/30')} />
            </div>
          );
        }
        if (rhythm === 'bento') {
          return (
            <div key={i} className="grid grid-cols-3 gap-1">
              <div className={cn(bar, 'h-4 col-span-2')} />
              <div className={cn(bar, 'h-4')} />
              <div className={cn(bar, 'h-4')} />
              <div className={cn(bar, 'h-4 col-span-2')} />
            </div>
          );
        }
        if (rhythm === 'full-bleed') {
          return <div key={i} className={cn(bar, 'h-7 bg-primary/25')} />;
        }
        if (rhythm === 'horizontal') {
          return (
            <div key={i} className="flex gap-1 overflow-hidden">
              <div className={cn(bar, 'h-5 w-1/3')} />
              <div className={cn(bar, 'h-5 w-1/3')} />
              <div className={cn(bar, 'h-5 w-1/4')} />
            </div>
          );
        }
        if (rhythm === 'overlap') {
          return (
            <div key={i} className="relative h-7">
              <div className={cn(bar, 'absolute inset-x-0 top-0 h-5')} />
              <div className={cn(bar, 'absolute left-3 top-2.5 h-4 w-1/3 bg-primary/35')} />
            </div>
          );
        }
        if (rhythm === 'spotlight') {
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(bar, 'h-5 w-2/3 bg-primary/25')} />
              <div className={cn(bar, 'h-2 w-1/3')} />
            </div>
          );
        }
        if (rhythm === 'editorial') {
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className={cn(bar, 'h-2.5 w-1/2')} />
              <div className={cn(bar, 'h-5')} />
            </div>
          );
        }
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className={cn(bar, 'h-3')} />
            <div className={cn(bar, 'h-3 w-4/5')} />
          </div>
        );
      })}
    </div>
  );
});

export const ArtDirectionSheet = memo(function ArtDirectionSheet({
  open,
  onOpenChange,
  blocks,
  onApply,
  onApplyTheme,
  currentThemePreset,
  isPremium = false,
  onUpgrade,
}: ArtDirectionSheetProps) {
  const { t } = useTranslation();

  const currentRecipeId = useMemo(() => {
    const hero = blocks.find((b) => b.type !== 'profile' && b.composition)?.composition;
    if (!hero) return null;
    return PAGE_RECIPES.find((r) => r.hero === hero)?.id ?? null;
  }, [blocks]);

  const [selected, setSelected] = useState<string | null>(currentRecipeId);

  const contentBlocks = blocks.filter((b) => b.type !== 'profile');
  const canApply = contentBlocks.length > 0;

  const handleApply = (recipeId: string) => {
    const result = applyArtDirection(blocks, { recipeId });
    onApply(result.blocks, recipeId);
    setSelected(recipeId);
    onOpenChange(false);
  };

  const handleReset = () => {
    onApply(clearArtDirection(blocks), null);
    setSelected(null);
    onOpenChange(false);
  };

  // Phase 7: design kits — layout recipe + palette/typography in one tap.
  const kits = useMemo(() => getKitsForTier(isPremium), [isPremium]);
  const activeKitId = useMemo(() => {
    const hero = blocks.find((b) => b.type !== 'profile' && b.composition)?.composition;
    return detectActiveKit(currentThemePreset, hero)?.id ?? null;
  }, [blocks, currentThemePreset]);

  const handleApplyKit = (kitId: string) => {
    const resolved = resolveDesignKit(kitId);
    if (!resolved) return;
    if (resolved.kit.isPremium && !isPremium) {
      onUpgrade?.();
      return;
    }
    const result = applyArtDirection(blocks, { recipeId: resolved.recipe.id });
    onApply(result.blocks, resolved.recipe.id);
    onApplyTheme?.(resolved.theme);
    setSelected(resolved.recipe.id);
    onOpenChange(false);
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4 text-primary" />
            {t('editor.artDirection.title', 'Дизайн страницы')}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {t(
              'editor.artDirection.subtitle',
              'Ваш контент остаётся тем же — меняется только вёрстка секций: ритм, акценты и типографика.',
            )}
          </SheetDescription>
        </SheetHeader>

        {!canApply ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('editor.artDirection.empty', 'Сначала добавьте хотя бы один блок на страницу.')}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PAGE_RECIPES.map((recipe) => {
              const isActive = selected === recipe.id;
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => handleApply(recipe.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'group flex flex-col gap-2 rounded-xl p-3 text-left transition-colors',
                    'border bg-card hover:bg-accent',
                    isActive ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border/50',
                  )}
                >
                  <RecipeWireframe recipe={recipe} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {t(recipe.labelKey, recipe.labelFallback)}
                    </span>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {t(
                      `editor.artDirection.mood.${recipe.mood}`,
                      recipe.mood === 'editorial'
                        ? 'Много воздуха, крупные заголовки, спокойный ритм'
                        : recipe.mood === 'bold'
                          ? 'Контрастный герой, медиа на всю ширину, сильные CTA'
                          : 'Мягкие переходы, портрет с наложением, лёгкая сетка',
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {canApply && onApplyTheme && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('editor.artDirection.kits', 'Дизайн-киты')}
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t(
                'editor.artDirection.kitsHint',
                'Вёрстка, палитра и шрифты сразу — один тап на готовый стиль.',
              )}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {kits.map((kit) => {
                const resolved = resolveDesignKit(kit.id);
                if (!resolved) return null;
                const locked = kit.isPremium && !isPremium;
                const isActive = activeKitId === kit.id;
                return (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => handleApplyKit(kit.id)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-accent',
                      isActive ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border/50',
                      locked && 'opacity-70',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-lg',
                        resolved.preview.bg,
                      )}
                    >
                      <span className={cn('text-[10px] font-bold', resolved.preview.text)}>Aa</span>
                      <span className={cn('h-1.5 w-6 rounded-full', resolved.preview.button)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">
                          {t(kit.labelKey, kit.labelFallback)}
                        </span>
                        {locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        {isActive && !locked && <Check className="h-3 w-3 shrink-0 text-primary" />}
                      </div>
                      <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                        {t(kit.descKey, kit.descFallback)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/40 pt-4">
          <p className="text-[11px] text-muted-foreground">
            {t('editor.artDirection.note', 'Блоки не удаляются и не переставляются.')}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!canApply}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('editor.artDirection.reset', 'Сбросить дизайн')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
