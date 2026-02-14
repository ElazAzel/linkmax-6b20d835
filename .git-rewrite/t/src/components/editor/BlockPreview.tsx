import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { BlockRenderer } from '@/components/BlockRenderer';
import type { Block } from '@/types/page';

interface BlockPreviewProps {
  blockType: string;
}

const PREVIEW_BLOCKS: Record<string, Block> = {
  link: {
    id: 'preview-link',
    type: 'link',
    title: 'Моя ссылка',
    url: 'https://example.com',
    icon: 'globe',
    style: 'rounded',
  },
  button: {
    id: 'preview-button',
    type: 'button',
    title: 'Нажми меня',
    url: 'https://example.com',
  },
  text: {
    id: 'preview-text',
    type: 'text',
    content: 'Это текстовый блок',
    style: 'paragraph',
  },
  image: {
    id: 'preview-image',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    alt: 'Пример изображения',
    style: 'default',
  },
  socials: {
    id: 'preview-socials',
    type: 'socials',
    title: 'Мои соцсети',
    platforms: [
      { name: 'instagram', url: 'https://instagram.com', icon: 'instagram' },
      { name: 'twitter', url: 'https://twitter.com', icon: 'twitter' },
    ],
  },
  product: {
    id: 'preview-product',
    type: 'product',
    name: 'Товар',
    description: 'Описание товара',
    price: 1000,
    currency: 'KZT',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  },
  video: {
    id: 'preview-video',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Видео',
    platform: 'youtube',
  },
  carousel: {
    id: 'preview-carousel',
    type: 'carousel',
    images: [
      { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', alt: 'Image 1' },
      { url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400', alt: 'Image 2' },
    ],
  },
  custom_code: {
    id: 'preview-custom_code',
    type: 'custom_code',
    html: '<div style="padding: 20px; text-align: center;">Кастомный HTML</div>',
    css: '',
    isPremium: true,
  },
  form: {
    id: 'preview-form',
    type: 'form',
    title: 'Контактная форма',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email', required: true },
    ],
    buttonText: 'Отправить',
    submitEmail: 'example@email.com',
    isPremium: true,
  },
  newsletter: {
    id: 'preview-newsletter',
    type: 'newsletter',
    title: 'Подпишитесь на рассылку',
    description: 'Получайте новости первыми',
    buttonText: 'Подписаться',
    isPremium: true,
  },
  testimonial: {
    id: 'preview-testimonial',
    type: 'testimonial',
    testimonials: [
      {
        name: 'Иван Иванов',
        text: 'Отличный сервис!',
        rating: 5,
      },
    ],
    isPremium: true,
  },
  messenger: {
    id: 'preview-messenger',
    type: 'messenger',
    title: 'Свяжитесь со мной',
    messengers: [
      { platform: 'whatsapp', username: '+77001234567' },
      { platform: 'telegram', username: '@username' },
    ],
  },
  download: {
    id: 'preview-download',
    type: 'download',
    title: 'Скачать файл',
    description: 'Описание файла',
    fileUrl: '#',
    fileName: 'document.pdf',
  },
  scratch: {
    id: 'preview-scratch',
    type: 'scratch',
    title: 'Стирай и выигрывай',
    revealText: 'Скидка 20%!',
    isPremium: true,
  },
  search: {
    id: 'preview-search',
    type: 'search',
    title: 'AI Поиск',
    placeholder: 'Задайте вопрос...',
    isPremium: true,
  },
};

export const BlockPreview = memo(function BlockPreview({ blockType }: BlockPreviewProps) {
  const previewBlock = PREVIEW_BLOCKS[blockType];

  if (!previewBlock) {
    return (
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Превью недоступно</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-background/95 backdrop-blur-sm border-2 shadow-xl">
      <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">
        Превью блока
      </p>
      <div className="scale-90 origin-top">
        <BlockRenderer block={previewBlock} isPreview={true} />
      </div>
    </Card>
  );
});
