import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { VideoBlock as VideoBlockType } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';

interface VideoBlockProps {
  block: VideoBlockType;
  onClick?: () => void;
}

function getVideoEmbedUrl(url: string, platform: 'youtube' | 'vimeo'): string | null {
  try {
    if (platform === 'youtube') {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\\/\s]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } else if (platform === 'vimeo') {
      const videoIdMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch (error) {
    console.error('Error parsing video URL:', error);
  }
  return null;
}

export const VideoBlock = memo(function VideoBlockComponent({ block, onClick }: VideoBlockProps) {
  const { t, i18n } = useTranslation();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const embedUrl = getVideoEmbedUrl(block.url, block.platform);

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }[block.aspectRatio || '16:9'];

  if (!embedUrl) {
    return (
      <Card variant="solid" className="bg-card border-border shadow-sm rounded-xl">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm text-destructive">
            {t('blocks.video.invalidUrl', 'Неверный URL видео')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('blocks.video.checkUrl', 'Проверьте ссылку на видео и попробуйте снова.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      onClick={() => onClick?.()}
      onKeyDown={() => onClick?.()}
      role="button"
      tabIndex={0}
    >
      {title && (
        <h3 className="text-base sm:text-lg font-semibold leading-snug mb-2 break-words">{title}</h3>
      )}
      <div className={cn("relative w-full bg-black/20 overflow-hidden rounded-2xl", aspectRatioClass)}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"
          allowFullScreen
          title={title || 'Video'}
        />
      </div>
    </div>
  );
});
