import { Check, Gift, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { type Quest } from '@/services/quests';

interface DailyQuestsPanelProps {
  quests: Quest[];
  completedQuests: string[];
  progress: { completed: number; total: number; bonusEarned: number };
  loading?: boolean;
}

export function DailyQuestsPanel({ 
  quests, 
  completedQuests, 
  progress,
  loading 
}: DailyQuestsPanelProps) {
  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-2 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = (progress.completed / progress.total) * 100;
  const allCompleted = progress.completed === progress.total;

  return (
    <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Ежедневные задания</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{progress.completed}/{progress.total}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {allCompleted 
            ? `🎉 Все задания выполнены! +${progress.bonusEarned}ч trial`
            : `+${progress.bonusEarned}ч trial заработано`
          }
        </p>
      </div>

      {/* Quest List */}
      <div className="space-y-2">
        {quests.map(quest => {
          const isCompleted = completedQuests.includes(quest.key);
          
          return (
            <div
              key={quest.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                isCompleted 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-muted/50 border border-transparent"
              )}
            >
              <span className="text-xl">{quest.icon}</span>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isCompleted && "text-primary"
                )}>
                  {quest.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {quest.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  isCompleted 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}>
                  +{quest.bonusHours}ч
                </span>
                
                {isCompleted && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
