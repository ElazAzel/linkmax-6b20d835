import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import type { TextBlock as TextBlockType } from '@/types/page';
import { cn } from '@/lib/utils';

interface TextBlockProps {
  block: TextBlockType;
}

export const TextBlock = memo(function TextBlockComponent({ block }: TextBlockProps) {
  const { i18n } = useTranslation();
  const content = getTranslatedString(block.content, i18n.language as SupportedLanguage);
  const parsedContent = parseRichText(content);
  
  const alignmentClass = block.alignment === 'center' ? 'text-center' 
    : block.alignment === 'right' ? 'text-right' 
    : 'text-left';

  switch (block.style) {
    case 'heading':
      return (
        <h2 className={cn(
          "text-xl sm:text-2xl font-bold break-words hyphens-auto leading-tight",
          alignmentClass
        )}>
          {parsedContent}
        </h2>
      );
    case 'quote':
      return (
        <blockquote className={cn(
          "border-l-4 border-primary pl-3 sm:pl-4 italic text-muted-foreground whitespace-pre-line break-words hyphens-auto text-sm sm:text-base",
          alignmentClass
        )}>
          {parsedContent}
        </blockquote>
      );
    default:
      return (
        <p className={cn(
          "text-foreground whitespace-pre-line break-words hyphens-auto text-sm sm:text-base leading-relaxed",
          alignmentClass
        )}>
          {parsedContent}
        </p>
      );
  }
});
