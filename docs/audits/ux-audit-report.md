# UI/UX Mobile-first Audit Report (v2)

## Инвентаризация экранов

| Экран | Mobile (375x812) | Desktop (1440x900) | Статус |
|-------|------------------|--------------------|--------------------|
| Landing (/) | ✅ OK | ✅ OK | Полностью адаптирован |
| Auth (/auth) | ✅ OK | ✅ OK | Glassmorphism, валидация на русском |
| Dashboard | ✅ OK | ✅ OK | Tab navigation, iOS-style |
| Editor | ✅ OK | ✅ OK | Floating toolbar, undo/redo |
| CRM | ✅ OK | ✅ OK | Messenger-style, empty state |
| Analytics | ✅ OK | ✅ OK | Cards, period selector |
| Pricing | ✅ OK | ✅ OK | i18n корректно |
| Gallery | ✅ OK | ✅ OK | Grid, filters |
| Public Page | ✅ OK | ✅ OK | Skeleton loading |

## Аудит v2 — Исправления (2026-03-08)

### P0: Машинный перевод на русский — FIXED

| Ключ | Было | Стало |
|------|------|-------|
| `landing.newLead1/2` | "Новый ведущий" | "Новый лид" |
| `landing.leadMsg2` | "Потрясающий! Позволять" | "Отлично! Давайте запланируем." |
| `landing.newLeadCaptured` | "Новый лидер захвачен" | "Новый лид получен" |
| `landing.v2.testimonials.title` | "Любимо" | "Нас любят" |
| `landing.v2.testimonials.suffix` | "создателями" | "креаторов" |
| `landing.v2.nav.start` | "Начинать" | "Старт" |
| `landing.v2.nav.login` | "Авторизоваться" | "Войти" |
| `imageStyles.circle` | "круглый урожай" | "обрезка по кругу" |
| `imageScales.fill` | "Потягиваться" | "Растянуть" |
| `gradients.light` | "Световое наложение" | "Светлый оверлей" |
| `fields.scratchRevealPlaceholder` | "Царапины, чтобы раскрыть" | "Скретч-карточка" |
| `scratch.scratchHere` | "Царапины здесь" | "Потрите здесь" |
| `footer.legal` | "Юридический" | "Правовая информация" |
| `streak.title` | "Полоса" | "Серия" |
| `streak.awesome` | "Потрясающий!" | "Отлично!" |
| `streak.milestones` | "Вехи серии" | "Достижения серии" |
| `streak.days` | "дни" | "дн." |
| `heights.*` | "пикселей." | "px" |
| `avatarSizes.*` | "пикселя." | "px" |
| `testimonials.reviews.artist` | Обрезанный текст | Полный текст |

### P1: Auth validation — FIXED

**Файл:** `src/components/screens/Auth.tsx`
**Проблема:** Hardcoded английские zod-сообщения валидации
**Решение:** `createAuthSchema(t)` — фабрика с `t()` вызовами + новый namespace `auth.validation.*` в ru.json

### P1: InteractiveDemo — FIXED

**Проблема:** Отсутствующие ключи `landing.demo.step1Title` и др. в ru.json
**Решение:** Добавлен полный блок `landing.demo.*` (15 ключей)

### P1: Footer — FIXED

**Проблема:** `footer.legal` = "Юридический"
**Решение:** Исправлено на "Правовая информация"

## Ранее исправленные проблемы (v1)

### ✅ i18n Object/String Mismatch
**Файл:** `src/pages/Pricing.tsx`  
**Решение:** `t('pricing.free')` → `t('pricing.free.title')`

### ✅ TypeScript `any` в ProjectsTab
**Файл:** `src/components/dashboard/ProjectsTab.tsx`  
**Решение:** Type guard с проверкой `block.type === 'profile'`

## UI Contract (Стандарты)

### Typography
- H1: `text-2xl font-black` / `text-3xl font-black`
- H2: `text-xl font-bold` / `text-2xl font-bold`
- Body: `text-base` / `text-sm`
- Caption: `text-xs text-muted-foreground`

### Touch Targets
- Minimum: 44px (h-11)
- Primary CTA: 56px (h-14)
- Tab bar items: 64px (h-16)

### Animations
- Scale on press: `active:scale-[0.98]`
- Hover scale: `hover:scale-[1.02]`
- Transition: `transition-all duration-200`

## Изменённые файлы (v2)

1. `src/i18n/locales/ru.json` — ~30 исправлений машинного перевода + 15 новых ключей
2. `src/components/screens/Auth.tsx` — локализация zod validation
3. `docs/audits/ux-audit-report.md` — обновлённый отчёт
