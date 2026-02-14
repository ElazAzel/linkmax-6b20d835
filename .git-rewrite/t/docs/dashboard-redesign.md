# Dashboard Redesign v2.0

## Information Architecture (IA)

### New Section Structure

```
Dashboard/
├── Home (Overview)     → /dashboard
├── Pages (My pages)    → /dashboard/pages
├── Activity (Inbox)    → /dashboard/activity
├── Insights (Analytics)→ /dashboard/insights
├── Monetize           → /dashboard/monetize
└── Settings           → /dashboard/settings
```

### Navigation Pattern

**Mobile (bottom nav):**
- 5 main tabs: Home, Pages, Activity, Insights, Settings
- "More" sheet for: Monetize, Templates, Marketplace

**Desktop (left sidebar):**
- Full sidebar with all sections
- Collapsible for more canvas space
- Top header with context actions

## Screen Specifications

### 1. Home (Overview)
**Purpose:** At-a-glance status and next step

**Sections:**
- Primary card: Main page status (draft/published, edit, publish)
- Quick stats: Views, leads, conversions this week
- Quick actions grid: Edit page, Add block, Share link
- AI recommendations: "Improve your page" suggestions

### 2. Pages
**Purpose:** Manage all pages

**Sections:**
- Page cards with: cover, title, slug, status, last updated
- Quick actions: Edit, Preview, Share, Duplicate
- Create page FAB (mobile)
- Search + filter (draft/published)

### 3. Activity (Inbox)
**Purpose:** Unified inbox for all incoming

**Tabs:**
- Leads (form submissions)
- Bookings (appointments)
- Messages (if applicable)
- Event registrations

**Features:**
- Status filters (new, handled)
- Page filter
- Mark as done
- Export

### 4. Insights (Analytics)
**Purpose:** Simple, actionable metrics

**Sections:**
- Period selector (7/30/90 days)
- KPI cards: views, CTR, leads, revenue
- Top blocks performance
- Traffic sources
- AI recommendations

### 5. Monetize
**Purpose:** Premium and billing

**Sections:**
- Current plan + limits
- Upgrade CTA
- Feature comparison
- Billing history

### 6. Settings
**Purpose:** Account configuration

**Groups:**
- Profile & account
- Page settings (niche, background)
- Notifications (email, telegram)
- Appearance (language)
- Templates & achievements
- Security

## UI Contract

### Spacing Scale
- 4, 8, 12, 16, 24, 32, 48, 64

### Typography
- H1: text-2xl font-black
- H2: text-xl font-bold  
- H3: text-lg font-semibold
- Body: text-base
- Caption: text-sm text-muted-foreground
- Small: text-xs

### Buttons
- Primary: h-14 rounded-2xl font-bold shadow-lg
- Secondary: h-12 rounded-xl variant="secondary"
- Ghost: h-10 rounded-xl variant="ghost"
- Icon: h-12 w-12 rounded-2xl

### Cards
- Default: rounded-2xl border border-border/50 bg-card
- Glass: glass-card (bg-card/90 backdrop-blur-xl)
- Gradient: bg-gradient-to-br from-X/10 to-Y/10

### Status Badges
- Draft: bg-amber-500/20 text-amber-600
- Published: bg-emerald-500/20 text-emerald-600
- Error: bg-destructive/20 text-destructive
- New: bg-blue-500/20 text-blue-600

### States (required for all interactive)
- default, hover, active, disabled
- loading (skeleton/spinner)
- error (inline + toast)
- empty (illustration + CTA)

## i18n Structure

Namespace: `dashboard.*`

```typescript
{
  "dashboard": {
    "home": {
      "title": "Главная",
      "subtitle": "Обзор",
      // ...
    },
    "pages": {
      "title": "Страницы",
      // ...
    },
    "activity": {
      "title": "Активность",
      "tabs": {
        "leads": "Заявки",
        "bookings": "Записи"
      }
    },
    "insights": {
      "title": "Аналитика"
    },
    "monetize": {
      "title": "Монетизация"
    },
    "settings": {
      "title": "Настройки"
    },
    "common": {
      "loading": "Загрузка...",
      "error": "Ошибка",
      "retry": "Повторить",
      "save": "Сохранить",
      "cancel": "Отмена"
    }
  }
}
```

## Component Structure

```
src/components/dashboard-v2/
├── layout/
│   ├── DashboardLayout.tsx      # Main layout wrapper
│   ├── DashboardSidebar.tsx     # Desktop sidebar
│   ├── DashboardBottomNav.tsx   # Mobile bottom nav
│   ├── DashboardHeader.tsx      # Context header
│   └── MoreSheet.tsx            # Mobile overflow menu
├── screens/
│   ├── HomeScreen.tsx           # Overview
│   ├── PagesScreen.tsx          # Pages list
│   ├── PageOverview.tsx         # Single page details
│   ├── ActivityScreen.tsx       # Inbox
│   ├── InsightsScreen.tsx       # Analytics
│   ├── MonetizeScreen.tsx       # Premium/billing
│   └── SettingsScreen.tsx       # Settings
├── common/
│   ├── StatCard.tsx             # KPI card
│   ├── ActionCard.tsx           # Quick action
│   ├── EmptyState.tsx           # Empty state
│   ├── ErrorState.tsx           # Error state
│   ├── LoadingSkeleton.tsx      # Loading
│   └── StatusBadge.tsx          # Status indicator
└── index.ts
```

## Migration Strategy

1. Create new components in `dashboard-v2/`
2. Add new routes under `/dashboard/*`
3. Keep old routes working as aliases
4. Feature flag for gradual rollout (optional)
5. Remove old components after validation

## Testing Requirements

### Unit Tests
- Navigation routes work
- i18n keys exist
- Component rendering

### Integration
- Pages list loads
- Create/edit page flow
- Publish/unpublish

### E2E (Playwright)
- Mobile: full user journey
- Desktop: same journey
- No layout overlaps
