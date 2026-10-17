import type { ReactNode } from 'react';

/**
 * What an empty block looks like to its owner in the editor: a dashed card
 * with a short hint, tall enough to tap. Visitors never get it (the block
 * renders nothing on the live page).
 */
export function EmptyBlockHint({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[72px] w-full items-center justify-center gap-2 rounded-[inherit] border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
      {icon}
      <span>{children}</span>
    </div>
  );
}
