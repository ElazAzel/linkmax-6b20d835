/**
 * PageSettingsScreen - Settings for the current page (page-scoped)
 * SEO, branding, domain/slug, visibility
 */
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Palette,
  Search,
  Eye,
  Link2,
  ChevronRight,
  Check,
  AlertTriangle,
  Crown,
  Sparkles,
  CreditCard,
  Lock,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DashboardHeader } from '../layout/DashboardHeader';
import { NicheSelector } from '@/components/settings/NicheSelector';
import { cn } from '@/lib/utils/utils';
import { usePremiumStatus, type PremiumTier } from '@/hooks/user/usePremiumStatus';
import type { Niche } from '@/lib/niches';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PageSettingsScreenProps {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  customDomain?: string | null;
  isPaid: boolean;
  isPrimaryPaid: boolean;
  isPublished: boolean;
  niche?: Niche;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  isIndexable?: boolean;
  premiumTier?: PremiumTier;
  onBack: () => void;
  onUpdateSlug: (slug: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateCustomDomain: (domain: string | null) => Promise<{ success: boolean; error?: string }>;
  onUpdateSeo: (seo: { title?: string; description?: string; keywords?: string[] }) => void;
  onUpdateNiche: (niche: Niche) => void;
  onUpdateIntegrations: (integrations: any) => void;
  onToggleIndexable: (indexable: boolean) => void;
  onUpgradePage?: () => void;
  onOpenTheme?: () => void;
  onOpenAIBuilder?: () => void;
  integrations?: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
};

export const PageSettingsScreen = memo(function PageSettingsScreen({
  pageId,
  pageTitle,
  pageSlug,
  customDomain,
  isPaid,
  isPrimaryPaid,
  isPublished,
  niche,
  seoTitle,
  seoDescription,
  seoKeywords,
  isIndexable,
  premiumTier,
  onBack,
  onUpdateSlug,
  onUpdateCustomDomain,
  onUpdateSeo, // Removed duplicate 'onUpdateSeo, CustomDomain,'
  onUpdateNiche,
  onToggleIndexable,
  onUpgradePage,
  onOpenTheme,
  onOpenAIBuilder,
  onUpdateIntegrations,
  integrations,
}: PageSettingsScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate(); // Added useNavigate hook
  const { isPremium } = usePremiumStatus();

  const [slugInput, setSlugInput] = useState(pageSlug);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const [customDomainInput, setCustomDomainInput] = useState(customDomain || '');
  const [customDomainSaving, setCustomDomainSaving] = useState(false);

  const [seoTitleInput, setSeoTitleInput] = useState(seoTitle || '');
  const [seoDescInput, setSeoDescInput] = useState(seoDescription || '');

  const handleSaveSlug = async () => {
    if (slugInput === pageSlug) return;

    // Validate slug format
    const slugRegex = /^[a-z0-9-]{3,30}$/;
    if (!slugRegex.test(slugInput)) {
      setSlugError(t('dashboard.pageSettings.slugInvalid', 'Only lowercase letters, numbers, and hyphens. 3-30 characters.'));
      return;
    }

    setSlugSaving(true);
    setSlugError(null);

    const result = await onUpdateSlug(slugInput);

    if (!result.success) {
      setSlugError(t(`dashboard.pageSettings.errors.${result.error}`, 'Failed to update slug'));
    } else {
      toast.success(t('common.saved', 'Saved'));
    }

    setSlugSaving(false);
  };

  const handleSaveCustomDomain = async () => {
    if (!isPremium) return;
    if (customDomainInput === (customDomain || '')) {
      if (customDomainInput === '') return;
      return;
    }

    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (customDomainInput && !domainRegex.test(customDomainInput)) {
      toast.error(t('dashboard.pageSettings.invalidDomain', 'Invalid domain format'));
      return;
    }

    setCustomDomainSaving(true);

    // Pass null if empty string to clear the domain
    const result = await onUpdateCustomDomain(customDomainInput || null);

    if (!result.success) {
      if (result.error === '23505' || result.error === 'domain_taken') {
        toast.error(t('dashboard.pageSettings.domainTaken', 'This domain is already connected to another page'));
      } else {
        toast.error(t('common.error', 'Failed to save'));
        console.error(`Failed to update custom domain: ${result.error}`);
      }
    } else {
      toast.success(t('common.saved', 'Saved'));
    }
    setCustomDomainSaving(false);
  };

  const handleSaveSeo = () => {
    onUpdateSeo({
      title: seoTitleInput || undefined,
      description: seoDescInput || undefined,
    });
  };

  const getPageTypeBadge = () => {
    if (isPrimaryPaid) {
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <Crown className="w-3 h-3 mr-1" />
          {t('dashboard.pageSettings.primaryPaid', 'Primary Paid')}
        </Badge>
      );
    }
    if (isPaid) {
      return (
        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          {t('dashboard.pageSettings.paidAddon', 'Paid Add-on')}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        {t('dashboard.pageSettings.freePage', 'Free')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background safe-area-top">
      <DashboardHeader
        title={t('dashboard.pageSettings.title', 'Page Settings')}
        showBack
        onBack={onBack}
      />

      <motion.div
        className="px-5 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Current Page Info */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{pageTitle || t('dashboard.pageSettings.untitled', 'Untitled Page')}</h2>
                <p className="text-sm text-muted-foreground">lnkmx.my/{pageSlug}</p>
              </div>
              {getPageTypeBadge()}
            </div>

            {/* Upgrade to Paid Option for Free Pages */}
            {!isPaid && isPremium && onUpgradePage && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                onClick={onUpgradePage}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('dashboard.pageSettings.upgradeToPaid', 'Upgrade to Paid (70% off)')}
              </Button>
            )}
          </Card>
        </motion.div>


        {/* Custom Domain Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.pageSettings.customDomain', 'Custom Domain')}
            </h3>
            {!isPremium && (
              <Badge variant="outline" className="ml-auto text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                PRO
              </Badge>
            )}
          </div>

          <Card className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.pageSettings.customDomainDesc', 'Connect your own domain (e.g., user.com) to this page.')}
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="yourdomain.com"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  disabled={!isPremium || customDomainSaving}
                  className={cn(
                    "h-11",
                    !isPremium && "opacity-50 cursor-not-allowed"
                  )}
                  onBlur={handleSaveCustomDomain}
                />
                <Button
                  onClick={handleSaveCustomDomain}
                  disabled={!isPremium || customDomainInput === customDomain || customDomainSaving}
                  className="h-11 px-4"
                >
                  {customDomainSaving ? '...' : t('common.save', 'Save')}
                </Button>
              </div>

              {!isPremium ? (
                <Button variant="outline" className="w-full text-amber-600 border-amber-500/30 bg-amber-500/5" onClick={() => navigate('/pricing')}>
                  {t('dashboard.pageSettings.upgradeToConnect', 'Upgrade to Connect Domain')}
                </Button>
              ) : (
                <div className="bg-muted/50 p-3 rounded-xl space-y-2 text-xs text-muted-foreground border border-border/50">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    {t('dashboard.pageSettings.dnsSetup', 'DNS Configuration')}
                  </div>
                  <p>
                    {t('dashboard.pageSettings.dnsInstructions', 'Add a CNAME record to your domain provider:')}
                  </p>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center font-mono bg-background p-2 rounded border border-border/50">
                    <span>@</span>
                    <span className="text-muted-foreground">CNAME</span>
                    <span>lnkmx.my</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Domain / Slug */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.domain', 'Domain')}
          </h3>
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                {t('dashboard.pageSettings.slug', 'Page URL')}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    lnkmx.my/
                  </span>
                  <Input
                    value={slugInput}
                    onChange={(e) => {
                      setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      setSlugError(null);
                    }}
                    className="pl-[85px] h-12 rounded-xl"
                    placeholder="your-page"
                  />
                </div>
                <Button
                  onClick={handleSaveSlug}
                  disabled={slugSaving || slugInput === pageSlug}
                  className="h-12 px-5 rounded-xl"
                >
                  {slugSaving ? '...' : <Check className="w-5 h-5" />}
                </Button>
              </div>
              {slugError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {slugError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('dashboard.pageSettings.slugHint', 'Changing this will update your public URL')}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* SEO Settings */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.seo', 'SEO')}
          </h3>
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                {t('dashboard.pageSettings.seoTitle', 'Meta Title')}
              </Label>
              <Input
                value={seoTitleInput}
                onChange={(e) => setSeoTitleInput(e.target.value)}
                onBlur={handleSaveSeo}
                placeholder={t('dashboard.pageSettings.seoTitlePlaceholder', 'Page title for search engines')}
                className="h-12 rounded-xl"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground text-right">
                {seoTitleInput.length}/60
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('dashboard.pageSettings.seoDescription', 'Meta Description')}</Label>
              <Textarea
                value={seoDescInput}
                onChange={(e) => setSeoDescInput(e.target.value)}
                onBlur={handleSaveSeo}
                placeholder={t('dashboard.pageSettings.seoDescPlaceholder', 'Brief description for search results')}
                className="rounded-xl resize-none"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground text-right">
                {seoDescInput.length}/160
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {t('dashboard.pageSettings.indexable', 'Allow Search Indexing')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.pageSettings.indexableHint', 'Show page in Google and other search engines')}
                </p>
              </div>
              <Switch
                checked={isIndexable ?? true}
                onCheckedChange={onToggleIndexable}
              />
            </div>
          </Card>
        </motion.div>

        {/* Niche / Category */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.category', 'Category')}
          </h3>
          <Card className="p-4">
            <NicheSelector value={niche} onChange={onUpdateNiche} />
          </Card>
        </motion.div>

        {/* Integrations (Facebook, TikTok, GA4, Webhooks) */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('settings.integrations.title', 'Integrations & Tracking')}
          </h3>
          <Card className="p-4 space-y-5">
            <p className="text-xs text-muted-foreground">
              {t('settings.integrations.description', 'Подключите пиксели для отслеживания конверсий. События PageView, Lead, Purchase и клики по блокам отправляются автоматически.')}
            </p>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <span>Meta Pixel ID</span>
                {integrations?.fb_pixel && <span className="h-2 w-2 rounded-full bg-green-500" />}
              </Label>
              <Input
                value={integrations?.fb_pixel || ''}
                onChange={(e) => onUpdateIntegrations({ ...integrations, fb_pixel: e.target.value.replace(/\D/g, '') })}
                placeholder="1234567890"
                className="rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Events Manager → Источники данных → Pixel ID
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <span>TikTok Pixel ID</span>
                {integrations?.tt_pixel && <span className="h-2 w-2 rounded-full bg-green-500" />}
              </Label>
              <Input
                value={integrations?.tt_pixel || ''}
                onChange={(e) => onUpdateIntegrations({ ...integrations, tt_pixel: e.target.value.trim() })}
                placeholder="C1234567890"
                className="rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                TikTok Ads → Assets → Events → Pixel Code
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <span>Google Analytics 4</span>
                {integrations?.ga4_id && <span className="h-2 w-2 rounded-full bg-green-500" />}
              </Label>
              <Input
                value={integrations?.ga4_id || ''}
                onChange={(e) => onUpdateIntegrations({ ...integrations, ga4_id: e.target.value.trim() })}
                placeholder="G-XXXXXXXXXX"
                className="rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                GA4 → Admin → Data Streams → Measurement ID
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <span>Яндекс.Метрика</span>
                {integrations?.yandex_metrika && <span className="h-2 w-2 rounded-full bg-green-500" />}
              </Label>
              <Input
                value={integrations?.yandex_metrika || ''}
                onChange={(e) => onUpdateIntegrations({ ...integrations, yandex_metrika: e.target.value.replace(/\D/g, '') })}
                placeholder="12345678"
                className="rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Метрика → Настройки → Номер счётчика
              </p>
            </div>

            {/* Webhook - Pro Only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('settings.integrations.webhookUrl', 'Webhook URL')}</Label>
                {!isPremium && <Badge variant="secondary" className="text-xs">PRO</Badge>}
              </div>
              <Input
                value={integrations?.webhook_url || ''}
                onChange={(e) => onUpdateIntegrations({ ...integrations, webhook_url: e.target.value })}
                placeholder="https://your-webhook.com/..."
                className="rounded-xl"
                disabled={!isPremium}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.integrations.webhookHint', 'Recieve a POST request when a lead is created')}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* AI Builder */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.aiBuilder', 'AI Builder')}
          </h3>
          <Card className="p-4">
            <button
              className="w-full flex items-center gap-4 text-left"
              onClick={onOpenAIBuilder}
            >
              <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium">{t('dashboard.pageSettings.aiBuilderBtn', 'Заполнить страницу с AI')}</span>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.pageSettings.aiBuilderDesc', 'AI создаст контент на основе шаблона и вашей информации')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </motion.div>

        {/* Branding (Premium) */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.branding', 'Branding')}
          </h3>
          <Card className="p-4">
            <button
              className="w-full flex items-center gap-4 text-left"
              onClick={onOpenTheme}
            >
              <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('dashboard.pageSettings.theme', 'Theme & Colors')}</span>
                  {!isPremium && (
                    <Badge variant="secondary" className="text-xs">PRO</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.pageSettings.themeDesc', 'Customize colors and fonts')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
});
