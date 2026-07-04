---
name: file-management
description: Организация файлов и поиск дубликатов в проекте LinkMAX.
---

# File Management Skill

Поддержание порядка в файловой системе проекта: организация структуры, поиск дубликатов, архивирование.

## Когда использовать

- Структура проекта стала запутанной
- Есть дубликаты файлов (копии, скачанные инвойсы)
- Нужно заархивировать старые проекты
- Настроить консистентный нейминг файлов

## Воркфлоу

### 1. Анализ текущей структуры

```bash
# Типы файлов
Get-ChildItem -Recurse -File | Group-Object Extension | Sort-Object Count -Descending | Select-Object -First 20

# Крупнейшие файлы
Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20

# Папки по размеру
Get-ChildItem -Directory | ForEach-Object { [PSCustomObject]@{Name=$_.Name;Size=(Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum} } | Sort-Object Size -Descending
```

### 2. Организация файлов

**Консистентный нейминг:**
```
YYYY-MM-DD - Description.ext
2026-07-01 - Design System Audit.pdf
```

**Стандартная структура проекта:**
```
linkmax-6b20d835/
├── src/                  # Исходный код
├── docs/                 # Документация
├── supabase/             # Backend
├── e2e/                  # E2E тесты
├── scripts/              # Скрипты
├── public/               # Статика
└── tmp/                  # Временные файлы (gitignored)
```

### 3. Поиск дубликатов

```bash
# Точные дубли по хешу
Get-ChildItem -Recurse -File | Get-FileHash | Group-Object Hash | Where-Object Count -GT 1

# Одинаковые имена
Get-ChildItem -Recurse -File | Group-Object Name | Where-Object Count -GT 1
```

**Правило:** Перед удалением — показать пользователю и запросить подтверждение.

## Связанные модули

- `payments` — организация папки с инвойсами
- `devops` — артефакты сборки
