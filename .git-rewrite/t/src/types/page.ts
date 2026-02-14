export type BlockType = 'profile' | 'link' | 'button' | 'socials' | 'text' | 'image' | 'product' | 'video' | 'carousel' | 'search' | 'custom_code' | 'messenger' | 'form' | 'download' | 'newsletter' | 'testimonial' | 'scratch' | 'map' | 'avatar' | 'separator' | 'catalog' | 'before_after' | 'faq' | 'countdown' | 'pricing' | 'shoutout' | 'booking';

// Multilingual string support
import type { MultilingualString } from '@/lib/i18n-helpers';

// Extended style system for all blocks
export interface BlockStyle {
  // Spacing
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Border
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
  borderColor?: string;
  
  // Shadow
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  
  // Background
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundOpacity?: number;
  
  // Animation
  hoverEffect?: 'none' | 'scale' | 'glow' | 'lift' | 'fade';
  animation?: 'none' | 'fade-in' | 'slide-up' | 'scale-in' | 'bounce';
  animationDelay?: number; // in milliseconds (0-2000)
  animationSpeed?: 'slow' | 'normal' | 'fast'; // slow: 0.8s, normal: 0.5s, fast: 0.3s
}

export interface BlockSchedule {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export type ProfileFrameStyle = 'default' | 'none' | 'solid' | 'gradient' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-purple' | 'neon-blue' | 'neon-pink' | 'neon-green' | 'rainbow' | 'rainbow-spin' | 'double' | 'dashed' | 'dotted' | 'glow-pulse';

export interface ProfileBlock {
  id: string;
  type: 'profile';
  avatar?: string;
  name: string | MultilingualString;
  bio: string | MultilingualString;
  verified?: boolean;
  avatarFrame?: ProfileFrameStyle;
  avatarIcon?: string; // Lucide icon name
  coverImage?: string;
  coverGradient?: 'none' | 'dark' | 'light' | 'primary' | 'sunset' | 'ocean' | 'purple';
  coverHeight?: 'small' | 'medium' | 'large';
  avatarSize?: 'small' | 'medium' | 'large' | 'xlarge';
  avatarPosition?: 'left' | 'center' | 'right';
  shadowStyle?: 'none' | 'soft' | 'medium' | 'strong' | 'glow';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface LinkBlock {
  id: string;
  type: 'link';
  title: string | MultilingualString;
  url: string;
  icon?: string;
  style?: 'default' | 'rounded' | 'pill';
  alignment?: 'left' | 'center' | 'right';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface TextBlock {
  id: string;
  type: 'text';
  content: string | MultilingualString;
  style?: 'heading' | 'paragraph' | 'quote';
  alignment?: 'left' | 'center' | 'right';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export type Currency = 'KZT' | 'RUB' | 'BYN' | 'AMD' | 'AZN' | 'KGS' | 'TJS' | 'TMT' | 'UZS' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'CHF' | 'CAD' | 'AUD';

export interface ProductBlock {
  id: string;
  type: 'product';
  name: string | MultilingualString;
  description: string | MultilingualString;
  price: number;
  currency: Currency;
  image?: string;
  buyLink?: string;
  alignment?: 'left' | 'center' | 'right';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface VideoBlock {
  id: string;
  type: 'video';
  title: string | MultilingualString;
  url: string;
  platform: 'youtube' | 'vimeo';
  aspectRatio?: '16:9' | '4:3' | '1:1';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface CarouselBlock {
  id: string;
  type: 'carousel';
  title?: string | MultilingualString;
  images: Array<{
    url: string;
    alt: string | MultilingualString;
    link?: string;
  }>;
  autoPlay?: boolean;
  interval?: number;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface ButtonBlock {
  id: string;
  type: 'button';
  title: string | MultilingualString;
  url: string;
  background?: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
    gradientAngle?: number;
  };
  hoverEffect?: 'glow' | 'scale' | 'shadow' | 'none';
  alignment?: 'left' | 'center' | 'right';
  width?: 'full' | 'medium' | 'small';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface SocialsBlock {
  id: string;
  type: 'socials';
  title?: string;
  platforms: Array<{
    name: string;
    url: string;
    icon: string;
  }>;
  alignment?: 'left' | 'center' | 'right';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  link?: string;
  style?: 'polaroid' | 'vignette' | 'circle' | 'default' | 'banner';
  alignment?: 'left' | 'center' | 'right';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface SearchBlock {
  id: string;
  type: 'search';
  title?: string | MultilingualString;
  placeholder?: string | MultilingualString;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface CustomCodeBlock {
  id: string;
  type: 'custom_code';
  title?: string | MultilingualString;
  html: string;
  css?: string;
  javascript?: string;
  height?: 'auto' | 'small' | 'medium' | 'large' | 'full';
  enableInteraction?: boolean;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface MessengerBlock {
  id: string;
  type: 'messenger';
  title?: string | MultilingualString;
  messengers: Array<{
    platform: 'whatsapp' | 'telegram' | 'viber' | 'wechat';
    username: string;
    message?: string;
  }>;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface FormBlock {
  id: string;
  type: 'form';
  title: string | MultilingualString;
  fields: Array<{
    name: string | MultilingualString;
    type: 'text' | 'email' | 'phone' | 'textarea';
    required: boolean;
    placeholder?: string | MultilingualString;
  }>;
  submitEmail: string;
  buttonText: string | MultilingualString;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface DownloadBlock {
  id: string;
  type: 'download';
  title: string | MultilingualString;
  description?: string | MultilingualString;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  icon?: string;
  alignment?: 'left' | 'center' | 'right';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface NewsletterBlock {
  id: string;
  type: 'newsletter';
  title: string | MultilingualString;
  description?: string | MultilingualString;
  buttonText: string | MultilingualString;
  apiEndpoint?: string;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface TestimonialBlock {
  id: string;
  type: 'testimonial';
  title?: string | MultilingualString;
  testimonials: Array<{
    name: string | MultilingualString;
    text: string | MultilingualString;
    rating?: number;
    avatar?: string;
    role?: string | MultilingualString;
  }>;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface ScratchBlock {
  id: string;
  type: 'scratch';
  title?: string | MultilingualString;
  revealText: string | MultilingualString;
  scratchImage?: string;
  backgroundColor?: string;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface MapBlock {
  id: string;
  type: 'map';
  address: string | MultilingualString;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export type AvatarFrameStyle = 'none' | 'solid' | 'gradient' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-purple' | 'neon-blue' | 'neon-pink' | 'neon-green' | 'rainbow' | 'rainbow-spin' | 'double' | 'dashed' | 'dotted' | 'glow-pulse';

export interface AvatarBlock {
  id: string;
  type: 'avatar';
  imageUrl: string;
  name: string | MultilingualString;
  subtitle?: string | MultilingualString;
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

export interface CatalogCategory {
  id: string;
  name: string | MultilingualString;
}

export interface CatalogItem {
  id: string;
  name: string | MultilingualString;
  description?: string | MultilingualString;
  price?: number;
  currency?: Currency;
  image?: string;
  categoryId?: string;
}

export interface CatalogBlock {
  id: string;
  type: 'catalog';
  title?: string | MultilingualString;
  categories?: CatalogCategory[];
  items: CatalogItem[];
  layout?: 'list' | 'grid';
  showPrices?: boolean;
  currency?: Currency;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Before/After comparison block
export interface BeforeAfterBlock {
  id: string;
  type: 'before_after';
  title?: string | MultilingualString;
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string | MultilingualString;
  afterLabel?: string | MultilingualString;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// FAQ Block
export interface FAQItem {
  id: string;
  question: string | MultilingualString;
  answer: string | MultilingualString;
}

export interface FAQBlock {
  id: string;
  type: 'faq';
  title?: string | MultilingualString;
  items: FAQItem[];
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Countdown Timer Block
export interface CountdownBlock {
  id: string;
  type: 'countdown';
  title?: string | MultilingualString;
  targetDate: string; // ISO date string
  expiredText?: string | MultilingualString;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Pricing Block
export interface PricingItem {
  id: string;
  name: string | MultilingualString;
  description?: string | MultilingualString;
  price: number;
  currency?: Currency;
  period?: string | MultilingualString; // e.g., "per hour", "per session"
  featured?: boolean;
}

export interface PricingBlock {
  id: string;
  type: 'pricing';
  title?: string | MultilingualString;
  items: PricingItem[];
  currency?: Currency;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Shoutout Block - recommend other users
export interface ShoutoutBlock {
  id: string;
  type: 'shoutout';
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  message?: string | MultilingualString;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Booking Block - appointment scheduling
export interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface BookingBlock {
  id: string;
  type: 'booking';
  title?: string | MultilingualString;
  description?: string | MultilingualString;
  workingHoursStart?: number;
  workingHoursEnd?: number;
  slotDuration?: number;
  slots?: BookingSlot[];
  disabledWeekdays?: number[];
  maxBookingDays?: number;
  requirePhone?: boolean;
  requireEmail?: boolean;
  requirePrepayment?: boolean;
  prepaymentPhone?: string; // WhatsApp phone for payment
  prepaymentAmount?: number;
  prepaymentCurrency?: Currency;
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Base block type with optional grid layout
interface BlockGridProps {
  gridLayout?: GridLayoutData;
  createdAt?: string;
}

export type Block = (ProfileBlock | LinkBlock | ButtonBlock | SocialsBlock | TextBlock | ImageBlock | ProductBlock | VideoBlock | CarouselBlock | SearchBlock | CustomCodeBlock | MessengerBlock | FormBlock | DownloadBlock | NewsletterBlock | TestimonialBlock | ScratchBlock | MapBlock | AvatarBlock | SeparatorBlock | CatalogBlock | BeforeAfterBlock | FAQBlock | CountdownBlock | PricingBlock | ShoutoutBlock | BookingBlock) & BlockGridProps;

export interface PageTheme {
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  buttonStyle: 'default' | 'rounded' | 'pill' | 'gradient';
  fontFamily: 'sans' | 'serif' | 'mono';
  darkMode?: boolean;
}

export interface PageMetrics {
  googleAnalytics?: string;
  facebookPixel?: string;
  yandexMetrika?: string;
  tiktokPixel?: string;
}

// Grid layout data for blocks
export interface GridLayoutData {
  gridColumn?: number;    // starting column (1-based)
  gridRow?: number;       // starting row (1-based)
  gridWidth?: number;     // width in cells (1-4)
  gridHeight?: number;    // height in cells (1-4)
}

// Grid configuration for pages
export interface GridConfig {
  columnsDesktop: number;   // 3-4 for desktop
  columnsMobile: number;    // 2 for mobile
  gapSize: number;          // gap between blocks in px
  cellHeight: number;       // cell height in px
}

// Editor mode type
export type EditorMode = 'linear' | 'grid';

export interface PageData {
  id: string;
  userId?: string;
  blocks: Block[];
  theme: PageTheme;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  isPremium?: boolean;
  metrics?: PageMetrics;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  niche?: string;
  previewUrl?: string; // Custom preview image for gallery
}
