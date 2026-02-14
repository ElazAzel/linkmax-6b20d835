import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { TextBlock as TextBlockType } from '@/types/page';

interface TextBlockProps {
  block: TextBlockType;
}

export const TextBlock = memo(function TextBlockComponent({ block }: TextBlockProps) {
  const { i18n } = useTranslation();
  const content = getTranslatedString(block.content, i18n.language as SupportedLanguage);
  
  const alignmentClass = block.alignment === 'center' ? 'text-center' 
    : block.alignment === 'right' ? 'text-right' 
    : 'text-left';

  switch (block.style) {
    case 'heading':
      return <h2 className={`text-2xl font-bold ${alignmentClass}`}>{content}</h2>;
    case 'quote':
      return (
        <blockquote className={`border-l-4 border-primary pl-4 italic text-muted-foreground ${alignmentClass}`}>
          {content}
        </blockquote>
      );
    default:
      return <p className={`text-foreground ${alignmentClass}`}>{content}</p>;
  }
});
