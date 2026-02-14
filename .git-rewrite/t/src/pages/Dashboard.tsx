/**
 * Dashboard v1.2 - Mobile-first App Experience
 * Main hub with tab-based navigation: Projects, Editor, CRM, Analytics, Gallery, Settings
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDashboard } from '@/hooks/useDashboard';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { useEditorHistory } from '@/hooks/useEditorHistory';
import { useTranslation } from 'react-i18next';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';

// Layout & Navigation
import { AppTabBar } from '@/components/layout/AppTabBar';

// Tab Content Components
import { ProjectsTab } from '@/components/dashboard/ProjectsTab';
import { EditorTab } from '@/components/dashboard/EditorTab';
import { CRMTab } from '@/components/dashboard/CRMTab';
import { AnalyticsTab } from '@/components/dashboard/AnalyticsTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';

// Modals & Sheets
import { BlockEditor } from '@/components/BlockEditor';
import { TemplateGallery } from '@/components/editor/TemplateGallery';
import { TemplateMarketplace } from '@/components/editor/TemplateMarketplace';
import { SaveTemplateDialog } from '@/components/editor/SaveTemplateDialog';
import { AIGenerator } from '@/components/AIGenerator';
import { QuickStartFlow } from '@/components/onboarding/QuickStartFlow';
import { NicheOnboarding } from '@/components/onboarding/NicheOnboarding';
import { AchievementNotification } from '@/components/achievements/AchievementNotification';
import { InstallPromptDialog } from '@/components/InstallPromptDialog';
import { ShareAfterPublishDialog } from '@/components/referral/ShareAfterPublishDialog';
import { TokensPanel } from '@/components/tokens/TokensPanel';
import { FriendsPanel } from '@/components/friends/FriendsPanel';
import { MyTemplatesPanel } from '@/components/templates/MyTemplatesPanel';
import { AchievementsPanel } from '@/components/achievements/AchievementsPanel';
import { LocalStorageMigration } from '@/components/LocalStorageMigration';

// Loading & Background
import { LoadingState, BackgroundEffects } from '@/components/dashboard';
import { storage } from '@/lib/storage';

import type { Block } from '@/types/page';

type TabId = 'projects' | 'editor' | 'crm' | 'analytics' | 'gallery' | 'settings';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const canonical = 'https://lnkmx.my/dashboard';
  const seoTitle = t('dashboard.seo.title', 'lnkmx Dashboard');
  const seoDescription = t('dashboard.seo.description', 'Manage your lnkmx pages, leads, and analytics.');
  const dashboard = useDashboard();
  const { canUseCustomPageBackground } = useFreemiumLimits();

  // Editor history for undo/redo
  const editorHistory = useEditorHistory(
    dashboard.pageData?.blocks || [],
    {
      onStateChange: (blocks) => {
        dashboard.updatePageDataPartial({ blocks });
      },
    }
  );

  // Current tab from URL params
  const currentTab = (searchParams.get('tab') as TabId) || 'editor';

  // UI State
  const [migrationKey, setMigrationKey] = useState(0);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showMyTemplates, setShowMyTemplates] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Check if new user needs quick start
  useEffect(() => {
    const completed = storage.get('onboarding_completed');
    if (!completed && dashboard.pageData?.blocks.length === 1) {
      // Only profile block exists - show quick start
      setShowQuickStart(true);
    }
  }, [dashboard.pageData?.blocks.length]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'gallery') {
      navigate('/gallery');
    } else {
      setSearchParams({ tab: tabId });
    }
  }, [navigate, setSearchParams]);

  // Listen for global events
  useEffect(() => {
    const handleOpenFriends = () => setShowFriends(true);
    window.addEventListener('openFriends', handleOpenFriends);
    return () => window.removeEventListener('openFriends', handleOpenFriends);
  }, []);

  // Loading state
  if (dashboard.loading) return <LoadingState />;
  if (!dashboard.pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground mb-4">Не удалось загрузить данные страницы</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <StaticSEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        currentLanguage={i18n.language}
        indexable={false}
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'kk', href: `${canonical}?lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />
      <div className="min-h-screen bg-background relative">
        <BackgroundEffects />

        {/* Migration Notice */}
        {dashboard.user && (
          <LocalStorageMigration
            key={migrationKey}
            userId={dashboard.user.id}
            onMigrated={() => {
              setMigrationKey((prev) => prev + 1);
              window.location.reload();
            }}
          />
        )}

        {/* Main Content Area - Full height with bottom padding for tab bar */}
        <main className="pb-24 min-h-screen">
          {/* Projects Tab */}
          {currentTab === 'projects' && (
            <ProjectsTab
              pageData={dashboard.pageData}
              user={dashboard.user}
              isPremium={dashboard.isPremium}
              onOpenEditor={() => handleTabChange('editor')}
              onOpenSettings={() => handleTabChange('settings')}
              onPreview={dashboard.sharingState.handlePreview}
              onShare={dashboard.sharingState.handleShare}
              onOpenTemplates={() => setTemplateGalleryOpen(true)}
              onOpenMarketplace={() => setShowMarketplace(true)}
            />
          )}

          {/* Editor Tab */}
          {currentTab === 'editor' && (
            <EditorTab
              blocks={dashboard.pageData.blocks}
              isPremium={dashboard.isPremium}
              currentTier={dashboard.currentTier}
              premiumTier={dashboard.currentTier}
              gridConfig={dashboard.pageData.gridConfig}
              saving={dashboard.saving}
              saveStatus={dashboard.saveStatus}
              editorHistory={editorHistory}
              pageNiche={dashboard.pageData?.niche}
              onInsertBlock={dashboard.blockEditor.handleInsertBlock}
              onEditBlock={dashboard.blockEditor.handleEditBlock}
              onDeleteBlock={dashboard.blockEditor.handleDeleteBlock}
              onReorderBlocks={dashboard.reorderBlocks}
              onUpdateBlock={dashboard.updateBlock}
              onSave={dashboard.save}
              onPreview={dashboard.sharingState.handlePreview}
              onShare={dashboard.sharingState.handleShare}
              onOpenAI={dashboard.aiState.openAIBuilder}
              onOpenTemplates={() => setTemplateGalleryOpen(true)}
            />
          )}

          {/* CRM Tab */}
          {currentTab === 'crm' && (
            <CRMTab isPremium={dashboard.isPremium} />
          )}

          {/* Analytics Tab */}
          {currentTab === 'analytics' && (
            <AnalyticsTab
              pageId={dashboard.pageData.id}
              blocks={dashboard.pageData.blocks}
              isPremium={dashboard.isPremium}
              editorHistory={editorHistory}
              onApplyInsight={(action) => {
                // Navigate to editor and apply the insight
                handleTabChange('editor');
                // The action will be executed by EditorTab
              }}
            />
          )}

          {/* Settings Tab */}
          {currentTab === 'settings' && (
            <SettingsTab
              usernameInput={dashboard.usernameState.usernameInput}
              onUsernameChange={dashboard.usernameState.setUsernameInput}
              onUpdateUsername={dashboard.usernameState.handleUpdateUsername}
              usernameSaving={dashboard.usernameState.saving}
              profileBlock={dashboard.profileBlock}
              onUpdateProfile={dashboard.handleUpdateProfile}
              isPremium={dashboard.isPremium}
              premiumTier={dashboard.premiumTier}
              premiumLoading={dashboard.premiumLoading}
              chatbotContext={dashboard.chatbotContext}
              onChatbotContextChange={dashboard.setChatbotContext}
              onSave={dashboard.save}
              emailNotificationsEnabled={dashboard.userProfile.profile?.email_notifications_enabled ?? true}
              onEmailNotificationsChange={dashboard.userProfile.updateEmailNotifications}
              telegramEnabled={dashboard.userProfile.profile?.telegram_notifications_enabled ?? false}
              telegramChatId={dashboard.userProfile.profile?.telegram_chat_id ?? ''}
              onTelegramChange={dashboard.userProfile.updateTelegramNotifications}
              userId={dashboard.user?.id}
              pageId={dashboard.pageData?.id}
              niche={dashboard.pageData?.niche as any}
              onNicheChange={dashboard.updateNiche}
              pageBackground={dashboard.pageData?.theme?.customBackground}
              onPageBackgroundChange={(background) => {
                dashboard.updatePageDataPartial({
                  theme: {
                    ...dashboard.pageData.theme,
                    customBackground: background
                  }
                });
              }}
              canUseCustomPageBackground={canUseCustomPageBackground()}
              onSignOut={dashboard.handleSignOut}
              onOpenFriends={() => setShowFriends(true)}
              onOpenSaveTemplate={() => setShowSaveTemplate(true)}
              onOpenMyTemplates={() => setShowMyTemplates(true)}
              onOpenTokens={() => setShowTokens(true)}
              onOpenAchievements={() => setShowAchievements(true)}
            />
          )}
        </main>

        {/* Mobile Tab Bar */}
        <AppTabBar
          activeTab={currentTab}
          onTabChange={handleTabChange}
        />

        {/* Block Editor Modal */}
        {dashboard.blockEditor.editingBlock && (
          <BlockEditor
            block={dashboard.blockEditor.editingBlock}
            isOpen={dashboard.blockEditor.editorOpen}
            onClose={dashboard.blockEditor.closeEditor}
            onSave={dashboard.blockEditor.handleSaveBlock}
          />
        )}

        {/* Onboarding Wizard - Disabled per v1.2 */}

        {/* Template Gallery */}
        <TemplateGallery
          open={templateGalleryOpen}
          onClose={() => setTemplateGalleryOpen(false)}
          onSelect={dashboard.handleApplyTemplate}
        />

        {/* Template Marketplace */}
        <TemplateMarketplace
          open={showMarketplace}
          onClose={() => setShowMarketplace(false)}
          onApplyTemplate={(blocks) => {
            dashboard.handleApplyTemplate(blocks);
            setShowMarketplace(false);
          }}
        />

        {/* AI Generator */}
        {dashboard.aiState.aiGeneratorOpen && (
          <AIGenerator
            type={dashboard.aiState.aiGeneratorType}
            isOpen={dashboard.aiState.aiGeneratorOpen}
            onClose={dashboard.aiState.closeAIGenerator}
            onResult={dashboard.aiState.handleAIResult}
          />
        )}

        {/* Achievement Notification */}
        {dashboard.achievements.newAchievement && (
          <AchievementNotification
            achievement={dashboard.achievements.newAchievement}
            onDismiss={dashboard.achievements.dismissAchievementNotification}
          />
        )}

        {/* Quick Start Flow for new users */}
        <QuickStartFlow
          open={showQuickStart}
          onClose={() => setShowQuickStart(false)}
          onComplete={(data) => {
            dashboard.onboardingState.handleNicheOnboardingComplete(data.profile, data.blocks, data.niche);
            setShowQuickStart(false);
          }}
        />

        <NicheOnboarding
          isOpen={dashboard.onboardingState.showNicheOnboarding}
          onClose={dashboard.onboardingState.handleNicheOnboardingClose}
          onComplete={dashboard.onboardingState.handleNicheOnboardingComplete}
        />

        {/* Panels & Dialogs */}
        {showAchievements && <AchievementsPanel onClose={() => setShowAchievements(false)} />}
        {showFriends && <FriendsPanel onClose={() => setShowFriends(false)} />}

        <SaveTemplateDialog
          open={showSaveTemplate}
          onClose={() => setShowSaveTemplate(false)}
          blocks={dashboard.pageData.blocks}
          previewContainerId="preview-container"
        />

        <MyTemplatesPanel
          open={showMyTemplates}
          onOpenChange={setShowMyTemplates}
          onApplyTemplate={dashboard.handleApplyTemplate}
          currentBlocks={dashboard.pageData.blocks}
        />

        <TokensPanel open={showTokens} onOpenChange={setShowTokens} />

        <InstallPromptDialog
          open={dashboard.sharingState.showInstallPrompt}
          onClose={dashboard.sharingState.closeInstallPrompt}
          pageUrl={dashboard.sharingState.publishedUrl}
        />

        <ShareAfterPublishDialog
          open={dashboard.sharingState.showShareDialog}
          onOpenChange={dashboard.sharingState.closeShareDialog}
          userId={dashboard.user?.id}
          publishedUrl={dashboard.sharingState.publishedUrl}
        />
      </div>
    </>
  );
}
