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
  gradient = 'from-primary/15 to-violet-500/15',
  border = 'border-primary/20',
  className,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-5 rounded-[2rem] text-left transition-all active:scale-[0.97] relative overflow-hidden group",
        "glass hover:bg-white/10 hover:translate-y-[-4px]",
        "shadow-glass hover:shadow-glass-lg",
        "border border-white/10",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500", gradient)} />
      <div className={cn("h-12 w-12 rounded-[1.25rem] flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", iconBg)}>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <p className="font-bold">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </button>
  );
});
