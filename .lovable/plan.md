

## Page Builder — следующий раунд улучшений

### Что не докручено сейчас

**1. Шаблонов меньше, чем ниш.** В БД 6 шаблонов (`expert, beauty, fitness, business, tech, services`), а в `NICHES` — 16 значений. 10 ниш (`education, health, art, food, music, fashion, travel, realestate, events, other`) не имеют шаблона и уходят в захардкоженный fallback из 4 блоков (`profile/catalog/messenger/socials`). Тип `catalog` в манифесте отсутствует — fallback фактически даёт сломанный «голый» скелет.

**2. AI-промпт `niche-builder` не знает про новые ниши.** В `nichePrompts` Edge-функции прописаны только `barber/photographer/psychologist/fitness/musician/designer/teacher/shop/marketer/beauty/chef`. Для `expert, business, tech, services, education, health, art, food, fashion, travel, realestate, events, other` всегда подставляется generic «специалиста с услугами и контактами». AI генерирует обезличенно.

**3. AI возвращает блоки с типами, которых у нас нет.** Промпт обещает `link, product, testimonial, video, carousel`, а в новых шаблонах используются `pricing, gallery, booking, testimonials, form, links`. Это рассинхрон: AI-сборка и шаблон-сборка дают разные структуры → пользователь видит «не то, что в превью».

**4. Шаг `description` спрашивает только имя+bio.** План #4 из прошлого раунда (опциональные `services`/`contacts`) не был реализован — поля в `userInfo` объявлены, но в UI отсутствуют. AI получает пустые `details`, поэтому контент общий.

**5. Превью шаблона юзер не видит.** `selectedTemplate` авто-выбирается первым, шаг с каруселью пресетов пропущен. Юзер не понимает, что именно соберётся.

**6. Цель (`goal`) не передаётся в AI.** В `details` склеивается локализованная строка цели, но Edge-функция её игнорирует — ни в `systemPrompt`, ни в логике нет `input.goal`. CTA в собранной странице не подстраиваются под «лиды vs продажи vs визитка».

**7. На шаге `generating` нет реального таймаута.** Если Gemini подвиснет, юзер сидит на лоадере неограниченно. Нужен `Promise.race` с 25–30 сек.

**8. На `complete` нельзя вернуться назад.** Если результат не нравится — только закрыть и потерять прогресс. Нет «Перегенерировать с другой нишей/целью».

---

### План

**Шаг 1. Засеять оставшиеся 10 ниш шаблонами** (миграция).
По 1 шаблону для `education, health, art, food, music, fashion, travel, realestate, events, other` — 5–7 блоков с реалистичной структурой под нишу. Используем только существующие типы из манифеста (`profile, text, pricing, links, gallery, testimonials, form, faq, booking, messenger, socials, product, video, countdown, separator`). Fallback из 4-блочного `catalog`-скелета удалить — теперь он не нужен.

**Шаг 2. Расширить `nichePrompts` в `ai-content-generator`.**
Добавить промпт-описания для всех 16 ниш (`expert`, `education`, `business`, `health`, `art`, `food`, `music`, `tech`, `fashion`, `travel`, `realestate`, `events`, `services`, `other`). Каждое описание — 1–2 предложения с типичными услугами/контентом для ниши.

**Шаг 3. Синхронизировать список типов блоков в AI-промпте.**
Заменить устаревший список (`link, product, testimonial, carousel`) на актуальный из манифеста: добавить `pricing, gallery, testimonials (множ.), form, booking, links, faq`. Удалить недоступные `carousel`/`product` (или оставить только если они реально в манифесте — проверим).

**Шаг 4. Передавать `goal` в AI.**
Расширить тело запроса: `body.input.goal = selectedGoal`. В Edge-функции внутри `niche-builder` добавить goal-aware блок промпта: для `leads` — упор на `form/messenger/booking`, для `sales` — `pricing/product/payments`, для `brand` — `text/gallery/socials`, для `events` — `countdown/booking/form`.

**Шаг 5. Добавить опциональные поля в шаг `description`.**
Раскрывающийся блок «Добавить детали (необязательно)»: `services` (textarea, по строке) и `contacts` (Instagram/Telegram/WhatsApp одной строкой). Эти поля уже объявлены в `userInfo` и нужно только пробросить их в форму и в `details` для AI.

**Шаг 6. Вернуть превью шаблона перед генерацией.**
Между `niche` и `description` показать мини-карточку выбранного шаблона: иконки блоков по порядку + 1–2 строки описания + ссылка «Выбрать другой» (открывает карусель альтернативных шаблонов из той же ниши). Это снимет эффект «непонятно, что соберётся».

**Шаг 7. Таймаут и безопасный fallback.**
В `handleGenerate` обернуть `supabase.functions.invoke` в `Promise.race` с 25-секундным таймером. По таймауту/ошибке — тихо переключаться на `generateBlocksFromTemplate` без шумного toast-error; в логи писать `console.warn`.

**Шаг 8. «Перегенерировать» на шаге `complete`.**
Кнопка-секондари «🔄 Перегенерировать» рядом с «Опубликовать»/«Отредактировать»: возвращает на шаг `generating` и заново зовёт AI с теми же параметрами. Чтобы избежать абуза — лимит 2 ретрая в сессии (state-флаг).

**Шаг 9. UX-полировка.**
- На `generating` крутящийся текст-ticker реальных шагов: «Подбираем шаблон…» → «Спрашиваем у AI…» → «Раскладываем блоки…» (3 фазы с задержками, привязаны к реальным точкам кода через state).
- При успехе AI отдельно показывать «✓ AI сгенерировал контент», при fallback — «✓ Шаблон применён» — честность повышает доверие.

---

### Технические детали

| Файл | Действия |
|---|---|
| `supabase/migrations/<new>.sql` | INSERT 10 шаблонов в `templates` для нехватающих ниш. Все `is_public=true`, осмысленный `sort_order`, корректные `category`. |
| `supabase/functions/ai-content-generator/index.ts` | Расширить `nichePrompts` до 16 записей. Заменить список типов блоков на актуальный (сверка с `BLOCK_MANIFEST`). Добавить чтение и использование `input.goal`. |
| `src/components/onboarding/AIBuilderWizard.tsx` | (a) Добавить опциональные поля `services`/`contacts` на шаге `description` (collapsible). (b) Добавить шаг-превью шаблона между `niche` и `description` (или мини-карточку в `description`). (c) Передавать `goal` в `body.input.goal`. (d) `Promise.race` с таймаутом 25с. (e) Кнопка «Перегенерировать» на `complete` со счётчиком ретраев. (f) Удалить хардкоженный `catalog`-fallback в `handleSelectNiche`. |
| `src/locales/{ru,en,kk,uz}/translation.json` | Ключи: `aiBuilder.servicesLabel`, `aiBuilder.servicesPlaceholder`, `aiBuilder.contactsLabel`, `aiBuilder.contactsPlaceholder`, `aiBuilder.moreDetailsToggle`, `aiBuilder.previewTitle`, `aiBuilder.regenerate`, `aiBuilder.aiSucceeded`, `aiBuilder.fallbackUsed`, `aiBuilder.timeout`. |

### Что НЕ трогаем
- БД-схему `templates` (только сидинг).
- `useDashboard.ts` — обработчик публикации уже работает.
- `useDashboardOnboarding.ts` — унификация ключей сделана.
- Сам редактор и `BlockRenderer`.

### Риски
- Если AI вернёт блоки с `type`, отсутствующим в манифесте, `createBaseBlock` бросит — уже обёрнуто в try/catch на уровне `useDashboardAI`, но в `AIBuilderWizard.handleGenerate` сейчас НЕ обёрнуто. Нужно добавить фильтрацию `aiBlocks` по списку известных типов перед `createBaseBlock`.

