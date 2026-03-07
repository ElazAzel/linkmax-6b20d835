/**
 * DashboardV2 - New mobile-first dashboard with multi-page support
 * Entry point for the redesigned dashboard experience
 */
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// State hooks
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import { useMultiPage } from '@/hooks/page/useMultiPage';
import { useFreemiumLimits } from '@/hooks/user/useFreemiumLimits';
import { useLeads } from '@/hooks/crm/useLeads';
import { useEditorHistory } from '@/hooks/editor/useEditorHistory';
import { usePageVersions } from '@/hooks/page/usePageVersions';

// Zone context
import { ZoneProvider, useZoneContext } from '@/contexts/ZoneContext';

// SEO
import { supabase } from '@/platform/supabase/client';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';

// Dashboard v2 components
import {
  DashboardLayout,
  PageSwitcher,
} from '@/components/dashboard-v2/layout';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common';


// Lazy load screens for bundle optimization (reduces DashboardV2 chunk by ~80%)
const HomeScreen = lazy(() => import('@/components/dashboard-v2/screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const PagesScreen = lazy(() => import('@/components/dashboard-v2/screens/PagesScreen').then(m => ({ default: m.PagesScreen })));
const EditorScreen = lazy(() => import('@/components/dashboard-v2/screens/EditorScreen').then(m => ({ default: m.EditorScreen })));
const ActivityScreen = lazy(() => import('@/components/dashboard-v2/screens/ActivityScreen').then(m => ({ default: m.ActivityScreen })));
const InsightsScreen = lazy(() => import('@/components/dashboard-v2/screens/InsightsScreen').then(m => ({ default: m.InsightsScreen })));
const MonetizeScreen = lazy(() => import('@/components/dashboard-v2/screens/MonetizeScreen').then(m => ({ default: m.MonetizeScreen })));
const SettingsScreen = lazy(() => import('@/components/dashboard-v2/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const EventsScreen = lazy(() => import('@/components/dashboard-v2/screens/EventsScreen').then(m => ({ default: m.EventsScreen })));
const EventDetailScreen = lazy(() => import('@/components/dashboard-v2/screens/EventDetailScreen').then(m => ({ default: m.EventDetailScreen })));
const LeadsScreen = lazy(() => import('@/components/dashboard-v2/screens/LeadsScreen').then(m => ({ default: m.LeadsScreen })));
const TeamManagementScreen = lazy(() => import('@/components/dashboard-v2/screens/TeamManagementScreen').then(m => ({ default: m.TeamManagementScreen })));

import {
  ZoneDashboardWrapper,
  ZoneDealsScreenWrapper,
  ZoneContactsScreenWrapper,
  ZoneInboxScreenWrapper,
  ZoneTasksScreenWrapper,
  ZoneSettingsScreenWrapper,
  ZoneAutomationsScreenWrapper,
  ZoneInvoicesScreenWrapper,
  ZoneDocumentsScreenWrapper,
  ZoneBookingsCalendarScreenWrapper,
  ZoneEventsScreenWrapper,
  ZoneProductsScreenWrapper,
} from '@/components/zones/ZoneWrappers';
import { ZoneCommandPalette } from '@/components/zones/ZoneCommandPalette';

// Screen loading fallback
const ScreenLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-pulse space-y-4 w-full max-w-md px-4">
      <div className="h-8 bg-muted rounded-lg w-3/4" />
      <div className="h-32 bg-muted rounded-xl" />
      <div className="h-12 bg-muted rounded-lg" />
    </div>
  </div>
);

// Inline fallback components (previously from deleted dashboard barrel)
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse space-y-4 w-full max-w-md px-4">
      <div className="h-8 bg-muted rounded-lg w-3/4" />
      <div className="h-32 bg-muted rounded-xl" />
      <div className="h-12 bg-muted rounded-lg" />
    </div>
  </div>
);
const BackgroundEffects = () => null;
import { storage } from '@/lib/storage';

// Lazy load heavy components for better bundle splitting
const BlockEditorV2 = lazy(() => import('@/components/editor/BlockEditorV2').then(m => ({ default: m.BlockEditorV2 })));
const TemplateGallery = lazy(() => import('@/components/editor/TemplateGallery').then(m => ({ default: m.TemplateGallery })));
const TemplateMarketplace = lazy(() => import('@/components/editor/TemplateMarketplace').then(m => ({ default: m.TemplateMarketplace })));
const SaveTemplateDialog = lazy(() => import('@/components/editor/SaveTemplateDialog').then(m => ({ default: m.SaveTemplateDialog })));
const AIGenerator = lazy(() => import('@/components/editor/AIGenerator').then(m => ({ default: m.AIGenerator })));
const QuickStartFlow = lazy(() => import('@/components/onboarding/QuickStartFlow').then(m => ({ default: m.QuickStartFlow })));
const AIBuilderWizard = lazy(() => import('@/components/onboarding/AIBuilderWizard').then(m => ({ default: m.AIBuilderWizard })));
const AchievementNotification = lazy(() => import('@/components/achievements/AchievementNotification').then(m => ({ default: m.AchievementNotification })));
const InstallPromptDialog = lazy(() => import('@/components/pwa/InstallPromptDialog').then(m => ({ default: m.InstallPromptDialog })));
const ShareAfterPublishDialog = lazy(() => import('@/components/referral/ShareAfterPublishDialog').then(m => ({ default: m.ShareAfterPublishDialog })));
const TokensPanel = lazy(() => import('@/components/tokens/TokensPanel').then(m => ({ default: m.TokensPanel })));
const FriendsPanel = lazy(() => import('@/components/friends/FriendsPanel').then(m => ({ default: m.FriendsPanel })));
const MyTemplatesPanel = lazy(() => import('@/components/templates/MyTemplatesPanel').then(m => ({ default: m.MyTemplatesPanel })));
const AchievementsPanel = lazy(() => import('@/components/achievements/AchievementsPanel').then(m => ({ default: m.AchievementsPanel })));
const LocalStorageMigration = lazy(() => import('@/components/layout/LocalStorageMigration').then(m => ({ default: m.LocalStorageMigration })));
const ThemePanel = lazy(() => import('@/components/dashboard-v2/panels').then(m => ({ default: m.ThemePanel })));
const CreatePageDialogLazy = lazy(() => import('@/components/dashboard-v2/dialogs').then(m => ({ default: m.CreatePageDialog })));
const PageVersionsDialogLazy = lazy(() => import('@/components/dashboard-v2/dialogs').then(m => ({ default: m.PageVersionsDialog })));

import type { Niche } from '@/lib/niches';

type TabId = 'home' | 'editor' | 'pages' | 'activity' | 'insights' | 'monetize' | 'settings' | 'events' | 'leads' | 'team' | 'zone-dashboard' | 'zone-deals' | 'zone-contacts' | 'zone-inbox' | 'zone-tasks' | 'zone-automations' | 'zone-invoices' | 'zone-documents' | 'zone-calendar' | 'zone-events' | 'zone-products' | 'zone-settings';

const ZONE_TABS = ['zone-dashboard', 'zone-deals', 'zone-contacts', 'zone-inbox', 'zone-tasks', 'zone-automations', 'zone-invoices', 'zone-documents', 'zone-calendar', 'zone-events', 'zone-products', 'zone-settings'];
const ALL_TABS = ['home', 'editor', 'pages', 'activity', 'insights', 'monetize', 'settings', 'events', 'leads', 'team', ...ZONE_TABS];

function DashboardV2Inner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  // Page versions - hook defined early for onPublish callback
  const pageVersionsRef = useRef<ReturnType<typeof usePageVersions> | null>(null);

  // Callback for saving version on each publish
  const handlePublishVersion = useCallback((pageData: import('@/types/page').PageData) => {
    if (pageData?.id && pageVersionsRef.current) {
      pageVersionsRef.current.saveVersion(
        pageData.id,
        pageData.blocks,
        pageData.theme,
        pageData.seo
      );
    }
  }, []);

  // Core state - with onPublish callback for automatic versioning
  const dashboard = useDashboard({ onPublish: handlePublishVersion });
  const multiPage = useMultiPage();
  const { canUseCustomPageBackground, limits: freemiumLimits, getAIPageGenerationsThisMonth, canUseBusinessZone } = useFreemiumLimits();
  const { leads } = useLeads();

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
    // Check for events routes first
    if (location.pathname.startsWith('/dashboard/events')) {
      return 'events';
    }
    // First check query params
    const tabParam = searchParams.get('tab') as TabId;
    if (tabParam && ALL_TABS.includes(tabParam)) {
      return tabParam;
    }
    // Fall back to pathname
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (ALL_TABS.includes(lastPart)) {
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
  const [showVersions, setShowVersions] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  // Page versions
  const handleRestoreVersion = useCallback((blocks: any[], theme?: any, seo?: any) => {
    dashboard.updatePageDataPartial({
      blocks,
      theme: theme || dashboard.pageData?.theme,
      seo: seo ? { ...dashboard.pageData?.seo, ...seo } : dashboard.pageData?.seo,
    });
    setShowVersions(false);
  }, [dashboard]);

  const pageVersions = usePageVersions(handleRestoreVersion);

  // Keep ref updated for onPublish callback
  useEffect(() => {
    pageVersionsRef.current = pageVersions;
  }, [pageVersions]);

  // SEO
  const canonical = `${getAppDomain()}/dashboard`;
  const seoTitle = t('dashboard.seo.title', 'lnkmx Dashboard');
  const seoDescription = t('dashboard.seo.description', 'Manage your lnkmx pages, leads, and analytics.');

  // Check for new user quick start - show only for users with 2 or fewer blocks
  useEffect(() => {
    // Check using name-spaced key via storage wrapper
    // Note: onboarding/useDashboardOnboarding uses 'onboarding_completed' key
    const completed = storage.get('onboarding_completed');
    const blocksCount = dashboard.pageData?.blocks.length || 0;
    // Only show quick start for new users with profile block only or just 1 content block
    if (!completed && blocksCount <= 2) {
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

  const handleUpdateSlug = useCallback(async (pageId: string, newSlug: string) => {
    const result = await multiPage.updatePageSlug(pageId, newSlug);
    if (!result.success) {
      toast.error(t(`dashboard.pages.errors.${result.error}`, 'Failed to update slug'));
    }
    return result;
  }, [multiPage, t]);

  const handleUpdateCustomDomain = useCallback(async (pageId: string, newDomain: string | null) => {
    const result = await multiPage.updatePageCustomDomain(pageId, newDomain);
    if (!result.success) {
      toast.error(t(`dashboard.pages.errors.${result.error}`, 'Failed to update custom domain'));
    }
    return result;
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
      window.open(getPublicPageUrl(page.slug), '_blank');
    }
  }, [multiPage.pages]);

  const handleSharePage = useCallback((pageId: string) => {
    const page = multiPage.pages.find(p => p.id === pageId);
    if (page) {
      navigator.clipboard.writeText(getPublicPageUrl(page.slug));
      toast.success(t('dashboard.pages.linkCopied', 'Link copied!'));
    }
  }, [multiPage.pages, t]);

  // Listen for global events from sidebar
  useEffect(() => {
    const handleOpenFriends = () => setShowFriends(true);
    const handleOpenTemplates = () => setTemplateGalleryOpen(true);
    const handleOpenMarketplace = () => setShowMarketplace(true);
    const handleOpenTokens = () => setShowTokens(true);
    const handleOpenAchievements = () => setShowAchievements(true);

    window.addEventListener('openFriends', handleOpenFriends);
    window.addEventListener('openTemplates', handleOpenTemplates);
    window.addEventListener('openMarketplace', handleOpenMarketplace);
    window.addEventListener('openTokens', handleOpenTokens);
    window.addEventListener('openAchievements', handleOpenAchievements);

    return () => {
      window.removeEventListener('openFriends', handleOpenFriends);
      window.removeEventListener('openTemplates', handleOpenTemplates);
      window.removeEventListener('openMarketplace', handleOpenMarketplace);
      window.removeEventListener('openTokens', handleOpenTokens);
      window.removeEventListener('openAchievements', handleOpenAchievements);
    };
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
          <Suspense fallback={null}>
            <LocalStorageMigration
              key={migrationKey}
              userId={dashboard.user.id}
              onMigrated={() => {
                setMigrationKey((prev) => prev + 1);
                window.location.reload();
              }}
            />
          </Suspense>
        )}

        <DashboardLayout
          activeTab={currentTab}
          onTabChange={handleTabChange}
          isPremium={dashboard.isPremium}
          isBusinessTier={canUseBusinessZone()}
          onSignOut={dashboard.handleSignOut}
        >
          <Suspense fallback={<ScreenLoader />}>
            {/* Home Screen */}
            {currentTab === 'home' && (
              <ScreenErrorBoundary screenName="Home">
                <HomeScreen
                  pageData={dashboard.pageData}
                  loading={dashboard.loading}
                  isPremium={dashboard.isPremium}
                  realLeadsCount={leads.length}
                  onOpenEditor={() => handleTabChange('editor')}
                  onPreview={() => dashboard.sharingState.handlePreview()}
                  onShare={() => dashboard.sharingState.handleShare()}
                  onOpenTemplates={() => setTemplateGalleryOpen(true)}
                  onOpenMarketplace={() => setShowMarketplace(true)}
                  pageSwitcher={pageSwitcherElement}
                  onOpenVersions={() => setShowVersions(true)}
                  onOpenInsights={() => handleTabChange('insights')}
                  onOpenActivity={() => handleTabChange('activity')}
                />
              </ScreenErrorBoundary>
            )}

            {/* Editor Screen */}
            {currentTab === 'editor' && (
              <ScreenErrorBoundary screenName="Editor">
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
                  onOpenVersions={() => setShowVersions(true)}
                />
              </ScreenErrorBoundary>
            )}

            {/* Pages Screen */}
            {currentTab === 'pages' && (
              <ScreenErrorBoundary screenName="Pages">
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
                  onDuplicatePage={async (id) => {
                    const page = multiPage.pages.find(p => p.id === id);
                    if (page) {
                      const result = await multiPage.createPage(`${page.title} (copy)`, `${page.slug}-copy`);
                      if (result.success) {
                        toast.success(t('dashboard.pages.duplicated', 'Page duplicated'));
                      } else {
                        toast.error(t(`dashboard.pages.errors.${result.error}`, 'Failed to duplicate'));
                      }
                    }
                  }}
                  onPageSettings={(id) => {
                    multiPage.switchPage(id);
                    handleTabChange('settings');
                  }}
                  onDeletePage={async (id) => {
                    if (!confirm(t('dashboard.pages.deleteConfirm', 'Are you sure you want to delete this page? This cannot be undone.'))) return;
                    const result = await multiPage.deletePage(id);
                    if (result.success) {
                      toast.success(t('dashboard.pages.deleted', 'Page deleted'));
                    } else {
                      toast.error(t(`dashboard.pages.errors.${result.error}`, 'Failed to delete page'));
                    }
                  }}
                  onUpgradePage={(id) => {
                    navigate('/pricing');
                  }}
                  onUpgradePlan={() => navigate('/pricing')}
                />
              </ScreenErrorBoundary>
            )}

            {/* Activity Screen */}
            {currentTab === 'activity' && (
              <ScreenErrorBoundary screenName="Activity">
                <ActivityScreen
                  isPremium={dashboard.isPremium}
                />
              </ScreenErrorBoundary>
            )}

            {/* Insights Screen */}
            {currentTab === 'insights' && (
              <ScreenErrorBoundary screenName="Insights">
                <InsightsScreen
                  pageId={dashboard.pageData?.id || ''}
                  blocks={dashboard.pageData?.blocks || []}
                  isPremium={dashboard.isPremium}
                  onApplyInsight={(action) => {
                    handleTabChange('home');
                  }}
                />
              </ScreenErrorBoundary>
            )}

            {/* Monetize Screen */}
            {currentTab === 'monetize' && (
              <ScreenErrorBoundary screenName="Monetize">
                <MonetizeScreen
                  isPremium={dashboard.isPremium}
                  tier={dashboard.isPremium ? 'pro' : 'free'}
                  limits={{
                    pagesUsed: multiPage.limits?.currentPages || 1,
                    pagesLimit: multiPage.limits?.maxPages || 1,
                    paidPages: multiPage.limits?.paidPages || 0,
                    freePages: multiPage.limits?.freePages || 1,
                    blocksUsed: dashboard.pageData?.blocks.length || 0,
                    blocksLimit: freemiumLimits.maxBlocks === Infinity ? 999 : freemiumLimits.maxBlocks,
                    aiGenerationsUsed: getAIPageGenerationsThisMonth(),
                    aiGenerationsLimit: freemiumLimits.maxAIPageGenerationsPerMonth === Infinity ? 999 : freemiumLimits.maxAIPageGenerationsPerMonth,
                  }}
                  onUpgrade={() => navigate('/pricing')}
                />
              </ScreenErrorBoundary>
            )}

            {/* Settings Screen */}
            {currentTab === 'settings' && (
              <ScreenErrorBoundary screenName="Settings">
                <SettingsScreen
                  usernameInput={dashboard.usernameState.usernameInput}
                  onUsernameChange={dashboard.usernameState.setUsernameInput}
                  onUpdateUsername={dashboard.usernameState.handleUpdateUsername}
                  usernameSaving={dashboard.usernameState.saving}
                  profileBlock={dashboard.profileBlock}
                  onUpdateProfile={dashboard.handleUpdateProfile as any}
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
                  onOpenTheme={() => setShowTheme(true)}
                  onOpenMarketplace={() => setShowMarketplace(true)}
                  onOpenTemplates={() => setTemplateGalleryOpen(true)}
                  onOpenAIBuilder={() => dashboard.onboardingState.openAIBuilderFromSettings()}
                  // Page settings props
                  pageTitle={multiPage.activePage?.title}
                  pageSlug={multiPage.activePage?.slug}
                  customDomain={(multiPage.activePage as any)?.custom_domain}
                  isPaid={multiPage.activePage?.isPaid}
                  isPrimaryPaid={multiPage.activePage?.isPrimaryPaid}
                  seoTitle={(dashboard.pageData?.seo as { title?: string })?.title}
                  seoDescription={(dashboard.pageData?.seo as { description?: string })?.description}
                  isIndexable={dashboard.pageData?.isIndexable}
                  faviconUrl={dashboard.pageData?.favicon_url}
                  hideBranding={dashboard.pageData?.hideBranding}
                  onUpdateSlug={async (slug) => multiPage.updatePageSlug(multiPage.activePageId || '', slug)}
                  onUpdateCustomDomain={async (domain) => {
                    const result = await multiPage.updatePageCustomDomain(multiPage.activePageId || '', domain);
                    if (result.success) {
                      try {
                        await multiPage.loadPages();
                      } catch (e) {
                        console.error(e)
                      }
                    }
                    return result;
                  }}
                  onUpdateSeo={(seo) => {
                    dashboard.updatePageDataPartial({
                      seo: { ...dashboard.pageData?.seo, ...seo },
                    });
                  }}
                  onUpdateBranding={(branding) => {
                    dashboard.updatePageDataPartial({
                      favicon_url: branding.faviconUrl,
                      hideBranding: branding.hideBranding,
                    });
                  }}
                  integrations={dashboard.pageData?.integrations}
                  onUpdateIntegrations={(integrations) => {
                    dashboard.updatePageDataPartial({ integrations });
                  }}
                  onToggleIndexable={(indexable) => {
                    dashboard.updatePageDataPartial({ isIndexable: indexable });
                  }}
                  onUpgradePage={() => {
                    toast.info(t('common.comingSoon', 'Coming soon'));
                  }}
                />
              </ScreenErrorBoundary>
            )}

            {/* Events Screen */}
            {currentTab === 'events' && (
              <ScreenErrorBoundary screenName="Events">
                {location.pathname.match(/\/dashboard\/events\/[^/]+$/) && !location.pathname.includes('/scanner') ? (
                  <EventDetailScreen />
                ) : (
                  <EventsScreen />
                )}
              </ScreenErrorBoundary>
            )}

            {/* Leads Screen */}
            {currentTab === 'leads' && (
              <ScreenErrorBoundary screenName="Leads">
                <LeadsScreen />
              </ScreenErrorBoundary>
            )}

            {/* Team Management Screen */}
            {currentTab === 'team' && (
              <ScreenErrorBoundary screenName="Team">
                <TeamManagementScreen />
              </ScreenErrorBoundary>
            )}

            {/* Zone Screens - Business tier only */}
            {currentTab === 'zone-dashboard' && canUseBusinessZone() && <ZoneDashboardWrapper />}
            {currentTab === 'zone-deals' && canUseBusinessZone() && <ZoneDealsScreenWrapper />}
            {currentTab === 'zone-contacts' && canUseBusinessZone() && <ZoneContactsScreenWrapper />}
            {currentTab === 'zone-inbox' && canUseBusinessZone() && <ZoneInboxScreenWrapper />}
            {currentTab === 'zone-tasks' && canUseBusinessZone() && <ZoneTasksScreenWrapper />}
            {currentTab === 'zone-automations' && canUseBusinessZone() && <ZoneAutomationsScreenWrapper />}
            {currentTab === 'zone-invoices' && canUseBusinessZone() && <ZoneInvoicesScreenWrapper />}
            {currentTab === 'zone-documents' && canUseBusinessZone() && <ZoneDocumentsScreenWrapper />}
            {currentTab === 'zone-calendar' && canUseBusinessZone() && <ZoneBookingsCalendarScreenWrapper />}
            {currentTab === 'zone-events' && canUseBusinessZone() && <ZoneEventsScreenWrapper />}
            {currentTab === 'zone-products' && canUseBusinessZone() && <ZoneProductsScreenWrapper />}
            {currentTab === 'zone-settings' && canUseBusinessZone() && <ZoneSettingsScreenWrapper />}
          </Suspense>
        </DashboardLayout>

        <Suspense fallback={null}>
          {/* Create Page Dialog */}
          <CreatePageDialogLazy
            open={showCreatePage}
            onOpenChange={setShowCreatePage}
            onCreatePage={handleCreatePage}
            limits={multiPage.limits}
            isPremium={dashboard.isPremium}
            onUpgrade={() => navigate('/pricing')}
          />

          {/* Block Editor Modal */}
          {dashboard.blockEditor.editingBlock && (
            <BlockEditorV2
              block={dashboard.blockEditor.editingBlock}
              isOpen={dashboard.blockEditor.editorOpen}
              onClose={dashboard.blockEditor.closeEditor}
              onSave={dashboard.blockEditor.handleSaveBlock}
              enableAutosave={true}
              onDelete={dashboard.blockEditor.handleDeleteBlock}
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

          {/* AI Builder Wizard (onboarding + settings) */}
          <AIBuilderWizard
            open={dashboard.onboardingState.showAIBuilderWizard}
            onClose={dashboard.onboardingState.handleAIBuilderClose}
            onComplete={dashboard.onboardingState.handleAIBuilderComplete}
            isOnboarding={true}
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

          {/* Page Versions Dialog */}
          <PageVersionsDialogLazy
            open={showVersions}
            onClose={() => setShowVersions(false)}
            versions={pageVersions.versions}
            loading={pageVersions.loading}
            onRestore={pageVersions.restoreVersion}
            pageId={dashboard.pageData?.id}
            onFetch={pageVersions.fetchVersions}
          />

          {/* Theme Panel */}
          <ThemePanel
            open={showTheme}
            onClose={() => setShowTheme(false)}
            currentTheme={dashboard.pageData?.theme || {}}
            onThemeChange={(theme) => {
              dashboard.updatePageDataPartial({ theme: { ...dashboard.pageData?.theme, ...theme } });
            }}
            isPremium={dashboard.isPremium}
            onUpgrade={() => navigate('/pricing')}
          />
        </Suspense>
      </div>
    </>
  );
}



export default function DashboardV2() {
  return (
    <ZoneProvider>
      <DashboardV2Inner />
      <ZoneCommandPalette />
    </ZoneProvider>
  );
}
