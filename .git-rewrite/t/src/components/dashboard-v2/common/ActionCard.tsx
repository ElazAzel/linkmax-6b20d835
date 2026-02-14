/**
 * ActionCard - Quick action button with icon and description
 */
import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  gradient = 'from-primary/15 to-violet-500/15',
  border = 'border-primary/20',
  className,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-5 rounded-3xl text-left transition-all active:scale-[0.98]",
        `bg-gradient-to-br ${gradient}`,
        `border ${border}`,
        className
      )}
    >
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-3", iconBg)}>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <p className="font-bold">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </button>
  );
});
