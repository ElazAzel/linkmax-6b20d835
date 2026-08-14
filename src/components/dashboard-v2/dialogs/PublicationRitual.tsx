import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Check from 'lucide-react/dist/esm/icons/check';
import Download from 'lucide-react/dist/esm/icons/download';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import Code2 from 'lucide-react/dist/esm/icons/code-2';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { addGrowthUtm, createPageGrowthLink, recordGrowthEvent, type PageGrowthLink } from '@/services/viral-growth';

interface PublicationRitualProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishedUrl: string;
  niche?: string | null;
  pageId?: string;
}

export function PublicationRitual({
  open,
  onOpenChange,
  publishedUrl,
  niche,
  pageId,
}: PublicationRitualProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(publishedUrl);
  const [growthLink, setGrowthLink] = useState<PageGrowthLink | null>(null);

  const trackGrowth = useCallback((
    eventName: Parameters<typeof recordGrowthEvent>[0]['eventName'],
    metadata?: Record<string, unknown>,
  ) => {
    if (!growthLink) return;
    void recordGrowthEvent({ code: growthLink.code, eventName, pageId, metadata });
  }, [growthLink, pageId]);

  useEffect(() => {
    if (!open) return;
    setShareUrl(publishedUrl);
    setGrowthLink(null);
    if (!pageId) return;

    void createPageGrowthLink(pageId).then((link) => {
      if (!link) return;
      setGrowthLink(link);
      setShareUrl(link.shortUrl);
      void recordGrowthEvent({
        code: link.code,
        eventName: 'page_published',
        pageId,
        metadata: { surface: 'launch-kit' },
      });
    });
  }, [open, pageId, publishedUrl]);

  useEffect(() => {
    if (!open) return;
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    return () => clearInterval(interval);
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackGrowth('link_copied', { surface: 'launch-kit' });
      toast.success(t('ritual.linkCopied', 'Ссылка скопирована!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common.error', 'Ошибка'));
    }
  }, [shareUrl, t, trackGrowth]);

  const handleDownloadQR = useCallback(() => {
    const svg = document.getElementById('ritual-qr-code');
    if (!svg) return;
    trackGrowth('qr_generated', { surface: 'launch-kit', action: 'download' });

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${niche || 'page'}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [niche, trackGrowth]);

  const getShareText = useCallback(() => {
    const defaultText = t('ritual.niches.default', 'Мои услуги и запись: {{url}}').replace('{{url}}', shareUrl);
    if (!niche) return defaultText;
    const translated = t(`ritual.niches.${niche}`, defaultText).replace('{{url}}', shareUrl);
    return translated;
  }, [niche, shareUrl, t]);

  const embedCode = `<iframe src="${publishedUrl}" title="LinkMAX page" loading="lazy" style="width:100%;min-height:640px;border:0;border-radius:20px" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  const badgeCode = `<a href="${getAppOrigin()}/auth${growthLink ? `?ref=${growthLink.code}` : ''}" target="_blank" rel="noopener">Создать страницу в LinkMAX</a>`;

  const copySnippet = useCallback(async (value: string, eventName: 'embed_copied' | 'link_copied', metadata?: Record<string, unknown>) => {
    try {
      await navigator.clipboard.writeText(value);
      trackGrowth(eventName, { surface: 'launch-kit', ...metadata });
      toast.success(t('ritual.linkCopied', 'Готово: код скопирован'));
    } catch {
      toast.error(t('ritual.copyFailed', 'Не удалось скопировать автоматически'));
    }
  }, [t, trackGrowth]);

  const shareWhatsApp = () => {
    trackGrowth('share_clicked', { channel: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, '_blank');
  };

  const shareTelegram = () => {
    trackGrowth('share_clicked', { channel: 'telegram' });
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(getShareText())}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-2xl border-white/10 shadow-2xl rounded-[32px] p-0 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/20 blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="p-6 sm:p-8">
          <DialogHeader className="items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-glass-lg transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Sparkles className="h-10 w-10 text-white animate-bounce" />
              </div>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {t('ritual.title', 'Опубликовано! Твоя страница в сети')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-4 leading-relaxed max-w-[280px] mx-auto">
              {t('ritual.subtitle', 'Скопируй короткую ссылку, QR или embed-код и запусти первый круг трафика.')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000" />
              <div className="relative flex items-center gap-2 bg-background/50 backdrop-blur-md border border-white/10 rounded-2xl p-2 pl-4">
                <Input readOnly value={shareUrl} className="bg-transparent border-none text-sm font-semibold focus-visible:ring-0 px-0 h-10 select-all" />
                <Button onClick={handleCopy} size="sm" variant="ghost" className={cn('h-11 rounded-xl px-5 gap-2 transition-all shrink-0', copied ? 'text-emerald-500 bg-emerald-500/10' : 'hover:bg-primary/10 text-primary')}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="text-xs font-black uppercase tracking-widest">{copied ? t('common.copied', 'Готово') : t('common.copy', 'Копировать')}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-[24px] p-5 hover:bg-white/10 transition-colors">
                <div className="bg-white p-2.5 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <QRCodeSVG id="ritual-qr-code" value={shareUrl} size={110} level="H" includeMargin={false} imageSettings={{ src: '/favicon.png', x: undefined, y: undefined, height: 24, width: 24, excavate: true }} />
                </div>
                <Button variant="ghost" size="sm" onClick={handleDownloadQR} className="w-full h-10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                  <Download className="h-3.5 w-3.5 mr-1.5" />{t('ritual.downloadQR', 'Скачать QR')}
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={shareTelegram} className="h-12 w-full rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold gap-2 shadow-lg shadow-[#0088cc]/20"><Send className="h-4 w-4" />Telegram</Button>
                <Button onClick={shareWhatsApp} className="h-12 w-full rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold gap-2 shadow-lg shadow-[#25D366]/20"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                <Button variant="outline" className="h-12 w-full rounded-2xl border-white/10 glass font-bold gap-2" onClick={() => {
                  if (navigator.share) {
                    void navigator.share({ title: t('ritual.title', 'Опубликовано!'), text: getShareText(), url: shareUrl });
                    trackGrowth('share_clicked', { channel: 'native' });
                  } else {
                    void handleCopy();
                  }
                }}><Share2 className="h-4 w-4" />{t('ritual.shareMore', 'Еще...')}</Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><Code2 className="h-4 w-4 text-primary" />{t('ritual.embedTitle', 'Встроить страницу')}</div>
                <p className="text-xs text-muted-foreground">{t('ritual.embedHint', 'Добавьте мини-страницу в блог или магазин.')}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => void copySnippet(embedCode, 'embed_copied')}><Copy className="h-3.5 w-3.5 mr-2" />{t('ritual.copyEmbed', 'Скопировать embed')}</Button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="h-4 w-4 text-primary" />{t('ritual.badgeTitle', 'Бейдж LinkMAX')}</div>
                <p className="text-xs text-muted-foreground">{t('ritual.badgeHint', 'Оставьте внизу страницы и получите дополнительный referral-трафик.')}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => void copySnippet(badgeCode, 'link_copied')}><Copy className="h-3.5 w-3.5 mr-2" />{t('ritual.copyBadge', 'Скопировать бейдж')}</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/30 p-4 space-y-3">
              <div>
                <div className="text-sm font-semibold">{t('ritual.utmTitle', 'Ссылки для кампаний')}</div>
                <p className="text-xs text-muted-foreground">{t('ritual.utmHint', 'Отдельные метки покажут, откуда пришли новые создатели.')}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { source: 'instagram', label: 'Instagram bio' },
                  { source: 'whatsapp', label: 'WhatsApp' },
                ].map((variant) => (
                  <Button key={variant.source} variant="outline" size="sm" onClick={() => void copySnippet(addGrowthUtm(shareUrl, variant.source), 'link_copied', { source: variant.source })}>
                    <Copy className="h-3.5 w-3.5 mr-2" />{variant.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-center text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse">🚀 {t('ritual.promo', 'Вернись завтра за первой статистикой!')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getAppOrigin(): string {
  return typeof window === 'undefined' ? 'https://lnkmx.my' : window.location.origin;
}
