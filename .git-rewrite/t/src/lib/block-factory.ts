import type { Block } from '@/types/page';

export function createBlock(type: string): Block {
  const timestamp = Date.now();
  
  switch (type) {
    case 'profile':
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
    
    case 'link':
      return {
        id: `link-${timestamp}`,
        type: 'link',
        title: 'New Link',
        url: 'https://example.com',
        icon: 'globe',
        style: 'rounded',
      };
    
    case 'button':
      return {
        id: `button-${timestamp}`,
        type: 'button',
        title: 'Click Me',
        url: 'https://example.com',
        background: { type: 'gradient', value: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' },
        hoverEffect: 'glow',
      };
    
    case 'text':
      return {
        id: `text-${timestamp}`,
        type: 'text',
        content: 'Enter your text here',
        style: 'paragraph',
      };
    
    case 'image':
      return {
        id: `image-${timestamp}`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6?w=800',
        alt: 'Sample image',
        style: 'default',
      };
    
    case 'socials':
      return {
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
        id: `product-${timestamp}`,
        type: 'product',
        name: 'New Product',
        description: 'Product description',
        price: 0,
        currency: 'KZT',
      };
    
    case 'video':
      return {
        id: `video-${timestamp}`,
        type: 'video',
        title: 'My Video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        platform: 'youtube',
        aspectRatio: '16:9',
      };
    
    case 'carousel':
      return {
        id: `carousel-${timestamp}`,
        type: 'carousel',
        title: 'Image Carousel',
        images: [
          { url: 'https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6?w=800', alt: 'Sample 1' },
          { url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800', alt: 'Sample 2' },
        ],
        autoPlay: true,
        interval: 3000,
      };
    
    case 'custom_code':
      return {
        id: `custom-${timestamp}`,
        type: 'custom_code',
        title: 'Custom HTML/CSS',
        html: '<div class="custom-block"><h3>Custom Content</h3><p>Add your HTML here</p></div>',
        css: '.custom-block { padding: 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; }',
        isPremium: true,
      };
    
    case 'form':
      return {
        id: `form-${timestamp}`,
        type: 'form',
        title: 'Contact Form',
        fields: [
          { name: 'Name', type: 'text', required: true },
          { name: 'Email', type: 'email', required: true },
          { name: 'Message', type: 'textarea', required: false },
        ],
        buttonText: 'Submit',
        submitEmail: '',
        isPremium: true,
      };
    
    case 'newsletter':
      return {
        id: `newsletter-${timestamp}`,
        type: 'newsletter',
        title: 'Subscribe to Newsletter',
        description: 'Get the latest updates',
        buttonText: 'Subscribe',
        isPremium: true,
      };
    
    case 'testimonial':
      return {
        id: `testimonial-${timestamp}`,
        type: 'testimonial',
        title: 'Client Reviews',
        testimonials: [
          {
            name: 'John Doe',
            role: 'CEO',
            text: 'Great service!',
            rating: 5,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
          },
        ],
        isPremium: true,
      };
    
    case 'messenger':
      return {
        id: `messenger-${timestamp}`,
        type: 'messenger',
        title: 'Contact Me',
        messengers: [
          { platform: 'whatsapp', username: '1234567890' },
          { platform: 'telegram', username: 'username' },
        ],
      };
    
    case 'download':
      return {
        id: `download-${timestamp}`,
        type: 'download',
        title: 'Download File',
        fileName: 'document.pdf',
        fileUrl: 'https://example.com/file.pdf',
      };
    
    case 'scratch':
      return {
        id: `scratch-${timestamp}`,
        type: 'scratch',
        title: 'Scratch & Win',
        revealText: '🎉 You won!',
        backgroundColor: '#C0C0C0',
        isPremium: true,
      };
    
    case 'search':
      return {
        id: `search-${timestamp}`,
        type: 'search',
        title: 'AI Search',
        placeholder: 'Ask me anything...',
        isPremium: true,
      };
    
    case 'map':
      return {
        id: `map-${timestamp}`,
        type: 'map',
        title: 'Наше местоположение',
        provider: 'google',
        embedUrl: '',
        address: '',
        height: 'medium',
      };
    
    case 'avatar':
      return {
        id: `avatar-${timestamp}`,
        type: 'avatar',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar',
        name: 'Имя',
        subtitle: '',
        size: 'medium',
        shape: 'circle',
        border: false,
        shadow: 'soft',
      };
    
    case 'separator':
      return {
        id: `separator-${timestamp}`,
        type: 'separator',
        variant: 'solid',
        thickness: 'thin',
        width: 'full',
        spacing: 'md',
      };
    
    case 'catalog':
      return {
        id: `catalog-${timestamp}`,
        type: 'catalog',
        title: 'Каталог',
        items: [],
        categories: [],
        layout: 'list',
        showPrices: true,
        currency: 'KZT',
        isPremium: true,
      };
    
    case 'before_after':
      return {
        id: `before_after-${timestamp}`,
        type: 'before_after',
        title: 'До и После',
        beforeImage: '',
        afterImage: '',
        beforeLabel: 'До',
        afterLabel: 'После',
      };
    
    case 'faq':
      return {
        id: `faq-${timestamp}`,
        type: 'faq',
        title: 'Частые вопросы',
        items: [],
      };
    
    case 'countdown':
      return {
        id: `countdown-${timestamp}`,
        type: 'countdown',
        title: 'До конца акции',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        isPremium: true,
      };
    
    case 'pricing':
      return {
        id: `pricing-${timestamp}`,
        type: 'pricing',
        title: 'Прайс-лист',
        items: [],
        currency: 'KZT',
      };
    
    case 'shoutout':
      return {
        id: `shoutout-${timestamp}`,
        type: 'shoutout',
        userId: '',
        message: 'Рекомендую этого специалиста!',
      };
    
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}