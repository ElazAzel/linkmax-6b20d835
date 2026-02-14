import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { Reveal } from '@/components/motion';

export default function AEOSection() {
  const { t } = useTranslation();

  const audienceItems = t('landingV5.aeo.for.list', { returnObjects: true }) as string[];
  const locationItems = t('landingV5.aeo.where.list', { returnObjects: true }) as string[];
  const quickAnswers = t('landingV5.aeo.answers.items', { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section className="sr-only" aria-hidden="false" data-seo="aeo">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center">
          <span>{t('landingV5.aeo.badge')}</span>
          <h2>{t('landingV5.aeo.title')}</h2>
          <p>{t('landingV5.aeo.subtitle')}</p>
        </div>

        <div>
          <h3>{t('landingV5.aeo.what.title')}</h3>
          <p>{t('landingV5.aeo.what.body')}</p>
        </div>

        <div>
          <h3>{t('landingV5.aeo.for.title')}</h3>
          <ul>
            {audienceItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3>{t('landingV5.aeo.where.title')}</h3>
          <ul>
            {locationItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3>{t('landingV5.aeo.answers.title')}</h3>
          <dl>
            {quickAnswers.map((item) => (
              <div key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
