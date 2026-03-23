# Runbook: Incident Response

Guidelines for handling SEV-1 and SEV-2 incidents.

## 1. Detection
- Alerts from **Sentry**.
- User reports via Support Bot.
- Monitoring dashboard spikes.

## 2. Diagnosis
1.  **Check Sentry**: Identify the root cause (stack trace, breadcrumbs).
2.  **Supabase Logs**: Check Edge Function logs in the Supabase Dashboard.
3.  **Vercel Logs**: Check runtime logs for API or SSR errors.

## 3. Mitigation
- **Temporary Fix**: If a quick fix is possible (e.g., ENV var fix), apply it.
- **Rollback**: If the root cause is a recent deploy and fix is not obvious, **ROLLBACK IMMEDIATELY**.
- **Status Update**: Notify users if the downtime exceeds 15 minutes.

## 4. Communication
- Post updates to the internal Telegram dev group.
- Keep the Product Lead informed.

## 5. Post-Mortem
- After resolution, document what happened, why, and how to prevent it in the future.
- Update this runbook if needed.
