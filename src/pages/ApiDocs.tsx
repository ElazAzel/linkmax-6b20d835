import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Code from 'lucide-react/dist/esm/icons/code';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';

const MCP_TOOLS = [
  { name: 'list_my_pages', desc: { ru: 'Список страниц пользователя со статусом публикации.', en: 'List the user pages with publish status.' } },
  { name: 'get_page_structure', desc: { ru: 'Блоки и настройки конкретной страницы для дальнейшего редактирования.', en: 'Blocks and settings of a page for further editing.' } },
  { name: 'create_page', desc: { ru: 'Создание новой страницы и возврат её id и доступных настроек.', en: 'Create a new page and return its id and available settings.' } },
  { name: 'list_my_leads', desc: { ru: 'Последние лиды и заявки со страниц.', en: 'Recent leads and inbound requests.' } },
  { name: 'get_analytics_summary', desc: { ru: 'Сводка просмотров, кликов и конверсии.', en: 'Views, clicks and conversion summary.' } },
];

export default function ApiDocs() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'ru';

  const title =
    lang === 'en' ? 'LinkMax API & AI agent access (MCP)' : 'API LinkMax и доступ для AI-агентов (MCP)';
  const description =
    lang === 'en'
      ? 'LinkMax public API surface: OpenAPI specification, MCP server with OAuth 2.1, available agent tools, webhooks and machine-readable API catalog.'
      : 'Публичный API LinkMax: спецификация OpenAPI, MCP-сервер с OAuth 2.1, доступные инструменты для агентов, вебхуки и машиночитаемый каталог API.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    inLanguage: lang,
    author: { '@type': 'Organization', name: 'LinkMax' },
  };

  return (
    <div className="min-h-screen bg-background">
      <StaticSEOHead
        title={title}
        description={description}
        canonical="/docs/api"
        currentLanguage={lang}
        ogType="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="container max-w-4xl mx-auto px-4 py-14 space-y-10">
        <header>
          <Badge variant="secondary" className="mb-4 gap-1">
            <Code className="h-3 w-3" />
            API
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 break-words">{title}</h1>
          <p className="text-muted-foreground break-words">{description}</p>
        </header>

        <section aria-labelledby="discovery">
          <h2 id="discovery" className="text-xl font-semibold mb-4">
            {lang === 'en' ? 'Machine-readable discovery' : 'Машиночитаемое обнаружение'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: '/.well-known/openapi.json', label: 'OpenAPI 3.1 specification' },
              { href: '/.well-known/api-catalog', label: 'API catalog (RFC 9727)' },
              { href: '/llms.txt', label: 'llms.txt' },
              { href: '/robots.txt', label: 'robots.txt + content signals' },
            ].map((item) => (
              <Card key={item.href} className="p-4 border-0 shadow-none bg-muted/40">
                <a href={item.href} className="text-sm font-medium text-primary break-all">
                  {item.label}
                </a>
                <p className="text-xs text-muted-foreground mt-1 break-all">{item.href}</p>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="mcp">
          <h2 id="mcp" className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {lang === 'en' ? 'MCP server for AI agents' : 'MCP-сервер для AI-агентов'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 break-words">
            {lang === 'en'
              ? 'Connect Claude, ChatGPT or any MCP client. Authorization uses OAuth 2.1 — the agent acts strictly on behalf of the signed-in user.'
              : 'Подключите Claude, ChatGPT или любой MCP-клиент. Авторизация — OAuth 2.1: агент действует строго от имени вошедшего пользователя.'}
          </p>
          <ul className="space-y-3">
            {MCP_TOOLS.map((tool) => (
              <li key={tool.name} className="rounded-lg bg-muted/40 p-4">
                <code className="text-sm font-medium break-all">{tool.name}</code>
                <p className="text-sm text-muted-foreground mt-1 break-words">{tool.desc[lang]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="security">
          <h2 id="security" className="text-xl font-semibold mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {lang === 'en' ? 'Security model' : 'Модель безопасности'}
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              {lang === 'en'
                ? 'Every request is scoped to the authenticated user by row-level security.'
                : 'Каждый запрос ограничен данными авторизованного пользователя через row-level security.'}
            </li>
            <li>
              {lang === 'en'
                ? 'Outgoing webhooks are signed; incoming webhooks require a shared secret.'
                : 'Исходящие вебхуки подписываются, входящие требуют общий секрет.'}
            </li>
            <li>
              {lang === 'en'
                ? 'Third-party APIs are proxied through a server-side gateway with a strict host allowlist.'
                : 'Сторонние API вызываются через серверный шлюз со строгим allowlist хостов.'}
            </li>
          </ul>
        </section>

        <p className="text-sm">
          <Link to="/integrations" className="text-primary">
            {lang === 'en' ? 'See all integrations →' : 'Все интеграции →'}
          </Link>
        </p>
      </main>
    </div>
  );
}
