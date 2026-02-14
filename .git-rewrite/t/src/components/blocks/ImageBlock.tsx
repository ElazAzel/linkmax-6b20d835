import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
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
        return 'p-4 bg-card border border-border shadow-md rotate-[-2deg] hover:rotate-0 transition-transform duration-300';
      case 'vignette':
        return 'relative rounded-2xl shadow-sm after:absolute after:inset-0 after:shadow-[inset_0_0_100px_rgba(0,0,0,0.3)] after:pointer-events-none after:rounded-2xl';
      case 'circle':
        return 'rounded-full aspect-square object-cover shadow-sm';
      case 'banner':
        return 'w-full rounded-2xl shadow-lg';
      default:
        return 'rounded-2xl shadow-sm';
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

  const imageElement = (
    <img
      src={block.url}
      alt={alt}
      className={`${isBanner ? 'w-full h-auto' : 'w-full h-auto object-cover'}`}
    />
  );

  const containerClass = isBanner ? 'w-full' : 'overflow-hidden max-w-md';

  return (
    <div className={`w-full flex flex-col ${alignmentClass}`}>
      <div 
        className={`${containerClass} ${getImageClass()} ${block.link ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        onClick={block.link ? handleClick : undefined}
        role={block.link ? 'link' : undefined}
      >
        {imageElement}
      </div>
      {caption && (
        <p className={`text-sm text-muted-foreground mt-4 ${block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          {caption}
        </p>
      )}
    </div>
  );
});