import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { VideoBlock as VideoBlockType } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
import { useRenderContext } from '@/contexts/RenderContext';
import { getVideoEmbedUrl, isVerticalVideo } from '@/lib/blocks/video-embed';

interface VideoBlockProps {
  block: VideoBlockType;
  onClick?: () => void;
}

// The grid cell is the card; the video sits in it edge to edge with the title
// padded like other blocks (it used to draw a second bordered card inside, or
// put the title flush on the cell edge when the block had any style).
export const VideoBlock = memo(function VideoBlockComponent({ block }: VideoBlockProps) {
  const { t, i18n } = useTranslation();
  const renderMode = useRenderContext();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const embedUrl = getVideoEmbedUrl(block.url, block.platform);
  const hasOwnPadding = !!block.blockStyle?.padding && block.blockStyle.padding !== 'none';

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16] max-h-[80vh] mx-auto',
  }[isVerticalVideo(block.url) ? '9:16' : block.aspectRatio || '16:9'];

  if (!embedUrl) {
    // Visitors never see a broken-link message; the owner does.
    if (renderMode === 'live') return null;
    return (
      <div className="w-full p-4 sm:p-5">
        <p className="text-sm font-medium text-destructive">
          {t('blocks.video.invalidUrl', 'Неверный URL видео')}
        </p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {t('blocks.video.checkUrl', 'Проверьте ссылку на видео и попробуйте снова.')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className={cn(hasOwnPadding ? 'pb-2' : 'px-4 pt-3 pb-2 sm:px-5')}>
          <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h3>
        </div>
      )}
      <div
        className={cn('relative w-full overflow-hidden bg-black/20', aspectRatioClass)}
        style={title ? undefined : { borderRadius: 'inherit' }}
      >
        <iframe
          src={embedUrl}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"
          allowFullScreen
          title={title || 'Video'}
        />
      </div>
    </div>
  );
});
