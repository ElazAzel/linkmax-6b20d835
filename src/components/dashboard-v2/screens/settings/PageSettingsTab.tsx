import { memo, useState, useMemo, useEffect } from 'react';
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
import Bot from 'lucide-react/dist/esm/icons/bot';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NicheSelector } from '@/components/settings/NicheSelector';
import { PremiumFeatureGate } from '@/components/billing/PremiumFeatureGate';
import type { Niche } from '@/lib/niches';
import type { PageIntegrations } from '@/types/page';
import { INDEXABLE_THRESHOLD } from '@/lib/seo/quality-score';

const COUNTRY_OPTIONS = [
  { value: 'KZ', label: '🇰🇿 Казахстан' },
  { value: 'RU', label: '🇷🇺 Россия' },
  { value: 'UZ', label: '🇺🇿 Узбекистан' },
  { value: 'KG', label: '🇰🇬 Кыргызстан' },
  { value: 'BY', label: '🇧🇾 Беларусь' },
  { value: 'UA', label: '🇺🇦 Украина' },
  { value: 'GE', label: '🇬🇪 Грузия' },
  { value: 'AZ', label: '🇦🇿 Азербайджан' },
  { value: 'TJ', label: '🇹🇯 Таджикистан' },
  { value: 'TM', label: '🇹🇲 Туркменистан' },
  { value: 'AM', label: '🇦🇲 Армения' },
  { value: 'MD', label: '🇲🇩 Молдова' },
  { value: 'TR', label: '🇹🇷 Турция' },
  { value: 'AE', label: '🇦🇪 ОАЭ' },
  { value: 'US', label: '🇺🇸 США' },
  { value: 'OTHER', label: '🌍 Другая' },
];

interface PageSettingsTabProps {
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
    onUpdateEntityFields?: (fields: { city?: string; profession?: string; entity_type?: string; contact_email?: string; contact_phone?: string; contact_whatsapp?: string; country_code?: string }) => void;
    onUpdateWebhooks?: (data: { webhook_url?: string; webhook_secret?: string }) => void;
    integrations?: PageIntegrations;
    onUpdateIntegrations?: (integrations: PageIntegrations) => void;
    onUpgradePage?: () => void;
    onOpenTheme?: () => void;
    onOpenTemplates?: () => void;
    onOpenMarketplace?: () => void;
    onOpenAIBuilder?: () => void;
}

// Google Preview component
const GooglePreview = memo(function GooglePreview({ title, slug, description }: { title?: string; slug?: string; description?: string }) {
    const { t } = useTranslation();
    const displayTitle = title || slug || 'Untitled Page';
    const displayUrl = `lnkmx.my/${slug || ''}`;
    const displayDesc = description || t('dashboard.pageSettings.noDescription', 'Описание не задано');

    return (
        <div className="p-3 bg-card rounded-control border border-border space-y-1">
            <p className="text-xs text-muted-foreground">{t('dashboard.pageSettings.googlePreview', 'Превью в Google')}</p>
            <p className="text-sm text-info font-medium truncate">{displayTitle}</p>
            <p className="text-xs text-success">{displayUrl}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{displayDesc}</p>
        </div>
    );
});

// SEO Score Badge
const SEOScoreBadge = memo(function SEOScoreBadge({ score }: { score?: number }) {
    const { t } = useTranslation();
    if (score === undefined || score === null) return null;

    const color = score >= 70 ? 'text-success bg-success/12 border-success/20' :
                  score >= INDEXABLE_THRESHOLD ? 'text-warning bg-warning/12 border-warning/20' :
                  'text-destructive bg-destructive/12 border-destructive/20';
    const label = score >= 70 ? t('seo.good', 'Хорошо') :
                  score >= INDEXABLE_THRESHOLD ? t('seo.average', 'Средне') :
                  t('seo.weak', 'Слабо');

    return (
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium", color)}>
            <TrendingUp className="h-4 w-4" />
            <span>SEO: {score}/100</span>
            <span className="text-xs opacity-70">— {label}</span>
        </div>
    );
});

// SEO Tips
const SEOTips = memo(function SEOTips({ city, profession, bio, seoTitle, seoDesc }: { city?: string; profession?: string; bio?: string; seoTitle?: string; seoDesc?: string }) {
    const { t } = useTranslation();
    const tips: string[] = [];
    if (!city) tips.push(t('seo.tips.addCity', 'Укажите город для локального поиска'));
    if (!profession) tips.push(t('seo.tips.addProfession', 'Укажите профессию/специализацию'));
    if (!seoTitle) tips.push(t('seo.tips.addTitle', 'Заполните Meta Title'));
    if (!seoDesc) tips.push(t('seo.tips.addDescription', 'Заполните Meta Description'));

    if (tips.length === 0) return null;

    return (
        <div className="p-3 bg-warning/12 rounded-xl border border-warning/30 space-y-1">
            <p className="text-xs font-semibold text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t('seo.tips.title', 'Советы по улучшению')}
            </p>
            <ul className="text-xs text-warning space-y-0.5 list-disc list-inside">
                {tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
        </div>
    );
});

export const PageSettingsTab = memo(function PageSettingsTab({
    pageTitle, pageSlug, customDomain, isPaid, isPrimaryPaid, isPremium,
    seoTitle, seoDescription, isIndexable, niche, faviconUrl, hideBranding,
    city, profession, entityType, contactEmail, contactPhone, contactWhatsapp, countryCode,
    qualityScore, avatarUrl, displayName, webhookUrl, webhookSecret,
    onUpdateSlug, onUpdateCustomDomain, onUpdateSeo, onUpdateBranding, onToggleIndexable,
    onNicheChange, onUpdateEntityFields, onUpdateWebhooks, onUpgradePage,
    integrations, onUpdateIntegrations,
    onOpenTheme, onOpenTemplates, onOpenMarketplace, onOpenAIBuilder,
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
    const [webhookUrlInput, setWebhookUrlInput] = useState(webhookUrl || '');
    const [webhookSecretInput, setWebhookSecretInput] = useState(webhookSecret || '');
    const [professionInput, setProfessionInput] = useState(profession || '');
    const [cityInput, setCityInput] = useState(city || '');
    const [entityTypeInput, setEntityTypeInput] = useState<string>(entityType || 'person');
    const [contactEmailInput, setContactEmailInput] = useState(contactEmail || '');
    const [contactPhoneInput, setContactPhoneInput] = useState(contactPhone || '');
    const [contactWhatsappInput, setContactWhatsappInput] = useState(contactWhatsapp || '');
    const [countryCodeInput, setCountryCodeInput] = useState(countryCode || '');
    useEffect(() => { setCountryCodeInput(countryCode || ''); }, [countryCode]);

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
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        if (domainInput && !domainRegex.test(domainInput)) {
            setDomainError(t('dashboard.pageSettings.domainInvalid', 'Please enter a valid domain'));
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
            onUpdateSeo({ title: seoTitleInput || undefined, description: seoDescInput || undefined });
            toast.success(t('common.saved', 'Сохранено'));
        }
    };

    const handleSaveBranding = () => {
        if (onUpdateBranding) {
            onUpdateBranding({ faviconUrl: faviconInput || undefined, hideBranding: hideBrandingInner });
            toast.success(t('common.saved', 'Сохранено'));
        }
    };

    const handleSaveWebhooks = () => {
        // Saved on blur: focusing the field and leaving must not overwrite
        // the stored webhook with an empty value.
        if ((webhookUrlInput || '') === (webhookUrl || '') && (webhookSecretInput || '') === (webhookSecret || '')) return;
        if (onUpdateWebhooks) {
            onUpdateWebhooks({ webhook_url: webhookUrlInput || undefined, webhook_secret: webhookSecretInput || undefined });
            toast.success(t('common.saved', 'Сохранено'));
        }
    };

    const handleSaveEntityFields = () => {
        if (onUpdateEntityFields) {
            onUpdateEntityFields({
                profession: professionInput || undefined,
                city: cityInput || undefined,
                entity_type: entityTypeInput || undefined,
                contact_email: contactEmailInput || undefined,
                contact_phone: contactPhoneInput || undefined,
                contact_whatsapp: contactWhatsappInput || undefined,
                country_code: countryCodeInput || undefined,
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
                <Badge className="bg-warning/12 text-warning border-warning/30 shadow-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t('dashboard.pageSettings.paidAddon', 'Paid Add-on')}
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="bg-muted/60 border border-border">
                {t('dashboard.pageSettings.freePage', 'Free')}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Current Page Info */}
            <Card className="p-5 bg-card border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10 -z-1" />
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-border shadow-lg">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                                {displayName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">{pageTitle || displayName}</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.06em]">lnkmx.my/{pageSlug}</p>
                        </div>
                    </div>
                    {getPageTypeBadge()}
                </div>
                {!isPaid && isPremium && onUpgradePage && (
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-bold"
                        onClick={onUpgradePage}
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('dashboard.pageSettings.upgradeToPaid', 'Upgrade to Paid (70% off)')}
                    </Button>
                )}
            </Card>

            {/* Domain / Slug */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em] px-1">
                    {t('dashboard.pageSettings.domain', 'Домен')}
                </h3>
                <Card className="p-4 space-y-4 bg-card border border-border shadow-sm">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
                            <Link2 className="w-4 h-4 text-primary" />
                            {t('dashboard.pageSettings.slug', 'URL страницы')}
                        </Label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                                    lnkmx.my/
                                </span>
                                <Input
                                    value={slugInput}
                                    onChange={(e) => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError(null); }}
                                    className="pl-[85px] h-12 rounded-xl bg-muted border-border focus:border-primary/50 transition-all font-medium"
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
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em]">
                        {t('dashboard.pageSettings.customDomain', 'Свой домен')}
                    </h3>
                    {!isPremium && <Badge variant="secondary" className="text-xs uppercase border border-primary/20 text-primary bg-primary/10">PRO</Badge>}
                </div>
                <PremiumFeatureGate requiredTier="pro" outcomeKey="domain">
                    <Card className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                {t('dashboard.pageSettings.yourDomain', 'Ваш домен')}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={domainInput}
                                    onChange={(e) => { setDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')); setDomainError(null); }}
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
                                {t('dashboard.pageSettings.domainHint', 'Добавьте CNAME запись в DNS указывающую на lnkmx.my')}
                            </p>
                            {isPremium && domainInput && (
                                <div className="mt-3 bg-muted/50 rounded-lg p-3 border border-border">
                                    <p className="text-xs font-medium mb-2">{t('dashboard.pageSettings.dnsConfig', 'DNS запись:')}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsType', 'Тип')}</div>
                                        <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsName', 'Имя')}</div>
                                        <div className="text-muted-foreground">{t('dashboard.pageSettings.dnsValue', 'Значение')}</div>
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
                </PremiumFeatureGate>
            </div>

            {/* SEO + Search Visibility (merged) */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em] px-1">
                    {t('dashboard.pageSettings.searchVisibility', 'Поисковая видимость')}
                </h3>
                <Card className="p-4 space-y-4">
                    {/* SEO Score */}
                    <SEOScoreBadge score={qualityScore} />

                    {/* Google Preview */}
                    <GooglePreview title={seoTitleInput || pageTitle} slug={pageSlug} description={seoDescInput} />

                    {/* AI Bot readiness */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-info/12 border border-info/30 text-sm">
                        <Bot className="h-4 w-4 text-info" />
                        <span className="text-info text-xs">
                            {t('seo.aiBotReady', 'JSON-LD и Answer Block генерируются автоматически для AI-ботов')}
                        </span>
                        <Check className="h-3.5 w-3.5 text-success ml-auto" />
                    </div>

                    {/* SEO Tips */}
                    <SEOTips city={cityInput} profession={professionInput} seoTitle={seoTitleInput} seoDesc={seoDescInput} />

                    {/* Meta Title */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            {t('dashboard.pageSettings.seoTitle', 'Meta Title')}
                        </Label>
                        <Input
                            value={seoTitleInput}
                            onChange={(e) => setSeoTitleInput(e.target.value)}
                            onBlur={handleSaveSeo}
                            placeholder={t('dashboard.pageSettings.seoTitlePlaceholder', 'Заголовок для поисковиков')}
                            className="h-12 rounded-xl"
                            maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground text-right">{seoTitleInput.length}/60</p>
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-2">
                        <Label>{t('dashboard.pageSettings.seoDescription', 'Meta Description')}</Label>
                        <Textarea
                            value={seoDescInput}
                            onChange={(e) => setSeoDescInput(e.target.value)}
                            onBlur={handleSaveSeo}
                            placeholder={t('dashboard.pageSettings.seoDescPlaceholder', 'Краткое описание для поисковой выдачи')}
                            className="rounded-xl resize-none"
                            rows={3}
                            maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground text-right">{seoDescInput.length}/160</p>
                    </div>

                    {/* Indexing toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {t('dashboard.pageSettings.indexable', 'Индексация в поиске')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {t('dashboard.pageSettings.indexableHint', 'Показывать страницу в Google и других поисковиках')}
                            </p>
                        </div>
                        <Switch checked={isIndexable ?? true} onCheckedChange={handleToggleIndexable} />
                    </div>

                    {/* Entity Fields inline */}
                    <div className="border-t pt-4 space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.06em]">
                            {t('dashboard.pageSettings.entityFields', 'Данные для поиска')}
                        </p>
                        <div className="space-y-2">
                            <Label>{t('dashboard.pageSettings.profession', 'Профессия / специализация')}</Label>
                            <Input
                                value={professionInput}
                                onChange={(e) => setProfessionInput(e.target.value)}
                                onBlur={handleSaveEntityFields}
                                placeholder="Nail-мастер, фотограф, коуч..."
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dashboard.pageSettings.country', 'Страна')}</Label>
                            <Select
                                value={countryCodeInput || 'none'}
                                onValueChange={(value: string) => {
                                    const v = value === 'none' ? '' : value;
                                    setCountryCodeInput(v);
                                    if (onUpdateEntityFields) {
                                        onUpdateEntityFields({ country_code: v });
                                        toast.success(t('common.saved', 'Сохранено'));
                                    }
                                }}
                            >
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder={t('fields.selectCountry', 'Выберите страну')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('fields.notSpecified', 'Не указана')}</SelectItem>
                                    {COUNTRY_OPTIONS.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dashboard.pageSettings.city', 'Город')}</Label>
                            <Input
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                onBlur={handleSaveEntityFields}
                                placeholder="Алматы, Астана, Москва..."
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dashboard.pageSettings.entityType', 'Тип профиля')}</Label>
                            <Select
                                value={entityTypeInput}
                                onValueChange={(value: string) => {
                                    setEntityTypeInput(value);
                                    if (onUpdateEntityFields) {
                                        onUpdateEntityFields({ entity_type: value });
                                        toast.success(t('common.saved', 'Сохранено'));
                                    }
                                }}
                            >
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="person">{t('dashboard.pageSettings.personalProfile', 'Личный профиль')}</SelectItem>
                                    <SelectItem value="organization">{t('dashboard.pageSettings.organization', 'Организация')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dashboard.pageSettings.publicEmail', 'Публичный email (необязательно)')}</Label>
                            <Input
                                value={contactEmailInput}
                                onChange={(e) => setContactEmailInput(e.target.value)}
                                onBlur={handleSaveEntityFields}
                                placeholder="hello@example.com"
                                className="h-12 rounded-xl"
                                type="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dashboard.pageSettings.publicPhone', 'Публичный телефон (необязательно)')}</Label>
                            <Input
                                value={contactPhoneInput}
                                onChange={(e) => setContactPhoneInput(e.target.value)}
                                onBlur={handleSaveEntityFields}
                                placeholder="+7 777 123 4567"
                                className="h-12 rounded-xl"
                                type="tel"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp ({t('common.optional', 'необязательно')})</Label>
                            <Input
                                value={contactWhatsappInput}
                                onChange={(e) => setContactWhatsappInput(e.target.value)}
                                onBlur={handleSaveEntityFields}
                                placeholder="+7 777 123 4567"
                                className="h-12 rounded-xl"
                                type="tel"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Category / Niche */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em] px-1">
                    {t('dashboard.pageSettings.category', 'Категория')}
                </h3>
                <Card className="p-4">
                    <NicheSelector value={niche} onChange={handleNicheChange} />
                </Card>
            </div>

            {/* AI Builder */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em] px-1">
                    {t('dashboard.pageSettings.aiBuilder', 'AI Builder')}
                </h3>
                <Card className="p-4">
                    <button className="w-full flex items-center gap-4 text-left" onClick={onOpenAIBuilder}>
                        <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium">{t('dashboard.pageSettings.aiBuilderBtn', 'Заполнить страницу с AI')}</span>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.pageSettings.aiBuilderDesc', 'AI создаст контент на основе шаблона')}
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                </Card>
            </div>

            {/* Branding */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em] px-1">
                    {t('dashboard.pageSettings.branding', 'Брендинг')}
                </h3>
                <Card className="divide-y divide-border/50 overflow-hidden">
                    <button className="w-full flex items-center gap-4 text-left p-4 hover:bg-muted/50 transition-colors" onClick={onOpenTheme}>
                        <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{t('dashboard.pageSettings.theme', 'Тема и цвета')}</span>
                                {!isPremium && <Badge variant="secondary" className="text-xs">PRO</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{t('dashboard.pageSettings.themeDesc', 'Настройка цветов и шрифтов')}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button className="w-full flex items-center gap-4 text-left p-4 hover:bg-muted/50 transition-colors" onClick={onOpenTemplates}>
                        <div className="h-11 w-11 rounded-2xl bg-success/12 flex items-center justify-center">
                            <LayoutTemplate className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium">{t('dashboard.pageSettings.templates', 'Шаблоны')}</span>
                            <p className="text-sm text-muted-foreground">{t('dashboard.pageSettings.templatesDesc', 'Готовые дизайны страниц')}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button className="w-full flex items-center gap-4 text-left p-4 hover:bg-muted/50 transition-colors" onClick={onOpenMarketplace}>
                        <div className="h-11 w-11 rounded-2xl bg-primary/12 flex items-center justify-center">
                            <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium">{t('dashboard.pageSettings.marketplace', 'Маркетплейс')}</span>
                            <p className="text-sm text-muted-foreground">{t('dashboard.pageSettings.marketplaceDesc', 'Шаблоны от сообщества')}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                </Card>
            </div>

            {/* White-label (PRO) */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em]">White-label</h3>
                    {!isPremium && <Badge variant="secondary" className="text-xs uppercase border border-primary/20 text-primary bg-primary/10">PRO</Badge>}
                </div>
                <PremiumFeatureGate requiredTier="pro" outcomeKey="design">
                    <Card className="p-4 space-y-4 bg-card border border-border shadow-sm">
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
                            <p className="text-xs text-muted-foreground">{t('dashboard.pageSettings.faviconHint', 'PNG или ICO. Рекомендуемый размер 64x64.')}</p>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div className="space-y-1">
                                <Label className="flex items-center gap-2 text-base">
                                    <Crown className="w-4 h-4 text-warning" />
                                    {t('freemium.watermarkEnabled', 'Убери логотип LinkMAX')}
                                </Label>
                                <p className="text-sm text-muted-foreground leading-snug max-w-[250px]">
                                    {t('freemium.watermarkDesc', 'Сделай страницу 100% своей')}
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
                </PremiumFeatureGate>
            </div>

            {/* Pixels & analytics — PublicPage loads them via TrackingScripts */}
            {onUpdateIntegrations && (
                <TrackingSettings integrations={integrations} onSave={onUpdateIntegrations} />
            )}

            {/* Webhooks (PRO) */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em]">Webhooks</h3>
                    {!isPremium && <Badge variant="secondary" className="text-xs uppercase border border-primary/20 text-primary bg-primary/10">PRO</Badge>}
                </div>
                <PremiumFeatureGate requiredTier="pro" outcomeKey="generic">
                    <Card className="p-4 space-y-4 bg-card border border-border shadow-sm">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Webhook URL
                            </Label>
                            <Input
                                value={webhookUrlInput}
                                onChange={(e) => setWebhookUrlInput(e.target.value)}
                                onBlur={handleSaveWebhooks}
                                placeholder="https://your-server.com/webhook"
                                className="h-12 rounded-xl"
                                disabled={!isPremium}
                            />
                            <p className="text-xs text-muted-foreground">{t('dashboard.pageSettings.webhookHint', 'URL для POST запросов при новом лиде.')}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-success" />
                                Webhook Secret ({t('common.optional', 'необязательно')})
                            </Label>
                            <Input
                                value={webhookSecretInput}
                                onChange={(e) => setWebhookSecretInput(e.target.value)}
                                onBlur={handleSaveWebhooks}
                                placeholder="your-secret-key"
                                className="h-12 rounded-xl"
                                disabled={!isPremium}
                                type="password"
                            />
                            <p className="text-xs text-muted-foreground">{t('dashboard.pageSettings.webhookSecretHint', 'Секрет будет отправлен в заголовке X-LinkMAX-Secret.')}</p>
                        </div>
                    </Card>
                </PremiumFeatureGate>
            </div>
        </div>
    );
});

type TrackingField = 'fb_pixel' | 'tt_pixel' | 'ga4_id' | 'yandex_metrika';

const TRACKING_FIELDS: Array<{
    key: TrackingField;
    label: string;
    placeholder: string;
    hintKey: string;
    hint: string;
    normalize: (value: string) => string;
}> = [
    { key: 'fb_pixel', label: 'Meta Pixel ID', placeholder: '1234567890', hintKey: 'settings.integrations.fbHint', hint: 'Events Manager → Источники данных → Pixel ID', normalize: (v) => v.replace(/\D/g, '') },
    { key: 'tt_pixel', label: 'TikTok Pixel ID', placeholder: 'C1234567890', hintKey: 'settings.integrations.ttHint', hint: 'TikTok Ads → Assets → Events → Pixel Code', normalize: (v) => v.trim() },
    { key: 'ga4_id', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX', hintKey: 'settings.integrations.ga4Hint', hint: 'GA4 → Admin → Data Streams → Measurement ID', normalize: (v) => v.trim().toUpperCase() },
    { key: 'yandex_metrika', label: 'Яндекс Метрика', placeholder: '12345678', hintKey: 'settings.integrations.yandexHint', hint: 'Метрика → Настройки → Номер счётчика', normalize: (v) => v.replace(/\D/g, '') },
];

/**
 * Tracking IDs of the active page. These fields only existed in an unused
 * settings screen, so pixels could not be connected from the dashboard.
 */
function TrackingSettings({ integrations, onSave }: {
    integrations?: PageIntegrations;
    onSave: (integrations: PageIntegrations) => void;
}) {
    const { t } = useTranslation();
    const [values, setValues] = useState<Record<TrackingField, string>>(() => ({
        fb_pixel: integrations?.fb_pixel ?? '',
        tt_pixel: integrations?.tt_pixel ?? '',
        ga4_id: integrations?.ga4_id ?? '',
        yandex_metrika: integrations?.yandex_metrika ?? '',
    }));

    // Another page became active → show its IDs.
    useEffect(() => {
        setValues({
            fb_pixel: integrations?.fb_pixel ?? '',
            tt_pixel: integrations?.tt_pixel ?? '',
            ga4_id: integrations?.ga4_id ?? '',
            yandex_metrika: integrations?.yandex_metrika ?? '',
        });
    }, [integrations?.fb_pixel, integrations?.tt_pixel, integrations?.ga4_id, integrations?.yandex_metrika]);

    const commit = (key: TrackingField) => {
        const value = values[key];
        if ((integrations?.[key] ?? '') === value) return;
        const next: PageIntegrations = { ...integrations };
        if (value) next[key] = value;
        else delete next[key];
        onSave(next);
        toast.success(t('common.saved', 'Сохранено'));
    };

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.06em] px-1">
                {t('settings.integrations.title', 'Пиксели и аналитика')}
            </h3>
            <Card className="p-4 space-y-5">
                <p className="text-xs text-muted-foreground">
                    {t('settings.integrations.description', 'Подключите пиксели для отслеживания конверсий. События PageView, Lead, Purchase и клики по блокам отправляются автоматически.')}
                </p>
                {TRACKING_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <Label htmlFor={`tracking-${field.key}`} className="flex items-center gap-2">
                            <span>{field.label}</span>
                            {values[field.key] && <span className="h-2 w-2 rounded-full bg-success" aria-hidden />}
                        </Label>
                        <Input
                            id={`tracking-${field.key}`}
                            value={values[field.key]}
                            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: field.normalize(e.target.value) }))}
                            onBlur={() => commit(field.key)}
                            placeholder={field.placeholder}
                            className="h-12 rounded-xl font-mono text-sm"
                            inputMode={field.key === 'fb_pixel' || field.key === 'yandex_metrika' ? 'numeric' : 'text'}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <p className="text-[11px] text-muted-foreground">{t(field.hintKey, field.hint)}</p>
                    </div>
                ))}
            </Card>
        </div>
    );
}
