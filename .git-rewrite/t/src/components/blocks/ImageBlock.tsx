import { memo } from 'react';
import type { ImageBlock as ImageBlockType } from '@/types/page';

interface ImageBlockProps {
  block: ImageBlockType;
}

export const ImageBlock = memo(function ImageBlockComponent({ block }: ImageBlockProps) {
  const getImageClass = () => {
    switch (block.style) {
      case 'polaroid':
        return 'p-4 bg-white shadow-xl rotate-[-2deg] hover:rotate-0 transition-transform duration-300';
      case 'vignette':
        return 'relative after:absolute after:inset-0 after:shadow-[inset_0_0_100px_rgba(0,0,0,0.3)] after:pointer-events-none';
      case 'circle':
        return 'rounded-full aspect-square object-cover';
      default:
        return 'rounded-2xl';
    }
  };

  const alignmentClass = block.alignment === 'left' ? 'items-start' 
    : block.alignment === 'right' ? 'items-end' 
    : 'items-center';

  return (
    <div className={`w-full flex flex-col ${alignmentClass}`}>
      <div className={`overflow-hidden max-w-md ${getImageClass()}`}>
        <img
          src={block.url}
          alt={block.alt}
          className="w-full h-auto object-cover"
        />
      </div>
      {block.caption && (
        <p className={`text-sm text-muted-foreground mt-4 ${block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          {block.caption}
        </p>
      )}
    </div>
  );
});
