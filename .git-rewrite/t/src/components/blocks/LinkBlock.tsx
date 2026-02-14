import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ExternalLink, Instagram, Twitter, Youtube, Facebook, Linkedin, Globe } from 'lucide-react';
import { getButtonClass, createBlockClickHandler } from '@/lib/block-utils';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { LinkBlock as LinkBlockType } from '@/types/page';

interface LinkBlockProps {
  block: LinkBlockType;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  globe: Globe,
};

export const LinkBlock = memo(function LinkBlockComponent({ block, onClick }: LinkBlockProps) {
  const { i18n } = useTranslation();
  const Icon = block.icon && iconMap[block.icon.toLowerCase()] 
    ? iconMap[block.icon.toLowerCase()] 
    : ExternalLink;

  const handleClick = createBlockClickHandler(block.url, onClick);

  const alignmentClass = block.alignment === 'left' ? 'mr-auto' 
    : block.alignment === 'right' ? 'ml-auto' 
    : 'mx-auto';

  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  return (
    <div className={`flex ${block.alignment === 'left' ? 'justify-start' : block.alignment === 'right' ? 'justify-end' : 'justify-center'}`}>
      <Button
        variant="outline"
        className={`${alignmentClass} max-w-full sm:max-w-md justify-between h-auto py-4 px-6 hover:scale-[1.02] transition-transform ${getButtonClass(block.style)}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-medium">{title}</span>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
});
