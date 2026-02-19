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

export function createBlock(type: string): Block {
  const timestamp = Date.now();
  
  // Profile blocks don't get size preset - they're always full width
  if (type === 'profile') {
    return {
      id: `profile-${timestamp}`,
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
    };
  }
  
  // All other blocks get the default size
  const baseProps = { blockSize: DEFAULT_BLOCK_SIZE };
  
  switch (type) {
    case 'link':
      return {
        ...baseProps,
        id: `link-${timestamp}`,
        type: 'link',
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
      };
    
    case 'button':
      return {
        ...baseProps,
        id: `button-${timestamp}`,
        type: 'button',
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
      };
    
    case 'text':
      return {
        ...baseProps,
        id: `text-${timestamp}`,
        type: 'text',
        content: 'Enter your text here',
        style: 'paragraph',
        blockStyle: {
          padding: 'md',
          animation: 'fade-in',
        },
      };
    
    case 'image':
      return {
        ...baseProps,
        id: `image-${timestamp}`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800',
        alt: 'Beautiful workspace',
        style: 'default',
        blockStyle: {
          padding: 'none',
          borderRadius: 'lg',
          shadow: 'md',
          animation: 'fade-in',
        },
      };
    
    case 'socials':
      return {
        ...baseProps,
        id: `socials-${timestamp}`,
        type: 'socials',
        title: 'Follow Me',
        platforms: [
          { name: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
          { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
        ],
      };
    
    case 'product':
      return {
        ...baseProps,
        id: `product-${timestamp}`,
        type: 'product',
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
      };
    
    case 'video':
      return {
        ...baseProps,
        id: `video-${timestamp}`,
        type: 'video',
        title: 'My Video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        platform: 'youtube',
        aspectRatio: '16:9',
        blockStyle: {
          borderRadius: 'lg',
          shadow: 'lg',
          animation: 'fade-in',
        },
      };
    
    case 'carousel':
      return {
        ...baseProps,
        id: `carousel-${timestamp}`,
        type: 'carousel',
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
      };
    
    case 'custom_code':
      return {
        ...baseProps,
        id: `custom_code-${timestamp}`,
        type: 'custom_code',
        title: 'Custom Code',
        html: '<div>Your custom HTML here</div>',
        css: '',
        javascript: '',
        height: 'auto',
        enableInteraction: true,
        isPremium: true,
      };
    
    case 'messenger':
      return {
        ...baseProps,
        id: `messenger-${timestamp}`,
        type: 'messenger',
        title: 'Contact Me',
        messengers: [
          { platform: 'whatsapp', username: '+1234567890', message: 'Hello!' },
          { platform: 'telegram', username: 'username' },
        ],
      };
    
    case 'form':
      return {
        ...baseProps,
        id: `form-${timestamp}`,
        type: 'form',
        title: 'Contact Form',
        fields: [
          { name: 'Name', type: 'text', required: true, placeholder: 'Your name' },
          { name: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
          { name: 'Message', type: 'textarea', required: false, placeholder: 'Your message' },
        ],
        submitEmail: '',
        buttonText: 'Send',
        isPremium: true,
      };
    
    case 'download':
      return {
        ...baseProps,
        id: `download-${timestamp}`,
        type: 'download',
        title: 'Download File',
        description: 'Click to download',
        fileUrl: '',
        fileName: 'document.pdf',
        fileSize: '2.5 MB',
        icon: 'file-text',
      };
    
    case 'newsletter':
      return {
        ...baseProps,
        id: `newsletter-${timestamp}`,
        type: 'newsletter',
        title: 'Subscribe to Newsletter',
        description: 'Get the latest updates',
        buttonText: 'Subscribe',
        isPremium: true,
      };
    
    case 'testimonial':
      return {
        ...baseProps,
        id: `testimonial-${timestamp}`,
        type: 'testimonial',
        title: 'What People Say',
        testimonials: [
          { name: 'Алина К.', text: 'Отличный сервис! Очень рекомендую.', rating: 5, role: 'Клиент' },
          { name: 'Дмитрий М.', text: 'Профессиональный подход к делу.', rating: 5, role: 'Клиент' },
        ],
        isPremium: true,
        blockStyle: {
          padding: 'lg',
          borderRadius: 'lg',
          backgroundGradient: 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted)/0.5))',
          animation: 'scale-in',
        },
      };
    
    case 'scratch':
      return {
        ...baseProps,
        id: `scratch-${timestamp}`,
        type: 'scratch',
        title: 'Scratch to Reveal',
        revealText: 'You won a prize!',
        backgroundColor: '#FFD700',
        isPremium: true,
      };
    
    case 'map':
      return {
        ...baseProps,
        id: `map-${timestamp}`,
        type: 'map',
        address: 'New York, USA',
      };
    
    case 'avatar':
      return {
        ...baseProps,
        id: `avatar-${timestamp}`,
        type: 'avatar',
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        name: 'Your Name',
        subtitle: 'Your title',
        size: 'large',
        shape: 'circle',
        alignment: 'center',
      };
    
    case 'separator':
      return {
        ...baseProps,
        id: `separator-${timestamp}`,
        type: 'separator',
        variant: 'solid',
        thickness: 'thin',
        width: 'full',
        spacing: 'md',
      };
    
    case 'catalog':
      return {
        ...baseProps,
        id: `catalog-${timestamp}`,
        type: 'catalog',
        title: 'Our Products',
        items: [
          { id: '1', name: 'Product 1', description: 'Description', price: 1000, currency: 'KZT' },
          { id: '2', name: 'Product 2', description: 'Description', price: 2000, currency: 'KZT' },
        ],
        layout: 'grid',
        showPrices: true,
        currency: 'KZT',
        isPremium: true,
      };
    
    case 'before_after':
      return {
        ...baseProps,
        id: `before_after-${timestamp}`,
        type: 'before_after',
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
      };
    
    case 'faq':
      return {
        ...baseProps,
        id: `faq-${timestamp}`,
        type: 'faq',
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
      };
    
    case 'countdown':
      return {
        ...baseProps,
        id: `countdown-${timestamp}`,
        type: 'countdown',
        title: 'Coming Soon',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiredText: 'Event has ended',
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        isPremium: true,
      };
    
    case 'pricing':
      return {
        ...baseProps,
        id: `pricing-${timestamp}`,
        type: 'pricing',
        title: 'Our Prices',
        items: [
          { id: '1', name: 'Basic', description: 'Basic service', price: 5000, currency: 'KZT', period: 'per hour' },
          { id: '2', name: 'Premium', description: 'Premium service', price: 10000, currency: 'KZT', period: 'per hour', featured: true },
        ],
        currency: 'KZT',
      };
    
    case 'shoutout':
      return {
        ...baseProps,
        id: `shoutout-${timestamp}`,
        type: 'shoutout',
        userId: '',
        message: 'Рекомендую этого специалиста!',
      };
    
    case 'booking':
      return {
        ...baseProps,
        id: `booking-${timestamp}`,
        type: 'booking',
        title: 'Записаться на прием',
        description: 'Выберите удобное время',
        workingHoursStart: 9,
        workingHoursEnd: 18,
        slotDuration: 60,
        maxBookingDays: 30,
        disabledWeekdays: [0, 6],
        isPremium: true,
      };
    
    case 'community':
      return {
        ...baseProps,
        id: `community-${timestamp}`,
        type: 'community',
        title: 'Мой закрытый чат',
        description: 'Присоединяйся к моему сообществу',
        telegramLink: '',
        memberCount: '',
        icon: 'users',
        style: 'default',
      };
    
    case 'event': {
      const eventId = generateUuid();
      const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const registrationClosesAt = new Date(startAt.getTime() - 60 * 60 * 1000);

      return {
        ...baseProps,
        id: `event-${timestamp}`,
        type: 'event',
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
      };
    }
    
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}
