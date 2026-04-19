# SEO / GEO / AEO Audit — 2026-04-19

## Цель

Сделать главную страницу и публичные страницы пользователей максимально понятными для поисковых систем, AI-краулеров и ответных движков. Для профилей ключевая цель: страница `https://lnkmx.my/{slug}` должна читаться как канонический источник актуальной информации о человеке или организации.

## Внешние ориентиры

- Google Search Central: sitemap должен содержать абсолютные канонические URL, которые сайт хочет видеть в поиске.
- Google Search Central: `noindex` должен быть доступен краулеру в HTML или HTTP-заголовке, иначе правило может быть не увидено.
- Google Search Central: `rel=canonical`, sitemap и внутренние ссылки должны давать согласованный канонический сигнал.
- Google Search Central: `ProfilePage` подходит для страниц, где основной фокус — один человек или организация; `mainEntity` должен быть `Person` или `Organization`.
- IndexNow: подходит для быстрых уведомлений об измененных URL, но не заменяет sitemap и не гарантирует индексацию.

## Что уже сильное

- Есть Cloudflare SSR для публичных маршрутов и отдельный SSR HTML для ботов.
- Есть сегментированные sitemap: static, profiles, experts, events.
- Есть `llms.txt`, AI-friendly robots policy и AEO/GEO блоки.
- Для профилей уже генерируются `ProfilePage`, `Person/Organization`, `BreadcrumbList`, FAQ и services item lists.
- Для публичных страниц есть quality gate, child service URLs и IndexNow-логика.

## Критичные проблемы, найденные в аудите

1. Порог индексации расходился между слоями: часть UI/SQL считала страницу готовой только с 40 баллов, а Edge/snapshot уже использовали 25. Это занижало покрытие молодых, но валидных профилей.
2. `AISearchOptimizer` на публичных профилях мог перезаписать `noindex` на `index`, обходя quality gate и ручное скрытие страницы.
3. Sitemap профилей не учитывал явный `is_indexable=false`, поэтому вручную скрытые страницы могли попасть в sitemap.
4. Public page loader не прокидывал часть SEO/entity полей в `PageData`, из-за чего клиентский SEO-head терял `updatedAt`, `isIndexable`, контакты и entity-сигналы.
5. Cloudflare Worker для кастомных доменов вызывал не тот endpoint резолва домена, поэтому SSR на кастомных доменах мог не срабатывать.
6. Service/event child pages могли получить `index, follow`, даже если родительский профиль уже не индексируем.

## Внесенные исправления

- Единый indexability threshold: 25 баллов в клиентском quality gate, diagnostics UI, SQL diagnostics и Edge sitemap.
- Ручной `is_indexable=false` теперь сохраняется через `savePage`, прокидывается в public loaders и жестко переводит клиентский SEO-head в `noindex, follow`.
- `AISearchOptimizer` получил `manageRobots`; на профилях он больше не управляет robots-тегами и не перебивает `EnhancedSEOHead`.
- Profile SSR усилил entity-сигналы: `alternateName`, `identifier`, `mainEntityOfPage`, `ai-summary`, citation meta и видимый `source-of-truth` section.
- Sitemap профилей, gallery SSR и events sitemap теперь исключают явно скрытые или недостаточно качественные родительские профили.
- Service/event SSR теперь наследует noindex от родительского профиля.
- Cloudflare Worker теперь резолвит кастомный домен через `resolve-domain` POST endpoint.
- Миграция нормализует `low_quality_score` вокруг порога 25 и обновляет `get_page_search_diagnostics`.

## Оставшиеся рекомендации после деплоя

1. Задеплоить Supabase migrations, `generate-sitemap` Edge Function и Cloudflare Worker вместе, чтобы сигналы не разъехались.
2. Проверить 5-10 реальных профилей в Rich Results Test и URL Inspection.
3. Отправить `https://lnkmx.my/sitemap.xml` в Google Search Console и следить за Coverage/Indexing.
4. Для топ-профилей добавить реальные фото и уникальные описания: structured data помогает, но не заменяет полезный контент.
5. Для кастомных доменов отдельно проверить canonical strategy: если профиль должен индексироваться на кастомном домене, нужны доменные sitemap/robots; если LinkMAX остается canonical, текущий подход ок.
