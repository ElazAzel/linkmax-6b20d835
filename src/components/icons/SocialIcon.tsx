import { memo, useState } from 'react';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import { BRAND_ICONS } from '@/lib/social/brand-icon-data';
import { extractDomain, getGoogleFaviconUrl } from '@/lib/favicon-utils';
import { cn } from '@/lib/utils/utils';

/** lucide fallbacks for platforms Simple Icons does not ship. */
const LUCIDE_GLYPHS = {
  linkedin: Linkedin,
  email: Mail,
  phone: Phone,
  twogis: MapPin,
  website: Globe,
} as const;

/** Official LinkedIn blue; not part of Simple Icons (removed at LinkedIn's request). */
const EXTRA_BRAND_COLORS: Record<string, string> = { linkedin: '0A66C2', twogis: '19AA1E', kaspi: 'F14635' };

export function getBrandColor(platformId: string | null): string | null {
  if (!platformId) return null;
  const hex = BRAND_ICONS[platformId]?.hex ?? EXTRA_BRAND_COLORS[platformId];
  return hex ? `#${hex}` : null;
}

interface SocialIconProps {
  /** Normalised platform id (see lib/social/platforms). */
  platformId: string | null;
  /** Link, used for the favicon when the platform has no glyph. */
  url?: string;
  /** Owner-provided icon image; wins over everything else. */
  customIconUrl?: string;
  className?: string;
  title?: string;
}

/**
 * Icon for a social link: the owner's own image, the brand glyph, the site's
 * favicon, or a globe — in that order.
 */
export const SocialIcon = memo(function SocialIcon({ platformId, url, customIconUrl, className, title }: SocialIconProps) {
  const [customFailed, setCustomFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  if (customIconUrl && !customFailed) {
    return (
      <img
        src={customIconUrl}
        alt=""
        aria-hidden="true"
        className={cn('object-contain', className)}
        onError={() => setCustomFailed(true)}
        loading="lazy"
      />
    );
  }

  const brand = platformId ? BRAND_ICONS[platformId] : undefined;
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        {title ? <title>{title}</title> : null}
        <path d={brand.path} />
      </svg>
    );
  }

  const Glyph = platformId ? LUCIDE_GLYPHS[platformId as keyof typeof LUCIDE_GLYPHS] : undefined;
  if (Glyph) return <Glyph className={className} aria-hidden="true" />;

  const domain = url ? extractDomain(url) : null;
  if (domain && !faviconFailed) {
    return (
      <img
        src={getGoogleFaviconUrl(domain)}
        alt=""
        aria-hidden="true"
        className={cn('rounded-sm object-contain', className)}
        onError={() => setFaviconFailed(true)}
        loading="lazy"
      />
    );
  }

  return <Globe className={className} aria-hidden="true" />;
});
