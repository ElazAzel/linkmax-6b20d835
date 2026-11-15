/**
 * Shared pieces of the page settings sections.
 */
import type { ReactNode } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SettingsSectionProps {
  value: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ value, title, description, children }: SettingsSectionProps) {
  return (
    <AccordionItem value={value} className="rounded-2xl border border-border bg-card px-4">
      <AccordionTrigger
        className="py-4 text-left hover:no-underline"
        data-testid={`page-settings-section-${value}`}
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-bold uppercase tracking-[0.06em] text-foreground">{title}</span>
          {description && <span className="text-xs font-normal text-muted-foreground">{description}</span>}
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 pt-1 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

export function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </h3>
  );
}
