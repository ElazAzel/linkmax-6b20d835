/**
 * PublicPageSkeleton - Loading skeleton for public pages
 * Provides visual feedback while page data is being fetched
 */
import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const PublicPageSkeleton = memo(function PublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Profile skeleton */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </div>

        {/* Block skeletons */}
        <div className="space-y-3">
          {/* Link block skeletons */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-14 w-full rounded-2xl" 
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
          
          {/* Socials skeleton */}
          <div className="flex justify-center gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-12 w-12 rounded-full" 
                style={{ animationDelay: `${(i + 4) * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Bottom buttons skeleton */}
        <div className="flex gap-2 justify-center mt-8">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
});
