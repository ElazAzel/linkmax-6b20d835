

# План: Стабилизация платформы (без оплаты)

## Обзор
Три направления: починить аналитику, убрать неиспользуемые фичи из навигации, упростить онбординг. Оплату не трогаем.

---

## 1. Починить analytics constraint

**Проблема:** Фронтенд отправляет `session_end` события, но constraint в БД их не пропускает — все данные о длительности сессий теряются.

**Решение:** Миграция — полностью убрать `analytics_event_type_check` constraint. Enum-ограничение на стороне БД не масштабируется при добавлении новых типов событий. Валидация останется на уровне кода.

```sql
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;
```

---

## 2. Скрыть неиспользуемые фичи из навигации

**Проблема:** Сайдбар и мобильное меню показывают 12+ пунктов (Сделки, Контакты зоны, Задачи, Автоматизации, Инвойсы, Продукты, Ресурсы, События, Маркетплейс, Команда) — при 0 активных данных в этих модулях.

**Решение:** Оставить только реально используемые пункты.

### Desktop Sidebar (`DashboardSidebar.tsx`)
Секция "Бизнес-инструменты" — оставить только:
- Лиды (реально используются — 393 лида)
- События (оставить, но можно скрыть позже)

Убрать из отображения: zone-deals, zone-contacts, zone-tasks, zone-calendar, zone-automations, zone-invoices, zone-products, zone-resources, marketplace.

Секция "Аккаунт" — убрать: finance, developers, team. Оставить: home, settings.

### Mobile Bottom Nav (`DashboardBottomNav.tsx`)
Меню "Ещё" — оставить: home, pages, leads, settings. Убрать все zone-* пункты, team, finance, events.

### Итого: ~20 пунктов → ~7 пунктов

---

## 3. Упростить лендинг

**Проблема:** Лендинг обещает функции, которыми никто не пользуется (Zones, CRM, Invoices). 

**Решение:** 
- В Pricing секции убрать упоминания Business-зон из фичлиста
- Оставить фокус на: Страница → Блоки → Формы/Бронирование → Аналитика → Telegram-уведомления

**Файлы:** `SimplePricingSection.tsx`, `PricingAurora.tsx`

---

## Затронутые файлы
1. **Миграция SQL** — удалить analytics constraint
2. `src/components/dashboard-v2/layout/DashboardSidebar.tsx` — сократить секции
3. `src/components/dashboard-v2/layout/DashboardBottomNav.tsx` — сократить MORE_ITEMS
4. `src/components/landing/SimplePricingSection.tsx` — убрать упоминания Business-зон
5. `src/components/landing/v2/PricingAurora.tsx` — аналогично

