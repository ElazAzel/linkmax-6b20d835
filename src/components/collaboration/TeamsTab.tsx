'use client';

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Users from 'lucide-react/dist/esm/icons/users';
import Copy from 'lucide-react/dist/esm/icons/copy';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Check from 'lucide-react/dist/esm/icons/check';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamEditor } from './TeamEditor';
import { TeamMembersList } from './TeamMembersList';
import { getTeamWithMembers, type Team, type TeamMember } from '@/services/collaboration';
import { toast } from 'sonner';

interface TeamsTabProps {
  userId: string;
  teams: Team[];
  onCreateTeam: (name: string, slug: string, description?: string) => Promise<{ success: boolean }>;
  onLeaveTeam: (teamId: string) => void;
  onJoinByCode?: (inviteCode: string) => Promise<{ success: boolean; team?: Team }>;
  onGetInviteCode?: (teamId: string) => Promise<string | null>;
  onRefresh: () => void;
}

export function TeamsTab({
  userId,
  teams,
  onCreateTeam,
  onLeaveTeam,
  onJoinByCode,
  onGetInviteCode,
  onRefresh
}: TeamsTabProps) {
  const { t } = useTranslation();
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlug, setNewTeamSlug] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);

  const loadTeamMembers = useCallback(async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const teamWithMembers = await getTeamWithMembers(teamId);
      if (teamWithMembers?.members) {
        setTeamMembers(teamWithMembers.members);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const handleOpenTeamSettings = useCallback(async (team: Team) => {
    setSelectedTeam(team);
    await loadTeamMembers(team.id);
  }, [loadTeamMembers]);

  const handleTeamUpdate = useCallback((updatedTeam: Team) => {
    setSelectedTeam(updatedTeam);
  }, []);

  const handleTeamDelete = useCallback(() => {
    setSelectedTeam(null);
    setTeamMembers([]);
    onRefresh();
  }, [onRefresh]);

  const handleMemberRemoved = useCallback(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam, loadTeamMembers]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamSlug.trim()) return;
    const result = await onCreateTeam(newTeamName, newTeamSlug, newTeamDesc);
    if (result.success) {
      setNewTeamName('');
      setNewTeamSlug('');
      setNewTeamDesc('');
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim() || !onJoinByCode) return;
    setIsJoining(true);
    const result = await onJoinByCode(inviteCode.trim());
    if (result.success) {
      setInviteCode('');
    }
    setIsJoining(false);
  };

  const handleCopyInviteLink = async (team: Team) => {
    if (!onGetInviteCode) return;

    // invite_code is sensitive — always fetch via secure RPC,
    // do not rely on team.invite_code from public list query.
    const code = await onGetInviteCode(team.id);

    if (code) {
      const inviteUrl = `${window.location.origin}/join-team/${code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedTeamId(team.id);
      toast.success(t('teams.linkCopied', 'Ссылка скопирована!'));
      setTimeout(() => setCopiedTeamId(null), 2000);
    }
  };

  const ownedTeams = teams.filter(t => t.owner_id === userId);
  const memberTeams = teams.filter(t => t.owner_id !== userId);

  return (
    <div className="space-y-4">
      {/* Teams stats */}
      {teams.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{teams.length}</p>
            <p className="text-xs text-muted-foreground">{t('teams.total', 'Команд')}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-3 text-center">
            <Crown className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold">{ownedTeams.length}</p>
            <p className="text-xs text-muted-foreground">{t('teams.owned', 'Владею')}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-3 text-center">
            <UserPlus className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{memberTeams.length}</p>
            <p className="text-xs text-muted-foreground">{t('teams.member', 'Участник')}</p>
          </div>
        </div>
      )}

      {/* My teams */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('teams.myTeams', 'Мои команды')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t('teams.noTeams', 'Вы не состоите ни в одной команде')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('teams.noTeamsHint', 'Создайте команду или присоединитесь по коду приглашения')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="p-3 bg-muted/50 rounded-xl border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarImage src={team.avatar_url || ''} />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                          {team.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{team.name}</p>
                          {team.owner_id === userId && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              <Crown className="h-3 w-3 mr-0.5" />
                              {t('teams.owner', 'Владелец')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">/{team.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link to={`/team/${team.slug}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      {team.owner_id === userId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopyInviteLink(team)}
                        >
                          {copiedTeamId === team.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenTeamSettings(team)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{t('teams.settings', 'Настройки команды')}</DialogTitle>
                            <DialogDescription className="sr-only">
                              {t('teams.settingsDesc', 'Manage team settings and members')}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTeam && selectedTeam.id === team.id && (
                            <div className="space-y-4">
                              <TeamEditor
                                team={selectedTeam}
                                isOwner={team.owner_id === userId}
                                onTeamUpdate={handleTeamUpdate}
                                onTeamDelete={handleTeamDelete}
                              />
                              {loadingMembers ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <TeamMembersList
                                  teamId={team.id}
                                  members={teamMembers}
                                  ownerId={team.owner_id}
                                  isOwner={team.owner_id === userId}
                                  onMemberRemoved={handleMemberRemoved}
                                />
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {team.owner_id !== userId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => onLeaveTeam(team.id)}
                        >
                          {t('teams.leave', 'Выйти')}
                        </Button>
                      )}
                    </div>
                  </div>
                  {team.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{team.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create or Join */}
      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="join" className="text-xs">
            <Link2 className="h-3 w-3 mr-1" />
            {t('teams.joinByCode', 'По коду')}
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs">
            <UserPlus className="h-3 w-3 mr-1" />
            {t('teams.createNew', 'Создать')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="join">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('teams.joinTeam', 'Присоединиться к команде')}</CardTitle>
              <CardDescription className="text-xs">
                {t('teams.joinTeamDesc', 'Введите код приглашения от владельца команды')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder={t('teams.inviteCodePlaceholder', 'Код приглашения (team-xxxxx)')}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
              <Button
                className="w-full"
                onClick={handleJoinByCode}
                disabled={!inviteCode.trim() || isJoining || !onJoinByCode}
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {t('teams.joinButton', 'Присоединиться')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('teams.createTeam', 'Создать команду')}</CardTitle>
              <CardDescription className="text-xs">
                {t('teams.createTeamDesc', 'Соберите единомышленников для совместной работы')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder={t('teams.teamNamePlaceholder', 'Название команды')}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <Input
                placeholder={t('teams.teamSlugPlaceholder', 'URL команды (slug)')}
                value={newTeamSlug}
                onChange={(e) => setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <Textarea
                placeholder={t('teams.teamDescriptionPlaceholder', 'Описание команды (необязательно)')}
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                className="min-h-[60px]"
              />
              <Button
                className="w-full"
                onClick={handleCreateTeam}
                disabled={!newTeamName || !newTeamSlug}
              >
                <Crown className="h-4 w-4 mr-2" />
                {t('teams.createTeamButton', 'Создать команду')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
