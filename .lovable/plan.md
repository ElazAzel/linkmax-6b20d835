

# План: Улучшение Командной Работы — @Mentions и Уведомления

## Текущее состояние

**Реализовано:**
- Deal Comments с zone_deal_comments таблицей
- Базовый UI комментариев в DealDetailSheet
- Telegram бот с командами /zone, /deals, /tasks

**Не хватает:**
- @mentions в комментариях для уведомления коллег
- Уведомления о новых комментариях участникам сделки
- Быстрый выбор пользователя при вводе "@"

---

## План реализации

### Task 1: Компонент MentionInput

**Создать:** `src/components/zones/shared/MentionInput.tsx`

Textarea с автоподсказкой при вводе "@":
- Парсинг "@" + показ popup со списком zone_members
- Выбор пользователя → вставка "@username" или "@Имя"
- Возврат: текст + массив mentioned_user_ids

### Task 2: Обновить useZoneDealComments

Добавить в создание комментария:
- Поле `mentioned_user_ids: string[]` в zone_deal_comments (добавить колонку)
- При создании комментария отправить уведомление упомянутым

### Task 3: Миграция — добавить mentioned_user_ids

```sql
ALTER TABLE zone_deal_comments 
ADD COLUMN mentioned_user_ids uuid[] DEFAULT '{}';
```

### Task 4: Триггер уведомления при mention

**Обновить:** `send-zone-notification` Edge Function

Добавить тип `deal_comment_mention`:
- Получает deal_id, mentioned_user_ids
- Отправляет Telegram уведомление упомянутым

### Task 5: Интегрировать MentionInput в DealDetailSheet

Заменить обычный Input на MentionInput в секции комментариев.

### Task 6: Google Sheets Export

**Создать:** `src/lib/export/sheets-export.ts`

Функция для экспорта:
- Contacts → CSV/Excel (уже есть exceljs)
- Deals → Excel с воронкой
- Простая кнопка "Export to Excel" везде

---

## Файлы

| Файл | Действие |
|------|----------|
| `src/components/zones/shared/MentionInput.tsx` | **Создать** |
| `src/hooks/zones/useZoneDeals.ts` | Обновить addComment |
| `src/components/zones/deals/DealDetailSheet.tsx` | Использовать MentionInput |
| `supabase/migrations/...` | Добавить mentioned_user_ids |
| `supabase/functions/send-zone-notification/index.ts` | Добавить mention уведомления |
| `.lovable/plan.md` | Обновить статус |

---

## Технические детали

**MentionInput логика:**
```tsx
// При вводе "@" показываем список members
// При выборе вставляем "@[userId:name]"
// При submit парсим и возвращаем mentioned_user_ids
const extractMentions = (text: string) => {
  const regex = /@\[([a-f0-9-]+):([^\]]+)\]/g;
  const ids = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    ids.push(match[1]);
  }
  return ids;
};
```

**Telegram notification:**
```typescript
case 'deal_comment_mention': {
  // "💬 Вас упомянули в комментарии к сделке X"
}
```

---

## Ожидаемый результат

- Возможность @упомянуть коллегу в комментарии к сделке
- Мгновенное Telegram уведомление упомянутому
- Улучшенный экспорт данных в Excel

