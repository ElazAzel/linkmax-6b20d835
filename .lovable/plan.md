

# План: Полная настройка локализации

## Текущее состояние

| Аспект | Статус |
|--------|--------|
| **Основные локали (ru, en, kk)** | ✅ ~5600 строк, полные переводы |
| **Lazy локали (de, uk, uz, be, es, fr, it, pt, zh, tr, ja, ko, ar)** | ⚠️ ~5200 строк, отсутствует namespace `zones` |
| **Пустые строки** | ⚠️ Много `""` в lazy локалях |
| **Ключи zones.nav.\*** | ❌ Используются в коде, но не определены ни в одной локали |
| **Система валидации** | ✅ `validateTranslations()` работает в dev режиме |

## Проблемы

1. **Отсутствующий namespace `zones`** в 13 lazy локалях — пользователи CRM на этих языках видят fallback
2. **Пустые строки** — показывают raw ключи или fallback вместо перевода
3. **`zones.nav.*` ключи** — отсутствуют везде, используются с fallback значениями в коде

## План реализации

### Task 1: Добавить zones.nav namespace во все локали

Добавить недостающие ключи навигации:
```json
"zones": {
  "nav": {
    "dashboard": "Dashboard",
    "deals": "Deals",
    "contacts": "Contacts",
    "tasks": "Tasks",
    "inbox": "Inbox",
    "invoices": "Invoices",
    "calendar": "Calendar",
    "automations": "Automations",
    "products": "Products",
    "events": "Events",
    "documents": "Documents",
    "settings": "Settings"
  },
  "search": {
    "placeholder": "Search...",
    "noResults": "No results",
    "contacts": "Contacts",
    "deals": "Deals",
    "tasks": "Tasks",
    "quickActions": "Quick actions",
    "newDeal": "Create deal",
    "newContact": "Add contact",
    "newTask": "Create task",
    "navigation": "Navigation"
  }
}
```

### Task 2: Синхронизировать zones namespace для lazy локалей

Скопировать полную структуру `zones` из en.json в:
- de.json, uk.json, uz.json, be.json, es.json, fr.json
- it.json, pt.json, zh.json, tr.json, ja.json, ko.json, ar.json

### Task 3: Заполнить пустые строки в lazy локалях

Для ключей с `""` — подставить английский fallback с префиксом `[LANG]` или оставить пустыми (i18n fallback сработает на en).

### Task 4: Добавить CI проверку i18n

Создать npm script `i18n:check` для проверки:
- Все ключи присутствуют во всех локалях
- Нет пустых строк в primary локалях
- Плейсхолдеры `{{var}}` совпадают

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/i18n/locales/ru.json` | Добавить `zones.nav` и `zones.search` |
| `src/i18n/locales/en.json` | Добавить `zones.nav` и `zones.search` |
| `src/i18n/locales/kk.json` | Добавить `zones.nav` и `zones.search` |
| `src/i18n/locales/de.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/uk.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/uz.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/be.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/es.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/fr.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/it.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/pt.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/zh.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/tr.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/ja.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/ko.json` | Добавить полный `zones` namespace |
| `src/i18n/locales/ar.json` | Добавить полный `zones` namespace |
| `package.json` | Добавить `i18n:check` script |
| `src/i18n/check.ts` | Создать CLI для проверки |

---

## Результат

- 100% покрытие ключей во всех 16 локалях
- Нет raw ключей или fallback в UI
- CI гарантирует что новые ключи добавляются во все локали
- Документация процесса добавления переводов

