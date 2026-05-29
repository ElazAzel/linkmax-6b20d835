import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Search from 'lucide-react/dist/esm/icons/search';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Heart from 'lucide-react/dist/esm/icons/heart';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { searchUsers } from '@/services/collaboration';
import { getUserPageSlug } from '@/services/friends';
import { toast } from 'sonner';

export interface UserResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  niche?: string | null;
}

interface UserSearchProps {
  mode: 'collab' | 'shoutout' | 'team';
  placeholder?: string;
  onCollabRequest?: (userId: string) => void;
  onShoutout?: (userId: string, message: string) => void;
  onTeamInvite?: (userId: string) => void;
}

export function UserSearch({ mode, placeholder, onCollabRequest, onShoutout, onTeamInvite }: UserSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [shoutoutUserId, setShoutoutUserId] = useState<string | null>(null);
  const [shoutoutMessage, setShoutoutMessage] = useState('');
  
  const resolvedPlaceholder = placeholder ?? t('collab.userSearchPlaceholder', 'Поиск по имени...');

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 2) return;
    setSearching(true);
    const users = await searchUsers(query);
    setResults(users);
    setSearching(false);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleViewPage = async (userId: string) => {
    const slug = await getUserPageSlug(userId);
    if (slug) {
      window.open(`/${slug}`, '_blank');
    } else {
      toast.error(t('friends.pageNotPublished', 'Страница не опубликована'));
    }
  };

  const handleShoutoutSubmit = () => {
    if (shoutoutUserId && onShoutout) {
      onShoutout(shoutoutUserId, shoutoutMessage);
      setShoutoutUserId(null);
      setShoutoutMessage('');
      setResults(prev => prev.filter(u => u.id !== shoutoutUserId));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={resolvedPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-xl"
        />
        <Button onClick={handleSearch} disabled={searching} size="icon" className="rounded-xl">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map(user => (
            <div key={user.id} className="p-3 rounded-xl bg-muted/50 border border-border/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-xl">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                      {(user.display_name || user.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.display_name || user.username}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                    {user.niche && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {t(`niches.${user.niche}`, user.niche)}
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
                  
                  {mode === 'collab' && onCollabRequest && (
                    <Button 
                      size="sm" 
                      onClick={() => onCollabRequest(user.id)}
                      className="h-8 gap-1"
                    >
                      <UserPlus className="h-3 w-3" />
                      {t('collaboration.offer', 'Предложить')}
                    </Button>
                  )}
                  
                  {mode === 'shoutout' && onShoutout && (
                    <Button 
                      size="sm" 
                      variant={shoutoutUserId === user.id ? 'default' : 'outline'}
                      onClick={() => setShoutoutUserId(shoutoutUserId === user.id ? null : user.id)}
                      className="h-8 gap-1"
                    >
                      <Heart className="h-3 w-3" />
                      {t('collab.recommend', 'Рекомендовать')}
                    </Button>
                  )}
                  
                  {mode === 'team' && onTeamInvite && (
                    <Button 
                      size="sm" 
                      onClick={() => onTeamInvite(user.id)}
                      className="h-8 gap-1"
                    >
                      <UserPlus className="h-3 w-3" />
                      {t('teams.invite', 'Пригласить')}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Shoutout message input */}
              {mode === 'shoutout' && shoutoutUserId === user.id && (
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <Textarea
                    value={shoutoutMessage}
                    onChange={(e) => setShoutoutMessage(e.target.value)}
                    placeholder={t('collab.shoutoutPlaceholder', 'Напишите рекомендацию...')}
                    className="min-h-[60px] rounded-lg text-sm"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{shoutoutMessage.length}/200</span>
                    <Button size="sm" onClick={handleShoutoutSubmit} className="gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {t('collab.sendShoutout', 'Отправить')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !searching && (
        <p className="text-center text-sm text-muted-foreground py-4">
          {t('collab.noUsersFound', 'Пользователи не найдены')}
        </p>
      )}
    </div>
  );
}
