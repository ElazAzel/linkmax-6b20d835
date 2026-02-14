# Event Block (Ивент) — документация

## 1) Схема данных
### Таблицы
- `events`
  - `id`, `block_id`, `page_id`, `owner_id`
  - `title_i18n_json`, `description_i18n_json`
  - `cover_url`, `start_at`, `end_at`, `timezone`
  - `registration_closes_at`
  - `location_type`, `location_value`
  - `is_paid`, `price_amount`, `currency`
  - `capacity`, `status`
  - `form_schema_json`, `settings_json`
  - `created_at`, `updated_at`
- `event_registrations`
  - `event_id`, `block_id`, `page_id`, `owner_id`, `user_id`
  - `attendee_name`, `attendee_email`, `attendee_phone`
  - `answers_json`, `status`, `payment_status`
  - `paid_amount`, `currency`, `provider`, `provider_payment_id`
  - `utm_json`, `created_at`, `updated_at`
- `event_tickets`
  - `registration_id`, `event_id`
  - `ticket_code`, `status`, `qr_payload`, `used_at`
  - `created_at`

## 2) Статусы
### Registration
- `pending` — ожидание подтверждения (модерация).
- `confirmed` — подтверждено.
- `rejected` — отклонено.
- `cancelled` — отменено.

### Payment
- `none`, `pending`, `paid`, `failed`, `refunded`.

### Ticket
- `valid`, `used`, `cancelled`, `refunded`.

## 3) i18n-правила (3 языка)
Каждое поле формы хранит:
- `label_i18n: { ru, en, kk }`
- `placeholder_i18n: { ru, en, kk }` (опционально)
- `helpText_i18n: { ru, en, kk }` (опционально)

Системное email-поле добавляется автоматически на клиенте и всегда required.

## 4) Pro-only gating
Поля `media` и `file` помечены как Pro-only в конструкторе.
Для Pro-only фич требуется серверная защита на API и storage (см. TODO).

## 5) Определение “completed event”
Приоритет:
1. `registration_closes_at` (если задан).
2. `end_at` (если задан).
3. `status = closed` (manual close).

## 6) Подсчёт участников
Участники = количество `confirmed` регистраций.
Для платных — учитывать только `payment_status = paid`.
`cancelled`/`refunded` исключаются.

## 7) Экспорт
Выбор продуктовой логики: **CSV доступен на Free**, XLSX — Pro-only.

## 8) Расширение типов полей
Добавить новое значение в `EventFieldType`,
обновить рендер и валидаторы, добавить настройку в конструктор.

## 9) TODO/риски
- Pro-only фичи: оплаты, upload, XLSX экспорт, QR-сканер, email-шаблоны, авто-напоминания, UTM-аналитика.
- CRM-экран для владельца и админ-аналитика платформы.
- Отправка email-подтверждений и генерация .ics.
