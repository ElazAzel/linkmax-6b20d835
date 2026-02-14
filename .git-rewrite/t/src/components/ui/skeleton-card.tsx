/**
 * SkeletonCard - Reusable skeleton loading states for cards
 * Used across Gallery, Dashboard, and Public pages
 */
import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'page' | 'block' | 'profile' | 'stat';
  className?: string;
}

export const SkeletonCard = memo(function SkeletonCard({ 
  variant = 'page',
  className 
}: SkeletonCardProps) {
  if (variant === 'profile') {
    return (
      <div className={cn("space-y-4 p-6", className)}>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-7 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'block') {
    return (
      <Card className={cn("p-4 space-y-3", className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'stat') {
    return (
      <Card className={cn("p-4", className)}>
        <Skeleton className="h-4 w-4 rounded mb-2" />
        <Skeleton className="h-6 w-16 mb-1" />
        <Skeleton className="h-3 w-12" />
      </Card>
    );
  }

  // Default: page card
  return (
    <Card className={cn("overflow-hidden", className)}>
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 flex-1" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </Card>
  );
});

export const SkeletonGalleryGrid = memo(function SkeletonGalleryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} variant="page" />
      ))}
    </div>
  );
});

export const SkeletonBlockList = memo(function SkeletonBlockList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant="block" />
      ))}
    </div>
  );
});

export const SkeletonStats = memo(function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} variant="stat" />
      ))}
    </div>
  );
});
