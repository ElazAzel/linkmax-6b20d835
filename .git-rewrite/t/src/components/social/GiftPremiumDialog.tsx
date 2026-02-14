import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Gift, Crown, Sparkles, Send, Heart } from 'lucide-react';
import { sendPremiumGift } from '@/services/social';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GiftPremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function GiftPremiumDialog({ open, onOpenChange, recipient }: GiftPremiumDialogProps) {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState(7);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const GIFT_OPTIONS = [
    { days: 3, label: t('gift.days3', '3 дня'), popular: false },
    { days: 7, label: t('gift.week1', '1 неделя'), popular: true },
    { days: 14, label: t('gift.weeks2', '2 недели'), popular: false },
    { days: 30, label: t('gift.month1', '1 месяц'), popular: false },
  ];

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await sendPremiumGift(recipient.id, selectedDays, message);
      if (result.success) {
        toast.success(t('gift.sent', 'Подарок отправлен!'), {
          description: `${recipient.display_name || recipient.username} ${t('gift.sentDesc', 'получит дней Premium')}: +${selectedDays}`
        });
        onOpenChange(false);
        setMessage('');
        setSelectedDays(7);
      } else {
        toast.error(t('gift.sendError', 'Не удалось отправить подарок'));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t('gift.title', 'Подарить Premium')}
          </DialogTitle>
          <DialogDescription>
            {t('gift.description', 'Порадуйте друга подарком Premium-подписки')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <Avatar className="h-12 w-12 rounded-xl">
              <AvatarImage src={recipient.avatar_url || undefined} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                {(recipient.display_name || recipient.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">
                {recipient.display_name || recipient.username || t('friends.user', 'Пользователь')}
              </p>
              {recipient.username && (
                <p className="text-sm text-muted-foreground">@{recipient.username}</p>
              )}
            </div>
            <Heart className="h-5 w-5 text-pink-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('gift.duration', 'Длительность подписки')}</label>
            <div className="grid grid-cols-2 gap-2">
              {GIFT_OPTIONS.map((option) => (
                <button
                  key={option.days}
                  onClick={() => setSelectedDays(option.days)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    selectedDays === option.days
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {option.popular && (
                    <Badge className="absolute -top-2 -right-2 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('gift.popular', 'Популярно')}
                    </Badge>
                  )}
                  <Crown className={cn(
                    "h-5 w-5",
                    selectedDays === option.days ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('gift.message', 'Сообщение (необязательно)')}</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('gift.messagePlaceholder', 'Напишите тёплые слова...')}
              className="min-h-[80px] resize-none rounded-xl"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full h-12 rounded-xl gap-2 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
          >
            {sending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                {t('gift.send', 'Отправить подарок')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
