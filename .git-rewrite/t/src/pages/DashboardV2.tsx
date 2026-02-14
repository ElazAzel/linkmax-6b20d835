/**
 * DashboardV2 - New mobile-first dashboard with multi-page support
 * Entry point for the redesigned dashboard experience
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// State hooks
import { useDashboard } from '@/hooks/useDashboard';
import { useMultiPage } from '@/hooks/useMultiPage';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { useEditorHistory } from '@/hooks/useEditorHistory';

// SEO
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';

// Dashboard v2 components
import {
  DashboardLayout,
  PageSwitcher,
} from '@/components/dashboard-v2/layout';
import {
  HomeScreen,
  PagesScreen,
  EditorScreen,
  ActivityScreen,
  InsightsScreen,
  MonetizeScreen,
  SettingsScreen,
} from '@/components/dashboard-v2/screens';
import { CreatePageDialog } from '@/components/dashboard-v2/dialogs';

// Modals & Panels (reused from v1)
import { UnifiedBlockEditor } from '@/components/block-editors/UnifiedBlockEditor';
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
import { LoadingState, BackgroundEffects } from '@/components/dashboard';

import type { Niche } from '@/lib/niches';

type TabId = 'home' | 'editor' | 'pages' | 'activity' | 'insights' | 'monetize' | 'settings';

export default function DashboardV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  
  // Core state
  const dashboard = useDashboard();
  const multiPage = useMultiPage();
  const { canUseCustomPageBackground } = useFreemiumLimits();
  
  // Editor history
  const editorHistory = useEditorHistory(
    dashboard.pageData?.blocks || [],
    {
      onStateChange: (blocks) => {
        dashboard.updatePageDataPartial({ blocks });
      },
    }
  );

  // Current tab from URL - support both query params and pathname
  const currentTab = useMemo((): TabId => {
    // First check query params
    const tabParam = searchParams.get('tab') as TabId;
    if (tabParam && ['home', 'editor', 'pages', 'activity', 'insights', 'monetize', 'settings'].includes(tabParam)) {
      return tabParam;
    }
    // Fall back to pathname
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (['home', 'pages', 'activity', 'insights', 'monetize', 'settings'].includes(lastPart)) {
      return lastPart as TabId;
    }
    return 'home';
  }, [searchParams, location.pathname]);
  
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
  const [showCreatePage, setShowCreatePage] = useState(false);

  // SEO
  const canonical = 'https://lnkmx.my/dashboard';
  const seoTitle = t('dashboard.seo.title', 'lnkmx Dashboard');
  const seoDescription = t('dashboard.seo.description', 'Manage your lnkmx pages, leads, and analytics.');

  // Check for new user quick start
  useEffect(() => {
    const completed = localStorage.getItem('linkmax_onboarding_completed');
    if (!completed && dashboard.pageData?.blocks.length === 1) {
      setShowQuickStart(true);
    }
  }, [dashboard.pageData?.blocks.length]);

  // Handle tab change - navigate to the proper route
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'home') {
      navigate('/dashboard/home');
    } else if (tabId === 'editor') {
      navigate('/dashboard/home?tab=editor');
    } else {
      navigate(`/dashboard/${tabId}`);
    }
  }, [navigate]);

  // Handle page switch
  const handlePageSwitch = useCallback((pageId: string) => {
    multiPage.switchPage(pageId);
  }, [multiPage]);

  // Handle create page
  const handleCreatePage = useCallback(async (title: string, slug?: string): Promise<{ success: boolean; error?: string }> => {
    const result = await multiPage.createPage(title, slug);
    if (result.success) {
      toast.success(t('dashboard.pages.createSuccess', 'Page created!'));
      setShowCreatePage(false);
    } else {
      toast.error(t(`dashboard.pages.errors.${result.error}`, 'Failed to create page'));
    }
    return { success: result.success, error: result.error };
  }, [multiPage, t]);

  // Handle edit page (navigate to editor)
  const handleEditPage = useCallback((pageId: string) => {
    multiPage.switchPage(pageId);
    handleTabChange('home');
  }, [multiPage, handleTabChange]);

  // Handle page actions
  const handlePreviewPage = useCallback((pageId: string) => {
    const page = multiPage.pages.find(p => p.id === pageId);
    if (page) {
      window.open(`https://lnkmx.my/${page.slug}`, '_blank');
    }
  }, [multiPage.pages]);

  const handleSharePage = useCallback((pageId: string) => {
    const page = multiPage.pages.find(p => p.id === pageId);
    if (page) {
      navigator.clipboard.writeText(`https://lnkmx.my/${page.slug}`);
      toast.success(t('dashboard.pages.linkCopied', 'Link copied!'));
    }
  }, [multiPage.pages, t]);

  // Listen for global events
  useEffect(() => {
    const handleOpenFriends = () => setShowFriends(true);
    window.addEventListener('openFriends', handleOpenFriends);
    return () => window.removeEventListener('openFriends', handleOpenFriends);
  }, []);

  // Loading state
  if (dashboard.loading || multiPage.loading) {
    return <LoadingState />;
  }

  if (!dashboard.pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold mb-2">{t('dashboard.errors.loadFailed', 'Loading failed')}</h2>
          <p className="text-muted-foreground mb-4">{t('dashboard.errors.loadFailedDesc', 'Could not load page data')}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl"
          >
            {t('common.retry', 'Try again')}
          </button>
        </div>
      </div>
    );
  }

  // Convert pages for PagesScreen
  const pagesForScreen = multiPage.pages.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    isPublished: p.isPublished,
    isPaid: p.isPaid,
    isPrimaryPaid: p.isPrimaryPaid,
    updatedAt: p.updatedAt,
    viewCount: p.viewCount,
  }));

  // Page switcher element for header
  const pageSwitcherElement = (
    <PageSwitcher
      pages={multiPage.pages}
      activePage={multiPage.activePage}
      limits={multiPage.limits}
      isPremium={dashboard.isPremium}
      onSwitchPage={handlePageSwitch}
      onCreatePage={() => setShowCreatePage(true)}
      onManagePages={() => handleTabChange('pages')}
    />
  );

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

        <DashboardLayout
          activeTab={currentTab}
          onTabChange={handleTabChange}
          isPremium={dashboard.isPremium}
          onSignOut={dashboard.handleSignOut}
        >
          {/* Home Screen */}
          {currentTab === 'home' && (
            <HomeScreen
              pageData={dashboard.pageData}
              loading={dashboard.loading}
              isPremium={dashboard.isPremium}
              onOpenEditor={() => handleTabChange('editor')}
              onPreview={() => dashboard.sharingState.handlePreview()}
              onShare={() => dashboard.sharingState.handleShare()}
              onOpenTemplates={() => setTemplateGalleryOpen(true)}
              onOpenMarketplace={() => setShowMarketplace(true)}
              pageSwitcher={pageSwitcherElement}
            />
          )}

          {/* Editor Screen */}
          {currentTab === 'editor' && (
            <EditorScreen
              pageData={dashboard.pageData}
              loading={dashboard.loading}
              isPremium={dashboard.isPremium}
              currentTier={dashboard.isPremium ? 'pro' : 'free'}
              premiumTier={dashboard.currentTier}
              onInsertBlock={dashboard.blockEditor.handleInsertBlock}
              onEditBlock={dashboard.blockEditor.handleEditBlock}
              onDeleteBlock={dashboard.blockEditor.handleDeleteBlock}
              onUpdateBlock={dashboard.updateBlock}
              onReorderBlocks={dashboard.reorderBlocks}
              onPreview={() => dashboard.sharingState.handlePreview()}
              onShare={() => dashboard.sharingState.handleShare()}
              onOpenTemplates={() => setTemplateGalleryOpen(true)}
              onOpenAI={() => dashboard.aiState.openAIBuilder()}
              canUndo={editorHistory.canUndo}
              canRedo={editorHistory.canRedo}
              onUndo={editorHistory.undo}
              onRedo={editorHistory.redo}
            />
          )}

          {/* Pages Screen */}
          {currentTab === 'pages' && (
            <PagesScreen
              pages={pagesForScreen}
              limits={multiPage.limits ? {
                tier: multiPage.limits.tier as 'free' | 'pro',
                currentPages: multiPage.limits.currentPages,
                maxPages: multiPage.limits.maxPages,
                paidPages: multiPage.limits.paidPages,
                freePages: multiPage.limits.freePages,
                canCreate: multiPage.limits.canCreate,
              } : undefined}
              loading={multiPage.loading}
              isPremium={dashboard.isPremium}
              onCreatePage={() => setShowCreatePage(true)}
              onEditPage={handleEditPage}
              onPreviewPage={handlePreviewPage}
              onSharePage={handleSharePage}
              onDuplicatePage={() => toast.info(t('common.comingSoon', 'Coming soon'))}
              onPageSettings={(id) => {
                multiPage.switchPage(id);
                handleTabChange('settings');
              }}
              onDeletePage={(id) => {
                // TODO: Add delete confirmation
                toast.info(t('common.comingSoon', 'Coming soon'));
              }}
              onUpgradePage={(id) => {
                // TODO: Open page upgrade flow
                toast.info(t('common.comingSoon', 'Coming soon'));
              }}
              onUpgradePlan={() => navigate('/pricing')}
            />
          )}

          {/* Activity Screen */}
          {currentTab === 'activity' && (
            <ActivityScreen
              isPremium={dashboard.isPremium}
            />
          )}

          {/* Insights Screen */}
          {currentTab === 'insights' && (
            <InsightsScreen
              pageId={dashboard.pageData?.id || ''}
              blocks={dashboard.pageData?.blocks || []}
              isPremium={dashboard.isPremium}
              onApplyInsight={(action) => {
                handleTabChange('home');
              }}
            />
          )}

          {/* Monetize Screen */}
          {currentTab === 'monetize' && (
            <MonetizeScreen
              isPremium={dashboard.isPremium}
              tier={dashboard.isPremium ? 'pro' : 'free'}
              limits={{
                pagesUsed: multiPage.limits?.currentPages || 1,
                pagesLimit: multiPage.limits?.maxPages || 1,
                paidPages: multiPage.limits?.paidPages || 0,
                freePages: multiPage.limits?.freePages || 1,
                blocksUsed: dashboard.pageData?.blocks.length || 0,
                blocksLimit: dashboard.isPremium ? 50 : 8,
                aiGenerationsUsed: 0,
                aiGenerationsLimit: dashboard.isPremium ? 20 : 3,
              }}
              onUpgrade={() => navigate('/pricing')}
            />
          )}

          {/* Settings Screen */}
          {currentTab === 'settings' && (
            <SettingsScreen
              usernameInput={dashboard.usernameState.usernameInput}
              onUsernameChange={dashboard.usernameState.setUsernameInput}
              onUpdateUsername={dashboard.usernameState.handleUpdateUsername}
              usernameSaving={dashboard.usernameState.saving}
              profileBlock={dashboard.profileBlock}
              onUpdateProfile={dashboard.handleUpdateProfile}
              isPremium={dashboard.isPremium}
              premiumTier={dashboard.currentTier}
              emailNotificationsEnabled={dashboard.userProfile.profile?.email_notifications_enabled ?? true}
              onEmailNotificationsChange={dashboard.userProfile.updateEmailNotifications}
              telegramEnabled={dashboard.userProfile.profile?.telegram_notifications_enabled ?? false}
              telegramChatId={dashboard.userProfile.profile?.telegram_chat_id ?? ''}
              onTelegramChange={dashboard.userProfile.updateTelegramNotifications}
              niche={dashboard.pageData?.niche as Niche | undefined}
              onNicheChange={dashboard.updateNiche}
              onSignOut={dashboard.handleSignOut}
              onOpenFriends={() => setShowFriends(true)}
              onOpenSaveTemplate={() => setShowSaveTemplate(true)}
              onOpenMyTemplates={() => setShowMyTemplates(true)}
              onOpenTokens={() => setShowTokens(true)}
              onOpenAchievements={() => setShowAchievements(true)}
              onOpenTheme={() => navigate('/dashboard/home?tab=editor')}
              onOpenMarketplace={() => setShowMarketplace(true)}
              onOpenTemplates={() => setTemplateGalleryOpen(true)}
              // Page settings props
              pageTitle={multiPage.activePage?.title}
              pageSlug={multiPage.activePage?.slug}
              isPaid={multiPage.activePage?.isPaid}
              isPrimaryPaid={multiPage.activePage?.isPrimaryPaid}
              seoTitle={(dashboard.pageData?.seo as { title?: string })?.title}
              seoDescription={(dashboard.pageData?.seo as { description?: string })?.description}
              isIndexable={dashboard.pageData?.isIndexable}
              onUpdateSlug={async (slug) => multiPage.updatePageSlug(multiPage.activePageId || '', slug)}
              onUpdateSeo={(seo) => {
                dashboard.updatePageDataPartial({
                  seo: { ...dashboard.pageData?.seo, ...seo },
                });
              }}
              onToggleIndexable={(indexable) => {
                dashboard.updatePageDataPartial({ isIndexable: indexable });
              }}
              onUpgradePage={() => {
                toast.info(t('common.comingSoon', 'Coming soon'));
              }}
            />
          )}
        </DashboardLayout>

        {/* Create Page Dialog */}
        <CreatePageDialog
          open={showCreatePage}
          onOpenChange={setShowCreatePage}
          onCreatePage={handleCreatePage}
          limits={multiPage.limits}
          isPremium={dashboard.isPremium}
          onUpgrade={() => navigate('/pricing')}
        />

        {/* Block Editor Modal */}
        {dashboard.blockEditor.editingBlock && (
          <UnifiedBlockEditor
            block={dashboard.blockEditor.editingBlock}
            isOpen={dashboard.blockEditor.editorOpen}
            onClose={dashboard.blockEditor.closeEditor}
            onSave={dashboard.blockEditor.handleSaveBlock}
          />
        )}

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

        {/* Quick Start Flow */}
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
