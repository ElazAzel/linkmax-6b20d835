import { memo, useMemo, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { parseRichText } from '@/lib/rich-text-parser';
import { getFrameStyles, getShadowStyles, isGradientFrame, FRAME_CSS, getVerificationPositionClasses, getVerificationColor, VERIFICATION_ICON_OPTIONS } from '@/lib/avatar-frame-utils';
import { getLucideIcon, CheckCircle2 } from '@/lib/utils/icon-utils';
import { cn } from '@/lib/utils/utils';
import { VerifiedBadge } from './VerifiedBadge';
import { LINKMAX_UI_V2 } from '@/lib/ui-v2';
import { NAME_ANIMATION_CSS, getNameAnimationClass, type NameAnimationType } from '@/lib/profile-frame-system';
import {
  getAvatarShapeStyle,
  getStatusRingConfig,
  getCoverPatternStyle,
  coverHeightClass,
} from '@/lib/profile-shapes';
import type { ProfileBlock as ProfileBlockType, ProfileFrameStyle, VerificationIconType } from '@/types/page';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';

interface ProfileBlockProps {
  block: ProfileBlockType;
  isPreview?: boolean;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
  isOwnerVerified?: boolean;
}

// Custom verification badge component for user-selected styling
const CustomVerificationBadge = memo(function CustomVerificationBadgeComponent({
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
  const IconComponent = getLucideIcon(iconName, CheckCircle2);

  return (
    <div
      className={cn(
        "absolute rounded-full p-1 sm:p-1.5 shadow-lg z-10 flex-shrink-0",
        getVerificationPositionClasses(position)
      )}
      style={{ backgroundColor: getVerificationColor(color) }}
    >
      <Suspense fallback={<div className="h-3.5 w-3.5 sm:h-4 sm:w-4 bg-white/20 rounded-full" />}>
        <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="currentColor" />
      </Suspense>
    </div>
  );
});

export const ProfileBlock = memo(function ProfileBlockComponent({
  block,
  isPreview,
  isOwnerPremium,
  ownerTier,
  isOwnerVerified = false
}: ProfileBlockProps) {
  const { t, i18n } = useTranslation();
  const name = getI18nText(block.name, i18n.language as SupportedLanguage);
  const bio = getI18nText(block.bio, i18n.language as SupportedLanguage);

  // Pro tier users are considered premium
  const isPremiumUser = ownerTier === 'pro' || isOwnerPremium;

  // Use platform verification status + premium status for badge
  const showPlatformBadge = isOwnerVerified || isPremiumUser;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAvatarSize = () => {
    const size = block.avatarSize || 'medium';
    switch (size) {
      case 'small': return 'h-16 w-16';
      case 'medium': return 'h-24 w-24';
      case 'large': return 'h-32 w-32';
      case 'xlarge': return 'h-40 w-40';
      default: return 'h-32 w-32';
    }
  };

  const getFrameSize = () => {
    const size = block.avatarSize || 'medium';
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

  const getCoverHeight = () => coverHeightClass(block.coverHeight);

  const frameStyle: ProfileFrameStyle = block.avatarFrame || 'none';
  const hasGradientFrame = isGradientFrame(frameStyle);

  // Get icon component dynamically
  const getIconComponent = () => {
    if (!block.avatarIcon) return null;
    const IconComp = getLucideIcon(block.avatarIcon);
    return IconComp !== CheckCircle2 ? IconComp : null;
  };

  const IconComponent = getIconComponent();

  // Cover parallax (Premium: block.coverParallax)
  const coverRef = useRef<HTMLDivElement | null>(null);
  const [parallaxY, setParallaxY] = useState(0);
  useEffect(() => {
    if (!block.coverParallax || !coverRef.current) return;
    const el = coverRef.current;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // -20px..+20px based on element position vs viewport
        const pct = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
        setParallaxY(-pct * 24);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [block.coverParallax]);

  const avatarShapeStyle = getAvatarShapeStyle(block.avatarShape || 'circle');
  const statusRing = getStatusRingConfig(block.statusRing);
  const showStatusRing = statusRing.value !== 'none';
  // Avoid double rings when a decorative frame is already drawn around the avatar
  const drawStatusRing = showStatusRing && (block.avatarFrame || 'default') === 'default';
  const patternStyle = getCoverPatternStyle(block.coverPattern);
  const hasCoverMedia = !!(block.coverImage || block.coverVideo);
  // Korner-style header for every page, old and new: cover on top of the
  // card, an 80px round avatar on the left with the name beside it, the bio
  // full width below. It used to apply only to profiles without a saved
  // avatarPosition, so every older page kept the large centred layout.
  const compact = LINKMAX_UI_V2;

  return (
    <div className={cn('relative flex min-w-0 flex-col overflow-visible', getPositionClass(), compact && 'lm-profile-compact')}>
      {hasCoverMedia && (
        <div ref={coverRef} className={`relative w-full rounded-t-[var(--lm-block-radius,24px)] ${getCoverHeight()} overflow-hidden`}>
          {block.coverVideo ? (
            <video
              src={block.coverVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: `translate3d(0, ${parallaxY}px, 0) scale(${block.coverParallax ? 1.08 : 1})` }}
            />
          ) : (
            <img
              src={block.coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: `translate3d(0, ${parallaxY}px, 0) scale(${block.coverParallax ? 1.08 : 1})` }}
            />
          )}
          {block.coverGradient && block.coverGradient !== 'none' && (
            <div className={`absolute inset-0 ${getCoverGradient()}`} />
          )}
          {block.coverPattern && block.coverPattern !== 'none' && (
            <div className="absolute inset-0 pointer-events-none" style={patternStyle} />
          )}
        </div>
      )}

      <div className={cn(
        'lm-profile-body flex min-w-0 flex-col w-full',
        compact
          // Only the avatar overlaps the cover; the name starts below it and
          // wraps downwards, so a long name never runs onto the picture.
          ? cn('lm-profile-row relative z-[1] grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 px-5 pb-5', hasCoverMedia ? 'items-start' : 'pt-5 items-center')
          : cn(getPositionClass(), 'gap-4 p-4', hasCoverMedia && '-mt-16'),
      )}>
        {/* Outer container for positioning icon - no animation here */}
        <div className={cn('lm-profile-avatar relative', compact && hasCoverMedia && '-mt-10')}>
          {/* Status ring - outer glow */}
          {drawStatusRing && (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute -inset-1.5 rounded-full',
                statusRing.pulse && 'animate-pulse'
              )}
              style={{
                boxShadow: `0 0 0 2px ${statusRing.color}`,
                borderRadius: (avatarShapeStyle.borderRadius as string) || '9999px',
              }}
            />
          )}

          {/* Frame wrapper - animations and shadow apply here ONLY */}
          <div
            className={cn(
              "flex items-center justify-center",
              compact ? 'h-[88px] w-[88px]' : getFrameSize(),
            )}
            style={{
              ...getShadowStyles(block.shadowStyle || 'none'),
              ...getFrameStyles(frameStyle),
              ...(!block.avatarFrame ? { border: '4px solid hsl(var(--card))' } : {}),
              ...avatarShapeStyle,
            }}
          >
            {/* Avatar - NO animation, NO shadow - completely static */}
            <Avatar className={cn(compact ? 'h-20 w-20' : getAvatarSize(), 'bg-background')} style={avatarShapeStyle}>
              <AvatarImage src={block.avatar} alt={name} className="object-cover" />
              <AvatarFallback className={cn('text-2xl font-semibold', compact ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground')}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Icon badge */}
          {IconComponent && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg z-10">
              <Suspense fallback={<div className="h-4 w-4 bg-primary-foreground/20 rounded-full" />}>
                <IconComponent className="h-4 w-4" />
              </Suspense>
            </div>
          )}

          {/* Status label chip (in the Korner layout it sits by the name) */}
          {showStatusRing && statusRing.value !== 'none' && !compact && (
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow"
              style={{ backgroundColor: statusRing.color }}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full bg-white/90', statusRing.pulse && 'animate-pulse')} />
              {t(`profile.statusRingLabel.${statusRing.value}`, statusRing.label)}
            </div>
          )}

          {/* Platform verification badge - shows based on actual verification + premium status */}
          {showPlatformBadge && !compact && (
            <div className={cn("absolute z-10", getVerificationPositionClasses(block.verifiedPosition || 'bottom-right'))}>
              <VerifiedBadge
                isVerified={isOwnerVerified}
                isPremium={isPremiumUser}
                size="md"
              />
            </div>
          )}

          {/* Custom user-defined badge (if manually set and different from platform badge) */}
          {block.verified && !showPlatformBadge && (
            <CustomVerificationBadge
              iconType={block.verifiedIcon}
              customIcon={block.verifiedCustomIcon}
              color={block.verifiedColor}
              position={block.verifiedPosition || 'bottom-right'}
            />
          )}
        </div>

        {/* In the Korner layout the copy's children join the grid: the name sits
            beside the avatar, bio and badges span the full width below. */}
        <div className={cn('lm-profile-copy w-full min-w-0 overflow-visible', compact ? 'contents text-left' : 'space-y-2 text-center')}>
          <style>{NAME_ANIMATION_CSS}</style>
          <div className={cn(
            "lm-profile-name flex min-w-0 items-center gap-2",
            compact ? cn("flex-wrap justify-start text-left", hasCoverMedia && "pt-3") : "justify-center",
            block.nameAnimation === 'ticker' ? "overflow-hidden w-full" : "overflow-visible"
          )}>
            <h1 className={cn(
              "max-w-full font-bold tracking-tight leading-[1.1] [text-wrap:balance] break-words hyphens-auto transition-all duration-300 overflow-visible",
              // Long names (organisations) get a smaller size so words do not break mid-word.
              compact ? (name.length > 22 ? "text-[19px] leading-snug" : "text-[22px] leading-tight") : "text-[1.75rem] sm:text-3xl",
              // The Korner header keeps the name plain and solid: shine and
              // gradient effects made parts of it transparent on covers.
              compact && "text-foreground",
              !compact && block.nameAnimation === 'none' && "hover:text-primary",
              !compact && (block.nameAnimation && block.nameAnimation !== 'none' && !['shine','ticker','underline-draw','glitch','rainbow-slow'].includes(block.nameAnimation)) && "text-gradient bg-[length:200%_auto] animate-gradient-x",
              !compact && getNameAnimationClass((block.nameAnimation as NameAnimationType) || 'none')
            )}>
              {name}
            </h1>
            {showPlatformBadge && compact && (
              <VerifiedBadge isVerified={isOwnerVerified} isPremium={isPremiumUser} size="sm" />
            )}
            {compact && showStatusRing && (
              // Neutral chip with a coloured dot: white text on the status
              // green was 2.3:1, below readable contrast.
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', statusRing.pulse && 'animate-pulse')} style={{ backgroundColor: statusRing.color }} />
                {t(`profile.statusRingLabel.${statusRing.value}`, statusRing.label)}
              </span>
            )}
          </div>

          {bio && (
            <p className={cn('lm-profile-bio text-[15px] text-muted-foreground whitespace-pre-line break-words leading-relaxed [text-wrap:pretty]', compact ? 'col-span-2 max-w-none text-left' : 'mx-auto max-w-md')}>{parseRichText(bio)}</p>
          )}

          {/* Profile badge row (city / status / emoji / custom) */}
          {block.badges && block.badges.length > 0 && (
            <div className={cn('lm-profile-badges flex flex-wrap items-center gap-1.5', compact ? 'col-span-2 justify-start' : 'justify-center pt-1')}>
              {block.badges.map((b) => {
                const Icon = b.icon ? getLucideIcon(b.icon) : null;
                return (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/90 backdrop-blur-sm"
                    style={b.color ? { borderColor: b.color, color: b.color } : undefined}
                  >
                    {b.emoji && <span aria-hidden>{b.emoji}</span>}
                    {Icon && Icon !== CheckCircle2 && (
                      <Suspense fallback={null}>
                        <Icon className="h-3.5 w-3.5" />
                      </Suspense>
                    )}
                    <span className="truncate max-w-[140px]">{b.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Proof of Human - Video/Audio Greeting */}
        {(block.introVideo || block.introAudio) && (
          <div className={cn('w-full max-w-md mx-auto space-y-3', compact ? 'col-span-2' : 'mt-4')}>
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
