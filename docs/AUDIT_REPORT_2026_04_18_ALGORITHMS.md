# Algorithm Audit Report: Transfers, Page Builder, Chatbot, Telegram

**Date:** 2026-04-18  
**Scope:** финтех-переводы/выплаты, алгоритмы конструктора страниц, алгоритмы чат-бота, Telegram mini-app маршрут/UX.  
**Status:** COMPLETED + immediate remediation

## 1) Transfers / Fintech algorithms

### Reviewed modules
- `src/services/fintech.ts`
- `src/services/__tests__/fintech.test.ts`

### Findings
1. **Missing amount guards** in `recordPendingIncome` and `requestPayout`.
   - Risk: zero/negative/NaN amounts can create invalid accounting events or payout requests.
2. **Net amount precision drift risk** after commission subtraction.
   - Risk: floating-point artifacts in `net_amount`.
3. **Missing payout method validity checks**.
   - Risk: malformed payout requests with empty destination.

### Implemented immediately
- Added strict validation for positive finite amount in both `recordPendingIncome` and `requestPayout`.
- Normalized incoming gross amount to 2 decimals.
- Normalized `net_amount` to 2 decimals.
- Added payout method validation (`type` and `value` required).
- Extended unit tests for the new guards.

## 2) Page builder algorithms

### Reviewed modules
- `src/lib/editor/autosave-batcher.ts`

### Findings
1. **`beforeunload` flush race/noise risk**:
   - Existing timer could still be armed during sync flush path.
2. **Unhandled async rejection** in fire-and-forget sync path.
   - Risk: noisy runtime unhandled promise rejection in edge cases.

### Implemented immediately
- Clear timer inside `flushSync` before fire-and-forget flush.
- Added `.catch(...)` logging to fire-and-forget flush call.

## 3) Chatbot matching algorithm

### Reviewed modules
- `src/lib/chat/expert-engine.ts`
- `src/lib/chat/__tests__/expert-engine.test.ts` (added)

### Findings
1. **Similarity sanitizer too narrow** (`[a-zа-я0-9]`).
   - Risk: degraded matching for non-latin/non-russian letters (e.g., Kazakh, Uzbek, etc.).
2. **Long user query under-matching** due to pure bigram similarity vs short keyword.
   - Risk: obvious коммерческие intents score too low.

### Implemented immediately
- Replaced sanitizer with Unicode-aware class (`\p{L}\p{N}` with `u` flag).
- Added direct inclusion boost when a keyword is explicitly contained in user query.
- Added defensive score fallback for empty keyword arrays.
- Added tests for:
  - long natural pricing query;
  - multilingual query with unicode letters.

## 4) Telegram mini-app flow audit

### Reviewed modules
- `src/telegram/TelegramRouter.tsx`

### Findings (current state)
- Route graph and bottom nav transitions are structurally clean.
- Main risk area remains data freshness and dependency on `zone` loading state (already gated by loading screen).
- No blocking algorithmic defects found in this module during current pass.

## Result
Audit completed for requested domains, with **immediate fixes already merged in code** for the highest-impact algorithmic risks (fintech + page-builder autosave + chatbot matching).
