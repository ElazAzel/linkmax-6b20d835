---
name: payments
description: Платежи, подписки и финансы LinkMAX. Robokassa, Stripe, инвойсы, CSV для бухгалтерии.
---

# Payments Skill

Управление платежами: обработка подписок, организация инвойсов, экспорт для бухгалтерии.

## Когда использовать

- Настройка платежей через Robokassa / Stripe
- Организация папки с инвойсами
- Создание CSV-отчёта для бухгалтера
- Работа с подписками (Pro/Enterprise)
- Возвраты и отмена подписок

## Воркфлоу

### 1. Обработка платежа

**Robokassa (основной провайдер):**
1. Пользователь нажимает "Оформить подписку"
2. Frontend вызывает Edge Function `create-payment`
3. Функция возвращает URL для редиректа на Robokassa
4. Robokassa шлёт callback на `payment-webhook`
5. Webhook обновляет `subscriptions` + `invoices` в БД

**Stripe (международный):**
Аналогичный поток, но через Stripe Checkout Session.
Edge Function: `create-stripe-session`, `stripe-webhook`.

**Ключевые файлы:**
- `supabase/functions/create-payment/`
- `supabase/functions/payment-webhook/`
- `src/platform/robokassa/` — клиент Robokassa
- `src/platform/stripe/` — клиент Stripe
- `src/repositories/subscription.repository.ts`

### 2. Организация инвойсов

По запросу пользователя:

1. **Сканировать папку** с инвойсами (pdf, jpg, png)
2. **Извлечь данные:** дата, поставщик, сумма, описание, номер
3. **Переименовать** в формат: `YYYY-MM-DD Vendor - Invoice - Description.ext`
4. **Отсортировать** по папкам:
   - `Software/` — Adobe, Canva, Supabase
   - `Infrastructure/` — Vercel, Cloudflare
   - `Services/` — бухгалтерия, юристы
5. **Создать CSV:**
   ```csv
   Date,Vendor,Amount,Category,File
   2024-03-15,Adobe,52.99,Software,2024-03-15 Adobe - Invoice - Creative Cloud.pdf
   ```

### 3. Экспорт для бухгалтерии

```bash
npm run i18n:export   # экспорт данных (если применимо)
```

Создать в корне проекта папку `Invoices/` со структурой:
```
Invoices/
├── 2025/
│   ├── Software/
│   ├── Infrastructure/
│   └── Services/
├── invoice-summary.csv
└── originals/          # оригиналы файлов
```

### 4. Управление подписками

**Проверка статуса:** Edge Function `check-subscriptions` (cron, ежедневно)
- Просроченные → дизейбл фич + уведомление
- За 3 дня до окончания → напоминание

**Апгрейд/даунгрейд:** Edge Function `update-subscription`
- Пропорциональный расчёт (prorated)

## Связанные модули

- `business-zone` — оплата открывает CRM-функции
- `communications` — уведомления об оплатах
- `analytics` — PostHog-события конверсии платежей
