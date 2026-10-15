/**
 * Social platforms: labels, the hosts that identify them and URL detection.
 * One registry for the socials block renderer and its editor, so a pasted
 * link gets the right icon without the owner picking it from a list.
 */

export interface SocialPlatform {
  id: string;
  label: string;
  /** Hostnames (without www.) or URL schemes that belong to the platform. */
  hosts: string[];
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', label: 'Instagram', hosts: ['instagram.com', 'instagr.am'] },
  { id: 'telegram', label: 'Telegram', hosts: ['t.me', 'telegram.me', 'telegram.org', 'tg:'] },
  { id: 'whatsapp', label: 'WhatsApp', hosts: ['wa.me', 'whatsapp.com', 'api.whatsapp.com', 'chat.whatsapp.com', 'whatsapp:'] },
  { id: 'tiktok', label: 'TikTok', hosts: ['tiktok.com', 'vm.tiktok.com'] },
  { id: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be', 'm.youtube.com'] },
  { id: 'x', label: 'X (Twitter)', hosts: ['x.com', 'twitter.com'] },
  { id: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.me', 'fb.com', 'm.facebook.com'] },
  { id: 'linkedin', label: 'LinkedIn', hosts: ['linkedin.com', 'lnkd.in'] },
  { id: 'vk', label: 'VK', hosts: ['vk.com', 'vk.ru', 'm.vk.com'] },
  { id: 'threads', label: 'Threads', hosts: ['threads.net', 'threads.com'] },
  { id: 'pinterest', label: 'Pinterest', hosts: ['pinterest.com', 'pin.it', 'pinterest.ru'] },
  { id: 'twitch', label: 'Twitch', hosts: ['twitch.tv'] },
  { id: 'discord', label: 'Discord', hosts: ['discord.gg', 'discord.com'] },
  { id: 'github', label: 'GitHub', hosts: ['github.com'] },
  { id: 'behance', label: 'Behance', hosts: ['behance.net'] },
  { id: 'dribbble', label: 'Dribbble', hosts: ['dribbble.com'] },
  { id: 'spotify', label: 'Spotify', hosts: ['spotify.com', 'open.spotify.com'] },
  { id: 'soundcloud', label: 'SoundCloud', hosts: ['soundcloud.com'] },
  { id: 'applemusic', label: 'Apple Music', hosts: ['music.apple.com'] },
  { id: 'snapchat', label: 'Snapchat', hosts: ['snapchat.com'] },
  { id: 'reddit', label: 'Reddit', hosts: ['reddit.com'] },
  { id: 'medium', label: 'Medium', hosts: ['medium.com'] },
  { id: 'substack', label: 'Substack', hosts: ['substack.com'] },
  { id: 'viber', label: 'Viber', hosts: ['viber.com', 'viber:'] },
  { id: 'wechat', label: 'WeChat', hosts: ['wechat.com', 'weixin.qq.com'] },
  { id: 'ok', label: 'Одноклассники', hosts: ['ok.ru'] },
  { id: 'figma', label: 'Figma', hosts: ['figma.com'] },
  { id: 'twogis', label: '2GIS', hosts: ['2gis.kz', '2gis.ru', '2gis.com', 'go.2gis.com'] },
  { id: 'kaspi', label: 'Kaspi', hosts: ['kaspi.kz', 'pay.kaspi.kz'] },
  { id: 'email', label: 'Email', hosts: ['mailto:'] },
  { id: 'phone', label: 'Телефон', hosts: ['tel:'] },
  { id: 'website', label: 'Сайт', hosts: [] },
];

const BY_ID = new Map(SOCIAL_PLATFORMS.map((platform) => [platform.id, platform]));

/** Legacy ids stored by older editors, AI and templates. */
const ALIASES: Record<string, string> = {
  twitter: 'x',
  mail: 'email',
  globe: 'website',
  link: 'website',
  odnoklassniki: 'ok',
  '2gis': 'twogis',
  'apple-music': 'applemusic',
};

export function normalizePlatformId(id: string | undefined | null): string | null {
  if (!id) return null;
  const key = id.trim().toLowerCase();
  const resolved = ALIASES[key] ?? key;
  return BY_ID.has(resolved) ? resolved : null;
}

export function getSocialPlatform(id: string | undefined | null): SocialPlatform | null {
  const normalized = normalizePlatformId(id);
  return normalized ? BY_ID.get(normalized) ?? null : null;
}

/** Detects the platform from a link; null for unknown sites. */
export function detectSocialPlatform(rawUrl: string | undefined | null): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim().toLowerCase();
  if (!url) return null;

  for (const platform of SOCIAL_PLATFORMS) {
    if (platform.hosts.some((host) => host.endsWith(':') && url.startsWith(host))) return platform.id;
  }

  let host: string;
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, '');

  for (const platform of SOCIAL_PLATFORMS) {
    if (platform.hosts.some((candidate) => !candidate.endsWith(':') && (host === candidate || host.endsWith(`.${candidate}`)))) {
      return platform.id;
    }
  }
  return null;
}
