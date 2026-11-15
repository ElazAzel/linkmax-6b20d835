import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Send from 'lucide-react/dist/esm/icons/send';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PremiumFeatureGate } from '@/components/billing/PremiumFeatureGate';
import { supabase } from '@/platform/supabase/client';
import type { PageIntegrations } from '@/types/page';
import { GroupTitle } from './shared';
import { generateWebhookSecret, isValidWebhookUrl } from './helpers';

type TrackingField = 'fb_pixel' | 'tt_pixel' | 'ga4_id' | 'yandex_metrika';

const TRACKING_FIELDS: Array<{
  key: TrackingField;
  labelKey: string;
  label: string;
  placeholder: string;
  hintKey: string;
  hint: string;
  normalize: (value: string) => string;
}> = [
  { key: 'fb_pixel', labelKey: 'settings.integrations.fbPixel', label: 'Meta Pixel ID', placeholder: '1234567890', hintKey: 'settings.integrations.fbHint', hint: 'Events Manager → Источники данных → Pixel ID', normalize: (v) => v.replace(/\D/g, '') },
  { key: 'tt_pixel', labelKey: 'settings.integrations.ttPixel', label: 'TikTok Pixel ID', placeholder: 'C1234567890', hintKey: 'settings.integrations.ttHint', hint: 'TikTok Ads → Assets → Events → Pixel Code', normalize: (v) => v.trim() },
  { key: 'ga4_id', labelKey: 'settings.integrations.ga4Id', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX', hintKey: 'settings.integrations.ga4Hint', hint: 'GA4 → Admin → Data Streams → Measurement ID', normalize: (v) => v.trim().toUpperCase() },
  { key: 'yandex_metrika', labelKey: 'settings.integrations.yandexMetrika', label: 'Яндекс Метрика', placeholder: '12345678', hintKey: 'settings.integrations.yandexHint', hint: 'Метрика → Настройки → Номер счётчика', normalize: (v) => v.replace(/\D/g, '') },
];

function readTracking(integrations?: PageIntegrations): Record<TrackingField, string> {
  return {
    fb_pixel: integrations?.fb_pixel ?? '',
    tt_pixel: integrations?.tt_pixel ?? '',
    ga4_id: integrations?.ga4_id ?? '',
    yandex_metrika: integrations?.yandex_metrika ?? '',
  };
}

function TrackingSettings({ integrations, onSave, onSaved }: {
  integrations?: PageIntegrations;
  onSave: (integrations: PageIntegrations) => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<TrackingField, string>>(() => readTracking(integrations));

  useEffect(() => {
    setValues(readTracking(integrations));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only when a stored ID changes
  }, [integrations?.fb_pixel, integrations?.tt_pixel, integrations?.ga4_id, integrations?.yandex_metrika]);

  const commit = (key: TrackingField) => {
    const value = values[key];
    if ((integrations?.[key] ?? '') === value) return;
    const next: PageIntegrations = { ...integrations };
    if (value) next[key] = value;
    else delete next[key];
    onSave(next);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <GroupTitle>{t('settings.integrations.title', 'Пиксели и аналитика')}</GroupTitle>
        <p className="text-xs text-muted-foreground">
          {t('settings.integrations.description', 'Подключите пиксели для отслеживания конверсий. События PageView, Lead, Purchase и клики по блокам отправляются автоматически.')}
        </p>
      </div>
      {TRACKING_FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={`tracking-${field.key}`} className="flex items-center gap-2">
            <span>{t(field.labelKey, field.label)}</span>
            {values[field.key] && <span className="h-2 w-2 rounded-full bg-success" aria-hidden />}
          </Label>
          <Input
            id={`tracking-${field.key}`}
            value={values[field.key]}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: field.normalize(e.target.value) }))}
            onBlur={() => commit(field.key)}
            placeholder={field.placeholder}
            className="h-12 rounded-xl font-mono text-sm"
            inputMode={field.key === 'fb_pixel' || field.key === 'yandex_metrika' ? 'numeric' : 'text'}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-[11px] text-muted-foreground">{t(field.hintKey, field.hint)}</p>
        </div>
      ))}
    </div>
  );
}

type TestResult = { ok: boolean; status?: number; durationMs?: number };

interface IntegrationsSectionProps {
  isPremium: boolean;
  pageSlug?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  integrations?: PageIntegrations;
  onUpdateIntegrations?: (integrations: PageIntegrations) => void;
  onUpdateWebhooks?: (data: { webhook_url?: string; webhook_secret?: string }) => void;
  onSaved: () => void;
}

export const IntegrationsSection = memo(function IntegrationsSection({
  isPremium, pageSlug, webhookUrl, webhookSecret, integrations,
  onUpdateIntegrations, onUpdateWebhooks, onSaved,
}: IntegrationsSectionProps) {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState(webhookUrl || '');
  const [secretInput, setSecretInput] = useState(webhookSecret || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const saved = useRef({ url: webhookUrl || '', secret: webhookSecret || '' });

  const commit = (next?: { secret?: string }) => {
    const url = urlInput.trim();
    const secret = next?.secret ?? secretInput;
    if (url !== urlInput) setUrlInput(url);
    if (url === saved.current.url && secret === saved.current.secret) return;
    if (url && !isValidWebhookUrl(url)) {
      setUrlError(t('dashboard.pageSettings.webhookUrlInvalid', 'Нужен адрес, который начинается с https://'));
      return;
    }
    if (!onUpdateWebhooks) return;
    saved.current = { url, secret };
    onUpdateWebhooks({ webhook_url: url || undefined, webhook_secret: secret || undefined });
    onSaved();
  };

  const handleGenerateSecret = () => {
    const secret = generateWebhookSecret();
    setSecretInput(secret);
    setShowSecret(true);
    commit({ secret });
  };

  const handleTest = async () => {
    const url = urlInput.trim();
    if (!isValidWebhookUrl(url)) {
      setUrlError(t('dashboard.pageSettings.webhookUrlInvalid', 'Нужен адрес, который начинается с https://'));
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke<TestResult>('test-webhook', {
        body: { url, secret: secretInput || undefined, page_slug: pageSlug },
      });
      if (error || !data) throw error ?? new Error('empty response');
      setTestResult(data);
    } catch {
      setTestResult(null);
      toast.error(t('dashboard.pageSettings.webhookTestUnavailable', 'Не удалось отправить тестовый запрос. Попробуйте позже'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {onUpdateIntegrations && (
        <TrackingSettings integrations={integrations} onSave={onUpdateIntegrations} onSaved={onSaved} />
      )}

      <div className="space-y-3 border-t border-border pt-5">
        <div className="space-y-1">
          <GroupTitle>
            {t('dashboard.pageSettings.webhooks', 'Вебхук для заявок')}
            {!isPremium && <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-xs uppercase text-primary">PRO</Badge>}
          </GroupTitle>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.pageSettings.webhookHint', 'При каждой новой заявке отправим POST-запрос с её данными на ваш сервер, в CRM или Zapier.')}
          </p>
        </div>
        <PremiumFeatureGate requiredTier="pro" outcomeKey="generic">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-webhook-url">{t('dashboard.pageSettings.webhookUrl', 'Адрес вебхука')}</Label>
              <Input
                id="page-webhook-url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); setTestResult(null); }}
                onBlur={() => commit()}
                placeholder="https://your-server.com/webhook"
                className="h-12 rounded-xl font-mono text-sm"
                disabled={!isPremium}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!urlError}
              />
              {urlError && <p role="alert" className="text-xs text-destructive">{urlError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-webhook-secret">
                {t('dashboard.pageSettings.webhookSecret', 'Секретный ключ')} ({t('common.optional', 'необязательно')})
              </Label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Input
                    id="page-webhook-secret"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    onBlur={() => commit()}
                    className="h-12 rounded-xl pr-12 font-mono text-sm"
                    disabled={!isPremium}
                    type={showSecret ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecret((prev) => !prev)}
                    aria-label={showSecret
                      ? t('dashboard.pageSettings.hideSecret', 'Скрыть ключ')
                      : t('dashboard.pageSettings.showSecret', 'Показать ключ')}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 shrink-0 rounded-xl"
                  onClick={handleGenerateSecret}
                  disabled={!isPremium}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('dashboard.pageSettings.generateSecret', 'Создать')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.pageSettings.webhookSecretHint', 'Ключ придёт в заголовке X-LinkMAX-Secret. По нему ваш сервер поймёт, что запрос отправили мы.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => void handleTest()}
                disabled={!isPremium || !urlInput || testing}
                loading={testing}
                data-testid="webhook-test"
              >
                <Send className="mr-2 h-4 w-4" />
                {t('dashboard.pageSettings.webhookTest', 'Отправить тестовую заявку')}
              </Button>
              {testResult?.ok && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-success" data-testid="webhook-test-result">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('dashboard.pageSettings.webhookTestOk', 'Сервер ответил {{status}} за {{ms}} мс', { status: testResult.status, ms: testResult.durationMs })}
                </span>
              )}
              {testResult && !testResult.ok && (
                <span className="flex items-center gap-1.5 text-sm text-destructive" data-testid="webhook-test-result">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {testResult.status
                    ? t('dashboard.pageSettings.webhookTestBadStatus', 'Сервер ответил с ошибкой {{status}}', { status: testResult.status })
                    : t('dashboard.pageSettings.webhookTestNoAnswer', 'Сервер не ответил за 8 секунд или адрес недоступен')}
                </span>
              )}
            </div>
          </div>
        </PremiumFeatureGate>
      </div>
    </>
  );
});
