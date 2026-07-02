---
trigger: planner, orchestrator
---

# Planner Workflow — автоматическая загрузка скиллов

## Принцип

При поступлении задачи Planner/Orchestrator загружает навыки, соответствующие контексту:

| Тип задачи | Загружаемые скиллы |
|---|---|
| Страница / лендинг / блоки | `react`, `content-creation`, `design-brand` |
| CRM / лиды / воронки / домены | `business-zone` |
| Telegram Mini App / уведомления | `communications` |
| Supabase / БД / RLS / миграции | `supabase`, `devops` |
| Платежи / подписки / инвойсы | `payments` |
| Аналитика / PostHog / A/B тесты | `analytics` |
| Календарь / бронирования | `calendar` |
| Тесты (unit / E2E / Playwright) | `testing` |
| Дизайн / тема / бренд | `design-brand` |
| Релиз-ноты / changelog | `changelog` |
| Файлы / организация репы | `file-management` |
| CI/CD / деплой / env | `devops` |

## Процесс

1. Определить тип задачи из запроса пользователя
2. Загрузить соответствующие скиллы через `skill` tool
3. Составить план с учётом загруженных инструкций
4. В плане указать, какие скиллы были использованы
