import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Medal, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface TopReferrer {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  referrals_count: number;
}

export function TopReferrers() {
  const { t } = useTranslation();
  const [referrers, setReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopReferrers = async () => {
      try {
        const { data, error } = await supabase.rpc('get_top_referrers', { p_limit: 5 });
        
        if (error) {
          console.error('Error fetching top referrers:', error);
          return;
        }

        setReferrers(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopReferrers();
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-28" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (referrers.length === 0) {
    return null;
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getMedalIcon = (index: number) => {
    if (index < 3) {
      return <Medal className={`h-4 w-4 ${getMedalColor(index)}`} />;
    }
    return <span className="text-xs text-muted-foreground font-medium w-4 text-center">{index + 1}</span>;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Trophy className="h-3.5 w-3.5 text-white" />
          </div>
          {t('referral.topReferrers', 'Top Referrers')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {referrers.map((referrer, index) => (
          <div 
            key={referrer.user_id}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
              index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20' : 'hover:bg-muted/50'
            }`}
          >
            <div className="w-5 flex justify-center">
              {getMedalIcon(index)}
            </div>
            
            <Avatar className={`h-8 w-8 ${index === 0 ? 'ring-2 ring-yellow-500/50' : ''}`}>
              <AvatarImage src={referrer.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {(referrer.display_name || referrer.username || '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">
                  {referrer.display_name || referrer.username || 'User'}
                </span>
                {index === 0 && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
              </div>
              {referrer.username && referrer.display_name && (
                <span className="text-xs text-muted-foreground">@{referrer.username}</span>
              )}
            </div>
            
            <Badge 
              variant={index === 0 ? 'default' : 'secondary'} 
              className={`text-xs ${index === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : ''}`}
            >
              <Users className="h-3 w-3 mr-1" />
              {referrer.referrals_count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
