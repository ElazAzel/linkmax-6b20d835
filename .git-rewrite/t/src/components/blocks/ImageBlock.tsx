import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import type { ImageBlock as ImageBlockType } from '@/types/page';

interface ImageBlockProps {
  block: ImageBlockType;
}

export const ImageBlock = memo(function ImageBlockComponent({ block }: ImageBlockProps) {
  const { i18n } = useTranslation();
  const alt = getTranslatedString(block.alt, i18n.language as SupportedLanguage);
  const caption = getTranslatedString(block.caption, i18n.language as SupportedLanguage);

  const isBanner = block.style === 'banner';

  const getImageClass = () => {
    switch (block.style) {
      case 'polaroid':
        return 'p-3 sm:p-4 bg-card border border-border shadow-md rotate-[-2deg] hover:rotate-0 transition-transform duration-300';
      case 'vignette':
        return 'relative rounded-xl sm:rounded-2xl shadow-sm after:absolute after:inset-0 after:shadow-[inset_0_0_100px_rgba(0,0,0,0.3)] after:pointer-events-none after:rounded-xl sm:after:rounded-2xl';
      case 'circle':
        return 'rounded-full aspect-square object-cover shadow-sm';
      case 'banner':
        return 'w-full rounded-xl sm:rounded-2xl shadow-lg';
      default:
        return 'rounded-xl sm:rounded-2xl shadow-sm';
    }
  };

  const alignmentClass = block.alignment === 'left' ? 'items-start' 
    : block.alignment === 'right' ? 'items-end' 
    : 'items-center';

  const handleClick = () => {
    if (block.link) {
      window.open(block.link, '_blank', 'noopener,noreferrer');
    }
  };

  const containerClass = isBanner ? 'w-full' : 'overflow-hidden w-full max-w-md';

  return (
    <div className={cn("w-full flex flex-col", alignmentClass)}>
      <div 
        className={cn(
          containerClass,
          getImageClass(),
          block.link && 'cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all'
        )}
        onClick={block.link ? handleClick : undefined}
        role={block.link ? 'link' : undefined}
      >
        <LazyImage
          src={block.url}
          alt={alt || 'Image'}
          className={cn(isBanner ? 'w-full h-auto' : 'w-full h-auto object-cover')}
          wrapperClassName={block.style === 'circle' ? 'rounded-full aspect-square' : 'rounded-xl sm:rounded-2xl'}
          placeholderClassName={block.style === 'circle' ? 'rounded-full' : 'rounded-xl sm:rounded-2xl'}
        />
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