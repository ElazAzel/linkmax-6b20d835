/**
 * PublicPurchasePage - secure download interface (/purchase/:token).
 * Shows purchase state and issues short-lived signed download URLs.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Download from 'lucide-react/dist/esm/icons/download';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PurchaseInfo {
  status: string;
  paid: boolean;
  expired: boolean;
  exhausted: boolean;
  downloadsUsed: number;
  downloadLimit: number;
  expiresAt: string | null;
  amount: number;
  currency: string;
  product: { title: string; description: string | null; fileName: string; fileSize: number | null; isActive: boolean } | null;
}

export default function PublicPurchasePage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [info, setInfo] = useState<PurchaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const { data, error } = await supabase.functions.invoke('digital-goods-download', {
      body: { token, action: 'info' },
    });
    if (error || !data?.success) {
      setInfo(null);
    } else {
      setInfo(data.purchase as PurchaseInfo);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async () => {
    if (!token) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('digital-goods-download', {
      body: { token, action: 'download' },
    });
    setBusy(false);

    if (error || !data?.success || !data.url) {
      toast.error(t('digitalGoods.download.failed', 'Не удалось получить файл'));
      await load();
      return;
    }

    window.location.href = data.url;
    setTimeout(load, 1500);
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!info) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <h1 className="text-xl font-bold text-center break-words">
          {t('digitalGoods.download.notFound', 'Покупка не найдена')}
        </h1>
      </main>
    );
  }

  const blocked = !info.paid || info.expired || info.exhausted || !info.product?.isActive;

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md p-6 space-y-5 border-0 shadow-none bg-card/70 rounded-3xl">
        <h1 className="text-lg font-bold break-words">
          {info.product?.title || t('digitalGoods.download.title', 'Ваша покупка')}
        </h1>

        {info.product?.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{info.product.description}</p>
        )}

        {!info.paid && (
          <p className="text-sm text-muted-foreground break-words">
            {t('digitalGoods.download.pending', 'Ожидаем подтверждение оплаты. Обновите страницу через минуту.')}
          </p>
        )}
        {info.paid && info.expired && (
          <p className="text-sm text-destructive break-words">
            {t('digitalGoods.download.expired', 'Срок действия ссылки истёк. Свяжитесь с продавцом.')}
          </p>
        )}
        {info.paid && !info.expired && info.exhausted && (
          <p className="text-sm text-destructive break-words">
            {t('digitalGoods.download.exhausted', 'Лимит скачиваний исчерпан.')}
          </p>
        )}

        <Button className="w-full h-12" onClick={handleDownload} disabled={busy || blocked}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {t('digitalGoods.download.action', 'Скачать файл')}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground break-words">
          <Clock className="h-4 w-4 shrink-0" />
          {t('digitalGoods.download.counter', 'Скачано {{used}} из {{limit}}', {
            used: info.downloadsUsed,
            limit: info.downloadLimit,
          })}
          {info.expiresAt && ` · ${new Date(info.expiresAt).toLocaleDateString()}`}
        </div>

        {!info.paid && (
          <Button variant="ghost" className="w-full" onClick={load}>
            {t('common.refresh', 'Обновить')}
          </Button>
        )}
      </Card>
    </main>
  );
}
