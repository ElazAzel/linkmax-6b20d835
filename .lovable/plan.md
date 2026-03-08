

# План Недели 3: Отчёты и Бизнес-Аналитика

## Текущее состояние

**ZoneAnalyticsScreen уже содержит:**
- 5 KPI-карточек (Open Deals Value, Win Rate, Tasks Completed, Paid Invoices, New Contacts)
- Воронка продаж (BarChart по стадиям)
- Timeline выручки (LineChart по оплаченным инвойсам)
- Метрики задач (completed/pending/overdue)
- Фильтр периода + Excel export

**Чего не хватает:**
1. **P&L отчет** — нет модели расходов, можно показать только доходы (paid invoices)
2. **Метрики команды** — задачи по assignee_user_id (данные есть в zone_tasks)
3. **PDF-экспорт** — использовать существующий паттерн из `pdf-export-invoice.ts`
4. **Конверсия сделок** — показать won/lost по периодам с трендом

---

## План реализации

### Task 1: Расширить useZoneAnalytics — метрики команды

Добавить в `useZoneAnalytics.ts`:
```typescript
// Team metrics by assignee
const teamMetrics = useMemo(() => {
  const byAssignee: Record<string, { name: string; total: number; completed: number; avgTime: number }> = {};
  // Group tasks by assignee_user_id, calculate completion rate
}, [tasks, members]);
```

### Task 2: Добавить секцию Team Performance в ZoneAnalyticsScreen

- Таблица: Исполнитель | Всего задач | Выполнено | % | Avg. время закрытия
- Горизонтальный BarChart по исполнителям
- Использовать данные из `zone_tasks.assignee_user_id` + `zone_members` для имен

### Task 3: Добавить P&L Summary Card

Поскольку расходов нет в системе, показываем:
- Gross Revenue (оплаченные инвойсы)
- Pending Revenue (ожидающие инвойсы)
- Опционально: комиссия платформы (7%/1%/0% по тиру)

### Task 4: Добавить Conversion Trend

- Won vs Lost deals по неделям/месяцам
- AreaChart с двумя линиями (won/lost)
- Показать тренд: ↑ улучшение / ↓ ухудшение

### Task 5: PDF-экспорт отчета

Создать `src/lib/export/pdf-export-analytics.ts`:
- Использовать паттерн из `pdf-export-invoice.ts`
- Включить: KPI summary, Funnel данные, Team metrics, Revenue timeline
- Transliteration для Cyrillic (jsPDF ограничение)

### Task 6: Интегрировать PDF кнопку в ZoneAnalyticsScreen

- Добавить кнопку "PDF" рядом с "Excel"
- Вызывать новую функцию экспорта

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/hooks/zones/useZoneAnalytics.ts` | Добавить teamMetrics, conversionTrend |
| `src/components/zones/ZoneAnalyticsScreen.tsx` | Добавить Team Performance section, P&L card, Conversion chart, PDF button |
| `src/lib/export/pdf-export-analytics.ts` | **Создать** — экспорт аналитики в PDF |
| `src/i18n/locales/*.json` | Новые ключи для метрик команды |
| `.lovable/plan.md` | Обновить статус Недели 3 |

---

## Технические детали

**Team Metrics Query:**
```typescript
// Группировка задач по assignee
tasks.reduce((acc, task) => {
  const assignee = task.assignee_user_id || 'unassigned';
  if (!acc[assignee]) acc[assignee] = { total: 0, completed: 0, times: [] };
  acc[assignee].total++;
  if (task.status === 'done') {
    acc[assignee].completed++;
    // Calculate time from created_at to updated_at
  }
  return acc;
}, {});
```

**PDF Structure:**
1. Header: Zone name, Period, Generated date
2. KPI Summary table
3. Funnel breakdown
4. Team performance table
5. Revenue timeline (text summary, not chart)

