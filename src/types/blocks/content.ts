import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle } from './base';

export type ProfileFrameStyle = 'default' | 'none' | 'solid' | 'gradient' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-purple' | 'neon-blue' | 'neon-pink' | 'neon-green' | 'rainbow' | 'rainbow-spin' | 'double' | 'dashed' | 'dotted' | 'glow-pulse' | 'fire' | 'electric' | 'wave' | 'heartbeat' | 'sparkle' | 'glitch';

export type NameAnimationType = 'none' | 'typing' | 'wave' | 'bounce' | 'glow' | 'gradient' | 'shake' | 'pulse' | 'rainbow' | 'neon';

export type VerificationIconColor = 'blue' | 'green' | 'gold' | 'purple' | 'pink' | 'red' | 'white';
export type VerificationIconPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type VerificationIconType = 'check-circle' | 'badge-check' | 'shield-check' | 'verified' | 'star' | 'crown' | 'award' | 'medal' | 'trophy' | 'gem' | 'diamond' | 'sparkles' | 'heart' | 'flame' | 'zap';

export interface ProfileBlock {
    id: string;
    type: 'profile';
    avatar?: string;
    name: string | I18nText | MultilingualString;
    bio: string | I18nText | MultilingualString;
    verified?: boolean;
    verifiedColor?: VerificationIconColor;
    verifiedPosition?: VerificationIconPosition;
    verifiedIcon?: VerificationIconType; // Custom verification icon
    verifiedCustomIcon?: string; // Custom uploaded icon URL (PNG/SVG/GIF)
    autoVerifyPremium?: boolean; // Auto-verify if page owner is premium
    avatarFrame?: ProfileFrameStyle;
    avatarIcon?: string; // Lucide icon name
    nameAnimation?: NameAnimationType; // Name text animation
    coverImage?: string;
    coverGradient?: 'none' | 'dark' | 'light' | 'primary' | 'sunset' | 'ocean' | 'purple';
    coverHeight?: 'small' | 'medium' | 'large';
    avatarSize?: 'small' | 'medium' | 'large' | 'xlarge';
    avatarPosition?: 'left' | 'center' | 'right';
    shadowStyle?: 'none' | 'soft' | 'medium' | 'strong' | 'glow';
    // Proof of Human - video/audio intro
    introVideo?: string; // URL to short intro video
    introAudio?: string; // URL to voice message
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface LinkBlock {
    id: string;
    type: 'link';
    title: string | I18nText | MultilingualString;
    url: string;
    icon?: string;
    iconMode?: 'auto' | 'manual'; // 'auto' = fetch favicon, 'manual' = use custom icon
    faviconUrl?: string; // Cached favicon URL for auto mode
    customIconUrl?: string; // User-uploaded custom icon for manual mode
    style?: 'default' | 'rounded' | 'pill';
    alignment?: 'left' | 'center' | 'right';
    background?: {
        type: 'solid' | 'gradient' | 'image';
        value: string;
        gradientAngle?: number;
    };
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface TextBlock {
    id: string;
    type: 'text';
    content: string | I18nText | MultilingualString;
    style?: 'heading' | 'paragraph' | 'quote';
    alignment?: 'left' | 'center' | 'right';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface VideoBlock {
    id: string;
    type: 'video';
    title: string | I18nText | MultilingualString;
    url: string;
    platform: 'youtube' | 'vimeo';
    aspectRatio?: '16:9' | '4:3' | '1:1';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface CarouselBlock {
    id: string;
    type: 'carousel';
    title?: string | I18nText | MultilingualString;
    images: Array<{
        url: string;
        alt: string | I18nText | MultilingualString;
        link?: string;
    }>;
    autoPlay?: boolean;
    interval?: number;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface ImageBlock {
    id: string;
    type: 'image';
    url: string;
    alt: string | I18nText | MultilingualString;
    caption?: string | I18nText | MultilingualString;
    link?: string;
    style?: 'polaroid' | 'vignette' | 'circle' | 'default' | 'banner';
    alignment?: 'left' | 'center' | 'right';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export type AvatarFrameStyle = 'none' | 'solid' | 'gradient' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-purple' | 'neon-blue' | 'neon-pink' | 'neon-green' | 'rainbow' | 'rainbow-spin' | 'double' | 'dashed' | 'dotted' | 'glow-pulse' | 'fire' | 'electric' | 'wave' | 'heartbeat' | 'sparkle' | 'glitch';

export interface AvatarBlock {
    id: string;
    type: 'avatar';
    imageUrl: string;
    name: string | I18nText | MultilingualString;
    subtitle?: string | I18nText | MultilingualString;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    shape?: 'circle' | 'rounded' | 'square';
    border?: boolean;
    frameStyle?: AvatarFrameStyle;
    borderColor?: string;
    shadow?: 'none' | 'soft' | 'medium' | 'strong' | 'glow';
    alignment?: 'left' | 'center' | 'right';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface SeparatorBlock {
    id: string;
    type: 'separator';
    variant?: 'solid' | 'dashed' | 'dotted' | 'gradient';
    thickness?: 'thin' | 'medium' | 'thick';
    color?: string;
    width?: 'full' | 'half' | 'third';
    spacing?: 'sm' | 'md' | 'lg' | 'xl';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface MapBlock {
    id: string;
    type: 'map';
    address: string | I18nText | MultilingualString;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

// Before/After comparison block
export interface BeforeAfterBlock {
    id: string;
    type: 'before_after';
    title?: string | I18nText | MultilingualString;
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string | I18nText | MultilingualString;
    afterLabel?: string | I18nText | MultilingualString;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

// FAQ Block
export interface FAQItem {
    id: string;
    question: string | I18nText | MultilingualString;
    answer: string | I18nText | MultilingualString;
}

export interface FAQBlock {
    id: string;
    type: 'faq';
    title?: string | I18nText | MultilingualString;
    items: FAQItem[];
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}
