/**
 * ActionCard - Quick action button with icon and description
 */
import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface ActionCardProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description?: string;
  onClick: () => void;
  gradient?: string;
  border?: string;
  className?: string;
}

export const ActionCard = memo(function ActionCard({
  icon: Icon,
  iconBg = 'bg-primary/20',
  iconColor = 'text-primary',
  title,
  description,
  onClick,
  gradient: _gradient = 'from-primary/15 to-violet-500/15',
  border = 'border-primary/20',
  className,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-md border bg-card p-[var(--space-card-p)] text-left transition-colors active:opacity-85",
        "hover:bg-accent/50",
        border,
        className
      )}
    >
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-md", iconBg)}>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <p className="font-bold">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </button>
  );
});
