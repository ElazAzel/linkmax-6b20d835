## Цель

Довести до продакшена три параллельных трека: (1) отполировать недавно выпущенную кастомизацию профиля, (2) дать владельцу страницы понятную аналитику «что работает», (3) поднять конверсию публичных страниц через встроенные CRO-инструменты. Всё — в рамках Warm Paper, без ломающих миграций, база бесплатна, «wow» — Premium.

---

## Трек A. Полировка кастомизации профиля

Цель: снять острые углы после большого релиза, поднять качество, добавить недостающие пресеты.

1. **Live-preview в редакторе**
   - Правая колонка `ThemePanel` — мини-фрейм с реальным `ProfileBlock` + одним CTA-блоком, обновляется на каждое изменение без сохранения.
   - Кнопка «Сброс к теме» откатывает переопределения к пресету.

2. **Пресеты обложек и паттернов**
   - Довести до 12 градиентов и 6 паттернов (dots, grid, waves, noise, topo, mesh) — сейчас часть заглушена.
   - Video-cover и animated-mesh — гейт Premium с превью-постером для free.

3. **Аватар**
   - Формы blob и sticker — фактическая маска через SVG `clipPath`, а не border-radius.
   - Status-ring (online/verified/custom-color) как отдельный слой, не ломает существующие рамки.

4. **Анимации имени**
   - Аудит на мобильных: `glitch`, `ticker`, `rainbow-slow` — проверить FPS и переполнение контейнера.
   - Добавить `prefers-reduced-motion` fallback → статичный gradient.

5. **A11y и i18n**
   - Контраст авто-подбора accent-цвета (WCAG AA) — если проваливается, подставляем dark/light вариант текста.
   - Все новые ключи в ru/en/kk/uz, включая tooltips премиум-гейта.

6. **Снапшоты**
   - Каждое изменение `appearance` → запись в `page_snapshots` (уже есть триггер), добавить «Откатить к предыдущей теме» в UI.

---

## Трек B. Аналитика профиля v2

Цель: владелец страницы за 10 секунд понимает, что работает и что чинить.

1. **Data-слой**
   - Использовать уже существующую каноническую таксономию (`analytics.metadata.event`, `source_object`).
   - Новые RPC (SECURITY DEFINER, доступ по `page_id` владельца):
     - `get_page_funnel(page_id, from, to)` — visits → profile_view → block_click → cta_click.
     - `get_block_heatmap(page_id, from, to)` — clicks / impressions по каждому блоку + CTR.
     - `get_traffic_sources(page_id, from, to)` — группировка по `utm_source` + AI-detection (ChatGPT/Perplexity/Claude/Gemini уже есть).
     - `get_geo_breakdown(page_id, from, to)` — страна/город по IP.

2. **UI (`/dashboard/insights`)**
   - 4 карточки KPI: Visits, Unique, CTA rate, Top block.
   - Воронка (horizontal bar), Heatmap (список блоков + CTR + sparklines), Источники (donut + список), Гео (флаги + %).
   - Фильтр периода: 7д / 30д / 90д / custom.
   - Empty-state: подсказки «мало данных → поделись SmartLink».

3. **Weekly digest**
   - Расширить `send-weekly-digest`: включить top-block, best source, CTA-rate change WoW.
   - Telegram-вариант (если бот подключён) + email fallback.

4. **Экспорт**
   - CSV export кликов/визитов (только owner, лимит 90 дней) через edge-функцию.

---

## Трек C. Конверсия публичной страницы

Цель: превратить страницу из «визитки» в лид-машину.

1. **Sticky CTA-док**
   - Фиксированная нижняя панель на мобиле: до 3 CTA (WA / TG / tel / email / custom link).
   - Настраивается в редакторе (новый блок-псевдо `sticky_cta`), автоскрывается при скролле вверх.
   - Каноническое событие `cta_click` с `source_object: {type:'sticky_cta'}`.

2. **Exit-intent модалка (Premium)**
   - Триггер: mouseleave вверх (desktop) / back-swipe (mobile), 1 раз в 24ч.
   - Контент: заголовок + одно поле (телефон/email) + submit → создаёт `lead` с source `exit_intent`.
   - Настраиваемый copy + возможность отключить.

3. **A/B-тест первого экрана (Premium)**
   - Простой сплит 50/50 двух вариантов `ProfileBlock` (имя, био, обложка).
   - Победитель определяется по CTA-rate за 7 дней (min 200 visits) → авто-применение с уведомлением.
   - Таблица `page_experiments` + RPC `assign_variant(page_id, visitor_id)`.

4. **AI Coach «Улучшить страницу»**
   - Кнопка в редакторе: анализирует последние 30 дней аналитики + текущий контент, выдаёт 3–5 действий (заменить обложку, сократить био, добавить отзыв, поменять порядок блоков).
   - Использует Lovable AI Gateway (Gemini fallback), результат — карточки с «применить одним кликом».

5. **Auto-optimizations (без AI)**
   - Детект: если первый блок — не CTA и CTA-rate < 2%, показать баннер «Переместить контакт наверх».
   - Детект: если обложка > 500KB, предложить сжатие.

---

## Порядок и приоритеты

```text
Week 1  → A1, A2, A3, A5          (полировка, самое видимое)
Week 2  → B1, B2                  (RPC + Insights UI)
Week 3  → C1 sticky CTA + C5 auto-optimizations
Week 4  → B3 digest, B4 export, C2 exit-intent
Week 5  → C3 A/B, C4 AI Coach     (крупные Premium-фичи)
```

## Технические принципы

- Без ломающих миграций: новые поля через JSONB (`pages.appearance`, `pages.cro_settings`).
- RLS: все новые RPC — SECURITY DEFINER + проверка `owner_id = auth.uid()`.
- Premium-гейт: через существующий `canUsePremium*`, без дубликатов.
- События — только через `trackCanonicalEvent`.
- Все edge-функции — с size-limit, auth-check, HTML-escape (стандарт закреплён предыдущим проходом).

## Вне scope

- Полноценный визуальный A/B-редактор (multi-variant, сегментация).
- Кастомный HTML/CSS/JS от пользователя.
- Marketplace тем и шаблонов.
- Внешние аналитические провайдеры (GA/Mixpanel) — только внутренняя.
