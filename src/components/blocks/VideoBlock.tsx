import { memo, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VideoBlock as VideoBlockType } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
import { hasCustomBlockContainer } from '@/lib/blocks/block-styling';

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
  const isNaked = hasCustomBlockContainer(block.blockStyle);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    onClick();
  };

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

  // Naked mode: no card frame, no title bar background — the wrapper's
  // custom styling is the visible frame.
  if (isNaked) {
    const content = (
      <>
        {title && (
          <div className="pb-2">
            <h3 className="text-base sm:text-lg font-semibold truncate">{title}</h3>
          </div>
        )}
        <div className={cn('relative w-full overflow-hidden', aspectRatioClass)} style={{ borderRadius: 'inherit' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"
            allowFullScreen
            title={title || 'Video'}
          />
        </div>
      </>
    );

    if (!onClick) {
      return <div className="w-full">{content}</div>;
    }

    return (
      <div className="w-full" onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
        {content}
      </div>
    );
  }

  return (
    <Card
      className="overflow-hidden qb-card border-hairline shadow-soft rounded-2xl"
      onClick={() => onClick?.()}
    >
      {title && (
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-base sm:text-lg font-semibold truncate text-gradient">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className={cn("relative w-full bg-black/20", aspectRatioClass)}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"

            allowFullScreen
            title={title || 'Video'}
          />
        </div>
      </CardContent>
    </Card>
  );
});
