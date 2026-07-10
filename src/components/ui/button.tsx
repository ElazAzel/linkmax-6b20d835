import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

import { cn } from "@/lib/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_26px_-14px_hsl(var(--primary)/0.8)] hover:bg-primary/90 hover:shadow-[0_16px_30px_-14px_hsl(var(--primary)/0.72)] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:bg-destructive/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border bg-card/80 hover:bg-accent/70 hover:text-accent-foreground hover:border-primary/45 hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/60 shadow-sm hover:bg-secondary/80 hover:border-primary/25 hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground backdrop-blur-sm active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0 focus-visible:ring-offset-0",
        glass:
          "bg-card/82 backdrop-blur-xl border border-border/70 text-foreground shadow-soft hover:bg-card hover:shadow-lift hover:border-primary/25 hover:-translate-y-0.5 active:translate-y-0",
        premium:
          "bg-foreground text-background border border-foreground shadow-soft hover:bg-foreground/90 hover:shadow-lift hover:-translate-y-0.5 active:translate-y-0",
        success:
          "bg-success text-success-foreground shadow-lg shadow-success/25 hover:bg-success/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        warning:
          "bg-warning text-warning-foreground shadow-lg shadow-warning/25 hover:bg-warning/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        subtle:
          "bg-accent/50 text-accent-foreground border border-border/40 hover:bg-accent hover:border-border/60 hover:shadow-sm active:translate-y-0",
      },
      size: {
        default: "h-10 min-h-[44px] px-5 py-2.5 text-sm",
        sm: "h-10 min-h-[44px] rounded-xl px-4 text-xs sm:h-9 sm:min-h-[40px]",
        lg: "h-12 min-h-[48px] rounded-2xl px-7 text-base",
        xl: "h-14 min-h-[52px] rounded-2xl px-9 text-lg",
        "2xl": "h-16 min-h-[56px] rounded-3xl px-11 text-xl",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading...</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
