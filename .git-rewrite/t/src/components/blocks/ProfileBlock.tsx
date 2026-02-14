import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import { getFrameStyles, getShadowStyles, isGradientFrame, FRAME_CSS } from '@/lib/avatar-frame-utils';
import { cn } from '@/lib/utils';
import type { ProfileBlock as ProfileBlockType, ProfileFrameStyle } from '@/types/page';

interface ProfileBlockProps {
  block: ProfileBlockType;
  isPreview?: boolean;
}

export const ProfileBlock = memo(function ProfileBlockComponent({ block, isPreview }: ProfileBlockProps) {
  const { t, i18n } = useTranslation();
  const name = getTranslatedString(block.name, i18n.language as SupportedLanguage);
  const bio = getTranslatedString(block.bio, i18n.language as SupportedLanguage);
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAvatarSize = () => {
    const size = block.avatarSize || 'large';
    switch (size) {
      case 'small': return 'h-16 w-16';
      case 'medium': return 'h-24 w-24';
      case 'large': return 'h-32 w-32';
      case 'xlarge': return 'h-40 w-40';
      default: return 'h-32 w-32';
    }
  };

  const getFrameSize = () => {
    const size = block.avatarSize || 'large';
    switch (size) {
      case 'small': return 'h-[72px] w-[72px]';
      case 'medium': return 'h-[104px] w-[104px]';
      case 'large': return 'h-[140px] w-[140px]';
      case 'xlarge': return 'h-[172px] w-[172px]';
      default: return 'h-[140px] w-[140px]';
    }
  };

  const getCoverGradient = () => {
    const gradient = block.coverGradient || 'none';
    switch (gradient) {
      case 'none': return '';
      case 'dark': return 'bg-gradient-to-b from-black/50 to-black/20';
      case 'light': return 'bg-gradient-to-b from-white/50 to-white/20';
      case 'primary': return 'bg-gradient-to-b from-primary/60 to-primary/20';
      case 'sunset': return 'bg-gradient-to-br from-orange-500/50 via-pink-500/50 to-purple-600/50';
      case 'ocean': return 'bg-gradient-to-br from-blue-500/50 via-cyan-500/50 to-teal-500/50';
      case 'purple': return 'bg-gradient-to-br from-purple-600/50 via-pink-500/50 to-blue-500/50';
      default: return '';
    }
  };

  const getPositionClass = () => {
    const position = block.avatarPosition || 'center';
    switch (position) {
      case 'left': return 'items-start';
      case 'right': return 'items-end';
      case 'center': 
      default: return 'items-center';
    }
  };

  const getCoverHeight = () => {
    const height = block.coverHeight || 'medium';
    switch (height) {
      case 'small': return 'h-[120px]';
      case 'medium': return 'h-[200px]';
      case 'large': return 'h-[320px]';
      default: return 'h-[200px]';
    }
  };

  const frameStyle: ProfileFrameStyle = block.avatarFrame || 'default';
  const hasGradientFrame = isGradientFrame(frameStyle);

  // Get icon component dynamically
  const getIconComponent = () => {
    if (!block.avatarIcon) return null;
    const iconName = block.avatarIcon
      .split('-')
      .map((part, i) => i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || null;
  };

  const IconComponent = getIconComponent();

  return (
    <div className={`relative flex flex-col ${getPositionClass()}`}>
      {block.coverImage && (
        <div className={`relative w-full ${getCoverHeight()} overflow-hidden`}>
          <img 
            src={block.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          {block.coverGradient !== 'none' && (
            <div className={`absolute inset-0 ${getCoverGradient()}`} />
          )}
        </div>
      )}
      
      <div className={`flex flex-col ${getPositionClass()} gap-4 p-6 ${block.coverImage ? '-mt-16' : ''}`}>
        {/* Outer container for positioning icon */}
        <div className="relative">
          {/* Frame wrapper - shadow and frame styles apply here only */}
          <div 
            className={cn(
              "flex items-center justify-center rounded-full",
              getFrameSize(),
            )}
            style={{
              ...getShadowStyles(block.shadowStyle || 'soft'),
              ...getFrameStyles(frameStyle),
            }}
          >
            {/* Avatar - NO animation, NO shadow */}
            <Avatar className={cn(getAvatarSize(), "bg-background")}>
              <AvatarImage src={block.avatar} alt={name} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Icon badge */}
          {IconComponent && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
              <IconComponent className="h-4 w-4" />
            </div>
          )}
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{name}</h1>
            {block.verified && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('profile.verified', 'Verified')}
              </Badge>
            )}
          </div>
          
          {bio && (
            <p className="text-muted-foreground max-w-md whitespace-pre-line">{parseRichText(bio)}</p>
          )}
        </div>
      </div>

      <style>{FRAME_CSS}</style>
    </div>
  );
});
