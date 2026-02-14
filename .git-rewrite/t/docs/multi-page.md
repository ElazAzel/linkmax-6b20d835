# Multi-Page Architecture

## Overview

Users can create multiple pages, with limits based on their plan:
- **Free**: 1 page
- **Pro**: 6 pages (1 primary paid + 5 additional)

## Database Schema

New columns on `pages` table:
- `is_paid` (boolean) - Whether page has paid features
- `is_primary_paid` (boolean) - The one page included in Pro subscription
- `page_type` (text) - 'free' | 'paid_addon' | 'primary_paid'

## Plan Limits

| Plan | Max Pages | Primary Paid | Free Pages | Add-on Upgrades |
|------|-----------|--------------|------------|-----------------|
| Free | 1         | 0            | 1          | No              |
| Pro  | 6         | 1            | 5          | Yes (70% price) |

## RPC Functions

### `check_page_limits(user_id)` → jsonb
Returns current page counts and whether user can create more.
```json
{
  "tier": "free|pro",
  "current_pages": 1,
  "max_pages": 1,
  "paid_pages": 0,
  "free_pages": 1,
  "can_create": false
}
```

### `create_user_page(user_id, title, slug)` → jsonb
Creates a new page with limit enforcement.
- Validates slug (3-30 chars, a-z0-9-)
- Auto-generates unique slug if conflict
- Creates default profile block
- Returns new page_id and slug

### `set_primary_paid_page(user_id, page_id)` → jsonb
Sets which page is the primary paid page (Pro only).
- Ensures only one page can be primary_paid
- Requires Pro tier

### `get_user_pages(user_id)` → jsonb
Returns array of all user pages with metadata.

## Frontend Components

### `useMultiPage` Hook
Manages page list, active page, limits, and CRUD operations.
- `pages` - List of user pages with full metadata
- `activePage` - Currently selected page object
- `activePageId` - Currently selected page ID
- `limits` - Plan limits and usage info
- `switchPage(pageId)` - Switch active page context
- `createPage(title, slug)` - Create new page with limit enforcement
- `deletePage(pageId)` - Delete a page (except last one)
- `updatePageSlug(pageId, newSlug)` - Change page URL
- `setPrimaryPaidPage(pageId)` - Set primary paid page (Pro only)

### `PageSwitcher` Component
- Desktop: Dropdown menu in header
- Mobile: Bottom sheet with search
- Shows page status badges (Free/Paid/Add-on)
- Quick create and manage actions

### `CreatePageDialog` Component
Modal for creating new pages with limit enforcement.
- Title and slug input
- Slug validation
- Upgrade prompt for Free users at limit

### Settings Screens
Two separate settings screens:
- **PageSettingsScreen** - Page-scoped: slug, SEO, branding, niche
- **AccountSettingsScreen** - User-scoped: profile, billing, language, security

## Page Context

- Active page stored in localStorage (`linkmax_active_page_id`)
- URL-based routing: `/dashboard?tab=pages`
- Settings are split: Page Settings vs Account Settings

## Slug Rules

- 3-30 characters
- Lowercase letters, numbers, hyphens only
- Must be unique globally
- Forms subdomain: `{slug}.lnkmx.my`

## Page Types

1. **Free Page**: Basic page without paid features
2. **Primary Paid**: The one paid page included in Pro subscription
3. **Paid Add-on**: Additional pages upgraded to paid (70% of Pro price)

## Settings Architecture

### Page Settings (page-scoped)
- Domain/Slug configuration
- SEO (title, description, keywords)
- Branding (theme, colors)
- Visibility settings

### Account Settings (user-scoped)
- Profile information
- Plan/Billing
- Language preference
- Security settings

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | Dashboard (v1) | Legacy dashboard |
| `/dashboard/v2` | DashboardV2 | New multi-page dashboard |
| `/dashboard/home` | DashboardV2 | Home/Overview screen |
| `/dashboard/pages` | DashboardV2 | Pages management |
| `/dashboard/activity` | DashboardV2 | Leads/Bookings inbox |
| `/dashboard/insights` | DashboardV2 | Analytics |
| `/dashboard/monetize` | DashboardV2 | Plan/Billing |
| `/dashboard/settings` | DashboardV2 | Settings |

## Migration Path

1. Access new dashboard via `/dashboard/v2` or any v2 route
2. Legacy `/dashboard` remains functional
3. Gradual rollout via feature flag (future)
