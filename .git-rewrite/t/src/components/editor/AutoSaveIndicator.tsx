import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export function AutoSaveIndicator({ status, className }: AutoSaveIndicatorProps) {
  const { t } = useTranslation();
  const [showSaved, setShowSaved] = useState(false);

  // Show "saved" for 3 seconds after save completes
  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const displayStatus = showSaved ? 'saved' : status;

  const getIcon = () => {
    switch (displayStatus) {
      case 'pending':
        return <Cloud className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />;
      case 'saving':
        return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case 'saved':
        return <Check className="h-3.5 w-3.5 text-green-500" />;
      case 'error':
        return <CloudOff className="h-3.5 w-3.5 text-destructive" />;
      default:
        return <Cloud className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
  };

  const getText = () => {
    switch (displayStatus) {
      case 'pending':
        return t('autosave.pending', 'Pending...');
      case 'saving':
        return t('autosave.saving', 'Saving...');
      case 'saved':
        return t('autosave.saved', 'Saved');
      case 'error':
        return t('autosave.error', 'Error');
      default:
        return null;
    }
  };

  const text = getText();

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 text-xs transition-all duration-300",
        displayStatus === 'saved' && "text-green-500",
        displayStatus === 'error' && "text-destructive",
        displayStatus === 'saving' && "text-primary",
        (displayStatus === 'idle' || displayStatus === 'pending') && "text-muted-foreground",
        className
      )}
    >
      {getIcon()}
      {text && <span className="hidden sm:inline">{text}</span>}
    </div>
  );
}
