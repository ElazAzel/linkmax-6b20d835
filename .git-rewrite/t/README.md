# LinkMAX 🔗

> AI-powered link-in-bio platform for creators, freelancers, and businesses

LinkMAX is a modern alternative to Linktree, Taplink, and similar services, offering advanced customization, AI-powered content generation, and a seamless drag-and-drop editor for creating beautiful landing pages.

## ✨ Key Features

### 🎨 Visual Editor
- Intuitive drag-and-drop block system
- Real-time preview with auto-save
- 15+ customizable block types
- Mobile-first responsive design
- Swipe gestures and haptic feedback

### 🤖 AI-Powered Tools
- **Magic Title** - Generate compelling button headlines from URLs
- **Sales Copy** - Auto-generate product descriptions
- **SEO Generator** - Create optimized meta tags
- **AI Builder** - Scaffold entire pages from niche selection
- **AI Chatbot** - Interactive visitor support widget
- **Auto-Translation** - Translate content across 3 languages (RU, EN, KK)

### 📦 Block Types
- **Profile** - Avatar, cover, name, bio with inline editing
- **Links & Buttons** - Customizable with icons and backgrounds
- **Media** - YouTube/Vimeo videos and image galleries
- **Carousels** - Image sliders with multiple items
- **Text** - Headers, paragraphs, quotes
- **Products** - Product cards with pricing and cart
- **Catalog** - Categorized item listings
- **Messenger** - WhatsApp, Telegram, Viber integration
- **Forms** - Contact forms with CRM integration
- **Downloads** - File sharing with counters
- **Newsletter** - Email subscription forms
- **Testimonials** - Customer reviews with ratings
- **FAQ** - Accordion-style Q&A sections
- **Countdown** - Event/promotion timers
- **Pricing** - Service/product pricing tables
- **Before/After** - Image comparison sliders
- **Map** - Embedded Google/Yandex maps
- **Custom Code** - HTML/CSS injection (Premium)

### 🎨 Customization
- Liquid Glass design system
- Gradient backgrounds with mesh effects
- Glassmorphism and blur effects
- Animated avatar frames (Neon, Glitch, Aura)
- Block entrance animations
- Custom CSS support (Premium)

### 📊 Analytics & CRM (Premium)
- Page view tracking
- Click-through rates per block
- Traffic source attribution
- Mini-CRM for lead management
- Automatic lead capture from forms

### 🌍 Internationalization
- Full i18n support (Russian, English, Kazakh)
- Multilingual block content
- Auto-detection by browser language
- AI-powered translation

### 🔐 Authentication & Security
- Email/password authentication
- Google & Apple OAuth
- Secure data storage with Supabase
- Row-level security policies
- Rate limiting on AI endpoints

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: Google Gemini 2.5 Flash via Lovable AI
- **Drag & Drop**: dnd-kit
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **i18n**: i18next
- **PWA**: vite-plugin-pwa

## 📁 Project Architecture

```
src/
├── components/
│   ├── blocks/           # Block renderers (ProfileBlock, LinkBlock, etc.)
│   ├── block-editors/    # Block editor components
│   ├── dashboard/        # Dashboard UI components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── hooks/
│   ├── useDashboard.ts         # Main dashboard state orchestrator
│   ├── useBlockEditor.tsx      # Block CRUD operations with undo
│   ├── useDashboardOnboarding.ts
│   ├── useDashboardSharing.ts
│   ├── useDashboardUsername.ts
│   ├── useDashboardAI.ts
│   ├── usePremiumStatus.ts
│   └── ...
├── services/
│   ├── pages.ts          # Page data operations
│   ├── user.ts           # User profile operations
│   └── index.ts
├── lib/
│   ├── constants.ts      # App config and defaults
│   ├── url-helpers.ts    # URL generation utilities
│   ├── block-utils.ts    # Block manipulation helpers
│   └── ...
├── types/
│   ├── blocks.ts         # Block editor types
│   ├── api.ts            # API response types
│   ├── page.ts           # Page and block types
│   └── index.ts
├── pages/
│   ├── Dashboard.tsx     # Main editor page
│   ├── PublicPage.tsx    # Public page renderer
│   ├── Auth.tsx          # Authentication
│   └── ...
└── i18n/
    └── locales/          # Translation files (en, ru, kk)

supabase/
├── functions/            # Edge Functions
│   ├── ai-content-generator/
│   ├── chatbot-stream/
│   ├── translate-content/
│   └── ...
└── migrations/           # Database migrations
```

## 🎯 Target Audiences

- **Instagram & TikTok Creators** - Overcome single-link bio restrictions
- **Freelancers & Experts** - Quick portfolio and service pricing
- **Small Businesses** - Lightweight product showcases
- **Musicians & Artists** - Aggregate streaming, merch, and ticket links

## 💎 Freemium Model

**Free Tier:**
- 5 blocks per page
- Basic block types
- 3 AI requests per day
- Watermark on public pages

**Premium Tier:**
- Unlimited blocks
- All block types including Catalog, Countdown, FAQ, Pricing
- Unlimited AI requests
- Mini-CRM access
- Custom CSS
- No watermark
- 2-day free trial

## 🛠️ Development

### Prerequisites
- Node.js 18+ and npm
- Lovable Cloud account (includes Supabase)

### Setup

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd linkmax
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

## 🔒 Security

- Input sanitization with DOMPurify
- Row Level Security (RLS) on all tables
- Rate limiting on AI endpoints
- Zod schema validation
- Secure authentication flow
- Private chatbot context storage

## 📱 PWA Support

LinkMAX is a full Progressive Web App:
- Installable on mobile and desktop
- Offline-capable with service worker caching
- Platform-specific installation guides
- Push notification ready

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

- React (MIT License)
- Tailwind CSS (MIT License)
- Supabase (Apache 2.0 License)

## 🔗 Links

- **Live Demo**: https://lnkmx.my


