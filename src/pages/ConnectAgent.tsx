import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import Plug from 'lucide-react/dist/esm/icons/plug';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

const PROJECT_REF = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID ?? '';
const MCP_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/mcp`;
const APP_NAME = 'LinkMAX';
const SERVER_SLUG = 'linkmax';
const CLAUDE_CODE_CMD = `claude mcp add --scope user --transport http ${SERVER_SLUG} '${MCP_URL.replace(/'/g, "'\\''")}'`;
const CLAUDE_DEEPLINK = `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(APP_NAME)}&connectorUrl=${encodeURIComponent(MCP_URL)}`;

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2">
        <code className="text-sm font-mono break-all flex-1">{value}</code>
        <Button
          size="sm"
          variant="outline"
          aria-label={label}
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

type Steps = { title: string; steps: string[] };

export default function ConnectAgent() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'ru';

  const title =
    lang === 'en'
      ? `Connect an AI assistant to ${APP_NAME}`
      : `Подключение AI-ассистента к ${APP_NAME}`;
  const description =
    lang === 'en'
      ? `Step-by-step instructions to connect ChatGPT, Claude, Claude Code or any MCP client to your ${APP_NAME} account.`
      : `Пошаговая инструкция: как подключить ChatGPT, Claude, Claude Code или любой MCP-клиент к вашему аккаунту ${APP_NAME}.`;

  const intro =
    lang === 'en'
      ? 'Paste the server address below into your assistant. After you sign in, it can work with your own pages, leads and analytics — nothing else.'
      : 'Скопируйте адрес сервера ниже и вставьте его в вашего ассистента. После входа он сможет работать только с вашими страницами, заявками и аналитикой.';

  const connect: Steps[] =
    lang === 'en'
      ? [
          {
            title: 'ChatGPT',
            steps: [
              'Open ChatGPT settings → Apps & Connectors → Advanced and enable Developer mode (read the risk notice shown there). If it is unavailable, ask your ChatGPT admin to enable it.',
              'Click the "Create app" button next to the back button.',
              'Enter a connector name and paste the server address above.',
              'Click "Create".',
              'Enable the app from the chat composer, then ask ChatGPT to use it.',
            ],
          },
          {
            title: 'Claude',
            steps: [
              'Use the "Open Claude" button below — the custom connector dialog opens with the name and address prefilled.',
              'Review the details and click "Add".',
              'If the prefilled dialog does not open, go to Claude → Connectors → "Add custom connector", enter a name and paste the address above.',
              'Enable the connector in the chat composer, then ask Claude to use it.',
            ],
          },
          {
            title: 'Claude Code',
            steps: [
              'Run the command below in a terminal.',
              'Start Claude Code and run /mcp to confirm the connection. Sign in from that menu when asked.',
              'Ask Claude Code to use the app.',
            ],
          },
          {
            title: 'Other MCP clients',
            steps: [
              "Open the client's MCP server or custom connector settings.",
              'Create a remote MCP server connection.',
              'Name the connection and paste the server address above.',
              'Complete any sign-in or authorization prompts.',
              'Enable the connection, then ask the assistant to use the app.',
            ],
          },
        ]
      : [
          {
            title: 'ChatGPT',
            steps: [
              'Откройте настройки ChatGPT → Apps & Connectors → Advanced и включите режим разработчика (прочитайте предупреждение о рисках). Если раздел недоступен, попросите администратора ChatGPT включить его.',
              'Нажмите кнопку «Create app» рядом с кнопкой «Назад».',
              'Введите название коннектора и вставьте адрес сервера выше.',
              'Нажмите «Create».',
              'Включите приложение в поле ввода чата и попросите ChatGPT им воспользоваться.',
            ],
          },
          {
            title: 'Claude',
            steps: [
              'Нажмите кнопку «Открыть Claude» ниже — диалог добавления коннектора откроется с уже заполненным названием и адресом.',
              'Проверьте данные и нажмите «Add».',
              'Если диалог не открылся: Claude → Connectors → «Add custom connector», введите название и вставьте адрес выше.',
              'Включите коннектор в поле ввода чата и попросите Claude им воспользоваться.',
            ],
          },
          {
            title: 'Claude Code',
            steps: [
              'Выполните команду ниже в терминале.',
              'Запустите Claude Code и введите /mcp, чтобы проверить подключение. Войдите в аккаунт, если появится запрос.',
              'Попросите Claude Code воспользоваться приложением.',
            ],
          },
          {
            title: lang === 'en' ? 'Other MCP clients' : 'Другие MCP-клиенты',
            steps: [
              'Откройте настройки MCP-серверов или пользовательских коннекторов в вашем клиенте.',
              'Создайте подключение к удалённому MCP-серверу.',
              'Задайте название и вставьте адрес сервера выше.',
              'Пройдите вход и подтвердите доступ.',
              'Включите подключение и попросите ассистента им воспользоваться.',
            ],
          },
        ];

  const refresh: Steps[] =
    lang === 'en'
      ? [
          {
            title: 'ChatGPT',
            steps: [
              'Open ChatGPT app preferences and pick this app under "Enabled apps".',
              'Next to "Information", click "Refresh".',
              'If the address changed, paste the latest one from above.',
              'Start a new chat and ask ChatGPT to use the app.',
            ],
          },
          {
            title: 'Claude',
            steps: [
              'Open the Connectors page and select this connector.',
              "Refresh or update the connector's tools.",
              'If the address changed, paste the latest one from above.',
              'Ask Claude to use the app.',
            ],
          },
          {
            title: 'Claude Code',
            steps: [
              'Start a new Claude Code session — it loads the latest tools on connect.',
              `If the address changed, run "claude mcp remove ${SERVER_SLUG}" and run the install command again.`,
              'Ask Claude Code to use the app.',
            ],
          },
          {
            title: 'Other MCP clients',
            steps: [
              "Open the client's MCP server or connector settings.",
              'Select the connection created for this app.',
              'Refresh the tool list, reload the server or reconnect it.',
              'If the address changed, paste the latest one from above.',
              'Start a new chat or session and ask the assistant to use the app.',
            ],
          },
        ]
      : [
          {
            title: 'ChatGPT',
            steps: [
              'Откройте настройки приложений ChatGPT и выберите это приложение в разделе «Enabled apps».',
              'Рядом с «Information» нажмите «Refresh».',
              'Если адрес изменился — вставьте актуальный из блока выше.',
              'Начните новый чат и попросите ChatGPT воспользоваться приложением.',
            ],
          },
          {
            title: 'Claude',
            steps: [
              'Откройте страницу Connectors и выберите этот коннектор.',
              'Обновите список инструментов коннектора.',
              'Если адрес изменился — вставьте актуальный из блока выше.',
              'Попросите Claude воспользоваться приложением.',
            ],
          },
          {
            title: 'Claude Code',
            steps: [
              'Запустите новую сессию Claude Code — при подключении он загрузит актуальные инструменты.',
              `Если адрес изменился, выполните «claude mcp remove ${SERVER_SLUG}» и снова запустите команду установки.`,
              'Попросите Claude Code воспользоваться приложением.',
            ],
          },
          {
            title: 'Другие MCP-клиенты',
            steps: [
              'Откройте настройки MCP-серверов или коннекторов в клиенте.',
              'Выберите подключение, созданное для этого приложения.',
              'Обновите список инструментов, перезагрузите сервер или переподключите его.',
              'Если адрес изменился — вставьте актуальный из блока выше.',
              'Начните новый чат или сессию и попросите ассистента воспользоваться приложением.',
            ],
          },
        ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    inLanguage: lang,
  };

  return (
    <div className="min-h-screen bg-background">
      <StaticSEOHead
        title={title}
        description={description}
        canonical="/connect"
        currentLanguage={lang}
        ogType="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="container max-w-3xl mx-auto px-4 py-14 space-y-12">
        <header>
          <Badge variant="secondary" className="mb-4 gap-1">
            <Bot className="h-3 w-3" />
            MCP
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 break-words">{title}</h1>
          <p className="text-muted-foreground break-words">{intro}</p>
        </header>

        <section aria-labelledby="address" className="space-y-3">
          <h2 id="address" className="text-xl font-semibold">
            {lang === 'en' ? 'Server address' : 'Адрес сервера'}
          </h2>
          <CopyField
            value={MCP_URL}
            label={lang === 'en' ? 'MCP server address' : 'Адрес MCP-сервера'}
          />
          <p className="text-sm text-muted-foreground break-words">
            {lang === 'en'
              ? 'This address is public. Your data stays protected: the assistant must sign in as you before it can read or change anything.'
              : 'Адрес публичный. Данные защищены: ассистент сможет что-то читать или менять только после входа в ваш аккаунт.'}
          </p>
        </section>

        <section aria-labelledby="connect" className="space-y-4">
          <h2 id="connect" className="text-xl font-semibold flex items-center gap-2">
            <Plug className="h-5 w-5" />
            {lang === 'en' ? 'Connect' : 'Как подключить'}
          </h2>
          {connect.map((group) => (
            <Card key={group.title} className="p-5 border-0 shadow-none bg-muted/40 space-y-3">
              <h3 className="font-semibold">{group.title}</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                {group.steps.map((s) => (
                  <li key={s} className="break-words">
                    {s}
                  </li>
                ))}
              </ol>
              {group.title === 'Claude' && (
                <Button asChild variant="outline" size="sm">
                  <a href={CLAUDE_DEEPLINK} target="_blank" rel="noopener noreferrer">
                    {lang === 'en' ? 'Open Claude' : 'Открыть Claude'}
                  </a>
                </Button>
              )}
              {group.title === 'Claude Code' && (
                <CopyField
                  value={CLAUDE_CODE_CMD}
                  label={lang === 'en' ? 'Install command' : 'Команда установки'}
                />
              )}
            </Card>
          ))}
        </section>

        <section aria-labelledby="refresh" className="space-y-4">
          <h2 id="refresh" className="text-xl font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {lang === 'en' ? 'Refresh after the app changes' : 'Обновление после изменений в приложении'}
          </h2>
          <p className="text-sm text-muted-foreground break-words">
            {lang === 'en'
              ? 'A connected assistant caches the list of available actions. Refresh the connection to pick up the latest ones.'
              : 'Подключённый ассистент кэширует список доступных действий. Обновите подключение, чтобы получить актуальный список.'}
          </p>
          {refresh.map((group) => (
            <Card key={group.title} className="p-5 border-0 shadow-none bg-muted/40 space-y-3">
              <h3 className="font-semibold">{group.title}</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                {group.steps.map((s) => (
                  <li key={s} className="break-words">
                    {s}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </section>

        <p className="text-sm">
          <Link to="/docs/api" className="text-primary">
            {lang === 'en' ? 'API & agent documentation →' : 'Документация API и агентов →'}
          </Link>
        </p>
      </main>
    </div>
  );
}
