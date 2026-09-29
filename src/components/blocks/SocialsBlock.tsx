import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialIcon, getBrandColor } from '@/components/icons/SocialIcon';
import { detectSocialPlatform, getSocialPlatform, normalizePlatformId } from '@/lib/social/platforms';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { SocialsBlock as SocialsBlockType } from '@/types/page';
import { cn } from '@/lib/utils/utils';

interface SocialsBlockProps {
  block: SocialsBlockType;
  onPlatformClick?: () => void;
}

export const SocialsBlock = memo(function SocialsBlockComponent({ block, onPlatformClick }: SocialsBlockProps) {
  const { i18n } = useTranslation();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);

  const handleClick = (url: string) => {
    // Track click first
    if (onPlatformClick) {
      onPlatformClick();
    }
    // Small delay to ensure tracking request is sent
    setTimeout(() => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, 10);
  };

  const iconStyle = block.iconStyle === 'brand' || block.iconStyle === 'outline' ? block.iconStyle : 'theme';
  const isList = block.layout === 'list';

  const justifyClass = block.alignment === 'left' ? 'justify-start'
    : block.alignment === 'right' ? 'justify-end'
      : 'justify-center';

  // Safely filter and process platforms
  const validPlatforms = (block.platforms || []).filter(
    (platform): platform is NonNullable<typeof platform> =>
      platform != null && typeof platform === 'object'
  );

  if (validPlatforms.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className={`text-xs font-medium text-muted-foreground mb-3 ${block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          {title}
        </h3>
      )}
      <div
        className={cn(
          isList ? 'flex flex-col gap-2' : `flex items-center ${justifyClass} gap-2 flex-wrap`,
        )}
      >
        {validPlatforms.map((platform, index) => {
          const url = platform.url || '';
          if (!url) return null;

          // The link decides the network; the stored choice is a fallback for
          // unknown domains (older editors saved 'platform', templates 'icon').
          const platformId = detectSocialPlatform(url)
            ?? normalizePlatformId(platform.platform)
            ?? normalizePlatformId(platform.icon);
          const label = platform.name || getSocialPlatform(platformId)?.label || url.replace(/^https?:\/\//, '');
          const brandColor = iconStyle === 'brand' && !platform.customIconUrl ? getBrandColor(platformId) : null;

          return (
            <button
              key={platform.id ?? index}
              onClick={() => handleClick(url)}
              className={cn(
                'group relative flex items-center transition-all duration-200 active:scale-95',
                isList
                  ? 'h-12 w-full gap-3 rounded-control px-4 text-left'
                  : 'h-12 w-12 justify-center rounded-control',
                iconStyle === 'outline'
                  ? 'border border-foreground/25 bg-transparent text-foreground hover:bg-foreground/5'
                  : 'bg-surface-raised border border-hairline shadow-soft hover:shadow-lift hover:-translate-y-0.5',
              )}
              aria-label={label}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center',
                  !brandColor && 'text-foreground/80 group-hover:text-primary transition-colors duration-200',
                )}
                style={brandColor ? { color: brandColor } : undefined}
              >
                <SocialIcon
                  platformId={platformId}
                  url={url}
                  customIconUrl={platform.customIconUrl}
                  className="h-5 w-5"
                />
              </span>
              {isList ? <span className="min-w-0 truncate text-sm font-medium text-foreground">{label}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
});
