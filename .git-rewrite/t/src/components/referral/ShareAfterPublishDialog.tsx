import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Copy, Share2, Users, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReferral } from '@/hooks/useReferral';
import { toast } from 'sonner';

interface ShareAfterPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  publishedUrl: string;
}

export function ShareAfterPublishDialog({
  open,
  onOpenChange,
  userId,
  publishedUrl,
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
          title: t('share.title', 'Check out my LinkMAX page!'),
          url: publishedUrl,
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      handleCopyPageLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            {t('share.published', 'Page Published!')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share page link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('share.yourPageLink', 'Your page link')}
            </label>
            <div className="flex gap-2">
              <Input 
                value={publishedUrl} 
                readOnly 
                className="bg-muted/50 border-border/50"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyPageLink}
                className="flex-shrink-0"
              >
                {copiedPage ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              className="w-full mt-2 rounded-xl" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('share.shareNow', 'Share Now')}
            </Button>
          </div>

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
