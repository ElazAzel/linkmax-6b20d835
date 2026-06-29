import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

import { cn } from "@/lib/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:bg-destructive/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-border/60 bg-background/60 backdrop-blur-sm hover:bg-accent/60 hover:text-accent-foreground hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-secondary/90 text-secondary-foreground backdrop-blur-sm shadow-sm hover:bg-secondary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground backdrop-blur-sm active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0 focus-visible:ring-offset-0",
        glass:
          "bg-card/70 backdrop-blur-2xl border border-border/40 text-foreground shadow-glass hover:bg-card/85 hover:shadow-glass-lg hover:border-border/60 hover:-translate-y-0.5 active:translate-y-0",
        premium:
          "bg-gradient-to-r from-primary via-blue-500 to-violet-600 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 animate-gradient-x bg-[length:200%_auto]",
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
