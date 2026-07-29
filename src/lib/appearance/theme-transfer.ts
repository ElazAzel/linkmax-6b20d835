import type { PageBackground, PageTheme } from '@/types/page';
import {
  BLOCK_HOVER_PRESETS,
  BLOCK_SHADOW_PRESETS,
  BLOCK_SHAPE_PRESETS,
  DIVIDER_PRESETS,
  FONT_PAIR_PRESETS,
  PATTERN_PRESETS,
  THEME_PRESETS,
} from './presets';

export const THEME_TRANSFER_VERSION = 2;
const LEGACY_THEME_TRANSFER_VERSION = 1;

export interface ThemeTransferPayload {
  version: typeof THEME_TRANSFER_VERSION | typeof LEGACY_THEME_TRANSFER_VERSION;
  theme: Partial<PageTheme>;
}

const COLOR_FIELDS = [
  'backgroundColor',
  'backgroundGradient',
  'textColor',
  'accentColor',
  'accentButton',
  'accentLink',
  'accentActive',
] as const;

const isSafeCssValue = (value: unknown): value is string =>
  typeof value === 'string'
  && value.length <= 240
  && !/[;{}<>]/.test(value);

const isOneOf = <T extends string>(value: unknown, allowed: readonly { id: T }[]): value is T =>
  typeof value === 'string' && allowed.some((item) => item.id === value);

function sanitizeBackground(value: unknown): PageBackground | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  if (!['solid', 'gradient', 'image', 'pattern'].includes(String(candidate.type)) || !isSafeCssValue(candidate.value)) {
    return undefined;
  }

  if (candidate.type === 'image' && !/^https:\/\//i.test(candidate.value)) return undefined;
  if (candidate.type === 'pattern' && !isOneOf(candidate.value, PATTERN_PRESETS)) return undefined;

  const background: PageBackground = {
    type: candidate.type as PageBackground['type'],
    value: candidate.value,
  };
  if (typeof candidate.gradientAngle === 'number' && candidate.gradientAngle >= 0 && candidate.gradientAngle <= 360) background.gradientAngle = candidate.gradientAngle;
  if (isSafeCssValue(candidate.overlay)) background.overlay = candidate.overlay;
  if (typeof candidate.overlayOpacity === 'number' && candidate.overlayOpacity >= 0 && candidate.overlayOpacity <= 80) background.overlayOpacity = candidate.overlayOpacity;
  if (isSafeCssValue(candidate.patternColor)) background.patternColor = candidate.patternColor;
  if (typeof candidate.patternScale === 'number' && candidate.patternScale >= 0.5 && candidate.patternScale <= 3) background.patternScale = candidate.patternScale;
  if (typeof candidate.blur === 'number' && candidate.blur >= 0 && candidate.blur <= 20) background.blur = candidate.blur;
  if (candidate.behavior === 'scroll' || candidate.behavior === 'fixed') background.behavior = candidate.behavior;
  return background;
}

function sanitizeSemanticColors(value: unknown): PageTheme['colors'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const keys: Array<keyof NonNullable<PageTheme['colors']>> = [
    'canvas', 'surface', 'text', 'mutedText', 'primary', 'primaryText',
    'secondary', 'border', 'focus', 'success', 'warning', 'danger',
  ];
  const colors = {} as NonNullable<PageTheme['colors']>;
  for (const key of keys) {
    if (!isSafeCssValue(candidate[key])) return undefined;
    colors[key] = candidate[key];
  }
  return colors;
}

function sanitizeTypography(value: unknown): PageTheme['typography'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    !isSafeCssValue(candidate.headingFamily)
    || !isSafeCssValue(candidate.bodyFamily)
    || !isSafeCssValue(candidate.monoFamily)
    || ![500, 600, 700].includes(Number(candidate.headingWeight))
    || ![400, 500, 600].includes(Number(candidate.bodyWeight))
    || !['compact', 'balanced', 'expressive'].includes(String(candidate.scale))
  ) return undefined;
  return {
    headingFamily: candidate.headingFamily,
    bodyFamily: candidate.bodyFamily,
    monoFamily: candidate.monoFamily,
    headingWeight: candidate.headingWeight as 500 | 600 | 700,
    bodyWeight: candidate.bodyWeight as 400 | 500 | 600,
    scale: candidate.scale as NonNullable<PageTheme['typography']>['scale'],
  };
}

function sanitizeRadii(value: unknown): PageTheme['radii'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const read = (key: string) => typeof candidate[key] === 'number' && candidate[key] >= 0 && candidate[key] <= 48
    ? candidate[key] as number
    : null;
  const control = read('control');
  const card = read('card');
  const block = read('block');
  const image = read('image');
  return control === null || card === null || block === null || image === null
    ? undefined
    : { control, card, block, image };
}

function sanitizeSpacing(value: unknown): PageTheme['spacing'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (!['compact', 'comfortable', 'spacious'].includes(String(candidate.density))) return undefined;
  const isValid = (key: string, max: number) =>
    typeof candidate[key] === 'number' && candidate[key] >= 0 && candidate[key] <= max;
  if (!isValid('sectionGap', 160) || !isValid('blockGap', 64) || !isValid('pagePadding', 64)) return undefined;
  return {
    density: candidate.density as NonNullable<PageTheme['spacing']>['density'],
    sectionGap: candidate.sectionGap as number,
    blockGap: candidate.blockGap as number,
    pagePadding: candidate.pagePadding as number,
  };
}

export function sanitizeTheme(theme: unknown): Partial<PageTheme> | null {
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) return null;
  const candidate = theme as Record<string, unknown>;
  const sanitized: Partial<PageTheme> = {};

  if (candidate.schemaVersion === 2) sanitized.schemaVersion = 2;
  if (candidate.appearanceMode === 'legacy' || candidate.appearanceMode === 'v2') sanitized.appearanceMode = candidate.appearanceMode;
  for (const field of COLOR_FIELDS) {
    if (isSafeCssValue(candidate[field])) sanitized[field] = candidate[field];
  }
  if (candidate.buttonStyle === 'default' || candidate.buttonStyle === 'rounded' || candidate.buttonStyle === 'pill' || candidate.buttonStyle === 'gradient') sanitized.buttonStyle = candidate.buttonStyle;
  if (candidate.fontFamily === 'sans' || candidate.fontFamily === 'serif' || candidate.fontFamily === 'mono') sanitized.fontFamily = candidate.fontFamily;
  if (candidate.iconStyle === 'rounded' || candidate.iconStyle === 'square' || candidate.iconStyle === 'duotone') sanitized.iconStyle = candidate.iconStyle;
  if (candidate.animationStyle === 'none' || candidate.animationStyle === 'gentle' || candidate.animationStyle === 'energetic') sanitized.animationStyle = candidate.animationStyle;
  if (typeof candidate.darkMode === 'boolean') sanitized.darkMode = candidate.darkMode;
  if (isOneOf(candidate.fontPair, FONT_PAIR_PRESETS)) sanitized.fontPair = candidate.fontPair;
  if (isOneOf(candidate.blockShape, BLOCK_SHAPE_PRESETS)) sanitized.blockShape = candidate.blockShape;
  if (isOneOf(candidate.blockShadow, BLOCK_SHADOW_PRESETS)) sanitized.blockShadow = candidate.blockShadow;
  if (isOneOf(candidate.blockHover, BLOCK_HOVER_PRESETS)) sanitized.blockHover = candidate.blockHover;
  if (isOneOf(candidate.divider, DIVIDER_PRESETS)) sanitized.divider = candidate.divider;
  if (isOneOf(candidate.themePreset, THEME_PRESETS)) sanitized.themePreset = candidate.themePreset;
  const colors = sanitizeSemanticColors(candidate.colors);
  if (colors) sanitized.colors = colors;
  const typography = sanitizeTypography(candidate.typography);
  if (typography) sanitized.typography = typography;
  const radii = sanitizeRadii(candidate.radii);
  if (radii) sanitized.radii = radii;
  const spacing = sanitizeSpacing(candidate.spacing);
  if (spacing) sanitized.spacing = spacing;
  if (candidate.imageTreatment === 'natural' || candidate.imageTreatment === 'editorial' || candidate.imageTreatment === 'monochrome') sanitized.imageTreatment = candidate.imageTreatment;
  if (candidate.buttonWeight === 500 || candidate.buttonWeight === 600 || candidate.buttonWeight === 700) sanitized.buttonWeight = candidate.buttonWeight;
  if (candidate.motionLevel === 'none' || candidate.motionLevel === 'reduced' || candidate.motionLevel === 'standard' || candidate.motionLevel === 'expressive') sanitized.motionLevel = candidate.motionLevel;

  const background = sanitizeBackground(candidate.customBackground);
  if (background) sanitized.customBackground = background;
  return sanitized;
}

export function createThemeTransfer(theme: Partial<PageTheme>): ThemeTransferPayload {
  return { version: THEME_TRANSFER_VERSION, theme: sanitizeTheme(theme) ?? {} };
}

export function parseThemeTransfer(value: unknown): Partial<PageTheme> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const payload = value as Partial<ThemeTransferPayload>;
  if (payload.version !== THEME_TRANSFER_VERSION && payload.version !== LEGACY_THEME_TRANSFER_VERSION) return null;
  return sanitizeTheme(payload.theme);
}
