/**
 * Auth Funnel Tracker
 * Lightweight tracker for the /auth conversion funnel.
 * Writes to the existing `analytics` table with page_id=null
 * and event_type prefixed with `auth:`.
 *
 * Used to identify drop-off points in the signup flow.
 */

import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { Json } from '@/platform/supabase/types';

export type AuthFunnelEvent =
  | 'auth_form_view'
  | 'auth_field_focus'
  | 'auth_submit_attempt'
  | 'auth_error'
  | 'auth_success'
  | 'auth_oauth_click'
  | 'auth_tab_switch'
  | 'auth_expand_email'
  | 'auth_more_options_expand';

const SESSION_KEY = 'lnkmx_auth_session_id';
const SIGNUP_CONTEXT_KEYS = {
  from: 'lnkmx_signup_from',
  niche: 'lnkmx_signup_niche',
  refSlug: 'lnkmx_signup_ref_slug',
  desiredSlug: 'lnkmx_signup_desired_slug',
} as const;

function getOrCreateSessionId(): string {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `auth_${Date.now()}`;
  }
}

function getStoredContext(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function getAuthContext(): Record<string, Json | undefined> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const returnTo = params.get('returnTo') || hashParams.get('returnTo') || undefined;

  return {
    source: params.get('from') || getStoredContext(SIGNUP_CONTEXT_KEYS.from) || undefined,
    niche: params.get('niche') || getStoredContext(SIGNUP_CONTEXT_KEYS.niche) || undefined,
    ref_slug: params.get('ref_slug') || getStoredContext(SIGNUP_CONTEXT_KEYS.refSlug) || undefined,
    desired_slug:
      params.get('username') ||
      params.get('slug') ||
      getStoredContext(SIGNUP_CONTEXT_KEYS.desiredSlug) ||
      undefined,
    return_to: returnTo,
  };
}

export async function trackAuthEvent(
  event: AuthFunnelEvent,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const enriched = {
      ...getAuthContext(),
      ...metadata,
      session_id: getOrCreateSessionId(),
      ts: Date.now(),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      ua_mobile: typeof navigator !== 'undefined'
        ? /Mobi|Android|iPhone/i.test(navigator.userAgent)
        : false,
    };

    // Fire-and-forget; don't block UI
    void supabase
      .from('analytics')
      .insert({
        page_id: null,
        block_id: null,
        event_type: `auth:${event}`,
        metadata: enriched as Json,
      })
      .then(({ error }) => {
        if (error) {
          logger.debug('Auth funnel insert failed', { context: 'authFunnel', data: error });
        }
      });
  } catch (err) {
    logger.debug('Auth funnel error', { context: 'authFunnel', data: err });
  }
}
