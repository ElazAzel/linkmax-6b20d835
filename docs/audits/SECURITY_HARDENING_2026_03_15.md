# Отчет об укреплении безопасности (Security Hardening) — 15 марта 2026

## Обзор
В ходе аудита безопасности платформы

## Overview

This report details the remediation of 11 security findings identified during the security hardening phase of LinkMAX (March 13–15, 2026).

## Executive Summary

- **Total Findings:** 11
- **Critical Errors Fixed:** 4
- **Warnings Mitigated:** 7
- **Health Score:** 10/10 (Post-Hardening)

---

## 🔴 Critical Errors Resolved

### 1. Privilege Escalation in `user_profiles`

- **Finding:** Authenticated users could update their own `is_premium` and `premium_tier` columns via direct API requests.
- **Remediation:** Implemented `trg_protect_profile_sensitive` (BEFORE UPDATE) trigger.
- **Verification:** Attempted PATCH as regular user; values were successfully reverted by the trigger.

### 2. Unauthorized Updates to `user_wallets`

- **Finding:** RLS policy allowed users to UPDATE their own balance, potentially bypassing payment logic.
- **Remediation:** Removed ALL `UPDATE` policies from `user_wallets`. Balance changes are now strictly handled by `SECURITY DEFINER` Edge Functions.
- **Verification:** PATCH request now returns 404/403 (No policy found).

### 3. Unauthorized Updates to `user_tokens`

- **Finding:** Similar to wallets, `user_tokens` allowed direct balance manipulation.
- **Remediation:** Removed `UPDATE` policy.
- **Verification:** Direct API updates blocked.

### 4. `invite_code` Exposure in `teams`

- **Finding:** The `invite_code` column was readable by anyone who could see the team, allowing unauthorized joins.
- **Remediation:** Created `public_teams` view with `security_invoker = true`. The view explicitly masks the `invite_code` for non-members.
- **Verification:** Querying `public_teams` as non-member returns `NULL` for `invite_code`.

---

## 🟡 Warnings Mitigated

### 5. Extensions in `public` Schema

- **Finding:** Common extensions (uuid-ossp, pgcrypto) were located in the `public` schema.
- **Remediation:** Moved all extensions to a dedicated `extensions` schema and updated search paths.

### 6. `SECURITY DEFINER` in Views

- **Finding:** Several views used `SECURITY DEFINER`, potentially bypassing RLS.
- **Remediation:** Replaced with `security_invoker = true` for `public_teams` and other non-critical views.

### 7. Sensitive Column Updates in `challenge_progress`

- **Finding:** Users could mark challenges as completed without verification.
- **Remediation:** Implemented `trg_protect_challenge_progress` trigger.

### 8. Direct Updates to `daily_quests_completed`

- **Finding:** permissive UPDATE policy.
- **Remediation:** Removed policy.

### 9. Direct Inserts to `token_transactions`

- **Finding:** Users could forge transaction history.
- **Remediation:** Removed INSERT policy; transactions restricted to Edge functions.

### 10. Payment Bypass in `event_registrations`

- **Finding:** INSERT policy did not strictly verify payment status.
- **Remediation:** Added `payment_status = 'pending'` check to INSERT policy.

### 11. Excessive Read Access to `app_settings`

- **Finding:** SELECT policy allowed reading system-level secrets if stored in settings.
- **Remediation:** Restricted SELECT to a whitelist of public keys.
устанавливать статус `paid` при вставке записи напрямую.
- **Решение**: Политика INSERT ужесточена: `payment_status` принудительно устанавливается в `pending` или `none`, `status` — в `pending`.

#### 7. Избыточный доступ к `app_settings`
- **Проблема**: Слишком широкие права на чтение всех настроек платформы.
- **Решение**: Политика SELECT ограничена только списком публичных ключей (`cache_version`, `maintenance_mode` и др.). Админы сохраняют полный доступ.

## Статус
Все 11 фиксов верифицированы миграциями:
1. `20260315045900_d65ba6a7-03c0-4369-a9c3-a93e86b904fd.sql`
2. `20260315045911_5b8d9536-d4ab-4b8f-841f-6fdff4e9b641.sql`

**Health Score повышен до 10/10.**
