# LinkMAX 🔗

> AI-powered link-in-bio platform for creators, freelancers, and businesses

LinkMAX is a modern alternative to Linktree, Taplink, and similar services, offering advanced customization, AI-powered content generation, and a seamless drag-and-drop editor for creating beautiful landing pages.

## ✨ Key Features

### 🎨 **Visual Editor**
- Intuitive drag-and-drop block system
- Real-time preview
- Multiple customizable block types
- Responsive design for all devices

### 🤖 **AI-Powered Tools**
- **Magic Title** - Generate compelling button headlines from URLs
- **Sales Copy** - Auto-generate product descriptions
- **SEO Generator** - Create optimized meta tags
- **AI Builder** - Scaffold entire pages from account descriptions
- **AI Chatbot** - Interactive visitor support widget

### 📦 **Block Types**
- **Links & Socials** - Customizable button blocks with icons
- **Media** - YouTube/Vimeo videos and image galleries
- **Carousels** - Image sliders with multiple items
- **Text** - Headers, paragraphs, quotes
- **Shop** - Product cards with pricing and cart
- **Messenger** - WhatsApp, Telegram, Viber integration
- **Forms** - Contact forms with validation
- **Downloads** - File sharing with counters
- **Newsletter** - Email subscription forms
- **Testimonials** - Customer reviews with ratings
- **Scratch Cards** - Interactive scratch-off layers
- **Search** - Real-time Google-powered search

### 🎨 **Customization**
- Gradient backgrounds
- Glassmorphism effects
- Neon glows and shadows
- Animated avatar frames
- Custom CSS support (Premium)

### 📊 **Analytics** (Premium)
- Page view tracking
- Click-through rates per block
- Traffic source attribution
- Geographic and device breakdowns

### 🔐 **Authentication & Security**
- Email/password authentication
- Google & GitHub OAuth
- Secure data storage with Supabase
- Row-level security policies

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: Google Gemini 2.5 Flash
- **Drag & Drop**: dnd-kit
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6

## 📋 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account (or use Lovable Cloud)

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

3. Configure environment variables:
```bash
# .env file is auto-generated with Lovable Cloud
# Or manually set:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

4. Run database migrations:
```bash
# Migrations are in supabase/migrations/
# Apply via Supabase CLI or Lovable Cloud dashboard
```

5. Start development server:
```bash
npm run dev
```

## 🎯 Target Audiences

- **Instagram & TikTok Creators** - Overcome single-link bio restrictions
- **Freelancers & Experts** - Quick portfolio and service pricing
- **Small Businesses** - Lightweight product showcases
- **Musicians & Artists** - Aggregate streaming, merch, and ticket links

## 💎 Premium Features

- Image carousels
- Video embeds (YouTube/Vimeo)
- Animated avatar frames (Neon, Glitch, Aura)
- Custom CSS injection
- Unlimited AI chatbot usage
- Advanced analytics dashboard
- Messenger blocks
- Contact forms
- File downloads
- Newsletter integration

**Trial**: 7-day free trial with full premium access

## 🛠️ Development

### Project Structure
```
linkmax/
├── src/
│   ├── components/       # React components
│   │   ├── blocks/      # Block type components
│   │   └── ui/          # shadcn/ui components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Route pages
│   ├── types/           # TypeScript types
│   └── integrations/    # Supabase client
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔒 Security

- Input sanitization with DOMPurify
- Row Level Security (RLS) on all tables
- Rate limiting on AI endpoints
- Zod schema validation
- Secure authentication flow

## 📱 Deployment

### Via Lovable (Recommended)
1. Click "Publish" in Lovable editor
2. Connect custom domain (optional)

### Manual Deployment
- **Frontend**: Deploy to Vercel, Netlify, or any static host
- **Backend**: Supabase handles database and edge functions
- Set environment variables in hosting platform

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is built with [Lovable](https://lovable.dev) and uses:
- React (MIT License)
- Tailwind CSS (MIT License)
- Supabase (Apache 2.0 License)

## 🔗 Links

- **Lovable Project**: https://lovable.dev/projects/fa95b512-ab1c-4c64-b3f9-74add033a9a4
- **Documentation**: https://docs.lovable.dev
- **Support**: Open an issue or contact via Lovable Discord

## 📸 Screenshots

_Coming soon - Add screenshots of your deployed LinkMAX pages_

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
