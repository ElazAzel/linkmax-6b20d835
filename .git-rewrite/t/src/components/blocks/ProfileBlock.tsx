import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import type { ProfileBlock as ProfileBlockType } from '@/types/page';
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

  const getShadowClass = () => {
    const shadow = block.shadowStyle || 'soft';
    switch (shadow) {
      case 'none': return '';
      case 'soft': return 'shadow-md';
      case 'medium': return 'shadow-xl';
      case 'strong': return 'shadow-2xl';
      case 'glow': return 'shadow-[0_0_30px_hsl(var(--primary)/0.4)]';
      default: return 'shadow-md';
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

  const getAvatarFrameClass = () => {
    const frameStyle = block.avatarFrame || 'default';
    
    switch (frameStyle) {
      case 'neon':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-pulse';
      case 'glitch':
        return 'ring-2 ring-primary ring-offset-2 ring-offset-background relative after:absolute after:inset-0 after:ring-2 after:ring-destructive after:rounded-full after:animate-ping';
      case 'aura':
        return 'ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-[0_0_40px_20px_hsl(var(--primary)/0.2)]';
      case 'gradient':
        return 'ring-4 ring-offset-4 ring-offset-background bg-gradient-to-r from-primary via-secondary to-accent p-1 rounded-full';
      case 'pulse':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background animate-[pulse_2s_ease-in-out_infinite]';
      case 'rainbow':
        return 'ring-4 ring-offset-4 ring-offset-background animate-[spin_3s_linear_infinite] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-1 rounded-full';
      case 'double':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_0_8px_hsl(var(--secondary))]';
      case 'spinning':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background animate-[spin_4s_linear_infinite]';
      case 'dash':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background [background:conic-gradient(from_0deg,hsl(var(--primary))_0%,transparent_50%,hsl(var(--primary))_100%)] animate-[spin_3s_linear_infinite] p-1 rounded-full';
      case 'wave':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_20px_hsl(var(--primary)/0.3)]';
      default:
        return 'ring-2 ring-primary ring-offset-2 ring-offset-background';
    }
  };

  const isGradientFrame = block.avatarFrame === 'gradient' || block.avatarFrame === 'rainbow' || block.avatarFrame === 'dash';
  
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
        <div className={`${isGradientFrame ? getAvatarFrameClass() : ''} ${getShadowClass()}`}>
          <Avatar className={`${getAvatarSize()} ${!isGradientFrame ? getAvatarFrameClass() : ''}`}>
            <AvatarImage src={block.avatar} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
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
    </div>
  );
});
