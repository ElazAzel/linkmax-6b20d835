/**
 * EditorSection - Reusable section component for block editors
 * Groups related settings with expandable/collapsible behavior
 * Enhanced with framer-motion animations and visual polish
 */
import { memo, useState, ReactNode, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EditorSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  /** Number of filled fields in this section */
  filledCount?: number;
  /** Total number of fields in this section */
  totalCount?: number;
  /** Whether this section has validation errors */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Compact mode for mobile */
  compact?: boolean;
}

// Smooth animation variants
const contentVariants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2, delay: 0.05 },
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.15 },
    },
  },
};

// Progress badge component
const ProgressBadge = memo(function ProgressBadge({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  const isComplete = filled === total && total > 0;

  return (
    <Badge
      variant={isComplete ? 'default' : 'secondary'}
      className={cn(
        "h-5 px-1.5 text-xs font-medium transition-colors",
        isComplete && "bg-green-500/10 text-green-600 border-green-500/20"
      )}
    >
      {isComplete ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <span>{filled}/{total}</span>
      )}
    </Badge>
  );
});

export const EditorSection = memo(function EditorSection({
  title,
  description,
  icon,
  badge,
  children,
  defaultOpen = true,
  collapsible = true,
  filledCount,
  totalCount,
  hasError = false,
  errorMessage,
  compact = false,
}: EditorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // Show progress if both counts are provided
  const showProgress = filledCount !== undefined && totalCount !== undefined;

  // Non-collapsible variant
  if (!collapsible) {
    return (
      <div className="space-y-4">
        <div className={cn("flex items-center gap-3", compact && "gap-2")}>
          {icon && (
            <div className={cn(
              "rounded-xl bg-primary/10 flex items-center justify-center shrink-0",
              compact ? "h-8 w-8" : "h-10 w-10"
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn("font-bold", compact ? "text-sm" : "text-base")}>{title}</h3>
              {badge}
              {showProgress && <ProgressBadge filled={filledCount} total={totalCount} />}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300",
        "glass-card backdrop-blur-xl",
        hasError
          ? "border-2 border-destructive/50 ring-4 ring-destructive/10"
          : "border-white/10 shadow-glass",
        isOpen && "shadow-glass-lg"
      )}
    >
      {/* Header button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 text-left transition-colors",
          compact ? "p-3" : "p-4",
          "hover:bg-muted/30 active:bg-muted/50",
          isOpen && "border-b border-border/10"
        )}
      >
        {icon && (
          <motion.div
            className={cn(
              "rounded-xl flex items-center justify-center shrink-0 transition-colors",
              compact ? "h-8 w-8" : "h-10 w-10",
              hasError ? "bg-destructive/10" : "bg-primary/10"
            )}
            animate={{ scale: isOpen ? 1 : 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn("font-bold", compact ? "text-sm" : "text-sm")}>{title}</h3>
            {badge}
            {showProgress && <ProgressBadge filled={filledCount} total={totalCount} />}
            {hasError && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Ошибка
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={contentRef}
            variants={contentVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className={cn("space-y-4", compact ? "p-3" : "p-4")}>
              {/* Error message */}
              {hasError && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Enhanced field row component with validation
interface EditorFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  /** Inline layout for compact fields */
  inline?: boolean;
}

export const EditorField = memo(function EditorField({
  label,
  hint,
  children,
  required,
  error,
  inline = false,
}: EditorFieldProps) {
  return (
    <div className={cn(
      inline ? "flex items-center gap-4" : "space-y-2"
    )}>
      <label className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        inline && "shrink-0 min-w-[100px]"
      )}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">*</span>
        )}
      </label>
      <div className={cn(inline && "flex-1")}>
        {children}
      </div>
      <AnimatePresence>
        {(hint || error) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "text-xs",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error || hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

// Divider component for separating sections
export const EditorDivider = memo(function EditorDivider() {
  return (
    <div className="py-2">
      <div className="h-px bg-border/50" />
    </div>
  );
});

// Quick toggle component for boolean settings
interface EditorToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
}

export const EditorToggle = memo(function EditorToggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: EditorToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
        "hover:bg-muted/30 active:scale-[0.99]",
        checked && "bg-primary/5 border border-primary/20"
      )}
    >
      {icon && (
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          checked ? "bg-primary/10 text-primary" : "bg-muted"
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className={cn(
        "h-6 w-10 rounded-full transition-colors p-0.5",
        checked ? "bg-primary" : "bg-muted"
      )}>
        <motion.div
          className="h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </button>
  );
});
