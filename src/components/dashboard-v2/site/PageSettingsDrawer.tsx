/**
 * PageSettingsDrawer — Sprint 1 (Global Plan).
 * Per-page SEO + indexing + favicon + branding controls.
 * Opens for any page (home or sub-page) via the settings cog in SitePagesManager.
 */
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  usePageSettings,
  useUpdatePageSettings,
} from '@/hooks/sites/useSite';
import type { PageSeoMeta } from '@/services/sites';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';

interface Props {
  siteId: string | undefined;
  pageId: string | null;
  pageLabel?: string;
  onClose: () => void;
}

export const PageSettingsDrawer = memo(function PageSettingsDrawer({
  siteId,
  pageId,
  pageLabel,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { isPremium } = usePremiumStatus();
  const { data, isLoading } = usePageSettings(pageId ?? undefined);
  const update = useUpdatePageSettings(siteId, pageId ?? undefined);

  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [favicon, setFavicon] = useState('');
  const [indexable, setIndexable] = useState(true);
  const [hideBranding, setHideBranding] = useState(false);

  useEffect(() => {
    if (!data) return;
    const seo = (data.seo_meta ?? {}) as PageSeoMeta;
    setSeoTitle(seo.title ?? '');
    setSeoDesc(seo.description ?? '');
    setOgImage(seo.og_image ?? '');
    setFavicon(data.favicon_url ?? '');
    setIndexable(data.is_indexable);
    setHideBranding(data.hide_branding);
  }, [data]);

  const handleSave = async () => {
    const seo_meta: PageSeoMeta = {
      ...(data?.seo_meta ?? {}),
      title: seoTitle.trim() || undefined,
      description: seoDesc.trim() || undefined,
      og_image: ogImage.trim() || undefined,
    };
    const ok = await update.mutateAsync({
      seo_meta,
      favicon_url: favicon.trim() || null,
      is_indexable: indexable,
      hide_branding: isPremium ? hideBranding : false,
    });
    if (ok) {
      toast.success(t('pageSettings.saved', 'Настройки сохранены'));
      onClose();
    } else {
      toast.error(t('pageSettings.saveError', 'Не удалось сохранить'));
    }
  };

  const titleLen = seoTitle.length;
  const descLen = seoDesc.length;

  return (
    <Sheet open={!!pageId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t('pageSettings.title', 'Настройки страницы')}
            {pageLabel ? ` — ${pageLabel}` : ''}
          </SheetTitle>
          <SheetDescription>
            {t(
              'pageSettings.subtitle',
              'SEO, иконка и индексация для этой страницы.',
            )}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t('common.loading', 'Загрузка…')}
          </div>
        ) : (
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ps-title">
                  {t('pageSettings.seoTitle', 'SEO Title')}
                </Label>
                <span className={`text-[10px] tabular-nums ${titleLen > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {titleLen}/60
                </span>
              </div>
              <Input
                id="ps-title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={t('pageSettings.seoTitlePh', 'Краткий заголовок для поиска')}
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ps-desc">
                  {t('pageSettings.seoDesc', 'Meta Description')}
                </Label>
                <span className={`text-[10px] tabular-nums ${descLen > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {descLen}/160
                </span>
              </div>
              <Textarea
                id="ps-desc"
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                placeholder={t(
                  'pageSettings.seoDescPh',
                  '1–2 предложения о том, что найдут на странице.',
                )}
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ps-og">
                {t('pageSettings.ogImage', 'OG-картинка (URL)')}
              </Label>
              <Input
                id="ps-og"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://…/preview.jpg"
              />
              <p className="text-[11px] text-muted-foreground">
                {t(
                  'pageSettings.ogHint',
                  '1200×630, JPG/PNG. Показывается при шаринге в мессенджерах и соцсетях.',
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ps-favicon">
                {t('pageSettings.favicon', 'Favicon (URL)')}
              </Label>
              <Input
                id="ps-favicon"
                value={favicon}
                onChange={(e) => setFavicon(e.target.value)}
                placeholder="https://…/favicon.png"
              />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {t('pageSettings.indexable', 'Индексировать в Google')}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'pageSettings.indexableHint',
                    'Выключите для черновиков и приватных страниц.',
                  )}
                </p>
              </div>
              <Switch checked={indexable} onCheckedChange={setIndexable} />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium flex items-center gap-2">
                  {t('pageSettings.hideBranding', 'Скрыть бренд LinkMAX')}
                  {!isPremium && (
                    <span className="text-[10px] uppercase tracking-wide text-primary/80 font-semibold">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'pageSettings.hideBrandingHint',
                    'Убирает «Сделано на LinkMAX» из футера страницы.',
                  )}
                </p>
              </div>
              <Switch
                checked={hideBranding}
                onCheckedChange={setHideBranding}
                disabled={!isPremium}
              />
            </div>
          </div>
        )}

        <SheetFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Отмена')}
          </Button>
          <Button onClick={handleSave} disabled={update.isPending || isLoading}>
            {update.isPending
              ? t('common.saving', 'Сохраняем…')
              : t('common.save', 'Сохранить')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});
