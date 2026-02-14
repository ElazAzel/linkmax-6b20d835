import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Instagram, Send, Youtube, Music, Twitter, Github, Linkedin, Facebook, Globe,
  MessageCircle, Phone, Mail, Twitch, Dribbble, Figma, Slack, 
  Chrome, Rss, Link2, AtSign, MapPin, Calendar, Podcast
} from 'lucide-react';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { SocialsBlock as SocialsBlockType } from '@/types/page';

interface SocialsBlockProps {
  block: SocialsBlockType;
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

export const SocialsBlock = memo(function SocialsBlockComponent({ block }: SocialsBlockProps) {
  const { i18n } = useTranslation();
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  const handleClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
        <h3 className={`text-sm font-medium text-muted-foreground mb-4 ${block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          {title}
        </h3>
      )}
      <div className={`flex items-center ${justifyClass} gap-4 flex-wrap`}>
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
              className="group relative w-14 h-14 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/50 transition-all duration-300 hover:scale-110 hover:shadow-md flex items-center justify-center"
              aria-label={platform.name || iconKey}
            >
              <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors duration-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
});
