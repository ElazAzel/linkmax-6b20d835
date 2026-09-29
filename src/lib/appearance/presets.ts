/**
 * Appearance presets for public page customization (v2).
 * Extends existing PageTheme with rich, LinkMAX-tuned presets.
 * All additions are additive & backward-compatible.
 */
import type {
  BlockShape,
  BlockShadow,
  BlockHover,
  DividerStyle,
  PageTheme,
} from '@/types/page';

// ============= Themes =============

export interface ThemePreset {
  id: string;
  nameKey: string;
  descKey: string;
  isPremium: boolean;
  theme: Partial<PageTheme>;
  preview: {
    bg: string; // tailwind class
    text: string;
    button: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  // ---- Free ----
  {
    id: 'warm-paper',
    nameKey: 'themes.warmPaper',
    descKey: 'themes.warmPaperDesc',
    isPremium: false,
    theme: {
      themePreset: 'warm-paper',
      backgroundColor: 'hsl(48 27% 96%)',
      textColor: 'hsl(220 15% 12%)',
      accentColor: '#ff5701',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'manrope-inter',
      blockShape: 'rounded',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#f6f6f1]', text: 'text-[#101318]', button: 'bg-[#ff5701] text-white' },
  },
  {
    id: 'classic',
    nameKey: 'themes.classic',
    descKey: 'themes.classicDesc',
    isPremium: false,
    theme: {
      themePreset: 'classic',
      backgroundColor: 'hsl(0 0% 100%)',
      textColor: 'hsl(220 15% 12%)',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'inter-inter',
      blockShape: 'rounded',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'none',
    },
    preview: { bg: 'bg-white', text: 'text-slate-900', button: 'bg-slate-900 text-white' },
  },
  {
    id: 'editorial-mono',
    nameKey: 'themes.editorialMono',
    descKey: 'themes.editorialMonoDesc',
    isPremium: false,
    theme: {
      themePreset: 'editorial-mono',
      backgroundColor: 'hsl(40 20% 96%)',
      textColor: 'hsl(0 0% 8%)',
      accentColor: '#0d0d0d',
      buttonStyle: 'default',
      fontFamily: 'serif',
      fontPair: 'instrument-work',
      blockShape: 'sharp',
      blockShadow: 'none',
      blockHover: 'underline',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#f5f3ee]', text: 'text-[#0d0d0d]', button: 'bg-[#0d0d0d] text-[#f5f3ee]' },
  },
  {
    id: 'clean-white',
    nameKey: 'themes.cleanWhite',
    descKey: 'themes.cleanWhiteDesc',
    isPremium: false,
    theme: {
      themePreset: 'clean-white',
      backgroundColor: 'hsl(210 20% 98%)',
      textColor: 'hsl(220 25% 15%)',
      accentColor: '#3b82f6',
      buttonStyle: 'pill',
      fontFamily: 'sans',
      fontPair: 'space-dm',
      blockShape: 'pill',
      blockShadow: 'md',
      blockHover: 'scale',
      divider: 'none',
    },
    preview: { bg: 'bg-slate-50', text: 'text-slate-900', button: 'bg-blue-500 text-white' },
  },

  // ---- Premium ----
  {
    id: 'midnight',
    nameKey: 'themes.midnight',
    descKey: 'themes.midnightDesc',
    isPremium: true,
    theme: {
      themePreset: 'midnight',
      backgroundColor: 'hsl(230 30% 8%)',
      textColor: 'hsl(210 40% 96%)',
      accentColor: '#818cf8',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'space-dm',
      blockShape: 'rounded',
      blockShadow: 'glow',
      blockHover: 'glow',
      divider: 'gradient',
    },
    preview: { bg: 'bg-[#0a0a1a]', text: 'text-slate-100', button: 'bg-indigo-500 text-white' },
  },
  {
    id: 'noir-gold',
    nameKey: 'themes.noirGold',
    descKey: 'themes.noirGoldDesc',
    isPremium: true,
    theme: {
      themePreset: 'noir-gold',
      backgroundColor: 'hsl(0 0% 5%)',
      textColor: 'hsl(45 60% 85%)',
      accentColor: '#c9a84c',
      buttonStyle: 'default',
      fontFamily: 'serif',
      fontPair: 'cormorant-karla',
      blockShape: 'soft',
      blockShadow: 'lg',
      blockHover: 'lift',
      divider: 'ornament',
    },
    preview: { bg: 'bg-neutral-950', text: 'text-amber-200', button: 'bg-amber-500 text-neutral-950' },
  },
  {
    id: 'sunset-blaze',
    nameKey: 'themes.sunsetBlaze',
    descKey: 'themes.sunsetBlazeDesc',
    isPremium: true,
    theme: {
      themePreset: 'sunset-blaze',
      backgroundColor: 'linear-gradient(135deg, #ff6b35, #e84393)',
      textColor: 'hsl(0 0% 100%)',
      accentColor: '#ffffff',
      buttonStyle: 'pill',
      fontFamily: 'sans',
      fontPair: 'syne-jakarta',
      blockShape: 'pill',
      blockShadow: 'md',
      blockHover: 'scale',
      divider: 'none',
    },
    preview: { bg: 'bg-gradient-to-br from-orange-500 to-pink-500', text: 'text-white', button: 'bg-white/25 text-white' },
  },
  {
    id: 'ocean-deep',
    nameKey: 'themes.oceanDeep',
    descKey: 'themes.oceanDeepDesc',
    isPremium: true,
    theme: {
      themePreset: 'ocean-deep',
      backgroundColor: 'linear-gradient(180deg, #0c2340, #2d8a9e)',
      textColor: 'hsl(0 0% 100%)',
      accentColor: '#5cbdb9',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'manrope-inter',
      blockShape: 'rounded',
      blockShadow: 'md',
      blockHover: 'lift',
      divider: 'gradient',
    },
    preview: { bg: 'bg-gradient-to-b from-blue-950 to-teal-500', text: 'text-white', button: 'bg-teal-300 text-blue-950' },
  },
  {
    id: 'forest-moss',
    nameKey: 'themes.forestMoss',
    descKey: 'themes.forestMossDesc',
    isPremium: true,
    theme: {
      themePreset: 'forest-moss',
      backgroundColor: 'hsl(150 30% 10%)',
      textColor: 'hsl(120 40% 88%)',
      accentColor: '#a0c49d',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'urbanist-epilogue',
      blockShape: 'soft',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'ornament',
    },
    preview: { bg: 'bg-emerald-950', text: 'text-emerald-200', button: 'bg-emerald-500 text-emerald-950' },
  },
  {
    id: 'blush-lavender',
    nameKey: 'themes.blushLavender',
    descKey: 'themes.blushLavenderDesc',
    isPremium: true,
    theme: {
      themePreset: 'blush-lavender',
      backgroundColor: 'linear-gradient(180deg, #f8e8ee, #e8c5d0)',
      textColor: 'hsl(320 40% 20%)',
      accentColor: '#9b72cf',
      buttonStyle: 'pill',
      fontFamily: 'serif',
      fontPair: 'cormorant-karla',
      blockShape: 'squircle',
      blockShadow: 'sm',
      blockHover: 'scale',
      divider: 'hairline',
    },
    preview: { bg: 'bg-pink-100', text: 'text-purple-900', button: 'bg-purple-500 text-white' },
  },
  {
    id: 'terracotta-sage',
    nameKey: 'themes.terracottaSage',
    descKey: 'themes.terracottaSageDesc',
    isPremium: true,
    theme: {
      themePreset: 'terracotta-sage',
      backgroundColor: 'hsl(30 40% 92%)',
      textColor: 'hsl(20 30% 20%)',
      accentColor: '#c4654a',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'outfit-figtree',
      blockShape: 'soft',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-orange-50', text: 'text-orange-950', button: 'bg-orange-600 text-white' },
  },
  {
    id: 'neon-mint',
    nameKey: 'themes.neonMint',
    descKey: 'themes.neonMintDesc',
    isPremium: true,
    theme: {
      themePreset: 'neon-mint',
      backgroundColor: 'hsl(220 30% 6%)',
      textColor: 'hsl(160 80% 85%)',
      accentColor: '#2dd4a8',
      buttonStyle: 'pill',
      fontFamily: 'mono',
      fontPair: 'jetbrains-work',
      blockShape: 'pill',
      blockShadow: 'glow',
      blockHover: 'glow',
      divider: 'gradient',
    },
    preview: { bg: 'bg-slate-950', text: 'text-emerald-300', button: 'bg-emerald-400 text-slate-950' },
  },
  {
    id: 'brutalist-pop',
    nameKey: 'themes.brutalistPop',
    descKey: 'themes.brutalistPopDesc',
    isPremium: true,
    theme: {
      themePreset: 'brutalist-pop',
      backgroundColor: 'hsl(0 0% 100%)',
      textColor: 'hsl(0 0% 5%)',
      accentColor: '#ff5722',
      buttonStyle: 'default',
      fontFamily: 'sans',
      fontPair: 'archivo-hind',
      blockShape: 'sharp',
      blockShadow: 'lg',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-white border-2 border-black', text: 'text-black', button: 'bg-black text-white' },
  },
  {
    id: 'sand-dune',
    nameKey: 'themes.sandDune',
    descKey: 'themes.sandDuneDesc',
    isPremium: false,
    theme: {
      themePreset: 'sand-dune',
      backgroundColor: 'hsl(36 38% 92%)',
      textColor: 'hsl(24 25% 15%)',
      accentColor: '#b5651d',
      buttonStyle: 'pill',
      fontFamily: 'sans',
      fontPair: 'outfit-figtree',
      blockShape: 'soft',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#f1e9dc]', text: 'text-[#2e241c]', button: 'bg-[#b5651d] text-white' },
  },
  {
    id: 'sky-clean',
    nameKey: 'themes.skyClean',
    descKey: 'themes.skyCleanDesc',
    isPremium: false,
    theme: {
      themePreset: 'sky-clean',
      backgroundColor: 'hsl(205 60% 96%)',
      textColor: 'hsl(215 40% 14%)',
      accentColor: '#1e6fd9',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'manrope-inter',
      blockShape: 'rounded',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'none',
    },
    preview: { bg: 'bg-[#eef6fc]', text: 'text-[#14223a]', button: 'bg-[#1e6fd9] text-white' },
  },
  {
    id: 'matcha',
    nameKey: 'themes.matcha',
    descKey: 'themes.matchaDesc',
    isPremium: false,
    theme: {
      themePreset: 'matcha',
      backgroundColor: 'hsl(90 25% 93%)',
      textColor: 'hsl(120 20% 14%)',
      accentColor: '#4f7a3a',
      buttonStyle: 'pill',
      fontFamily: 'sans',
      fontPair: 'urbanist-epilogue',
      blockShape: 'soft',
      blockShadow: 'none',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#ebf0e4]', text: 'text-[#1d2b1d]', button: 'bg-[#4f7a3a] text-white' },
  },
  {
    id: 'graphite',
    nameKey: 'themes.graphite',
    descKey: 'themes.graphiteDesc',
    isPremium: false,
    theme: {
      themePreset: 'graphite',
      backgroundColor: 'hsl(220 10% 11%)',
      textColor: 'hsl(0 0% 94%)',
      accentColor: '#f5f5f5',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'inter-inter',
      blockShape: 'rounded',
      blockShadow: 'none',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#1a1c20]', text: 'text-neutral-100', button: 'bg-white text-black' },
  },
  {
    id: 'rose-quartz',
    nameKey: 'themes.roseQuartz',
    descKey: 'themes.roseQuartzDesc',
    isPremium: true,
    theme: {
      themePreset: 'rose-quartz',
      backgroundColor: 'hsl(350 60% 95%)',
      textColor: 'hsl(340 30% 20%)',
      accentColor: '#d6457a',
      buttonStyle: 'pill',
      fontFamily: 'serif',
      fontPair: 'cormorant-karla',
      blockShape: 'pill',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#fbeef1]', text: 'text-[#44202e]', button: 'bg-[#d6457a] text-white' },
  },
  {
    id: 'espresso',
    nameKey: 'themes.espresso',
    descKey: 'themes.espressoDesc',
    isPremium: true,
    theme: {
      themePreset: 'espresso',
      backgroundColor: 'hsl(25 25% 12%)',
      textColor: 'hsl(35 40% 88%)',
      accentColor: '#d99a5b',
      buttonStyle: 'rounded',
      fontFamily: 'serif',
      fontPair: 'instrument-work',
      blockShape: 'soft',
      blockShadow: 'md',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#261c16]', text: 'text-[#ecdcc7]', button: 'bg-[#d99a5b] text-[#261c16]' },
  },
  {
    id: 'electric-violet',
    nameKey: 'themes.electricViolet',
    descKey: 'themes.electricVioletDesc',
    isPremium: true,
    theme: {
      themePreset: 'electric-violet',
      backgroundColor: 'hsl(255 40% 10%)',
      textColor: 'hsl(0 0% 98%)',
      accentColor: '#8b5cf6',
      buttonStyle: 'pill',
      fontFamily: 'sans',
      fontPair: 'syne-jakarta',
      blockShape: 'pill',
      blockShadow: 'glow',
      blockHover: 'glow',
      divider: 'gradient',
    },
    preview: { bg: 'bg-[#16102a]', text: 'text-white', button: 'bg-violet-500 text-white' },
  },
  {
    id: 'lemon-pop',
    nameKey: 'themes.lemonPop',
    descKey: 'themes.lemonPopDesc',
    isPremium: true,
    theme: {
      themePreset: 'lemon-pop',
      backgroundColor: 'hsl(54 100% 88%)',
      textColor: 'hsl(0 0% 6%)',
      accentColor: '#111111',
      buttonStyle: 'default',
      fontFamily: 'sans',
      fontPair: 'archivo-hind',
      blockShape: 'sharp',
      blockShadow: 'lg',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#fff7c2]', text: 'text-black', button: 'bg-black text-[#fff7c2]' },
  },
  {
    id: 'arctic',
    nameKey: 'themes.arctic',
    descKey: 'themes.arcticDesc',
    isPremium: true,
    theme: {
      themePreset: 'arctic',
      backgroundColor: 'hsl(200 20% 98%)',
      textColor: 'hsl(210 30% 18%)',
      accentColor: '#0ea5b7',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
      fontPair: 'space-dm',
      blockShape: 'rounded',
      blockShadow: 'md',
      blockHover: 'lift',
      divider: 'none',
    },
    preview: { bg: 'bg-[#f8fafb]', text: 'text-[#1f2d3a]', button: 'bg-[#0ea5b7] text-white' },
  },
  {
    id: 'burgundy',
    nameKey: 'themes.burgundy',
    descKey: 'themes.burgundyDesc',
    isPremium: true,
    theme: {
      themePreset: 'burgundy',
      backgroundColor: 'hsl(345 45% 16%)',
      textColor: 'hsl(30 40% 92%)',
      accentColor: '#e8b86d',
      buttonStyle: 'rounded',
      fontFamily: 'serif',
      fontPair: 'cormorant-karla',
      blockShape: 'soft',
      blockShadow: 'md',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#3b1520]', text: 'text-[#f3e9dc]', button: 'bg-[#e8b86d] text-[#3b1520]' },
  },
  {
    id: 'kazakh-steppe',
    nameKey: 'themes.kazakhSteppe',
    descKey: 'themes.kazakhSteppeDesc',
    isPremium: true,
    theme: {
      themePreset: 'kazakh-steppe',
      backgroundColor: 'hsl(190 45% 94%)',
      textColor: 'hsl(200 50% 14%)',
      accentColor: '#c9a227',
      buttonStyle: 'pill',
      fontFamily: 'sans',
      fontPair: 'outfit-figtree',
      blockShape: 'rounded',
      blockShadow: 'sm',
      blockHover: 'lift',
      divider: 'gradient',
    },
    preview: { bg: 'bg-[#e8f4f7]', text: 'text-[#12303a]', button: 'bg-[#00a3c4] text-white' },
  },
  {
    id: 'paper-ink',
    nameKey: 'themes.paperInk',
    descKey: 'themes.paperInkDesc',
    isPremium: true,
    theme: {
      themePreset: 'paper-ink',
      backgroundColor: 'hsl(45 30% 95%)',
      textColor: 'hsl(230 30% 12%)',
      accentColor: '#1d3a8a',
      buttonStyle: 'default',
      fontFamily: 'serif',
      fontPair: 'instrument-work',
      blockShape: 'sharp',
      blockShadow: 'none',
      blockHover: 'lift',
      divider: 'hairline',
    },
    preview: { bg: 'bg-[#f7f4ea]', text: 'text-[#161b30]', button: 'bg-[#1d3a8a] text-white' },
  },
];

// ============= Gradient presets =============

export interface GradientPreset {
  id: string;
  name: string;
  css: string; // used directly as backgroundColor: linear-gradient(...)
  colors: string[]; // stored in PageBackground.value as "c1,c2"
  angle: number;
  isPremium: boolean;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset', name: 'Sunset', colors: ['#ff6b35', '#e84393'], angle: 135, isPremium: false, css: 'linear-gradient(135deg,#ff6b35,#e84393)' },
  { id: 'ocean', name: 'Ocean', colors: ['#0c2340', '#2d8a9e'], angle: 180, isPremium: false, css: 'linear-gradient(180deg,#0c2340,#2d8a9e)' },
  { id: 'peach', name: 'Peach', colors: ['#fecaca', '#f9a8a8'], angle: 135, isPremium: false, css: 'linear-gradient(135deg,#fecaca,#f9a8a8)' },
  { id: 'mint', name: 'Mint', colors: ['#a7f3d0', '#5eead4'], angle: 135, isPremium: false, css: 'linear-gradient(135deg,#a7f3d0,#5eead4)' },
  { id: 'lavender', name: 'Lavender', colors: ['#e0e7ff', '#c7d2fe'], angle: 135, isPremium: true, css: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)' },
  { id: 'aurora', name: 'Aurora', colors: ['#4ade80', '#a78bfa', '#38bdf8'], angle: 135, isPremium: true, css: 'linear-gradient(135deg,#4ade80,#a78bfa,#38bdf8)' },
  { id: 'fire', name: 'Fire', colors: ['#f97316', '#ef4444', '#b91c1c'], angle: 180, isPremium: true, css: 'linear-gradient(180deg,#f97316,#ef4444,#b91c1c)' },
  { id: 'sky', name: 'Sky', colors: ['#38bdf8', '#818cf8'], angle: 180, isPremium: true, css: 'linear-gradient(180deg,#38bdf8,#818cf8)' },
  { id: 'nebula', name: 'Nebula', colors: ['#1e1b4b', '#7c3aed', '#ec4899'], angle: 135, isPremium: true, css: 'linear-gradient(135deg,#1e1b4b,#7c3aed,#ec4899)' },
  { id: 'gold', name: 'Gold', colors: ['#fef3c7', '#f59e0b'], angle: 135, isPremium: true, css: 'linear-gradient(135deg,#fef3c7,#f59e0b)' },
  { id: 'noir', name: 'Noir', colors: ['#111', '#333'], angle: 135, isPremium: true, css: 'linear-gradient(135deg,#111,#333)' },
  { id: 'paper', name: 'Paper', colors: ['#f6f6f1', '#e8e4dd'], angle: 180, isPremium: false, css: 'linear-gradient(180deg,#f6f6f1,#e8e4dd)' },
];

// ============= Pattern presets (SVG data-URI, CSS-only) =============

export type PatternId = 'dots' | 'grid' | 'waves' | 'noise' | 'topo' | 'mesh';

export interface PatternPreset {
  id: PatternId;
  name: string;
  isPremium: boolean;
  cssClass: string; // .lm-pattern-<id>
}

export const PATTERN_PRESETS: PatternPreset[] = [
  { id: 'dots', name: 'Dots', isPremium: false, cssClass: 'lm-pattern-dots' },
  { id: 'grid', name: 'Grid', isPremium: false, cssClass: 'lm-pattern-grid' },
  { id: 'waves', name: 'Waves', isPremium: true, cssClass: 'lm-pattern-waves' },
  { id: 'noise', name: 'Noise', isPremium: true, cssClass: 'lm-pattern-noise' },
  { id: 'topo', name: 'Topo', isPremium: true, cssClass: 'lm-pattern-topo' },
  { id: 'mesh', name: 'Mesh', isPremium: true, cssClass: 'lm-pattern-mesh' },
];

// ============= Font pairs =============

export interface FontPairPreset {
  id: string;
  name: string;
  heading: string;
  body: string;
  isPremium: boolean;
}

// Most display families below have no Cyrillic glyphs. 'Inter' (loaded
// globally, full Cyrillic) is the second family so Russian/Kazakh text keeps
// a designed typeface instead of falling back to a random system font.
export const FONT_PAIR_PRESETS: FontPairPreset[] = [
  { id: 'manrope-inter', name: 'Manrope + Inter', heading: "'Manrope', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", isPremium: false },
  { id: 'inter-inter', name: 'Inter', heading: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", isPremium: false },
  { id: 'space-dm', name: 'Space Grotesk + DM Sans', heading: "'Space Grotesk', 'Inter', system-ui, sans-serif", body: "'DM Sans', 'Inter', system-ui, sans-serif", isPremium: false },
  { id: 'instrument-work', name: 'Instrument Serif + Work Sans', heading: "'Instrument Serif', ui-serif, serif", body: "'Work Sans', 'Inter', system-ui, sans-serif", isPremium: true },
  { id: 'cormorant-karla', name: 'Cormorant + Karla', heading: "'Cormorant Garamond', ui-serif, serif", body: "'Karla', 'Inter', system-ui, sans-serif", isPremium: true },
  { id: 'syne-jakarta', name: 'Syne + Plus Jakarta', heading: "'Syne', 'Inter', system-ui, sans-serif", body: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", isPremium: true },
  { id: 'urbanist-epilogue', name: 'Urbanist + Epilogue', heading: "'Urbanist', 'Inter', system-ui, sans-serif", body: "'Epilogue', 'Inter', system-ui, sans-serif", isPremium: true },
  { id: 'outfit-figtree', name: 'Outfit + Figtree', heading: "'Outfit', 'Inter', system-ui, sans-serif", body: "'Figtree', 'Inter', system-ui, sans-serif", isPremium: true },
  { id: 'jetbrains-work', name: 'JetBrains Mono + Work Sans', heading: "'JetBrains Mono', ui-monospace, monospace", body: "'Work Sans', 'Inter', system-ui, sans-serif", isPremium: true },
  { id: 'archivo-hind', name: 'Archivo Black + Hind', heading: "'Archivo Black', 'Inter', system-ui, sans-serif", body: "'Hind', 'Inter', system-ui, sans-serif", isPremium: true },
];

// ============= Block shape / shadow / hover / divider =============

export interface Preset<T extends string> {
  id: T;
  name: string;
  isPremium: boolean;
}

/** Shape of Button/Link blocks (theme.buttonStyle → --lm-button-radius). */
export type ButtonStyle = 'default' | 'rounded' | 'pill' | 'gradient';
export const BUTTON_STYLE_PRESETS: Preset<ButtonStyle>[] = [
  { id: 'default', name: 'Square', isPremium: false },
  { id: 'rounded', name: 'Rounded', isPremium: false },
  { id: 'pill', name: 'Pill', isPremium: false },
  { id: 'gradient', name: 'Gradient', isPremium: false },
];

export const BLOCK_SHAPE_PRESETS: Preset<BlockShape>[] = [
  { id: 'sharp', name: 'Sharp', isPremium: false },
  { id: 'soft', name: 'Soft', isPremium: false },
  { id: 'rounded', name: 'Rounded', isPremium: false },
  { id: 'pill', name: 'Pill', isPremium: false },
  { id: 'ticket', name: 'Ticket', isPremium: true },
  { id: 'squircle', name: 'Squircle', isPremium: true },
];

export const BLOCK_SHADOW_PRESETS: Preset<BlockShadow>[] = [
  { id: 'none', name: 'None', isPremium: false },
  { id: 'sm', name: 'Soft', isPremium: false },
  { id: 'md', name: 'Medium', isPremium: false },
  { id: 'lg', name: 'Deep', isPremium: false },
  { id: 'glow', name: 'Glow', isPremium: true },
  { id: 'inner', name: 'Inner', isPremium: true },
];

export const BLOCK_HOVER_PRESETS: Preset<BlockHover>[] = [
  { id: 'none', name: 'None', isPremium: false },
  { id: 'lift', name: 'Lift', isPremium: false },
  { id: 'scale', name: 'Scale', isPremium: false },
  { id: 'underline', name: 'Underline', isPremium: false },
  { id: 'glow', name: 'Glow', isPremium: true },
];

export const DIVIDER_PRESETS: Preset<DividerStyle>[] = [
  { id: 'none', name: 'None', isPremium: false },
  { id: 'hairline', name: 'Hairline', isPremium: false },
  { id: 'dotted', name: 'Dotted', isPremium: false },
  { id: 'gradient', name: 'Gradient', isPremium: true },
  { id: 'ornament', name: 'Ornament', isPremium: true },
];

// Block shape → CSS radius
export const BLOCK_SHAPE_RADIUS: Record<BlockShape, string> = {
  sharp: '0px',
  soft: '8px',
  rounded: '16px',
  pill: '9999px',
  ticket: '20px 20px 4px 4px',
  squircle: '28px',
};

export const BLOCK_SHADOW_CSS: Record<BlockShadow, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0,0,0,.06), 0 1px 3px 0 rgba(0,0,0,.08)',
  md: '0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.05)',
  lg: '0 20px 25px -5px rgba(0,0,0,.12), 0 10px 10px -5px rgba(0,0,0,.06)',
  glow: '0 0 24px hsl(var(--primary) / 0.35), 0 0 60px hsl(var(--primary) / 0.15)',
  inner: 'inset 0 2px 4px 0 rgba(0,0,0,.08)',
};

export function getFontPair(id?: string): FontPairPreset {
  return FONT_PAIR_PRESETS.find(p => p.id === id) ?? FONT_PAIR_PRESETS[0];
}

export function getThemePreset(id?: string): ThemePreset | undefined {
  return THEME_PRESETS.find(t => t.id === id);
}
