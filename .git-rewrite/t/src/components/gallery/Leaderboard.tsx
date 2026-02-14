import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Heart, Eye, ExternalLink, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import type { LeaderboardPeriod } from '@/services/gallery';

const RANK_STYLES = [
  { bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', icon: '🥇' },
  { bg: 'bg-gradient-to-r from-slate-400/20 to-zinc-400/20', border: 'border-slate-400/30', icon: '🥈' },
  { bg: 'bg-gradient-to-r from-amber-700/20 to-orange-700/20', border: 'border-amber-700/30', icon: '🥉' },
];

export function Leaderboard() {
  const { t } = useTranslation();
  const { pages, loading, period, setPeriod } = useLeaderboard();

  const periodLabels: Record<LeaderboardPeriod, string> = {
    week: t('leaderboard.week', 'This Week'),
    month: t('leaderboard.month', 'This Month'),
    all: t('leaderboard.allTime', 'All Time'),
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            {t('leaderboard.title', 'Top Pages')}
          </CardTitle>
          
          <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
            <TabsList className="bg-background/50 h-8">
              <TabsTrigger value="week" className="text-xs px-2 h-6">
                <Calendar className="h-3 w-3 mr-1" />
                {t('leaderboard.week', 'Week')}
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2 h-6">
                {t('leaderboard.month', 'Month')}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2 h-6">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('leaderboard.all', 'All')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('leaderboard.empty', 'No pages yet for this period')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page, index) => {
              const rankStyle = RANK_STYLES[index] || null;
              const isTopThree = index < 3;
              
              return (
                <div
                  key={page.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                    ${rankStyle ? `${rankStyle.bg} border ${rankStyle.border}` : 'bg-background/30 hover:bg-background/50'}
                  `}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {isTopThree ? (
                      <span className="text-xl">{rankStyle?.icon}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className={isTopThree ? 'h-10 w-10 ring-2 ring-primary/20' : 'h-9 w-9'}>
                    <AvatarImage src={page.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(page.title || page.slug)?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${isTopThree ? 'text-sm' : 'text-sm'}`}>
                      {page.title || page.slug}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {page.gallery_likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {page.view_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    asChild
                  >
                    <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
