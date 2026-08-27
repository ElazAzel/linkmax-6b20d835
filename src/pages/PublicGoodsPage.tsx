/**
 * PublicGoodsPage - buyer-facing checkout for a digital product (/goods/:id).
 * Never exposes the file: the server issues a purchase token instead.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Package from 'lucide-react/dist/esm/icons/package';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PublicProduct {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  price: number;
  currency: string;
  download_limit: number;
}

export default function PublicGoodsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const { data, error } = await supabase.rpc('get_digital_product_public', { _product_id: id });
      if (cancelled) return;
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setProduct(null);
      } else {
        setProduct((Array.isArray(data) ? data[0] : data) as PublicProduct);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBuy = async () => {
    if (!id) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      toast.error(t('digitalGoods.buy.invalidEmail', 'Введите корректный e-mail'));
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('digital-goods-checkout', {
      body: { productId: id, email: email.trim(), origin: window.location.origin },
    });
    setBusy(false);

    if (error || !data?.success) {
      toast.error(t('digitalGoods.buy.failed', 'Не удалось оформить покупку'));
      return;
    }

    window.location.href = data.free ? data.accessUrl : data.paymentUrl;
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <h1 className="text-xl font-bold text-center break-words">
          {t('digitalGoods.buy.notFound', 'Товар не найден или больше не продаётся')}
        </h1>
      </main>
    );
  }

  const isFree = Number(product.price) <= 0;

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md p-6 space-y-5 border-0 shadow-none bg-card/70 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold break-words">{product.title}</h1>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{product.description}</p>
        )}

        <div className="text-3xl font-black tracking-tight">
          {isFree
            ? t('digitalGoods.free', 'Бесплатно')
            : `${Number(product.price).toLocaleString()} ${product.currency}`}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dg-email">{t('digitalGoods.buy.email', 'E-mail для доступа')}</Label>
          <Input
            id="dg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <Button className="w-full h-12" onClick={handleBuy} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isFree ? t('digitalGoods.buy.get', 'Получить файл') : t('digitalGoods.buy.pay', 'Оплатить и скачать')}
        </Button>

        <p className="flex items-start gap-2 text-xs text-muted-foreground break-words">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          {t(
            'digitalGoods.buy.protected',
            'Файл выдаётся по защищённой ссылке с ограниченным числом скачиваний и сроком действия.',
          )}
        </p>
      </Card>
    </main>
  );
}
