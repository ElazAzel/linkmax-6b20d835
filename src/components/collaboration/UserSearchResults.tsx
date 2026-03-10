import { useTranslation } from 'react-i18next';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { NICHE_ICONS, type Niche } from '@/lib/niches';
import { useState } from 'react';
import { getUserPageSlug } from '@/services/friends';
import { toast } from 'sonner';

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

  const handleViewPage = async (userId: string) => {
    const slug = await getUserPageSlug(userId);
    if (slug) {
      window.open(`/${slug}`, '_blank');
    } else {
      toast.error(t('friends.pageNotPublished', 'Страница не опубликована'));
    }
  };

  if (users.length === 0) return null;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {users.map(user => (
        <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                {(user.display_name || user.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.display_name || user.username}</p>
              {user.niche && (
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {NICHE_ICONS[user.niche as Niche]} {t(`niches.${user.niche}`, user.niche)}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewPage(user.id)}
              className="h-8 w-8 p-0"
              title={t('friends.viewPage', 'Посмотреть страницу')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            {mode === 'collab' ? (
              <Button size="sm" onClick={() => onCollabRequest?.(user.id)} className="h-8 gap-1">
                <UserPlus className="h-3 w-3" />
                {t('collaboration.offer', 'Предложить')}
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Megaphone className="h-3 w-3" />
                    {t('collab.recommend', 'Рекомендовать')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t('collab.shoutoutRecommendTitle', 'Рекомендовать {{name}}', { name: user.display_name || user.username })}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      {t('collab.shoutoutRecommendDesc', 'Send a shoutout recommendation for this user')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder={t('collab.shoutoutReasonPlaceholder', 'Напишите почему рекомендуете этого человека...')}
                      value={shoutoutMessage}
                      onChange={(e) => setShoutoutMessage(e.target.value)}
                      className="min-h-[80px] rounded-xl"
                      maxLength={200}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{shoutoutMessage.length}/200</span>
                      <Button
                        onClick={() => {
                          onShoutout?.(user.id, shoutoutMessage);
                          setShoutoutMessage('');
                        }}
                        className="gap-1"
                      >
                        <Megaphone className="h-4 w-4" />
                        {t('collab.addShoutout', 'Добавить')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
