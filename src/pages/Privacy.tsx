import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { Button } from '@/components/ui/button';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import {
  getLegalSeo,
  LegalDocumentContent,
  normalizeLegalLanguage,
} from '@/components/legal/LegalDocumentContent';
import { getAppDomain } from '@/lib/utils/url-helpers';

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const language = normalizeLegalLanguage(i18n.language);
  const canonical = `${getAppDomain()}/privacy`;
  const seo = getLegalSeo('privacy', language);

  return (
    <>
      <StaticSEOHead
        title={seo.title}
        description={seo.description}
        canonical={canonical}
        currentLanguage={language}
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'kk', href: `${canonical}?lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>

          <article className="prose prose-slate max-w-none dark:prose-invert">
            <LegalDocumentContent kind="privacy" language={language} variant="page" />
          </article>
        </div>
      </div>
    </>
  );
};

export default Privacy;
