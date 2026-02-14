import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ExternalLink, Crown, ArrowLeft } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { getNicheLabel } from '@/lib/niches';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { Team, TeamMember } from '@/services/collaboration';
import type { Niche } from '@/lib/niches';

interface TeamWithMembers extends Team {
  members: (TeamMember & {
    profile?: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    };
  })[];
}

async function fetchTeamBySlug(slug: string): Promise<TeamWithMembers | null> {
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !team) return null;

  // Fetch team members
  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', team.id);

  if (!members?.length) {
    return { ...team, is_public: team.is_public ?? true, members: [] };
  }

  // Fetch member profiles
  const userIds = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  const membersWithProfiles = members.map(m => ({
    ...m,
    profile: profileMap.get(m.user_id),
  }));

  return { ...team, is_public: team.is_public ?? true, members: membersWithProfiles };
}

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team', slug],
    queryFn: () => fetchTeamBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (team) {
      document.title = `${team.name} | LinkMAX Team`;
    }
  }, [team]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('teams.notFoundTitle', 'Команда не найдена')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('teams.notFoundDesc', 'Эта команда не существует или является приватной.')}
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.backHome', 'На главную')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background pb-8 pt-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {team.avatar_url ? (
            <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-background shadow-xl">
              <AvatarImage src={team.avatar_url} alt={team.name} />
              <AvatarFallback className="text-2xl bg-primary/20">
                {team.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-background shadow-xl">
              <Users className="h-10 w-10 text-primary" />
            </div>
          )}

          <h1 className="text-3xl font-bold mb-2">{team.name}</h1>

          {team.description && (
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {team.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {team.niche && team.niche !== 'other' && (
              <Badge variant="secondary" className="rounded-full">
                {getNicheLabel(team.niche as Niche, (key, fallback) => t(key, fallback || key))}
              </Badge>
            )}
            <Badge variant="outline" className="rounded-full">
              <Users className="h-3 w-3 mr-1" />
              {team.members.length} {t('teams.members', 'участников')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t('teams.membersTitle', 'Участники команды')}
        </h2>

        <div className="space-y-3">
          {team.members.map((member) => (
            <Card
              key={member.id}
              className="p-4 bg-card/60 backdrop-blur-xl border-border/30 rounded-xl hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/20">
                    {(member.profile?.display_name || member.profile?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {member.profile?.display_name || member.profile?.username || t('common.user', 'Пользователь')}
                    </span>
                    {member.role === 'owner' && (
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs shrink-0">Admin</Badge>
                    )}
                  </div>
                  {member.profile?.username && (
                    <p className="text-sm text-muted-foreground">
                      @{member.profile.username}
                    </p>
                  )}
                </div>

                {member.profile?.username && (
                  <Link to={`/${member.profile.username}`}>
                    <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}

          {team.members.length === 0 && (
            <Card className="p-8 text-center bg-card/40 border-border/20 rounded-xl">
              <p className="text-muted-foreground">{t('teams.noMembers', 'В команде пока нет участников')}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Back to home */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <Link to="/">
          <Button variant="outline" className="w-full rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.backHome', 'На главную')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
