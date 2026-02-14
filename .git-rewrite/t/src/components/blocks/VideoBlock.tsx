import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VideoBlock as VideoBlockType } from '@/types/page';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface VideoBlockProps {
  block: VideoBlockType;
}

function getVideoEmbedUrl(url: string, platform: 'youtube' | 'vimeo'): string | null {
  try {
    if (platform === 'youtube') {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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

export const VideoBlock = memo(function VideoBlockComponent({ block }: VideoBlockProps) {
  const { i18n } = useTranslation();
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
  const embedUrl = getVideoEmbedUrl(block.url, block.platform);
  
  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }[block.aspectRatio || '16:9'];

  if (!embedUrl) {
    return (
      <Card className="bg-card border-border shadow-sm rounded-xl">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm text-destructive">Invalid Video URL</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Please check the video URL and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-card border-border shadow-sm rounded-xl">
      {title && (
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-base sm:text-lg truncate">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className={cn("w-full", aspectRatioClass)}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || 'Video'}
          />
        </div>
      </CardContent>
    </Card>
  );
});
