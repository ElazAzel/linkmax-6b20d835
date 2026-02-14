import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Target, Clock, Gift, 
  Users, Blocks, Eye, Heart, Share2,
  CheckCircle2, Sparkles
} from 'lucide-react';
import { useSocialFeatures } from '@/hooks/useSocialFeatures';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface WeeklyChallengesPanelProps {
  compact?: boolean;
}

const CHALLENGE_ICONS: Record<string, React.ReactNode> = {
  invite_friends: <Users className="h-5 w-5" />,
  add_blocks: <Blocks className="h-5 w-5" />,
  get_views: <Eye className="h-5 w-5" />,
  like_pages: <Heart className="h-5 w-5" />,
  share_page: <Share2 className="h-5 w-5" />
};

const CHALLENGE_COLORS: Record<string, string> = {
  invite_friends: 'from-blue-500 to-purple-500',
  add_blocks: 'from-green-500 to-emerald-500',
  get_views: 'from-amber-500 to-orange-500',
  like_pages: 'from-pink-500 to-rose-500',
  share_page: 'from-indigo-500 to-violet-500'
};

export function WeeklyChallengesPanel({ compact }: WeeklyChallengesPanelProps) {
  const { t } = useTranslation();
  const { progress, loading, claimChallenge, stats } = useSocialFeatures();

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('social.weeklyChallenges.title', 'Недельные челленджи')}</p>
            <p className="text-xs text-muted-foreground">
              {t('social.weeklyChallenges.completed', '{{completed}}/{{total}} выполнено', {
                completed: stats.completedChallenges,
                total: progress.length,
              })}
            </p>
          </div>
          {stats.unclaimedRewards > 0 && (
            <Badge className="bg-primary text-primary-foreground animate-pulse">
              {t('social.weeklyChallenges.rewardHoursShort', '+{{count}}ч', { count: stats.totalRewardHours })}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">{t('social.weeklyChallenges.title', 'Недельные челленджи')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('social.weeklyChallenges.refreshesOnMonday', 'Обновляются каждый понедельник')}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {t('social.weeklyChallenges.daysLeftShort', '{{count}} дн.', { count: getDaysLeft() })}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/50 rounded-xl p-3 text-center border border-border/30">
          <p className="text-lg font-bold text-primary">{stats.completedChallenges}</p>
          <p className="text-[10px] text-muted-foreground">
            {t('social.weeklyChallenges.stats.completed', 'Выполнено')}
          </p>
        </div>
        <div className="bg-card/50 rounded-xl p-3 text-center border border-border/30">
          <p className="text-lg font-bold text-amber-500">{stats.unclaimedRewards}</p>
          <p className="text-[10px] text-muted-foreground">
            {t('social.weeklyChallenges.stats.rewards', 'Награды')}
          </p>
        </div>
        <div className="bg-card/50 rounded-xl p-3 text-center border border-border/30">
          <p className="text-lg font-bold text-green-500">
            {t('social.weeklyChallenges.rewardHoursShort', '+{{count}}ч', { count: stats.totalRewardHours })}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t('social.weeklyChallenges.stats.toClaim', 'К получению')}
          </p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {progress.map((item) => {
          const challenge = item.challenge;
          if (!challenge) return null;

          const progressPercent = Math.min(100, (item.current_count / challenge.target_count) * 100);
          const icon = CHALLENGE_ICONS[challenge.challenge_key] || <Target className="h-5 w-5" />;
          const gradient = CHALLENGE_COLORS[challenge.challenge_key] || 'from-gray-500 to-gray-600';

          return (
            <div
              key={item.challenge_id}
              className={cn(
                "relative overflow-hidden rounded-2xl border border-border/30 p-4",
                item.is_completed && !item.reward_claimed && "ring-2 ring-primary/50"
              )}
            >
              {/* Background gradient for completed */}
              {item.is_completed && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5" />
              )}

              <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0",
                  item.is_completed 
                    ? "bg-gradient-to-br text-white " + gradient
                    : "bg-muted text-muted-foreground"
                )}>
                  {item.is_completed ? <CheckCircle2 className="h-5 w-5" /> : icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{challenge.title}</h4>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {t('social.weeklyChallenges.rewardHoursShort', '+{{count}}ч', { count: challenge.reward_hours })}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {challenge.description}
                  </p>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-xs font-medium min-w-[3rem] text-right">
                      {item.current_count}/{challenge.target_count}
                    </span>
                  </div>
                </div>

                {/* Claim Button */}
                {item.is_completed && !item.reward_claimed && (
                  <Button
                    size="sm"
                    onClick={() => claimChallenge(item.challenge_id)}
                    className="h-9 gap-1 rounded-xl bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                  >
                    <Gift className="h-4 w-4" />
                    {t('social.weeklyChallenges.claim', 'Забрать')}
                  </Button>
                )}

                {item.reward_claimed && (
                  <Badge variant="secondary" className="h-9 px-3 rounded-xl">
                    <Sparkles className="h-4 w-4 mr-1" />
                    {t('social.weeklyChallenges.claimed', 'Получено')}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDaysLeft(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return daysUntilMonday;
}
