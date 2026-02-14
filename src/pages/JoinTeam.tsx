import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { getNicheLabel } from '@/lib/niches';
import type { Niche } from '@/lib/niches';
import { useTranslation } from 'react-i18next';

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  slug: string;
  niche: string | null;
  owner_id: string;
  membersCount: number;
}

async function fetchTeamByInviteCode(inviteCode: string): Promise<TeamData | null> {
  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, description, avatar_url, slug, niche, owner_id')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (error || !team) return null;

  // Get members count
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id);

  return { ...team, membersCount: count || 0 };
}

async function joinTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if already a member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'already_member' };
  }

  // Join team
  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: user.id,
      role: 'member',
    });

  if (error) {
    return { success: false, error: error.message };
  }

  // Send notification to team owner
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id, name')
    .eq('id', teamId)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .maybeSingle();

  if (team) {
    await supabase.functions.invoke('send-team-notification', {
      body: {
        targetUserId: team.owner_id,
        teamName: team.name,
        inviterName: profile?.display_name || profile?.username || 'Someone',
        type: 'joined',
      },
    });
  }

  return { success: true };
}

export default function JoinTeam() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team-invite', inviteCode],
    queryFn: () => fetchTeamByInviteCode(inviteCode!),
    enabled: !!inviteCode,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinTeam(team!.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('teams.joined', 'Вы присоединились к команде!'));
        navigate(`/team/${team!.slug}`);
      } else if (result.error === 'already_member') {
        toast.info(t('teams.alreadyMember', 'Вы уже состоите в этой команде'));
        navigate(`/team/${team!.slug}`);
      } else {
        toast.error(result.error || t('common.error', 'Ошибка'));
      }
    },
  });

  useEffect(() => {
    if (team) {
      document.title = `${t('teams.joinTitle', 'Присоединиться к')} ${team.name} | LinkMAX`;
    }
  }, [team, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('teams.invalidInvite', 'Приглашение недействительно')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('teams.invalidInviteDesc', 'Эта ссылка-приглашение недействительна или срок её действия истёк.')}
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.toHome', 'На главную')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md w-full bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl">
        {/* Team avatar */}
        {team.avatar_url ? (
          <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-background shadow-xl">
            <AvatarImage src={team.avatar_url} alt={team.name} />
            <AvatarFallback className="text-2xl bg-primary/20">
              {team.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-background shadow-xl">
            <Users className="h-8 w-8 text-primary" />
          </div>
        )}

        <h1 className="text-2xl font-bold mb-2">{team.name}</h1>
        
        {team.description && (
          <p className="text-muted-foreground mb-4">{team.description}</p>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          {team.niche && team.niche !== 'other' && (
            <Badge variant="secondary" className="rounded-full">
              {getNicheLabel(team.niche as Niche, (key, fallback) => t(key, fallback || key))}
            </Badge>
          )}
          <Badge variant="outline" className="rounded-full">
            <Users className="h-3 w-3 mr-1" />
            {team.membersCount} {t('teams.members', 'участников')}
          </Badge>
        </div>

        {!userId ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('teams.loginToJoin', 'Войдите, чтобы присоединиться к команде')}
            </p>
            <Link to="/auth">
              <Button className="w-full rounded-xl">
                {t('auth.login', 'Войти')}
              </Button>
            </Link>
          </div>
        ) : (
          <Button 
            className="w-full rounded-xl"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t('teams.joinTeam', 'Присоединиться к команде')}
          </Button>
        )}

        <Link to="/" className="block mt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.toHome', 'На главную')}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
