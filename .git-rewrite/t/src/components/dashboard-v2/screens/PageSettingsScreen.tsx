/**
 * PageSettingsScreen - Settings for the current page (page-scoped)
 * SEO, branding, domain/slug, visibility
 */
import { memo, useState } from 'react';
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
import { cn } from '@/lib/utils';
import type { Niche } from '@/lib/niches';

interface PageSettingsScreenProps {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  isPaid: boolean;
  isPrimaryPaid: boolean;
  isPublished: boolean;
  niche?: Niche;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  isIndexable?: boolean;
  isPremium: boolean;
  onBack: () => void;
  onUpdateSlug: (slug: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateSeo: (seo: { title?: string; description?: string; keywords?: string[] }) => void;
  onUpdateNiche: (niche: Niche) => void;
  onToggleIndexable: (indexable: boolean) => void;
  onUpgradePage?: () => void;
}

export const PageSettingsScreen = memo(function PageSettingsScreen({
  pageId,
  pageTitle,
  pageSlug,
  isPaid,
  isPrimaryPaid,
  isPublished,
  niche,
  seoTitle,
  seoDescription,
  seoKeywords,
  isIndexable,
  isPremium,
  onBack,
  onUpdateSlug,
  onUpdateSeo,
  onUpdateNiche,
  onToggleIndexable,
  onUpgradePage,
}: PageSettingsScreenProps) {
  const { t } = useTranslation();

  const [slugInput, setSlugInput] = useState(pageSlug);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

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
    }

    setSlugSaving(false);
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

      <div className="px-5 py-6 space-y-6">
        {/* Current Page Info */}
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

        {/* Domain / Slug */}
        <div className="space-y-2">
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
        </div>

        {/* SEO Settings */}
        <div className="space-y-2">
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
        </div>

        {/* Niche / Category */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.category', 'Category')}
          </h3>
          <Card className="p-4">
            <NicheSelector value={niche} onChange={onUpdateNiche} />
          </Card>
        </div>

        {/* Branding (Premium) */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.pageSettings.branding', 'Branding')}
          </h3>
          <Card className="p-4">
            <button
              className="w-full flex items-center gap-4 text-left"
              onClick={() => {/* TODO: Open theme editor */}}
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
        </div>
      </div>
    </div>
  );
});
