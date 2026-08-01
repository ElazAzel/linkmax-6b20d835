import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

type KeyStatus = {
  key: string;
  configured: boolean;
  source: 'database' | 'environment' | null;
  hint: string | null;
  updatedAt: string | null;
};

const META: Record<string, { label: string; docs: string; help: string }> = {
  UNSPLASH_ACCESS_KEY: {
    label: 'Unsplash',
    docs: 'https://unsplash.com/developers',
    help: 'Access Key приложения Unsplash (бесплатно, demo-режим 50 запросов/час).',
  },
  PEXELS_API_KEY: {
    label: 'Pexels',
    docs: 'https://www.pexels.com/api/',
    help: 'API Key из личного кабинета Pexels (бесплатно, 200 запросов/час).',
  },
};

async function callFn(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('integration-keys', { body: payload });
  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as Record<string, unknown>;
}

export function AdminIntegrationKeysTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<KeyStatus[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callFn({ action: 'status' });
      setKeys((res.keys as KeyStatus[]) ?? []);
    } catch (e) {
      toast.error(t('admin.integrationKeys.loadError', 'Не удалось загрузить статус ключей'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (key: string) => {
    const value = (drafts[key] ?? '').trim();
    if (value.length < 8) {
      toast.error(t('admin.integrationKeys.tooShort', 'Ключ слишком короткий'));
      return;
    }
    setBusy(key);
    try {
      await callFn({ action: 'set', key, value });
      setDrafts(d => ({ ...d, [key]: '' }));
      toast.success(t('admin.integrationKeys.saved', 'Ключ сохранён на сервере'));
      await load();
    } catch (e) {
      toast.error(t('admin.integrationKeys.saveError', 'Не удалось сохранить ключ'));
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const clear = async (key: string) => {
    setBusy(key);
    try {
      await callFn({ action: 'clear', key });
      toast.success(t('admin.integrationKeys.cleared', 'Ключ удалён'));
      await load();
    } catch (e) {
      toast.error(t('admin.integrationKeys.clearError', 'Не удалось удалить ключ'));
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const test = async (key: string) => {
    setBusy(key);
    try {
      const res = await callFn({ action: 'test', key });
      if (res.ok) toast.success(t('admin.integrationKeys.testOk', 'Ключ рабочий'));
      else
        toast.error(
          t('admin.integrationKeys.testFail', 'Провайдер отклонил ключ') +
            (res.status ? ` (${res.status})` : ''),
        );
    } catch (e) {
      toast.error(t('admin.integrationKeys.testError', 'Проверка не удалась'));
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          {t('admin.integrationKeys.title', 'Ключи интеграций')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'admin.integrationKeys.description',
            'Ключи хранятся только на сервере и передаются через защищённую функцию. Клиент никогда не получает значение — только маску.',
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        keys.map(item => {
          const meta = META[item.key];
          return (
            <Card key={item.key} className="p-4 space-y-3 border-0 shadow-none bg-muted/30">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{meta?.label ?? item.key}</span>
                    {item.configured ? (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {item.source === 'database'
                          ? t('admin.integrationKeys.sourceDb', 'В базе')
                          : t('admin.integrationKeys.sourceEnv', 'В окружении')}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {t('admin.integrationKeys.notConfigured', 'Не настроен')}
                      </Badge>
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground break-all">
                    {item.key}
                    {item.hint ? ` · ${item.hint}` : ''}
                  </code>
                  {meta?.help && (
                    <p className="text-xs text-muted-foreground max-w-prose">{meta.help}</p>
                  )}
                </div>
                {meta?.docs && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" asChild>
                    <a href={meta.docs} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="h-3 w-3" />
                      {t('admin.integrationKeys.getKey', 'Получить ключ')}
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={t('admin.integrationKeys.placeholder', 'Вставьте новый ключ')}
                  value={drafts[item.key] ?? ''}
                  onChange={e => setDrafts(d => ({ ...d, [item.key]: e.target.value }))}
                  className="h-11 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    className="h-11 flex-1 sm:flex-none"
                    disabled={busy === item.key || !(drafts[item.key] ?? '').trim()}
                    onClick={() => save(item.key)}
                  >
                    {busy === item.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('common.save', 'Сохранить')
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    disabled={busy === item.key || !item.configured}
                    onClick={() => test(item.key)}
                  >
                    {t('admin.integrationKeys.test', 'Проверить')}
                  </Button>
                  {item.source === 'database' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('admin.integrationKeys.clear', 'Удалить ключ')}
                      className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={busy === item.key}
                      onClick={() => clear(item.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {item.updatedAt && (
                <p className="text-[11px] text-muted-foreground">
                  {t('admin.integrationKeys.updatedAt', 'Обновлён')}:{' '}
                  {new Date(item.updatedAt).toLocaleString()}
                </p>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
