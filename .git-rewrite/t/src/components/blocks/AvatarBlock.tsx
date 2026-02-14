import { useTranslation } from 'react-i18next';
import type { AvatarBlock as AvatarBlockType, AvatarFrameStyle } from '@/types/page';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { getFrameStyles, getShadowStyles, FRAME_CSS, isAnimatedFrame } from '@/lib/avatar-frame-utils';

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

  // Frame sizes (slightly larger than avatar)
  const frameSizeClasses = {
    small: 'h-[72px] w-[72px]',
    medium: 'h-[104px] w-[104px]',
    large: 'h-[136px] w-[136px]',
    xlarge: 'h-[200px] w-[200px]',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    square: 'rounded-none',
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

  const frameStyle = block.frameStyle || (block.border ? 'gradient' : 'none');
  const hasFrame = frameStyle !== 'none';

  return (
    <div 
      className={cn(
        "flex flex-col gap-3",
        alignmentClass,
        block.blockStyle?.padding && paddingMap[block.blockStyle.padding],
        block.blockStyle?.margin && marginMap[block.blockStyle.margin],
      )}
    >
      {/* Outer wrapper for animation */}
      <div 
        className={cn(
          "relative",
          getAnimationClass(block.blockStyle)
        )}
        style={getAnimationStyle(block.blockStyle)}
      >
        {/* Frame wrapper - shadow applies here */}
        <div 
          className={cn(
            "flex items-center justify-center",
            frameSizeClasses[block.size || 'medium'],
            shapeClasses[block.shape || 'circle'],
          )}
          style={{
            ...getShadowStyles(block.shadow || 'none'),
            ...(hasFrame ? getFrameStyles(frameStyle) : {}),
          }}
        >
          {/* Avatar - NO animation, NO shadow */}
          <Avatar 
            className={cn(
              sizeClasses[block.size || 'medium'],
              shapeClasses[block.shape || 'circle'],
              "bg-background"
            )}
          >
            <AvatarImage src={block.imageUrl} alt={name} className="object-cover" />
            <AvatarFallback className="text-lg font-semibold bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* CSS for frame animations */}
      <style>{FRAME_CSS}</style>
    </div>
  );
}
