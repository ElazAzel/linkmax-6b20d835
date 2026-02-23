# lnkmx — The Micro-Business OS

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-v18+-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-orange.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

> **Create professional bio pages, manage leads, and track analytics — all in 2 minutes.**

**lnkmx** is a comprehensive SaaS platform built for creators, freelancers, and small businesses in the CIS region. It combines a powerful page builder, a mini-CRM, and advanced analytics into one unified system.

**[Live Demo](https://lnkmx.my)**

---

## ✨ Features

### 🎨 **AI-Powered Page Builder**
- **28+ Block Types**: Profile, links, products, forms, bookings, events, and more.
- **Drag & Drop**: Intuitive mobile-first editor.
- **AI Generation**: Create entire pages or write copy with one click.
- **Customization**: Themes, fonts, and animations.

### 📈 **Business Intelligence**
- **Deep Analytics**: Views, clicks, CTR, and geographic data.
- **Mini-CRM**: Track leads, manage status (New, Contacted, Won), and add notes.
- **Notifications**: Instant alerts via Telegram for new leads and bookings.

### 🔗 **Social & Growth**
- **Smart Links**: Messenger shortcuts (WhatsApp, Telegram), social icons.
- **Monetization**: Sell products, tickets, and digital goods directly.
- **Community**: Collaboration tools, shoutouts, and friend feeds.

---

## 🛠 Tech Stack

**Core**
- **Framework**: [Vite](https://vitejs.dev/) with [React 18](https://react.dev/)
- **Build Tool**: Vite 6+
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)

**Styling & UI**
- **CSS**: [TailwindCSS 3](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

**Backend & Infra**
- **Platform**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Compute**: Supabase Edge Functions (Deno)
- **AI**: Google Gemini API

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
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
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```
   *(Ask the team lead for these credentials if you don't have them)*

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```
lnkmx/
├── src/
│   ├── components/      # Reusable UI & Business Components
│   │   ├── blocks/      # Public view block renderers
│   │   ├── block-editors/ # Dashboard block editors
│   │   └── ui/          # Base design system (shadcn)
│   ├── pages/           # Route-level components (Vite SPA)
│   ├── hooks/           # Custom React Hooks (60+)
│   ├── services/        # Business Logic & API calls
│   ├── domain/          # Core Domain Entities
│   ├── platform/        # Platform-specific integrations (Supabase, Robokassa)
│   └── lib/             # Utilities & Helpers
├── supabase/
│   ├── functions/       # 35+ Edge Functions
│   └── migrations/      # Database Schema
└── docs/                # Documentation
```

## 📖 Documentation

- **[Platform Snapshot](docs/PLATFORM_SNAPSHOT.md)**: The single source of truth for architecture and features.
- **[Architecture](docs/architecture.md)**: High-level system design diagrams.
- **[API & Backend](docs/API.md)**: Reference for Edge Functions and RPCs.
- **[Testing Strategy](docs/TESTING.md)**: Guide to running and writing tests.
- **[Contributing](CONTRIBUTING.md)**: Guidelines for contributing code.

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

1. Create a branch (`feat/amazing-feature`)
2. Commit your changes (`git commit -m 'feat: add amazing feature'`)
3. Push to the branch (`git push origin feat/amazing-feature`)
4. Open a Pull Request

---

## 📄 License

Copyright © 2026 ИП BEEGIN. All rights reserved.
