
# План Недели 2: Платежи и Биллинг

## Текущее состояние

**Что есть:**
- Edge Functions `create-payment-session` и `robokassa-webhook` существуют с полной логикой Robokassa
- `zone_subscriptions` таблица есть в БД для зон
- `AccountSettingsScreen.tsx` содержит TODO: `{/* TODO: Open billing history */}` и `{/* TODO: Open password change */}`
- `DealDetailSheet.tsx` уже есть с кнопками контактов (Call, Email, WhatsApp)

**Чего не хватает:**
1. Таблицы `orders` — на неё ссылаются Edge Functions, но её нет в БД
2. Таблицы `billing_history` для истории платежей пользователя
3. UI смены пароля в AccountSettings
4. UI истории биллинга в AccountSettings
5. Интеграции Kaspi QR в карточку сделки

---

## План реализации

### Task 1: Создать таблицы `orders` и `billing_history`
**DB Migration:**
```sql
-- Orders table (for payment processing)
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KZT',
  provider text NOT NULL DEFAULT 'robokassa',
  description text,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billing history (human-readable records)
CREATE TABLE public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'subscription', 'zone_upgrade', 'payment', 'refund'
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KZT',
  description text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders/billing
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users view own billing" ON public.billing_history FOR SELECT USING (user_id = auth.uid());
```

### Task 2: Обновить `robokassa-webhook` для записи в `billing_history`
После успешной оплаты добавить INSERT в `billing_history`:
```typescript
// После обновления статуса order на 'completed':
await supabase.from('billing_history').insert({
  user_id: shp_user,
  order_id: invId,
  type: shp_type || 'subscription',
  amount: parseFloat(outSum),
  currency: 'KZT',
  description: `Payment completed via Robokassa`,
  status: 'completed'
});
```

### Task 3: Реализовать UI смены пароля
**Файл:** `src/components/settings/ChangePasswordDialog.tsx`
- Dialog с полями: current password, new password, confirm password
- Валидация: минимум 8 символов, совпадение паролей
- Вызов `supabase.auth.updateUser({ password })`
- Локализация на 4 языка

### Task 4: Реализовать UI истории биллинга
**Файл:** `src/components/settings/BillingHistorySheet.tsx`
- Sheet с таблицей: дата, описание, сумма, статус
- Запрос к `billing_history` по `user_id`
- Empty state если нет записей
- Локализация

### Task 5: Интегрировать в `AccountSettingsScreen.tsx`
- Импортировать `ChangePasswordDialog` и `BillingHistorySheet`
- Заменить TODO на реальные onClick handlers
- Добавить state для открытия диалогов

### Task 6: Добавить Kaspi QR в `DealDetailSheet.tsx`
**Файл:** `src/components/zones/deals/KaspiQRGenerator.tsx`
- Компонент генерации QR-кода для оплаты через Kaspi
- Использует `qrcode.react` (уже установлен)
- Формат deeplink: `https://kaspi.kz/pay?merchantId=...&amount=...`
- Кнопка "Kaspi QR" в карточке сделки рядом с Contact actions

---

## Файлы для создания
- `src/components/settings/ChangePasswordDialog.tsx`
- `src/components/settings/BillingHistorySheet.tsx`
- `src/components/zones/deals/KaspiQRGenerator.tsx`

## Файлы для изменения
- `supabase/functions/robokassa-webhook/index.ts` — добавить billing_history insert
- `src/components/dashboard-v2/screens/AccountSettingsScreen.tsx` — подключить диалоги
- `src/components/zones/deals/DealDetailSheet.tsx` — добавить Kaspi QR кнопку
- `src/i18n/locales/*.json` — новые ключи для billing/password

## Миграция БД
- `orders` и `billing_history` таблицы с RLS
