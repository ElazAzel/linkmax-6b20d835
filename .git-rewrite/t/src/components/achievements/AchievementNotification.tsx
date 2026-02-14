import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import type { Achievement } from '@/types/achievements';
import { RARITY_LABELS } from '@/types/achievements';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementNotification({ achievement, onDismiss }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { playAchievement } = useSoundEffects();

  useEffect(() => {
    // Play achievement sound
    playAchievement();
    
    // Show notification with animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [playAchievement]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  const getRarityGradient = () => {
    switch (achievement.rarity) {
      case 'common': return 'from-slate-500 to-slate-700';
      case 'rare': return 'from-blue-500 to-blue-700';
      case 'epic': return 'from-purple-500 to-purple-700';
      case 'legendary': return 'from-amber-400 via-orange-500 to-red-500';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  return (
    <div
      className={cn(
        "fixed z-[100] transition-all duration-300 ease-out",
        // Mobile: bottom centered, Desktop: top right
        "bottom-4 left-4 right-4 sm:bottom-auto sm:top-20 sm:left-auto sm:right-4 sm:w-80",
        isVisible && !isExiting 
          ? "translate-y-0 opacity-100 scale-100" 
          : "translate-y-4 sm:translate-y-0 sm:translate-x-4 opacity-0 scale-95"
      )}
    >
      <div 
        className={cn(
          "relative overflow-hidden rounded-2xl sm:rounded-xl p-4 shadow-2xl border border-white/20",
          "bg-gradient-to-br text-white",
          getRarityGradient()
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                {RARITY_LABELS[achievement.rarity]}
              </div>
              <div className="text-sm font-bold">Новое достижение!</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 rounded-lg -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Achievement info */}
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-bounce">
            <span className="text-3xl">{achievement.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-base truncate">{achievement.title}</h5>
            <p className="text-sm opacity-90 line-clamp-2">{achievement.description}</p>
          </div>
        </div>

        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-xl">
          <div className="absolute top-2 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
          <div className="absolute bottom-4 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.9s' }} />
        </div>

        {/* Shimmer effect for legendary */}
        {achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite] rounded-2xl sm:rounded-xl" />
        )}
      </div>
    </div>
  );
}
