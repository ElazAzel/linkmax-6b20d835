import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { createBlockClickHandler, getHoverClass, getBackgroundStyle } from '@/lib/blocks/block-utils';
import { getBlockStyles, getBlockInnerStyles, hasCustomBlockStyle } from '@/lib/blocks/block-styling';
import type { ButtonBlock as ButtonBlockType } from '@/types/page';
import { cn } from '@/lib/utils/utils';

interface ButtonBlockProps {
  block: ButtonBlockType;
  onClick?: () => void;
}

export const ButtonBlock = memo(function ButtonBlockComponent({ block, onClick }: ButtonBlockProps) {
  const { i18n } = useTranslation();
  const handleClick = createBlockClickHandler(block.url, onClick);
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);

  const alignmentClass = block.alignment === 'left' ? 'justify-start' 
    : block.alignment === 'right' ? 'justify-end' 
    : 'justify-center';

  // Legacy background system
  const hasLegacyBackground = block.background && block.background.value;
  const isImageBackground = block.background?.type === 'image';
  const legacyButtonStyle = hasLegacyBackground ? getBackgroundStyle(block.background) : {};

  // New block styling system — apply full container styles (bg, border, radius, padding, shadow)
  // directly to the <button> so the paint stays on the button itself, not the row wrapper.
  const { style: containerStyle, className: containerClass, textEffectClass } = getBlockStyles(block.blockStyle);
  const { style: innerStyle } = getBlockInnerStyles(block.blockStyle);
  const hasBlockStyle = hasCustomBlockStyle(block.blockStyle);

  // Combine styles - new blockStyle takes precedence
  const combinedStyle = { ...legacyButtonStyle, ...containerStyle, ...innerStyle };
  const hasAnyCustomStyle = hasLegacyBackground || hasBlockStyle;

  const widthClass = block.width === 'full' ? 'w-full' 
    : block.width === 'small' ? 'w-auto min-w-[100px]' 
    : block.width === 'large' ? 'w-full sm:w-auto sm:min-w-[360px] sm:max-w-lg'
    : block.width === 'auto' ? 'w-auto'
    : 'w-full sm:w-auto sm:min-w-[280px] sm:max-w-md';

  const sizeClass = block.size === 'xs' ? 'px-4 py-2 text-xs'
    : block.size === 'sm' ? 'px-5 py-3 text-sm'
    : block.size === 'lg' ? 'px-8 sm:px-10 py-5 text-base sm:text-lg'
    : block.size === 'xl' ? 'px-10 sm:px-12 py-6 text-lg sm:text-xl'
    : 'px-6 sm:px-8 py-4 text-sm sm:text-base';

  return (
    <div className={cn("flex w-full", alignmentClass)}>
      <button
        onClick={handleClick}
        className={cn(
          widthClass,
          "relative overflow-hidden font-medium tracking-tight rounded-card",
          "shadow-soft hover:shadow-lift transition-all duration-200",
          "hover:-translate-y-px active:scale-[0.99]",
          "break-words hyphens-auto",
          sizeClass,
          getHoverClass(block.hoverEffect),
          hasLegacyBackground
            ? 'text-white drop-shadow-md'
            : hasBlockStyle
              ? ''
              : 'bg-primary text-primary-foreground'
        )}
        style={combinedStyle}
      >
        {isImageBackground && (
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        )}
        <span className={cn("relative z-10 line-clamp-2", textEffectClass)}>{title}</span>
      </button>
    </div>
  );
});
