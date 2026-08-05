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
