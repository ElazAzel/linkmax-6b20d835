/**
 * Lightweight wireframe previews for SectionPatterns.
 * Pure CSS — no images, no network, cheap to render in a long list.
 */
import { memo } from 'react';
import { cn } from '@/lib/utils/utils';
import type { SectionPattern } from '@/lib/sections/section-patterns';

const bar = 'rounded-full bg-foreground/25';
const box = 'rounded-md bg-foreground/12';

export const SectionPatternPreview = memo(function SectionPatternPreview({
  preview,
  className,
}: {
  preview: SectionPattern['preview'];
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'h-20 w-full overflow-hidden rounded-xl bg-muted/50 p-2.5',
        className,
      )}
    >
      {preview === 'editorial' && (
        <div className="flex h-full flex-col justify-center gap-1.5">
          <div className={cn(bar, 'h-1 w-8')} />
          <div className={cn(bar, 'h-3 w-4/5')} />
          <div className={cn(bar, 'h-1.5 w-3/5 opacity-60')} />
          <div className={cn(box, 'h-3 w-14')} />
        </div>
      )}

      {preview === 'split' && (
        <div className="grid h-full grid-cols-2 items-center gap-2">
          <div className="flex flex-col gap-1.5">
            <div className={cn(bar, 'h-2.5 w-full')} />
            <div className={cn(bar, 'h-1.5 w-2/3 opacity-60')} />
            <div className={cn(box, 'h-3 w-10')} />
          </div>
          <div className={cn(box, 'h-full')} />
        </div>
      )}

      {preview === 'overlap' && (
        <div className="relative h-full">
          <div className={cn(box, 'h-3/4 w-full')} />
          <div className="absolute bottom-0 left-3 right-6 h-6 rounded-lg border border-border bg-background shadow-sm" />
        </div>
      )}

      {preview === 'cinema' && (
        <div className="flex h-full flex-col gap-1.5">
          <div className={cn(box, 'h-3/4 w-full')} />
          <div className={cn(bar, 'mx-auto h-1.5 w-1/3 opacity-60')} />
        </div>
      )}

      {preview === 'spotlight' && (
        <div className="flex h-full gap-2">
          <div className={cn(box, 'h-full w-2/5')} />
          <div className="flex flex-1 flex-col justify-center gap-1.5">
            <div className={cn(bar, 'h-2.5 w-4/5')} />
            <div className={cn(bar, 'h-1.5 w-full opacity-60')} />
            <div className={cn(bar, 'h-1.5 w-2/3 opacity-60')} />
          </div>
        </div>
      )}

      {preview === 'bento' && (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
          <div className={cn(box, 'col-span-2 row-span-2')} />
          <div className={box} />
          <div className={box} />
        </div>
      )}

      {preview === 'rail' && (
        <div className="flex h-full items-center gap-1.5 overflow-hidden">
          <div className={cn(box, 'h-full w-1/3 shrink-0')} />
          <div className={cn(box, 'h-full w-1/3 shrink-0')} />
          <div className={cn(box, 'h-full w-1/3 shrink-0 opacity-60')} />
        </div>
      )}

      {preview === 'center' && (
        <div className="flex h-full flex-col items-center justify-center gap-1.5">
          <div className={cn(bar, 'h-2.5 w-3/5')} />
          <div className={cn(bar, 'h-1.5 w-2/5 opacity-60')} />
          <div className={cn(box, 'h-3 w-16')} />
        </div>
      )}
    </div>
  );
});
