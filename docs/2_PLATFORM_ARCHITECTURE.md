# 2. Platform Architecture

> **Status:** Active
> **Last Updated:** February 18, 2026
> **Based on:** `PLATFORM_SNAPSHOT.md`

---

## 1. High-Level Architecture
**lnkmx** is a modern, serverless Single Page Application (SPA) built for extreme performance, scalability, and zero-maintenance operations.

### Core Stack
*   **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS, shadcn/ui.
*   **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime).
*   **Edge Logic**: Supabase Edge Functions (Deno) + Cloudflare Workers.
*   **Hosting**: Static delivery via CDN (Vercel/Netlify equivalent).

---

## 2. Component Diagram

```mermaid
graph TD
    User[End User / Visitor] -->|HTTPS| CF[Cloudflare Worker]
    CF -->|Bot/Crawler| SEO[SSR HTML Generator]
    CF -->|Human| SPA[React Client (Vite)]
    
    SPA -->|Data/Auth| Supabase[Supabase Platform]
    
    subgraph Supabase
        Auth[GoTrue Auth]
        DB[(PostgreSQL)]
        Storage[S3 Storage]
        Realtime[WebSockets]
        Edge[Edge Functions (Deno)]
    end
    
    Edge -->|AI Generation| Gemini[Google Gemini API]
    Edge -->|Emails| Resend[Resend API]
    Edge -->|Payment| Robo[Robokassa/Kaspi]
    Edge -->|Notifications| Tele[Telegram Bot API]
```

---

## 3. Key Technical Decisions

### 3.1. "Serverless-First" Philosophy
We do not manage servers. All backend logic is event-driven (Edge Functions) or database-native (Postgres Triggers/RLS).
*   **Benefit**: Zero dev-ops overhead; scales to millions of hits automatically.
*   **Cost**: Low/Zero for idle usage; pay-as-you-go.

### 3.2. Row Level Security (RLS)
Security is handled at the database layer, not the application layer.
*   **Policy**: `users` can only select/update rows where `user_id == auth.uid()`.
*   **Public Access**: `pages` and `blocks` are publicly readable but owner-writable.
*   **Safety**: Even if the frontend is compromised, the DB rejects unauthorized queries.

### 3.3. Optimistic UI & Local First
The editor experience feels instant.
*   **Mechanism**: Changes are applied to local state immediately (`useCloudPageState.ts`), then synced to Supabase in the background with debouncing (1.5s).
*   **Versioning**: `page_snapshots` table keeps history of edits for rollback.

---

## 4. Data Model (Core Entities)
*See `PLATFORM_SNAPSHOT.md` for full schema.*

| Entity | Description | Key Relationships |
| :--- | :--- | :--- |
| **`pages`** | The root object. Contains slug, theme, metadata. | Belongs to `user_profile`. Has many `blocks`. |
| **`blocks`** | Content units (Text, Image, Form). JSON config. | Belongs to `page`. |
| **`leads`** | CRM entry. Captures form data. | Belongs to `page`. Has many `lead_interactions`. |
| **`bookings`** | Time-based reservations. | Belongs to `page`. Linked to `booking_slots`. |
| **`analytics`** | Event log (Video view, Link click). | Belongs to `page` and `block`. |

---

## 5. Security & Privacy
*   **Authentication**: Native Supabase Auth (Email/Password + OAuth).
*   **Repo Security**: Private repository. No secrets in code (env vars only).
*   **Data Isolation**: Strict RLS policies ensure cross-tenant data isolation.
*   **Compliance**: Ready for GDPR/CCPA export compliance via `dump_user_data` RPC.

---

## 6. Integration Architecture
*   **AI (Gemini)**: Used for "Magic Draft" and translation. Called via Edge Function to hide API keys.
*   **Telegram**: deeply integrated for notifications. Users link their TG account to receive "New Lead" push alerts instantly.
*   **Pixels**: We proxy pixel events (FB, TikTok) to prevent ad-blockers where possible and simplify configuration for users.

---
**Reference**: For direct code paths and deep-dive details, refer to `docs/PLATFORM_SNAPSHOT.md`.
