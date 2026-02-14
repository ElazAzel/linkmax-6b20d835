import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { BlockRenderer } from '@/components/BlockRenderer';
import type { Block } from '@/types/page';
import { useTranslation } from 'react-i18next';

interface BlockPreviewProps {
  blockType: string;
}

export const BlockPreview = memo(function BlockPreview({ blockType }: BlockPreviewProps) {
  const { t } = useTranslation();
  const previewBlocks = useMemo<Record<string, Block>>(() => ({
    link: {
      id: 'preview-link',
      type: 'link',
      title: t('blockPreview.linkTitle', 'Моя ссылка'),
      url: 'https://example.com',
      icon: 'globe',
      style: 'rounded',
    },
    button: {
      id: 'preview-button',
      type: 'button',
      title: t('blockPreview.buttonTitle', 'Нажми меня'),
      url: 'https://example.com',
    },
    text: {
      id: 'preview-text',
      type: 'text',
      content: t('blockPreview.textContent', 'Это текстовый блок'),
      style: 'paragraph',
    },
    image: {
      id: 'preview-image',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      alt: t('blockPreview.imageAlt', 'Пример изображения'),
      style: 'default',
    },
    socials: {
      id: 'preview-socials',
      type: 'socials',
      title: t('blockPreview.socialsTitle', 'Мои соцсети'),
      platforms: [
        { name: 'instagram', url: 'https://instagram.com', icon: 'instagram' },
        { name: 'twitter', url: 'https://twitter.com', icon: 'twitter' },
      ],
    },
    product: {
      id: 'preview-product',
      type: 'product',
      name: t('blockPreview.productName', 'Товар'),
      description: t('blockPreview.productDescription', 'Описание товара'),
      price: 1000,
      currency: 'KZT',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    },
    video: {
      id: 'preview-video',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: t('blockPreview.videoTitle', 'Видео'),
      platform: 'youtube',
    },
    carousel: {
      id: 'preview-carousel',
      type: 'carousel',
      images: [
        { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', alt: t('blockPreview.carouselImage1', 'Изображение 1') },
        { url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400', alt: t('blockPreview.carouselImage2', 'Изображение 2') },
      ],
    },
    custom_code: {
      id: 'preview-custom_code',
      type: 'custom_code',
      html: t('blockPreview.customCodeHtml', '<div style="padding: 20px; text-align: center;">Кастомный HTML</div>'),
      css: '',
      isPremium: true,
    },
    form: {
      id: 'preview-form',
      type: 'form',
      title: t('blockPreview.formTitle', 'Контактная форма'),
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ],
      buttonText: t('blockPreview.formButton', 'Отправить'),
      submitEmail: 'example@email.com',
      isPremium: true,
    },
    newsletter: {
      id: 'preview-newsletter',
      type: 'newsletter',
      title: t('blockPreview.newsletterTitle', 'Подпишитесь на рассылку'),
      description: t('blockPreview.newsletterDescription', 'Получайте новости первыми'),
      buttonText: t('blockPreview.newsletterButton', 'Подписаться'),
      isPremium: true,
    },
    testimonial: {
      id: 'preview-testimonial',
      type: 'testimonial',
      testimonials: [
        {
          name: t('blockPreview.testimonialName', 'Иван Иванов'),
          text: t('blockPreview.testimonialText', 'Отличный сервис!'),
          rating: 5,
        },
      ],
      isPremium: true,
    },
    messenger: {
      id: 'preview-messenger',
      type: 'messenger',
      title: t('blockPreview.messengerTitle', 'Свяжитесь со мной'),
      messengers: [
        { platform: 'whatsapp', username: '+77001234567' },
        { platform: 'telegram', username: '@username' },
      ],
    },
    download: {
      id: 'preview-download',
      type: 'download',
      title: t('blockPreview.downloadTitle', 'Скачать файл'),
      description: t('blockPreview.downloadDescription', 'Описание файла'),
      fileUrl: '#',
      fileName: 'document.pdf',
    },
    scratch: {
      id: 'preview-scratch',
      type: 'scratch',
      title: t('blockPreview.scratchTitle', 'Стирай и выигрывай'),
      revealText: t('blockPreview.scratchReveal', 'Скидка 20%!'),
      isPremium: true,
    },
  }), [t]);
  const previewBlock = previewBlocks[blockType];

  if (!previewBlock) {
    return (
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('blockPreview.unavailable', 'Превью недоступно')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-background/95 backdrop-blur-sm border-2 shadow-xl">
      <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">
        {t('blockPreview.title', 'Превью блока')}
      </p>
      <div className="scale-90 origin-top">
        <BlockRenderer block={previewBlock} isPreview={true} />
      </div>
    </Card>
  );
});
