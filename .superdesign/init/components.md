# Shared UI components

Generated from the current LinkMAX React source for Superdesign context.

## Button

Path: `src/components/ui/button.tsx`. Shared shadcn/Radix button with project variants.

```tsx
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

```

## Input

Path: `src/components/ui/input.tsx`. Shared form input.

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/utils";

const inputVariants = cva(
  "flex w-full rounded-control border bg-card px-4 py-2 text-base ring-offset-background transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0 focus-visible:border-primary/70 focus-visible:shadow-soft",
        glass:
          "border-border/70 bg-card/82 backdrop-blur-xl hover:bg-card hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/60",
        minimal:
          "border-transparent bg-transparent hover:bg-muted/30 focus-visible:outline-none focus-visible:bg-muted/50 focus-visible:ring-0",
      },
      inputSize: {
        default: "h-11 min-h-[44px]",
        sm: "h-9 min-h-[40px] text-sm px-3",
        lg: "h-12 min-h-[48px] text-lg px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };

```

## Card

Path: `src/components/ui/card.tsx`. Shared surface primitives.

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/utils";

const cardVariants = cva(
  "rounded-card text-card-foreground transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default:
          "border border-border/75 bg-card shadow-soft hover:border-border",
        glass:
          "border border-border/65 bg-card/82 backdrop-blur-xl shadow-soft hover:bg-card/94 hover:shadow-lift hover:border-primary/20",
        solid:
          "border border-border/70 bg-card shadow-soft hover:shadow-lift",
        outline:
          "border-2 border-border/60 bg-transparent hover:bg-card/40 hover:border-primary/40",
        interactive:
          "border border-border/75 bg-card shadow-soft cursor-pointer hover:shadow-lift hover:border-primary/45 hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0",
        premium:
          "border border-primary/30 bg-card shadow-lift hover:border-primary/55 hover:-translate-y-0.5",
        borderless:
          "border-0 bg-transparent shadow-none",
        crisp:
          "border border-border/50 bg-card shadow-sm",
        elevated:
          "border border-border/70 bg-card shadow-lift hover:border-primary/25 hover:-translate-y-0.5 active:translate-y-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 sm:p-6 pt-0 sm:pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2 p-4 sm:p-6 pt-0 sm:pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };

```

