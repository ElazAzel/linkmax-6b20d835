import { useTranslation } from 'react-i18next';
import type { AvatarBlock as AvatarBlockType, AvatarFrameStyle } from '@/types/page';
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

  const getShadowStyle = () => {
    const shadowStyles: Record<string, React.CSSProperties> = {
      none: {},
      soft: { boxShadow: '0 4px 14px -3px hsl(var(--primary) / 0.25)' },
      medium: { boxShadow: '0 8px 24px -4px hsl(var(--primary) / 0.35)' },
      strong: { boxShadow: '0 12px 32px -4px hsl(var(--primary) / 0.45)' },
      glow: { boxShadow: '0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3)' },
    };
    return shadowStyles[block.shadow || 'none'];
  };

  const getFrameStyle = (frameStyle: AvatarFrameStyle = 'none'): React.CSSProperties => {
    const styles: Record<AvatarFrameStyle, React.CSSProperties> = {
      none: {},
      solid: {
        border: '3px solid hsl(var(--primary))',
      },
      gradient: {
        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))',
        padding: '3px',
      },
      'gradient-sunset': {
        background: 'linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3)',
        padding: '3px',
      },
      'gradient-ocean': {
        background: 'linear-gradient(135deg, #0abde3, #10ac84, #48dbfb)',
        padding: '3px',
      },
      'gradient-purple': {
        background: 'linear-gradient(135deg, #a55eea, #5f27cd, #c44dff)',
        padding: '3px',
      },
      'neon-blue': {
        border: '2px solid #00d4ff',
        boxShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, inset 0 0 10px rgba(0,212,255,0.1)',
      },
      'neon-pink': {
        border: '2px solid #ff00ff',
        boxShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff, inset 0 0 10px rgba(255,0,255,0.1)',
      },
      'neon-green': {
        border: '2px solid #00ff88',
        boxShadow: '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88, inset 0 0 10px rgba(0,255,136,0.1)',
      },
      rainbow: {
        background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff00ff, #ff0000)',
        padding: '3px',
      },
      'rainbow-spin': {
        background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff00ff, #ff0000)',
        padding: '3px',
        animation: 'spin 3s linear infinite',
      },
      double: {
        border: '3px double hsl(var(--primary))',
        padding: '2px',
      },
      dashed: {
        border: '3px dashed hsl(var(--primary))',
      },
      dotted: {
        border: '3px dotted hsl(var(--primary))',
      },
      'glow-pulse': {
        border: '2px solid hsl(var(--primary))',
        animation: 'glow-pulse 2s ease-in-out infinite',
      },
    };
    return styles[frameStyle];
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
            ...getShadowStyle(),
            ...(hasFrame ? getFrameStyle(frameStyle) : {}),
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

      {/* CSS for special animations */}
      <style>{`
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 5px hsl(var(--primary) / 0.5), 0 0 10px hsl(var(--primary) / 0.3);
          }
          50% {
            box-shadow: 0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3);
          }
        }
      `}</style>
    </div>
  );
}
