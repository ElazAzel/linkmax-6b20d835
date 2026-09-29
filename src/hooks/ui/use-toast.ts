import type * as React from "react";
import { toast as sonner } from "sonner";

/**
 * Compatibility layer for the old shadcn/Radix `useToast()` API.
 *
 * The app renders a single toast stack (sonner, see `components/ui/sonner`).
 * Two stacks were mounted before and could show two differently styled
 * notifications at once. New code should import `toast` from "sonner".
 */
interface LegacyToast {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

function toast({ title, description, variant, duration }: LegacyToast) {
  const message = title ?? description ?? "";
  const options = {
    description: title ? description : undefined,
    duration,
  };
  const id = variant === "destructive" ? sonner.error(message, options) : sonner(message, options);
  return {
    id: String(id),
    dismiss: () => sonner.dismiss(id),
  };
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonner.dismiss(toastId),
  };
}

export { useToast, toast };
