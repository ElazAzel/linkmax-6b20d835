import { Coins } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { cn } from '@/lib/utils';

interface TokenBalanceDisplayProps {
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function TokenBalanceDisplay({ onClick, compact, className }: TokenBalanceDisplayProps) {
  const { balance, loading } = useTokens();

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20',
        className
      )}
    >
      <Coins className={cn('text-yellow-500', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      <span className={cn('font-semibold text-yellow-500', compact ? 'text-xs' : 'text-sm')}>
        {loading ? '...' : balance?.balance || 0}
      </span>
    </button>
  );
}
