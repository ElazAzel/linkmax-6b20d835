import type {
  ProfileBlock,
  LinkBlock,
  ButtonBlock,
  SocialsBlock,
  TextBlock,
  ImageBlock,
  ProductBlock,
  VideoBlock,
  CarouselBlock,
  SearchBlock,
  CustomCodeBlock,
  MessengerBlock,
  FormBlock,
  DownloadBlock,
  NewsletterBlock,
  TestimonialBlock,
  ScratchBlock,
  MapBlock,
  AvatarBlock,
  SeparatorBlock,
} from '@/types/page';

export const mockProfileBlock: ProfileBlock = {
  id: 'profile-1',
  type: 'profile',
  name: 'Test User',
  bio: 'Test bio description',
  avatar: 'https://example.com/avatar.jpg',
  verified: true,
  avatarFrame: 'default',
};

export const mockLinkBlock: LinkBlock = {
  id: 'link-1',
  type: 'link',
  title: 'Test Link',
  url: 'https://example.com',
  icon: 'globe',
  style: 'default',
  alignment: 'center',
};

export const mockButtonBlock: ButtonBlock = {
  id: 'button-1',
  type: 'button',
  title: 'Click Me',
  url: 'https://example.com',
  background: { type: 'solid', value: '#3b82f6' },
  hoverEffect: 'scale',
  alignment: 'center',
};

export const mockSocialsBlock: SocialsBlock = {
  id: 'socials-1',
  type: 'socials',
  title: 'Follow Me',
  platforms: [
    { name: 'Instagram', url: 'https://instagram.com/test', icon: 'instagram' },
    { name: 'Telegram', url: 'https://t.me/test', icon: 'telegram' },
  ],
  alignment: 'center',
};

export const mockTextBlock: TextBlock = {
  id: 'text-1',
  type: 'text',
  content: 'This is test content',
  style: 'paragraph',
  alignment: 'left',
};

export const mockImageBlock: ImageBlock = {
  id: 'image-1',
  type: 'image',
  url: 'https://example.com/image.jpg',
  alt: 'Test image',
  caption: 'Image caption',
  style: 'default',
  alignment: 'center',
};

export const mockProductBlock: ProductBlock = {
  id: 'product-1',
  type: 'product',
  name: 'Test Product',
  description: 'Product description',
  price: 1000,
  currency: 'KZT',
  image: 'https://example.com/product.jpg',
  buyLink: 'https://example.com/buy',
  alignment: 'center',
};

export const mockVideoBlock: VideoBlock = {
  id: 'video-1',
  type: 'video',
  title: 'Test Video',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  platform: 'youtube',
  aspectRatio: '16:9',
};

export const mockCarouselBlock: CarouselBlock = {
  id: 'carousel-1',
  type: 'carousel',
  title: 'Image Carousel',
  images: [
    { url: 'https://example.com/image1.jpg', alt: 'Image 1' },
    { url: 'https://example.com/image2.jpg', alt: 'Image 2' },
  ],
  autoPlay: false,
};

export const mockSearchBlock: SearchBlock = {
  id: 'search-1',
  type: 'search',
  title: 'Search',
  placeholder: 'Ask a question...',
  isPremium: true,
};

export const mockCustomCodeBlock: CustomCodeBlock = {
  id: 'custom-1',
  type: 'custom_code',
  title: 'Custom Widget',
  html: '<div class="test">Hello</div>',
  css: '.test { color: red; }',
  isPremium: true,
};

export const mockMessengerBlock: MessengerBlock = {
  id: 'messenger-1',
  type: 'messenger',
  title: 'Contact Me',
  messengers: [
    { platform: 'whatsapp', username: '1234567890' },
    { platform: 'telegram', username: 'testuser' },
  ],
};

export const mockFormBlock: FormBlock = {
  id: 'form-1',
  type: 'form',
  title: 'Contact Form',
  fields: [
    { name: 'Name', type: 'text', required: true },
    { name: 'Email', type: 'email', required: true },
    { name: 'Message', type: 'textarea', required: false },
  ],
  submitEmail: 'test@example.com',
  buttonText: 'Submit',
  isPremium: true,
};

export const mockDownloadBlock: DownloadBlock = {
  id: 'download-1',
  type: 'download',
  title: 'Download File',
  description: 'Get the PDF guide',
  fileUrl: 'https://example.com/file.pdf',
  fileName: 'guide.pdf',
  fileSize: '2.5 MB',
  alignment: 'center',
};

export const mockNewsletterBlock: NewsletterBlock = {
  id: 'newsletter-1',
  type: 'newsletter',
  title: 'Subscribe',
  description: 'Get weekly updates',
  buttonText: 'Subscribe',
  isPremium: true,
};

export const mockTestimonialBlock: TestimonialBlock = {
  id: 'testimonial-1',
  type: 'testimonial',
  title: 'Reviews',
  testimonials: [
    { name: 'John Doe', text: 'Great service!', rating: 5, role: 'CEO' },
    { name: 'Jane Smith', text: 'Highly recommended', rating: 4 },
  ],
  isPremium: true,
};

export const mockScratchBlock: ScratchBlock = {
  id: 'scratch-1',
  type: 'scratch',
  title: 'Scratch to reveal',
  revealText: 'You won a prize!',
  backgroundColor: '#C0C0C0',
  isPremium: true,
};

export const mockMapBlock: MapBlock = {
  id: 'map-1',
  type: 'map',
  title: 'Our Location',
  provider: 'google',
  embedUrl: 'https://www.google.com/maps/embed?pb=test',
  address: '123 Test Street',
  height: 'medium',
};

export const mockAvatarBlock: AvatarBlock = {
  id: 'avatar-1',
  type: 'avatar',
  imageUrl: 'https://example.com/avatar.jpg',
  name: 'John Doe',
  subtitle: 'Developer',
  size: 'medium',
  shape: 'circle',
  alignment: 'center',
};

export const mockSeparatorBlock: SeparatorBlock = {
  id: 'separator-1',
  type: 'separator',
  variant: 'solid',
  thickness: 'thin',
  width: 'full',
  spacing: 'md',
};
