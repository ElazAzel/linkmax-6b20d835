/**
 * SmartLink public page (`/s/:slug`).
 *
 * Resolves the destination via the `smartlink-redirect` edge function (JSON mode)
 * and shows a leave-site warning with the full destination before continuing.
 * Why: links are user-created, so visitors must see where they are going.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export default function SmartLinkRedirect() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [dest, setDest] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!slug || !SUPABASE_URL) return;
    const endpoint = `${SUPABASE_URL}/functions/v1/smartlink-redirect/${encodeURIComponent(slug)}?format=json`;
    fetch(endpoint, { headers: ANON_KEY ? { apikey: ANON_KEY } : {} })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((body) => {
        const url = safeHttpUrl(body?.url);
        if (url) setDest(url);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [slug]);

  let host = '';
  if (dest) host = new URL(dest).host;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md flex flex-col gap-4 text-center">
        {failed ? (
          <p className="text-muted-foreground">{t('smartLink.notFound', 'Ссылка не найдена')}</p>
        ) : !dest ? (
          <div className="mx-auto w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              {t('smartLink.leaveTitle', 'Вы переходите на другой сайт')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('smartLink.leaveHint', 'Эта ссылка создана пользователем LinkMAX. Убедитесь, что доверяете сайту:')}
            </p>
            <p className="text-lg font-medium text-foreground break-all">{host}</p>
            <p className="text-xs text-muted-foreground break-all">{dest}</p>
            <Button asChild>
              <a href={dest} rel="noopener noreferrer nofollow">
                {t('smartLink.continue', 'Продолжить')}
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
