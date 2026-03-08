/**
 * SettingsScreen - Split settings: Page Settings + Account Settings tabs
 * Clearly separates page-scoped and user-scoped settings
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import User from 'lucide-react/dist/esm/icons/user';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '../layout/DashboardHeader';
import { PageSettingsTab } from './settings/PageSettingsTab';
import { AccountSettingsTab } from './settings/AccountSettingsTab';
import { cn } from '@/lib/utils/utils';
import { getI18nText } from '@/lib/i18n-helpers';
import type { ProfileBlock, PageIntegrations } from '@/types/page';
import type { Niche } from '@/lib/niches';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';

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
  customDomain?: string;
  isPaid?: boolean;
  isPrimaryPaid?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isIndexable?: boolean;
  onUpdateSlug?: (slug: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateCustomDomain?: (domain: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateSeo?: (seo: { title?: string; description?: string }) => void;
  onUpdateIntegrations?: (integrations: PageIntegrations) => void;
  integrations?: PageIntegrations;
  onToggleIndexable?: (index: boolean) => void;
  faviconUrl?: string;
  hideBranding?: boolean;
  onUpdateBranding?: (branding: { faviconUrl?: string; hideBranding?: boolean }) => void;
  onUpgradePage?: () => void;

  // Entity fields
  city?: string;
  profession?: string;
  entityType?: 'person' | 'organization';
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  onUpdateEntityFields?: (fields: { city?: string; profession?: string; entity_type?: string; contact_email?: string; contact_phone?: string; contact_whatsapp?: string }) => void;

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
  onOpenAIBuilder?: () => void;
}

export const SettingsScreen = memo(function SettingsScreen(props: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'page' | 'account'>('page');

  const {
    pageTitle,
    pageSlug,
    customDomain,
    isPaid,
    isPrimaryPaid,
    seoTitle,
    seoDescription,
    isIndexable,
    niche,
    onNicheChange,
    faviconUrl,
    hideBranding,
    onUpdateBranding,
    onUpgradePage,
    onUpdateSlug,
    onUpdateCustomDomain,
    onUpdateSeo,
    onToggleIndexable,
    onOpenTheme,
    onOpenTemplates,
    onOpenMarketplace,
    onOpenAIBuilder,
  } = props;

  const avatarUrl = props.profileBlock?.avatar;
  const rawName = props.profileBlock?.name;
  const name = rawName
    ? getI18nText(rawName, i18n.language as 'ru' | 'en' | 'kk') || t('dashboard.settings.myPage', 'Моя страница')
    : t('dashboard.settings.myPage', 'Моя страница');
  const displayName = typeof name === 'string' ? name : t('dashboard.settings.myPage', 'Моя страница');

  return (
    <div className="min-h-screen safe-area-top">
      <DashboardHeader title={t('dashboard.settings.title', 'Настройки')} />

      <div className="px-5 py-4">
        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'page' | 'account')} className="w-full">
          <TabsList className="w-full h-14 p-1.5 glass-nav rounded-[24px] mb-8 border-white/10 shadow-glass">
            <TabsTrigger
              value="page"
              className={cn(
                "flex-1 h-11 rounded-[18px] transition-all duration-300 font-bold",
                "data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]",
                "data-[state=inactive]:text-muted-foreground/60 data-[state=inactive]:hover:text-muted-foreground"
              )}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('dashboard.settingsTabs.page', 'Страница')}
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className={cn(
                "flex-1 h-11 rounded-[18px] transition-all duration-300 font-bold",
                "data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]",
                "data-[state=inactive]:text-muted-foreground/60 data-[state=inactive]:hover:text-muted-foreground"
              )}
            >
              <User className="w-4 h-4 mr-2" />
              {t('dashboard.settingsTabs.account', 'Аккаунт')}
            </TabsTrigger>
          </TabsList>

          {/* Page Settings Tab */}
          <TabsContent value="page" className="mt-0 space-y-6">
            <PageSettingsTab
              pageTitle={pageTitle}
              pageSlug={pageSlug}
              customDomain={customDomain}
              isPaid={isPaid}
              isPrimaryPaid={isPrimaryPaid}
              isPremium={props.isPremium}
              seoTitle={seoTitle}
              seoDescription={seoDescription}
              faviconUrl={faviconUrl}
              hideBranding={hideBranding}
              onUpdateBranding={onUpdateBranding}
              isIndexable={isIndexable}
              niche={niche}
              avatarUrl={avatarUrl}
              displayName={displayName}
              onUpdateSlug={onUpdateSlug}
              onUpdateCustomDomain={onUpdateCustomDomain}
              onUpdateSeo={onUpdateSeo}
              onToggleIndexable={onToggleIndexable}
              onNicheChange={onNicheChange}
              onUpgradePage={onUpgradePage}
              onOpenTheme={onOpenTheme}
              onOpenTemplates={onOpenTemplates}
              onOpenMarketplace={onOpenMarketplace}
              onOpenAIBuilder={onOpenAIBuilder}
            />
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="mt-0 space-y-6">
            <AccountSettingsTab
              usernameInput={props.usernameInput}
              onUsernameChange={props.onUsernameChange}
              onUpdateUsername={props.onUpdateUsername}
              usernameSaving={props.usernameSaving}
              avatarUrl={avatarUrl}
              displayName={displayName}
              isPremium={props.isPremium}
              premiumTier={props.premiumTier}
              emailNotificationsEnabled={props.emailNotificationsEnabled}
              onEmailNotificationsChange={props.onEmailNotificationsChange}
              telegramEnabled={props.telegramEnabled}
              telegramChatId={props.telegramChatId}
              onTelegramChange={props.onTelegramChange}
              onSignOut={props.onSignOut}
              onOpenFriends={props.onOpenFriends}
              onOpenSaveTemplate={props.onOpenSaveTemplate}
              onOpenMyTemplates={props.onOpenMyTemplates}
              onOpenTokens={props.onOpenTokens}
              onOpenAchievements={props.onOpenAchievements}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
