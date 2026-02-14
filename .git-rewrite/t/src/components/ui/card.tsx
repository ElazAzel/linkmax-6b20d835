import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border text-card-foreground transition-all duration-400 ease-out",
  {
    variants: {
      variant: {
        default:
          "border-border/50 bg-card/85 backdrop-blur-xl shadow-glass hover:shadow-glass-lg hover:border-border/70 hover:-translate-y-0.5",
        glass:
          "border-border/30 bg-card/60 backdrop-blur-2xl shadow-glass hover:bg-card/75 hover:shadow-glass-lg hover:border-border/50",
        solid:
          "border-border/40 bg-card shadow-lg hover:shadow-xl hover:-translate-y-1",
        outline:
          "border-2 border-border/60 bg-transparent hover:bg-card/30 hover:border-primary/40",
        interactive:
          "border-border/50 bg-card/85 backdrop-blur-xl shadow-glass cursor-pointer hover:shadow-glass-lg hover:border-primary/40 hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.99] active:translate-y-0",
        premium:
          "border-primary/20 bg-gradient-to-br from-card/90 via-card/80 to-primary/5 backdrop-blur-xl shadow-glass-lg hover:shadow-glass-xl hover:border-primary/40 hover:-translate-y-1",
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
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-none tracking-tight", className)}
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
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };