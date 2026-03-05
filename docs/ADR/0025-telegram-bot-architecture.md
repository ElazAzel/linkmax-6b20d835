# 0025. Telegram Bot Architecture & Synchronization

Date: 2026-03-05

## Status

Accepted

## Context

The lnkmx platform utilizes a Telegram bot for creator notifications (leads, bookings, registrations) and administrative management. Initially, the bot settings were partially hardcoded or stored in unstructured metadata. As the platform scales, we need a unified approach for bot settings, command handling, and synchronization between the platform and Telegram.

## Decision

We will implement a DB-backed settings system for the Telegram bot to allow real-time configuration without redeploying edge functions.

### Key Components

1. **Database Layer**:
    - Created `telegram_bot_settings` table to store `bot_token`, `webhook_url`, `admin_chat_ids`, and feature flags.
2. **Edge Function Handler (`telegram-bot-webhook`)**:
    - A centralized entry point for all Telegram updates.
    - Implements routing for user commands (`/start`, `/stats`, `/publish`).
3. **Command Logic**:
    - `/stats`: Provides real-time platform metrics to authorized admins.
    - `/publish`: Triggers automated cross-platform publishing tasks.
    - `/start`: Links Telegram `chat_id` with `user_id` in `user_profiles` for targeted notifications.
4. **Notification Pipeline**:
    - Other edge functions (`send-lead-notification`, etc.) read settings from the DB to dispatch messages via the bot.

## Consequences

- **Flexibility**: Admins can update tokens or toggle bot features via the DB.
- **Security**: Access to admin commands is restricted via `admin_chat_ids` verification.
- **Scalability**: New commands can be added to the centralized webhook handler.
- **Reliability**: pg_cron jobs can monitor bot health and re-register webhooks if needed.
