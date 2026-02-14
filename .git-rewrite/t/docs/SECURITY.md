# Security Checklist - lnkmx Platform

## Overview

This document outlines the security measures implemented in the lnkmx platform and serves as a checklist for security audits.

---

## 1. Authentication & Authorization

### ✅ Implemented

- [x] **Email/Password Authentication** via Supabase Auth
- [x] **JWT Token Management** with 1-hour expiry
- [x] **Auto-confirm Email** enabled for better UX
- [x] **Telegram Verification** for notifications
- [x] **Role-Based Access Control (RBAC)** with `app_role` enum (admin/moderator/user)

### 🔐 Security Measures

- JWT tokens stored securely in httpOnly cookies (Supabase default)
- Session refresh handled automatically by Supabase
- No anonymous signups - all users must register

### ⚠️ Recommendations

- [ ] Enable Leaked Password Protection in Supabase Auth settings
- [ ] Implement rate limiting on auth endpoints
- [ ] Add 2FA option for premium users
- [ ] Add password complexity requirements

---

## 2. Database Security (Row Level Security)

### ✅ All Tables Have RLS Enabled

| Table | RLS | Policies |
|-------|-----|----------|
| `pages` | ✅ | Users can only access their own pages |
| `blocks` | ✅ | Access through page ownership |
| `user_profiles` | ✅ | Users can view all, update own |
| `leads` | ✅ | Users can only access their own leads |
| `bookings` | ✅ | Owner/customer access only |
| `analytics` | ✅ | Page owner access for viewing |
| `token_transactions` | ✅ | User/seller/buyer access |
| `token_withdrawals` | ✅ | User can only view/create own |
| `collaborations` | ✅ | Requester/target access |
| `verification_requests` | ✅ | User can only view/create own |
| `template_purchases` | ✅ | Buyer/seller access |
| `teams` | ✅ | Owner/member access |

### RLS Policy Examples

```sql
-- Users can only view their own leads
CREATE POLICY "Users can view own leads"
ON public.leads FOR SELECT
USING (auth.uid() = user_id);

-- Admin role bypass
CREATE POLICY "Admin full access"
ON public.pages FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

### ⚠️ Known Considerations

- `WITH CHECK (true)` on some INSERT policies for public bookings/analytics (intentional)
- `is_published = true` allows public read access to pages (by design)

---

## 3. API Security

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| API endpoints | 60 requests/minute per IP |
| AI generation | 5 requests/day (free), unlimited (pro) |
| Form submissions | 10 requests/minute per page |

### Implementation

```sql
-- Rate limit table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now()
);
```

### Edge Function Security

- All edge functions validate auth tokens
- CORS headers properly configured
- Input validation on all endpoints
- No secrets exposed in client code

---

## 4. Data Protection

### ✅ Implemented

- [x] **Sensitive Data Encryption** - Passwords hashed by Supabase Auth
- [x] **HTTPS Only** - All traffic encrypted
- [x] **Environment Variables** - Secrets in Edge Functions only
- [x] **No PII in Logs** - Logging sanitized

### Data Categories

| Category | Storage | Access |
|----------|---------|--------|
| User credentials | Supabase Auth (hashed) | Auth system only |
| Personal info | `user_profiles` | User + Admin |
| Payment info | NOT stored locally | External processors |
| Analytics | `analytics` table | Page owner only |

---

## 5. Input Validation

### ✅ Implemented

- [x] **Form Validation** with Zod schemas
- [x] **XSS Prevention** with DOMPurify
- [x] **SQL Injection** prevented by Supabase parameterized queries
- [x] **File Upload Validation** - type and size checks

### Validation Example

```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

const blockSchema = z.object({
  type: z.enum(['text', 'link', 'image', ...]),
  content: z.object({
    text: z.string().max(5000).transform(s => DOMPurify.sanitize(s))
  })
});
```

---

## 6. Storage Security

### Supabase Storage Buckets

| Bucket | Public | Policies |
|--------|--------|----------|
| `avatars` | ✅ | Users can upload/update own |
| `documents` | ❌ | User-specific folders |
| `templates` | ✅ | Read all, write own |

### Storage Policies

```sql
-- Users can only upload to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 7. Infrastructure Security

### Environment Variables

| Variable | Location | Security |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | Public (.env) | ✅ Safe - publishable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (.env) | ✅ Safe - anon key |
| `GEMINI_API_KEY` | Edge Functions | 🔐 Server only |
| `TELEGRAM_BOT_TOKEN` | Edge Functions | 🔐 Server only |

### File Protection

Files that should NOT be in version control:
- `.env.local` (if exists)
- `supabase/functions/.env`
- Any private keys

---

## 8. Compliance

### Legal Requirements (Kazakhstan)

- [x] 14-day refund policy per RK law
- [x] Terms of Service page
- [x] Privacy Policy page
- [x] Payment terms documentation
- [x] Business registration displayed (БИН: 971207300019)

### Data Retention

- User data retained until account deletion
- Analytics data: 2 years
- Logs: 90 days

---

## 9. Monitoring & Incident Response

### Logging

- Supabase Analytics for DB logs
- Edge Function logs via Supabase
- Client-side error tracking

### Incident Response

1. Identify breach via monitoring
2. Isolate affected systems
3. Notify affected users within 72 hours
4. Document and remediate
5. Post-mortem review

---

## 10. Security Testing Checklist

### Pre-deployment

- [ ] Run `supabase--linter` for RLS issues
- [ ] Check for exposed secrets in code
- [ ] Validate all input schemas
- [ ] Test authentication flows
- [ ] Verify rate limiting works

### Regular Audits

- [ ] Monthly RLS policy review
- [ ] Quarterly penetration testing
- [ ] Annual security assessment
- [ ] Dependency vulnerability scanning

---

## Quick Security Commands

```bash
# Check for exposed secrets
git log --all --full-history -- "*.env"

# Run security linter
npm run lint

# Check dependencies
npm audit

# Supabase security scan
# Use supabase--linter tool
```

---

## Contact

Security issues: admin@lnkmx.my

---

*Last updated: 2026-01-15*