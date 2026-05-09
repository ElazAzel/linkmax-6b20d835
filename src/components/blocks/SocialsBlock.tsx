import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Send from 'lucide-react/dist/esm/icons/send';
import Youtube from 'lucide-react/dist/esm/icons/youtube';
import Music from 'lucide-react/dist/esm/icons/music';
import Twitter from 'lucide-react/dist/esm/icons/twitter';
import Github from 'lucide-react/dist/esm/icons/github';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Globe from 'lucide-react/dist/esm/icons/globe';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Twitch from 'lucide-react/dist/esm/icons/twitch';
import Dribbble from 'lucide-react/dist/esm/icons/dribbble';
import Figma from 'lucide-react/dist/esm/icons/figma';
import Slack from 'lucide-react/dist/esm/icons/slack';
import Chrome from 'lucide-react/dist/esm/icons/chrome';
import Rss from 'lucide-react/dist/esm/icons/rss';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import AtSign from 'lucide-react/dist/esm/icons/at-sign';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Podcast from 'lucide-react/dist/esm/icons/podcast';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { SocialsBlock as SocialsBlockType } from '@/types/page';
import { cn } from '@/lib/utils/utils';

interface SocialsBlockProps {
  block: SocialsBlockType;
  onPlatformClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Social Media
  instagram: Instagram,
  telegram: Send,
  youtube: Youtube,
  tiktok: Music,
  twitter: Twitter,
  x: Twitter,
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  threads: AtSign,
  whatsapp: MessageCircle,
  viber: Phone,
  discord: MessageCircle,
  snapchat: MessageCircle,
  pinterest: Globe,
  reddit: MessageCircle,
  tumblr: Globe,
  vk: Globe,
  ok: Globe,
  wechat: MessageCircle,
  line: MessageCircle,
  kakao: MessageCircle,

  // Professional & Creative
  twitch: Twitch,
  dribbble: Dribbble,
  behance: Globe,
  figma: Figma,
  medium: Globe,
  devto: Globe,
  stackoverflow: Globe,
  producthunt: Globe,

  // Communication
  email: Mail,
  mail: Mail,
  phone: Phone,
  slack: Slack,
  skype: Phone,
  zoom: Calendar,

  // Content
  spotify: Music,
  soundcloud: Music,
  applemusic: Music,
  deezer: Music,
  podcast: Podcast,
  rss: Rss,

  // Other
  website: Globe,
  globe: Globe,
  link: Link2,
  chrome: Chrome,
  maps: MapPin,
  location: MapPin,
};

export const SocialsBlock = memo(function SocialsBlockComponent({ block, onPlatformClick }: SocialsBlockProps) {
  const { i18n } = useTranslation();
  const title = useMemo(() => getI18nText(block.title, i18n.language as SupportedLanguage), [block.title, i18n.language]);

  const handleClick = (url: string) => {
    // Track click first
    if (onPlatformClick) {
      onPlatformClick();
    }
    // Small delay to ensure tracking request is sent
    setTimeout(() => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, 10);
  };

  const justifyClass = block.alignment === 'left' ? 'justify-start'
    : block.alignment === 'right' ? 'justify-end'
      : 'justify-center';

  // Safely filter and process platforms
  const validPlatforms = (block.platforms || []).filter(
    (platform): platform is NonNullable<typeof platform> =>
      platform != null && typeof platform === 'object'
  );

  if (validPlatforms.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className={`text-xs font-medium text-muted-foreground mb-3 ${block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          {title}
        </h3>
      )}
      <div className={`flex items-center ${justifyClass} gap-2 flex-wrap`}>
        {validPlatforms.map((platform, index) => {
          // Support both 'icon' and 'platform' fields (AI generates 'platform', factory uses 'icon')
          const iconName = platform.icon || 'globe';
          const iconKey = typeof iconName === 'string' ? iconName.toLowerCase() : 'globe';
          const Icon = iconMap[iconKey] || Globe;
          const url = platform.url || '';

          if (!url) return null;

          return (
            <button
              key={index}
              onClick={() => handleClick(url)}
              className={cn(
                "group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                "glass-card backdrop-blur-md shadow-glass",
                "hover:shadow-glass-lg active:scale-90"
              )}
              aria-label={platform.name || iconKey}
            >
              <Icon className="w-5 h-5 text-foreground/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
});
