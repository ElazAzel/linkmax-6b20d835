import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, X, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/hooks/useAchievements';
import type { Achievement } from '@/types/achievements';
import { useTranslation } from 'react-i18next';

interface AchievementsPanelProps {
  onClose: () => void;
}

export function AchievementsPanel({ onClose }: AchievementsPanelProps) {
  const { getAllAchievements, getAchievementsByCategory, getProgress } = useAchievements();
  const { t } = useTranslation();
  const progress = getProgress();
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');

  const achievements = selectedCategory === 'all' 
    ? getAllAchievements() 
    : getAchievementsByCategory(selectedCategory);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const categories = [
    { key: 'all' as const, label: t('achievements.categories.all', 'Все'), icon: '🏆' },
    { key: 'blocks' as const, label: t('achievements.categories.blocks', 'Блоки'), icon: '🧩' },
    { key: 'features' as const, label: t('achievements.categories.features', 'Функции'), icon: '⚡' },
    { key: 'milestones' as const, label: t('achievements.categories.milestones', 'Вехи'), icon: '🎯' },
    { key: 'social' as const, label: t('achievements.categories.social', 'Соц.'), icon: '🌟' },
  ];

  const getRarityGradient = (rarity: Achievement['rarity'], unlocked: boolean) => {
    if (!unlocked) return 'bg-muted/50';
    
    switch (rarity) {
      case 'common': return 'bg-gradient-to-br from-slate-400 to-slate-600';
      case 'rare': return 'bg-gradient-to-br from-blue-400 to-blue-600';
      case 'epic': return 'bg-gradient-to-br from-purple-400 to-purple-600';
      case 'legendary': return 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('achievements.title', 'Достижения')}</h2>
              <p className="text-xs text-muted-foreground">
                {t('achievements.progress', '{{unlocked}} из {{total}} открыто', {
                  unlocked: progress.unlocked,
                  total: progress.total,
                })}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-10 w-10 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Progress value={progress.percentage} className="h-3 rounded-full" />
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary border-2 border-background shadow-lg transition-all duration-500"
              style={{ left: `calc(${Math.min(progress.percentage, 97)}% - 10px)` }}
            >
              <Sparkles className="h-3 w-3 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-medium text-foreground">{progress.percentage}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Categories - Horizontal scroll */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {categories.map(category => (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(category.key)}
              className={cn(
                "whitespace-nowrap rounded-xl h-9 px-3 text-sm gap-1.5 flex-shrink-0",
                selectedCategory === category.key && "shadow-md"
              )}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Achievements List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Unlocked Section */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t('achievements.sections.unlocked', 'Открытые ({{count}})', {
                  count: unlockedAchievements.length,
                })}
              </h3>
            </div>
            <div className="space-y-2">
              {unlockedAchievements.map(achievement => (
                <div
                  key={achievement.key}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 text-white",
                    getRarityGradient(achievement.rarity, true)
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{achievement.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm truncate">{t(achievement.titleKey)}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 flex-shrink-0">
                          {t(`achievements.rarity.${achievement.rarity}`)}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 mt-0.5 line-clamp-1">
                        {t(achievement.descriptionKey)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0" />
                  </div>
                  
                  {/* Shimmer effect for legendary */}
                  {achievement.rarity === 'legendary' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Section */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                {t('achievements.sections.locked', 'Заблокированные ({{count}})', {
                  count: lockedAchievements.length,
                })}
              </h3>
            </div>
            <div className="space-y-2">
              {lockedAchievements.map(achievement => (
                <div
                  key={achievement.key}
                  className="rounded-2xl p-4 bg-muted/30 border border-dashed border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm text-muted-foreground truncate">
                          {t(achievement.titleKey)}
                        </h4>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full flex-shrink-0",
                          achievement.rarity === 'legendary' && "bg-amber-500/20 text-amber-600",
                          achievement.rarity === 'epic' && "bg-purple-500/20 text-purple-600",
                          achievement.rarity === 'rare' && "bg-blue-500/20 text-blue-600",
                          achievement.rarity === 'common' && "bg-muted text-muted-foreground"
                        )}>
                          {t(`achievements.rarity.${achievement.rarity}`)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {t(achievement.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {achievements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{t('achievements.emptyTitle', 'Нет достижений')}</h3>
            <p className="text-sm text-muted-foreground">{t('achievements.emptyDescription', 'В этой категории пока нет достижений')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
