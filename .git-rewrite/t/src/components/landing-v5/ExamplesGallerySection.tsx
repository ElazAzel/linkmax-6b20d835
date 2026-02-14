import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Users, ArrowRight, Eye, Heart, Crown } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';
import { useGallery } from '@/hooks/useGallery';

interface ExamplesGallerySectionProps {
  onViewAll: () => void;
}

export default function ExamplesGallerySection({ onViewAll }: ExamplesGallerySectionProps) {
  const { t } = useTranslation();
  const { pages, loading } = useGallery();

  const displayPages = pages.slice(0, 6);

  return (
    <section className="py-12 px-5 bg-muted/20">
      <div className="max-w-3xl mx-auto">
        <Reveal direction="up">
          <div className="text-center mb-8">
            <Badge className="mb-3 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.examples.badge')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t('landingV5.examples.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('landingV5.examples.subtitle')}
            </p>
          </div>
        </Reveal>

        {/* Gallery grid */}
        {!loading && displayPages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {displayPages.map((page, i) => (
              <Reveal key={page.id} delay={i * 60} direction="up" distance={12}>
                <Card 
                  className={cn(
                    "group cursor-pointer bg-card/50 backdrop-blur-xl border-border/30",
                    "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  )}
                  onClick={() => window.open(`/${page.slug}`, '_blank')}
                >
                  <div className="relative p-3 pb-2 flex flex-col items-center">
                    {page.is_premium && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow-sm">
                          <Crown className="h-2.5 w-2.5" />
                        </div>
                      </div>
                    )}
                    <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-md group-hover:scale-105 transition-transform">
                      <AvatarImage src={page.avatar_url || ''} alt={page.title || ''} loading="lazy" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(page.title || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="px-2.5 pb-2.5">
                    <h3 className="font-semibold text-xs text-center truncate mb-1.5">
                      {page.title || page.slug}
                    </h3>
                    <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
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
                </Card>
              </Reveal>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        <Reveal delay={400} direction="fade">
          <div className="text-center">
            <Button
              variant="outline"
              onClick={onViewAll}
              className="rounded-xl group"
            >
              {t('landingV5.examples.viewAll')}
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
