# ADR 0027: Database Trigger Guards instead of RLS for Column Protection

## Status

Accepted (2026-03-15)

## Context

LinkMAX allows users to update their own profiles via Supabase RLS policies. However, certain columns (e.g., `is_premium`, `premium_tier`, `is_verified`) must only be modified by system-level processes (Edge Functions with `service_role`).

RLS `UPDATE` policies are boolean (all or nothing) and do not natively support column-level restrictions based on the user role if the user has access to the row. While complex RLS expressions could potentially check `NEW` vs `OLD` values, it is often brittle and hard to maintain across multiple tables.

## Consequences

### Positive

- **Enhanced Security:** System-critical flags cannot be "toggled" via direct REST API calls.
- **Auditability:** Protection logic is centralized in the database schema.
- **Performance:** Triggers are highly efficient and execute before data is written to disk.

### Negative

- **Hidden Logic:** Developers must be aware that certain PATCH requests will succeed but silently ignore changes to protected columns.
- **Database Logic:** Business rules are now partially split between application code and database triggers.

## Alternatives Considered

- **Custom API Endpoints (Edge Functions):** Too much overhead for simple profile updates.
- **Complex RLS:** Hard to read and test for multiple sensitive columns.

### ✅ All Tables Have RLS Enabled

| Table                 | RLS State   | Protection Mechanism           |
| :-------------------- | :---------- | :----------------------------- |
| `pages`               | Active      | User ownership                 |
| `blocks`              | Active      | Access through page ownership  |
| `user_profiles`       | Active      | Trigger Guard (Sensitive Cols) |
| `leads`               | Active      | User ownership                 |
| `bookings`            | Active      | Owner/customer access only     |
| `analytics`           | Active      | Page owner access for viewing  |
| `token_transactions`  | Restricted  | Edge functions only            |
| `user_wallets`        | Strict      | No Update Policy (Edge Only)   |
| `user_tokens`         | Strict      | No Update Policy (Edge Only)   |
| `teams`               | Masked      | `public_teams` View + RLS      |
| `event_registrations` | Restricted  | Hardened INSERT Policy         |
| `languages`           | Active      | Admin management, public read  |
| `rate_limits`         | Restricted  | Service role access only       |

### 🛡️ Database Hardening Triggers

- **Trigger Function:** A Postgres function defined with `SECURITY DEFINER` that compares `NEW` and `OLD` records.
- **Role Check:** The function checks `auth.jwt() -> 'role'` or if the current session role is `service_role`.
- **Value Reversion:** If an unauthorized role attempts to change a protected column, the trigger forces `NEW.column = OLD.column` before the update is committed.

## Reference Code

```sql
CREATE OR REPLACE FUNCTION protect_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (auth.jwt() ->> 'role' != 'service_role') THEN
    NEW.is_premium := OLD.is_premium;
    NEW.premium_tier := OLD.premium_tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Consequences

### Positive

- **Enhanced Security:** System-critical flags cannot be "toggled" via direct REST API calls.
- **Auditability:** Protection logic is centralized in the database schema.
- **Performance:** Triggers are highly efficient and execute before data is written to disk.

### Negative

- **Hidden Logic:** Developers must be aware that certain PATCH requests will succeed but silently ignore changes to protected columns.
- **Database Logic:** Business rules are now partially split between application code and database triggers.

## Alternatives Considered

- **Custom API Endpoints (Edge Functions):** Too much overhead for simple profile updates.
- **Complex RLS:** Hard to read and test for multiple sensitive columns.

## Consequences

- **Security**: Hardened protection against privilege escalation.
- **Integrity**: Sensitive columns cannot be silently corrupted by client-side bugs.
- **Compliance**: Meets the requirements for financial data handling.
- **Audit**: Security audits must now check both RLS *and* Triggers.
