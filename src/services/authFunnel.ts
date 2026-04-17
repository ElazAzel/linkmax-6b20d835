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

export type AuthFunnelEvent =
  | 'auth_form_view'
  | 'auth_field_focus'
  | 'auth_submit_attempt'
  | 'auth_error'
  | 'auth_success'
  | 'auth_oauth_click'
  | 'auth_tab_switch'
  | 'auth_expand_email';

const SESSION_KEY = 'lnkmx_auth_session_id';

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

export async function trackAuthEvent(
  event: AuthFunnelEvent,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const enriched = {
      ...metadata,
      session_id: getOrCreateSessionId(),
      ts: Date.now(),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      ua_mobile: typeof navigator !== 'undefined'
        ? /Mobi|Android|iPhone/i.test(navigator.userAgent)
        : false,
    };

    // Fire-and-forget; don't block UI
    void (supabase.from('analytics') as any)
      .insert({
        page_id: null,
        block_id: null,
        event_type: `auth:${event}`,
        metadata: enriched,
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
