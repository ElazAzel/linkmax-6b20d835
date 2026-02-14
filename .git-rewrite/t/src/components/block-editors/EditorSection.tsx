/**
 * EditorSection - Reusable section component for block editors
 * Groups related settings with expandable/collapsible behavior
 */
import { memo, useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

export const EditorSection = memo(function EditorSection({
  title,
  description,
  icon,
  badge,
  children,
  defaultOpen = true,
  collapsible = true,
}: EditorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">{title}</h3>
              {badge}
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
    <div className="border border-border/10 rounded-2xl bg-card/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors",
          "hover:bg-muted/30 active:bg-muted/50",
          isOpen && "border-b border-border/10"
        )}
      >
        {icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{title}</h3>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </div>
  );
});

// Simple field row component
interface EditorFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}

export const EditorField = memo(function EditorField({
  label,
  hint,
  children,
  required,
}: EditorFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
});
