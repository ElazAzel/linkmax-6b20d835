import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface PagePreviewProps {
  slug: string;
  title: string | null;
  avatarUrl: string | null;
  previewUrl?: string | null;
  className?: string;
}

export function PagePreview({ slug, title, avatarUrl, previewUrl, className = '' }: PagePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Only use custom preview if available, no external screenshot service
  const hasCustomPreview = previewUrl && previewUrl.trim() !== '';

  // If no custom preview or error, show avatar-based fallback
  if (!hasCustomPreview || imageError) {
    return (
      <div className={`relative bg-gradient-to-br from-muted/50 to-muted rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <Avatar className="h-20 w-20 ring-4 ring-background/50 shadow-lg mb-3">
            <AvatarImage src={avatarUrl || ''} alt={title || slug} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {title?.charAt(0)?.toUpperCase() || slug?.charAt(0)?.toUpperCase() || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-base font-semibold text-foreground/90 text-center truncate max-w-full">
            {title || slug}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            @{slug}
          </span>
        </div>
        {/* Decorative browser dots */}
        <div className="absolute top-2 left-2 right-2 flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-muted/30 rounded-lg overflow-hidden ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <img
        src={previewUrl}
        alt={`Preview of ${title || slug}`}
        className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
}
