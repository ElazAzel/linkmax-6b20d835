

# Оптимизация профиля, SEO/AEO/GEO, и галереи

## Три направления работы

### 1. Профиль — больше кастомизации

**Текущее состояние:** ProfileBlockEditor имеет аватар, имя, био, обложку, рамки, бейджи, proof-of-human. Но нет страны/города (они только в PageSettingsTab), нет «Name Animation» (упомянута в memory, но не в редакторе), и нет EditorSection.

**Что добавить/улучшить:**
- Обернуть в `EditorSection` для группировки: «Основное», «Обложка», «Аватар и рамки», «Бейдж верификации», «Доверие»
- Добавить поле **Страна** (select из топ-15 стран СНГ + другие) и **Город** в секцию «Основное» — они будут сохраняться через `updateEntityFields` (уже подключено в dashboard)
- Добавить выбор **Анимации имени** (nameAnimation) — Rainbow, Glitch, Typewriter, Glow, Bounce (уже описано в profile-frame-system, нужно подключить UI)
- Стандартизировать все `SelectTrigger` → `h-12 rounded-xl`
- Заменить нативные `<input type="checkbox">` на компонент `Switch`
- Перевести все hardcoded labels на i18n

**Файлы:** `ProfileBlockEditor.tsx`

### 2. SEO/AEO/GEO — наглядность и удобство

**Текущее состояние:** В `PageSettingsTab` есть Meta Title, Meta Description, Allow Indexing toggle, Entity Fields (город, профессия, тип, контакты). Но:
- Нет визуального индикатора статуса индексации
- Нет превью как страница будет выглядеть в Google
- SEO и Entity Fields разнесены по разным секциям — нужно объединить
- Нет подсказок по оптимизации (quality score уже считается в БД!)

**Что добавить:**
- **Google Preview** — мини-карточка показывающая как страница выглядит в поисковике (title, URL, description)
- **SEO Score Badge** — показать quality_score из БД (уже считается) с цветовым индикатором (красный <40, жёлтый <70, зелёный ≥70)
- **AI Bot Readiness** — индикатор показывающий что страница имеет JSON-LD и Answer Block (уже генерируются автоматически)
- **Подсказки** — если нет города, профессии, или био — показать warning с текстом что нужно заполнить
- Объединить SEO + Entity Fields в одну секцию «Поисковая видимость»
- Добавить поле **Страна** в entity fields (DB column `country_code` уже существует, UI нет)

**Файлы:** `PageSettingsTab.tsx`, `useCloudPageState.ts` (добавить `country_code` в `updateEntityFields`)

### 3. Галерея — локация + онлайн-статус

**Текущее состояние:** Фильтр по нишам, сортировка по лайкам/просмотрам/новые. Нет фильтра по городу/стране. Нет индикатора онлайн.

**Что сделать:**

#### A. Фильтр по локации
- Добавить фильтр-пилл «📍 Город» после ниш
- Загружать список городов из уникальных значений `pages.city` (через новый запрос)
- Обновить `getGalleryPages` чтобы принимать `city` фильтр и добавить `city` в select

#### B. Онлайн-статус (last_seen)

**Нужна миграция:**
- Добавить `last_seen_at timestamptz` в `user_profiles`

**Обновление last_seen:**
- При каждом входе в дашборд обновлять `last_seen_at = now()` (в `useDashboard` или `useAuth`)

**Отображение в галерее:**
- Добавить `last_seen_at` в `GalleryPage` интерфейс
- В `GalleryPageCard` показать зелёный кружок «Online» если `last_seen_at` < 5 минут назад
- Иначе показать «Был(а) X минут/часов/дней назад»
- Обновить запрос `getGalleryPages` для join с `user_profiles.last_seen_at`

#### C. Город в карточке
- Показать город рядом с названием если есть (📍 Алматы)

**Файлы:**
- Миграция: `last_seen_at` в `user_profiles`
- `src/services/gallery.ts` — city, last_seen_at в запросах
- `src/components/gallery/GalleryPageCard.tsx` — город + онлайн
- `src/components/screens/Gallery.tsx` — фильтр по городу
- `src/hooks/social/useGallery.ts` — city filter
- `src/hooks/dashboard/useDashboard.ts` или `useAuth` — обновление last_seen

## Порядок реализации
1. Миграция БД (`last_seen_at`)
2. ProfileBlockEditor — EditorSection + страна/город + анимация имени
3. PageSettingsTab — Google Preview + SEO Score + country_code
4. Gallery — city filter + online status + city display
5. Обновление last_seen при входе в дашборд

## Затронутые файлы (~10)
- `src/components/block-editors/ProfileBlockEditor.tsx`
- `src/components/dashboard-v2/screens/settings/PageSettingsTab.tsx`
- `src/hooks/page/useCloudPageState.ts`
- `src/services/pages.ts`
- `src/services/gallery.ts`
- `src/components/screens/Gallery.tsx`
- `src/components/gallery/GalleryPageCard.tsx`
- `src/hooks/social/useGallery.ts`
- `src/hooks/dashboard/useDashboard.ts`

