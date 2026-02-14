import { useCallback } from 'react';
import { Users, Heart, Megaphone, UserPlus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollabsTab } from './CollabsTab';
import { PromoTab } from './PromoTab';
import { ShoutoutsTab } from './ShoutoutsTab';
import { TeamsTab } from './TeamsTab';
import { useTranslation } from 'react-i18next';

interface CollaborationPanelProps {
  userId: string;
  pageId: string;
}

export function CollaborationPanel({ userId, pageId }: CollaborationPanelProps) {
  const { t } = useTranslation();
  const {
    teams,
    shoutouts,
    loading,
    pendingRequests,
    activeCollabs,
    sendRequest,
    respondRequest,
    removeCollab,
    createNewTeam,
    leaveTeam,
    addShoutout,
    removeShoutout,
    refresh,
  } = useCollaboration(userId);

  const handleSendRequest = useCallback((targetId: string) => {
    sendRequest(targetId, pageId);
  }, [sendRequest, pageId]);

  const handleAddShoutout = useCallback((toUserId: string, message: string) => {
    addShoutout(toUserId, message);
  }, [addShoutout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="collabs" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="collabs" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            {t('collaboration.tabs.collabs', 'Коллабы')}
          </TabsTrigger>
          <TabsTrigger value="promo" className="text-xs">
            <Heart className="h-4 w-4 mr-1" />
            {t('collaboration.tabs.promo', 'Взаимный пиар')}
          </TabsTrigger>
          <TabsTrigger value="shoutouts" className="text-xs">
            <Megaphone className="h-4 w-4 mr-1" />
            {t('collaboration.tabs.shoutouts', 'Шаут-ауты')}
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-xs">
            <UserPlus className="h-4 w-4 mr-1" />
            {t('collaboration.tabs.teams', 'Команды')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collabs">
          <CollabsTab
            userId={userId}
            pageId={pageId}
            pendingRequests={pendingRequests}
            activeCollabs={activeCollabs}
            onRespond={respondRequest}
            onRemove={removeCollab}
            onSendRequest={handleSendRequest}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="promo">
          <PromoTab onSendRequest={handleSendRequest} />
        </TabsContent>

        <TabsContent value="shoutouts">
          <ShoutoutsTab
            shoutouts={shoutouts}
            onAddShoutout={handleAddShoutout}
            onRemoveShoutout={removeShoutout}
          />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab
            userId={userId}
            teams={teams}
            onCreateTeam={createNewTeam}
            onLeaveTeam={leaveTeam}
            onRefresh={refresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
