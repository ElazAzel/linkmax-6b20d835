/**
 * SettingsScreen - Split settings: Page Settings + Account Settings tabs
 * Clearly separates page-scoped and user-scoped settings
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  FileText,
  ChevronRight,
  Crown,
  Check,
  Coins,
  Trophy,
  Users,
  LayoutTemplate,
  Save,
  Link2,
  Globe,
  Palette,
  Search,
  Eye,
  AlertTriangle,
  Sparkles,
  Bell,
  Shield,
  LogOut,
  Mail,
  MessageCircle,
  CreditCard,
  Lock,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '../layout/DashboardHeader';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NicheSelector } from '@/components/settings/NicheSelector';
import { TelegramVerification } from '@/components/auth/TelegramVerification';
import { VerificationPanel } from '@/components/settings/VerificationPanel';
import { cn } from '@/lib/utils';
import { getI18nText } from '@/lib/i18n-helpers';
import type { ProfileBlock } from '@/types/page';
import type { Niche } from '@/lib/niches';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

interface SettingsScreenProps {
  // Username (user-scoped)
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  onUpdateUsername: () => void;
  usernameSaving: boolean;
  
  // Profile block (page-scoped display)
  profileBlock?: ProfileBlock;
  onUpdateProfile: (updates: Partial<ProfileBlock>) => void;
  
  // Premium status
  isPremium: boolean;
  premiumTier?: PremiumTier;
  
  // Notifications (user-scoped)
  emailNotificationsEnabled: boolean;
  onEmailNotificationsChange: (enabled: boolean) => void;
  telegramEnabled: boolean;
  telegramChatId: string;
  onTelegramChange: (enabled: boolean, chatId?: string) => void;
  
  // Page settings (page-scoped)
  niche?: Niche;
  onNicheChange: (niche: Niche) => void;
  
  // Page info (for page settings)
  pageTitle?: string;
  pageSlug?: string;
  isPaid?: boolean;
  isPrimaryPaid?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isIndexable?: boolean;
  onUpdateSlug?: (slug: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateSeo?: (seo: { title?: string; description?: string }) => void;
  onToggleIndexable?: (indexable: boolean) => void;
  onUpgradePage?: () => void;
  
  // Actions
  onSignOut: () => void;
  onOpenFriends: () => void;
  onOpenSaveTemplate: () => void;
  onOpenMyTemplates: () => void;
  onOpenTokens: () => void;
  onOpenAchievements: () => void;
  onOpenTheme?: () => void;
  onOpenMarketplace?: () => void;
  onOpenTemplates?: () => void;
}

interface SettingsItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  badge?: string;
}

function SettingsItem({
  icon: Icon,
  iconBg = 'bg-muted',
  iconColor = 'text-foreground',
  label,
  description,
  onClick,
  rightElement,
  badge,
}: SettingsItemProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      className={cn(
        "w-full flex items-center gap-4 p-4 text-left",
        onClick && "hover:bg-muted/50 active:bg-muted transition-colors"
      )}
      onClick={onClick}
    >
      <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {badge && <Badge className="text-xs">{badge}</Badge>}
        </div>
        {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />)}
    </Wrapper>
  );
}

export const SettingsScreen = memo(function SettingsScreen(props: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'page' | 'account'>('page');
  const [showVerification, setShowVerification] = useState(false);
  const [showTelegramVerification, setShowTelegramVerification] = useState(false);

  // Page settings state
  const [slugInput, setSlugInput] = useState(props.pageSlug || '');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [seoTitleInput, setSeoTitleInput] = useState(props.seoTitle || '');
  const [seoDescInput, setSeoDescInput] = useState(props.seoDescription || '');

  const avatarUrl = props.profileBlock?.avatar;
  const rawName = props.profileBlock?.name;
  const name = rawName
    ? getI18nText(rawName, i18n.language as 'ru' | 'en' | 'kk') || t('dashboard.settings.myPage', 'Моя страница')
    : t('dashboard.settings.myPage', 'Моя страница');
  const displayName = typeof name === 'string' ? name : t('dashboard.settings.myPage', 'Моя страница');

  const handleSaveSlug = async () => {
    if (!props.onUpdateSlug || slugInput === props.pageSlug) return;

    const slugRegex = /^[a-z0-9-]{3,30}$/;
    if (!slugRegex.test(slugInput)) {
      setSlugError(t('dashboard.pageSettings.slugInvalid', 'Only lowercase letters, numbers, and hyphens. 3-30 characters.'));
      return;
    }

    setSlugSaving(true);
    setSlugError(null);

    const result = await props.onUpdateSlug(slugInput);
    
    if (!result.success) {
      setSlugError(t(`dashboard.pageSettings.errors.${result.error}`, 'Failed to update slug'));
    }

    setSlugSaving(false);
  };

  const handleSaveSeo = () => {
    if (props.onUpdateSeo) {
      props.onUpdateSeo({
        title: seoTitleInput || undefined,
        description: seoDescInput || undefined,
      });
    }
  };

  const getPageTypeBadge = () => {
    if (props.isPrimaryPaid) {
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <Crown className="w-3 h-3 mr-1" />
          {t('dashboard.pageSettings.primaryPaid', 'Primary Paid')}
        </Badge>
      );
    }
    if (props.isPaid) {
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
    <div className="min-h-screen safe-area-top">
      <DashboardHeader title={t('dashboard.settings.title', 'Настройки')} />

      <div className="px-5 py-4">
        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'page' | 'account')} className="w-full">
          <TabsList className="w-full h-12 p-1 bg-muted/50 rounded-2xl mb-6">
            <TabsTrigger 
              value="page" 
              className="flex-1 h-10 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('dashboard.settingsTabs.page', 'Страница')}
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="flex-1 h-10 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" />
              {t('dashboard.settingsTabs.account', 'Аккаунт')}
            </TabsTrigger>
          </TabsList>

          {/* Page Settings Tab */}
          <TabsContent value="page" className="mt-0 space-y-6">
            {/* Current Page Info */}
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-xl">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                      {displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold">{props.pageTitle || displayName}</h2>
                    <p className="text-sm text-muted-foreground">lnkmx.my/{props.pageSlug}</p>
                  </div>
                </div>
                {getPageTypeBadge()}
              </div>

              {/* Upgrade to Paid */}
              {!props.isPaid && props.isPremium && props.onUpgradePage && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                  onClick={props.onUpgradePage}
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
                      disabled={slugSaving || slugInput === props.pageSlug || !props.onUpdateSlug}
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
                    checked={props.isIndexable ?? true}
                    onCheckedChange={(checked) => props.onToggleIndexable?.(checked)}
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
                <NicheSelector value={props.niche} onChange={props.onNicheChange} />
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
                  onClick={props.onOpenTheme}
                >
                  <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('dashboard.pageSettings.theme', 'Theme & Colors')}</span>
                      {!props.isPremium && (
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
                  onClick={props.onOpenTemplates}
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
                  onClick={props.onOpenMarketplace}
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
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="mt-0 space-y-6">
            {/* Profile Card */}
            <Card className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <Avatar className="h-16 w-16 rounded-2xl border-2 border-border">
                  <AvatarImage src={avatarUrl || ''} alt={displayName} />
                  <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold truncate">{displayName}</h2>
                    {props.isPremium && (
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                        <Crown className="h-3 w-3 mr-1" />
                        PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{props.usernameInput}</p>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  {t('dashboard.accountSettings.username', 'Username')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={props.usernameInput}
                    onChange={(e) => props.onUsernameChange(e.target.value)}
                    placeholder="username"
                    className="h-12 rounded-xl"
                  />
                  <Button
                    onClick={props.onUpdateUsername}
                    disabled={props.usernameSaving}
                    className="h-12 px-5 rounded-xl"
                  >
                    {props.usernameSaving ? '...' : <Check className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={props.onOpenTokens}
                className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 text-left transition-all active:scale-[0.98]"
              >
                <Coins className="h-6 w-6 text-primary mb-2" />
                <div className="font-bold">{t('dashboard.accountSettings.tokens', 'Tokens')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard.accountSettings.tokensDesc', 'Balance & history')}</div>
              </button>

              <button
                onClick={props.onOpenAchievements}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left transition-all active:scale-[0.98]"
              >
                <Trophy className="h-6 w-6 text-amber-500 mb-2" />
                <div className="font-bold">{t('dashboard.accountSettings.achievements', 'Achievements')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard.accountSettings.achievementsDesc', 'Your progress')}</div>
              </button>
            </div>

            {/* Account Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('dashboard.accountSettings.account', 'Account')}
              </h3>
              <Card className="divide-y divide-border/50 overflow-hidden">
                <SettingsItem
                  icon={Users}
                  iconBg="bg-pink-500/15"
                  iconColor="text-pink-500"
                  label={t('dashboard.accountSettings.friends', 'Friends')}
                  onClick={props.onOpenFriends}
                />
                <SettingsItem
                  icon={LayoutTemplate}
                  iconBg="bg-emerald-500/15"
                  iconColor="text-emerald-500"
                  label={t('dashboard.accountSettings.myTemplates', 'My Templates')}
                  onClick={props.onOpenMyTemplates}
                />
                <SettingsItem
                  icon={Save}
                  iconBg="bg-blue-500/15"
                  iconColor="text-blue-500"
                  label={t('dashboard.accountSettings.saveTemplate', 'Save as Template')}
                  onClick={props.onOpenSaveTemplate}
                />
                <SettingsItem
                  icon={Shield}
                  iconBg="bg-violet-500/15"
                  iconColor="text-violet-500"
                  label={t('dashboard.accountSettings.verification', 'Verification')}
                  onClick={() => setShowVerification(true)}
                />
              </Card>
            </div>

            {/* Notifications */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('dashboard.accountSettings.notifications', 'Notifications')}
              </h3>
              <Card className="divide-y divide-border/50 overflow-hidden">
                <SettingsItem
                  icon={Mail}
                  iconBg="bg-blue-500/15"
                  iconColor="text-blue-500"
                  label={t('dashboard.accountSettings.emailNotifications', 'Email Notifications')}
                  description={t('dashboard.accountSettings.emailNotificationsDesc', 'About new leads')}
                  rightElement={
                    <Switch
                      checked={props.emailNotificationsEnabled}
                      onCheckedChange={props.onEmailNotificationsChange}
                    />
                  }
                />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{t('dashboard.accountSettings.telegram', 'Telegram')}</div>
                      <p className="text-sm text-muted-foreground">
                        {props.telegramEnabled
                          ? t('dashboard.accountSettings.connected', 'Connected')
                          : t('dashboard.accountSettings.notConnected', 'Not connected')}
                      </p>
                    </div>
                    <Switch checked={props.telegramEnabled} onCheckedChange={(checked) => props.onTelegramChange(checked)} />
                  </div>
                  {props.telegramEnabled && showTelegramVerification && (
                    <TelegramVerification
                      onVerified={(chatId) => {
                        props.onTelegramChange(true, chatId);
                        setShowTelegramVerification(false);
                      }}
                      onBack={() => setShowTelegramVerification(false)}
                    />
                  )}
                  {props.telegramEnabled && !showTelegramVerification && !props.telegramChatId && (
                    <Button variant="outline" className="w-full mt-2" onClick={() => setShowTelegramVerification(true)}>
                      {t('dashboard.accountSettings.connectTelegram', 'Connect Telegram')}
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Appearance */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('dashboard.accountSettings.appearance', 'Appearance')}
              </h3>
              <Card className="divide-y divide-border/50 overflow-hidden">
                <SettingsItem
                  icon={Globe}
                  iconBg="bg-emerald-500/15"
                  iconColor="text-emerald-500"
                  label={t('dashboard.accountSettings.language', 'Language')}
                  rightElement={<LanguageSwitcher />}
                />
              </Card>
            </div>

            {/* Plan & Billing */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('dashboard.accountSettings.planBilling', 'Plan & Billing')}
              </h3>
              <Card className="divide-y divide-border/50 overflow-hidden">
                <SettingsItem
                  icon={Crown}
                  iconBg={props.isPremium ? "bg-amber-500/15" : "bg-muted"}
                  iconColor={props.isPremium ? "text-amber-500" : "text-muted-foreground"}
                  label={props.isPremium ? t('dashboard.accountSettings.proPlan', 'Pro Plan') : t('dashboard.accountSettings.freePlan', 'Free Plan')}
                  description={props.isPremium ? t('dashboard.accountSettings.manageSubscription', 'Manage subscription') : t('dashboard.accountSettings.upgradeForMore', 'Upgrade for more features')}
                  onClick={() => navigate('/pricing')}
                />
                {props.isPremium && (
                  <SettingsItem
                    icon={CreditCard}
                    iconBg="bg-slate-500/15"
                    iconColor="text-slate-500"
                    label={t('dashboard.accountSettings.billingHistory', 'Billing History')}
                    onClick={() => {/* TODO: Open billing history */}}
                  />
                )}
              </Card>
            </div>

            {/* Security */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('dashboard.accountSettings.security', 'Security')}
              </h3>
              <Card className="divide-y divide-border/50 overflow-hidden">
                <SettingsItem
                  icon={Lock}
                  iconBg="bg-red-500/15"
                  iconColor="text-red-500"
                  label={t('dashboard.accountSettings.changePassword', 'Change Password')}
                  onClick={() => {/* TODO: Open password change */}}
                />
              </Card>
            </div>

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={props.onSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              {t('dashboard.accountSettings.signOut', 'Sign Out')}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Verification Panel */}
      {showVerification && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('dashboard.accountSettings.verification', 'Verification')}</h2>
              <Button variant="ghost" onClick={() => setShowVerification(false)}>
                ✕
              </Button>
            </div>
            <VerificationPanel />
          </div>
        </div>
      )}
    </div>
  );
});
