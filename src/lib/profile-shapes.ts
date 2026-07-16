/**
 * Profile customization primitives:
 *  - Avatar shapes (circle/squircle/hexagon/blob/sticker) via clip-path
 *  - Status ring colors + labels
 *  - Cover patterns (SVG data URIs) + helpers for parallax/video
 *  - Profile badges (city / status / emoji / custom)
 */

export type AvatarShape = 'circle' | 'squircle' | 'hexagon' | 'blob' | 'sticker';
export type StatusRing = 'none' | 'online' | 'busy' | 'away' | 'offline' | 'live';
export type CoverPattern = 'none' | 'dots' | 'grid' | 'waves' | 'noise' | 'topo' | 'mesh';
export type CoverHeightExt = 'small' | 'medium' | 'large' | 'xl';

export interface ProfileBadge {
  id: string;
  kind?: 'city' | 'status' | 'emoji' | 'custom';
  icon?: string; // lucide icon name (optional)
  emoji?: string; // single emoji (optional)
  label: string;
  color?: string; // token key or hex
}

export const AVATAR_SHAPES: { value: AvatarShape; label: string; isPro: boolean }[] = [
  { value: 'circle', label: 'Круг', isPro: false },
  { value: 'squircle', label: 'Скругл.', isPro: false },
  { value: 'hexagon', label: 'Гексагон', isPro: true },
  { value: 'blob', label: 'Blob', isPro: true },
  { value: 'sticker', label: 'Стикер', isPro: true },
];

/** Returns inline style to apply to an avatar wrapper to give it the chosen shape. */
export function getAvatarShapeStyle(shape: AvatarShape | undefined): React.CSSProperties {
  switch (shape) {
    case 'squircle':
      // "iOS squircle" — superellipse
      return {
        clipPath:
          "path('M 50,0 C 15,0 0,15 0,50 C 0,85 15,100 50,100 C 85,100 100,85 100,50 C 100,15 85,0 50,0 Z')",
        // fallback for browsers ignoring the path — use border-radius
        borderRadius: '28%',
      };
    case 'hexagon':
      return {
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        borderRadius: 0,
      };
    case 'blob':
      return {
        clipPath:
          "path('M50 3 C72 3 97 18 97 46 C97 74 78 97 50 97 C22 97 3 72 3 47 C3 20 28 3 50 3 Z')",
        borderRadius: '42% 58% 63% 37% / 44% 41% 59% 56%',
      };
    case 'sticker':
      return {
        borderRadius: '32%',
        boxShadow:
          '0 0 0 4px hsl(var(--background)), 0 0 0 6px hsl(var(--foreground) / 0.15), 0 10px 24px hsl(var(--foreground) / 0.18)',
      };
    case 'circle':
    default:
      return { borderRadius: '9999px' };
  }
}

export const STATUS_RINGS: {
  value: StatusRing;
  label: string;
  color: string;
  pulse?: boolean;
}[] = [
  { value: 'none', label: 'Нет', color: 'transparent' },
  { value: 'online', label: 'Онлайн', color: '#22c55e', pulse: true },
  { value: 'busy', label: 'Занят', color: '#ef4444' },
  { value: 'away', label: 'Отошёл', color: '#f59e0b' },
  { value: 'offline', label: 'Оффлайн', color: '#94a3b8' },
  { value: 'live', label: 'В эфире', color: '#ec4899', pulse: true },
];

export function getStatusRingConfig(status: StatusRing | undefined) {
  return STATUS_RINGS.find((s) => s.value === status) ?? STATUS_RINGS[0];
}

/** SVG-pattern → data URI for repeatable backgrounds. Color follows currentColor. */
export const COVER_PATTERNS: { value: CoverPattern; label: string; svg: string | null }[] = [
  { value: 'none', label: 'Нет', svg: null },
  {
    value: 'dots',
    label: 'Точки',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='2' cy='2' r='1.6' fill='#fff' fill-opacity='0.35'/></svg>`,
  },
  {
    value: 'grid',
    label: 'Сетка',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M40 0H0V40' fill='none' stroke='#fff' stroke-opacity='0.22' stroke-width='1'/></svg>`,
  },
  {
    value: 'waves',
    label: 'Волны',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='24'><path d='M0 12 Q20 0 40 12 T80 12' fill='none' stroke='#fff' stroke-opacity='0.28' stroke-width='1.5'/></svg>`,
  },
  {
    value: 'noise',
    label: 'Шум',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.18 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`,
  },
  {
    value: 'topo',
    label: 'Топо',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><g fill='none' stroke='#fff' stroke-opacity='0.22' stroke-width='1'><path d='M0 40 Q30 10 60 40 T120 40'/><path d='M0 55 Q30 25 60 55 T120 55'/><path d='M0 25 Q30 -5 60 25 T120 25'/></g></svg>`,
  },
  {
    value: 'mesh',
    label: 'Меш',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='none' stroke='#fff' stroke-opacity='0.20' stroke-width='1'><path d='M0 30 Q15 0 30 30 T60 30'/><path d='M30 0 Q0 15 30 30 T30 60'/></g></svg>`,
  },
];

export function getCoverPatternStyle(pattern: CoverPattern | undefined): React.CSSProperties {
  const entry = COVER_PATTERNS.find((p) => p.value === pattern);
  if (!entry?.svg) return {};
  const encoded = encodeURIComponent(entry.svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return {
    backgroundImage: `url("data:image/svg+xml;utf8,${encoded}")`,
    backgroundRepeat: 'repeat',
  };
}

/** cover height including new xl option (only used when we detect the field). */
export function coverHeightClass(h: string | undefined): string {
  switch (h) {
    case 'small':
      return 'h-[120px]';
    case 'large':
      return 'h-[320px]';
    case 'xl':
      return 'h-[420px]';
    case 'medium':
    default:
      return 'h-[200px]';
  }
}
