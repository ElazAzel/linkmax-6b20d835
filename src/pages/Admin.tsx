import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';
import Shield from 'lucide-react/dist/esm/icons/shield';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Users from 'lucide-react/dist/esm/icons/users';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Activity from 'lucide-react/dist/esm/icons/activity';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Crown from 'lucide-react/dist/esm/icons/crown';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Coins from 'lucide-react/dist/esm/icons/coins';
import Languages from 'lucide-react/dist/esm/icons/languages';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import Banknote from 'lucide-react/dist/esm/icons/banknote';
import Search from 'lucide-react/dist/esm/icons/search';
import Brain from 'lucide-react/dist/esm/icons/brain';
import { useBusinessFeatures } from '@/lib/features';

// Lazy load heavy tab components
const AdminOverviewTab = lazy(() => import('@/components/admin/AdminOverviewTab').then(m => ({ default: m.AdminOverviewTab })));
const AdminUsersTab = lazy(() => import('@/components/admin/AdminUsersTab').then(m => ({ default: m.AdminUsersTab })));
const AdminPagesTab = lazy(() => import('@/components/admin/AdminPagesTab').then(m => ({ default: m.AdminPagesTab })));
const AdminCharts = lazy(() => import('@/components/admin/AdminCharts').then(m => ({ default: m.AdminCharts })));
const AdminAnalyticsDashboard = lazy(() => import('@/components/admin/AdminAnalyticsDashboard').then(m => ({ default: m.AdminAnalyticsDashboard })));
const UserTierManager = lazy(() => import('@/components/admin/UserTierManager').then(m => ({ default: m.UserTierManager })));
const AdminVerificationPanel = lazy(() => import('@/components/admin/AdminVerificationPanel').then(m => ({ default: m.AdminVerificationPanel })));
const AdminTokensTab = lazy(() => import('@/components/admin/AdminTokensTab').then(m => ({ default: m.AdminTokensTab })));
const AdminPartnersTab = lazy(() => import('@/components/admin/AdminPartnersTab').then(m => ({ default: m.AdminPartnersTab })));
const AdminTemplatesTab = lazy(() => import('@/components/admin/AdminTemplatesTab').then(m => ({ default: m.AdminTemplatesTab })));
const AdminFintechTab = lazy(() => import('@/components/admin/AdminFintechTab').then(m => ({ default: m.AdminFintechTab })));
const AdminSearchDiagnosticsTab = lazy(() => import('@/components/admin/AdminSearchDiagnosticsTab').then(m => ({ default: m.AdminSearchDiagnosticsTab })));
const AdminBroadcastTab = lazy(() => import('@/components/admin/AdminBroadcastTab').then(m => ({ default: m.AdminBroadcastTab })));
const AdminGrowthTab = lazy(() => import('@/components/admin/AdminGrowthTab').then(m => ({ default: m.AdminGrowthTab })));

function TabLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canonical = `${getAppDomain()}/admin`;
  const seoTitle = t('admin.seo.title', 'lnkmx Admin');
  const seoDescription = t('admin.seo.description', 'Admin tools for managing lnkmx.');
  const { isAdmin, loading, user } = useAdminAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const businessEnabled = useBusinessFeatures();
  const businessTabs = ['tokens', 'partners', 'fintech'];
  const activeTab = !businessEnabled && businessTabs.includes(selectedTab) ? 'overview' : selectedTab;

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tabs = [
    { value: 'overview', label: t('admin.overview'), icon: BarChart3 },
    { value: 'growth', label: t('admin.growth', 'Growth'), icon: TrendingUp },
    { value: 'users', label: t('admin.users'), icon: Users },
    { value: 'pages', label: t('admin.pages'), icon: FileText },
    { value: 'tokens', label: t('admin.tokens', 'Токены'), icon: Coins },
    { value: 'analytics', label: t('admin.analytics'), icon: Activity },
    { value: 'detailed', label: t('admin.detailed'), icon: TrendingUp },
    { value: 'tiers', label: t('admin.tiers'), icon: Crown },
    { value: 'verification', label: t('admin.verification', 'Верификация'), icon: ShieldCheck },
    { value: 'partners', label: t('admin.partners.title', 'Партнёры'), icon: Handshake },
    { value: 'templates', label: t('admin.templates', 'Templates'), icon: FileText },
    { value: 'fintech', label: t('admin.fintech', 'Финансы'), icon: Banknote },
    { value: 'broadcast', label: t('admin.broadcast', 'Рассылка'), icon: Megaphone },
    { value: 'seo', label: 'SEO', icon: Search },
  ];
  const navigationGroups = [
    { label: 'Страницы и контент', values: ['overview', 'pages', 'templates', 'users', 'seo'] },
    { label: 'Аналитика', values: ['growth', 'analytics', 'detailed'], secondary: true },
    { label: 'Управление', values: ['tiers', 'verification', 'broadcast'], secondary: true },
    ...(businessEnabled ? [{ label: 'Бизнес-инструменты', values: businessTabs, secondary: true }] : []),
  ];

  return (
    <ScreenErrorBoundary screenName="Admin">
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
      <div className="app-canvas min-h-screen">
        {/* Header */}
        <header className="border-b border-border/70 bg-card/95 backdrop-blur-xl shadow-soft sticky top-0 z-50">
          <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h1 className="text-lg md:text-xl font-bold font-[var(--font-heading)]">{t('admin.title')}</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/language-algorithms')}
                className="h-8 px-2 md:px-3"
                aria-label={t('admin.languageAlgorithms', 'Языки и алгоритмы')}
              >
                <Brain className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('admin.languageAlgorithms', 'Языки и алгоритмы')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/translations')}
                className="h-8 px-2 md:px-3"
                aria-label={t('admin.translations', 'Переводы')}
              >
                <Languages className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('admin.translations', 'Переводы')}</span>
              </Button>
              <span className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate max-w-[150px]">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="h-8 px-2 md:px-3" aria-label={t('admin.signOut')}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('admin.signOut')}</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-2 md:px-4 py-3 md:py-6">
          <Tabs value={activeTab} onValueChange={setSelectedTab}>
            <div className="mb-5 space-y-3">
              {navigationGroups.map(group => {
                const links = (
                  <TabsList aria-label={group.label} className="h-auto w-full flex flex-wrap justify-start gap-1 bg-muted/50 p-1">
                    {tabs.filter(tab => group.values.includes(tab.value)).map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value} className="px-3 py-2 text-sm whitespace-normal">
                        <tab.icon className="mr-2 h-4 w-4 shrink-0" />{tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                );
                return group.secondary ? (
                  <details key={group.label} open={group.values.includes(activeTab) || undefined} className="rounded-xl border border-border/70 p-2">
                    <summary className="cursor-pointer px-1 py-1 text-sm font-medium text-muted-foreground">{group.label}</summary>
                    <div className="mt-2">{links}</div>
                  </details>
                ) : <div key={group.label}>{links}</div>;
              })}
            </div>

            <Suspense fallback={<TabLoader />}>
              <TabsContent value={activeTab}>
                {activeTab === 'overview' && <AdminOverviewTab />}
                {activeTab === 'growth' && <AdminGrowthTab />}
                {activeTab === 'users' && <AdminUsersTab />}
                {activeTab === 'pages' && <AdminPagesTab />}
                {activeTab === 'tokens' && <AdminTokensTab />}
                {activeTab === 'analytics' && <AdminCharts />}
                {activeTab === 'detailed' && <AdminAnalyticsDashboard />}
                {activeTab === 'tiers' && <UserTierManager />}
                {activeTab === 'verification' && <AdminVerificationPanel />}
                {activeTab === 'partners' && <AdminPartnersTab />}
                {activeTab === 'templates' && <AdminTemplatesTab />}
                {activeTab === 'fintech' && <AdminFintechTab />}
                {activeTab === 'broadcast' && <AdminBroadcastTab />}
                {activeTab === 'seo' && <AdminSearchDiagnosticsTab />}
              </TabsContent>
            </Suspense>
          </Tabs>
        </main>
      </div>
    </ScreenErrorBoundary>
  );
}
