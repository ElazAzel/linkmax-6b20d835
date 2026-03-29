import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Users from 'lucide-react/dist/esm/icons/users';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Download from 'lucide-react/dist/esm/icons/download';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReferral } from '@/hooks/user/useReferral';
import { toast } from 'sonner';

interface ShareAfterPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  publishedUrl: string;
  niche?: string | null;
}

// Niche-specific share messages
function getNicheShareText(niche: string | null | undefined, url: string): string {
  switch (niche) {
    case 'beauty':
      return `Записаться ко мне онлайн: ${url}`;
    case 'fitness':
      return `Запишись на тренировку: ${url}`;
    case 'health':
      return `Записаться на приём: ${url}`;
    case 'education':
      return `Записаться на занятие: ${url}`;
    case 'food':
      return `Забронировать столик / заказать: ${url}`;
    default:
      return `Мои услуги и запись: ${url}`;
  }
}

export function ShareAfterPublishDialog({
  open,
  onOpenChange,
  userId,
  publishedUrl,
  niche,
}: ShareAfterPublishDialogProps) {
  const { t } = useTranslation();
  const { stats, shareLink, copyCode } = useReferral(userId);
  const [copiedPage, setCopiedPage] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const handleCopyPageLink = async () => {
    await navigator.clipboard.writeText(publishedUrl);
    setCopiedPage(true);
    toast.success(t('share.linkCopied', 'Link copied!'));
    setTimeout(() => setCopiedPage(false), 2000);
  };

  const handleCopyReferralLink = () => {
    shareLink();
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('share.title', '🎉 Готово! Твоя ссылка работает'),
          url: publishedUrl,
        });
      } catch (e) {
        // fire-and-forget
      }
    } else {
      handleCopyPageLink();
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(publishedUrl)}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `inkmax-qr-${niche || 'page'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch(e) {
      toast.error(t('share.copyError', 'Error downloading QR'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card/98 backdrop-blur-3xl border-border/40 shadow-2xl rounded-[32px] p-6 sm:p-8">
        <DialogHeader className="pt-4 text-center items-center">
          <div className="mx-auto h-16 w-16 mb-2 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black text-center leading-tight">
            {t('share.title', '🎉 Готово! Твоя ссылка работает')}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {t('share.publishedDesc', 'Добавь её в bio Instagram, Telegram или WhatsApp, чтобы получать клики.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 px-1">
          {/* Main Copy Action */}
          <div className="bg-primary/5 rounded-[24px] p-5 border border-primary/20 hover:border-primary/40 transition-colors shadow-inner">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block ml-1">
              {t('share.yourPageLink', 'Твоя ссылка')}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                value={publishedUrl} 
                readOnly 
                className="bg-background h-14 text-sm md:text-base font-semibold border-border/50 rounded-2xl flex-1 focus-visible:ring-primary/30"
              />
              <Button 
                onClick={handleCopyPageLink}
                className="h-14 px-8 rounded-2xl font-black text-base bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
              >
                {copiedPage ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
                {copiedPage ? t('share.linkCopied', 'Скопировано!') : t('common.copy', 'Копировать')}
              </Button>
            </div>
          </div>

          {/* Socials & QR Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* QR Code */}
             <div className="flex flex-col items-center justify-center gap-3 bg-muted/30 p-5 rounded-[24px] border border-border/40">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publishedUrl)}&format=svg`} 
                    alt="QR Code" 
                    className="w-32 h-32"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={handleDownloadQR} className="w-full text-sm font-semibold h-10 rounded-xl hover:bg-muted/50">
                  <Download className="h-4 w-4 mr-2" />
                  {t('share.downloadQR', 'Скачать QR-код')}
                </Button>
             </div>

             {/* Social Sharing */}
             <div className="flex flex-col gap-3 justify-center">
                <Button
                  className="w-full rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white h-12 font-medium transition-all hover:scale-[1.02] active:scale-98"
                  onClick={() => {
                    const msg = encodeURIComponent(getNicheShareText(niche, publishedUrl));
                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  className="w-full rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white h-12 font-medium transition-all hover:scale-[1.02] active:scale-98"
                  onClick={() => {
                    const shareText = getNicheShareText(niche, '');
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(publishedUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
                  }}
                >
                  Telegram
                </Button>
                <Button 
                  variant="outline"
                  className="w-full rounded-xl h-12 font-medium bg-card" 
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('share.shareNow', 'Поделиться...')}
                </Button>
             </div>
          </div>

          <p className="text-center text-sm font-black text-primary/80 bg-primary/10 py-3 rounded-2xl mx-1 shadow-sm">
            📈 {t('share.returnTomorrow', 'Вернись завтра, чтобы посмотреть статистику!')}
          </p>

          {/* Referral section */}
          {stats?.code && (
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {t('referral.inviteFriend', 'Invite a friend')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('referral.bothGetBonus', 'You both get +3 days Premium!')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={`${window.location.origin}/auth?ref=${stats.code}`}
                    readOnly 
                    className="bg-muted/50 border-border/50 text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyReferralLink}
                    className="flex-shrink-0"
                  >
                    {copiedReferral ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button 
                  variant="secondary"
                  className="w-full rounded-xl"
                  onClick={handleCopyReferralLink}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t('referral.shareReferralLink', 'Share Referral Link')}
                </Button>
              </div>

              {stats.referralsCount > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('referral.friendsInvited', 'Friends invited')}
                    </span>
                    <span className="font-semibold text-primary">{stats.referralsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">
                      {t('referral.bonusEarned', 'Bonus days earned')}
                    </span>
                    <span className="font-semibold text-primary">+{stats.bonusDaysEarned}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          className="absolute top-4 right-4" 
          size="icon"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
