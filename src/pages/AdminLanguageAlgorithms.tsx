import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { getWritingAlgorithmStats, getWritingNiches } from '@/lib/intelligence/writing-algorithm';
import { ArrowLeft, Brain, Languages, Loader2, Settings } from 'lucide-react';

export default function AdminLanguageAlgorithms() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canonical = `${getAppDomain()}/admin/language-algorithms`;
  const { isAdmin, loading } = useAdminAuth();

  const niches = useMemo(() => getWritingNiches(), []);
  const stats = useMemo(() => getWritingAlgorithmStats(), []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [loading, isAdmin, navigate]);

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

  return (
    <>
      <StaticSEOHead
        title={t('admin.languageAlgorithms.title', 'Языки и алгоритмы — Admin')}
        description={t('admin.languageAlgorithms.description', 'Управление переводами и deterministic-алгоритмами платформы lnkmx.')}
        canonical={canonical}
        currentLanguage={i18n.language}
        indexable={false}
      />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                {t('admin.languageAlgorithms.heading', 'Языки и алгоритмы')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('admin.languageAlgorithms.subheading', 'Центр настройки переводов интерфейса и алгоритма Smart-Writing 2.0.')}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Назад')}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  {t('admin.languageAlgorithms.languagesCardTitle', 'Языки платформы')}
                </CardTitle>
                <CardDescription>
                  {t('admin.languageAlgorithms.languagesCardDescription', 'Управляйте переводами, синхронизацией и загрузкой language-файлов из админ-панели.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">RU</Badge>
                  <Badge variant="secondary">EN</Badge>
                  <Badge variant="secondary">KK</Badge>
                  <Badge variant="outline">+13</Badge>
                </div>
                <Button onClick={() => navigate('/admin/translations')} className="w-full sm:w-auto">
                  {t('admin.languageAlgorithms.openTranslations', 'Открыть управление переводами')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  {t('admin.languageAlgorithms.algorithmCardTitle', 'Smart-Writing алгоритм')}
                </CardTitle>
                <CardDescription>
                  {t('admin.languageAlgorithms.algorithmCardDescription', 'Детерминированные шаблоны для текстовых подсказок в редакторе блоков.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border p-2">
                    <p className="text-muted-foreground">Ниш</p>
                    <p className="font-semibold">{stats.niches}</p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-muted-foreground">Шаблонов</p>
                    <p className="font-semibold">{stats.totalTemplates}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {niches.slice(0, 6).map(niche => (
                    <Badge key={niche} variant="outline">{niche}</Badge>
                  ))}
                  {niches.length > 6 && <Badge variant="outline">+{niches.length - 6}</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
