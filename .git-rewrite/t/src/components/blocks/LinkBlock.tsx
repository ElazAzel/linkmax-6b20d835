import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ExternalLink, Instagram, Twitter, Youtube, Facebook, Linkedin, Globe, Link2 } from 'lucide-react';
import { getButtonClass, createBlockClickHandler, getBackgroundStyle } from '@/lib/block-utils';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { extractDomain, getGoogleFaviconUrl, getDirectFaviconUrl } from '@/lib/favicon-utils';
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
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
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

  // Check if we have a custom background
  const hasCustomBackground = block.background && block.background.type && block.background.value;
  const backgroundStyle = hasCustomBackground ? getBackgroundStyle(block.background) : {};
  const isImageBackground = block.background?.type === 'image';

  return (
    <div className={`flex ${block.alignment === 'left' ? 'justify-start' : block.alignment === 'right' ? 'justify-end' : 'justify-center'}`}>
      <Button
        variant="outline"
        className={`max-w-full sm:max-w-md w-full justify-between h-auto py-4 px-6 hover:scale-[1.02] transition-all shadow-sm hover:shadow-md ${getButtonClass(block.style)} ${hasCustomBackground ? 'border-transparent text-white hover:bg-transparent' : 'bg-card border-border hover:bg-accent'} ${isImageBackground ? 'relative overflow-hidden' : ''}`}
        onClick={handleClick}
        style={backgroundStyle}
      >
        {/* Overlay for image backgrounds */}
        {isImageBackground && (
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        )}
        <div className={`flex items-center gap-3 min-w-0 ${isImageBackground ? 'relative z-10' : ''}`}>
          {shouldShowFavicon ? (
            <img 
              src={faviconSrc}
              alt=""
              className="h-5 w-5 flex-shrink-0 rounded-sm object-contain"
              onError={handleFaviconError}
              onLoad={() => setFaviconLoaded(true)}
            />
          ) : (
            <FallbackIcon className={`h-5 w-5 flex-shrink-0 ${hasCustomBackground ? 'text-white' : 'text-primary'}`} />
          )}
          <span className={`font-medium truncate ${hasCustomBackground ? 'text-white drop-shadow-md' : 'text-foreground'}`}>{title}</span>
        </div>
        <ExternalLink className={`h-4 w-4 flex-shrink-0 ml-2 ${isImageBackground ? 'relative z-10' : ''} ${hasCustomBackground ? 'text-white/80' : 'text-muted-foreground'}`} />
      </Button>
    </div>
  );
});
