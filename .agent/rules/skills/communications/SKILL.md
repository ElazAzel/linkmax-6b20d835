---
name: communications
description: Telegram notifications, email sequences, webhook delivery, client messaging, and internal comms.
---

# Communications & Notifications

Use for Telegram bots, automated email sequences, transactional alerts, push notifications, and customer messaging in LinkMAX.

## When to Use
- Telegram Bot notifications (leads, bookings, purchases, daily summaries).
- Email sequence triggers and transactional email delivery (Resend / SMTP).
- Push notification handling for Capacitor mobile apps.
- Internal 3P (Progress, Plans, Problems) summaries and platform announcements.

## Core Workflows

### 1. Telegram Event Notifications
1. Event occurs (e.g. new lead, booking created, payment settled).
2. Invoke Supabase Edge Function `send-zone-notification` or `telegram-bot-webhook`.
3. Format message in MarkdownV2 / HTML with deep links back to the user's dashboard or mini-app.
4. Log delivery attempt and handle non-blocking retry on network or rate limit (429) errors.

### 2. Email Sequences & Drip Campaigns
1. Add recipient to sequence via `src/services/emailSequences.ts`.
2. Process queued emails via scheduled cron `supabase/functions/process-email-sequences`.
3. Track open and click telemetry via `src/services/product-analytics.ts`.

### 3. Push Notifications (Mobile Shell)
1. Initialize Capacitor Push via `src/lib/notifications/push-service.ts`.
2. Register FCM / APNS token with Supabase backend (`user_devices` table).
3. Handle foreground notifications with local banners and background notification taps with deep routing.

## Key Files & Services
- **Services**: `src/services/emailSequences.ts`, `src/services/emailTemplates.ts`, `src/lib/notifications/push-service.ts`
- **Edge Functions**: `supabase/functions/send-email`, `supabase/functions/send-zone-notification`, `supabase/functions/telegram-bot-webhook`, `supabase/functions/process-email-sequences`
- **Telegram Module**: `src/telegram/TelegramContext.tsx`, `src/telegram/TelegramRouter.tsx`

## Commands & Verification
```bash
npm run typecheck:strict
npm run test -- src/telegram/__tests__/
```

## Best Practices & Guardrails
- **Secret Safety**: Never hardcode Telegram Bot Tokens or SMTP credentials in client code.
- **Escape Copy**: Always escape dynamic user text before injecting into Telegram HTML/Markdown templates.
- **Rate Limits**: Use batching and throttle delays when broadcasting announcements.
