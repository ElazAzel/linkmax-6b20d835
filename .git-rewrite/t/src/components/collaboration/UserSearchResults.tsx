import { useTranslation } from 'react-i18next';
import { UserPlus, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { NICHE_ICONS, type Niche } from '@/lib/niches';
import { useState } from 'react';

export interface UserResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  niche?: string | null;
}

interface UserSearchResultsProps {
  users: UserResult[];
  mode: 'collab' | 'shoutout';
  onCollabRequest?: (userId: string) => void;
  onShoutout?: (userId: string, message: string) => void;
}

export function UserSearchResults({ users, mode, onCollabRequest, onShoutout }: UserSearchResultsProps) {
  const { t } = useTranslation();
  const [shoutoutMessage, setShoutoutMessage] = useState('');

  if (users.length === 0) return null;

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {users.map(user => (
        <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">{user.display_name || user.username}</p>
              {user.niche && (
                <Badge variant="secondary" className="text-xs">
                  {NICHE_ICONS[user.niche as Niche]} {t(`niches.${user.niche}`, user.niche)}
                </Badge>
              )}
            </div>
          </div>
          {mode === 'collab' ? (
            <Button size="sm" onClick={() => onCollabRequest?.(user.id)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Megaphone className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Рекомендовать {user.display_name || user.username}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Напишите почему рекомендуете этого человека..."
                    value={shoutoutMessage}
                    onChange={(e) => setShoutoutMessage(e.target.value)}
                  />
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      onShoutout?.(user.id, shoutoutMessage);
                      setShoutoutMessage('');
                    }}
                  >
                    Добавить шаут-аут
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      ))}
    </div>
  );
}
