import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { 
  Shield, LogOut, BarChart3, Users, FileText, Activity, 
  PieChart, TrendingUp, Crown, ShieldCheck, Loader2, Coins, Languages
} from 'lucide-react';

// Lazy load heavy tab components
const AdminOverviewTab = lazy(() => import('@/components/admin/AdminOverviewTab').then(m => ({ default: m.AdminOverviewTab })));
const AdminUsersTab = lazy(() => import('@/components/admin/AdminUsersTab').then(m => ({ default: m.AdminUsersTab })));
const AdminPagesTab = lazy(() => import('@/components/admin/AdminPagesTab').then(m => ({ default: m.AdminPagesTab })));
const AdminCharts = lazy(() => import('@/components/admin/AdminCharts').then(m => ({ default: m.AdminCharts })));
const AdminAnalyticsDashboard = lazy(() => import('@/components/admin/AdminAnalyticsDashboard').then(m => ({ default: m.AdminAnalyticsDashboard })));
const UserTierManager = lazy(() => import('@/components/admin/UserTierManager').then(m => ({ default: m.UserTierManager })));
const AdminVerificationPanel = lazy(() => import('@/components/admin/AdminVerificationPanel').then(m => ({ default: m.AdminVerificationPanel })));
const AdminTokensTab = lazy(() => import('@/components/admin/AdminTokensTab').then(m => ({ default: m.AdminTokensTab })));

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
  const canonical = 'https://lnkmx.my/admin';
  const seoTitle = t('admin.seo.title', 'lnkmx Admin');
  const seoDescription = t('admin.seo.description', 'Admin tools for managing lnkmx.');
  const { isAdmin, loading, user } = useAdminAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

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
    { value: 'users', label: t('admin.users'), icon: Users },
    { value: 'pages', label: t('admin.pages'), icon: FileText },
    { value: 'tokens', label: t('admin.tokens', 'Токены'), icon: Coins },
    { value: 'analytics', label: t('admin.analytics'), icon: Activity },
    { value: 'charts', label: t('admin.charts'), icon: PieChart },
    { value: 'detailed', label: t('admin.detailed'), icon: TrendingUp },
    { value: 'tiers', label: t('admin.tiers'), icon: Crown },
    { value: 'verification', label: t('admin.verification', 'Верификация'), icon: ShieldCheck },
  ];

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
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold">{t('admin.title')}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/translations')}
              className="h-8 px-2 md:px-3"
            >
              <Languages className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('admin.translations', 'Переводы')}</span>
            </Button>
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate max-w-[150px]">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="h-8 px-2 md:px-3">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('admin.signOut')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 md:px-4 py-3 md:py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          {/* Scrollable tabs for mobile */}
          <div className="overflow-x-auto -mx-2 px-2 pb-2 mb-4 md:mb-6">
            <TabsList className="inline-flex w-max md:w-auto bg-muted/50 p-1">
              {tabs.map(tab => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2"
                >
                  <tab.icon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="overview">
              <AdminOverviewTab />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsersTab />
            </TabsContent>

            <TabsContent value="pages">
              <AdminPagesTab />
            </TabsContent>

            <TabsContent value="tokens">
              <AdminTokensTab />
            </TabsContent>

            <TabsContent value="analytics">
              <AdminCharts />
            </TabsContent>

            <TabsContent value="charts">
              <AdminCharts />
            </TabsContent>

            <TabsContent value="detailed">
              <AdminAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="tiers">
              <UserTierManager />
            </TabsContent>

            <TabsContent value="verification">
              <AdminVerificationPanel />
            </TabsContent>
          </Suspense>
        </Tabs>
      </main>
      </div>
    </>
  );
}
