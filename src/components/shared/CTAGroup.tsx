/**
 * CTAGroup - Responsive CTA button group
 * Auto-stacks on mobile, inline on desktop.
 * No fixed widths — i18n safe for long/short translations.
 */
import { memo, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface CTAAction {
    /** Button text */
    label: string;
    /** Click handler */
    onClick?: () => void;
    /** Button variant — defaults to 'default' for primary, 'outline' for secondary */
    variant?: ButtonProps['variant'];
    /** Button size — defaults to 'lg' */
    size?: ButtonProps['size'];
    /** Optional icon rendered after label */
    icon?: ReactNode;
    /** Custom className */
    className?: string;
}

interface CTAGroupProps {
    /** Primary CTA */
    primary: CTAAction;
    /** Optional secondary CTA */
    secondary?: CTAAction;
    /** Force layout */
    layout?: 'inline' | 'stack' | 'auto';
    /** Alignment */
    align?: 'center' | 'left';
    /** Custom className */
    className?: string;
}

export const CTAGroup = memo(function CTAGroup({
    primary,
    secondary,
    layout = 'auto',
    align = 'center',
    className,
}: CTAGroupProps) {
    return (
        <div
            className={cn(
                'flex gap-3 w-full sm:w-auto',
                layout === 'stack'
                    ? 'flex-col'
                    : layout === 'inline'
                        ? 'flex-row'
                        : 'flex-col sm:flex-row', // auto: stack on mobile, inline on desktop
                align === 'center' && 'items-center justify-center',
                className
            )}
        >
            <Button
                onClick={primary.onClick}
                variant={primary.variant || 'default'}
                size={primary.size || 'lg'}
                className={cn(
                    'h-12 sm:h-14 px-6 sm:px-8 rounded-2xl font-semibold text-base sm:text-lg shadow-lg shadow-primary/20',
                    primary.className
                )}
            >
                {primary.label}
                {primary.icon && <span className="ml-1.5">{primary.icon}</span>}
            </Button>

            {secondary && (
                <Button
                    onClick={secondary.onClick}
                    variant={secondary.variant || 'outline'}
                    size={secondary.size || 'lg'}
                    className={cn(
                        'h-12 sm:h-14 px-6 sm:px-8 rounded-2xl font-medium text-base sm:text-lg',
                        secondary.className
                    )}
                >
                    {secondary.icon && <span className="mr-1.5">{secondary.icon}</span>}
                    {secondary.label}
                </Button>
            )}
        </div>
    );
});
