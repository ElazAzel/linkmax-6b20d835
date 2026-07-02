# LinkMAX — Unified Implementation Plan (Phase 1)

## Mission

Создать единый набор Agent Skills для LinkMAX, объединив лучшие практики из репозитория [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) со спецификой проекта. Цель — дать AI-агентам контекст, инструкции и готовые воркфлоу для всех ключевых доменов платформы.

## Методология

Каждый `SKILL.md` включает:
- **Name/Description** (YAML frontmatter) — для прогрессивной загрузки
- **When to Use** — триггеры для активации
- **Workflows** — пошаговые инструкции для агента
- **Key Files / Commands** — привязка к реальной кодовой базе
- **Examples** — конкретные сценарии из жизни LinkMAX

## Структура Skills

### Существующие (в проекте)
| Skill | Описание |
|---|---|
| `react` | Современная React-разработка (Vite, TS, Tailwind, Shadcn) |
| `supabase` | Работа с Supabase (миграции, Edge Functions, RLS) |

### Планируемые к слиянию (из awesome-claude-skills)

#### 1. `business-zone` — CRM, лиды и продажи (HIGH)
Источники: Lead Research Assistant, Competitive Ads Extractor, Domain Name Brainstormer
- Квалификация лидов по ICP
- Анализ конкурентов через Ad Library
- Генерация доменных имён для страниц
- Интеграция с Telegram-уведомлениями

#### 2. `communications` — Коммуникации (HIGH)
Источники: Internal Comms, Telegram Automation, Gmail Automation
- 3P-апдейты (Progress/Plans/Problems)
- Email-рассылки и ответы на заявки
- Telegram-уведомления о новых лидах/бронированиях
- Внутренние FAQ и новостные рассылки

#### 3. `content-creation` — Контент для страниц (HIGH)
Источники: Content Research Writer
- Создание bio-страниц через AI
- Написание SEO-текстов для блоков
- Исследование и добавление цитат/ссылок
- A/B тестирование вариантов копирайтинга

#### 4. `design-brand` — Дизайн и брендинг (MEDIUM)
Источники: Brand Guidelines, Canvas Design
- Применение фирменного стиля к страницам
- Цветовые схемы, типографика
- Canvas-постеры и графика

#### 5. `devops` — CI/CD и инфраструктура (HIGH)
Источники: Supabase Automation, GitHub Automation, Vercel Automation
- Деплой Edge Functions
- GitHub Actions / CI-пайплайны
- Управление переменными окружения
- Деплой на Vercel / Cloudflare Worker

#### 6. `payments` — Платежи и финансы (HIGH)
Источники: Stripe Automation, Invoice Organizer
- Robokassa + Stripe интеграция
- Организация инвойсов (папки, нейминг)
- Экспорт CSV для бухгалтерии

#### 7. `analytics` — Аналитика (MEDIUM)
Источники: PostHog Automation
- События и воронки
- Feature flags
- A/B эксперименты

#### 8. `calendar` — Календарь и бронирования (MEDIUM)
Источники: Google Calendar Automation
- События и слоты для блоков Bookings
- Синхронизация с Google Calendar

#### 9. `changelog` — Релиз-ноты (LOW)
Источники: Changelog Generator
- Генерация changelog из git-коммитов
- Категоризация (features/fixes/improvements)

#### 10. `file-management` — Файлы и документы (LOW)
Источники: File Organizer
- Организация файлов пользователей
- Поиск дубликатов

#### 11. `testing` — Тестирование (MEDIUM)
Источники: Webapp Testing
- Playwright-тесты (E2E)
- Vitest (unit)
- Скриншоты и консоль-логи

## План внедрения

### Phase 1 (сейчас)
- [x] Загрузить все SKILL.md из awesome-claude-skills
- [ ] Создать `plan.md` — этот документ
- [ ] Написать 5 **core skills**: `business-zone`, `communications`, `content-creation`, `devops`, `payments`
- [ ] Обновить `.agent/rules/ANTIGRAVITY_CONFIG.md`

### Phase 2
- [ ] Написать 4 **supporting skills**: `analytics`, `calendar`, `design-brand`, `testing`
- [ ] Интегрировать с .agent/rules/agents/ (backend_specialist, frontend_specialist)

### Phase 3
- [ ] Написать 2 **utility skills**: `changelog`, `file-management`
- [ ] Задокументировать workflow для агентов

## Технические заметки

- **Формат**: YAML frontmatter + Markdown body (стандарт Anthropic Skills)
- **Кодировка**: UTF-8
- **Язык**: Русский (основной), английский (термины)
- **Максимальный размер**: каждый SKILL.md < 5000 токенов для эффективной прогрессивной загрузки
- **Совместимость**: Claude Code, Cursor, Codex, Gemini CLI, Antigravity, Windsurf

## Reference

- [Anthropic Skills Spec](https://github.com/anthropics/skills)
- [awesome-claude-skills — Composio](https://github.com/ComposioHQ/awesome-claude-skills)
