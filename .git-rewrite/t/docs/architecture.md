# Architecture Overview

This project follows a clean-architecture-inspired layout with clear separation between
UI, application workflows, domain logic, and infrastructure integrations.

## Layers

1. **Presentation**
   - `src/pages/` route-level screens (21 pages).
   - `src/components/` reusable UI and page sections (30+ directories).
   - `src/hooks/` UI orchestration and data fetching coordination (50+ hooks).

2. **Application**
   - `src/use-cases/` orchestrates multi-step workflows (e.g., page creation, publishing).
   - `src/services/` encapsulates business logic that crosses boundaries (14 services).

3. **Domain**
   - `src/domain/` entities and domain rules (Block, Page, User).
   - `src/types/` shared interfaces and DTOs.

4. **Infrastructure / Platform**
   - `src/platform/supabase/` Supabase client setup and generated types.
   - `src/repositories/` Supabase-backed data access implementations.
   - `supabase/functions/` 20 Edge Functions for backend logic.

5. **Testing**
   - `src/testing/` shared fixtures and test setup.

## Data Flow

```
UI Components/Pages
       ↓
    Hooks
       ↓
Use Cases / Services
       ↓
   Repositories
       ↓
Supabase (Platform)
```

## Component Structure

### Pages (src/pages/)

| Page              | Purpose                      |
| ----------------- | ---------------------------- |
| `LandingV5.tsx`   | Main landing page (v5)       |
| `Index.tsx`       | Legacy landing               |
| `Dashboard.tsx`   | User dashboard (legacy)      |
| `DashboardV2.tsx` | User dashboard (current)     |
| `PublicPage.tsx`  | User's public bio page       |
| `Gallery.tsx`     | Community gallery            |
| `Auth.tsx`        | Authentication               |
| `Admin.tsx`       | Admin panel                  |
| `Pricing.tsx`     | Pricing page                 |
| `TeamPage.tsx`    | Team pages                   |

### Component Directories (src/components/)

| Directory       | Purpose                           |
| --------------- | --------------------------------- |
| `blocks/`       | 28 block type renderers           |
| `block-editors/`| Block editing modals              |
| `dashboard-v2/` | Dashboard v2 components           |
| `landing-v5/`   | Landing page v5 sections          |
| `motion/`       | Animation system                  |
| `ui/`           | Base shadcn/ui components         |
| `admin/`        | Admin panel components            |
| `analytics/`    | Analytics visualizations          |
| `auth/`         | Auth forms                        |
| `crm/`          | Lead management                   |
| `editor/`       | Page editor                       |
| `gallery/`      | Gallery components                |
| `onboarding/`   | Onboarding flow                   |
| `settings/`     | User settings                     |
| `templates/`    | Template marketplace              |
| `tokens/`       | Token economy UI                  |

### Hooks (src/hooks/)

50+ specialized hooks covering:
- Authentication (`useAuth`, `useAdminAuth`)
- Data fetching (`useLeads`, `useFriends`, `useGallery`)
- UI state (`useBlockEditor`, `useGridLayout`)
- Analytics (`useAnalyticsTracking`, `useFunnelAnalytics`)
- Features (`usePremiumStatus`, `useStreak`, `useTokens`)

### Services (src/services/)

| Service           | Purpose                      |
| ----------------- | ---------------------------- |
| `pages.ts`        | Page CRUD operations         |
| `user.ts`         | User profile management      |
| `analytics.ts`    | Analytics tracking           |
| `collaboration.ts`| Collaboration features       |
| `events.ts`       | Event management             |
| `friends.ts`      | Friend system                |
| `gallery.ts`      | Gallery operations           |
| `quests.ts`       | Quest/challenge system       |
| `referral.ts`     | Referral program             |
| `social.ts`       | Social features              |
| `streak.ts`       | Streak tracking              |
| `tokens.ts`       | Token economy                |

## Motion System

Located in `src/components/motion/`:

```tsx
import { Reveal, Stagger } from '@/components/motion';

// Single element reveal
<Reveal direction="fade-up" delay={0.1}>
  <Card>...</Card>
</Reveal>

// Staggered children
<Stagger staggerDelay={0.1}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Stagger>
```

Features:
- CSS-based animations (transform/opacity)
- IntersectionObserver for scroll triggers
- `prefers-reduced-motion` support
- Directions: `fade-up`, `fade-left`, `fade-right`, `scale`

## Cross-cutting Concerns

- **i18n**: `src/i18n/` houses localization config and dictionaries (RU/EN/KK).
- **Utilities**: `src/lib/` contains shared helpers and utilities.
- **Contexts**: `src/contexts/` for global state (theme, auth, etc.).

## Notes for Future Changes

- Prefer adding new external integrations under `src/platform/` to keep infrastructure
  concerns isolated.
- Keep domain entities free of React or infrastructure dependencies.
- When adding a new workflow, start in `use-cases/` and only add services if logic
  spans multiple repositories or external systems.
- See `docs/DEPENDENCY_MAP.md` for dependency rules, analysis commands, and quality gates.
- New blocks must be added to `src/lib/block-registry.ts` (single source of truth).
