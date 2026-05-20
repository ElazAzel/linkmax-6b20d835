## План повышения актуальности LinkMAX (SEO + Продукт + Маркетинг)

Цель: за 6 недель закрыть критический разрыв с Taplink/Linktree в RU/KZ/CIS, поднять органический трафик с 0 до 3–5 K/мес, привести позиционирование и техдокументацию в соответствие с текущей моделью (Starter/Pro, 7%/1% fee, Editor-first, Messenger-centric).

---

### Этап 1. SEO-фундамент (Неделя 1)

**1.1 Активация публичных страниц `/{username}` в индексе**
- Проверить, что `cloudflare-worker/prerender-worker.js` отдаёт SSR-HTML ботам для всех опубликованных страниц.
- Добавить в `supabase/functions/generate-sitemap` динамический блок для всех `pages` где `is_published=true`, с `<lastmod>` из `updated_at` и `<changefreq>weekly</changefreq>`.
- Прописать `<link rel="canonical">` на `https://lnkmx.my/{slug}` в SSR-выдаче (а не на preview-домен).
- Проверить IndexNow ping (Yandex/Bing) при `publish_page` — должен срабатывать в edge function.

**1.2 Активация существующих `/alternatives/{competitor}`**
- Найти страницы alternatives в `src/pages/` (упомянуты в `docs/seo/INDEXING.md`).
- Добавить их в `public/sitemap.xml` и в динамический sitemap.
- Прописать JSON-LD `SoftwareApplication` + сравнительную таблицу (LinkMAX vs Taplink/Linktree/Mssg.me).
- Hreflang ru/en/kk/uz.

**1.3 Аудит документов**
- Обновить `docs/AUDIT_REPORT_2026_03_10.md`, `ZENITH_FINAL_AUDIT_*` и `docs/product/2_BUSINESS_FINANCIAL_MODEL.md` под актуальную модель: Starter/Pro (без Business в публичном прайсе), комиссии 7%/1%, Business Zones как B2B-надстройка.
- Синхронизировать `PITCH_DECK.md` и `docs/product/4_INVESTMENT_MEMO.md`.

---

### Этап 2. SEO-контент под низкоконкурентные запросы (Недели 2–3)

**2.1 Лендинги с KD 9–19**
Создать в `src/pages/landings/`:
- `/taplink-alternative` (KD ~25, intent: switch)
- `/sayt-vizitka-dlya-uslug` (KD 19, 2400/мес)
- `/multilink` (KD 9, 110/мес — лёгкая победа)
- `/link-in-bio-ru` (KD ~15)
- `/vizitka-onlayn` (KD ~20)

Структура каждого лендинга:
- H1 с точным keyword
- Hero + 3 USP + сравнительная таблица + 6–10 FAQ (FAQPage schema)
- CTA «Создать бесплатно» → `/auth?ref=lp-{slug}`
- Внутренние ссылки на `/gallery`, `/pricing`, `/experts`

**2.2 SEO-блог `/blog/`**
10 статей под информационные запросы (KD<30):
- «Как сделать сайт-визитку для мастера маникюра»
- «Как принимать оплату через WhatsApp в Казахстане»
- «Telegram-визитка для коуча: пошагово»
- «Multilink vs обычный сайт: что выбрать в 2026»
- «Как оформить ИП самозанятому и принимать платежи»
- + 5 нишевых под услуги (репетитор, мастер, фотограф, психолог, фитнес)

Каждая статья: 1500–2500 слов, Article schema, breadcrumbs, related posts.

**2.3 SEO-страницы по нишам (программная генерация)**
- `/dlya/{niche}` — 20 страниц (мастер, коуч, репетитор, ...) с шаблоном «Сайт-визитка для {niche}».
- Использовать данные из `expert-engine.ts` (теги ниш).

---

### Этап 3. AEO / GEO (Неделя 3, параллельно)

- Расширить `docs/seo/aeo-geo-implementation.md`: Answer Block (короткий ответ в начале каждой статьи), Speakable schema, LocalBusiness для публичных страниц с городом.
- В `src/lib/seo/` добавить генератор HowTo schema для статей-инструкций.
- AI-traffic detection (ChatGPT/Perplexity/Claude/Gemini) — отслеживать в `analytics` отдельным `source=ai`.

---

### Этап 4. Продуктовые «допинги» (Недели 3–4)

Из `.gemini/antigravity/.../implementation_plan.md` — приоритет A+C:
- `@capacitor/haptics` + `@capacitor/keyboard` для нативного ощущения в мобильном app.
- `nuqs` для фильтров CRM/Leads (shareable URL).
- React Query persist (offline-first для дашборда).
- PostHog session replay (нужны secrets — спросить пользователя).

---

### Этап 5. Конверсия публичных страниц (Неделя 4)

Из памяти `public-page-aeo-conversion-stack`:
- Проверить CTA-блок `tel:` / `wa.me` / `t.me` на каждой публичной странице.
- LocalBusiness + Speakable schema.
- Добавить trust-signals: `get_public_trust_metrics` RPC (уже есть) → виджет на `/customers`.
- A/B-тест двух CTA-вариантов через `feature_flags`.

---

### Этап 6. Дистрибуция и линкбилдинг (Недели 5–6)

- Подача в каталоги: Product Hunt (RU launch), Indie Hackers, AppSumo, Producter, Startpack, Otzovik.
- Гостевые посты на vc.ru, habr.ru/companies, spark.ru — 5 публикаций.
- Партнёрки: Robokassa, Cloudpayments, Pact — взаимные ссылки.
- Цель: +50 referring domains за 6 недель (с 8 до 58, AS 2 → 15+).

---

### Этап 7. Аналитика и закрепление (Неделя 6)

- Расширить `Admin → Growth`: добавить виджет «SEO traffic» (organic sessions/day, top landing pages, top keywords из GSC API).
- GSC API integration → edge function `gsc-sync` (раз в сутки кеш позиций топ-100 keywords).
- Дашборд «SEO Health»: indexed pages count, avg position, CTR, impressions.
- Алерты в Telegram при падении трафика >20% WoW.

---

### Открытый вопрос (требует решения пользователя)

Домен `lnkmx.my` геопривязан к Малайзии — это режет ранжирование в RU/KZ. Варианты:
- **A**: оставить `.my`, продвигать через hreflang+GSC геотаргетинг (бесплатно, +6 мес до результата).
- **B**: купить `linkmax.com` / `linkmax.io` (~$2–5K), 301-redirect, перенести бренд (быстрее, дороже).
- **C**: купить `.ru` / `.kz` / `.uz` для региональных версий (~$30/год, +языковые сабдомены).

---

### Технические детали

**Файлы для создания:**
- `src/pages/landings/TaplinkAlternative.tsx`, `SaytVizitka.tsx`, `Multilink.tsx`, `LinkInBio.tsx`, `VizitkaOnlayn.tsx`
- `src/pages/blog/` (10 MDX/TSX статей) + `src/components/blog/BlogLayout.tsx`
- `src/pages/dlya/[niche].tsx` (программная генерация)
- `src/components/seo/AnswerBlock.tsx`, `HowToSchema.tsx`
- `supabase/functions/gsc-sync/index.ts`
- `src/components/admin/growth/SEOHealthWidget.tsx`

**Файлы для обновления:**
- `supabase/functions/generate-sitemap/index.ts` — динамика для `pages`, alternatives, landings, blog
- `public/robots.txt` — Allow для `/blog`, `/dlya`, `/alternatives`
- `cloudflare-worker/prerender-worker.js` — добавить роуты `/blog/*`, `/dlya/*`, `/alternatives/*`, `/{landing-slugs}`
- `src/App.tsx` — роуты для лендингов/блога
- `src/i18n/locales/{ru,en,kk,uz}/seo.json` — переводы новых страниц
- `docs/product/4_INVESTMENT_MEMO.md`, `PITCH_DECK.md`, `docs/AUDIT_REPORT_*` — синхронизация модели

**Миграции:**
- `blog_posts` table (slug, locale, title, content, published_at, author_id, tags) + RLS
- `landing_metrics` table для A/B-тестов
- Опционально: `seo_keywords_tracking` (если решим хранить GSC данные локально)

**Скрипты:**
- `scripts/generate-niche-pages.mjs` — генератор 20 страниц `/dlya/{niche}` из списка
- `scripts/check-seo-coverage.mjs` — проверка что все роуты в sitemap

---

### Очерёдность исполнения

```text
W1: SEO-фундамент (sitemap + canonical + alternatives + docs sync)
W2: 5 лендингов + Multilink/Vizitka контент
W3: AEO/GEO + блог (5 первых статей)
W4: 5 нишевых статей + 20 /dlya + продуктовые допинги (haptics, nuqs)
W5: Дистрибуция (Product Hunt, vc.ru, гостевые)
W6: GSC sync + Admin SEO Health + алерты
```

---

### Метрики успеха (через 6 недель)

| Метрика | Сейчас | Цель |
|---|---|---|
| Organic traffic (Semrush ru) | 0 | 3–5K/мес |
| Indexed pages | ~10 | 200+ |
| Referring domains | 8 | 50+ |
| Authority Score | 2 | 15+ |
| Top-10 keywords | 0 | 25+ |
| Conversion с органики → signup | — | 3–5% |

После одобрения начну с Этапа 1 (SEO-фундамент + sync документации) и буду отчитываться после каждой недели.
