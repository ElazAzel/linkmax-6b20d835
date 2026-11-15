/**
 * PageSettingsTab — settings of the active page, grouped by what the owner
 * wants to do: address, profile and contacts, search, appearance, integrations.
 * Each group lives in ./page/*.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Copy from 'lucide-react/dist/esm/icons/copy';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion } from '@/components/ui/accordion';
import { copyToClipboard, getPublicPageUrl } from '@/lib/utils/url-helpers';
import type { Niche } from '@/lib/niches';
import type { PageIntegrations } from '@/types/page';
import { SettingsSection } from './page/shared';
import { getPublicHost } from './page/helpers';
import { useSavedNotice } from './page/useSavedNotice';
import { AddressSection } from './page/AddressSection';
import { ProfileSection, type EntityFields } from './page/ProfileSection';
import { SearchSection } from './page/SearchSection';
import { AppearanceSection } from './page/AppearanceSection';
import { IntegrationsSection } from './page/IntegrationsSection';
import { DangerZone } from './page/DangerZone';

interface PageSettingsTabProps {
  pageTitle?: string;
  pageSlug?: string;
  customDomain?: string;
  isPublished?: boolean;
  isPaid?: boolean;
  isPrimaryPaid?: boolean;
  isPremium: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isIndexable?: boolean;
  niche?: Niche;
  faviconUrl?: string;
  hideBranding?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  city?: string;
  profession?: string;
  entityType?: 'person' | 'organization';
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  countryCode?: string;
  qualityScore?: number;
  avatarUrl?: string;
  displayName: string;
  onUpdateSlug?: (slug: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateCustomDomain?: (domain: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateSeo?: (seo: { title?: string; description?: string }) => void;
  onUpdateBranding?: (branding: { faviconUrl?: string; hideBranding?: boolean }) => void;
  onToggleIndexable?: (indexable: boolean) => void;
  onNicheChange: (niche: Niche) => void;
  onUpdateEntityFields?: (fields: EntityFields) => void;
  onUpdateWebhooks?: (data: { webhook_url?: string; webhook_secret?: string }) => void;
  integrations?: PageIntegrations;
  onUpdateIntegrations?: (integrations: PageIntegrations) => void;
  onUpgradePage?: () => void;
  onDeletePage?: () => void;
  onOpenTheme?: () => void;
  onOpenTemplates?: () => void;
  onOpenMarketplace?: () => void;
  onOpenAIBuilder?: () => void;
}

export const PageSettingsTab = memo(function PageSettingsTab({
  pageTitle, pageSlug, customDomain, isPublished = false, isPaid, isPrimaryPaid, isPremium,
  seoTitle, seoDescription, isIndexable, niche, faviconUrl, hideBranding,
  city, profession, entityType, contactEmail, contactPhone, contactWhatsapp, countryCode,
  qualityScore, avatarUrl, displayName, webhookUrl, webhookSecret,
  onUpdateSlug, onUpdateCustomDomain, onUpdateSeo, onUpdateBranding, onToggleIndexable,
  onNicheChange, onUpdateEntityFields, onUpdateWebhooks, onUpgradePage, onDeletePage,
  integrations, onUpdateIntegrations,
  onOpenTheme, onOpenTemplates, onOpenMarketplace, onOpenAIBuilder,
}: PageSettingsTabProps) {
  const { t } = useTranslation();
  const notifySaved = useSavedNotice(isPublished);
  const publicUrl = pageSlug ? getPublicPageUrl(pageSlug) : '';

  const handleCopy = async () => {
    if (!publicUrl) return;
    const copied = await copyToClipboard(publicUrl);
    if (copied) toast.success(t('dashboard.pageSettings.linkCopied', 'Ссылка скопирована'));
    else toast.error(t('dashboard.pageSettings.linkCopyFailed', 'Не удалось скопировать ссылку'));
  };

  const planBadge = isPrimaryPaid ? (
    <Badge className="border-primary/30 bg-primary/20 text-primary shadow-sm">
      <Crown className="mr-1 h-3 w-3" />
      {t('dashboard.pageSettings.primaryPaid', 'Базовая платная')}
    </Badge>
  ) : isPaid ? (
    <Badge className="border-warning/30 bg-warning/12 text-warning shadow-sm">
      <Sparkles className="mr-1 h-3 w-3" />
      {t('dashboard.pageSettings.paidAddon', 'Доп. платная')}
    </Badge>
  ) : (
    <Badge variant="secondary" className="border border-border bg-muted/60">
      {t('dashboard.pageSettings.freePage', 'Бесплатно')}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Which page is being configured, with its link one tap away */}
      <Card className="space-y-4 border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 shrink-0 rounded-2xl border-2 border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-bold text-primary">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight text-foreground">{pageTitle || displayName}</h2>
            <p className="truncate text-sm text-muted-foreground" data-testid="page-settings-url">{getPublicHost()}/{pageSlug}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={isPublished ? 'border border-success/20 bg-success/12 text-success' : 'border border-border bg-muted/60'}
              >
                {isPublished
                  ? t('dashboard.pageSettings.statusPublished', 'Опубликована')
                  : t('dashboard.pageSettings.statusDraft', 'Черновик')}
              </Badge>
              {planBadge}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void handleCopy()} data-testid="page-settings-copy-link">
            <Copy className="mr-2 h-4 w-4" />
            {t('dashboard.pageSettings.copyLink', 'Скопировать ссылку')}
          </Button>
          {isPublished && (
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('dashboard.pageSettings.openPage', 'Открыть страницу')}
              </a>
            </Button>
          )}
        </div>
        {!isPaid && isPremium && onUpgradePage && (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-primary/30 bg-primary/5 font-bold text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={onUpgradePage}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('dashboard.pageSettings.upgradeToPaid', 'Сделать платной (скидка 70%)')}
          </Button>
        )}
      </Card>

      <Accordion type="multiple" defaultValue={['address']} className="space-y-3" data-testid="page-settings-accordion">
        <SettingsSection
          value="address"
          title={t('dashboard.pageSettings.sectionAddress', 'Адрес и домен')}
          description={t('dashboard.pageSettings.sectionAddressDesc', 'Ссылка на страницу и свой домен')}
        >
          <AddressSection
            pageSlug={pageSlug}
            customDomain={customDomain}
            isPublished={isPublished}
            isPremium={isPremium}
            onUpdateSlug={onUpdateSlug}
            onUpdateCustomDomain={onUpdateCustomDomain}
          />
        </SettingsSection>

        <SettingsSection
          value="profile"
          title={t('dashboard.pageSettings.sectionProfile', 'Профиль и контакты')}
          description={t('dashboard.pageSettings.sectionProfileDesc', 'Категория, город и способы связи')}
        >
          <ProfileSection
            niche={niche}
            city={city}
            profession={profession}
            entityType={entityType}
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            contactWhatsapp={contactWhatsapp}
            countryCode={countryCode}
            onNicheChange={onNicheChange}
            onUpdateEntityFields={onUpdateEntityFields}
            onSaved={notifySaved}
          />
        </SettingsSection>

        <SettingsSection
          value="search"
          title={t('dashboard.pageSettings.sectionSearch', 'Поиск')}
          description={t('dashboard.pageSettings.sectionSearchDesc', 'Как страница выглядит в Google и Яндексе')}
        >
          <SearchSection
            pageTitle={pageTitle}
            pageSlug={pageSlug}
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            isIndexable={isIndexable}
            qualityScore={qualityScore}
            city={city}
            profession={profession}
            onUpdateSeo={onUpdateSeo}
            onToggleIndexable={onToggleIndexable}
            onSaved={notifySaved}
          />
        </SettingsSection>

        <SettingsSection
          value="branding"
          title={t('dashboard.pageSettings.sectionAppearance', 'Оформление')}
          description={t('dashboard.pageSettings.sectionAppearanceDesc', 'Тема, шаблоны и свой бренд')}
        >
          <AppearanceSection
            isPremium={isPremium}
            faviconUrl={faviconUrl}
            hideBranding={hideBranding}
            onUpdateBranding={onUpdateBranding}
            onOpenTheme={onOpenTheme}
            onOpenTemplates={onOpenTemplates}
            onOpenMarketplace={onOpenMarketplace}
            onOpenAIBuilder={onOpenAIBuilder}
            onSaved={notifySaved}
          />
        </SettingsSection>

        <SettingsSection
          value="integrations"
          title={t('dashboard.pageSettings.sectionIntegrations', 'Интеграции')}
          description={t('dashboard.pageSettings.sectionIntegrationsDesc', 'Пиксели, аналитика и вебхуки')}
        >
          <IntegrationsSection
            isPremium={isPremium}
            pageSlug={pageSlug}
            webhookUrl={webhookUrl}
            webhookSecret={webhookSecret}
            integrations={integrations}
            onUpdateIntegrations={onUpdateIntegrations}
            onUpdateWebhooks={onUpdateWebhooks}
            onSaved={notifySaved}
          />
        </SettingsSection>
      </Accordion>

      <DangerZone onDeletePage={onDeletePage} />
    </div>
  );
});
