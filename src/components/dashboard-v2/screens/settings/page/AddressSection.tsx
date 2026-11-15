import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Globe from 'lucide-react/dist/esm/icons/globe';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PremiumFeatureGate } from '@/components/billing/PremiumFeatureGate';
import { useDomainVerification } from '@/hooks/page/useDomainVerification';
import { GroupTitle } from './shared';
import { getDnsRecord, getPublicHost } from './helpers';

const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;
const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

type SaveResult = Promise<{ success: boolean; error?: string }>;

interface AddressSectionProps {
  pageSlug?: string;
  customDomain?: string;
  isPublished: boolean;
  isPremium: boolean;
  onUpdateSlug?: (slug: string) => SaveResult;
  onUpdateCustomDomain?: (domain: string) => SaveResult;
}

export const AddressSection = memo(function AddressSection({
  pageSlug, customDomain, isPublished, isPremium, onUpdateSlug, onUpdateCustomDomain,
}: AddressSectionProps) {
  const { t } = useTranslation();
  const host = getPublicHost();

  const [slugInput, setSlugInput] = useState(pageSlug || '');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [confirmSlug, setConfirmSlug] = useState(false);

  const [domainInput, setDomainInput] = useState(customDomain || '');
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const { verifyDomain, isVerifying, check, reset } = useDomainVerification();

  const slugChanged = slugInput !== (pageSlug || '');
  const domainChanged = domainInput !== (customDomain || '');

  const saveSlug = async () => {
    if (!onUpdateSlug) return;
    setSlugSaving(true);
    setSlugError(null);
    const result = await onUpdateSlug(slugInput);
    if (result.success) {
      toast.success(t('dashboard.pageSettings.slugUpdated', 'Адрес страницы изменён'));
    } else {
      setSlugError(t(`dashboard.pageSettings.errors.${result.error}`, t('dashboard.pageSettings.slugSaveFailed', 'Не удалось изменить адрес')));
    }
    setSlugSaving(false);
  };

  const handleSlugSubmit = () => {
    if (!onUpdateSlug || !slugChanged) return;
    if (!SLUG_REGEX.test(slugInput)) {
      setSlugError(t('dashboard.pageSettings.slugInvalid', 'Только латинские буквы, цифры и дефис, от 3 до 30 символов'));
      return;
    }
    // A published page already has links and QR codes in the wild.
    if (isPublished) setConfirmSlug(true);
    else void saveSlug();
  };

  const handleDomainSubmit = async () => {
    if (!onUpdateCustomDomain || !domainChanged) return;
    if (domainInput && !DOMAIN_REGEX.test(domainInput)) {
      setDomainError(t('dashboard.pageSettings.domainInvalid', 'Введите корректный домен, например ivan.kz'));
      return;
    }
    setDomainSaving(true);
    setDomainError(null);
    reset();
    const result = await onUpdateCustomDomain(domainInput);
    if (result.success) {
      toast.success(domainInput
        ? t('dashboard.pageSettings.domainSaved', 'Домен сохранён. Теперь настройте DNS-запись')
        : t('dashboard.pageSettings.domainRemoved', 'Домен отключён'));
    } else {
      setDomainError(t(`dashboard.pageSettings.errors.${result.error}`, t('dashboard.pageSettings.domainSaveFailed', 'Не удалось сохранить домен')));
    }
    setDomainSaving(false);
  };

  const dns = domainInput && DOMAIN_REGEX.test(domainInput) ? getDnsRecord(domainInput, host) : null;
  const savedDomain = customDomain || '';
  const currentCheck = check && check.hostname === savedDomain ? check : null;

  return (
    <>
      {/* Page address */}
      <div className="space-y-2">
        <Label htmlFor="page-slug" className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          {t('dashboard.pageSettings.slug', 'Адрес страницы')}
        </Label>
        <div className="flex gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-border bg-muted focus-within:border-primary/50">
            <span className="shrink-0 pl-4 text-sm font-medium text-muted-foreground">{host}/</span>
            <Input
              id="page-slug"
              value={slugInput}
              onChange={(e) => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSlugSubmit(); }}
              className="h-full min-w-0 flex-1 border-0 bg-transparent pl-0.5 font-medium shadow-none focus-visible:ring-0"
              placeholder={t('dashboard.pageSettings.yourPagePlaceholder', 'your-page')}
              maxLength={30}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!slugError}
              data-testid="page-slug-input"
            />
          </div>
          <Button
            onClick={handleSlugSubmit}
            disabled={slugSaving || !slugChanged || !onUpdateSlug}
            loading={slugSaving}
            className="h-12 rounded-xl px-5"
            data-testid="page-slug-save"
          >
            {t('common.save', 'Сохранить')}
          </Button>
        </div>
        {slugError ? (
          <p role="alert" className="flex items-center gap-1.5 rounded-lg border border-destructive/10 bg-destructive/5 p-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {slugError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('dashboard.pageSettings.slugFormatHint', 'Латинские буквы, цифры и дефис, от 3 до 30 символов')}
          </p>
        )}
      </div>

      {/* Custom domain (PRO) */}
      <div className="space-y-2 border-t border-border pt-5">
        <GroupTitle>
          {t('dashboard.pageSettings.customDomain', 'Свой домен')}
          {!isPremium && <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-xs uppercase text-primary">PRO</Badge>}
        </GroupTitle>
        <PremiumFeatureGate requiredTier="pro" outcomeKey="domain">
          <div className="space-y-3">
            <Label htmlFor="page-domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('dashboard.pageSettings.yourDomain', 'Ваш домен')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="page-domain"
                value={domainInput}
                onChange={(e) => { setDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')); setDomainError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleDomainSubmit(); }}
                className="h-12 rounded-xl"
                placeholder={t('dashboard.pageSettings.yourDomainExample', 'ivan.kz')}
                disabled={!isPremium}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!domainError}
              />
              <Button
                onClick={() => void handleDomainSubmit()}
                disabled={domainSaving || !domainChanged || !onUpdateCustomDomain || !isPremium}
                loading={domainSaving}
                className="h-12 rounded-xl px-5"
              >
                {t('common.save', 'Сохранить')}
              </Button>
            </div>
            {domainError && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {domainError}
              </p>
            )}

            {isPremium && dns && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs font-medium">{t('dashboard.pageSettings.dnsConfig', 'Добавьте эту запись у регистратора домена:')}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsType', 'Тип')}</div>
                  <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsName', 'Имя')}</div>
                  <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsValue', 'Значение')}</div>
                  <div className="rounded bg-background px-2 py-1 font-mono">{dns.type}</div>
                  <div className="truncate rounded bg-background px-2 py-1 font-mono">{dns.name}</div>
                  <div className="truncate rounded bg-background px-2 py-1 font-mono">{dns.value}</div>
                </div>
                {dns.isRoot && (
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.pageSettings.dnsRootHint', 'Для домена без «www» запись CNAME не подойдёт. Если у регистратора нет ALIAS или ANAME, подключите адрес www.{{domain}} и включите переадресацию с основного домена.', { domain: domainInput })}
                  </p>
                )}
              </div>
            )}

            {isPremium && savedDomain && !domainChanged && (
              <div className="flex flex-wrap items-center gap-3" data-testid="domain-status">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => void verifyDomain(savedDomain)}
                  disabled={isVerifying}
                >
                  <RefreshCw className={isVerifying ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
                  {t('dashboard.pageSettings.domainCheck', 'Проверить подключение')}
                </Button>
                {currentCheck?.state === 'active' && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('dashboard.pageSettings.domainActive', 'Домен подключён')}
                  </span>
                )}
                {currentCheck?.state === 'pending' && (
                  <span className="flex items-center gap-1.5 text-sm text-warning">
                    <Clock className="h-4 w-4 shrink-0" />
                    {t('dashboard.pageSettings.domainPending', 'DNS-запись пока не найдена. Обновление может занять до 24 часов')}
                  </span>
                )}
                {currentCheck?.state === 'error' && (
                  <span className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {t('dashboard.pageSettings.domainCheckFailed', 'Не удалось проверить домен. Попробуйте позже')}
                  </span>
                )}
              </div>
            )}
          </div>
        </PremiumFeatureGate>
      </div>

      <AlertDialog open={confirmSlug} onOpenChange={setConfirmSlug}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.pageSettings.slugConfirmTitle', 'Изменить адрес страницы?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.pageSettings.slugConfirmText', 'Старая ссылка {{oldUrl}} перестанет открываться. Ссылки в соцсетях и напечатанные QR-коды нужно будет заменить на {{newUrl}}.', {
                oldUrl: `${host}/${pageSlug || ''}`,
                newUrl: `${host}/${slugInput}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void saveSlug()} data-testid="page-slug-confirm">
              {t('dashboard.pageSettings.slugConfirmAction', 'Изменить адрес')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
