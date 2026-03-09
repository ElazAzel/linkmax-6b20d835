/**
 * Block Presets Registry
 * Pre-styled block variants for fast page assembly
 */

import type { BlockType } from '@/types/page';

export interface BlockPreset {
  id: string;
  blockType: BlockType;
  labelKey: string;
  descriptionKey: string;
  category: 'cta' | 'info' | 'social' | 'commerce' | 'media';
  /** Partial overrides merged with createBlock defaults */
  overrides: Record<string, unknown>;
  /** Search keywords for command palette */
  keywords: string[];
}

export const BLOCK_PRESETS: BlockPreset[] = [
  // ── Text presets ──
  {
    id: 'text_headline',
    blockType: 'text',
    labelKey: 'presets.text.headline',
    descriptionKey: 'presets.text.headlineDesc',
    category: 'info',
    overrides: { content: '## Your Headline Here', textAlign: 'center' },
    keywords: ['headline', 'заголовок', 'h2'],
  },
  {
    id: 'text_bio',
    blockType: 'text',
    labelKey: 'presets.text.bio',
    descriptionKey: 'presets.text.bioDesc',
    category: 'info',
    overrides: { content: 'Hi! I\'m a professional who loves what I do. Let me help you achieve your goals.' },
    keywords: ['bio', 'about', 'о себе', 'описание'],
  },
  {
    id: 'text_description',
    blockType: 'text',
    labelKey: 'presets.text.description',
    descriptionKey: 'presets.text.descriptionDesc',
    category: 'info',
    overrides: { content: 'We provide high-quality services tailored to your needs. Contact us to learn more.' },
    keywords: ['description', 'описание', 'услуги'],
  },

  // ── Button presets ──
  {
    id: 'button_cta_primary',
    blockType: 'button',
    labelKey: 'presets.button.cta',
    descriptionKey: 'presets.button.ctaDesc',
    category: 'cta',
    overrides: { label: 'Get Started →', url: '#', style: 'gradient' },
    keywords: ['cta', 'call to action', 'кнопка'],
  },
  {
    id: 'button_whatsapp_cta',
    blockType: 'button',
    labelKey: 'presets.button.whatsapp',
    descriptionKey: 'presets.button.whatsappDesc',
    category: 'cta',
    overrides: { label: '💬 Write on WhatsApp', url: 'https://wa.me/YOUR_NUMBER', icon: 'message-circle', style: 'rounded' },
    keywords: ['whatsapp', 'wa', 'вотсап', 'ватсап', 'мессенджер'],
  },
  {
    id: 'button_book_now',
    blockType: 'button',
    labelKey: 'presets.button.bookNow',
    descriptionKey: 'presets.button.bookNowDesc',
    category: 'cta',
    overrides: { label: '📅 Book Now', url: '#booking', icon: 'calendar', style: 'rounded' },
    keywords: ['book', 'booking', 'запись', 'бронь'],
  },

  // ── Messenger presets ──
  {
    id: 'messenger_whatsapp',
    blockType: 'messenger',
    labelKey: 'presets.messenger.whatsapp',
    descriptionKey: 'presets.messenger.whatsappDesc',
    category: 'social',
    overrides: { platform: 'whatsapp', username: '', welcomeMessage: 'Hi! How can I help you?' },
    keywords: ['whatsapp', 'wa', 'вотсап', 'чат'],
  },
  {
    id: 'messenger_telegram',
    blockType: 'messenger',
    labelKey: 'presets.messenger.telegram',
    descriptionKey: 'presets.messenger.telegramDesc',
    category: 'social',
    overrides: { platform: 'telegram', username: '' },
    keywords: ['telegram', 'tg', 'телеграм'],
  },

  // ── FAQ preset ──
  {
    id: 'faq_starter_3q',
    blockType: 'faq',
    labelKey: 'presets.faq.starter',
    descriptionKey: 'presets.faq.starterDesc',
    category: 'info',
    overrides: {
      items: [
        { question: 'What services do you offer?', answer: 'We offer a wide range of professional services.' },
        { question: 'How can I book?', answer: 'You can book through this page or contact us directly.' },
        { question: 'What are your prices?', answer: 'Please check our pricing section or contact us for a quote.' },
      ],
    },
    keywords: ['faq', 'вопросы', 'чаво', 'questions'],
  },

  // ── Pricing preset ──
  {
    id: 'pricing_services_3',
    blockType: 'pricing',
    labelKey: 'presets.pricing.services',
    descriptionKey: 'presets.pricing.servicesDesc',
    category: 'commerce',
    overrides: {
      items: [
        { name: 'Basic', price: '5000', currency: 'KZT', description: 'Essential service' },
        { name: 'Standard', price: '10000', currency: 'KZT', description: 'Most popular' },
        { name: 'Premium', price: '20000', currency: 'KZT', description: 'Full package' },
      ],
    },
    keywords: ['pricing', 'цены', 'прайс', 'услуги', 'services'],
  },

  // ── Testimonial preset ──
  {
    id: 'testimonial_single',
    blockType: 'testimonial',
    labelKey: 'presets.testimonial.single',
    descriptionKey: 'presets.testimonial.singleDesc',
    category: 'social',
    overrides: {
      items: [
        { author: 'Happy Client', text: 'Amazing service! Highly recommended.' },
      ],
    },
    keywords: ['testimonial', 'review', 'отзыв'],
  },

  // ── Booking preset ──
  {
    id: 'booking_appointment',
    blockType: 'booking',
    labelKey: 'presets.booking.appointment',
    descriptionKey: 'presets.booking.appointmentDesc',
    category: 'commerce',
    overrides: { title: 'Book an Appointment' },
    keywords: ['booking', 'appointment', 'запись', 'бронирование'],
  },

  // ── Socials preset ──
  {
    id: 'socials_instagram_tiktok',
    blockType: 'socials',
    labelKey: 'presets.socials.instaTiktok',
    descriptionKey: 'presets.socials.instaTiktokDesc',
    category: 'social',
    overrides: {
      links: [
        { platform: 'instagram', url: 'https://instagram.com/' },
        { platform: 'tiktok', url: 'https://tiktok.com/@' },
      ],
    },
    keywords: ['socials', 'instagram', 'tiktok', 'соцсети', 'инстаграм'],
  },

  // ── Newsletter preset ──
  {
    id: 'newsletter_subscribe',
    blockType: 'newsletter',
    labelKey: 'presets.newsletter.subscribe',
    descriptionKey: 'presets.newsletter.subscribeDesc',
    category: 'cta',
    overrides: { title: 'Stay Updated', description: 'Get the latest news and updates.' },
    keywords: ['newsletter', 'subscribe', 'рассылка', 'подписка'],
  },
];

/**
 * Find presets matching a search query
 */
export function searchPresets(query: string): BlockPreset[] {
  if (!query) return BLOCK_PRESETS;
  const q = query.toLowerCase();
  return BLOCK_PRESETS.filter(
    (p) =>
      p.id.includes(q) ||
      p.blockType.includes(q) ||
      p.keywords.some((k) => k.includes(q))
  );
}

/**
 * Get presets for a specific block type
 */
export function getPresetsForType(blockType: BlockType): BlockPreset[] {
  return BLOCK_PRESETS.filter((p) => p.blockType === blockType);
}
