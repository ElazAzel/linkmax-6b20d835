import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Check from 'lucide-react/dist/esm/icons/check';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Search from 'lucide-react/dist/esm/icons/search';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Palette from 'lucide-react/dist/esm/icons/palette';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Store from 'lucide-react/dist/esm/icons/store';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NicheSelector } from '@/components/settings/NicheSelector';
import type { ProfileBlock } from '@/types/page';
import type { Niche } from '@/lib/niches';

interface PageSettingsTabProps {
    // Page info
    pageTitle?: string;
    pageSlug?: string;
    customDomain?: string;
    isPaid?: boolean;
    isPrimaryPaid?: boolean;
    isPremium: boolean;
    seoTitle?: string;
    seoDescription?: string;
    isIndexable?: boolean;
    niche?: Niche;
    faviconUrl?: string;
    hideBranding?: boolean;

    // Profile info
    avatarUrl?: string;
    displayName: string;

    // Actions
    onUpdateSlug?: (slug: string) => Promise<{ success: boolean; error?: string }>;
    onUpdateCustomDomain?: (domain: string) => Promise<{ success: boolean; error?: string }>;
    onUpdateSeo?: (seo: { title?: string; description?: string }) => void;
    onUpdateBranding?: (branding: { faviconUrl?: string; hideBranding?: boolean }) => void;
    onToggleIndexable?: (indexable: boolean) => void;
    onNicheChange: (niche: Niche) => void;
    onUpgradePage?: () => void;
    onOpenTheme?: () => void;
    onOpenTemplates?: () => void;
    onOpenMarketplace?: () => void;
    onOpenAIBuilder?: () => void;
}

export const PageSettingsTab = memo(function PageSettingsTab({
    pageTitle,
    pageSlug,
    customDomain,
    isPaid,
    isPrimaryPaid,
    isPremium,
    seoTitle,
    seoDescription,
    isIndexable,
    niche,
    faviconUrl,
    hideBranding,
    avatarUrl,
    displayName,
    onUpdateSlug,
    onUpdateCustomDomain,
    onUpdateSeo,
    onUpdateBranding,
    onToggleIndexable,
    onNicheChange,
    onUpgradePage,
    onOpenTheme,
    onOpenTemplates,
    onOpenMarketplace,
    onOpenAIBuilder,
}: PageSettingsTabProps) {
    const { t } = useTranslation();

    const [slugInput, setSlugInput] = useState(pageSlug || '');
    const [slugSaving, setSlugSaving] = useState(false);
    const [slugError, setSlugError] = useState<string | null>(null);

    const [domainInput, setDomainInput] = useState(customDomain || '');
    const [domainSaving, setDomainSaving] = useState(false);
    const [domainError, setDomainError] = useState<string | null>(null);
    const [seoTitleInput, setSeoTitleInput] = useState(seoTitle || '');
    const [seoDescInput, setSeoDescInput] = useState(seoDescription || '');

    const [faviconInput, setFaviconInput] = useState(faviconUrl || '');
    const [hideBrandingInner, setHideBrandingInner] = useState(hideBranding || false);

    const handleSaveSlug = async () => {
        if (!onUpdateSlug || slugInput === pageSlug) return;

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
            toast.success(t('common.saved', 'Сохранено'));
        }

        setSlugSaving(false);
    };

    const handleSaveDomain = async () => {
        if (!onUpdateCustomDomain || domainInput === customDomain) return;

        // Basic domain validation (e.g., example.com, sub.example.co.uk)
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        if (domainInput && !domainRegex.test(domainInput)) {
            setDomainError(t('dashboard.pageSettings.domainInvalid', 'Please enter a valid domain (e.g. yourdomain.com)'));
            return;
        }

        setDomainSaving(true);
        setDomainError(null);

        const result = await onUpdateCustomDomain(domainInput);

        if (!result.success) {
            setDomainError(t(`dashboard.pageSettings.errors.${result.error}`, 'Failed to update domain'));
        } else {
            toast.success(t('common.saved', 'Сохранено'));
        }

        setDomainSaving(false);
    };

    const handleSaveSeo = () => {
        if (onUpdateSeo) {
            onUpdateSeo({
                title: seoTitleInput || undefined,
                description: seoDescInput || undefined,
            });
            toast.success(t('common.saved', 'Сохранено'));
        }
    };

    const handleSaveBranding = () => {
        if (onUpdateBranding) {
            onUpdateBranding({
                faviconUrl: faviconInput || undefined,
                hideBranding: hideBrandingInner,
            });
            toast.success(t('common.saved', 'Сохранено'));
        }
    };

    const handleToggleIndexable = (checked: boolean) => {
        onToggleIndexable?.(checked);
        toast.success(t('common.saved', 'Сохранено'));
    };

    const handleNicheChange = (newNiche: Niche) => {
        onNicheChange(newNiche);
        toast.success(t('common.saved', 'Сохранено'));
    };

    const getPageTypeBadge = () => {
        if (isPrimaryPaid) {
            return (
                <Badge className="bg-primary/20 text-primary border-primary/30 shadow-sm">
                    <Crown className="w-3 h-3 mr-1" />
                    {t('dashboard.pageSettings.primaryPaid', 'Primary Paid')}
                </Badge>
            );
        }
        if (isPaid) {
            return (
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 shadow-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t('dashboard.pageSettings.paidAddon', 'Paid Add-on')}
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="glass-subtle border-white/10">
                {t('dashboard.pageSettings.freePage', 'Free')}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Current Page Info */}
            <Card className="p-5 glass-card border-white/20 shadow-glass relative overflow-hidden group">
                <div className="absolute inset-0 bg-liquid-mesh opacity-5 transition-opacity group-hover:opacity-10 -z-1" />
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/20 shadow-lg">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                                {displayName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-gradient">{pageTitle || displayName}</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">lnkmx.my/{pageSlug}</p>
                        </div>
                    </div>
                    {getPageTypeBadge()}
                </div>

                {/* Upgrade to Paid */}
                {!isPaid && isPremium && onUpgradePage && (
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white transition-all duration-300 font-bold"
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
                <Card className="p-4 space-y-4 glass-card border-white/10 shadow-glass">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                            <Link2 className="w-4 h-4 text-primary" />
                            {t('dashboard.pageSettings.slug', 'Page URL')}
                        </Label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold opacity-60">
                                    lnkmx.my/
                                </span>
                                <Input
                                    value={slugInput}
                                    onChange={(e) => {
                                        setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                        setSlugError(null);
                                    }}
                                    className="pl-[85px] h-12 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 transition-all font-medium"
                                    placeholder={t('dashboard.pageSettings.yourPagePlaceholder', 'your-page')}
                                />
                            </div>
                            <Button
                                onClick={handleSaveSlug}
                                disabled={slugSaving || slugInput === pageSlug || !onUpdateSlug}
                                className="h-12 px-6 rounded-xl bg-primary shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                            >
                                {slugSaving ? '...' : <Check className="w-5 h-5" />}
                            </Button>
                        </div>
                        {slugError && (
                            <p className="text-sm text-destructive flex items-center gap-1 font-medium bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                                <AlertTriangle className="w-4 h-4" />
                                {slugError}
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Custom Domain (PRO) */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        {t('dashboard.pageSettings.customDomain', 'Custom Domain')}
                    </h3>
                    {!isPremium && <Badge variant="secondary" className="text-[10px] uppercase border border-primary/20 text-primary bg-primary/10">PRO</Badge>}
                </div>

                <Card className={cn("p-4 space-y-4", !isPremium && "opacity-60 cursor-not-allowed relative")}>
                    {!isPremium && (
                        <div className="absolute inset-0 z-10" onClick={onUpgradePage} />
                    )}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {t('dashboard.pageSettings.yourDomain', 'Your Domain')}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={domainInput}
                                onChange={(e) => {
                                    setDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''));
                                    setDomainError(null);
                                }}
                                className="h-12 rounded-xl"
                                placeholder={t('dashboard.pageSettings.yourDomainExample', 'ivan.ru')}
                                disabled={!isPremium}
                            />
                            <Button
                                onClick={handleSaveDomain}
                                disabled={domainSaving || domainInput === customDomain || !onUpdateCustomDomain || !isPremium}
                                className="h-12 px-5 rounded-xl"
                            >
                                {domainSaving ? '...' : <Check className="w-5 h-5" />}
                            </Button>
                        </div>
                        {domainError && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                {domainError}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('dashboard.pageSettings.domainHint', 'Add a CNAME record in your DNS provider pointing to lnkmx.my')}
                        </p>

                        {/* CNAME instructions box */}
                        {isPremium && domainInput && domainInput !== '' && (
                            <div className="mt-3 bg-muted/50 rounded-lg p-3 border border-border">
                                <p className="text-xs font-medium mb-2">{t('dashboard.pageSettings.dnsConfig', 'Set this DNS Record:')}</p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsType', 'Type')}</div>
                                    <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsName', 'Name')}</div>
                                    <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsValue', 'Value')}</div>

                                    <div className="font-mono bg-background px-2 py-1 rounded">CNAME</div>
                                    <div className="font-mono bg-background px-2 py-1 rounded truncate">
                                        {domainInput.split('.').length > 2 ? domainInput.split('.')[0] : '@'}
                                    </div>
                                    <div className="font-mono bg-background px-2 py-1 rounded">lnkmx.my</div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* SEO */}
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
                            onCheckedChange={handleToggleIndexable}
                        />
                    </div>
                </Card>
            </div>

            {/* Category / Niche */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                    {t('dashboard.pageSettings.category', 'Category')}
                </h3>
                <Card className="p-4">
                    <NicheSelector value={niche} onChange={handleNicheChange} />
                </Card>
            </div>

            {/* AI Builder */}
            <div className="space-y-2">
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
            </div>

            {/* Branding */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                    {t('dashboard.pageSettings.branding', 'Branding')}
                </h3>
                <Card className="divide-y divide-border/50 overflow-hidden">
                    <button
                        className="w-full flex items-center gap-4 text-left p-4 hover:bg-muted/50 transition-colors"
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
                    <button
                        className="w-full flex items-center gap-4 text-left p-4 hover:bg-muted/50 transition-colors"
                        onClick={onOpenTemplates}
                    >
                        <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                            <LayoutTemplate className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium">{t('dashboard.pageSettings.templates', 'Templates')}</span>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.pageSettings.templatesDesc', 'Ready-made page designs')}
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button
                        className="w-full flex items-center gap-4 text-left p-4 hover:bg-muted/50 transition-colors"
                        onClick={onOpenMarketplace}
                    >
                        <div className="h-11 w-11 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                            <Store className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium">{t('dashboard.pageSettings.marketplace', 'Marketplace')}</span>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.pageSettings.marketplaceDesc', 'Community templates')}
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                </Card>
            </div>

            {/* White-label (PRO Only) */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        White-label
                    </h3>
                    {!isPremium && <Badge variant="secondary" className="text-[10px] uppercase border border-primary/20 text-primary bg-primary/10">PRO</Badge>}
                </div>
                <Card className={cn("p-4 space-y-4 glass-card border-white/10 shadow-glass", !isPremium && "opacity-60 cursor-not-allowed relative")}>
                    {!isPremium && (
                        <div className="absolute inset-0 z-10" onClick={onUpgradePage} />
                    )}

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            {t('dashboard.pageSettings.faviconUrl', 'Favicon URL')}
                        </Label>
                        <Input
                            value={faviconInput}
                            onChange={(e) => setFaviconInput(e.target.value)}
                            onBlur={handleSaveBranding}
                            placeholder="https://example.com/favicon.png"
                            className="h-12 rounded-xl"
                            disabled={!isPremium}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {t('dashboard.pageSettings.faviconHint', 'PNG or ICO link. Recommended size 64x64.')}
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {t('dashboard.pageSettings.hideBranding', 'Hide lnkmx branding')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {t('dashboard.pageSettings.hideBrandingHint', 'Remove "Made with lnkmx" watermark and links')}
                            </p>
                        </div>
                        <Switch
                            checked={hideBrandingInner}
                            onCheckedChange={(checked) => {
                                setHideBrandingInner(checked);
                                if (onUpdateBranding) {
                                    onUpdateBranding({ hideBranding: checked, faviconUrl: faviconInput || undefined });
                                }
                                toast.success(t('common.saved', 'Сохранено'));
                            }}
                            disabled={!isPremium}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
});
