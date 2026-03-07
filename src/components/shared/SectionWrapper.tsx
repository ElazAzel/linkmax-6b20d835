/**
 * SectionWrapper - Reusable landing/marketing section wrapper
 * Provides consistent padding, max-width, and analytics data attributes.
 */
import { memo, forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/utils';

interface SectionWrapperProps extends HTMLAttributes<HTMLElement> {
    /** Section ID for anchoring and analytics tracking */
    id?: string;
    /** Section content */
    children: ReactNode;
    /** Visual variant */
    variant?: 'default' | 'contained' | 'full-bleed';
    /** Custom className */
    className?: string;
    /** Remove default vertical padding */
    noPadding?: boolean;
}

export const SectionWrapper = memo(forwardRef<HTMLElement, SectionWrapperProps>(
    function SectionWrapper(
        { id, children, variant = 'default', className, noPadding = false, ...props },
        ref
    ) {
        const isFullBleed = variant === 'full-bleed';

        return (
            <section
                ref={ref}
                id={id}
                data-section={id}
                className={cn(
                    'relative w-full',
                    !noPadding && 'py-16 md:py-24',
                    className
                )}
                {...props}
            >
                {isFullBleed ? (
                    children
                ) : (
                    <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
                        {children}
                    </div>
                )}
            </section>
        );
    }
));
