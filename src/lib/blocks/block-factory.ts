import type { Block, BlockSizePreset } from '@/types/page';
import { createMultilingualString } from '@/lib/i18n-helpers';

// Default size for new blocks
const DEFAULT_BLOCK_SIZE: BlockSizePreset = 'full';

const generateUuid = () =>
  crypto.randomUUID?.() ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });

type BlockGenerator = (id: string, overrides?: Record<string, any>) => any;

const BLOCK_GENERATORS: Record<string, BlockGenerator> = {
  profile: (id, overrides) => ({
    id,
    type: 'profile',
    name: 'Your Name',
    bio: 'Tell people about yourself',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    verified: false,
    avatarFrame: 'default',
    coverImage: '',
    coverGradient: 'none',
    coverHeight: 'medium',
    avatarSize: 'large',
    avatarPosition: 'center',
    shadowStyle: 'soft',
    ...overrides,
  }),

  link: (id, overrides) => ({
    id,
    type: 'link',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'New Link',
    url: 'https://example.com',
    icon: 'globe',
    style: 'rounded',
    blockStyle: {
      padding: 'md',
      borderRadius: 'lg',
      hoverEffect: 'lift',
      animation: 'fade-in',
    },
    ...overrides,
  }),

  button: (id, overrides) => ({
    id,
    type: 'button',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Click Me',
    url: 'https://example.com',
    background: { type: 'gradient', value: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' },
    hoverEffect: 'glow',
    blockStyle: {
      padding: 'md',
      borderRadius: 'full',
      shadow: 'md',
      animation: 'scale-in',
      hoverEffect: 'glow',
    },
    ...overrides,
  }),

  text: (id, overrides) => ({
    id,
    type: 'text',
    blockSize: DEFAULT_BLOCK_SIZE,
    content: 'Enter your text here',
    style: 'paragraph',
    blockStyle: {
      padding: 'md',
      animation: 'fade-in',
    },
    ...overrides,
  }),

  image: (id, overrides) => ({
    id,
    type: 'image',
    blockSize: DEFAULT_BLOCK_SIZE,
    url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800',
    alt: 'Beautiful workspace',
    style: 'default',
    blockStyle: {
      padding: 'none',
      borderRadius: 'lg',
      shadow: 'md',
      animation: 'fade-in',
    },
    ...overrides,
  }),

  socials: (id, overrides) => ({
    id,
    type: 'socials',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Follow Me',
    platforms: [
      { name: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
      { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
    ],
    ...overrides,
  }),

  product: (id, overrides) => ({
    id,
    type: 'product',
    blockSize: DEFAULT_BLOCK_SIZE,
    name: 'New Product',
    description: 'Product description',
    price: 9900,
    currency: 'KZT',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    buyLink: 'https://example.com',
    blockStyle: {
      padding: 'lg',
      borderRadius: 'lg',
      shadow: 'md',
      animation: 'slide-up',
      hoverEffect: 'lift',
    },
    ...overrides,
  }),

  video: (id, overrides) => ({
    id,
    type: 'video',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'My Video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'youtube',
    aspectRatio: '16:9',
    blockStyle: {
      borderRadius: 'lg',
      shadow: 'lg',
      animation: 'fade-in',
    },
    ...overrides,
  }),

  carousel: (id, overrides) => ({
    id,
    type: 'carousel',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Gallery',
    images: [
      { url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800', alt: 'Image 1' },
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', alt: 'Image 2' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', alt: 'Image 3' },
    ],
    autoPlay: true,
    interval: 5000,
    blockStyle: {
      borderRadius: 'lg',
      shadow: 'lg',
      animation: 'scale-in',
    },
    ...overrides,
  }),

  custom_code: (id, overrides) => ({
    id,
    type: 'custom_code',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Custom Code',
    html: '<div>Your custom HTML here</div>',
    css: '',
    javascript: '',
    height: 'auto',
    enableInteraction: true,
    ...overrides,
  }),

  messenger: (id, overrides) => ({
    id,
    type: 'messenger',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Contact Me',
    messengers: [
      { platform: 'whatsapp', username: '+1234567890', message: 'Hello!' },
      { platform: 'telegram', username: 'username' },
    ],
    ...overrides,
  }),

  form: (id, overrides) => ({
    id,
    type: 'form',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Contact Form',
    fields: [
      { name: 'Name', type: 'text', required: true, placeholder: 'Your name' },
      { name: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
      { name: 'Message', type: 'textarea', required: false, placeholder: 'Your message' },
    ],
    submitEmail: '',
    buttonText: 'Send',
    ...overrides,
  }),

  download: (id, overrides) => ({
    id,
    type: 'download',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Download File',
    description: 'Click to download',
    fileUrl: '',
    fileName: 'document.pdf',
    fileSize: '2.5 MB',
    icon: 'file-text',
    ...overrides,
  }),

  newsletter: (id, overrides) => ({
    id,
    type: 'newsletter',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Subscribe to Newsletter',
    description: 'Get the latest updates',
    buttonText: 'Subscribe',
    ...overrides,
  }),

  testimonial: (id, overrides) => ({
    id,
    type: 'testimonial',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'What People Say',
    testimonials: [
      { name: 'Алина К.', text: 'Отличный сервис! Очень рекомендую.', rating: 5, role: 'Клиент' },
      { name: 'Дмитрий М.', text: 'Профессиональный подход к делу.', rating: 5, role: 'Клиент' },
    ],
    blockStyle: {
      padding: 'lg',
      borderRadius: 'lg',
      backgroundGradient: 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted)/0.5))',
      animation: 'scale-in',
    },
    ...overrides,
  }),

  scratch: (id, overrides) => ({
    id,
    type: 'scratch',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Scratch to Reveal',
    revealText: 'You won a prize!',
    backgroundColor: '#FFD700',
    ...overrides,
  }),

  map: (id, overrides) => ({
    id,
    type: 'map',
    blockSize: DEFAULT_BLOCK_SIZE,
    address: 'New York, USA',
    ...overrides,
  }),

  avatar: (id, overrides) => ({
    id,
    type: 'avatar',
    blockSize: DEFAULT_BLOCK_SIZE,
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    name: 'Your Name',
    subtitle: 'Your title',
    size: 'large',
    shape: 'circle',
    alignment: 'center',
    ...overrides,
  }),

  separator: (id, overrides) => ({
    id,
    type: 'separator',
    blockSize: DEFAULT_BLOCK_SIZE,
    variant: 'solid',
    thickness: 'thin',
    width: 'full',
    spacing: 'md',
    ...overrides,
  }),

  catalog: (id, overrides) => ({
    id,
    type: 'catalog',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Our Products',
    items: [
      { id: '1', name: 'Product 1', description: 'Description', price: 1000, currency: 'KZT' },
      { id: '2', name: 'Product 2', description: 'Description', price: 2000, currency: 'KZT' },
    ],
    layout: 'grid',
    showPrices: true,
    currency: 'KZT',
    isPremium: true,
    ...overrides,
  }),

  before_after: (id, overrides) => ({
    id,
    type: 'before_after',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Before & After',
    beforeImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    afterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    beforeLabel: 'До',
    afterLabel: 'После',
    blockStyle: {
      borderRadius: 'lg',
      shadow: 'lg',
      animation: 'scale-in',
    },
    ...overrides,
  }),

  faq: (id, overrides) => ({
    id,
    type: 'faq',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'FAQ',
    items: [
      { id: '1', question: 'Как записаться?', answer: 'Свяжитесь с нами через мессенджер или по телефону.' },
      { id: '2', question: 'Какие способы оплаты?', answer: 'Принимаем наличные, карты и переводы.' },
    ],
    blockStyle: {
      padding: 'lg',
      borderRadius: 'lg',
      animation: 'fade-in',
    },
    ...overrides,
  }),

  countdown: (id, overrides) => ({
    id,
    type: 'countdown',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Coming Soon',
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiredText: 'Event has ended',
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
    isPremium: true,
    ...overrides,
  }),

  pricing: (id, overrides) => ({
    id,
    type: 'pricing',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Our Prices',
    items: [
      { id: '1', name: 'Basic', description: 'Basic service', price: 5000, currency: 'KZT', period: 'per hour' },
      { id: '2', name: 'Premium', description: 'Premium service', price: 10000, currency: 'KZT', period: 'per hour', featured: true },
    ],
    currency: 'KZT',
    ...overrides,
  }),

  shoutout: (id, overrides) => ({
    id,
    type: 'shoutout',
    blockSize: DEFAULT_BLOCK_SIZE,
    userId: '',
    message: 'Рекомендую этого специалиста!',
    ...overrides,
  }),

  booking: (id, overrides) => ({
    id,
    type: 'booking',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Записаться на прием',
    description: 'Выберите удобное время',
    workingHoursStart: 9,
    workingHoursEnd: 18,
    slotDuration: 60,
    maxBookingDays: 30,
    disabledWeekdays: [0, 6],
    isPremium: true,
    ...overrides,
  }),

  community: (id, overrides) => ({
    id,
    type: 'community',
    blockSize: DEFAULT_BLOCK_SIZE,
    title: 'Мой закрытый чат',
    description: 'Присоединяйся к моему сообществу',
    telegramLink: '',
    memberCount: '',
    icon: 'users',
    style: 'default',
    ...overrides,
  }),

  event: (id, overrides) => {
    const eventId = generateUuid();
    const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const registrationClosesAt = new Date(startAt.getTime() - 60 * 60 * 1000);

    return {
      id,
      type: 'event',
      blockSize: DEFAULT_BLOCK_SIZE,
      eventId,
      title: createMultilingualString('Ивент'),
      description: createMultilingualString('Описание события'),
      coverUrl: '',
      startAt: startAt.toISOString(),
      endAt: new Date(startAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      registrationClosesAt: registrationClosesAt.toISOString(),
      locationType: 'online',
      locationValue: '',
      capacity: 100,
      isPaid: false,
      price: 0,
      currency: 'KZT',
      status: 'published',
      formFields: [
        {
          id: generateUuid(),
          type: 'short_text',
          label_i18n: createMultilingualString('Имя и фамилия'),
          placeholder_i18n: createMultilingualString('Введите имя'),
          helpText_i18n: createMultilingualString('Как к вам обращаться'),
          required: true,
        },
      ],
      settings: {
        requireApproval: false,
        allowDuplicateEmail: false,
      },
      ...overrides,
    };
  },
};

export function createBlock(type: string, overrides?: Record<string, any>): Block {
  const timestamp = Date.now();
  const id = `${type}-${timestamp}`;

  const generator = BLOCK_GENERATORS[type];
  if (!generator) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return generator(id, overrides);
}
