import { useTranslation } from 'react-i18next';
import { Flame, Trophy, Gift, Calendar, TrendingUp, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStreak } from '@/hooks/useStreak';
import { getNextMilestone, STREAK_MILESTONES } from '@/services/streak';

interface StreakDisplayProps {
  userId: string | undefined;
  compact?: boolean;
}

export function StreakDisplay({ userId, compact = false }: StreakDisplayProps) {
  const { t } = useTranslation();
  const { streakData, loading, milestoneReached, dismissMilestone } = useStreak(userId);

  if (loading || !streakData) {
    return null;
  }

  const nextMilestone = getNextMilestone(streakData.currentStreak);
  const progress = nextMilestone 
    ? (streakData.currentStreak / nextMilestone.days) * 100 
    : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-bold text-orange-500">{streakData.currentStreak}</span>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-orange-500/10 via-red-500/5 to-amber-500/10 backdrop-blur-xl border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{t('streak.title', 'Daily Streak')}</h3>
                <p className="text-xs text-muted-foreground">{t('streak.keepGoing', 'Keep it going!')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500">{streakData.currentStreak}</div>
              <div className="text-xs text-muted-foreground">{t('streak.days', 'days')}</div>
            </div>
          </div>

          {/* Progress to next milestone */}
          {nextMilestone && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('streak.nextMilestone', 'Next milestone')}</span>
                <span className="font-medium">
                  {nextMilestone.days} {t('streak.days', 'days')} 
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                    +{nextMilestone.bonus} {t('streak.bonusDays', 'bonus days')}
                  </Badge>
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-orange-500/20" />
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>{t('streak.best', 'Best')}: {streakData.longestStreak}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gift className="h-3.5 w-3.5 text-green-500" />
              <span>{t('streak.earned', 'Earned')}: +{streakData.bonusDaysEarned} {t('streak.days', 'days')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Dialog */}
      <Dialog open={!!milestoneReached} onOpenChange={() => dismissMilestone()}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 {t('streak.milestoneReached', 'Milestone Reached!')}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/50 animate-bounce">
              <Flame className="h-12 w-12 text-white" />
            </div>
            <div className="text-4xl font-bold text-orange-500">
              {milestoneReached?.currentStreak} {t('streak.days', 'days')}
            </div>
            <p className="text-muted-foreground">
              {t('streak.bonusEarned', "You've earned")} <span className="font-bold text-green-500">+{milestoneReached?.bonusDays}</span> {t('streak.bonusTrialDays', 'bonus trial days!')}
            </p>
          </div>
          <Button onClick={dismissMilestone} className="w-full">
            {t('streak.awesome', 'Awesome!')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StreakMilestones() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        {t('streak.milestones', 'Streak Milestones')}
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {STREAK_MILESTONES.map((milestone) => (
          <div
            key={milestone.days}
            className="text-center p-2 rounded-lg bg-background/50 border border-border/30"
          >
            <div className="text-sm font-bold">{milestone.days}</div>
            <div className="text-[10px] text-muted-foreground">{t('streak.days', 'days')}</div>
            <Badge variant="secondary" className="mt-1 text-[9px] px-1">
              +{milestone.bonus}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
