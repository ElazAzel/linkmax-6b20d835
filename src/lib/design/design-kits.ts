/**
 * Design Kits — Phase 7 of the design hierarchy.
 *
 * A kit pairs an art-direction recipe (section rhythm + block variants) with a
 * theme preset (palette, typography, block shape). One tap gives a page that
 * looks intentionally designed instead of "blocks with a random color".
 *
 * Deterministic: no LLM, no randomness. Kits reference existing recipes and
 * existing theme presets — nothing new is invented at runtime.
 */
import type { PageTheme } from '@/types/page';
import { getThemePreset, THEME_PRESETS } from '@/lib/appearance/presets';
import { PAGE_RECIPES, getPageRecipe, type PageRecipe } from '@/lib/design/art-direction';

export interface DesignKit {
  id: string;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  /** Art-direction recipe id (see PAGE_RECIPES). */
  recipeId: string;
  /** Theme preset id (see THEME_PRESETS). */
  themeId: string;
  /** Premium kits require a paid tier (mirrors the theme preset). */
  isPremium: boolean;
}

export const DESIGN_KITS: DesignKit[] = [
  {
    id: 'studio-paper',
    labelKey: 'design.kit.studioPaper',
    labelFallback: 'Студия на бумаге',
    descKey: 'design.kit.studioPaperDesc',
    descFallback: 'Тёплый фон, спокойный ритм, крупные заголовки',
    recipeId: 'editorial-quiet',
    themeId: 'warm-paper',
    isPremium: false,
  },
  {
    id: 'clean-service',
    labelKey: 'design.kit.cleanService',
    labelFallback: 'Чистый сервис',
    descKey: 'design.kit.cleanServiceDesc',
    descFallback: 'Белый фон, ясная структура, аккуратные карточки',
    recipeId: 'calm-portrait',
    themeId: 'clean-white',
    isPremium: false,
  },
  {
    id: 'night-bold',
    labelKey: 'design.kit.nightBold',
    labelFallback: 'Тёмный и смелый',
    descKey: 'design.kit.nightBoldDesc',
    descFallback: 'Контрастный герой, медиа на всю ширину, сильные CTA',
    recipeId: 'bold-statement',
    themeId: 'midnight',
    isPremium: false,
  },
  {
    id: 'editorial-mono',
    labelKey: 'design.kit.editorialMono',
    labelFallback: 'Редакция',
    descKey: 'design.kit.editorialMonoDesc',
    descFallback: 'Журнальная типографика и много воздуха',
    recipeId: 'editorial-quiet',
    themeId: 'editorial-mono',
    isPremium: true,
  },
  {
    id: 'noir-premium',
    labelKey: 'design.kit.noirPremium',
    labelFallback: 'Нуар и золото',
    descKey: 'design.kit.noirPremiumDesc',
    descFallback: 'Премиальный тёмный стиль с золотыми акцентами',
    recipeId: 'bold-statement',
    themeId: 'noir-gold',
    isPremium: true,
  },
  {
    id: 'soft-care',
    labelKey: 'design.kit.softCare',
    labelFallback: 'Мягкая забота',
    descKey: 'design.kit.softCareDesc',
    descFallback: 'Пастель, лёгкая сетка, портрет с наложением',
    recipeId: 'calm-portrait',
    themeId: 'blush-lavender',
    isPremium: true,
  },
];

export function getDesignKit(id?: string | null): DesignKit | undefined {
  return DESIGN_KITS.find((k) => k.id === id);
}

/** Kits visible for a tier — premium kits stay listed but are marked locked in UI. */
export function getKitsForTier(isPremium: boolean): DesignKit[] {
  return isPremium ? DESIGN_KITS : [...DESIGN_KITS].sort((a, b) => Number(a.isPremium) - Number(b.isPremium));
}

export interface ResolvedDesignKit {
  kit: DesignKit;
  recipe: PageRecipe;
  theme: Partial<PageTheme>;
  /** Tailwind preview classes coming from the theme preset. */
  preview: { bg: string; text: string; button: string };
}

/** Resolve a kit into the concrete recipe + theme patch used by the editor. */
export function resolveDesignKit(id: string): ResolvedDesignKit | undefined {
  const kit = getDesignKit(id);
  if (!kit) return undefined;
  const preset = getThemePreset(kit.themeId) ?? THEME_PRESETS[0];
  return {
    kit,
    recipe: getPageRecipe(kit.recipeId),
    theme: preset.theme,
    preview: preset.preview,
  };
}

/** Which kit (if any) matches the page's current recipe + theme preset. */
export function detectActiveKit(
  themePresetId?: string | null,
  heroComposition?: string | null,
): DesignKit | undefined {
  if (!themePresetId) return undefined;
  const recipeId = PAGE_RECIPES.find((r) => r.hero === heroComposition)?.id;
  return DESIGN_KITS.find(
    (k) => k.themeId === themePresetId && (!recipeId || k.recipeId === recipeId),
  );
}
