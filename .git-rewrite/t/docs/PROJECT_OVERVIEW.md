# LinkMAX - Полное описание проекта

## 📋 Обзор

**LinkMAX** — AI-powered платформа для создания персональных мини-сайтов (link-in-bio) за 2 минуты. Автоматически генерирует дизайн, копирайтинг и структуру страницы на основе выбранной ниши пользователя.

### Ключевое ценностное предложение
Замена трудоёмкого ручного создания страниц на AI-driven генерацию с премиальным дизайном и быстрой настройкой.

---

## 🎯 Целевая аудитория

| Сегмент | Описание |
|---------|----------|
| **Создатели контента** | Instagram/TikTok блогеры — обход ограничения на одну ссылку в био |
| **Фрилансеры и эксперты** | Быстрое портфолио и прайс-лист услуг |
| **Малый бизнес** | Барберы, фотографы, тренеры, репетиторы, салоны — витрина без полноценного e-commerce |
| **Музыканты и артисты** | Агрегация стриминга, мерча и билетов |

### Географический фокус
- **Основной рынок**: СНГ (замена устаревшего Taplink)
- **Вторичный**: Глобальная creator economy

---

## 💰 Бизнес-модель

### Freemium
| Функция | Free | Premium |
|---------|------|---------|
| Блоки | До 5 | Безлимит |
| AI-запросы | 3/день | Безлимит |
| Темы | Базовые | Все + кастомизация |
| Аналитика | ❌ | ✅ |
| GIF-аватары | ❌ | ✅ |
| Водяной знак | Есть | Нет |
| Карусели, видео | ❌ | ✅ |

### Ценообразование
- **390 ₽ / $6.99 в месяц** (Premium)
- **7-дневный триал** для новых пользователей

---

## 🏗️ Архитектура

### Технологический стек

```
Frontend:
├── React 18 + TypeScript
├── Vite (сборка)
├── Tailwind CSS + shadcn/ui
├── React Router v6
├── React Query (TanStack)
├── i18next (локализация)
└── PWA (vite-plugin-pwa)

Backend (Lovable Cloud / Supabase):
├── PostgreSQL (база данных)
├── Supabase Auth (аутентификация)
├── Supabase Storage (медиафайлы)
├── Edge Functions (Deno)
└── Row Level Security (RLS)

AI/ML:
├── Lovable AI Gateway
├── Gemini 2.5 Flash (генерация контента)
└── Google Grounding (поиск)
```

### Архитектурные паттерны

```
src/
├── domain/           # Domain Layer (сущности, value objects)
│   ├── entities/     # Block, Page, User
│   └── value-objects/# Result type
├── repositories/     # Data Access Layer
│   ├── interfaces/   # IPageRepository, IUserRepository
│   └── implementations/
├── use-cases/        # Application Layer
│   ├── page/         # LoadPage, SavePage, PublishPage
│   └── user/         # LoadProfile, UpdateUsername
├── services/         # Infrastructure Services
├── hooks/            # React Hooks (UI coordination)
├── components/       # Presentation Layer
│   ├── ui/           # shadcn components
│   ├── blocks/       # Block renderers
│   ├── block-editors/# Block editors
│   └── ...
└── pages/            # Route pages
```

---

## 🧩 Типы блоков

### Базовые (Free)
| Блок | Описание |
|------|----------|
| **Profile** | Аватар, имя, био, cover image |
| **Link** | Кнопка-ссылка с иконкой |
| **Text** | Заголовки, параграфы, цитаты |
| **Image** | Изображение с подписью |
| **Button** | CTA-кнопка |
| **Socials** | Иконки соцсетей |
| **Separator** | Разделитель |

### Premium
| Блок | Описание |
|------|----------|
| **Carousel** | Галерея изображений |
| **Video** | YouTube/Vimeo embed |
| **Product** | Карточка товара с ценой |
| **Catalog** | Каталог с категориями |
| **Form** | Форма обратной связи |
| **Messenger** | Кнопки мессенджеров |
| **FAQ** | Аккордеон вопросов-ответов |
| **Testimonial** | Отзыв клиента |
| **Countdown** | Таймер обратного отсчёта |
| **Map** | Карта по адресу (только ввод адреса) |
| **Download** | Кнопка скачивания файла |
| **Newsletter** | Подписка на рассылку |
| **Search** | AI-поиск с Google Grounding |
| **Scratch** | Скретч-карта |
| **Custom Code** | HTML/CSS код |
| **Avatar** | Отдельный аватар-блок |
| **Before/After** | Сравнение до/после |
| **Pricing** | Таблица тарифов |
| **Shoutout** | Упоминание другого пользователя |

---

## 🤖 AI-функции

### Генерация контента
| Функция | Описание |
|---------|----------|
| **AI Builder** | Генерация страницы по нише |
| **Magic Title** | Генерация заголовков для ссылок |
| **Sales Copy** | Описания товаров |
| **SEO Generator** | Meta-теги страницы |
| **Auto-translate** | Перевод на 3 языка |

### AI Chatbot
- Плавающая кнопка чата на публичной странице
- Отвечает на вопросы посетителей от имени владельца
- Анализирует контент страницы + приватный контекст
- Streaming через Edge Function

### Rate Limiting
- `ai-content-generator`: 20 req/min
- `chatbot-stream`: 10 req/min
- `translate-content`: 15 req/min

---

## 🔐 Аутентификация

### Методы входа
- Email/Password
- Google OAuth
- Apple OAuth

### Telegram верификация
**Обязательна при регистрации!**
1. Пользователь открывает бота @linkmaxmy_bot
2. Получает Chat ID через /start
3. Вводит Chat ID в форму регистрации
4. Система верифицирует через `validate-telegram` edge function

### Telegram Bot
- Webhook: `telegram-bot-webhook` edge function
- Команды: /start, /id, /help
- Inline-кнопки для UX

---

## 🌍 Локализация

### Поддерживаемые языки
- 🇷🇺 Русский (ru)
- 🇺🇸 English (en)
- 🇰🇿 Қазақша (kk)

### Приоритет определения языка
1. Сохранённый в localStorage (ручной выбор)
2. Язык браузера (navigator.language)
3. Fallback: русский для СНГ-регионов

### Мультиязычный контент
- `MultilingualString` type: `{ ru, en, kk }`
- `MultilingualInput` компонент с табами
- AI auto-translate через edge function

---

## 🎮 Gamification

### Streak System
- Ежедневные посещения = streak
- Milestones: 7/14/30/60/100 дней
- Бонусные дни триала за milestones

### Daily Quests
| Квест | Награда |
|-------|---------|
| daily_visit | +1 час |
| add_block | +2 часа |
| edit_profile | +1 час |
| share_page | +2 часа |
| use_ai | +1 час |

### Achievements
- first_page, first_block, premium_user
- social_butterfly, networking_pro
- streak_7, streak_30, streak_100

### Weekly Challenges
- Командные/индивидуальные челленджи
- Награда: часы триала

---

## 👥 Social Features

### Referral System
- Уникальный реферальный код
- +3 дня триала обоим (referrer + referred)
- Top Referrers leaderboard

### Collaborations
- Запрос коллаборации между пользователями
- Объединённая страница /collab/:slug
- Выбор отображаемых блоков

### Teams
- Создание команд с invite-кодами
- Публичная страница команды /team/:slug
- Роли: owner, member

### Friends
- Система друзей
- Activity feed друзей
- Premium gifts между друзьями

### Shoutouts
- Упоминание других пользователей на странице
- Взаимный промо

---

## 📊 Analytics & CRM

### Page Analytics (Premium)
- Page views, unique visitors
- Block clicks
- Traffic sources
- Device breakdown
- Time-based trends

### Mini-CRM
- Автоматическое создание лидов из форм
- Статусы: new, contacted, qualified, converted, lost
- История взаимодействий
- Telegram-уведомления о новых лидах

---

## 🎨 Design System

### Themes
- 5 базовых тем
- Premium темы с градиентами и эффектами
- Dark/Light mode per page

### Liquid Glass Design
- Apple-inspired aesthetic
- backdrop-blur эффекты
- Soft shadows, rounded corners
- Mesh gradients

### Animations
- Entrance animations per block
- fade-in, slide-up, scale-in, bounce
- Configurable delay и duration

### Avatar Customization
- Animated frames (spinning, dash, wave)
- Sizing (small → xlarge)
- Shadow effects
- Cover images с градиентами

---

## 📱 Mobile-First

### Primary Platform
Смартфоны — основная рабочая площадка!

### Mobile Features
- Bottom navigation toolbar
- Full-screen sheets для настроек
- Swipe gestures (delete/edit блоков)
- Haptic feedback
- Pull-to-refresh
- FAB для добавления блоков
- Inline editing без модалок

### PWA
- Installable app
- Service worker caching
- Offline capabilities
- Install prompts

---

## 🔔 Notifications

### Telegram (Primary)
- Новые лиды из форм
- Коллаборации
- Команды (join/remove)
- Premium gifts
- Trial ending reminder

### Email
- Опционально через настройки

---

## 🗄️ Database Schema

### Core Tables
```sql
-- Users
user_profiles (id, username, display_name, bio, avatar_url, 
               is_premium, trial_ends_at, telegram_chat_id,
               current_streak, longest_streak, ...)

-- Pages
pages (id, user_id, slug, title, description, avatar_url,
       theme_settings, seo_meta, is_published, is_in_gallery,
       view_count, gallery_likes, niche, editor_mode, ...)

-- Blocks
blocks (id, page_id, type, position, content, style,
        is_premium, schedule, click_count, ...)

-- Analytics
analytics (id, page_id, block_id, event_type, metadata, ...)

-- CRM
leads (id, user_id, name, email, phone, source, status, ...)
lead_interactions (id, lead_id, type, content, ...)
```

### Social Tables
```sql
friendships, collaborations, shoutouts, teams, team_members,
premium_gifts, referral_codes, referrals
```

### Gamification Tables
```sql
user_achievements, daily_quests_completed, 
weekly_challenges, challenge_progress
```

---

## 🚀 Edge Functions

| Function | Описание |
|----------|----------|
| `ai-content-generator` | Magic Title, Sales Copy, SEO, AI Builder |
| `chatbot-stream` | AI chatbot streaming |
| `translate-content` | Авто-перевод контента |
| `telegram-bot-webhook` | Telegram bot handler |
| `validate-telegram` | Верификация Chat ID |
| `telegram-password-reset` | Сброс пароля через Telegram |
| `create-lead` | Создание лида из формы |
| `send-lead-notification` | Уведомление о новом лиде |
| `send-collab-notification` | Уведомления о коллаборациях |
| `send-team-notification` | Уведомления о командах |
| `send-friend-notification` | Уведомления о друзьях |
| `send-social-notification` | Социальные уведомления |
| `send-trial-ending-notification` | Напоминание об окончании триала |
| `send-weekly-digest` | Еженедельный дайджест |

---

## 🛣️ Roadmap

### Completed ✅
- [x] AI-onboarding по нишам
- [x] Freemium система
- [x] Gamification (streaks, quests, achievements)
- [x] Referral system
- [x] Collaborations & Teams
- [x] Community Gallery
- [x] Mini-CRM
- [x] Telegram notifications
- [x] PWA

### In Progress 🔄
- [ ] Stripe/Kaspi Pay интеграция
- [ ] A/B testing блоков
- [ ] Email marketing интеграции
- [ ] Pixel integration (Meta, TikTok, GA)
- [ ] Multi-page accounts

---

## 🔗 Links

- **Production**: https://lnkmx.my
- **Telegram Bot**: @linkmaxmy_bot

---

## 📝 Notes

### Security
- RLS policies на всех таблицах
- Rate limiting на AI функциях
- Input validation (Zod)
- XSS protection (DOMPurify для custom code)

### Performance
- Database indexes на часто используемых колонках
- Image compression (WebP)
- Lazy loading
- Code splitting

### Code Quality
- Clean Architecture (BMAD v6)
- TypeScript strict mode
- Domain-driven design
- Repository pattern
