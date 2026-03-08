
# UX/UI Аудит и Исправление Переводов

## Найденные проблемы

### P0: Машинный/кривой перевод на русский (критично — видно пользователям)

| Ключ | Текущий перевод | Правильный перевод |
|------|----------------|-------------------|
| `landing.newLead1` | "Новый **ведущий**: Сара К." | "Новый **лид**: Сара К." |
| `landing.newLead2` | "Новый **ведущий**: Алекс М." | "Новый **лид**: Алекс М." |
| `landing.leadMsg2` | "**Потрясающий! Позволять**" | "Отлично! Давайте запланируем." |
| `landing.newLeadCaptured` | "Новый **лидер захвачен**" | "Новый лид получен" |
| `landing.v2.testimonials.title` | "**Любимо**" | "Нас любят" |
| `landing.v2.testimonials.suffix` | "**создателями**" | "креаторов" |
| `landing.v2.nav.start` | "**Начинать**" | "Старт" |
| `landing.v2.nav.login` | "**Авторизоваться**" | "Войти" |
| `imageStyles.circle` | "Круг — **круглый урожай**" | "Круг — обрезка по кругу" |
| `imageScales.fill` | "**Потягиваться**" | "Растянуть" |
| `gradients.light` | "**Световое наложение**" | "Светлый оверлей" |
| `fields.scratchRevealPlaceholder` | "**Царапины, чтобы раскрыть**" | "Скретч-карточка" |
| `scratch.scratchHere` | "👆 **Царапины здесь**" | "👆 Потрите здесь" |
| `footer.legal` | "**Юридический**" | "Правовая информация" |
| `streak.title` | "**Полоса**" | "Серия" |
| `streak.awesome` | "**Потрясающий!**" | "Отлично!" |
| `streak.milestones` | "**Вехи серии**" | "Достижения серии" |
| `streak.days` | "**дни**" | "дн." |
| `heights.small/medium/large` | "Маленький - 120 **пикселей**" (с точкой) | "Маленький — 120px" (без точки) |
| `avatarSizes.*` | "Маленький – 64 **пикселя.**" | "Маленький — 64px" |
| `landing.v2.testimonials.reviews.artist` | "Эстетика на другом уровне. Это не" (обрезано!) | Полный текст |

Всего: ~25+ ключей с явно машинным или обрезанным переводом.

### P1: UX проблемы на экранах

1. **Auth (validation messages)** — сообщения валидации zod на английском: "Please enter a valid email address", "Password must contain..." — нужны русские строки
2. **InteractiveDemo** — использует `landing.demo.step1Title` с fallback, но в ru.json ключи лежат в `landing.demo` без `step1Title/step2Title/step3Title` — показывается английский fallback
3. **Footer** — `landingV5.footer.description/copyright/examples/pricing/terms/privacy` используются в коде, но для русского перевод есть только частично
4. **PremiumFooter** — `footer.product`, `footer.legal`, `footer.contacts` — корректны, но `footer.legal` = "Юридический" вместо "Правовая информация"

### P2: Дублирование и неконсистентность

- Несколько версий landing переводов: `landing.demo`, `landing.v4`, `landing.v6`, `landingV5` — используются разные ключи в разных версиях UI, но на продакшене активна только v2/v4
- `landing.pricing` существует в 3 местах: root, v2, v6

---

## План реализации

### Task 1: Исправить ~30 машинных переводов в ru.json

Заменить все найденные кривые ключи на правильный русский перевод. Включает:
- Все "ведущий/лидер захвачен" → "лид/лид получен"
- Все "Царапины" → "Скретч/Потрите"  
- Все "Потягиваться/Световое/круглый урожай" → корректные термины
- Обрезанные строки (testimonials.reviews.artist)
- Streak переводы
- Heights/avatarSizes с точками

### Task 2: Локализовать validation messages в Auth

Заменить hardcoded английские zod-сообщения на `t()` в `src/components/screens/Auth.tsx`:
- "Please enter a valid email address" → auth.validation.email
- "Password must be at least 8 characters" → auth.validation.passwordMin
- и т.д.

### Task 3: Добавить недостающие ключи InteractiveDemo

В ru.json добавить `landing.demo.step1Title`, `step2Title`, `step3Title`, `step1Desc`, `step2Desc`, `step3Desc` и связанные ключи (chatMsg1, chatMsg2, leadCaptured и т.д.)

### Task 4: Синхронизировать Footer переводы

Убедиться что `landingV5.footer.*` ключи имеют корректный русский перевод для PremiumFooter.

### Task 5: Обновить UX audit report

Обновить `docs/audits/ux-audit-report.md` с результатами аудита.

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/i18n/locales/ru.json` | ~30 исправлений + ~15 новых ключей |
| `src/components/screens/Auth.tsx` | Локализация zod validation |
| `docs/audits/ux-audit-report.md` | Обновить отчёт |

---

## Ожидаемый результат

- Нет машинных/кривых переводов на видимых экранах
- Validation messages на русском
- InteractiveDemo полностью на русском
- Footer корректен во всех языках
