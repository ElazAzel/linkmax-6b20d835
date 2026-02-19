import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Globe, Blocks, Trophy, Flame, 
  Target, Gift, Rocket, Users, Heart 
} from 'lucide-react';
import { useSocialFeatures } from '@/hooks/social/useSocialFeatures';
import { formatDistanceToNow } from 'date-fns';
import { enUS, kk, ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface FriendActivityFeedProps {
  maxHeight?: string;
}

export function FriendActivityFeed({ maxHeight = '400px' }: FriendActivityFeedProps) {
  const { t, i18n } = useTranslation();
  const { activities, loading } = useSocialFeatures();
  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;
  const activityConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    page_published: { 
      icon: <Globe className="h-4 w-4" />, 
      color: 'bg-green-500', 
      label: t('social.activity.pagePublished', 'опубликовал(а) страницу'),
    },
    new_block: { 
      icon: <Blocks className="h-4 w-4" />, 
      color: 'bg-blue-500', 
      label: t('social.activity.newBlock', 'добавил(а) новый блок'),
    },
    achievement: { 
      icon: <Trophy className="h-4 w-4" />, 
      color: 'bg-amber-500', 
      label: t('social.activity.achievement', 'получил(а) достижение'),
    },
    streak_milestone: { 
      icon: <Flame className="h-4 w-4" />, 
      color: 'bg-orange-500', 
      label: t('social.activity.streakMilestone', 'достиг(ла) milestone стрика'),
    },
    challenge_completed: { 
      icon: <Target className="h-4 w-4" />, 
      color: 'bg-purple-500', 
      label: t('social.activity.challengeCompleted', 'выполнил(а) челлендж'),
    },
    gift_sent: { 
      icon: <Gift className="h-4 w-4" />, 
      color: 'bg-pink-500', 
      label: t('social.activity.giftSent', 'отправил(а) подарок'),
    },
    gift_received: { 
      icon: <Gift className="h-4 w-4" />, 
      color: 'bg-pink-500', 
      label: t('social.activity.giftReceived', 'получил(а) подарок'),
    },
    page_boosted: { 
      icon: <Rocket className="h-4 w-4" />, 
      color: 'bg-indigo-500', 
      label: t('social.activity.pageBoosted', 'продвигает страницу'),
    },
    new_friend: { 
      icon: <Users className="h-4 w-4" />, 
      color: 'bg-cyan-500', 
      label: t('social.activity.newFriend', 'добавил(а) друга'),
    },
    page_liked: { 
      icon: <Heart className="h-4 w-4" />, 
      color: 'bg-red-500', 
      label: t('social.activity.pageLiked', 'понравилась страница'),
    },
  };

  const formatActivityMetadata = (type: string, metadata: Record<string, unknown>): string => {
    switch (type) {
      case 'achievement': {
        const title = typeof metadata.name === 'string' ? metadata.name : t('social.metadata.achievementFallback', 'Новое достижение');
        return t('social.metadata.achievement', '🏆 {{title}}', { title });
      }
      case 'streak_milestone': {
        const count = typeof metadata.days === 'number' ? metadata.days : 0;
        return t('social.metadata.streak', '🔥 {{count}} дней подряд', { count });
      }
      case 'challenge_completed': {
        const title = typeof metadata.title === 'string' ? metadata.title : t('social.metadata.challengeFallback', 'Челлендж выполнен');
        return t('social.metadata.challenge', '✅ {{title}}', { title });
      }
      case 'gift_sent':
      case 'gift_received': {
        const count = typeof metadata.days === 'number' ? metadata.days : 0;
        return t('social.metadata.gift', '💝 +{{count}} дней Premium', { count });
      }
      case 'page_boosted': {
        const typeLabel = typeof metadata.boost_type === 'string' ? metadata.boost_type : t('social.metadata.boostFallback', 'standard');
        return t('social.metadata.boost', '🚀 {{type}} буст', { type: typeLabel });
      }
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{t('social.feed.emptyTitle', 'Пока нет активности')}</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          {t('social.feed.emptyDescription', 'Добавьте друзей, чтобы видеть их активность')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-bold">{t('social.feed.title', 'Лента друзей')}</h3>
        <Badge variant="secondary" className="ml-auto">
          {t('social.feed.events', '{{count}} событий', { count: activities.length })}
        </Badge>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-4">
        <div className="space-y-2">
          {activities.map((activity) => {
            const config = activityConfig[activity.activity_type] || {
              icon: <Activity className="h-4 w-4" />,
              color: 'bg-gray-500',
              label: activity.activity_type
            };
            const profile = activity.user_profile;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors"
              >
                {/* Avatar with activity badge */}
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-xl">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                      {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${config.color} flex items-center justify-center text-white ring-2 ring-background`}>
                    {config.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {profile?.display_name || profile?.username || t('common.user', 'Пользователь')}
                    </span>{' '}
                    <span className="text-muted-foreground">{config.label}</span>
                  </p>
                  
                  {/* Additional metadata */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatActivityMetadata(activity.activity_type, activity.metadata)}
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true, 
                      locale 
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
