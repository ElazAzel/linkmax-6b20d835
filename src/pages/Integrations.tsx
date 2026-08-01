import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORY_LABELS,
  groupIntegrations,
  type Integration,
} from '@/lib/integrations/catalog';
import Plug from 'lucide-react/dist/esm/icons/plug';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Bot from 'lucide-react/dist/esm/icons/bot';

export default function Integrations() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'ru';
  const groups = useMemo(() => groupIntegrations(INTEGRATIONS), []);

  const title =
    lang === 'en'
      ? 'LinkMax integrations — messengers, payments, AI agents'
      : 'Интеграции LinkMax — мессенджеры, платежи, AI-агенты';
  const description =
    lang === 'en'
      ? 'Full catalog of LinkMax integrations: Telegram, WhatsApp, Robokassa, Google Calendar, DocuSeal, MCP for AI agents, webhooks and open API.'
      : 'Полный каталог интеграций LinkMax: Telegram, WhatsApp, Robokassa, Google Calendar, DocuSeal, MCP для AI-агентов, вебхуки и открытый API.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    numberOfItems: INTEGRATIONS.length,
    itemListElement: INTEGRATIONS.map((item: Integration, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      description: item.description[lang],
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <StaticSEOHead
        title={title}
        description={description}
        canonical="/integrations"
        currentLanguage={lang}
        ogType="website"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b bg-muted/30">
        <div className="container max-w-5xl mx-auto px-4 py-14">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Plug className="h-3 w-3" />
            {t('integrations.eyebrow', lang === 'en' ? 'Integrations' : 'Интеграции')}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 break-words">{title}</h1>
          <p className="text-muted-foreground max-w-2xl break-words">{description}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild>
              <Link to="/auth">
                {lang === 'en' ? 'Start free' : 'Начать бесплатно'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/docs/api">
                <Bot className="h-4 w-4 mr-2" />
                {lang === 'en' ? 'API & agents' : 'API и агенты'}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-12 space-y-12">
        {groups.map(([category, items]) => (
          <section key={category} aria-labelledby={`cat-${category}`}>
            <h2 id={`cat-${category}`} className="text-xl font-semibold mb-4">
              {INTEGRATION_CATEGORY_LABELS[category][lang]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <Card key={item.slug} className="p-5 border-0 shadow-none bg-muted/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium break-words">{item.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      {item.status !== 'live' && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {item.status}
                        </Badge>
                      )}
                      {item.requiresSetup && (
                        <Badge variant="secondary" className="text-[10px]">
                          {lang === 'en' ? 'setup' : 'настройка'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{item.description[lang]}</p>
                  {item.docsUrl && (
                    <Link to={item.docsUrl} className="text-sm text-primary inline-flex items-center gap-1 mt-3">
                      {lang === 'en' ? 'Documentation' : 'Документация'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
