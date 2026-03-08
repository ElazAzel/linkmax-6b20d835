/**
 * KaspiQRGenerator - QR code generator for Kaspi payments
 */
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Download from 'lucide-react/dist/esm/icons/download';
import { toast } from 'sonner';

interface KaspiQRGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmount?: number;
  dealTitle?: string;
  currency?: string;
}

export const KaspiQRGenerator = memo(function KaspiQRGenerator({
  open,
  onOpenChange,
  defaultAmount = 0,
  dealTitle = '',
  currency = 'KZT',
}: KaspiQRGeneratorProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(defaultAmount);
  const [comment, setComment] = useState(dealTitle);

  // Generate Kaspi Gold deeplink URL
  // Format: https://kaspi.kz/pay/[merchant]?amount=[amount]&comment=[comment]
  // For P2P payments, we use a simplified format that opens the Kaspi app
  const kaspiDeeplink = useMemo(() => {
    const params = new URLSearchParams();
    if (amount > 0) params.set('amount', amount.toString());
    if (comment) params.set('comment', comment);
    
    // Kaspi Gold payment deeplink
    // This opens Kaspi app with payment screen
    return `https://kaspi.kz/pay?${params.toString()}`;
  }, [amount, comment]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(kaspiDeeplink);
    toast.success(t('kaspi.linkCopied', 'Link copied to clipboard'));
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('kaspi-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `kaspi-qr-${Date.now()}.png`;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-[#F14635]" />
            {t('kaspi.title', 'Kaspi QR Payment')}
          </DialogTitle>
          <DialogDescription>
            {t('kaspi.description', 'Generate QR code for quick Kaspi payment')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('kaspi.amount', 'Amount')}</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="flex-1"
              />
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                {currency}
              </span>
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <Label htmlFor="comment">{t('kaspi.comment', 'Comment')}</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('kaspi.commentPlaceholder', 'Payment description')}
              maxLength={100}
            />
          </div>

          {/* QR Code Display */}
          <Card className="p-6 flex flex-col items-center justify-center bg-white">
            <QRCodeSVG
              id="kaspi-qr-code"
              value={kaspiDeeplink}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <p className="text-xs text-center text-muted-foreground mt-3 max-w-[200px]">
              {t('kaspi.scanHint', 'Scan with Kaspi app to pay')}
            </p>
          </Card>

          {/* Amount Display */}
          {amount > 0 && (
            <div className="text-center">
              <span className="text-2xl font-bold">{amount.toLocaleString()}</span>
              <span className="text-lg text-muted-foreground ml-2">{currency}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('kaspi.copyLink', 'Copy Link')}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownloadQR}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('kaspi.downloadQR', 'Download QR')}
            </Button>
          </div>

          {/* Kaspi Branding */}
          <p className="text-[10px] text-center text-muted-foreground">
            {t('kaspi.disclaimer', 'Powered by Kaspi.kz payment system')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});
