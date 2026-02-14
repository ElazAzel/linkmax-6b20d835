import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserX, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { removeMemberFromTeam, type TeamMember } from '@/services/collaboration';

interface TeamMembersListProps {
  teamId: string;
  members: TeamMember[];
  ownerId: string;
  isOwner: boolean;
  onMemberRemoved: () => void;
}

export function TeamMembersList({ 
  teamId, 
  members, 
  ownerId, 
  isOwner, 
  onMemberRemoved 
}: TeamMembersListProps) {
  const { t } = useTranslation();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(t('toasts.team.confirmRemove', { name: memberName }))) return;

    setRemovingId(memberId);
    try {
      const result = await removeMemberFromTeam(teamId, memberId);
      if (result.success) {
        toast.success(t('toasts.team.memberRemoved'));
        onMemberRemoved();
      } else {
        toast.error(result.error || t('toasts.team.removeError'));
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(t('toasts.team.removeError'));
    } finally {
      setRemovingId(null);
    }
  };

  if (members.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            {t('collaboration.noMembers', 'Нет участников')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('collaboration.members', 'Участники')} ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((member) => {
          const isOwnerMember = member.user_id === ownerId;
          const displayName = member.profile?.display_name || member.profile?.username || t('collaboration.user', 'Пользователь');

          return (
            <div 
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {displayName}
                  </span>
                  {isOwnerMember && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Crown className="h-3 w-3" />
                      {t('collaboration.owner', 'Владелец')}
                    </Badge>
                  )}
                </div>
                {member.profile?.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{member.profile.username}
                  </p>
                )}
              </div>

              {isOwner && !isOwnerMember && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveMember(member.user_id, displayName)}
                  disabled={removingId === member.user_id}
                >
                  {removingId === member.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
