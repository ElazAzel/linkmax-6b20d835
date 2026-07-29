import { cn } from '@/lib/utils/utils';

interface BrandLogoProps {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, inverted = false, className }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img
        src="/brand/linkmax-mark.svg"
        alt=""
        className="h-9 w-9 rounded-md object-contain"
        width={36}
        height={36}
      />
      {!compact && (
        <span className={cn('font-display text-sm font-semibold', inverted ? 'text-white' : 'text-[#16131A]')}>
          LinkMAX
        </span>
      )}
      <span className="sr-only">LinkMAX</span>
    </span>
  );
}
