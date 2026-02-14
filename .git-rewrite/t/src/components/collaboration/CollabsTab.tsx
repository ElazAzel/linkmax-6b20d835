import { Link } from 'react-router-dom';
import { Check, X, Settings, ExternalLink, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CollabBlockManager } from './CollabBlockManager';
import { UserSearch } from './UserSearch';
import type { Collaboration } from '@/services/collaboration';

interface CollabsTabProps {
  userId: string;
  pageId: string;
  pendingRequests: Collaboration[];
  activeCollabs: Collaboration[];
  onRespond: (collabId: string, accept: boolean, pageId?: string) => void;
  onRemove: (collabId: string) => void;
  onSendRequest: (targetId: string) => void;
  onRefresh: () => void;
}

export function CollabsTab({
  userId,
  pageId,
  pendingRequests,
  activeCollabs,
  onRespond,
  onRemove,
  onSendRequest,
  onRefresh,
}: CollabsTabProps) {
  return (
    <div className="space-y-4">
      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="destructive">{pendingRequests.length}</Badge>
              Входящие запросы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={req.requester?.avatar_url || ''} />
                    <AvatarFallback>{req.requester?.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{req.requester?.display_name || req.requester?.username}</p>
                    {req.message && <p className="text-xs text-muted-foreground">{req.message}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onRespond(req.id, true, pageId)}>
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onRespond(req.id, false)}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active collabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Активные коллаборации</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCollabs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет активных коллабораций
            </p>
          ) : (
            <div className="space-y-2">
              {activeCollabs.map(collab => {
                const partner = collab.requester_id === userId ? collab.target : collab.requester;
                const collabUrl = collab.collab_slug ? `${window.location.origin}/collab/${collab.collab_slug}` : null;
                const blockSettings = (collab as { block_settings?: { requester_blocks: string[]; target_blocks: string[]; show_all: boolean } }).block_settings || {
                  requester_blocks: [],
                  target_blocks: [],
                  show_all: true,
                };
                
                return (
                  <div key={collab.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={partner?.avatar_url || ''} />
                          <AvatarFallback>{partner?.display_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{partner?.display_name || partner?.username}</span>
                      </div>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Управление блоками</DialogTitle>
                            </DialogHeader>
                            <CollabBlockManager
                              collabId={collab.id}
                              requesterId={collab.requester_id}
                              targetId={collab.target_id}
                              requesterPageId={collab.requester_page_id}
                              targetPageId={collab.target_page_id}
                              currentSettings={blockSettings}
                              requesterProfile={collab.requester || null}
                              targetProfile={collab.target || null}
                              onSettingsChange={onRefresh}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="ghost" onClick={() => onRemove(collab.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {collabUrl && (
                      <div className="flex items-center gap-2 text-xs">
                        <Link to={`/collab/${collab.collab_slug}`} className="text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Совместная страница
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                          onClick={() => navigator.clipboard.writeText(collabUrl)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search for new collab */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Найти партнёра</CardTitle>
        </CardHeader>
        <CardContent>
          <UserSearch 
            mode="collab"
            onCollabRequest={onSendRequest}
          />
        </CardContent>
      </Card>
    </div>
  );
}
