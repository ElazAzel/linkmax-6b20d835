import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Gift, Crown, Sparkles, X } from 'lucide-react';
import { useSocialFeatures } from '@/hooks/useSocialFeatures';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PendingGiftsPanelProps {
  onClose?: () => void;
}

export function PendingGiftsPanel({ onClose }: PendingGiftsPanelProps) {
  const { pendingGifts, loading, claimGift } = useSocialFeatures();

  if (loading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (pendingGifts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-primary/10 border border-primary/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Подарки для вас!</h3>
            <p className="text-xs text-muted-foreground">
              {pendingGifts.length} {pendingGifts.length === 1 ? 'подарок' : 'подарка'}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {pendingGifts.map((gift) => {
          const sender = gift.sender_profile;
          
          return (
            <div 
              key={gift.id}
              className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/30"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 rounded-xl ring-2 ring-pink-500/30">
                  <AvatarImage src={sender?.avatar_url || undefined} />
                  <AvatarFallback className="rounded-xl bg-pink-500/10 text-pink-500">
                    {(sender?.display_name || sender?.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">
                      {sender?.display_name || sender?.username || 'Друг'}
                    </p>
                    <Badge className="h-5 bg-gradient-to-r from-amber-500 to-orange-500 text-[10px]">
                      <Crown className="h-3 w-3 mr-1" />
                      +{gift.days_gifted} дней
                    </Badge>
                  </div>
                  
                  {gift.message && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 italic">
                      "{gift.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(gift.created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </p>
                    
                    <Button
                      size="sm"
                      onClick={() => claimGift(gift.id)}
                      className="h-8 rounded-lg gap-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90"
                    >
                      <Sparkles className="h-3 w-3" />
                      Активировать
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
