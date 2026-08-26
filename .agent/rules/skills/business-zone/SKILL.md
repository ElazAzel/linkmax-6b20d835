---
name: business-zone
description: Business Zone CRM, leads qualification, deals pipeline, tasks, invoices, and micro-business workflows in LinkMAX.
---

# Business Zone & CRM

Use for features, bugfixes, and automations within the Business Zone (`/dashboard/zone-*`), CRM pipelines, lead capture, deal staging, and micro-business operations.

## When to Use
- Managing CRM leads, deal stages (`new`, `contacted`, `proposal`, `won`, `lost`), and conversion funnels.
- Creating and managing client tasks, invoices, contacts, and business documents.
- Setting up Business Zone automations (`run-zone-automations`, trigger-based workflows).
- Integrating lead generation forms and webhook captures.

## Core Workflows

### 1. Lead Ingestion & Qualification
1. Validate incoming lead payload with Zod in frontend/service layers (`name`, `email`/`phone`, `source_page_id`, `custom_fields`).
2. Route lead submission through `src/services/crm.service.ts` or Edge Function `create-lead` / `submit-lead`.
3. Check and apply organization/zone isolation via `organization_id` / `account_id` and Supabase RLS.
4. Trigger real-time notifications via `send-zone-notification` and Telegram webhook if enabled.

### 2. Deals & Pipeline Progression
1. Query deals scoped to active organization/user with optimistic UI updates.
2. Update deal status using `crm.service.ts` (`updateDealStage`).
3. If deal moves to `won`, prompt for invoice generation or balance settlement.

### 3. Invoices & Billing Documents
1. Generate unique invoice numbers (`INV-YYYY-XXXXX`).
2. Calculate items subtotal, tax rate, and final total with 2-decimal normalization.
3. Link with payment gateways (Robokassa, Kaspi QR, Paddle) and record transaction status.

## Key Files & Services
- **Services**: `src/services/crm.service.ts`, `src/services/zones/`
- **Screens**: `src/components/zones/ZoneDealsScreen.tsx`, `src/components/zones/ZoneContactsScreen.tsx`, `src/components/zones/ZoneInvoicesScreen.tsx`, `src/components/zones/ZoneTasksScreen.tsx`, `src/components/zones/ZoneAutomationsScreen.tsx`
- **Edge Functions**: `supabase/functions/create-lead`, `supabase/functions/submit-lead`, `supabase/functions/run-zone-automations`
- **Hooks**: `src/hooks/crm/useLeads.ts`, `src/hooks/crm/useLeadAging.ts`

## Commands & Verification
```bash
npm run typecheck:strict
npm run test -- src/services/__tests__/crm.service.test.ts src/hooks/crm/
```

## Best Practices & Guardrails
- **RLS Boundary**: Never bypass organization-scoped RLS policies. Always verify user role (`owner`, `admin`, `member`).
- **Data Integrity**: Sanitize user-submitted contact data and trim whitespace.
- **Optimistic State**: Provide immediate visual feedback on drag-and-drop kanban boards with graceful rollback on error.
