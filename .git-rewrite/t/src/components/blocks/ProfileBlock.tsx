import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import * as LucideIcons from 'lucide-react';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import { getFrameStyles, getShadowStyles, isGradientFrame, FRAME_CSS, getVerificationPositionClasses, getVerificationColor, VERIFICATION_ICON_OPTIONS } from '@/lib/avatar-frame-utils';
import { cn } from '@/lib/utils';
import type { ProfileBlock as ProfileBlockType, ProfileFrameStyle, VerificationIconType } from '@/types/page';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

interface ProfileBlockProps {
  block: ProfileBlockType;
  isPreview?: boolean;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
}

// Verification badge component with custom icon support
const VerificationBadge = memo(function VerificationBadgeComponent({ 
  iconType, 
  customIcon,
  color, 
  position 
}: { 
  iconType?: VerificationIconType; 
  customIcon?: string;
  color?: string; 
  position?: string; 
}) {
  // If custom icon is provided, use it instead of preset icon
  if (customIcon) {
    return (
      <div 
        className={cn(
          "absolute rounded-full shadow-lg z-10 overflow-hidden flex-shrink-0",
          "w-6 h-6 sm:w-7 sm:h-7",
          getVerificationPositionClasses(position)
        )}
        style={{ 
          backgroundColor: getVerificationColor(color),
        }}
      >
        <img 
          src={customIcon} 
          alt="Verified" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const iconOption = VERIFICATION_ICON_OPTIONS.find(opt => opt.value === (iconType || 'check-circle'));
  const iconName = iconOption?.icon || 'CheckCircle2';
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.CheckCircle2;
  
  return (
    <div 
      className={cn(
        "absolute rounded-full p-1 sm:p-1.5 shadow-lg z-10 flex-shrink-0",
        getVerificationPositionClasses(position)
      )}
      style={{ backgroundColor: getVerificationColor(color) }}
    >
      <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="currentColor" />
    </div>
  );
});

export const ProfileBlock = memo(function ProfileBlockComponent({ block, isPreview, isOwnerPremium, ownerTier }: ProfileBlockProps) {
  const { t, i18n } = useTranslation();
  const name = getTranslatedString(block.name, i18n.language as SupportedLanguage);
  const bio = getTranslatedString(block.bio, i18n.language as SupportedLanguage);
  
  // Business tier always gets verification badge
  const isBusinessTier = ownerTier === 'business';
  
  // Determine if verified badge should show (manual or auto-premium or business tier)
  const showVerified = block.verified || (block.autoVerifyPremium && isOwnerPremium) || isBusinessTier;
  
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
        {/* Outer container for positioning icon - no animation here */}
        <div className="relative">
          {/* Frame wrapper - animations and shadow apply here ONLY */}
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
            {/* Avatar - NO animation, NO shadow - completely static */}
            <Avatar className={cn(getAvatarSize(), "bg-background")}>
              <AvatarImage src={block.avatar} alt={name} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Icon badge */}
          {IconComponent && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg z-10">
              <IconComponent className="h-4 w-4" />
            </div>
          )}
          
          {/* Verification badge on frame - Business gets gold, others use settings */}
          {showVerified && (
            <VerificationBadge 
              iconType={isBusinessTier ? 'badge-check' : block.verifiedIcon}
              customIcon={isBusinessTier ? undefined : block.verifiedCustomIcon}
              color={isBusinessTier ? 'gold' : block.verifiedColor}
              position={block.verifiedPosition || 'top-right'}
            />
          )}
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{name}</h1>
          </div>
          
          {bio && (
            <p className="text-muted-foreground max-w-md whitespace-pre-line">{parseRichText(bio)}</p>
          )}
        </div>

        {/* Proof of Human - Video/Audio Greeting */}
        {(block.introVideo || block.introAudio) && (
          <div className="w-full max-w-md mx-auto space-y-3 mt-4">
            {block.introVideo && (
              <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/50">
                <video 
                  src={block.introVideo}
                  controls
                  playsInline
                  className="w-full max-h-48 object-cover"
                  preload="metadata"
                >
                  Your browser does not support video.
                </video>
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Video Greeting
                </div>
              </div>
            )}
            
            {block.introAudio && !block.introVideo && (
              <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  </div>
                  <audio 
                    src={block.introAudio}
                    controls
                    className="flex-1 h-10"
                    preload="metadata"
                  >
                    Your browser does not support audio.
                  </audio>
                </div>
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  🎙️ Voice Greeting
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{FRAME_CSS}</style>
    </div>
  );
});
