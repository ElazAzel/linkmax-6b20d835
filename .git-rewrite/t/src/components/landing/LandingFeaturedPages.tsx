import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Eye, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTopPremiumPages, type GalleryPage } from '@/services/gallery';
import { NICHE_ICONS, type Niche } from '@/lib/niches';

export function LandingFeaturedPages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pages, setPages] = useState<GalleryPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopPremiumPages(5).then(data => {
      setPages(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (pages.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/25 mb-4">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {t('landing.featured.badge', 'Top Creators')}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.featured.title', 'Featured Pages')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('landing.featured.subtitle', 'Discover the most popular pages created with LinkMAX')}
          </p>
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {pages.map((page, index) => (
            <Card
              key={page.id}
              className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/40 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              onClick={() => window.open(`/${page.slug}`, '_blank')}
            >
              {/* Premium Badge */}
              <div className="absolute top-2 right-2 z-10">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-semibold shadow-lg">
                  <Crown className="h-3 w-3" />
                  <span>#{index + 1}</span>
                </div>
              </div>

              <div className="p-3 sm:p-4">
                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 shadow-lg group-hover:scale-105 transition-transform">
                    <AvatarImage src={page.avatar_url || ''} alt={page.title || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {(page.title || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="text-center space-y-1.5">
                  <h3 className="font-semibold text-xs sm:text-sm truncate">
                    {page.title || page.slug}
                  </h3>
                  
                  {page.niche && (
                    <div className="hidden sm:flex justify-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                        <span>{NICHE_ICONS[page.niche as Niche] || '📌'}</span>
                        <span className="text-muted-foreground">
                          {t(`niches.${page.niche}`, page.niche)}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {page.view_count || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {page.gallery_likes || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/gallery')}
            className="rounded-xl font-semibold bg-background/60 backdrop-blur-xl hover:bg-accent border-border/50 hover:border-primary/30 group"
          >
            {t('landing.featured.viewAll', 'View All Pages')}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}