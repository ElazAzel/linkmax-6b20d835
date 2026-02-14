import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ExternalLink, Instagram, Twitter, Youtube, Facebook, Linkedin, Globe, Link2 } from 'lucide-react';
import { getButtonClass, createBlockClickHandler, getBackgroundStyle } from '@/lib/block-utils';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { extractDomain, getGoogleFaviconUrl, getDirectFaviconUrl } from '@/lib/favicon-utils';
import { getBlockStyles, hasCustomBlockStyle } from '@/lib/block-styling';
import { cn } from '@/lib/utils';
import type { LinkBlock as LinkBlockType } from '@/types/page';

interface LinkBlockProps {
  block: LinkBlockType;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  globe: Globe,
};

export const LinkBlock = memo(function LinkBlockComponent({ block, onClick }: LinkBlockProps) {
  const { i18n } = useTranslation();
  const [faviconError, setFaviconError] = useState(false);
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  
  const iconMode = block.iconMode || 'auto';
  const isManualMode = iconMode === 'manual';
  const domain = extractDomain(block.url || '');
  
  const getFaviconSrc = (): string | null => {
    if (isManualMode) {
      return block.customIconUrl || null;
    }
    if (block.faviconUrl) return block.faviconUrl;
    if (domain) return getGoogleFaviconUrl(domain);
    return null;
  };

  const faviconSrc = getFaviconSrc();
  
  useEffect(() => {
    setFaviconError(false);
    setFaviconLoaded(false);
  }, [block.url, block.faviconUrl, block.customIconUrl]);
  
  const FallbackIcon = block.icon && iconMap[block.icon.toLowerCase()] 
    ? iconMap[block.icon.toLowerCase()] 
    : Link2;

  const handleClick = createBlockClickHandler(block.url, onClick);
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const shouldShowFavicon = faviconSrc && !faviconError;
  
  const handleFaviconError = () => {
    if (!faviconError && domain && faviconSrc === getGoogleFaviconUrl(domain)) {
      const directUrl = getDirectFaviconUrl(domain);
      const img = new Image();
      img.onload = () => setFaviconLoaded(true);
      img.onerror = () => setFaviconError(true);
      img.src = directUrl;
    } else {
      setFaviconError(true);
    }
  };

  // Check if we have a custom background from block.background
  const hasLegacyBackground = block.background && block.background.type && block.background.value;
  const legacyBackgroundStyle = hasLegacyBackground ? getBackgroundStyle(block.background) : {};
  const isImageBackground = block.background?.type === 'image';

  // Get custom block styles (new system)
  const { style: blockStyleObj, textEffectClass } = getBlockStyles(block.blockStyle);
  const hasBlockStyle = hasCustomBlockStyle(block.blockStyle);
  
  // Combine styles - new blockStyle takes precedence
  const combinedStyle = { ...legacyBackgroundStyle, ...blockStyleObj };
  const hasAnyCustomStyle = hasLegacyBackground || hasBlockStyle;

  return (
    <div className={cn(
      "flex w-full",
      block.alignment === 'left' ? 'justify-start' : block.alignment === 'right' ? 'justify-end' : 'justify-center'
    )}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between h-auto min-h-[56px] py-3 px-4 sm:px-6",
          "hover:scale-[1.02] transition-all shadow-sm hover:shadow-md rounded-xl",
          "active:scale-[0.98]",
          getButtonClass(block.style),
          hasAnyCustomStyle ? 'border-transparent hover:bg-transparent' : 'bg-card border-border hover:bg-accent',
          isImageBackground && 'relative overflow-hidden'
        )}
        onClick={handleClick}
        style={combinedStyle}
      >
        {/* Overlay for image backgrounds */}
        {isImageBackground && (
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        )}
        <div className={cn(
          "flex items-center gap-3 min-w-0 flex-1",
          isImageBackground && 'relative z-10'
        )}>
          {shouldShowFavicon ? (
            <img 
              src={faviconSrc}
              alt=""
              className="h-6 w-6 flex-shrink-0 rounded-md object-contain"
              onError={handleFaviconError}
              onLoad={() => setFaviconLoaded(true)}
            />
          ) : (
            <FallbackIcon className={cn(
              "h-6 w-6 flex-shrink-0",
              hasAnyCustomStyle ? '' : 'text-primary'
            )} style={blockStyleObj.color ? { color: blockStyleObj.color } : undefined} />
          )}
          <span className={cn(
            "font-medium text-sm sm:text-base line-clamp-2 text-left",
            hasLegacyBackground ? 'text-white drop-shadow-md' : hasBlockStyle ? '' : 'text-foreground',
            textEffectClass
          )} style={blockStyleObj.color ? { color: blockStyleObj.color } : undefined}>
            {title}
          </span>
        </div>
        <ExternalLink className={cn(
          "h-4 w-4 flex-shrink-0 ml-2",
          isImageBackground && 'relative z-10',
          hasLegacyBackground ? 'text-white/80' : hasBlockStyle ? '' : 'text-muted-foreground'
        )} style={blockStyleObj.color ? { color: blockStyleObj.color, opacity: 0.8 } : undefined} />
      </Button>
    </div>
  );
});
