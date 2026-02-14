import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant for different visual styles */
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  /** Size for avatar variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function Skeleton({ className, variant = 'default', size = 'md', ...props }: SkeletonProps) {
  const variants = {
    default: "bg-muted",
    card: "bg-muted/50 backdrop-blur-sm",
    text: "bg-muted h-4 rounded",
    avatar: cn(
      "rounded-full bg-muted",
      size === 'sm' && "h-8 w-8",
      size === 'md' && "h-12 w-12",
      size === 'lg' && "h-16 w-16",
      size === 'xl' && "h-24 w-24"
    ),
    button: "bg-muted h-10 rounded-xl",
  };

  return (
    <div 
      className={cn(
        "animate-pulse rounded-md",
        variants[variant],
        className
      )} 
      {...props} 
    />
  );
}

/** Skeleton for a card with title and content */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/50 p-6 space-y-4", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** Skeleton for a list item */
function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <Skeleton variant="avatar" size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Skeleton for a profile block */
function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 p-6", className)}>
      <Skeleton variant="avatar" size="xl" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

/** Skeleton for a block in the editor */
function BlockSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/30 bg-card/30 p-4", className)}>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export { 
  Skeleton, 
  CardSkeleton, 
  ListItemSkeleton, 
  ProfileSkeleton, 
  BlockSkeleton 
};
