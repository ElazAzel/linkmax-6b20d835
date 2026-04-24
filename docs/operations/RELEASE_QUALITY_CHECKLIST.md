# Release Quality Checklist

> **Статус:** Active  
> **Связано с кайдзен:** KZN-019  
> **Когда использовать:** перед релизом, hotfix, изменениями core flows или публичных страниц

---

## 1. Цель

Чек-лист удерживает релизы LinkMAX быстрыми, но безопасными. Он должен ловить регрессии в основных потоках без превращения release process в тяжелую бюрократию.

---

## 2. Core flows

- [ ] Signup/auth flow открывается и не ломает auth analytics.
- [ ] AI onboarding запускается, имеет fallback и не блокирует core publish path.
- [ ] Editor открывает страницу, добавляет блок и сохраняет изменения.
- [ ] Public renderer показывает опубликованную страницу.
- [ ] Lead form/newsletter/booking public insert работает без private data leakage.
- [ ] CRM показывает новые leads/bookings и позволяет выполнить fast action.
- [ ] Booking/payment statuses не расходятся с UI.
- [ ] Public pages сохраняют metadata, JSON-LD и SSR/bot rendering.

---

## 3. Automated checks

- [ ] `npm run typecheck` или `npm run typecheck:strict` пройден для затронутой области.
- [ ] `npm run lint` пройден или known issue явно зафиксирован.
- [ ] Relevant unit/integration tests пройдены.
- [ ] Для block/editor изменений применен `BLOCK_FEATURE_CHECKLIST.md`.
- [ ] Для data/public/security изменений применен `RLS_PUBLIC_FLOW_CHECKLIST.md`.
- [ ] Для повторного дефекта применен `RELIABILITY_REPEAT_BUG_PLAYBOOK.md`.

---

## 4. Monitoring after release

- [ ] Проверить Sentry по onboarding, editor, CRM и public pages.
- [ ] Проверить Web Vitals для public page и editor preview, если менялся frontend path.
- [ ] Проверить activation events: `activation:page_published`, `activation:funnel_step_publish_completed`, `activation:first_lead_captured`.
- [ ] Проверить CRM events: `activation:lead_seen`, `activation:lead_replied`, `activation:lead_status_changed`.
- [ ] Проверить payment/booking terminal states, если менялся fintech flow.

---

## 5. Rollback note

Для рискованных изменений перед релизом заполнить:

```text
Change:
Risk:
Rollback owner:
Rollback action:
Data impact:
Customer-facing impact:
```
