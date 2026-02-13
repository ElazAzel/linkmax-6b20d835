/**
 * SettingsScreen - Split settings: Page Settings + Account Settings tabs
 * Clearly separates page-scoped and user-scoped settings
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  FileText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '../layout/DashboardHeader';
import { PageSettingsTab } from './settings/PageSettingsTab';
import { AccountSettingsTab } from './settings/AccountSettingsTab';
import { getI18nText } from '@/lib/i18n-helpers';
import type { ProfileBlock, PageIntegrations } from '@/types/page';
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
  onUpdateIntegrations?: (integrations: PageIntegrations) => void;
  integrations?: PageIntegrations;
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

export const SettingsScreen = memo(function SettingsScreen(props: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'page' | 'account'>('page');

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
            <PageSettingsTab
              pageTitle={props.pageTitle}
              pageSlug={props.pageSlug}
              isPaid={props.isPaid}
              isPrimaryPaid={props.isPrimaryPaid}
              isPremium={props.isPremium}
              seoTitle={props.seoTitle}
              seoDescription={props.seoDescription}
              isIndexable={props.isIndexable}
              niche={props.niche}
              avatarUrl={avatarUrl}
              displayName={displayName}
              onUpdateSlug={props.onUpdateSlug}
              onUpdateSeo={props.onUpdateSeo}
              onToggleIndexable={props.onToggleIndexable}
              onNicheChange={props.onNicheChange}
              onUpgradePage={props.onUpgradePage}
              onOpenTheme={props.onOpenTheme}
              onOpenTemplates={props.onOpenTemplates}
              onOpenMarketplace={props.onOpenMarketplace}
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
