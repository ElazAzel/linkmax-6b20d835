import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Globe, Check, Search } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { cn } from '@/lib/utils';

export default function SEOExplainerSection() {
  const { t } = useTranslation();

  const items = [
    t('landingV5.seo.items.1'),
    t('landingV5.seo.items.2'),
    t('landingV5.seo.items.3'),
    t('landingV5.seo.items.4'),
    t('landingV5.seo.items.5'),
  ];

  return (
    <section className="py-12 px-5">
      <div className="max-w-xl mx-auto">
        <Reveal direction="up">
          <div className="text-center mb-8">
            <Badge className="mb-3 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Search className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.seo.badge')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t('landingV5.seo.title')}
            </h2>
          </div>
        </Reveal>

        {/* AI-friendly bullet list */}
        <Reveal delay={200} direction="up">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/60 border border-border/40 shadow-sm">
            <ul className="space-y-3">
              {items.map((item, i) => (
                <Reveal key={i} delay={i * 60} direction="left" distance={8}>
                  <li className={cn(
                    "flex items-start gap-3 text-sm p-2 rounded-lg",
                    "hover:bg-primary/5 transition-colors"
                  )}>
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
