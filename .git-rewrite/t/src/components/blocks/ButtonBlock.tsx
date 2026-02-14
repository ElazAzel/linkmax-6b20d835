import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { createBlockClickHandler, getHoverClass, getBackgroundStyle } from '@/lib/block-utils';
import type { ButtonBlock as ButtonBlockType } from '@/types/page';
import { cn } from '@/lib/utils';

interface ButtonBlockProps {
  block: ButtonBlockType;
  onClick?: () => void;
}

export const ButtonBlock = memo(function ButtonBlockComponent({ block, onClick }: ButtonBlockProps) {
  const { i18n } = useTranslation();
  const handleClick = createBlockClickHandler(block.url, onClick);
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  const alignmentClass = block.alignment === 'left' ? 'justify-start' 
    : block.alignment === 'right' ? 'justify-end' 
    : 'justify-center';

  const hasCustomBackground = block.background && block.background.value;
  const isImageBackground = block.background?.type === 'image';
  const buttonStyle = hasCustomBackground ? getBackgroundStyle(block.background) : {};

  const widthClass = block.width === 'full' ? 'w-full' 
    : block.width === 'small' ? 'w-auto min-w-[120px]' 
    : 'w-full sm:w-auto sm:min-w-[280px] sm:max-w-md';

  return (
    <div className={cn("flex w-full", alignmentClass)}>
      <button
        onClick={handleClick}
        className={cn(
          widthClass,
          "relative overflow-hidden rounded-2xl px-6 sm:px-8 py-4 text-sm sm:text-base font-semibold",
          "shadow-glass-lg backdrop-blur-xl transition-all duration-300",
          "hover:shadow-glass-xl hover:scale-[1.02] active:scale-[0.98]",
          "break-words hyphens-auto",
          getHoverClass(block.hoverEffect),
          hasCustomBackground 
            ? 'text-white drop-shadow-md' 
            : 'bg-primary text-primary-foreground border border-primary/20'
        )}
        style={buttonStyle}
      >
        {/* Overlay for image backgrounds to ensure text readability */}
        {isImageBackground && (
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        )}
        <span className="relative z-10 line-clamp-2">{title}</span>
        {/* Glass reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20" />
      </button>
    </div>
  );
});
