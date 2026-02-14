import type { SeparatorBlock as SeparatorBlockType } from '@/types/page';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';

interface SeparatorBlockProps {
  block: SeparatorBlockType;
}

export function SeparatorBlock({ block }: SeparatorBlockProps) {
  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
    gradient: 'border-none bg-gradient-to-r from-transparent via-primary to-transparent',
  };

  const thicknessClasses = {
    thin: 'h-px',
    medium: 'h-0.5',
    thick: 'h-1',
  };

  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
  };

  const spacingClasses = {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
    xl: 'my-8',
  };

  const variant = block.variant || 'solid';
  const isGradient = variant === 'gradient';
  
  const paddingMap = { none: '', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' };
  const marginMap = { none: '', sm: 'my-2', md: 'my-4', lg: 'my-6', xl: 'my-8' };

  if (isGradient) {
    return (
      <div 
        className={cn(
          "mx-auto",
          widthClasses[block.width || 'full'],
          spacingClasses[block.spacing || 'md'],
          block.blockStyle?.padding && paddingMap[block.blockStyle.padding],
          block.blockStyle?.margin && marginMap[block.blockStyle.margin],
          getAnimationClass(block.blockStyle)
        )}
        style={getAnimationStyle(block.blockStyle)}
      >
        <div 
          className={cn(
            thicknessClasses[block.thickness || 'thin'],
            'bg-gradient-to-r from-transparent via-primary to-transparent rounded-full'
          )}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center",
        spacingClasses[block.spacing || 'md'],
        block.blockStyle?.padding && paddingMap[block.blockStyle.padding],
        block.blockStyle?.margin && marginMap[block.blockStyle.margin],
        getAnimationClass(block.blockStyle)
      )}
      style={getAnimationStyle(block.blockStyle)}
    >
      <Separator 
        className={cn(
          variantClasses[variant],
          thicknessClasses[block.thickness || 'thin'],
          widthClasses[block.width || 'full']
        )}
        style={block.color ? { backgroundColor: block.color } : undefined}
      />
    </div>
  );
}
