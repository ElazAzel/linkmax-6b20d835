/**
 * Third-party brand colours (DESIGN.md → Цвет). These are other companies'
 * identities, not LinkMAX tokens, so they live here and nowhere else in
 * interface code. The quality ratchet excludes this file.
 */
export const THIRD_PARTY_BRAND = {
  instagram: '#E1306C',
  facebook: '#4267B2',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  telegram: '#2AABEE',
  whatsapp: '#25D366',
  vkontakte: '#4A76A8',
  linkedin: '#0077B5',
  google: '#4285F4',
  yandex: '#FC3F1D',
  bing: '#00809D',
} as const;

/** Google "G" logo segments. */
export const GOOGLE_LOGO = {
  blue: '#4285F4',
  green: '#34A853',
  yellow: '#FBBC05',
  red: '#EA4335',
} as const;

/** QR codes must stay dark-on-light in any theme to remain scannable. */
export const QR_COLORS = { background: '#ffffff', foreground: '#000000' } as const;
