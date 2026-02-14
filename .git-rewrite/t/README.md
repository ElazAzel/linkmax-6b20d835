# lnkmx - AI Bio Page Builder

AI-powered link-in-bio platform that creates professional bio pages in 2 minutes.

**Live:** [lnkmx.my](https://lnkmx.my)

## What is lnkmx?

lnkmx is a SaaS platform for creating AI-powered personal mini-websites (link-in-bio pages). Target users: beauty masters, experts, freelancers, small businesses, and content creators in the CIS region.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run lint
npm run lint

# Run i18n checks
npm run i18n:check
npm run lint:i18n

# Run E2E tests
npm run e2e
```

## Architecture

The project follows Clean Architecture principles with separation of concerns.

1. **Domain** - Business entities with validation logic
2. **Repositories** - Data access abstraction (IPageRepository, IUserRepository)
3. **Use Cases** - Application workflows (SavePageUseCase, LoadUserProfileUseCase)
4. **Services** - External integrations (analytics, AI, collaboration)
5. **Hooks** - UI state coordination (50+ specialized hooks)
6. **Components** - Presentation layer

## Key Features

### Page Builder
- **28 block types** (profile, links, products, forms, booking, events, etc.)
- Drag-and-drop reordering
- AI-powered content generation
- Theme customization
- SEO optimization

### CRM & Analytics
- Lead capture and management
- Telegram notifications
- Page analytics (views, clicks, conversions)
- Real-time dashboard with filters
- Device & source breakdown

### Social Features
- Gallery showcase
- Template marketplace (50+ templates)
- Collaboration (shoutouts)
- Community (Telegram channels)
- Friends & activity feed

### Monetization
- Free/Pro/Business/Enterprise tiers
- Linkkon token economy
- Template sales
- Paid content gates

## Documentation

📚 **Platform Documentation:**
- [📖 PLATFORM-DOCUMENTATION.md](./docs/PLATFORM-DOCUMENTATION.md) - Complete platform overview
- [🧩 BLOCKS-REFERENCE.md](./docs/BLOCKS-REFERENCE.md) - All 28 blocks with examples
- [📋 BLOCKS-AUDIT.md](./docs/BLOCKS-AUDIT.md) - Full audit of all blocks

**Other Resources:**
- [🏗️ Architecture](./docs/architecture.md) - System design
- [🔒 Security](./docs/SECURITY.md) - Security measures
- [⚡ Performance](./docs/performance.md) - Performance metrics

## Database Schema

### Core Tables

| Table           | Purpose                                  |
| --------------- | ---------------------------------------- |
| `pages`         | User pages with theme/SEO settings       |
| `blocks`        | Page content blocks (JSON content)       |
| `user_profiles` | User metadata, premium status            |
| `user_roles`    | Role-based access (admin/moderator/user) |

### Features

| Table            | Purpose                |
| ---------------- | ---------------------- |
| `leads`          | CRM leads from forms   |
| `bookings`       | Appointment bookings   |
| `analytics`      | Page view/click events |
| `events`         | Event management       |
| `collaborations` | User collaborations    |
| `teams`          | Team pages             |

## Edge Functions

| Function                    | Purpose                    |
| --------------------------- | -------------------------- |
| `ai-content-generator`      | AI page/block generation   |
| `chatbot-stream`            | AI chatbot responses       |
| `translate-content`         | Content translation        |
| `create-lead`               | Lead capture               |
| `send-booking-notification` | Booking alerts to Telegram |
| `send-lead-notification`    | Lead alerts to Telegram    |
| `telegram-bot-webhook`      | Telegram bot integration   |
| `validate-telegram`         | Telegram auth verification |
| `generate-sitemap`          | Dynamic sitemap generation |
| `process-crm-automations`   | CRM automation workflows   |

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **User data**: `auth.uid() = user_id`
- **Public pages**: `is_published = true` (read-only)
- **Admin access**: `has_role(auth.uid(), 'admin')`

### Rate Limiting

- API endpoints: 60 requests/minute per IP
- AI generation: 5 requests/day (free), unlimited (pro)
- Form submissions: 10 requests/minute per page

### Authentication

- Email/password via Supabase Auth
- Telegram verification for notifications
- JWT tokens with 1-hour expiry

## URL Structure

| Route         | Access | Description       |
| ------------- | ------ | ----------------- |
| `/`           | Public | Landing page (v5) |
| `/:username`  | Public | User's bio page   |
| `/gallery`    | Public | Community gallery |
| `/dashboard`  | Auth   | User dashboard    |
| `/admin`      | Admin  | Admin panel       |
| `/auth`       | Public | Login/signup      |
| `/team/:slug` | Public | Team pages        |

## Pricing (KZT)

| Plan     | Price     | Features                                |
| -------- | --------- | --------------------------------------- |
| Free     | 0₸        | Basic blocks, watermark                 |
| Pro      | 2,610₸/mo | All blocks, AI, CRM, no watermark       |
| Business | 7,500₸/mo | White label, unlimited AI, priority     |

Payments via RoboKassa (14-day refund policy per Kazakhstan law).

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
GEMINI_API_KEY=xxx (Edge Functions only)
TELEGRAM_BOT_TOKEN=xxx (Edge Functions only)
```

## Development

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Semantic tokens for colors (no direct Tailwind colors)
- Mobile-first responsive design

### Testing

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript check
npm test            # Unit tests (Vitest)
npm run lint:i18n   # i18n lint for JSX literals
npm run i18n:check  # Validate locale alignment
npm run e2e         # Playwright E2E
npm run e2e:ci      # E2E in CI mode
```

### Localization workflow

- Add new UI strings via `t('namespace.key')` and update `src/i18n/locales/{ru,en,kk}.json`.
- Run `npm run i18n:check` to validate alignment and placeholders.
- Run `npm run lint:i18n` to prevent hardcoded JSX strings.

### Deployment

Automatic deployment via Lovable Cloud:

- Push to main → auto-deploy
- Edge functions deploy with code changes

## Legal

- **Company**: ИП BEEGIN (БИН: 971207300019)
- **Location**: Almaty, Kazakhstan
- **Contact**: admin@lnkmx.my

---
