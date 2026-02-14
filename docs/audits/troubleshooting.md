# Troubleshooting Guide

## Common Issues

### TypeScript Errors

#### "Unexpected any" (no-explicit-any)

**Problem:** Using `any` type in TypeScript code.

**Solution:** Replace with proper types:
```typescript
// ❌ Bad
const data: any = await fetchData();

// ✅ Good
interface DataResponse { id: string; name: string; }
const data: DataResponse = await fetchData();
```

#### Block Type Narrowing

When working with blocks, use type narrowing:
```typescript
// ❌ Bad - using "as any"
if (block.type === 'event') {
  const event = block as any;
}

// ✅ Good - proper type guard
if (block.type === 'event') {
  const event = block as EventBlock;
  console.log(event.eventId);
}
```

### React Hooks Errors

#### "useCallback called conditionally"

**Problem:** Hooks must be called in the same order on every render.

**Solution:** Move conditions inside the callback:
```typescript
// ❌ Bad
if (condition) {
  useCallback(() => { /* ... */ }, []);
}

// ✅ Good
const handler = useCallback(() => {
  if (condition) { /* ... */ }
}, [condition]);
```

### Supabase Errors

#### 404 on REST endpoints

**Problem:** Table doesn't exist or RLS blocks access.

**Solution:**
1. Verify table exists in database
2. Check RLS policies allow the operation
3. Ensure user is authenticated for protected tables

#### blocks_type_check constraint violation (23514)

**Problem:** Block type not in allowed list.

**Solution:** Add new block type to the constraint:
```sql
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check CHECK (
  type = ANY (ARRAY[
    'profile', 'link', 'button', 'socials', 'text', 'image',
    'product', 'video', 'carousel', 'search', 'custom_code',
    'messenger', 'form', 'download', 'newsletter', 'testimonial',
    'scratch', 'map', 'avatar', 'separator', 'catalog',
    'before_after', 'faq', 'countdown', 'pricing', 'shoutout',
    'booking', 'community', 'event'
  ])
);
```

#### Event sync 404/400 errors

**Problem:** Event blocks not syncing to events table.

**Solution:**
1. Ensure page is saved first (to get pageId)
2. Check events table has matching RLS policies
3. Verify eventId is generated (UUID format)

### Fast Refresh Warnings

#### "Fast refresh only works when a file only exports components"

**Problem:** Exporting constants/utils from component files.

**Solution:** Move non-component exports to separate files:
```typescript
// src/components/MyComponent.tsx
// ❌ Bad - mixing exports
export const SOME_CONSTANT = 'value';
export const MyComponent = () => { /* ... */ };

// ✅ Good - separate files
// src/lib/constants.ts
export const SOME_CONSTANT = 'value';

// src/components/MyComponent.tsx
import { SOME_CONSTANT } from '@/lib/constants';
export const MyComponent = () => { /* ... */ };
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linting
npm run lint

# Run TypeScript check
npx tsc --noEmit

# Run unit tests
npm test

# Run E2E tests
npm run e2e

# Build for production
npm run build

# Check i18n coverage
npm run i18n:check
```

## Database Migrations

All database changes must be done via migrations in `supabase/migrations/`.

```bash
# Create a new migration (via Lovable Cloud UI)
# Migrations are applied automatically on Cloud

# To check current schema
# Use the Supabase dashboard or query information_schema
```

## Environment Variables

Required for local development:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

These are auto-configured in Lovable Cloud projects.
