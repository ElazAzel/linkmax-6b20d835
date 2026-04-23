

## Аудит «Конструктора страницы» для новых пользователей

### Что я нашёл (главные проблемы)

**1. В БД нет ни одного публичного шаблона** (`SELECT … FROM templates WHERE is_public=true` → 0 строк).
Из-за этого `AIBuilderWizard` на шаге выбора ниши всегда падает в хардкоженный fallback из 4 блоков (`profile + catalog + messenger + socials`) — независимо от того, выбрал пользователь «Барбер», «Эксперт» или «Фитнес». Получается «один и тот же скелет» для всех ниш.

**2. Дублирующиеся визарды и ветви онбординга.** В кодовой базе сосуществуют четыре конкурирующих компонента:
- `AIBuilderWizard.tsx` — реально показывается новым юзерам (5 шагов: goal → niche → description → generating → complete)
- `OnboardingWizard.tsx` — мёртвый код, не подключён нигде
- `QuickStartFlow.tsx` — мёртвый код
- `NicheOnboarding.tsx` — мёртвый код

Все они пишут в **разные** localStorage-ключи (`linkmax_onboarding_completed`, `niche_onboarding_completed`, `ai_builder_used`, `onboarding_completed`) — отсюда плавающее поведение «у меня визард открылся снова» / «не открылся вообще».

**3. Шаг «generating» — фейк.** В `AIBuilderWizard.handleGenerate` нет вызова AI:
```ts
await new Promise(resolve => setTimeout(resolve, 1500)); // искусственная задержка
```
Контент собирается чисто детерминистическим `generateBlocksFromTemplate` (regex по `services`/`socials`/`contacts`). При этом UI на шаге `description` спрашивает только `name` + `bio` — поля `services`, `socials`, `contacts`, `mediaLinks` в `userInfo` остаются пустыми, поэтому почти все эвристики гидратации не срабатывают. На выходе — голый шаблон с подставленным именем.

**4. Поломанная подача.** Текст «Нейро-алгоритм собирает страницу… Магия InkMAX ✨» обещает AI, а реально AI не вызывается. Это вызывает разочарование, даже если технически блоки появились.

**5. Edge `ai-content-generator` `niche-builder`** реально умеет генерировать контент через Gemini, но **этот код-путь больше не вызывается** — старый `OnboardingWizard` его дёргал, новый `AIBuilderWizard` обходит.

**6. Опечатки в i18n** на проде: «Выберите сферню», «Магия InkMAX» (должно быть LinkMAX).

**7. Шаг «опубликовать сейчас»** ставит флаг `wizard_wants_publish=true`, но обработчика этого флага в дашборде нет (поиск по коду пустой) — кнопка ничего не публикует.

---

### План исправления

**Шаг 1. Унификация онбординга (cleanup).**
- Удалить мёртвые `OnboardingWizard.tsx`, `QuickStartFlow.tsx`, `NicheOnboarding.tsx`.
- Свести storage-ключи к одному: `onboarding_completed`. Мигрировать чтение старых ключей за совместимость.
- Оставить `AIBuilderWizard` как единственный визард.

**Шаг 2. Починить генерацию (главное).**
Заменить фейковую `setTimeout`-задержку на реальный вызов edge-функции `ai-content-generator` с типом `niche-builder` (он уже работает и возвращает `{ profile, blocks }`). Передавать `niche + name + bio + goal` как `details`. Сохранить `generateBlocksFromTemplate` как fallback при ошибке/таймауте AI.

**Шаг 3. Засеять templates таблицу.**
Создать миграцию с базовым набором публичных шаблонов хотя бы для топ-6 ниш (`expert`, `beauty`, `fitness`, `services`, `business`, `tech`) — по 5–7 блоков каждый, с разнообразной структурой (hero, услуги, отзывы, контакты, форма). Это даст визарду реальные «скелеты» вместо одного fallback на всех.

**Шаг 4. Расширить шаг «description».**
Добавить опциональные поля `services` (textarea с подсказкой «по строке на услугу, можно с ценой») и `contacts` (Instagram/WhatsApp/Telegram). Они уже умеют парситься в `internal-builder.ts`, но пустуют. Поля свернуть в expandable «Добавить детали (необязательно)», чтобы не пугать новых юзеров.

**Шаг 5. Honest UX.**
- Переписать тексты шага `generating`: убрать «Нейро-алгоритм», показывать честный прогресс («Подбираем шаблон → Заполняем профиль → Раскладываем блоки»).
- Исправить опечатки: «сферню» → «сферу», «InkMAX» → «LinkMAX» (в `ru.json` и `kk.json`).

**Шаг 6. Починить «Опубликовать сейчас».**
Добавить в `useDashboard` обработчик: при наличии `wizard_wants_publish` после `handleNicheComplete` вызвать `cloudState.publishPage()` и тостить результат, затем чистить флаг.

**Шаг 7. Тест-проверка для новых юзеров.**
После изменений — пройти полный путь signup → wizard → редактор: убедиться, что (а) визард открывается ровно один раз, (б) после генерации в редакторе появляется ≥5 разнообразных блоков с реальным контентом, (в) кнопка «опубликовать» публикует.

---

### Технические детали (для разработчиков)

| Файл | Действие |
|---|---|
| `src/components/onboarding/AIBuilderWizard.tsx` | Заменить `setTimeout(1500)` на `supabase.functions.invoke('ai-content-generator', { body: { type: 'niche-builder', input: { niche, name, details: bio, services, contacts } } })`. Fallback на `generateBlocksFromTemplate` при ошибке. Расширить форму на шаге `description`. |
| `src/hooks/dashboard/useDashboardOnboarding.ts` | Свести 3 storage-ключа в один `onboarding_completed`, читать старые для миграции. |
| `src/hooks/dashboard/useDashboard.ts` | В `handleNicheComplete` после применения проверить `storage.get('wizard_wants_publish')`, вызвать публикацию, удалить флаг. |
| `supabase/migrations/<new>.sql` | INSERT 6×шаблонов в `public.templates` с `is_public=true`, разные `category`, осмысленные `blocks` JSON. |
| Удалить файлы | `src/components/onboarding/OnboardingWizard.tsx`, `QuickStartFlow.tsx`, `NicheOnboarding.tsx` + ссылки. |
| `src/locales/{ru,kk,en,uz}/translation.json` | Исправить опечатки `nicheTitle`, `aiBuilder.nicheQuestions.generateBtn`. |
| `supabase/functions/ai-content-generator/index.ts` | Расширить `niche-builder` промпт, чтобы возвращал 5–7 блоков (сейчас может вернуть и 3). Не критично. |

### Что НЕ трогаем
- `GridEditor` / `BlockEditorV2` — сам редактор работает корректно, drag&drop, autosave и preview исправны (проверено).
- `BlockRenderer`, манифест блоков — стабильны.

