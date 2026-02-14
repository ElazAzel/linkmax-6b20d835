/**
 * Reusable AI generation button component
 */

import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  title?: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function AIButton({
  onClick,
  loading,
  disabled = false,
  title = 'Generate with AI',
  variant = 'icon',
  className = '',
}: AIButtonProps) {
  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onClick}
        disabled={loading || disabled}
        title={title}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading || disabled}
      className={`w-full ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          {title}
        </>
      )}
    </Button>
  );
}
