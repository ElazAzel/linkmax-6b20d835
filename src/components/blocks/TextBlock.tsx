import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import { getBlockStyles, getBlockInnerStyles, hasCustomBlockStyle } from '@/lib/blocks/block-styling';
import type { TextBlock as TextBlockType } from '@/types/page';
import { cn } from '@/lib/utils/utils';

interface TextBlockProps {
  block: TextBlockType;
}

export const TextBlock = memo(function TextBlockComponent({ block }: TextBlockProps) {
  const { i18n } = useTranslation();
  const content = getI18nText(block.content, i18n.language as SupportedLanguage);
  const parsedContent = parseRichText(content);

  const alignmentClass = block.alignment === 'center' ? 'text-center'
    : block.alignment === 'right' ? 'text-right'
      : 'text-left';

  // Get custom block styles — container styles go on the text element itself
  const { style: containerStyle, className: containerClass, textEffectClass } = getBlockStyles(block.blockStyle);
  const { style: innerStyle } = getBlockInnerStyles(block.blockStyle);
  const customStyle = { ...containerStyle, ...innerStyle };
  const hasBlockStyle = hasCustomBlockStyle(block.blockStyle);

  switch (block.style) {
    case 'heading':
      return (
        <h2
          className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight break-words hyphens-auto leading-[1.1]",
            "text-gradient bg-[length:200%_auto] animate-gradient-x",
            alignmentClass,
            textEffectClass
          )}
          style={customStyle}
        >
          {parsedContent}
        </h2>
      );
    case 'quote':
      return (
        <blockquote
          className={cn(
            "relative p-4 sm:p-6 rounded-card",
            "qb-card-quiet border-l-4 border-primary/50",

            "italic whitespace-pre-line break-words hyphens-auto text-sm sm:text-base lg:text-lg font-medium",
            alignmentClass,
            textEffectClass,
            !hasBlockStyle && 'text-foreground/90'
          )}
          style={customStyle}
        >
          {parsedContent}
        </blockquote>
      );
    default:
      return (
        <p
          className={cn(
            "whitespace-pre-line break-words hyphens-auto text-sm sm:text-base leading-relaxed",
            alignmentClass,
            textEffectClass,
            !hasBlockStyle && 'text-foreground'
          )}
          style={customStyle}
        >
          {parsedContent}
        </p>
      );
  }
});
