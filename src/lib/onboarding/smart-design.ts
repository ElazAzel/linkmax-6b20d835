import type { PageTheme } from '@/types/page';
import type { Niche } from '@/lib/niches';
import { getContrastForeground } from '@/lib/appearance/style-utils';

export type BuilderStyle = 'auto' | 'bold' | 'editorial' | 'soft';
export interface SmartPageTheme extends PageTheme {
  schemaVersion: 2;
  appearanceMode: 'v2';
  colors: { canvas: string; surface: string; text: string; mutedText: string; primary: string; primaryText: string; secondary: string; border: string; focus: string };
  typography: { headingFamily: string; bodyFamily: string; monoFamily: string; headingWeight: number; bodyWeight: number; scale: string };
  spacing: { pagePadding: number; blockGap: number; sectionGap: number; density: string };
  radii: { block: number; card: number; control: number; image: number };
}

// Hand-tuned palettes use hex values so contrast checks are reproducible offline.
const PALETTES = {
  rose: ['#fff1f5', '#ffffff', '#35192b', '#6e4b60', '#a42565', '#e7cbd8'],
  ink: ['#0c101b', '#171e2c', '#f3f5ff', '#b1b9ce', '#9daeff', '#333e56'],
  citrus: ['#14221a', '#213027', '#f5ffe9', '#c0cdb6', '#d1ef76', '#40543e'],
  paper: ['#fff6e9', '#fffcf6', '#382416', '#735d49', '#a84019', '#e3d3bd'],
  mint: ['#eef6f0', '#ffffff', '#1b3528', '#506657', '#286744', '#ccded0'],
  blue: ['#eef3ff', '#ffffff', '#172949', '#526381', '#3156b8', '#ccd7ee'],
  plum: ['#201320', '#301e30', '#fff1fb', '#d1b6cc', '#f1a8d9', '#573b51'],
} as const;
const NICHE_PALETTE: Record<Niche, keyof typeof PALETTES> = {
  expert: 'blue', education: 'mint', business: 'blue', fitness: 'citrus', health: 'mint', beauty: 'rose', art: 'paper', food: 'paper', music: 'ink', tech: 'ink', fashion: 'plum', travel: 'mint', realestate: 'blue', events: 'rose', services: 'blue', other: 'paper',
};

/** Palette, typography and spacing are selected together, never randomly mixed. */
export function resolveSmartDesign(niche: Niche, style: BuilderStyle = 'auto') {
  const key = style === 'bold' ? 'ink' : style === 'editorial' ? 'paper' : style === 'soft' ? 'rose' : NICHE_PALETTE[niche];
  const [canvas, surface, text, mutedText, primary, border] = PALETTES[key];
  const dark = ['ink', 'citrus', 'plum'].includes(key);
  const editorial = style === 'editorial' || (style === 'auto' && ['art', 'food', 'travel'].includes(niche));
  const recipeId = editorial ? 'editorial-quiet' : dark ? 'bold-statement' : 'calm-portrait';
  const theme: SmartPageTheme = {
    schemaVersion: 2, appearanceMode: 'v2', themePreset: dark ? 'graphite' : editorial ? 'warm-paper' : 'classic',
    backgroundColor: canvas, backgroundGradient: '', customBackground: undefined,
    textColor: text, accentColor: primary, accentButton: primary, accentLink: primary, accentActive: primary,
    buttonStyle: 'rounded', fontFamily: 'sans', fontPair: editorial ? 'manrope-inter' : 'space-dm',
    iconStyle: 'rounded', animationStyle: 'gentle', darkMode: dark,
    blockShape: 'rounded', blockShadow: 'none', blockHover: 'lift', divider: 'none',
    colors: { canvas, surface, text, mutedText, primary, primaryText: getContrastForeground(primary), secondary: primary, border, focus: primary },
    typography: { headingFamily: editorial ? 'Manrope' : 'Onest', bodyFamily: editorial ? 'Inter' : 'Golos Text', monoFamily: 'JetBrains Mono', headingWeight: 700, bodyWeight: 400, scale: 'balanced' },
    spacing: { pagePadding: 20, blockGap: 18, sectionGap: 36, density: 'comfortable' },
    radii: { block: 20, card: 20, control: 12, image: 16 },
  };
  return { theme, recipeId, cover: `/builder/covers/${key}.svg` };
}
