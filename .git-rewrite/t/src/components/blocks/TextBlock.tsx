import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import { getBlockStyles, hasCustomBlockStyle } from '@/lib/block-styling';
import type { TextBlock as TextBlockType } from '@/types/page';
import { cn } from '@/lib/utils';

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

  // Get custom block styles
  const { style: customStyle, textEffectClass } = getBlockStyles(block.blockStyle);
  const hasBlockStyle = hasCustomBlockStyle(block.blockStyle);

  switch (block.style) {
    case 'heading':
      return (
        <h2 
          className={cn(
            "text-xl sm:text-2xl font-bold break-words hyphens-auto leading-tight",
            alignmentClass,
            textEffectClass,
            !hasBlockStyle && 'text-foreground'
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
            "border-l-4 border-primary pl-3 sm:pl-4 italic whitespace-pre-line break-words hyphens-auto text-sm sm:text-base",
            alignmentClass,
            textEffectClass,
            !hasBlockStyle && 'text-muted-foreground'
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
