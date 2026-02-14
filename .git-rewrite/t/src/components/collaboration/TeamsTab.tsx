import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TeamEditor } from './TeamEditor';
import { TeamMembersList } from './TeamMembersList';
import { getTeamWithMembers, type Team, type TeamMember } from '@/services/collaboration';

interface TeamsTabProps {
  userId: string;
  teams: Team[];
  onCreateTeam: (name: string, slug: string, description?: string) => Promise<{ success: boolean }>;
  onLeaveTeam: (teamId: string) => void;
  onRefresh: () => void;
}

export function TeamsTab({ userId, teams, onCreateTeam, onLeaveTeam, onRefresh }: TeamsTabProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlug, setNewTeamSlug] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Мои команды</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Вы не состоите ни в одной команде
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={team.avatar_url || ''} />
                      <AvatarFallback>{team.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">/{team.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/team/${team.slug}`}>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenTeamSettings(team)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Настройки команды</DialogTitle>
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
                      <Button size="sm" variant="outline" onClick={() => onLeaveTeam(team.id)}>
                        Выйти
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create team */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Создать команду</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Название команды"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <Input
            placeholder="URL команды (slug)"
            value={newTeamSlug}
            onChange={(e) => setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          />
          <Textarea
            placeholder="Описание команды"
            value={newTeamDesc}
            onChange={(e) => setNewTeamDesc(e.target.value)}
          />
          <Button className="w-full" onClick={handleCreateTeam} disabled={!newTeamName || !newTeamSlug}>
            Создать команду
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
