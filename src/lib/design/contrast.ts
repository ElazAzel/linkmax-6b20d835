/**
 * Contrast utilities (Phase 10 of the design hierarchy).
 *
 * Deterministic WCAG 2.1 contrast math — no LLM, no guessing. Used by the
 * design-health audit to catch themes where text is unreadable on the page
 * background (the single most common "my page looks broken" complaint).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse `#rgb`, `#rrggbb`, `rgb()/rgba()` and `hsl()/hsla()` (incl. space syntax). */
export function parseColor(input?: string | null): Rgb | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    return null;
  }

  const nums = value
    .replace(/^[a-z]+\(/, '')
    .replace(/\)$/, '')
    .split(/[\s,/]+/)
    .filter(Boolean);

  if (value.startsWith('rgb')) {
    const [r, g, b] = nums.map((n) => Number.parseFloat(n));
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  if (value.startsWith('hsl')) {
    const h = Number.parseFloat(nums[0]);
    const s = Number.parseFloat(nums[1]) / 100;
    const l = Number.parseFloat(nums[2]) / 100;
    if ([h, s, l].some((n) => Number.isNaN(n))) return null;
    return hslToRgb(h, s, l);
  }

  return null;
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio (1..21). Returns null when a color cannot be parsed. */
export function contrastRatio(a?: string | null, b?: string | null): number | null {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return null;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/** Body text needs 4.5:1 (WCAG AA); large display text needs 3:1. */
export const AA_BODY = 4.5;
export const AA_LARGE = 3;

/** Pick black or white — whichever reads better on `background`. */
export function readableTextColor(background?: string | null): string {
  const rgb = parseColor(background);
  if (!rgb) return '#111111';
  return relativeLuminance(rgb) > 0.42 ? '#111111' : '#ffffff';
}
