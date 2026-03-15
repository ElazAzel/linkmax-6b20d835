import { memo, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState as UiEmptyState } from '@/components/ui/states';

interface EmptyStateProps {
  icon: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
}

export const EmptyState = memo(function EmptyState(props: EmptyStateProps) {
  return <UiEmptyState {...props} />;
});
