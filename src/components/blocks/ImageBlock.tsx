import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
import { handleKeyboardActivation } from '@/lib/utils/a11y';
import type { ImageBlock as ImageBlockType } from '@/types/page';

interface ImageBlockProps {
  block: ImageBlockType;
  onClick?: () => void;
}

export const ImageBlock = memo(function ImageBlockComponent({ block, onClick }: ImageBlockProps) {
  const { i18n } = useTranslation();
  const alt = getI18nText(block.alt, i18n.language as SupportedLanguage);
  const caption = getI18nText(block.caption, i18n.language as SupportedLanguage);

  const isBanner = block.style === 'banner';
  const hasLink = Boolean(block.link);

  const getImageClass = () => {
    switch (block.style) {
      case 'polaroid':
        return 'p-3 sm:p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-glass rotate-[-2deg] hover:rotate-0 transition-all duration-500 rounded-sm hover:shadow-glass-lg';
      case 'vignette':
        return 'relative rounded-2xl shadow-glass after:absolute after:inset-0 after:shadow-[inset_0_0_100px_rgba(0,0,0,0.4)] after:pointer-events-none after:rounded-2xl';
      case 'circle':
        return 'rounded-full aspect-square object-cover shadow-glass-lg border-2 border-white/10';
      case 'banner':
        return 'w-full rounded-2xl glass-card backdrop-blur-md border-white/10 shadow-glass-xl';
      default:
        return 'rounded-2xl shadow-glass border border-white/5 transition-all duration-300 hover:shadow-glass-lg glass-card backdrop-blur-[2px]';
    }
  };

  const alignmentClass = block.alignment === 'left' ? 'items-start'
    : block.alignment === 'right' ? 'items-end'
      : 'items-center';

  const handleClick = () => {
    if (block.link) {
      onClick?.();
      // Delay to ensure tracking request is sent before navigation
      setTimeout(() => {
        window.open(block.link, '_blank', 'noopener,noreferrer');
      }, 15);
    }
  };

  const isFullWidth = isBanner || block.scale === 'fill' || block.scale === 'cover';
  const containerClass = isFullWidth ? 'w-full' : 'w-full max-w-md';

  return (
    <div className={cn("w-full flex flex-col", alignmentClass)}>
      <div
        className={cn(
          "relative group",
          containerClass,
          hasLink && 'cursor-pointer'
        )}
        onClick={hasLink ? handleClick : undefined}
        onKeyDown={hasLink ? (event) => handleKeyboardActivation(event, handleClick) : undefined}
        role="link"
        tabIndex={hasLink ? 0 : undefined}
      >
        <div className={cn(
          "relative overflow-hidden h-full w-full",
          getImageClass(),
          hasLink && 'hover:shadow-lg transition-shadow duration-300'
        )}>
          {block.scale === 'tile' ? (
            <div
              className="w-full h-full min-h-[200px]"
              style={{
                backgroundImage: `url(${block.url})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '150px auto', // Default tile size
                backgroundPosition: 'center'
              }}
              role="img"
              aria-label={alt || 'Image'}
            />
          ) : (
            <img
              src={block.url}
              alt={alt || 'Image'}
              className={cn(
                "w-full h-full",
                // Default to cover if not specified
                block.scale === 'contain' ? 'object-contain' :
                  block.scale === 'fill' ? 'object-fill' :
                    'object-cover', // cover is default
                block.style === 'circle' && 'aspect-square',
                hasLink && 'transition-all duration-300 group-hover:scale-[1.02] group-hover:brightness-90'
              )}
              loading="lazy"
            />
          )}

          {/* Link indicator overlay */}
          {hasLink && (
            <>
              {/* Gradient overlay on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                block.style === 'circle' ? 'rounded-full' : 'rounded-xl sm:rounded-2xl'
              )} />

              {/* External link icon */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
              </div>
            </>
          )}
        </div>
      </div>
      {caption && (
        <p className={cn(
          "text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-4 break-words hyphens-auto",
          block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'
        )}>
          {caption}
        </p>
      )}
    </div>
  );
});
