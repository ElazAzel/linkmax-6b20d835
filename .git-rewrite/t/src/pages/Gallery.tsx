import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CommunityGallery } from '@/components/gallery/CommunityGallery';
import { Leaderboard } from '@/components/gallery/Leaderboard';
import { TopReferrers } from '@/components/gallery/TopReferrers';
import { useGallery } from '@/hooks/useGallery';

export default function Gallery() {
  const { t } = useTranslation();
  const { pages } = useGallery();

  // Quick stats
  const totalLikes = pages.reduce((sum, p) => sum + (p.gallery_likes || 0), 0);
  const totalViews = pages.reduce((sum, p) => sum + (p.view_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <div className="bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/30">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                {t('gallery.title', 'Community Gallery')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('gallery.subtitle', 'Discover amazing pages created by our community')}
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardContent className="p-3 sm:p-4 text-center">
                <Sparkles className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{pages.length}</p>
                <p className="text-xs text-muted-foreground">{t('gallery.statsPages', 'Pages')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardContent className="p-3 sm:p-4 text-center">
                <Heart className="h-5 w-5 mx-auto text-red-500 mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{totalLikes}</p>
                <p className="text-xs text-muted-foreground">{t('gallery.statsLikes', 'Likes')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardContent className="p-3 sm:p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{totalViews}</p>
                <p className="text-xs text-muted-foreground">{t('gallery.statsViews', 'Views')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Leaderboard + Top Referrers */}
          <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
            <div className="lg:sticky lg:top-8 space-y-6">
              <Leaderboard />
              <TopReferrers />
            </div>
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <CommunityGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
