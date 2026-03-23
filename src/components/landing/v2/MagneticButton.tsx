import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    strength?: number;
    onClick?: () => void;
}

export const MagneticButton = ({
    children,
    className,
    variant = 'default',
    size = 'default',
    strength = 30,
    ...props
}: MagneticButtonProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('translate(0px, 0px)');

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = ref.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = (e.clientX - (left + width / 2)) / (strength / 2);
        const y = (e.clientY - (top + height / 2)) / (strength / 2);
        setTransform(`translate(${x}px, ${y}px)`);
    }, [strength]);

    const handleMouseLeave = useCallback(() => {
        setTransform('translate(0px, 0px)');
    }, []);

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform, transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            className="inline-block"
        >
            <Button
                className={cn("relative overflow-hidden group transition-all duration-300", className)}
                variant={variant}
                size={size}
                {...props}
            >
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            </Button>
        </div>
    );
};
