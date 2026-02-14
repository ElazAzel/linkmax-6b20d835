import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VideoBlock as VideoBlockType } from '@/types/page';

interface VideoBlockProps {
  block: VideoBlockType;
}

function getVideoEmbedUrl(url: string, platform: 'youtube' | 'vimeo'): string | null {
  try {
    if (platform === 'youtube') {
      // Extract video ID from various YouTube URL formats
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } else if (platform === 'vimeo') {
      // Extract video ID from Vimeo URL
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
  const embedUrl = getVideoEmbedUrl(block.url, block.platform);
  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }[block.aspectRatio || '16:9'];

  if (!embedUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Invalid Video URL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check the video URL and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {block.title && (
        <CardHeader>
          <CardTitle>{block.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className={`w-full ${aspectRatioClass}`}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={block.title || 'Video'}
          />
        </div>
      </CardContent>
    </Card>
  );
});
