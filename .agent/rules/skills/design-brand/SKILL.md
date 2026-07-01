---
name: design-brand
description: Фирменный стиль и дизайн страниц LinkMAX. Цвета, типографика, Canvas-графика.
---

# Design Brand Skill

Применение фирменного стиля к страницам и UI: цвета, шрифты, графика, брендинг.

## Когда использовать

- Настройка темы страницы (цветовая схема, шрифты)
- Создание Canvas-постера или обложки
- Применение фирменных цветов к новому компоненту
- Дизайн landing page через Living Canvas

## Воркфлоу

### 1. Фирменные цвета LinkMAX

| Название | HEX | Применение |
|---|---|---|
| Primary | `#6C5CE7` | Кнопки, ссылки, акценты |
| Secondary | `#00CEC9` | Второстепенные элементы |
| Accent | `#FD79A8` | Badge, уведомления |
| Dark | `#2D3436` | Текст, фон |
| Light | `#F8F9FA` | Фон страниц |
| Gradient | `linear-gradient(135deg, #6C5CE7, #00CEC9)` | Герои, заголовки |

**Ключевые файлы:**
- `tailwind.config.ts` — регистрация цветов
- `src/styles/` — глобальные стили
- `src/components/ui/` — shadcn/ui компоненты

### 2. Типографика

- **Заголовки:** `font-heading` (Inter / Playfair Display)
- **Текст:** `font-body` (Inter)
- **Моноширинный:** `font-mono` (JetBrains Mono)

### 3. Canvas-графика

Для создания визуалов (обложки, постеры):
```typescript
// src/services/canvas.service.ts
// Использует HTML2Canvas или SVG для рендеринга
```

**Формат вывода:** PNG/PDF, экспорт через `html2canvas` + `jsPDF`.

### 4. Living Canvas (Design System)

Набор 10 готовых тем для страниц (см. `docs/design-system-audit.md`):
```typescript
type Theme = 'minimal' | 'bold' | 'elegant' | 'playful' | 
             'dark' | 'nature' | 'tech' | 'luxury' | 
             'retro' | 'custom';
```

## Связанные модули

- `content-creation` — дизайн страниц под контент
- `business-zone` — стили для CRM-интерфейса
