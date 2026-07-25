import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; redirect_uris?: string[]; client_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
const oauth = (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

export default function OAuthConsent() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError(t('oauth.missingAuthorizationId', 'Missing authorization_id'));
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?returnTo=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);

      if (!oauth?.getAuthorizationDetails) {
        setError(
          t('oauth.serverDisabled', 'OAuth server is not enabled on this project. Ask the workspace admin to enable managed OAuth.')
        );
        return;
      }

      const res = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (res.error) {
        setError(res.error.message);
        return;
      }
      const immediate = res.data?.redirect_url ?? res.data?.redirect_to;
      if (immediate && !res.data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(res.data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const res = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (res.error) {
      setBusy(false);
      setError(res.error.message);
      return;
    }
    const target = res.data?.redirect_url ?? res.data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError(t('oauth.missingRedirect', 'No redirect returned by the authorization server.'));
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? t('oauth.externalApp', 'External app');

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md p-6 space-y-5">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">{t('oauth.cannotComplete', 'Cannot complete authorization')}</h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              {t('oauth.goBack', 'Go back')}
            </Button>
          </>
        ) : !details ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('oauth.loading', 'Loading authorization...')}
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">
                {t('oauth.connectTitle', 'Connect {{clientName}} to LinkMAX', { clientName })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(
                  'oauth.permissionDescription',
                  '{{clientName}} will be able to call LinkMAX\'s enabled tools while you are signed in{{userSuffix}}.',
                  { clientName, userSuffix: userEmail ? ` ${t('oauth.as', 'as')} ${userEmail}` : '' }
                )}
              </p>
            </div>

            <div className="rounded-md border p-3 text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">{t('oauth.app', 'App')}: </span>
                <span className="font-medium">{clientName}</span>
              </div>
              {details.client?.redirect_uris?.[0] && (
                <div className="break-all">
                  <span className="text-muted-foreground">{t('oauth.redirect', 'Redirect')}: </span>
                  <span className="font-mono text-xs">{details.client.redirect_uris[0]}</span>
                </div>
              )}
              {details.scope && (
                <div>
                  <span className="text-muted-foreground">{t('oauth.scope', 'Scope')}: </span>
                  <span className="font-mono text-xs">{details.scope}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {t('oauth.permissionsNote', 'This does not bypass LinkMAX permissions or database policies. The app can only see your own data.')}
            </p>

            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('oauth.approve', 'Approve')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => decide(false)}
              >
                {t('oauth.cancel', 'Cancel')}
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
