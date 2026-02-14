import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  NAME_ANIMATION_OPTIONS, 
  NAME_ANIMATION_CSS,
  getNameAnimationClass,
  type NameAnimationType,
} from '@/lib/profile-frame-system';

interface NameAnimationSelectorProps {
  value: NameAnimationType;
  onChange: (value: NameAnimationType) => void;
  isPremium: boolean;
  previewName?: string;
  onUpgradeClick?: () => void;
}

export const NameAnimationSelector = memo(function NameAnimationSelector({
  value,
  onChange,
  isPremium,
  previewName = 'Ваше Имя',
  onUpgradeClick,
}: NameAnimationSelectorProps) {
  const { t } = useTranslation();

  const handleSelect = (animation: NameAnimationType) => {
    if (animation !== 'none' && !isPremium) {
      onUpgradeClick?.();
      return;
    }
    onChange(animation);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {t('nameAnimation.title', 'Анимация имени')}
        </Label>
        {!isPremium && (
          <span className="text-[10px] text-warning bg-warning/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3" />
            PRO
          </span>
        )}
      </div>
      
      {/* Preview */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
        <style>{NAME_ANIMATION_CSS}</style>
        <h3 className={cn(
          'text-xl font-bold transition-all',
          getNameAnimationClass(value)
        )}>
          {previewName}
        </h3>
      </div>
      
      {/* Animation options grid */}
      <div className="grid grid-cols-2 gap-2">
        {NAME_ANIMATION_OPTIONS.map((option) => {
          const isLocked = option.isPro && !isPremium;
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex items-center justify-between gap-2 p-3 rounded-xl border transition-all duration-200',
                'hover:bg-muted/50 text-left',
                isSelected && 'bg-primary/10 border-primary ring-1 ring-primary',
                !isSelected && 'border-border/50',
                isLocked && 'opacity-60'
              )}
            >
              <span className="text-sm font-medium truncate">
                {t(option.labelKey, option.label)}
              </span>
              
              {isLocked ? (
                <Lock className="w-4 h-4 text-warning flex-shrink-0" />
              ) : option.isPro && isPremium ? (
                <Crown className="w-4 h-4 text-warning flex-shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>
      
      {!isPremium && (
        <button
          onClick={onUpgradeClick}
          className="w-full flex items-center justify-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl hover:bg-warning/20 transition-colors"
        >
          <Crown className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium text-warning">
            {t('nameAnimation.unlockAll', 'Разблокировать все анимации')}
          </span>
        </button>
      )}
    </div>
  );
});
