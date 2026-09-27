'use client';

/**
 * StaffCheckinLinkDialog - lets the organizer share a door-scanner link.
 * Helpers open the link on their own phone and check tickets in without
 * signing into the organizer's account.
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { toast } from 'sonner';
import {
  buildCheckinUrl,
  fetchEventCheckinToken,
  rotateEventCheckinToken,
} from '@/services/event-checkin';

interface StaffCheckinLinkDialogProps {
  eventId: string;
  eventTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StaffCheckinLinkDialog = memo(function StaffCheckinLinkDialog({
  eventId,
  eventTitle,
  open,
  onOpenChange,
}: StaffCheckinLinkDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    fetchEventCheckinToken(eventId).then((token) => {
      if (cancelled) return;
      setUrl(token ? buildCheckinUrl(token) : null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, eventId]);

  const handleCopy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('events.checkinLinkCopied', 'Ссылка скопирована'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common.copyError', 'Не удалось скопировать'));
    }
  }, [url, t]);

  const handleShare = useCallback(async () => {
    if (!url) return;
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: eventTitle || t('events.checkinLinkTitle', 'Ссылка для проверки билетов'),
        url,
      });
    } catch {
      // user cancelled the native share sheet
    }
  }, [url, eventTitle, handleCopy, t]);

  const handleRotate = useCallback(async () => {
    setRotating(true);
    const token = await rotateEventCheckinToken(eventId);
    setRotating(false);

    if (!token) {
      toast.error(t('events.checkinLinkRotateError', 'Не удалось обновить ссылку'));
      return;
    }

    setUrl(buildCheckinUrl(token));
    toast.success(t('events.checkinLinkRotated', 'Готово: старая ссылка больше не работает'));
  }, [eventId, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('events.checkinLinkTitle', 'Ссылка для проверки билетов')}</DialogTitle>
          <DialogDescription>
            {t(
              'events.checkinLinkDescription',
              'Отправьте ссылку помощнику на входе. Он откроет камеру на своём телефоне и будет отмечать гостей, не заходя в ваш аккаунт.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={loading ? t('common.loading', 'Загрузка...') : url ?? ''}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button size="icon" variant="outline" onClick={handleCopy} disabled={!url || loading}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleShare} disabled={!url || loading}>
              <Share2 className="h-4 w-4 mr-2" />
              {t('events.checkinLinkShare', 'Отправить')}
            </Button>
            <Button variant="outline" onClick={handleRotate} disabled={rotating || loading}>
              {rotating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('events.checkinLinkRotate', 'Новая ссылка')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground flex gap-2 leading-relaxed">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            {t(
              'events.checkinLinkSecurityHint',
              'По ссылке видно только это событие и счётчик гостей. Если ссылка попала не туда, нажмите «Новая ссылка».',
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default StaffCheckinLinkDialog;
