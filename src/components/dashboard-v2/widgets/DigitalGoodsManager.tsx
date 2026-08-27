/**
 * DigitalGoodsManager - upload and sell protected files.
 * Files live in the private `digital-goods` bucket; buyers only ever get
 * short-lived signed URLs issued by the digital-goods-download function.
 */
import { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Package from 'lucide-react/dist/esm/icons/package';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { cn } from '@/lib/utils/utils';

interface DigitalProductRow {
  id: string;
  title: string;
  file_name: string;
  file_size: number | null;
  file_path: string;
  price: number;
  currency: string;
  download_limit: number;
  is_active: boolean;
  created_at: string;
}

const MAX_SIZE = 200 * 1024 * 1024;

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const DigitalGoodsManager = memo(function DigitalGoodsManager({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['digitalProducts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select('id, title, file_name, file_size, file_path, price, currency, download_limit, is_active, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DigitalProductRow[];
    },
  });

  const handleCreate = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error(t('digitalGoods.errors.title', 'Укажите название товара'));
      return;
    }
    if (!file) {
      toast.error(t('digitalGoods.errors.file', 'Выберите файл'));
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('digitalGoods.errors.tooLarge', 'Файл больше 200 МБ'));
      return;
    }

    setBusy(true);
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('digital-goods')
      .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

    if (uploadError) {
      setBusy(false);
      toast.error(t('digitalGoods.errors.upload', 'Не удалось загрузить файл'));
      return;
    }

    const { error } = await supabase.from('digital_products').insert({
      user_id: user.id,
      title: title.trim(),
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      price: Number(price) || 0,
    } as never);

    setBusy(false);

    if (error) {
      await supabase.storage.from('digital-goods').remove([path]);
      toast.error(t('digitalGoods.errors.save', 'Не удалось сохранить товар'));
      return;
    }

    setTitle('');
    setPrice('0');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    toast.success(t('digitalGoods.created', 'Товар добавлен'));
    queryClient.invalidateQueries({ queryKey: ['digitalProducts', user.id] });
  };

  const toggleActive = async (product: DigitalProductRow) => {
    const { error } = await supabase
      .from('digital_products')
      .update({ is_active: !product.is_active } as never)
      .eq('id', product.id);
    if (error) {
      toast.error(t('common.error', 'Ошибка'));
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['digitalProducts', user?.id] });
  };

  const removeProduct = async (product: DigitalProductRow) => {
    const { error } = await supabase.from('digital_products').delete().eq('id', product.id);
    if (error) {
      toast.error(t('common.error', 'Ошибка'));
      return;
    }
    await supabase.storage.from('digital-goods').remove([product.file_path]);
    toast.success(t('digitalGoods.deleted', 'Товар удалён'));
    queryClient.invalidateQueries({ queryKey: ['digitalProducts', user?.id] });
  };

  const copyLink = async (product: DigitalProductRow) => {
    const url = `${window.location.origin}/goods/${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('digitalGoods.linkCopied', 'Ссылка скопирована'));
    } catch {
      toast.error(url);
    }
  };

  return (
    <Card className={cn('p-5 space-y-5 border-0 shadow-none bg-card/60 rounded-3xl', className)}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold truncate">{t('digitalGoods.title', 'Цифровые товары')}</h3>
          <p className="text-xs text-muted-foreground break-words">
            {t('digitalGoods.subtitle', 'Продавайте файлы: доступ по защищённой ссылке с лимитом скачиваний')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dg-title">{t('digitalGoods.fields.title', 'Название')}</Label>
          <Input
            id="dg-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('digitalGoods.fields.titlePlaceholder', 'Например: Гайд по продажам (PDF)')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dg-price">{t('digitalGoods.fields.price', 'Цена')}</Label>
            <Input
              id="dg-price"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg-file">{t('digitalGoods.fields.file', 'Файл')}</Label>
            <Input
              id="dg-file"
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={busy} className="w-full h-11">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {t('digitalGoods.create', 'Добавить товар')}
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-xs text-muted-foreground">{t('common.loading', 'Загрузка...')}</p>}
        {!isLoading && products.length === 0 && (
          <p className="text-xs text-muted-foreground break-words">
            {t('digitalGoods.empty', 'Пока нет товаров. Загрузите первый файл.')}
          </p>
        )}
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{product.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {product.file_name} · {formatSize(product.file_size)} ·{' '}
                {Number(product.price) > 0
                  ? `${Number(product.price).toLocaleString()} ${product.currency}`
                  : t('digitalGoods.free', 'Бесплатно')}
              </p>
            </div>
            <Switch checked={product.is_active} onCheckedChange={() => toggleActive(product)} />
            <Button size="icon" variant="ghost" onClick={() => copyLink(product)} aria-label={t('digitalGoods.copyLink', 'Скопировать ссылку')}>
              <Link2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => removeProduct(product)} aria-label={t('common.delete', 'Удалить')}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
});
