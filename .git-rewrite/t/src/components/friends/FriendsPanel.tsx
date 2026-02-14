import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Users, UserPlus, Search, Check, 
  X as XIcon, UserMinus, Trophy, 
  Sparkles, Clock, ExternalLink, Heart, Gift, Activity
} from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { getUserPageSlug } from '@/services/friends';
import { getPageByUserId, likeGalleryPage, unlikeGalleryPage } from '@/services/gallery';
import { toast } from 'sonner';
import { GiftPremiumDialog } from '@/components/social/GiftPremiumDialog';
import { FriendActivityFeed } from '@/components/social/FriendActivityFeed';

interface FriendsPanelProps {
  onClose: () => void;
}

export function FriendsPanel({ onClose }: FriendsPanelProps) {
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    searchUsers,
    pendingCount
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [likedPages, setLikedPages] = useState<Set<string>>(() => {
    const storedLikes = localStorage.getItem('linkmax_liked_pages');
    if (storedLikes) {
      try {
        return new Set(JSON.parse(storedLikes));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const [giftRecipient, setGiftRecipient] = useState<{
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const handleToggleLike = async (pageId: string) => {
    const isCurrentlyLiked = likedPages.has(pageId);
    
    if (isCurrentlyLiked) {
      const newLikedPages = new Set(likedPages);
      newLikedPages.delete(pageId);
      setLikedPages(newLikedPages);
      localStorage.setItem('linkmax_liked_pages', JSON.stringify([...newLikedPages]));
      await unlikeGalleryPage(pageId);
      toast.success('Лайк убран');
    } else {
      const newLikedPages = new Set(likedPages).add(pageId);
      setLikedPages(newLikedPages);
      localStorage.setItem('linkmax_liked_pages', JSON.stringify([...newLikedPages]));
      await likeGalleryPage(pageId);
      toast.success('Страница понравилась!');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await searchUsers(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSendRequest = async (userId: string) => {
    await sendRequest(userId);
    setSearchResults(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Друзья</h2>
              <p className="text-xs text-muted-foreground">
                {friends.length} друзей
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-10 w-10 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск пользователей..."
              className="pl-10 h-11 rounded-xl bg-card/40 backdrop-blur-xl border-border/30"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-3">
          <TabsList className="grid w-full grid-cols-4 h-10 rounded-xl bg-muted/50">
            <TabsTrigger value="friends" className="rounded-lg text-xs px-2">
              Друзья
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg text-xs px-2">
              <Activity className="h-3 w-3 mr-1" />
              Лента
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg text-xs px-2 relative">
              Запросы
              {pendingCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg text-xs px-2">
              Отправ.
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Результаты поиска
            </h3>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    action={
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.id)}
                        className="h-8 rounded-lg gap-1"
                      >
                        <UserPlus className="h-4 w-4" />
                        Добавить
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                Пользователи не найдены
              </p>
            )}
          </div>
        )}

        {/* Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {loading ? (
              <LoadingSkeleton />
            ) : friends.length > 0 ? (
              <>
                {/* Friends Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">{friends.length}</p>
                    <p className="text-[10px] text-muted-foreground">Друзей</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-3 text-center">
                    <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold">{Math.floor(friends.length / 5)}</p>
                    <p className="text-[10px] text-muted-foreground">Награды</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-3 text-center">
                    <Sparkles className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">+{friends.length * 2}ч</p>
                    <p className="text-[10px] text-muted-foreground">Бонусы</p>
                  </div>
                </div>

                {friends.map(friendship => (
                  <UserCard
                    key={friendship.id}
                    user={friendship.friend_profile}
                    showViewPage
                    onToggleLike={handleToggleLike}
                    likedPages={likedPages}
                    onGift={setGiftRecipient}
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFriend(friendship.id)}
                        className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    }
                  />
                ))}
              </>
            ) : (
              <EmptyState 
                icon={<Users className="h-8 w-8" />}
                title="Пока нет друзей"
                description="Найдите друзей через поиск выше"
              />
            )}
          </div>
        )}

        {/* Activity Feed */}
        {activeTab === 'activity' && (
          <FriendActivityFeed maxHeight="calc(100vh - 280px)" />
        )}

        {/* Pending Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <UserCard
                  key={request.id}
                  user={request.user_profile}
                  action={
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptRequest(request.id)}
                        className="h-8 rounded-lg gap-1"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectRequest(request.id)}
                        className="h-8 rounded-lg"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                />
              ))
            ) : (
              <EmptyState 
                icon={<Clock className="h-8 w-8" />}
                title="Нет входящих запросов"
                description="Когда кто-то захочет добавить вас в друзья, запрос появится здесь"
              />
            )}
          </div>
        )}

        {/* Sent Requests */}
        {activeTab === 'sent' && (
          <div className="space-y-3">
            {sentRequests.length > 0 ? (
              sentRequests.map(request => (
                <UserCard
                  key={request.id}
                  user={request.friend_profile}
                  badge={<Badge variant="secondary" className="text-[10px]">Ожидание</Badge>}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rejectRequest(request.id)}
                      className="h-8 rounded-lg"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  }
                />
              ))
            ) : (
              <EmptyState 
                icon={<UserPlus className="h-8 w-8" />}
                title="Нет отправленных запросов"
                description="Найдите друзей через поиск"
              />
            )}
          </div>
        )}
      </div>

      {/* Gamification Banner */}
      <div className="flex-shrink-0 p-4 border-t border-border/50">
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Приглашайте друзей!</p>
              <p className="text-xs text-muted-foreground">
                +2 часа Premium за каждого друга
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              +{friends.length * 2}ч
            </Badge>
          </div>
        </div>
      </div>

      {/* Gift Premium Dialog */}
      {giftRecipient && (
        <GiftPremiumDialog
          open={!!giftRecipient}
          onOpenChange={(open) => !open && setGiftRecipient(null)}
          recipient={giftRecipient}
        />
      )}
    </div>
  );
}

interface UserCardProps {
  user?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  badge?: React.ReactNode;
  action: React.ReactNode;
  showViewPage?: boolean;
  onGift?: (user: { id: string; username: string | null; display_name: string | null; avatar_url: string | null }) => void;
  onToggleLike?: (pageId: string) => Promise<void>;
  likedPages?: Set<string>;
}

function UserCard({ user, badge, action, showViewPage, onToggleLike, likedPages, onGift }: UserCardProps) {
  const [pageId, setPageId] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (user && showViewPage) {
      getPageByUserId(user.id).then(page => {
        if (page) setPageId(page.id);
      });
    }
  }, [user, showViewPage]);

  if (!user) return null;

  const handleViewPage = async () => {
    const slug = await getUserPageSlug(user.id);
    if (slug) {
      window.open(`/${slug}`, '_blank');
    } else {
      toast.error('Страница не опубликована');
    }
  };

  const handleLike = async () => {
    if (!pageId || !onToggleLike || isLiking) return;
    setIsLiking(true);
    try {
      await onToggleLike(pageId);
    } finally {
      setIsLiking(false);
    }
  };

  const isLiked = pageId ? likedPages?.has(pageId) : false;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 border border-border/30">
      <Avatar className="h-11 w-11 rounded-xl">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
          {(user.display_name || user.username || 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {user.display_name || user.username || 'Пользователь'}
          </p>
          {badge}
        </div>
        {user.username && (
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {showViewPage && onGift && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGift(user)}
            className="h-8 w-8 p-0 rounded-lg text-pink-500 hover:text-pink-600 hover:bg-pink-500/10"
            title="Подарить Premium"
          >
            <Gift className="h-4 w-4" />
          </Button>
        )}
        {showViewPage && pageId && onToggleLike && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className="h-8 w-8 p-0 rounded-lg"
            title={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
          >
            <Heart className={`h-4 w-4 transition-all ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        )}
        {showViewPage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewPage}
            className="h-8 w-8 p-0 rounded-lg"
            title="Открыть страницу"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">{description}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 animate-pulse">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
