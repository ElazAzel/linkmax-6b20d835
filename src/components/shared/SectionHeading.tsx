/**
 * SectionHeading - Standard section heading with optional badge
 * Localization-safe: all text props come from translation keys.
 * Supports text-gradient and balanced wrapping for multilingual.
 */
import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils/utils';
import { Badge } from '@/components/ui/badge';

interface SectionHeadingProps {
    /** Optional badge text (e.g. "New", "AI Powered") */
    badge?: string;
    /** Badge icon — rendered before badge text */
    badgeIcon?: ReactNode;
    /** Main heading */
    title: string;
    /** Optional subtitle / description */
    subtitle?: string;
    /** Alignment */
    align?: 'center' | 'left';
    /** Apply text-gradient to title */
    gradient?: boolean;
    /** Custom className for the wrapper */
    className?: string;
    /** Custom className for the title */
    titleClassName?: string;
}

export const SectionHeading = memo(function SectionHeading({
    badge,
    badgeIcon,
    title,
    subtitle,
    align = 'center',
    gradient = false,
    className,
    titleClassName,
}: SectionHeadingProps) {
    return (
        <div
            className={cn(
                'mb-10 md:mb-14',
                align === 'center' && 'text-center',
                className
            )}
        >
            {badge && (
                <Badge
                    variant="outline"
                    className="mb-4 h-7 px-3 py-1 text-xs bg-background/50 backdrop-blur-sm border-primary/20 text-primary gap-1.5 inline-flex"
                >
                    {badgeIcon}
                    <span className="font-medium">{badge}</span>
                </Badge>
            )}
            <h2
                className={cn(
                    'text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight',
                    'text-balance leading-tight',
                    gradient && 'text-gradient',
                    align === 'center' && 'max-w-3xl mx-auto',
                    titleClassName
                )}
            >
                {title}
            </h2>
            {subtitle && (
                <p
                    className={cn(
                        'mt-4 text-base md:text-lg text-muted-foreground leading-relaxed',
                        align === 'center' && 'max-w-2xl mx-auto'
                    )}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
});
