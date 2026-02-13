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

- [📚 **Documentation Index**](./docs/INDEX.md) - **Start Here** for all documentation.
- [📖 PLATFORM_SNAPSHOT.md](./docs/PLATFORM_SNAPSHOT.md) - **Single Source of Truth** (Architecture, Status, Flows)
- [📜 CHANGELOG.md](./docs/CHANGELOG.md) - Version history and changes
- [🏃 RUNBOOKS](./docs/RUNBOOKS/) - Operational guides (Local Dev, Deployment)

**Component & Feature Refs:**

- [blocks-reference](./docs/BLOCKS-REFERENCE.md)
- [architecture](./docs/architecture.md)
- [security](./docs/SECURITY.md)

## Database & Infrastructure

See `docs/PLATFORM_SNAPSHOT.md` for the complete schema and infrastructure details.

## Edge Functions

Key functions (hosted on Supabase):

- `ai-content-generator`
- `process-crm-automations`
- `telegram-bot-webhook`

(See `supabase/functions/` for full list)

## Security

- **RLS:** Enabled on all public tables.
- **Auth:** Supabase Auth + JWT.
- **Rate Limits:** Applied via Edge Functions.

## Development

### Setup

```bash
npm install
npm run dev
```

### Testing & Quality

```bash
npm run lint        # Code style
npm typecheck       # TS Validation (custom script)
npm test            # Unit tests
npm run e2e         # Playwright
```

### Localization

- Add strings in `src/i18n/locales/`
- Run `npm run i18n:check` to validate

### Deployment

Auto-deploys via Lovable Cloud on push to `main`.

### Deployment

Automatic deployment via Lovable Cloud:

- Push to main → auto-deploy
- Edge functions deploy with code changes

## Legal

- **Company**: ИП BEEGIN (БИН: 971207300019)
- **Location**: Almaty, Kazakhstan
- **Contact**: <admin@lnkmx.my>

---
