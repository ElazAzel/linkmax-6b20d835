# System Architecture

lnkmx follows a **serverless, client-heavy architecture** typical of modern SaaS applications. The frontend handles UI and state, while Supabase provides the backend-as-a-service (BaaS) layer.

## High-Level Overview

```mermaid
graph TD
    User[End User / Creator]
    Visitor[Public Visitor]
    
    subgraph Client [Client Side]
        PWA[React PWA (Vite)]
        PublicPage[Public Page Renderer]
    end
    
    subgraph Backend [Supabase PaaS]
        Auth[GoTrue Auth]
        DB[(PostgreSQL DB)]
        Storage[File Storage]
        Edge[Edge Functions (Deno)]
    end
    
    subgraph External
        Telegram[Telegram API]
        Gemini[Google Gemini AI]
        Email[Resend API]
    end

    User -->|Manages| PWA
    Visitor -->|Views| PublicPage
    
    PWA -->|Auth| Auth
    PWA -->|Data| DB
    PWA -->|Uploads| Storage
    PWA -->|AI/Complex Logic| Edge
    
    PublicPage -->|Reads Content| DB
    PublicPage -->|Submits Forms| Edge
    
    Edge -->|Notify| Telegram
    Edge -->|Generate| Gemini
    Edge -->|Send| Email
```

## Core Components

### 1. Frontend Application (`src/`)
Built with **React 18** and **Vite**, utilizing **TypeScript** for safety.
- **Architecture**: Modular Monolith.
- **State Management**: React Query (Server state) + React Context (Client state).
- **Routing**: React Router DOM (Client-side routing).
- **Styling**: Tailwind CSS + shadcn/ui.

**Key Directories:**
- `domain/`: Business entities and logic (Clean Architecture/DDD approach).
- `services/`: API clients and externals.
- `hooks/`: React integration layers.
- `components/`: UI implementation.

### 2. Backend / Database
Hosted on **Supabase**.
- **PostgreSQL**: Primary data store. Contains all business data.
- **RLS (Row Level Security)**: "Firewall" for the database. Ensures users only access their own data.
- **Realtime**: Used for immediate updates on the dashboard (e.g., new lead alerts).

### 3. Edge Functions
Stateless server-side logic running on Deno.
- **Why?** To handle secret keys (AI, Telegram) and complex validation that shouldn't be trusted to the client.
- **Triggers**: HTTP requests (from Client) or Database Webhooks.

## Data Flow: Page Rendering

1. **Request**: Visitor loads `lnkmx.my/username`.
2. **Fetch**: Frontend calls `rpc/get_page_by_slug('username')`.
3. **Security**: DB verifies page is `published`.
4. **Response**: Returns Page JSON + Blocks JSON.
5. **Render**: Frontend `BlockRenderer` iterates through blocks and renders components.

## Security Model

- **Authentication**: JWT tokens managed by Supabase Auth.
- **Authorization**:
    - **Frontend**: UX-level hiding of buttons/routes.
    - **Backend (Critical)**: RLS policies enforced on every SQL query.
    - **Edge Functions**: Validate JWT signature before execution.

## Scalability Considerations

- **Read Heavy**: The system is designed for high read volume (public pages) vs lower write volume (editors).
- **Caching**: React Query caches data on the client. Public pages rely on Supabase CDN and optimized DB indices.
- **Storage**: Media is served via CDN-backed Supabase Storage.
