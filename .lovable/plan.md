

# Activation System 2.0 — Product Audit & Implementation Plan

---

## 1. Краткий вердикт

**Что стало лучше:**
- ActivationChecklist даёт видимый прогресс, шаги привязаны к реальным действиям
- AIBuilderWizard — единый entry point, динамическая форма подстраивается под шаблон
- Контекстные tips на HomeScreen реагируют на состояние страницы
- OnboardingTour локализован

**Что остаётся поверхностным:**
- Checklist считает "аватар" и "первый блок" — это UI-действия, а не value outcomes
- `has_shared_page` хранится в localStorage без связи с реальным событием (нет проверки, что кто-то увидел страницу)
- После завершения чеклиста (или его dismiss) — **пустота**: нет следующего этапа
- AIBuilderWizard генерирует страницу, но не ведёт к публикации — пользователь остаётся на dashboard без следующего CTA
- Нет ни одного серверного activation event — невозможно измерить activation rate

**Риски слабой активации:**
- Пользователь проходит wizard → видит dashboard → не понимает, что делать → уходит
- Checklist dismissible — один клик на X убирает guidance навсегда
- Нет post-publish experience (после публикации — тот же HomeScreen)

---

## 2. Главная проблема activation

Checklist и tour — **feedback mechanisms**, а не **activation drivers**. Они показывают прогресс, но не сокращают time-to-value и не устраняют friction.

**Где пользователь застревает:**
1. **Post-wizard gap**: После AIBuilderWizard страница создана, но не опубликована. Wizard закрывается → пользователь на HomeScreen → нет автоматического перехода к publish
2. **Post-publish gap**: Страница опубликована → что дальше? Нет guidance к шерингу с конкретным каналом
3. **Post-share gap**: Пользователь поделился → но не знает, пришёл ли кто-то. Нет real-time feedback на первый view

**Fake progress:**
- "Зарегистрироваться" — всегда completed, не несёт ценности как шаг
- "Добавить аватар" — косметика, не влияет на бизнес-результат
- "Добавить первый блок" — после wizard уже выполнено автоматически, шаг бесполезен

---

## 3. Правильный activation moment

**Activation для LinkMAX = первый внешний визит на опубликованную страницу.**

Это момент, когда пользователь получил реальное доказательство, что платформа работает.

**Ложные surrogate metrics:**
- Количество блоков — не значит ценность
- Наличие аватара — косметика
- Факт публикации без трафика — мёртвая страница
- "Поделился" через localStorage — не подтверждает, что кто-то перешёл

**Настоящие activation signals:**
- `page_published` + `first_external_view` (в течение 24ч) — **primary activation**
- `first_lead_captured` — **deep activation** (пользователь получил бизнес-value)
- `return_after_first_view` — retention signal (вернулся посмотреть аналитику)

---

## 4. Пересборка activation funnel

| Этап | Цель | Главный friction | Изменение в продукте | Event |
|------|------|-----------------|---------------------|-------|
| **Signup** | Создать аккаунт | Email verification | Уже работает | `user_signed_up` |
| **Onboarding entry** | Попасть в wizard | Пользователь нажал Skip | Убрать Skip на первом шаге, оставить только выбор ниши | `wizard_started` |
| **First page draft** | Сгенерировать страницу | Слишком много полей | Оставить только name обязательным, остальное auto-fill позже | `wizard_completed` |
| **First meaningful edit** | Персонализировать | Не знает что менять | После wizard — открывать editor с подсвеченным profile block | `first_edit_after_wizard` |
| **Publish** | Сделать страницу доступной | Забывает нажать publish | **Auto-publish после wizard** с confirm dialog | `page_published` |
| **Share** | Отправить ссылку | Не знает куда | Показать конкретные каналы (WhatsApp, Telegram, Instagram) с pre-filled message | `page_shared_{channel}` |
| **First traffic** | Получить первый view | Никто не переходит | Real-time push notification "🎉 Первый посетитель!" | `first_external_view` |
| **First conversion** | Получить лид/клик | Нет CTA блоков | Подсказка "Добавьте форму сбора контактов" | `first_lead` / `first_block_click` |
| **Retained return** | Вернуться и продолжить | Нет причины возвращаться | Уведомление "У вас 5 новых просмотров" | `dashboard_return_after_publish` |

---

## 5. ActivationChecklist 2.0

### Текущие шаги → замена:

| Текущий | Проблема | Замена |
|---------|----------|--------|
| ✅ Зарегистрироваться | Всегда done, мусор | **Убрать** |
| ☐ Добавить аватар | Косметика | **Убрать** из основного, переместить в "бонусные советы" |
| ☐ Первый блок | После wizard уже done | **Заменить**: "Отредактируйте свою страницу" (changed any block after wizard) |
| ☐ Опубликовать | ОК, оставить | **Оставить**, но action = one-tap publish |
| ☐ Поделиться | localStorage-based | **Заменить**: "Получите первого посетителя" (outcome-based, проверяется через `view_count > 0`) |

### Новый чеклист (4 шага):

1. **Создайте страницу** — completed после wizard (или manual add block)
2. **Опубликуйте** — `isPublished === true`
3. **Получите первого посетителя** — `viewCount >= 1` (серверная проверка)
4. **Получите первый отклик** — `leadsCount >= 1` или `totalClicks >= 1`

### Поведение:
- **Не dismissible** до шага 2 (publish). После — dismissible, но возвращается если вернулся на home
- При 100% — трансформируется в **celebration card** на 1 сессию, затем заменяется на growth dashboard
- Прогресс-бар показывает % от value, не от действий
- Каждый completed шаг → confetti micro-animation + toast

---

## 6. AIBuilderWizard improvements

### Критические изменения:

1. **Убрать Skip на шаге niche** — если пользователь новый, niche selection обязательна. Skip = потеря пользователя
2. **После complete step — не просто закрывать dialog**, а:
   - Показать preview сгенерированной страницы (inline phone mockup)
   - CTA "Опубликовать сейчас" (primary) / "Редактировать сначала" (secondary)
   - Если нажал "Опубликовать" — auto-publish + сразу ShareAfterPublishDialog
3. **Сократить dynamic_form**: name обязателен, bio — 1 sentence placeholder с примером для ниши, остальные поля collapsed ("Добавить детали →")
4. **Добавить social proof** на шаг niche: "12,000 страниц создано" (число из DB или hardcoded)
5. **Complete step**: убрать "сертификат" (gimmick, не ведёт к action), заменить на preview + publish CTA

### Чего wizard не должен делать:
- Спрашивать больше 2 полей на одном экране
- Показывать "генерацию" дольше 2 секунд (сейчас 1.5с + 1.5с = 3с — сократить)
- Закрываться без next action

---

## 7. HomeScreen as activation hub

### По состояниям пользователя:

**Состояние: Новый (после wizard, не опубликован)**
- Hero card: preview страницы + большая зелёная кнопка "Опубликовать →"
- Checklist: шаги 1-4
- Убрать: marketplace, gallery, premium upsell — отвлекает

**Состояние: Опубликован, 0 просмотров**
- Hero card: "Ваша страница готова! Поделитесь ссылкой"
- Share buttons: WhatsApp, Telegram, Copy link (pre-filled messages)
- Checklist: шаги 2-4 (2 done)
- Убрать: tips про "добавьте блок с ценами" — преждевременно

**Состояние: Есть трафик, нет конверсий**
- Hero card: stats (views, clicks)
- Tip: "Добавьте форму для сбора контактов" → ведёт в editor с auto-add form block
- Checklist: 3 из 4

**Состояние: Есть конверсии**
- Checklist: celebration → скрыть
- Показать: growth metrics, analytics preview, upgrade CTA (если free)

### Контекстные tips — что полезно vs мусор:
- ✅ "Добавьте форму — каждая 5-я страница с формой получает лиды" (конкретно, с данными)
- ✅ "Поделитесь в Instagram Stories — это ваш главный источник трафика" (если instagram в socials)
- ❌ "Добавьте блок с ценами, чтобы увеличить конверсию на 40%" — fake stat, слишком рано
- ❌ "Почему LinkMAX" value props card — пользователь уже зарегистрирован, это лендинг-копи

---

## 8. Dynamic onboarding logic

| Сегмент | Показывать | Куда вести | Не показывать |
|---------|-----------|------------|---------------|
| **Новый без страницы** | AIBuilderWizard auto-open | Wizard → publish → share | Quick actions, analytics, marketplace |
| **Черновик без publish** | Checklist + "Опубликуйте" CTA, preview button | Publish flow → share dialog | Analytics (нет данных), premium |
| **Published, no share** | Share widget с каналами | Конкретный share action | "Добавьте аватар", gallery |
| **Traffic, no conversion** | Inline tip "Добавьте форму" + analytics mini | Editor → add form block | General tips, "Почему LinkMAX" |
| **Has conversions** | Growth dashboard, analytics | Insights tab, upgrade | Checklist, onboarding tips |
| **Returned inactive (7d+)** | "С момента последнего визита: X просмотров, Y кликов" | Analytics → editor | Full onboarding, wizard |

---

## 9. Empty states and nudges

| Экран | Empty state | Nudge |
|-------|------------|-------|
| **Analytics (0 views)** | "Опубликуйте и поделитесь страницей, чтобы увидеть статистику" + Share CTA | Inline, не dismissible |
| **Leads (0 leads)** | "Добавьте форму сбора контактов или блок регистрации" + "Добавить форму" button | Inline |
| **CRM Contacts (0)** | "Контакты появятся автоматически из форм на вашей странице" | Inline |
| **Bookings (0)** | "Добавьте блок бронирования на страницу" + link to editor | Inline |
| **Editor (1 profile block)** | Пульсирующая кнопка "+" с tooltip "Добавьте первый блок" | Auto-show, dismiss после первого add |

**Soft reminders (не nagging):**
- Email через 24ч если не опубликовал: "Ваша страница почти готова"
- Push через 48ч если 0 просмотров: "Поделитесь ссылкой чтобы получить первых посетителей"
- НЕ показывать popup напоминания при каждом входе

---

## 10. Events and analytics

### Activation funnel events (приоритет 1):

```
wizard_started          → user opened AIBuilderWizard
wizard_niche_selected   → picked a niche
wizard_completed        → generated page
page_published          → first publish
page_shared             → used share dialog (with channel: whatsapp/telegram/copy/etc)
first_external_view     → view_count went from 0 to 1
first_block_click       → someone clicked a block on published page
first_lead_captured     → form submission / booking / event registration
dashboard_return        → returned to dashboard after 24h+ gap
```

### North Star: **Activation Rate** = users who reach `first_external_view` within 7 days of signup

### Weekly dashboard (7 metrics):
1. **Signup → Wizard completion rate** (target: 80%)
2. **Wizard → Publish rate** (target: 60%)
3. **Publish → First view rate** (target: 50%)
4. **Time to first publish** (target: <10 min)
5. **Time to first view** (target: <24h)
6. **Checklist completion rate** (target: 40%)
7. **D7 retention** (returned after 7 days)

---

## 11. Experiments (10 конкретных)

| # | Гипотеза | Метрика | Риск |
|---|---------|---------|------|
| 1 | **Auto-publish после wizard** увеличит publish rate на 30% | wizard → publish rate | Пользователь может не хотеть публиковать незаконченную страницу |
| 2 | **Убрать Skip в wizard** увеличит completion rate на 15% | wizard start → complete | Может увеличить bounce если wizard длинный |
| 3 | **Share widget с pre-filled WhatsApp message** увеличит share rate на 40% | publish → share rate | Канал может быть нерелевантен (не все используют WhatsApp) |
| 4 | **Real-time "Первый посетитель!" toast** увеличит D1 retention на 20% | return within 24h after first view | Требует realtime infra |
| 5 | **Outcome-based checklist** (viewCount > 0) vs action-based увеличит activation | first_external_view rate | Шаг "получите посетителя" может казаться недостижимым |
| 6 | **Collapse optional fields** в wizard form увеличит completion | wizard form → generate rate | Пользователь может не заполнить важные поля |
| 7 | **Post-wizard preview + publish CTA** вместо certificate увеличит publish rate на 25% | wizard complete → publish | Нужен inline preview renderer |
| 8 | **Убрать "Почему LinkMAX" card** с HomeScreen не повлияет на churn | D7 retention | Может снизить perceived value для совсем новых |
| 9 | **Empty analytics → share CTA** увеличит share rate у опубликованных на 20% | published users → share | Analytics tab может не посещаться |
| 10 | **"X просмотров за последние 24ч" push** увеличит return rate на 15% | D1/D3 return | Может раздражать если 0 просмотров |

---

## 12. UX/UI changes

### Layout & hierarchy:
- **HomeScreen**: убрать "Почему LinkMAX" card — это лендинг-копи, не dashboard content
- **Checklist**: переместить ВЫШЕ page card (сейчас ниже) — первое, что видит пользователь
- **Share actions**: после publish — полноэкранный share sheet с каналами, а не маленький dialog

### CTA priority:
- Pre-publish: **"Опубликовать"** = primary (зелёная), "Редактировать" = secondary
- Post-publish, pre-share: **"Поделиться"** = primary, "Редактировать" = secondary
- Post-share: **"Открыть аналитику"** = primary

### Microcopy:
- Checklist step "Получите первого посетителя" вместо "Поделитесь ссылкой" — outcome framing
- Tip: "5 из 10 пользователей получают первого посетителя в первый час" — social proof
- Post-publish toast: "🎉 Ваша страница доступна по ссылке lnkmx.my/slug" + кнопка "Скопировать"

### Celebratory moments:
- Publish → confetti + звук + toast с ссылкой
- First view → animated counter update + toast "Кто-то зашёл на вашу страницу!"
- First lead → celebration card на HomeScreen на 1 сессию

### Post-publish experience:
- Вместо возврата на тот же HomeScreen — показать **share-focused state**: большие кнопки WhatsApp, Telegram, Instagram, Copy Link
- Через 1 минуту после publish — если view_count всё ещё 0, показать inline "Поделитесь, чтобы получить посетителей"

---

## 13. Что нельзя делать

- ❌ **Popup при каждом входе** с напоминанием опубликовать — nagging
- ❌ **Mandatory tour** перед доступом к editor — блокирует power users
- ❌ **Gamification ради gamification**: сертификат, achievements за "добавил аватар" — fake productivity
- ❌ **Показывать premium upsell** до publish — пользователь ещё не получил value
- ❌ **"Почему LinkMAX" value props** на dashboard — пользователь уже конвертировался
- ❌ **Скрытие editor** за onboarding — пользователь должен иметь возможность пропустить и сразу работать
- ❌ **Tracking "shared" через localStorage** — не является реальным сигналом

---

## 14. Финальная рекомендация

### Strongest activation loop:

```
Wizard → Auto-publish prompt → Share sheet с каналами → 
First view notification → Return to see analytics → 
Add form block → First lead → Upgrade
```

### Что внедрять первым (P0, эта итерация):

1. **Переделать checklist на outcome-based** (4 шага вместо 5, view_count вместо localStorage)
2. **Wizard complete → publish CTA** вместо certificate (preview + "Опубликовать сейчас")
3. **Post-publish share sheet** с конкретными каналами (WhatsApp pre-filled message)
4. **Убрать "Почему LinkMAX" card** с HomeScreen
5. **Переместить checklist выше page card**
6. **Добавить серверные activation events** (хотя бы `wizard_completed`, `page_published`, `page_shared`)

### Что внедрять вторым (P1, следующий спринт):
- Real-time first view notification
- Empty state CTAs в analytics/leads/CRM
- Dynamic HomeScreen по сегментам
- Email/push nudges для неактивных

### Что не трогать пока:
- OnboardingTour — работает, не критичен для activation
- Achievement system — nice-to-have, не влияет на core funnel
- Template marketplace — discovery feature, не activation

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/hooks/onboarding/useActivationChecklist.ts` | Переписать шаги на outcome-based (4 шага, viewCount, leadsCount) |
| `src/components/onboarding/ActivationChecklist.tsx` | Обновить UI: celebration state, non-dismissible до publish |
| `src/components/onboarding/AIBuilderWizard.tsx` | Заменить certificate на preview + publish CTA, убрать Skip на niche |
| `src/components/dashboard-v2/screens/HomeScreen.tsx` | Убрать "Почему LinkMAX", переместить checklist вверх, dynamic CTA по состоянию |
| `src/components/referral/ShareAfterPublishDialog.tsx` | Добавить pre-filled messages для WhatsApp/Telegram |
| `src/lib/activation-events.ts` | **Создать**: серверные activation events через analytics table |
| `src/i18n/locales/ru.json` | Обновить ключи activation.steps.* |
| `src/i18n/locales/en.json` | Обновить ключи activation.steps.* |
| `src/i18n/locales/kk.json` | Обновить ключи activation.steps.* |

