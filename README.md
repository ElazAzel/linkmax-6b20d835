# lnkmx — The Micro-Business OS

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-v18+-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-orange.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

> **Create professional bio pages, manage leads, and track analytics — all in 2 minutes.**

**lnkmx** is a comprehensive SaaS platform built for creators, freelancers, and small businesses in the CIS region. It combines a powerful page builder (28+ blocks), a **Business Zone** (mini-CRM, Kanban, Tasks, Contacts), and advanced analytics into one unified, mobile-first system.

**[Live Demo](https://lnkmx.my)**

---

## ✨ Features

### 🎨 **AI-Powered Page Builder**

- **28+ Block Types**: Profile, links, products, forms, bookings, events, carousels, scratch cards, and more.
- **Drag & Drop**: Intuitive mobile-first editor (dnd-kit).
- **AI Generation**: Create entire pages or write copy with one click (Gemini).
- **Customization**: Themes, fonts, and animations (Liquid Glass design system).
- **Multi-Page**: Up to 6 pages per user (Pro); each with its own slug and SEO.

### 📈 **Business Zone & Analytics**

- **Mini-CRM**: Leads with status pipeline (New → Contacted → Won/Lost), notes, and history.
- **Kanban**: Deals pipeline with drag-and-drop stages.
- **Tasks**: Task board with priorities, assignees, due dates, linked contacts and deals.
- **Contacts**: Unified contact list linked to leads and deals.
- **Deep Analytics**: Views, clicks, CTR, traffic sources, block performance, geography; **Pixel Proxy** for server-side tracking (Facebook CAPI, TikTok Events).
- **A/B Experiments**: Test block variants for conversion optimization.
- **Notifications**: Instant alerts via Telegram for new leads and bookings.

### 🌐 **Localization & SEO**

- **16 Languages**: RU, EN, KK (primary); DE, UK, UZ, BE, ES, FR, IT, PT, ZH, TR, JA, KO, AR (lazy-loaded).
- **SEO/SSR**: Bot detection, pre-rendered landing/gallery/profiles via Cloudflare Worker + Supabase Edge Functions; dynamic sitemap; JSON-LD and GEO schemas.

### 🔗 **Social & Growth**

- **Smart Links**: Messenger shortcuts (WhatsApp, Telegram), social icons.
- **Monetization**: Sell products, tickets, and digital goods; Robokassa integration (platform layer).
- **PWA**: Installable app, offline fallback, shortcuts (Dashboard, Create page).
- **Mobile**: Capacitor 8 (iOS/Android) — initialized for native builds.

---

## 🛠 Tech Stack

### Core

- **Framework**: [Vite 6](https://vitejs.dev/) with [React 18.3](https://react.dev/)
- **Language**: [TypeScript 5.8](https://www.typescriptlang.org/)
- **Routing**: [React Router 6](https://reactrouter.com/) (lazy-loaded routes)

### Styling & UI

- **CSS**: [TailwindCSS 3](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Infra

- **Platform**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Compute**: Supabase Edge Functions (Deno) — 28+ functions
- **SSR/Bots**: Cloudflare Worker (prerender, sitemap)
- **AI**: Google Gemini API
- **Payments**: Robokassa (platform layer)
- **Monitoring**: Sentry, Web Vitals

### Mobile

- **Capacitor**: 8.1 (iOS/Android)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ (v20 recommended)
- npm v9+

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ElazAzel/inkmax.git
   cd inkmax
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env` and set:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   VITE_APP_DOMAIN=https://lnkmx.my
   ```

   *(Ask the team lead for credentials if you don't have them)*

4. **Start Development Server**

   ```bash
   npm run dev
   ```

   App runs at **<http://localhost:8080>**

### Подключение npm (если команда `npm` не найдена)

- Установите [Node.js](https://nodejs.org/) (LTS, v18+) — в комплекте идёт npm.
- Либо используйте [nvm-windows](https://github.com/coreybutler/nvm-windows): `nvm install 20` → `nvm use 20`. В проекте есть `.nvmrc` (рекомендуемая версия).
- Откройте **новый** терминал (Cursor/VS Code: Terminal → New Terminal), чтобы подхватился PATH, затем:

  ```bash
  npm install
  ```

- Или из PowerShell в корне проекта: `.\scripts\install-deps.ps1`

---

## 📂 Project Structure

```
lnkmx/
├── src/
│   ├── components/       # Reusable UI & Business Components
│   │   ├── blocks/       # Public view block renderers
│   │   ├── block-editors/ # Dashboard block editors
│   │   ├── dashboard-v2/ # Dashboard v2 (screens, layout, analytics)
│   │   ├── zones/        # Business Zone (CRM, Kanban, Tasks)
│   │   └── ui/           # Base design system (shadcn)
│   ├── pages/            # Route-level components (Vite SPA)
│   ├── hooks/            # Custom React Hooks (60+)
│   ├── services/         # Business Logic & API calls
│   ├── domain/           # Core Domain Entities
│   ├── use-cases/        # Application use cases
│   ├── repositories/     # Data access layer
│   ├── platform/         # Platform integrations (Supabase, Robokassa)
│   ├── i18n/             # Locales (16 languages)
│   └── lib/              # Utilities, SEO, export (PDF/Excel)
├── supabase/
│   ├── functions/        # 28+ Edge Functions
│   └── migrations/       # Database Schema
├── cloudflare-worker/    # SSR & sitemap worker
├── android/              # Capacitor Android
├── ios/                  # Capacitor iOS
└── docs/                 # Documentation
```

## 📖 Documentation

- **[Docs overview](docs/README.md)**: Entry point and unified index.
- **[Platform Snapshot](docs/PLATFORM_SNAPSHOT.md)**: Single source of truth for architecture and features.
- **[Changelog](docs/CHANGELOG.md)**: Version history.
- **[Developer Quickstart](docs/getting-started/DEVELOPER-QUICKSTART.md)**: Get running in minutes.
- **[Comprehensive Platform Guide](docs/architecture/COMPREHENSIVE_PLATFORM_GUIDE.md)**: Product vision, modules, and roadmap.
- **[Architecture](docs/architecture/architecture.md)**: High-level system design.
- **[Stack References](docs/architecture/STACK_REFERENCES.md)**: Libraries and best practices.
- **[API & Backend](docs/implementation/API.md)**: Edge Functions and RPCs.
- **[Testing](docs/testing/TESTING.md)**: Unit and E2E tests.
- **[Runbooks](docs/operations/RUNBOOKS/)**: Operational guides (Deploy, Rollback, Incidents).
- **[ADRs](docs/ADR/)**: Architecture Decision Records history.
- **[Contributing](CONTRIBUTING.md)**: Guidelines for contributing.

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Create a branch (`feat/amazing-feature`)
2. Commit your changes (`git commit -m 'feat: add amazing feature'`)
3. Push to the branch (`git push origin feat/amazing-feature`)
4. Open a Pull Request

---

## 📄 License

Copyright © 2026 ИП BEEGIN. All rights reserved.
