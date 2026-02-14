import { useTranslation } from 'react-i18next';
import { ProfileSkeleton, BlockSkeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  message?: string;
  variant?: 'default' | 'dashboard' | 'minimal';
}

export function LoadingState({ message, variant = 'default' }: LoadingStateProps) {
  const { t } = useTranslation();
  const loadingMessage = message || t('messages.loading', 'Загрузка...');

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-[100px]" />
        </div>
        
        <div className="relative container mx-auto max-w-md px-4 py-8 space-y-6">
          {/* Profile skeleton */}
          <ProfileSkeleton className="rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/30" />
          
          {/* Block skeletons */}
          <div className="space-y-4">
            <BlockSkeleton />
            <BlockSkeleton />
            <BlockSkeleton />
          </div>
          
          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <LoadingSpinner size="sm" />
            <span className="text-muted-foreground text-sm">{loadingMessage}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[120px] animate-morph" />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[100px] animate-morph"
          style={{ animationDelay: '-5s' }}
        />
      </div>
      <div className="relative text-center p-8 rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/30 shadow-glass-lg">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">{loadingMessage}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  const errorMessage = message || t('messages.error', 'Ошибка загрузки');
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-destructive/10 to-transparent rounded-full blur-[100px]" />
      </div>
      <div className="relative text-center p-8 rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/30 shadow-glass space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-xl">!</span>
        </div>
        <p className="text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-sm text-primary hover:underline"
          >
            {t('actions.retry', 'Попробовать снова')}
          </button>
        )}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-border/30" />
      {/* Spinning gradient */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
        style={{
          borderTopColor: 'hsl(var(--primary))',
          borderRightColor: 'hsl(var(--primary) / 0.3)',
          animationDuration: '0.8s',
        }}
      />
      {/* Inner glow */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
    </div>
  );
}
