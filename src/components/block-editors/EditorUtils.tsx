import { cn } from '@/lib/utils/utils';
import { ReactNode } from 'react';

/**
 * Reusable alignment button for block editors
 */
export function AlignmentButton({
    value,
    current,
    icon,
    label,
    onClick
}: {
    value: string;
    current: string;
    icon: ReactNode;
    label: string;
    onClick: (value: string) => void;
}) {
    const isActive = current === value;
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all",
                "hover:bg-muted/50 active:scale-95",
                isActive && "bg-primary/10 ring-2 ring-primary/20"
            )}
        >
            <div className={cn(
                "transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </button>
    );
}
