# UI Microcopy Glossary

This glossary consolidates reusable microcopy patterns for key product flows.

## Common patterns (`common.*`)

### Errors
- `common.errors.invalidEmail` — validation error for malformed email.
- `common.errors.passwordMismatch` — validation error when password confirmation does not match.
- `common.errors.resetFailed` — system error for password reset request.
- `common.errors.updateFailed` — generic update failure.

### Empty states
- `common.empty.noData` — no content/state yet.
- `common.empty.noResults` — no results for a query.
- `common.empty.noMatches` — no exact matches found.

### CTA
- `common.cta.continue` — neutral forward action.
- `common.cta.tryAgain` — retry after failure.
- `common.cta.upgrade` — generic upsell action.
- `common.cta.upgradeToTier` — tiered upsell CTA with interpolation.
- `common.cta.submit` — form submit CTA.

### Confirmations
- `common.confirmations.delete` — destructive action confirmation.
- `common.confirmations.discardChanges` — discard draft/unsaved changes confirmation.

## Flow alignment notes

### Auth
- Reuse `common.errors.*` for cross-screen validation/server errors.
- Reuse `common.loading` for pending states.

### Editor
- Reuse `common.save` and `common.undo` where semantics overlap with global actions.

### Billing/Limits
- Use `common.cta.upgradeToTier` for all upgrade CTA variants.

### CRM
- Use `common.cancel` and `common.loading` in dialogs/forms.
