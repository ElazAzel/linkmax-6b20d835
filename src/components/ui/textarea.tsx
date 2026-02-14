import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-xl border bg-background/60 backdrop-blur-sm px-4 py-2 text-base ring-offset-background transition-all duration-300 ease-out placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border/50 hover:border-border/80 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 focus-visible:border-primary/60 focus-visible:bg-background/90 focus-visible:shadow-lg focus-visible:shadow-primary/10",
        glass:
          "border-border/30 bg-card/50 backdrop-blur-xl hover:bg-card/70 hover:border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 focus-visible:bg-card/80",
        minimal:
          "border-transparent bg-transparent hover:bg-muted/30 focus-visible:outline-none focus-visible:bg-muted/50 focus-visible:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  VariantProps<typeof textareaVariants> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
