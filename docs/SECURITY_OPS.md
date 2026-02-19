# Security & Operations Guide

> **Objective:** Maintain platform integrity, secure user data, and handle incidents effectively.

## 1. Incident Response (Runbook)

### 1.1 Service Outage
**Symptoms:** Site unreachable, API errors (500s).

1.  **Verify Status**: Check [status.supabase.com](https://status.supabase.com) and [Cloudflare Status](https://www.cloudflarestatus.com/).
2.  **Check Logs**:
    - Supabase Dashboard -> Database -> Postgres Logs.
    - Cloudflare Workers Dashboard -> Logs.
3.  **Communicate**: If downtime > 15 mins, post update to user Telegram channel.
4.  **Mitigate**:
    - If specific feature broken: Disable via Feature Flag (if applicable).
    - If bad deploy: Revert to last stable commit (`git revert HEAD`).
    - If DB load high: Check `pg_stat_statements` for bad queries.

### 1.2 Data Leak / Security Breach
**Symptoms:** Unusual traffic, unauthorized admin access.

1.  **Lockdown**:
    - Rotate all Service Role Keys immediately in Supabase Dashboard.
    - Revoke suspicious sessions: `DELETE FROM auth.sessions WHERE user_id = 'suspect_uid';`.
2.  **Audit**:
    - Check Auth Logs for IP addresses.
    - Review Storage logs for bulk downloads.
3.  **Report**: Notify affected users within 72 hours (GDPR requirement).

---

## 2. Security Checklist

### 2.1 Row Level Security (RLS)
- [ ] **ALWAYS** enable RLS on new tables.
- [ ] **NEVER** use `service_role` key in frontend client.
- [ ] Policies must use `auth.uid()` for user data.
- [ ] Public tables (e.g., `plans`) should be `read-only` for `anon` role.

### 2.2 API Security
- [ ] Edge Functions must verify JWT (or implement custom auth logic).
- [ ] Rate Limit public endpoints (implemented via Upstash or Supabase Edge options).
- [ ] Sanitize inputs (Zod) before processing.

### 2.3 Headers
Ensure these headers are present on all responses:
- `X-Frame-Options: DENY` (or `SAMEORIGIN` for embeds).
- `Content-Security-Policy`: Restrict scripts to trusted domains.
- `Strict-Transport-Security`: Enforce HTTPS.

---

## 3. Data Safety

### 3.1 Backups
- **Automatic**: Supabase performs daily backups.
- **PITR (Point-in-Time Recovery)**: Enabled for pro projects. Allows restoring to any second in the last 7 days.
- **Manual**: Run `supabase db dump` locally before major migrations.

### 3.2 Audit Logs
Supabase logs all administrative actions.
- **Access**: Dashboard -> Project Settings -> Audit Logs.
- **Retention**: 7 days (Free) / 30 days (Pro).

---

## 4. Operational Maintenance

### 4.1 Database Maintenance
- **Vacuuming**: Postgres autovacuum is on. Monitor bloat occasionally.
- **Index Usage**: Review unused indexes to save disk space.

### 4.2 Edge Function Updates
- Deploy with `supabase functions deploy`.
- Always check `deno.land` imports for security updates.
