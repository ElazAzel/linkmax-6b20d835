# ADR 0007: Autosave State Machine

## Status

Accepted

## Context

The previous autosave implementation in `useCloudPageState.ts` relied on fragmented state flags and simple debouncing. This led to potential race conditions where older data could overwrite newer state, and the UI feedback was sometimes inconsistent (e.g., showing "Saved" while a save was still in progress or failed).

## Decision

We refactored the autosave logic to use an explicit state machine with versioned requests.

### Key Components

1. **Request Versioning**: Every save request increments a global version counter. Stale requests (where a newer request has been initiated) are aborted immediately.
2. **Explicit Statuses**: We utilize `'idle' | 'pending' | 'saving' | 'saved' | 'error'` to provide clear UI feedback through the `AutoSaveIndicator`.
3. **Standardized Error Handling**: Errors are passed through `normalizeAppError` to ensure safe, localized messages for the user.
4. **Implicit Publication**: Auto-save is always followed by an auto-publish cycle to ensure the public version stays in sync with the editor.

## Consequences

- **Robustness**: Race conditions are effectively eliminated by version checking after every asynchronous operation.
- **Improved UX**: Users get reliable feedback on their work's persistence.
- **Maintainability**: The centralized logic in `autoSaveAndPublish` is easier to debug and extend.
- **Standardization**: All editor-related errors now follow the same normalization protocol.
