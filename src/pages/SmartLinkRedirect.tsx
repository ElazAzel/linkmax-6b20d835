/**
 * SmartLink public redirect (`/s/:slug`).
 *
 * Клиент делегирует резолвинг edge-функции `smartlink-redirect`, которая
 * атомарно инкрементит счётчик, подшивает UTM и возвращает 302.
 * Здесь только тонкий bridge, чтобы работал прямой заход по короткой ссылке
 * с основного домена (lnkmx.my/s/foo).
 */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

export default function SmartLinkRedirect() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (!slug || !SUPABASE_URL) return;
    const target = `${SUPABASE_URL}/functions/v1/smartlink-redirect/${encodeURIComponent(slug)}`;
    window.location.replace(target);
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  );
}
