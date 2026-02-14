import { useTranslation } from 'react-i18next';
import type { AvatarBlock as AvatarBlockType } from '@/types/page';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface AvatarBlockProps {
  block: AvatarBlockType;
}

export function AvatarBlock({ block }: AvatarBlockProps) {
  const { i18n } = useTranslation();
  const name = getTranslatedString(block.name, i18n.language as SupportedLanguage);
  const subtitle = getTranslatedString(block.subtitle, i18n.language as SupportedLanguage);
  
  const sizeClasses = {
    small: 'h-16 w-16',
    medium: 'h-24 w-24',
    large: 'h-32 w-32',
    xlarge: 'h-48 w-48',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    square: 'rounded-none',
  };

  const shadowClasses = {
    none: '',
    soft: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-lg',
    glow: 'shadow-lg shadow-primary/50',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const paddingMap = { none: '', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' };
  const marginMap = { none: '', sm: 'my-2', md: 'my-4', lg: 'my-6', xl: 'my-8' };

  const alignmentClass = block.alignment === 'left' ? 'items-start text-left' 
    : block.alignment === 'right' ? 'items-end text-right' 
    : 'items-center text-center';

  return (
    <div 
      className={cn(
        "flex flex-col gap-3",
        alignmentClass,
        block.blockStyle?.padding && paddingMap[block.blockStyle.padding],
        block.blockStyle?.margin && marginMap[block.blockStyle.margin],
        getAnimationClass(block.blockStyle)
      )}
      style={getAnimationStyle(block.blockStyle)}
    >
      <div className={cn(
        "relative",
        block.border && "p-1 bg-gradient-to-br from-primary to-primary/50",
        shapeClasses[block.shape || 'circle']
      )}>
        <Avatar 
          className={cn(
            sizeClasses[block.size || 'medium'],
            shapeClasses[block.shape || 'circle'],
            shadowClasses[block.shadow || 'soft']
          )}
        >
          <AvatarImage src={block.imageUrl} alt={name} />
          <AvatarFallback className="text-lg font-semibold bg-primary/10">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
