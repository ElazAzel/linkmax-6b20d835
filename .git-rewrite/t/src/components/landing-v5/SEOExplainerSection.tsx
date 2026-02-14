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
    <section className="sr-only" aria-hidden="false" data-seo="explainer">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span>{t('landingV5.seo.badge')}</span>
          <h2>{t('landingV5.seo.title')}</h2>
        </div>

        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
