export type BlockType = 'profile' | 'link' | 'button' | 'socials' | 'text' | 'image' | 'product' | 'video' | 'carousel' | 'custom_code' | 'messenger' | 'form' | 'download' | 'newsletter' | 'testimonial' | 'scratch' | 'map' | 'avatar' | 'separator' | 'catalog' | 'before_after' | 'faq' | 'countdown' | 'pricing' | 'shoutout' | 'booking' | 'community' | 'event';

// Editor mode is now always 'grid'
export type EditorMode = 'grid';

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
  
  // Content alignment (vertical)
  contentAlignment?: 'top' | 'center' | 'bottom';
  
  // Animation
  hoverEffect?: 'none' | 'scale' | 'glow' | 'lift' | 'fade';
  animation?: 'none' | 'fade-in' | 'slide-up' | 'scale-in' | 'bounce';
  animationDelay?: number; // in milliseconds (0-2000)
  animationSpeed?: 'slow' | 'normal' | 'fast'; // slow: 0.8s, normal: 0.5s, fast: 0.3s
  
  // Paid content access (coming soon)
  isPaidContent?: boolean;
  paidContentPrice?: number;
  paidContentCurrency?: Currency;
}

export interface BlockSchedule {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export type ProfileFrameStyle = 'default' | 'none' | 'solid' | 'gradient' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-purple' | 'neon-blue' | 'neon-pink' | 'neon-green' | 'rainbow' | 'rainbow-spin' | 'double' | 'dashed' | 'dotted' | 'glow-pulse' | 'fire' | 'electric' | 'wave' | 'heartbeat' | 'sparkle' | 'glitch';

export type NameAnimationType = 'none' | 'typing' | 'wave' | 'bounce' | 'glow' | 'gradient' | 'shake' | 'pulse' | 'rainbow' | 'neon';

export type VerificationIconColor = 'blue' | 'green' | 'gold' | 'purple' | 'pink' | 'red' | 'white';
export type VerificationIconPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type VerificationIconType = 'check-circle' | 'badge-check' | 'shield-check' | 'verified' | 'star' | 'crown' | 'award' | 'medal' | 'trophy' | 'gem' | 'diamond' | 'sparkles' | 'heart' | 'flame' | 'zap';

export interface ProfileBlock {
  id: string;
  type: 'profile';
  avatar?: string;
  name: string | MultilingualString;
  bio: string | MultilingualString;
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
  title: string | MultilingualString;
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
  buttonText?: string | MultilingualString;
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
  title?: string | MultilingualString;
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
  alt: string | MultilingualString;
  caption?: string | MultilingualString;
  link?: string;
  style?: 'polaroid' | 'vignette' | 'circle' | 'default' | 'banner';
  alignment?: 'left' | 'center' | 'right';
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
  buttonText?: string | MultilingualString;
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

export type AvatarFrameStyle = 'none' | 'solid' | 'gradient' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-purple' | 'neon-blue' | 'neon-pink' | 'neon-green' | 'rainbow' | 'rainbow-spin' | 'double' | 'dashed' | 'dotted' | 'glow-pulse' | 'fire' | 'electric' | 'wave' | 'heartbeat' | 'sparkle' | 'glitch';

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

// Service types for structured data (GEO-ready)
export type ServiceType = 
  | 'haircut' | 'consultation' | 'training' | 'manicure' 
  | 'lesson' | 'massage' | 'photo' | 'repair' 
  | 'cleaning' | 'delivery' | 'coaching' | 'therapy'
  | 'beauty' | 'medical' | 'legal' | 'financial'
  | 'other';

// Pricing Block with structured service data
export interface PricingItem {
  id: string;
  name: string | MultilingualString;
  description?: string | MultilingualString;
  price: number;
  currency?: Currency;
  period?: string | MultilingualString; // e.g., "per hour", "per session"
  featured?: boolean;
  // Structured service data for GEO
  serviceType?: ServiceType;
  duration?: number; // duration in minutes
  priceType?: 'fixed' | 'range' | 'from';
  priceMax?: number; // for range pricing
  isBookable?: boolean; // can be booked via Booking block
  availableDays?: ('weekdays' | 'weekends' | 'everyday' | 'by_appointment')[];
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

// Community Block - for private Telegram channels/groups
export interface CommunityBlock {
  id: string;
  type: 'community';
  title?: string | MultilingualString;
  description?: string | MultilingualString;
  telegramLink: string;
  icon?: 'users' | 'crown' | 'star' | 'heart' | 'zap' | 'lock';
  memberCount?: string; // e.g., "500+ участников"
  style?: 'default' | 'premium' | 'exclusive';
  buttonText?: string | MultilingualString;
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
  // Telegram notification settings
  dailyReminderEnabled?: boolean; // Send daily reminder about today's bookings
  dailyReminderTime?: string; // Time for daily reminder in HH:MM format (default: 08:50)
  weeklyMotivationEnabled?: boolean; // Send weekly motivation on Mondays at 9:00
  buttonText?: string | MultilingualString; // Custom button text
  isPremium: true;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export type EventLocationType = 'online' | 'offline';

// Extended field types matching Google Forms capabilities
export type EventFieldType =
  | 'short_text'      // Single line text
  | 'long_text'       // Multi-line paragraph
  | 'email'           // Email with validation
  | 'phone'           // Phone number
  | 'number'          // Numeric input
  | 'dropdown'        // Single select dropdown
  | 'single_choice'   // Radio buttons
  | 'multiple_choice' // Checkboxes (multiple select)
  | 'date'            // Date picker
  | 'time'            // Time picker
  | 'datetime'        // Date and time
  | 'checkbox'        // Single agreement checkbox
  | 'url'             // URL with validation
  | 'linear_scale'    // 1-10 scale rating
  | 'rating'          // Star rating (1-5)
  | 'grid'            // Multiple choice grid
  | 'checkbox_grid'   // Checkbox grid
  | 'media'           // Media section (Pro)
  | 'file'            // File upload (Pro)
  | 'section_header'  // Section divider with title
  | 'description';    // Description/instruction text

export interface EventFieldOption {
  id: string;
  label_i18n: MultilingualString;
  goToSection?: string; // Section navigation for conditional logic
}

export interface EventFormSection {
  id: string;
  title_i18n: MultilingualString;
  description_i18n?: MultilingualString;
  fieldIds: string[]; // Fields belonging to this section
}

export interface LinearScaleConfig {
  min: number;
  max: number;
  minLabel_i18n?: MultilingualString;
  maxLabel_i18n?: MultilingualString;
}

export interface FieldGridConfig {
  rows: EventFieldOption[];
  columns: EventFieldOption[];
}

export interface EventFormField {
  id: string;
  type: EventFieldType;
  label_i18n: MultilingualString;
  placeholder_i18n?: MultilingualString;
  helpText_i18n?: MultilingualString;
  required?: boolean;
  options?: EventFieldOption[];
  sectionId?: string; // Which section this field belongs to
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  // Type-specific configs
  linearScale?: LinearScaleConfig;
  grid?: FieldGridConfig;
  // Conditional logic
  showIf?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_empty';
    value?: string | string[];
  };
}

export interface EventBlock {
  id: string;
  type: 'event';
  eventId: string;
  title: MultilingualString;
  description?: MultilingualString;
  coverUrl?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  registrationClosesAt?: string;
  locationType?: EventLocationType;
  locationValue?: string;
  capacity?: number;
  isPaid?: boolean;
  price?: number;
  currency?: Currency;
  status?: 'draft' | 'published' | 'closed';
  formFields?: EventFormField[];
  formSections?: EventFormSection[];
  settings?: {
    requireApproval?: boolean;
    allowDuplicateEmail?: boolean;
    note?: string;
    showProgressBar?: boolean;
    shuffleQuestions?: boolean;
    confirmationMessage_i18n?: MultilingualString;
  };
  buttonText?: MultilingualString; // Custom button text
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

// Block size presets - optimized for mobile-first responsive grid
// gridCols: 1 = full width, 2 = half width (2 per row max)
export type BlockSizePreset = 
  | 'full'        // Full width block
  | 'half';       // Half width block (2 per row)

export const BLOCK_SIZE_DIMENSIONS: Record<BlockSizePreset, { gridCols: 1 | 2 }> = {
  'full': { gridCols: 1 },
  'half': { gridCols: 2 },
};

// Base block type with optional grid layout
interface BlockGridProps {
  gridLayout?: GridLayoutData;
  blockSize?: BlockSizePreset;
  createdAt?: string;
}

export type Block = (ProfileBlock | LinkBlock | ButtonBlock | SocialsBlock | TextBlock | ImageBlock | ProductBlock | VideoBlock | CarouselBlock | CustomCodeBlock | MessengerBlock | FormBlock | DownloadBlock | NewsletterBlock | TestimonialBlock | ScratchBlock | MapBlock | AvatarBlock | SeparatorBlock | CatalogBlock | BeforeAfterBlock | FAQBlock | CountdownBlock | PricingBlock | ShoutoutBlock | BookingBlock | CommunityBlock | EventBlock) & BlockGridProps;

// Page background configuration
export interface PageBackground {
  type: 'solid' | 'gradient' | 'image';
  value: string; // color hex, gradient css, or image url
  gradientAngle?: number;
}

export interface PageTheme {
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  buttonStyle: 'default' | 'rounded' | 'pill' | 'gradient';
  fontFamily: 'sans' | 'serif' | 'mono';
  darkMode?: boolean;
  // Custom page background (business only)
  customBackground?: PageBackground;
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

export interface PageData {
  id: string;
  userId?: string;
  slug?: string;
  blocks: Block[];
  theme: PageTheme;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  isPremium?: boolean;
  isPublished?: boolean;
  isIndexable?: boolean;
  viewCount?: number;
  metrics?: PageMetrics;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  niche?: string;
  previewUrl?: string; // Custom preview image for gallery
}
