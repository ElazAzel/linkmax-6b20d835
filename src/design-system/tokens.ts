/**
 * LinkMAX V2 interface tokens (see DESIGN.md).
 *
 * The single source of truth for the LinkMAX interface: dashboard, editor
 * chrome, landing, auth. `npm run tokens:build` turns this file into
 * `src/design-system/tokens.css`; tailwind.config.ts reads the scales.
 *
 * These tokens apply only under `html.lm-app`. Pages built by users keep the
 * scoped page base in src/styles.css (`:root, .lm-page`). Author settings
 * override those defaults and are independent of the interface theme.
 *
 * Colors are HSL triplets without alpha ("20 100% 40%") so Tailwind opacity
 * modifiers (`bg-primary/10`, `border-border/60`) always produce valid CSS.
 */

export type HslTriplet = string;

export interface ColorScheme {
  /** Page background: warm paper / ink. */
  background: HslTriplet;
  foreground: HslTriplet;
  /** Raised surfaces: cards, sheets, popovers, sidebar. */
  card: HslTriplet;
  cardForeground: HslTriplet;
  popover: HslTriplet;
  popoverForeground: HslTriplet;
  /** Sunk surfaces: inputs at rest, table headers, chips, skeletons. */
  muted: HslTriplet;
  mutedForeground: HslTriplet;
  secondary: HslTriplet;
  secondaryForeground: HslTriplet;
  /** Hover / selected tint (shadcn "accent"). */
  accent: HslTriplet;
  accentForeground: HslTriplet;
  /** The one action color. */
  primary: HslTriplet;
  primaryText: HslTriplet;
  primaryForeground: HslTriplet;
  destructive: HslTriplet;
  destructiveForeground: HslTriplet;
  success: HslTriplet;
  successForeground: HslTriplet;
  warning: HslTriplet;
  warningForeground: HslTriplet;
  info: HslTriplet;
  infoForeground: HslTriplet;
  border: HslTriplet;
  input: HslTriplet;
  ring: HslTriplet;
  chart: [HslTriplet, HslTriplet, HslTriplet, HslTriplet, HslTriplet];
}

export const brand = {
  ink: '0 0% 12.1569%',
  paper: '0 0% 95.2941%',
  blue: '202.562 100% 47.451%',
  orange: '202.562 100% 47.451%',
  orangeAction: '202.562 100% 47.451%',
  sage: '0 0% 40%',
} as const;

export const colors: { light: ColorScheme; dark: ColorScheme } = {
  light: {
    background: brand.paper,
    foreground: brand.ink,
    card: '0 0% 98.4314%',
    cardForeground: brand.ink,
    popover: '0 0% 98.4314%',
    popoverForeground: brand.ink,
    muted: '0 0% 90%',
    mutedForeground: '0 0% 40%',
    secondary: '0 0% 90%',
    secondaryForeground: brand.ink,
    accent: '203 100% 93%',
    accentForeground: '203 100% 27%',
    primary: brand.blue,
    primaryText: '203 100% 32%',
    primaryForeground: brand.ink,
    destructive: '4 76% 40%',
    destructiveForeground: '0 0% 100%',
    success: '145 45% 33%',
    successForeground: '0 0% 100%',
    warning: '34 92% 32%',
    warningForeground: '0 0% 100%',
    info: '212 69% 39%',
    infoForeground: '0 0% 100%',
    border: '0 0% 85%',
    input: '0 0% 76%',
    ring: brand.blue,
    chart: ['203 100% 40%', '151 35% 38%', '260 55% 50%', '38 85% 40%', '330 40% 45%'],
  },
  dark: {
    background: '0 0% 8%',
    foreground: '0 0% 95%',
    card: '0 0% 12%',
    cardForeground: '0 0% 95%',
    popover: '0 0% 13%',
    popoverForeground: '0 0% 95%',
    muted: '0 0% 17%',
    mutedForeground: '0 0% 66%',
    secondary: '0 0% 18%',
    secondaryForeground: '0 0% 95%',
    accent: '203 45% 18%',
    accentForeground: '203 100% 78%',
    primary: '203 100% 63%',
    primaryText: '203 100% 70%',
    primaryForeground: '0 0% 8%',
    destructive: '4 90% 67%',
    destructiveForeground: '216 20% 8%',
    success: '145 45% 56%',
    successForeground: '216 20% 8%',
    warning: '36 80% 60%',
    warningForeground: '216 20% 8%',
    info: '212 80% 70%',
    infoForeground: '216 20% 8%',
    border: '214 12% 21%',
    input: '214 11% 28%',
    ring: '203 100% 63%',
    chart: ['203 100% 63%', '151 35% 60%', '260 65% 75%', '38 85% 60%', '330 55% 66%'],
  },
};

export const fonts = {
  /** Interface and headings. Covers Kazakh Cyrillic (ә ғ қ ң ө ұ ү һ і). */
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Golos Text', 'Inter', system-ui, sans-serif",
  heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Golos Text', 'Inter', system-ui, sans-serif",
  /** Numbers in tables, stats, prices: aligned columns. */
  num: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/** Control radius; Tailwind rounded-lg = this, xl = +4px, 2xl = +8px. */
export const radius = {
  control: '12px',
  card: '24px',
  sheet: '28px',
  chip: '999px',
} as const;

const shade = (alpha: number, scheme: 'light' | 'dark') =>
  scheme === 'light' ? `hsl(216 20% 8% / ${alpha})` : `hsl(0 0% 0% / ${alpha})`;

export function shadows(scheme: 'light' | 'dark'): Record<string, string> {
  const k = scheme === 'light' ? 1 : 3;
  const s = (a: number) => shade(Math.min(a * k, 0.6), scheme);
  return {
    '2xs': `0 1px 1px ${s(0.04)}`,
    xs: `0 1px 2px ${s(0.05)}`,
    sm: `0 1px 2px ${s(0.05)}, 0 2px 8px ${s(0.05)}`,
    DEFAULT: `0 1px 2px ${s(0.05)}, 0 6px 16px ${s(0.07)}`,
    md: `0 2px 4px ${s(0.05)}, 0 10px 24px ${s(0.08)}`,
    lg: `0 4px 8px ${s(0.05)}, 0 18px 40px ${s(0.1)}`,
    xl: `0 8px 16px ${s(0.06)}, 0 28px 60px ${s(0.12)}`,
    '2xl': `0 12px 24px ${s(0.08)}, 0 40px 80px ${s(0.16)}`,
  };
}

/** Spacing rhythm used in DESIGN.md (Tailwind's 4px scale covers it). */
export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 56] as const;

/** Minimum touch target on mobile. */
export const touchTarget = '44px';
