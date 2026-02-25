import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { useAdminEvents } from '@/hooks/admin/useAdminEvents';
import { bumpCacheVersion } from '@/lib/utils/cache-utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import Users from 'lucide-react/dist/esm/icons/users';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MousePointer from 'lucide-react/dist/esm/icons/mouse-pointer';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Star from 'lucide-react/dist/esm/icons/star';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import Flame from 'lucide-react/dist/esm/icons/flame';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import Users2 from 'lucide-react/dist/esm/icons/users-2';
import Target from 'lucide-react/dist/esm/icons/target';
import Blocks from 'lucide-react/dist/esm/icons/blocks';
import Globe from 'lucide-react/dist/esm/icons/globe';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function StatsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map(section => (
        <div key={section}>
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(card => (
              <Skeleton key={card} className="h-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminOverviewTab() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentEvents, isLoading: eventsLoading } = useAdminEvents();
  const [isBumpingCache, setIsBumpingCache] = useState(false);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'kk': return kk;
      default: return enUS;
    }
  };

  const handleBumpCache = async () => {
    setIsBumpingCache(true);
    try {
      const result = await bumpCacheVersion();
      if (result.success) {
        toast.success(t('admin.cacheBumped', 'Кэш сброшен! Новая версия: {{version}}', { version: result.newVersion }));
      } else {
        toast.error(t('admin.cacheBumpFailed', 'Не удалось сбросить кэш'));
      }
    } catch {
      toast.error(t('admin.cacheBumpFailed', 'Не удалось сбросить кэш'));
    } finally {
      setIsBumpingCache(false);
    }
  };

  if (statsLoading) {
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">{t('admin.noData')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* System Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            {t('admin.systemActions', 'Системные действия')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">{t('admin.clearUserCache', 'Сбросить кэш у всех пользователей')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.clearUserCacheDesc', 'При следующей загрузке приложения кэш каждого пользователя будет очищен')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBumpCache}
              disabled={isBumpingCache}
              className="shrink-0"
            >
              {isBumpingCache ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('admin.bumpCache', 'Сбросить кэш')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <StatsSection title={t('admin.users')} icon={<Users className="h-5 w-5" />}>
        <StatCard
          title={t('admin.totalUsers')}
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title={t('admin.premium')}
          value={stats.premiumUsers}
          icon={<Star className="h-5 w-5 text-yellow-500" />}
        />
        <StatCard
          title={t('admin.activeTrials')}
          value={stats.activeTrials}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title={t('admin.withStreak')}
          value={stats.usersWithStreak}
          icon={<Flame className="h-5 w-5 text-orange-500" />}
        />
      </StatsSection>

      {/* Pages & Content Stats */}
      <StatsSection title={t('admin.pagesSection')} icon={<FileText className="h-5 w-5" />}>
        <StatCard
          title={t('admin.total')}
          value={stats.totalPages}
          icon={<FileText className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          title={t('admin.published')}
          value={stats.publishedPages}
          icon={<Globe className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title={t('admin.inGallery')}
          value={stats.galleryPages}
          icon={<Star className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title={t('admin.totalBlocks')}
          value={stats.totalBlocks}
          icon={<Blocks className="h-5 w-5 text-indigo-500" />}
        />
      </StatsSection>

      {/* Engagement Stats */}
      <StatsSection title={t('admin.engagementSection')} icon={<Eye className="h-5 w-5" />}>
        <StatCard
          title={t('admin.views')}
          value={stats.totalViews}
          icon={<Eye className="h-5 w-5 text-cyan-500" />}
        />
        <StatCard
          title={t('admin.clicks')}
          value={stats.totalClicks}
          icon={<MousePointer className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title={t('admin.shares')}
          value={stats.totalShares}
          icon={<Share2 className="h-5 w-5 text-pink-500" />}
        />
        <StatCard
          title={t('admin.achievements')}
          value={stats.totalAchievements}
          icon={<Trophy className="h-5 w-5 text-yellow-500" />}
        />
      </StatsSection>

      {/* Social & Community Stats */}
      <StatsSection title={t('admin.socialSection')} icon={<UserPlus className="h-5 w-5" />}>
        <StatCard
          title={t('admin.friendships')}
          value={stats.totalFriendships}
          icon={<UserPlus className="h-5 w-5 text-green-500" />}
          subtitle={`${t('admin.accepted')}: ${stats.acceptedFriendships} / ${t('admin.pending')}: ${stats.pendingFriendships}`}
        />
        <StatCard
          title={t('admin.collaborations')}
          value={stats.totalCollaborations}
          icon={<Handshake className="h-5 w-5 text-blue-500" />}
          subtitle={`${t('admin.accepted')}: ${stats.acceptedCollaborations}`}
        />
        <StatCard
          title={t('admin.teams')}
          value={stats.totalTeams}
          icon={<Users2 className="h-5 w-5 text-violet-500" />}
          subtitle={`${t('admin.members')}: ${stats.totalTeamMembers}`}
        />
        <StatCard
          title={t('admin.shoutouts')}
          value={stats.totalShoutouts}
          icon={<MessageSquare className="h-5 w-5 text-rose-500" />}
        />
      </StatsSection>

      {/* Growth & Marketing Stats */}
      <StatsSection title={t('admin.gamificationSection')} icon={<TrendingUp className="h-5 w-5" />}>
        <StatCard
          title={t('admin.referrals')}
          value={stats.totalReferrals}
          icon={<Link2 className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title={t('admin.leads')}
          value={stats.totalLeads}
          icon={<Target className="h-5 w-5 text-red-500" />}
        />
        <StatCard
          title="CTR"
          value={stats.totalPages ? `${((stats.publishedPages / stats.totalPages) * 100).toFixed(1)}%` : '0%'}
          icon={<TrendingUp className="h-5 w-5 text-teal-500" />}
        />
        <StatCard
          title={`${t('admin.totalBlocks')}/${t('admin.page')}`}
          value={stats.totalPages ? (stats.totalBlocks / stats.totalPages).toFixed(1) : '0'}
          icon={<Blocks className="h-5 w-5 text-slate-500" />}
        />
      </StatsSection>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.recentEvents')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {eventsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : (
              recentEvents?.slice(0, 20).map(event => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    {event.event_type === 'view' && <Eye className="h-4 w-4 text-cyan-500" />}
                    {event.event_type === 'click' && <MousePointer className="h-4 w-4 text-orange-500" />}
                    {event.event_type === 'share' && <Share2 className="h-4 w-4 text-pink-500" />}
                    <span className="text-sm capitalize">{event.event_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.created_at), 'dd MMM HH:mm', { locale: getDateLocale() })}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
